import app from "./app";
import { seed } from "./lib/seed";
import { logger } from "./lib/logger";

// Run seed on cold start — idempotent, skips if data already present.
seed().catch((err) => {
  logger.error({ err }, "Seed failed on Vercel cold start");
});

export default app;
