import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import providersRouter from "./providers";
import bookingsRouter from "./bookings";
import reviewsRouter from "./reviews";
import disputesRouter from "./disputes";
import upskillingRouter from "./upskilling";
import localPartnersRouter from "./local-partners";
import engagementRouter from "./engagement";
import adminMetricsRouter from "./admin-metrics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(providersRouter);
router.use(bookingsRouter);
router.use(reviewsRouter);
router.use(disputesRouter);
router.use(upskillingRouter);
router.use(localPartnersRouter);
router.use(engagementRouter);
router.use(adminMetricsRouter);

export default router;
