import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, disputesTable, usersTable, bookingsTable, providersTable } from "@workspace/db";
import {
  CreateDisputeBody,
  GetDisputeParams,
  ListAdminDisputesQueryParams,
  UpdateDisputeParams,
  UpdateDisputeBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatDispute(dispute: typeof disputesTable.$inferSelect) {
  const [raised] = await db.select().from(usersTable).where(eq(usersTable.id, dispute.raisedBy));
  return {
    id: dispute.id,
    bookingId: dispute.bookingId,
    raisedBy: dispute.raisedBy,
    status: dispute.status,
    slaDeadline: dispute.slaDeadline.toISOString(),
    resolutionNotes: dispute.resolutionNotes,
    createdAt: dispute.createdAt.toISOString(),
    issueType: dispute.issueType,
    description: dispute.description,
    raisedByName: raised?.name ?? null,
  };
}

// POST /disputes
router.post("/disputes", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = CreateDisputeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Fetch the booking to verify participant ownership
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, parsed.data.bookingId));
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const userRole = req.session.role;
  if (userRole !== "admin") {
    let isParticipant = booking.residentId === userId;
    if (!isParticipant && userRole === "provider") {
      const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, userId));
      if (provider && provider.id === booking.providerId) isParticipant = true;
    }
    if (!isParticipant) {
      res.status(403).json({ error: "Only participants of this booking can raise a dispute" });
      return;
    }
  }

  const slaDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const [dispute] = await db
    .insert(disputesTable)
    .values({
      bookingId: parsed.data.bookingId,
      raisedBy: userId,
      issueType: parsed.data.issueType,
      description: parsed.data.description,
      status: "open",
      slaDeadline,
    })
    .returning();

  res.status(201).json(await formatDispute(dispute));
});

// GET /disputes/:id
router.get("/disputes/:id", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const params = GetDisputeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [dispute] = await db.select().from(disputesTable).where(eq(disputesTable.id, params.data.id));
  if (!dispute) {
    res.status(404).json({ error: "Dispute not found" });
    return;
  }

  // Ownership check: the user who raised it, OR a participant in the booking, OR admin
  const userRole = req.session.role;
  if (userRole !== "admin" && dispute.raisedBy !== userId) {
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, dispute.bookingId));
    let isParticipant = false;
    if (booking) {
      if (booking.residentId === userId) {
        isParticipant = true;
      } else {
        const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, userId));
        if (provider && provider.id === booking.providerId) isParticipant = true;
      }
    }
    if (!isParticipant) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }

  res.json(await formatDispute(dispute));
});

// GET /admin/disputes
router.get("/admin/disputes", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const params = ListAdminDisputesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let disputes = await db.select().from(disputesTable).orderBy(disputesTable.createdAt);
  if (params.data.status) {
    disputes = disputes.filter((d) => d.status === params.data.status);
  }

  res.json(await Promise.all(disputes.map(formatDispute)));
});

// PATCH /admin/disputes/:id
router.patch("/admin/disputes/:id", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const params = UpdateDisputeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateDisputeBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const update: Partial<typeof disputesTable.$inferInsert> = {};
  if (body.data.status) update.status = body.data.status;
  if (body.data.resolutionNotes) update.resolutionNotes = body.data.resolutionNotes;

  const [dispute] = await db.update(disputesTable).set(update).where(eq(disputesTable.id, params.data.id)).returning();
  if (!dispute) {
    res.status(404).json({ error: "Dispute not found" });
    return;
  }

  res.json(await formatDispute(dispute));
});

export default router;
