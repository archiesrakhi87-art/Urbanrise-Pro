import { Router, type IRouter } from "express";
import { gte } from "drizzle-orm";
import { db, bookingsTable, usersTable, providersTable, disputesTable, reviewsTable } from "@workspace/db";

const router: IRouter = Router();

// GET /admin/metrics
router.get("/admin/metrics", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const allBookings = await db.select().from(bookingsTable);
  const allUsers = await db.select().from(usersTable);
  const allProviders = await db.select().from(providersTable);
  const allDisputes = await db.select().from(disputesTable);
  const allReviews = await db.select().from(reviewsTable);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const thisMonthBookings = allBookings.filter((b) => b.createdAt >= startOfMonth);
  const thisMonthReviews = allReviews.filter((r) => r.createdAt >= startOfMonth);

  const bookingsByStatus: Record<string, number> = {};
  for (const b of allBookings) {
    bookingsByStatus[b.status] = (bookingsByStatus[b.status] ?? 0) + 1;
  }

  const activeProviders = allProviders.filter((p) => p.kycStatus === "verified").length;

  const residentIdsWithBookings = new Set(allBookings.map((b) => b.residentId));
  const activeResidents = allUsers.filter((u) => u.role === "resident" && residentIdsWithBookings.has(u.id)).length;

  const bookingCountsByResident: Record<number, number> = {};
  for (const b of allBookings) {
    bookingCountsByResident[b.residentId] = (bookingCountsByResident[b.residentId] ?? 0) + 1;
  }
  const repeatResidents = Object.values(bookingCountsByResident).filter((count) => count >= 2).length;
  const totalResidentsWithBookings = Object.keys(bookingCountsByResident).length;
  const repeatBookingRate = totalResidentsWithBookings > 0 ? repeatResidents / totalResidentsWithBookings : 0;

  const openDisputes = allDisputes.filter((d) => d.status !== "resolved").length;

  res.json({
    totalBookings: allBookings.length,
    bookingsByStatus,
    activeProviders,
    activeResidents,
    repeatBookingRate,
    bookingsThisMonth: thisMonthBookings.length,
    reviewsThisMonth: thisMonthReviews.length,
    openDisputes,
  });
});

// GET /admin/metrics/onboarding-funnel
router.get("/admin/metrics/onboarding-funnel", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const allProviders = await db.select().from(providersTable);

  const stepLabels = [
    "Phone/OTP",
    "Language",
    "Basic Profile",
    "Service Categories",
    "ID Upload",
    "KYC",
    "Policy Accepted",
    "Submitted",
  ];

  const funnel = stepLabels.map((label, index) => ({
    step: index,
    label,
    count: allProviders.filter((p) => p.onboardingStep >= index).length,
  }));

  res.json(funnel);
});

export default router;
