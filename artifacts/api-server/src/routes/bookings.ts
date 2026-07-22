import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, bookingsTable, providersTable, usersTable, serviceCategoriesTable, reviewsTable } from "@workspace/db";
import {
  ListBookingsQueryParams,
  CreateBookingBody,
  GetBookingParams,
  UpdateBookingStatusParams,
  UpdateBookingStatusBody,
} from "@workspace/api-zod";
import { logEvent } from "../lib/events";

const router: IRouter = Router();

async function formatBooking(booking: typeof bookingsTable.$inferSelect) {
  const [provider] = await db.select().from(providersTable).where(eq(providersTable.id, booking.providerId));
  const [providerUser] = provider
    ? await db.select().from(usersTable).where(eq(usersTable.id, provider.userId))
    : [null];
  const [resident] = await db.select().from(usersTable).where(eq(usersTable.id, booking.residentId));
  const [category] = await db.select().from(serviceCategoriesTable).where(eq(serviceCategoriesTable.id, booking.serviceCategoryId));
  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.bookingId, booking.id));

  return {
    id: booking.id,
    residentId: booking.residentId,
    providerId: booking.providerId,
    serviceCategoryId: booking.serviceCategoryId,
    scheduledTime: booking.scheduledTime,
    status: booking.status,
    price: booking.price,
    address: booking.address,
    createdAt: booking.createdAt.toISOString(),
    providerName: providerUser?.name ?? null,
    residentName: resident?.name ?? null,
    serviceName: category?.name ?? null,
    hasReview: !!review,
  };
}

// GET /bookings
router.get("/bookings", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const params = ListBookingsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { status } = params.data;
  const userRole = req.session.role;

  let allBookings: typeof bookingsTable.$inferSelect[];
  if (userRole === "provider") {
    const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, userId));
    if (!provider) {
      res.json([]);
      return;
    }
    allBookings = await db.select().from(bookingsTable).where(eq(bookingsTable.providerId, provider.id));
  } else {
    allBookings = await db.select().from(bookingsTable).where(eq(bookingsTable.residentId, userId));
  }

  const filtered = status ? allBookings.filter((b) => b.status === status) : allBookings;
  const formatted = await Promise.all(filtered.map(formatBooking));
  res.json(formatted);
});

// POST /bookings
router.post("/bookings", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [booking] = await db
    .insert(bookingsTable)
    .values({ ...parsed.data, residentId: userId, status: "requested" })
    .returning();

  logEvent("booking.created", {
    bookingId: booking.id,
    residentId: userId,
    providerId: booking.providerId,
    serviceCategoryId: booking.serviceCategoryId,
  });

  res.status(201).json(await formatBooking(booking));
});

// GET /bookings/:id
router.get("/bookings/:id", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  // Ownership check: resident who made it, OR the provider assigned to it, OR admin
  const userRole = req.session.role;
  if (userRole === "resident") {
    if (booking.residentId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  } else if (userRole === "provider") {
    const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, userId));
    if (!provider || provider.id !== booking.providerId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }
  // admin can see any booking

  res.json(await formatBooking(booking));
});

// Valid status transitions per role
const RESIDENT_TRANSITIONS: Record<string, string[]> = {
  requested: ["cancelled"],
  confirmed: ["cancelled"],
};
const PROVIDER_TRANSITIONS: Record<string, string[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
};

// PATCH /bookings/:id/status
router.patch("/bookings/:id/status", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const params = UpdateBookingStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateBookingStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  // Fetch existing booking first to check ownership + valid transition
  const [existing] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const userRole = req.session.role;
  if (userRole === "resident") {
    if (existing.residentId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const allowed = RESIDENT_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(body.data.status)) {
      res.status(400).json({ error: `Residents cannot transition ${existing.status} → ${body.data.status}` });
      return;
    }
  } else if (userRole === "provider") {
    const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, userId));
    if (!provider || provider.id !== existing.providerId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const allowed = PROVIDER_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(body.data.status)) {
      res.status(400).json({ error: `Providers cannot transition ${existing.status} → ${body.data.status}` });
      return;
    }
  }
  // admin can make any transition

  const [booking] = await db
    .update(bookingsTable)
    .set({ status: body.data.status })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (body.data.status === "completed") {
    const [provider] = await db.select().from(providersTable).where(eq(providersTable.id, booking.providerId));
    if (provider) {
      await db
        .update(providersTable)
        .set({ totalJobs: provider.totalJobs + 1 })
        .where(eq(providersTable.id, booking.providerId));
    }
  }

  // Fire lifecycle event for every status transition
  const eventName =
    body.data.status === "confirmed"   ? "booking.confirmed"  :
    body.data.status === "completed"   ? "booking.completed"  :
    body.data.status === "cancelled"   ? "booking.cancelled"  :
    body.data.status === "disputed"    ? "booking.disputed"   :
    "booking.status_changed";

  logEvent(eventName, {
    bookingId: booking.id,
    residentId: booking.residentId,
    providerId: booking.providerId,
    fromStatus: existing.status,
    toStatus: body.data.status,
    changedByRole: userRole ?? "unknown",
  });

  res.json(await formatBooking(booking));
});

export default router;
