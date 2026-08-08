import express, { type Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import { pool } from "@workspace/db";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const PgStore = connectPgSimple(session);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Allow the Replit dev domain and any explicitly configured ALLOWED_ORIGINS.
// Falls back to a safe empty list in production unless configured.
const rawAllowedOrigins = process.env["ALLOWED_ORIGINS"] ?? "";
const configuredOrigins = rawAllowedOrigins
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// In development, also accept the Replit dev domain automatically.
// REPLIT_DOMAINS is a comma-separated list of all domains (dev + production).
const replitDevDomain = process.env["REPLIT_DEV_DOMAIN"];
const replitDomains = (process.env["REPLIT_DOMAINS"] ?? "")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean)
  .map((d) => `https://${d}`);
const allowedOrigins = new Set([
  ...configuredOrigins,
  ...(replitDevDomain ? [`https://${replitDevDomain}`] : []),
  ...replitDomains,
]);

// Helper: is the origin a Replit-managed domain (*.replit.dev or *.replit.app)?
// These are controlled by Replit, so it's safe to allow them for this app.
function isReplitOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith(".replit.dev") || hostname.endsWith(".replit.app");
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server (no origin), listed origins, and any Replit domain.
      if (!origin || allowedOrigins.has(origin) || isReplitOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env["SESSION_SECRET"];
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}

app.use(
  session({
    store: new PgStore({
      pool,
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "lax",
    },
  }),
);

app.use("/api", router);

export default app;
