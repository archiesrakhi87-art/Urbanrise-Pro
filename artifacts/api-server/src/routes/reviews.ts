import { Router, type IRouter } from "express";
import { eq, and, lte, gte } from "drizzle-orm";
import { db, reviewsTable, bookingsTable, providersTable, usersTable } from "@workspace/db";
import {
  CreateReviewBody,
  ListReviewsForProviderParams,
} from "@workspace/api-zod";
import { logEvent } from "../lib/events";

const router: IRouter = Router();

// POST /reviews
router.post("/reviews", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { bookingId, rating, comment } = parsed.data;

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
  if (!booking || booking.residentId !== userId) {
    res.status(403).json({ error: "Cannot review this booking" });
    return;
  }
  if (booking.status !== "completed") {
    res.status(400).json({ error: "Booking must be completed to review" });
    return;
  }

  const [review] = await db.insert(reviewsTable).values({ bookingId, rating, comment: comment ?? null }).returning();

  // Update provider rating average
  const providerBookings = await db.select().from(bookingsTable).where(eq(bookingsTable.providerId, booking.providerId));
  const bookingIds = providerBookings.map((b) => b.id);

  if (bookingIds.length > 0) {
    const allReviews = await db.select().from(reviewsTable);
    const relevant = allReviews.filter((r) => bookingIds.includes(r.bookingId));
    if (relevant.length > 0) {
      const avg = relevant.reduce((sum, r) => sum + r.rating, 0) / relevant.length;
      await db.update(providersTable).set({ ratingAvg: avg }).where(eq(providersTable.id, booking.providerId));
    }
  }

  logEvent("review.submitted", {
    reviewId: review.id,
    bookingId,
    residentId: userId,
    providerId: booking.providerId,
    rating,
  });

  // Check for low-rating flagging: 2+ reviews ≤2 stars in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const allReviews = await db.select().from(reviewsTable).where(
    and(lte(reviewsTable.rating, 2), gte(reviewsTable.createdAt, sevenDaysAgo))
  );
  const relevantLow = allReviews.filter((r) => bookingIds.includes(r.bookingId));
  if (relevantLow.length >= 2) {
    await db.update(providersTable).set({ flagged: true }).where(eq(providersTable.id, booking.providerId));
    logEvent("trust.provider_flagged", {
      providerId: booking.providerId,
      lowRatingCount: relevantLow.length,
    });
  }

  const [resident] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  res.status(201).json({
    id: review.id,
    bookingId: review.bookingId,
    rating: review.rating,
    comment: review.comment,
    flagged: review.flagged,
    createdAt: review.createdAt.toISOString(),
    residentName: resident?.name ?? null,
  });
});

// GET /providers/:id/reviews
router.get("/providers/:id/reviews", async (req, res): Promise<void> => {
  const params = ListReviewsForProviderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const providerBookings = await db.select().from(bookingsTable).where(eq(bookingsTable.providerId, params.data.id));
  const bookingIds = providerBookings.map((b) => b.id);

  if (bookingIds.length === 0) {
    res.json([]);
    return;
  }

  const allReviews = await db.select().from(reviewsTable);
  const relevant = allReviews.filter((r) => bookingIds.includes(r.bookingId));

  const enriched = await Promise.all(
    relevant.map(async (review) => {
      const booking = providerBookings.find((b) => b.id === review.bookingId);
      const [resident] = booking
        ? await db.select().from(usersTable).where(eq(usersTable.id, booking.residentId))
        : [null];
      return {
        id: review.id,
        bookingId: review.bookingId,
        rating: review.rating,
        comment: review.comment,
        flagged: review.flagged,
        createdAt: review.createdAt.toISOString(),
        residentName: resident?.name ?? null,
      };
    })
  );

  res.json(enriched);
});

export default router;
