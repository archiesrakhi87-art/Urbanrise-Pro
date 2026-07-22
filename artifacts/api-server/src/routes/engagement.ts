import { Router, type IRouter } from "express";
import { eq, and, gte } from "drizzle-orm";
import { db, providersTable, usersTable, bookingsTable, providerProgressTable } from "@workspace/db";

const router: IRouter = Router();

// GET /engagement/hall-of-fame
router.get("/engagement/hall-of-fame", async (_req, res): Promise<void> => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const verifiedProviders = await db
    .select({ provider: providersTable, user: usersTable })
    .from(providersTable)
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .where(eq(providersTable.kycStatus, "verified"));

  const topProviders = verifiedProviders
    .sort((a, b) => b.provider.ratingAvg - a.provider.ratingAvg)
    .slice(0, 5)
    .map(({ provider, user }) => ({
      id: provider.id,
      name: user.name ?? "Anonymous",
      photoUrl: provider.photoUrl,
      score: provider.ratingAvg,
      metric: `${provider.totalJobs} jobs completed`,
    }));

  const thisMonthBookings = await db
    .select()
    .from(bookingsTable)
    .where(gte(bookingsTable.createdAt, startOfMonth));

  const residentCounts: Record<number, number> = {};
  for (const booking of thisMonthBookings) {
    residentCounts[booking.residentId] = (residentCounts[booking.residentId] ?? 0) + 1;
  }

  const topResidentIds = Object.entries(residentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => Number(id));

  const topResidents = await Promise.all(
    topResidentIds.map(async (id) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
      return {
        id,
        name: user?.name ?? "Anonymous",
        photoUrl: null,
        score: residentCounts[id] ?? 0,
        metric: `${residentCounts[id]} bookings this month`,
      };
    })
  );

  res.json({ topProviders, topResidents });
});

// GET /engagement/dashboard
router.get("/engagement/dashboard", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, userId));
  if (!provider) {
    res.status(404).json({ error: "Not a provider" });
    return;
  }

  const allBookings = await db.select().from(bookingsTable).where(eq(bookingsTable.providerId, provider.id));
  const pending = allBookings.filter((b) => b.status === "requested").length;
  const completed = allBookings.filter((b) => b.status === "completed").length;
  const totalEarnings = allBookings.filter((b) => b.status === "completed").reduce((sum, b) => sum + b.price, 0);

  const progressRows = await db.select().from(providerProgressTable).where(
    and(eq(providerProgressTable.providerId, provider.id), eq(providerProgressTable.completed, true))
  );

  const recentBookings = allBookings.slice(-5).reverse().map((b) => ({
    id: b.id,
    residentId: b.residentId,
    providerId: b.providerId,
    serviceCategoryId: b.serviceCategoryId,
    scheduledTime: b.scheduledTime,
    status: b.status,
    price: b.price,
    address: b.address,
    createdAt: b.createdAt.toISOString(),
    providerName: null,
    residentName: null,
    serviceName: null,
    hasReview: false,
  }));

  res.json({
    totalEarnings,
    totalJobs: provider.totalJobs,
    pendingBookings: pending,
    completedBookings: completed,
    ratingAvg: provider.ratingAvg,
    badgeTags: provider.badgeTags,
    upskillingProgress: progressRows.length,
    recentBookings,
  });
});

// GET /referrals/me
router.get("/referrals/me", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const allUsers = await db.select().from(usersTable);
  const referralCount = allUsers.filter((u) => u.referredByCode === user.referralCode).length;

  res.json({
    referralCode: user.referralCode ?? "",
    totalReferrals: referralCount,
    points: user.referralPoints,
  });
});

export default router;
