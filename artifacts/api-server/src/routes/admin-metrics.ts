import { Router, type IRouter } from "express";
import { eq, ne, gte, count, countDistinct, sql } from "drizzle-orm";
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

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Run all independent queries in parallel
  const [
    bookingsByStatusRows,
    activeProvidersRows,
    activeResidentsRows,
    repeatRateRows,
    bookingsThisMonthRows,
    reviewsThisMonthRows,
    openDisputesRows,
  ] = await Promise.all([
    // Bookings by status: GROUP BY instead of full table scan
    db
      .select({ status: bookingsTable.status, cnt: count() })
      .from(bookingsTable)
      .groupBy(bookingsTable.status),

    // Active providers: COUNT with WHERE instead of loading all rows
    db
      .select({ cnt: count() })
      .from(providersTable)
      .where(eq(providersTable.kycStatus, "verified")),

    // Active residents: COUNT DISTINCT with JOIN instead of JS filter
    db
      .select({ cnt: countDistinct(bookingsTable.residentId) })
      .from(bookingsTable)
      .innerJoin(usersTable, eq(bookingsTable.residentId, usersTable.id))
      .where(eq(usersTable.role, "resident")),

    // Repeat booking rate: CTE-style subquery, no full table scan in JS
    db.execute(sql`
      WITH booking_counts AS (
        SELECT resident_id, COUNT(*) AS cnt
        FROM bookings
        GROUP BY resident_id
      )
      SELECT
        COUNT(*) FILTER (WHERE cnt >= 2) AS repeat_residents,
        COUNT(*)                          AS total_residents
      FROM booking_counts
    `),

    // Bookings this month: COUNT with WHERE
    db
      .select({ cnt: count() })
      .from(bookingsTable)
      .where(gte(bookingsTable.createdAt, startOfMonth)),

    // Reviews this month: COUNT with WHERE
    db
      .select({ cnt: count() })
      .from(reviewsTable)
      .where(gte(reviewsTable.createdAt, startOfMonth)),

    // Open disputes: COUNT with WHERE
    db
      .select({ cnt: count() })
      .from(disputesTable)
      .where(ne(disputesTable.status, "resolved")),
  ]);

  // Reconstruct bookingsByStatus map from GROUP BY result
  const bookingsByStatus: Record<string, number> = {};
  let totalBookings = 0;
  for (const row of bookingsByStatusRows) {
    bookingsByStatus[row.status] = Number(row.cnt);
    totalBookings += Number(row.cnt);
  }

  const activeProviders = Number(activeProvidersRows[0]?.cnt ?? 0);
  const activeResidents = Number(activeResidentsRows[0]?.cnt ?? 0);

  const repeatRateRow = repeatRateRows.rows[0] as { repeat_residents: string; total_residents: string };
  const repeatResidents = Number(repeatRateRow?.repeat_residents ?? 0);
  const totalResidentsWithBookings = Number(repeatRateRow?.total_residents ?? 0);
  const repeatBookingRate = totalResidentsWithBookings > 0 ? repeatResidents / totalResidentsWithBookings : 0;

  const bookingsThisMonth = Number(bookingsThisMonthRows[0]?.cnt ?? 0);
  const reviewsThisMonth = Number(reviewsThisMonthRows[0]?.cnt ?? 0);
  const openDisputes = Number(openDisputesRows[0]?.cnt ?? 0);

  res.json({
    totalBookings,
    bookingsByStatus,
    activeProviders,
    activeResidents,
    repeatBookingRate,
    bookingsThisMonth,
    reviewsThisMonth,
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

  // GROUP BY onboardingStep instead of loading all provider rows
  const stepCountRows = await db
    .select({ step: providersTable.onboardingStep, cnt: count() })
    .from(providersTable)
    .groupBy(providersTable.onboardingStep);

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

  // Build a map of exact-step counts, then compute cumulative counts (>= step)
  const exactCounts: Record<number, number> = {};
  for (const row of stepCountRows) {
    exactCounts[row.step] = Number(row.cnt);
  }

  // Total providers for cumulative calculation
  const total = Object.values(exactCounts).reduce((sum, n) => sum + n, 0);

  // Cumulative count for step N = number of providers with onboardingStep >= N
  // = total - sum of counts for steps 0..(N-1)
  const funnel = stepLabels.map((label, index) => {
    let belowCount = 0;
    for (let s = 0; s < index; s++) {
      belowCount += exactCounts[s] ?? 0;
    }
    return { step: index, label, count: total - belowCount };
  });

  res.json(funnel);
});

export default router;
