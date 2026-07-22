/**
 * EXPLAIN ANALYZE regression test for key admin metric queries.
 *
 * Runs EXPLAIN (FORMAT JSON) on every query that should hit an index on the
 * `bookings` or `providers` tables, then walks the plan tree to detect any
 * "Seq Scan" nodes on those tables.  Exits 1 if a sequential scan is found so
 * this can be used as a CI gate.
 *
 * Run with: tsx lib/db/src/check-query-plans.ts
 */

import pg from "pg";

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Queries to check – each entry mirrors a real admin-metrics query.
//
// NOTE: We run each query with `enable_seqscan = off` so the planner uses an
// available index whenever one exists.  This is the canonical technique for
// verifying index usability without needing large synthetic datasets.  If the
// index is absent or unsuitable, the planner falls back to a Seq Scan even
// with this setting, which correctly triggers a test failure.
// ---------------------------------------------------------------------------
const QUERIES: Array<{ label: string; sql: string }> = [
  {
    label: "Bookings GROUP BY status (bookings_status_idx)",
    sql: `EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS)
          SELECT status, COUNT(*) AS cnt
          FROM bookings
          GROUP BY status`,
  },
  {
    label: "Providers GROUP BY onboarding_step (providers_onboarding_step_idx)",
    sql: `EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS)
          SELECT onboarding_step, COUNT(*) AS cnt
          FROM providers
          GROUP BY onboarding_step`,
  },
  {
    label: "Active providers WHERE kycStatus = 'verified' (providers_kyc_status_idx)",
    sql: `EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS)
          SELECT COUNT(*) AS cnt
          FROM providers
          WHERE kyc_status = 'verified'`,
  },
  {
    label: "Active residents COUNT DISTINCT with JOIN (bookings_resident_id_idx)",
    sql: `EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS)
          SELECT COUNT(DISTINCT b.resident_id) AS cnt
          FROM bookings b
          INNER JOIN users u ON b.resident_id = u.id
          WHERE u.role = 'resident'`,
  },
];

// Tables we care about – a Seq Scan on any of these is a failure.
const WATCHED_TABLES = new Set(["bookings", "providers"]);

// ---------------------------------------------------------------------------
// Plan walker
// ---------------------------------------------------------------------------
interface PlanNode {
  "Node Type": string;
  "Relation Name"?: string;
  Plans?: PlanNode[];
  [key: string]: unknown;
}

function findSeqScans(node: PlanNode, path: string[] = []): string[] {
  const violations: string[] = [];
  const currentPath = [...path, node["Node Type"]];

  if (
    node["Node Type"] === "Seq Scan" &&
    node["Relation Name"] &&
    WATCHED_TABLES.has(node["Relation Name"])
  ) {
    violations.push(
      `Seq Scan on "${node["Relation Name"]}" (plan path: ${currentPath.join(" → ")})`
    );
  }

  for (const child of node.Plans ?? []) {
    violations.push(...findSeqScans(child, currentPath));
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  let totalFailures = 0;
  const results: Array<{ label: string; passed: boolean; violations: string[] }> = [];

  // Disable sequential scans for this session so the planner must use an index
  // if one exists.  If no suitable index is present the planner still falls
  // back to a Seq Scan, which correctly triggers a test failure.
  await client.query("SET enable_seqscan = off");

  for (const { label, sql } of QUERIES) {
    const res = await client.query<{ "QUERY PLAN": Array<{ Plan: PlanNode }> }>(sql);
    const plan = res.rows[0]["QUERY PLAN"][0].Plan;
    const violations = findSeqScans(plan);

    results.push({ label, passed: violations.length === 0, violations });
    totalFailures += violations.length;
  }

  await client.end();

  // ---------------------------------------------------------------------------
  // Report
  // ---------------------------------------------------------------------------
  console.log("\n=== Query Plan Index Check ===\n");
  for (const { label, passed, violations } of results) {
    const icon = passed ? "✓" : "✗";
    console.log(`  ${icon}  ${label}`);
    for (const v of violations) {
      console.log(`       FAIL: ${v}`);
    }
  }

  if (totalFailures > 0) {
    console.log(
      `\n❌  ${totalFailures} sequential scan(s) detected on indexed tables.` +
        "\n    Ensure the required indexes exist and the query planner can use them.\n"
    );
    process.exit(1);
  } else {
    console.log("\n✅  All queries use index scans. No sequential scans on watched tables.\n");
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
