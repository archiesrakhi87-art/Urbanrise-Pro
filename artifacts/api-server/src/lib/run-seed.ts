import { seed } from "./seed";
import { logger } from "./logger";

seed()
  .then(() => {
    logger.info("Seed complete");
    process.exit(0);
  })
  .catch((err) => {
    logger.error({ err }, "Seed failed");
    process.exit(1);
  });
