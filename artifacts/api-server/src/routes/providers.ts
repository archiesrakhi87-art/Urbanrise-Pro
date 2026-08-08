import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import { db, providersTable, usersTable, serviceCategoriesTable } from "@workspace/db";
import {
  ListProvidersQueryParams,
  GetProviderParams,
  SaveOnboardingStepBody,
  UpdateProviderProfileBody,
  VerifyProviderParams,
  VerifyProviderBody,
  AssignBadgeParams,
  AssignBadgeBody,
} from "@workspace/api-zod";
import { logEvent } from "../lib/events";

// Configure multer disk storage.
// On Vercel the deployed function bundle (process.cwd()) is read-only —
// only os.tmpdir() ("/tmp") is writable, so default there when running on Vercel.
const uploadsDir =
  process.env["UPLOADS_DIR"] ??
  (process.env["VERCEL"] ? path.join(os.tmpdir(), "uploads") : path.join(process.cwd(), "uploads"));
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): number | null {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return userId;
}

// Express middleware version of requireAuth — runs BEFORE body parsers (e.g. multer)
// so unauthenticated requests are rejected before any disk I/O happens.
function requireAuthMiddleware(req: Request, res: Response, next: () => void): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

function requireRole(req: Request, res: Response, role: string): boolean {
  if (req.session.role !== role) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

// Base detail shared by owner + admin routes — includes sensitive doc URLs.
async function buildProviderDetail(
  provider: typeof providersTable.$inferSelect,
  user: typeof usersTable.$inferSelect,
  opts: { includeDocUrls?: boolean } = {},
) {
  return {
    id: provider.id,
    userId: provider.userId,
    name: user.name,
    phone: user.phone,
    city: user.city,
    bio: provider.bio,
    // photoUrl is a selfie — shown on public profile cards; idDocUrl is KYC-sensitive
    photoUrl: provider.photoUrl,
    // idDocUrl only included for the owning provider or admin (default: excluded)
    ...(opts.includeDocUrls ? { idDocUrl: provider.idDocUrl } : {}),
    kycStatus: provider.kycStatus,
    kycNotes: provider.kycNotes,
    badgeTags: provider.badgeTags,
    ratingAvg: provider.ratingAvg,
    totalJobs: provider.totalJobs,
    serviceCategories: provider.serviceCategories,
    priceList: provider.priceList,
    languagesSpoken: provider.languagesSpoken,
    onboardingStep: provider.onboardingStep,
    flagged: provider.flagged,
    createdAt: provider.createdAt.toISOString(),
  };
}

// GET /providers — list verified providers with filters
router.get("/providers", async (req, res): Promise<void> => {
  const params = ListProvidersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { serviceCategory, city, language, badge, minPrice, maxPrice, limit = 20, offset = 0 } = params.data;

  const allProviders = await db
    .select({ provider: providersTable, user: usersTable })
    .from(providersTable)
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .where(eq(providersTable.kycStatus, "verified"));

  let filtered = allProviders;

  if (serviceCategory) {
    filtered = filtered.filter(({ provider }) =>
      provider.serviceCategories.some((c) => c.toLowerCase().includes(serviceCategory.toLowerCase()))
    );
  }
  if (city) {
    filtered = filtered.filter(({ user }) => user.city?.toLowerCase().includes(city.toLowerCase()));
  }
  if (language) {
    filtered = filtered.filter(({ provider }) =>
      provider.languagesSpoken.some((l) => l.toLowerCase().includes(language.toLowerCase()))
    );
  }
  if (badge) {
    filtered = filtered.filter(({ provider }) => provider.badgeTags.includes(badge));
  }
  if (minPrice != null || maxPrice != null) {
    // priceList is stored as a JSON text string; parse it and extract all numeric values.
    // Format expected: { "ServiceName": 500, ... } or { "ServiceName": "500", ... }
    // If parsing fails or no numeric values found, include the provider (safe default).
    filtered = filtered.filter(({ provider }) => {
      if (!provider.priceList) return true; // no price set → include by default
      let parsed: unknown;
      try {
        parsed = JSON.parse(provider.priceList);
      } catch {
        return true; // malformed JSON → include by default
      }
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return true;
      const values = Object.values(parsed as Record<string, unknown>)
        .map((v) => (typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN))
        .filter((n) => Number.isFinite(n));
      if (values.length === 0) return true; // no extractable prices → include by default
      const lowestPrice = Math.min(...values);
      if (minPrice != null && lowestPrice < minPrice) return false;
      if (maxPrice != null && lowestPrice > maxPrice) return false;
      return true;
    });
  }

  const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));

  res.json(
    paginated.map(({ provider, user }) => ({
      id: provider.id,
      userId: provider.userId,
      name: user.name,
      city: user.city,
      photoUrl: provider.photoUrl,
      kycStatus: provider.kycStatus,
      ratingAvg: provider.ratingAvg,
      totalJobs: provider.totalJobs,
      badgeTags: provider.badgeTags,
      serviceCategories: provider.serviceCategories,
      languagesSpoken: provider.languagesSpoken,
    }))
  );
});

// GET /service-categories
router.get("/service-categories", async (_req, res): Promise<void> => {
  const cats = await db.select().from(serviceCategoriesTable);
  res.json(cats);
});

// GET /providers/me
router.get("/providers/me", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, userId));
  if (!provider) {
    res.status(404).json({ error: "Not a provider" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  res.json(await buildProviderDetail(provider, user, { includeDocUrls: true }));
});

// POST /providers/me/onboarding
router.post("/providers/me/onboarding", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = SaveOnboardingStepBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { step, name, city, bio, languagePref, serviceCategories, priceList, policyAccepted, digitalSignature } = parsed.data;

  if (name || city || languagePref) {
    await db.update(usersTable).set({ name: name ?? undefined, city: city ?? undefined, languagePref: languagePref ?? undefined }).where(eq(usersTable.id, userId));
  }

  const [existing] = await db.select().from(providersTable).where(eq(providersTable.userId, userId));

  const providerUpdate: Partial<typeof providersTable.$inferInsert> = {
    onboardingStep: Math.max(existing?.onboardingStep ?? 0, step),
  };
  if (bio != null) providerUpdate.bio = bio;
  if (serviceCategories) providerUpdate.serviceCategories = serviceCategories;
  if (priceList != null) providerUpdate.priceList = priceList;
  if (policyAccepted != null) providerUpdate.policyAccepted = policyAccepted;
  if (digitalSignature != null) providerUpdate.digitalSignature = digitalSignature;
  if (step >= 6 && policyAccepted) providerUpdate.kycStatus = "submitted";

  let provider: typeof providersTable.$inferSelect;
  if (existing) {
    [provider] = await db.update(providersTable).set(providerUpdate).where(eq(providersTable.userId, userId)).returning();
  } else {
    [provider] = await db.insert(providersTable).values({ userId, ...providerUpdate }).returning();
  }

  // Structured event logging per step
  if (step >= 6 && policyAccepted) {
    logEvent("onboarding.submitted", { userId, providerId: provider.id, step });
  } else {
    logEvent("onboarding.step_completed", { userId, providerId: provider.id, step });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  res.json(await buildProviderDetail(provider, user, { includeDocUrls: true }));
});

// POST /providers/me/upload — multipart file upload (multer)
// requireAuthMiddleware runs BEFORE multer so unauthenticated callers are rejected
// before any disk I/O happens, preventing storage-abuse / DoS.
router.post("/providers/me/upload", requireAuthMiddleware, upload.single("file"), async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  if (!req.file) {
    res.status(400).json({ error: "No file received" });
    return;
  }

  const docType = (req.body as Record<string, string>)["docType"] ?? "id_doc";
  // Serve files through the authenticated /api/documents/ endpoint — not publicly
  const fileUrl = `/api/documents/${req.file.filename}`;

  // Map docType to the correct column
  const urlField =
    docType === "photo" || docType === "kyc_selfie"
      ? "photoUrl"
      : "idDocUrl";

  await db
    .update(providersTable)
    .set({ [urlField]: fileUrl })
    .where(eq(providersTable.userId, userId));

  const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, userId));

  logEvent("provider.document_uploaded", { userId, providerId: provider?.id, docType });

  res.json({ url: fileUrl, docType });
});

// PATCH /providers/me/profile
router.patch("/providers/me/profile", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = UpdateProviderProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, bio, city, priceList, languagesSpoken } = parsed.data;
  if (name || city) {
    await db.update(usersTable).set({ name: name ?? undefined, city: city ?? undefined }).where(eq(usersTable.id, userId));
  }
  const [provider] = await db
    .update(providersTable)
    .set({ bio: bio ?? undefined, priceList: priceList ?? undefined, languagesSpoken: languagesSpoken ?? undefined })
    .where(eq(providersTable.userId, userId))
    .returning();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  res.json(await buildProviderDetail(provider, user, { includeDocUrls: true }));
});

// GET /providers/:id
router.get("/providers/:id", async (req, res): Promise<void> => {
  const params = GetProviderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [provider] = await db.select().from(providersTable).where(eq(providersTable.id, params.data.id));
  if (!provider) {
    res.status(404).json({ error: "Provider not found" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, provider.userId));
  res.json(await buildProviderDetail(provider, user));
});

// ── ADMIN PROVIDER ROUTES ──────────────────────────────────────────────────

router.get("/admin/providers/pending", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  if (!requireRole(req, res, "admin")) return;

  const results = await db
    .select({ provider: providersTable, user: usersTable })
    .from(providersTable)
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .where(eq(providersTable.kycStatus, "submitted"));

  res.json(await Promise.all(results.map(({ provider, user }) => buildProviderDetail(provider, user, { includeDocUrls: true }))));
});

router.get("/admin/providers/flagged", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  if (!requireRole(req, res, "admin")) return;

  const results = await db
    .select({ provider: providersTable, user: usersTable })
    .from(providersTable)
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .where(eq(providersTable.flagged, true));

  res.json(await Promise.all(results.map(({ provider, user }) => buildProviderDetail(provider, user, { includeDocUrls: true }))));
});

router.post("/admin/providers/:id/verify", async (req, res): Promise<void> => {
  const authId = requireAuth(req, res);
  if (!authId) return;
  if (!requireRole(req, res, "admin")) return;

  const params = VerifyProviderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = VerifyProviderBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { action, notes } = body.data;
  const newStatus = action === "approve" ? "verified" : "rejected";
  const newBadges = action === "approve" ? ["new_to_app"] : [];

  const [provider] = await db
    .update(providersTable)
    .set({ kycStatus: newStatus, kycNotes: notes ?? null, badgeTags: newBadges })
    .where(eq(providersTable.id, params.data.id))
    .returning();

  if (!provider) {
    res.status(404).json({ error: "Provider not found" });
    return;
  }

  logEvent(action === "approve" ? "provider.approved" : "provider.rejected", {
    adminId: authId,
    providerId: provider.id,
    notes: notes ?? undefined,
  });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, provider.userId));
  res.json(await buildProviderDetail(provider, user, { includeDocUrls: true }));
});

router.post("/admin/providers/:id/badge", async (req, res): Promise<void> => {
  const authId = requireAuth(req, res);
  if (!authId) return;
  if (!requireRole(req, res, "admin")) return;

  const params = AssignBadgeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = AssignBadgeBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db.select().from(providersTable).where(eq(providersTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Provider not found" });
    return;
  }

  const updatedBadges = Array.from(new Set([...existing.badgeTags, body.data.badge]));
  const [provider] = await db
    .update(providersTable)
    .set({ badgeTags: updatedBadges })
    .where(eq(providersTable.id, params.data.id))
    .returning();

  logEvent("provider.badge_assigned", {
    adminId: authId,
    providerId: provider.id,
    badge: body.data.badge,
  });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, provider.userId));
  res.json(await buildProviderDetail(provider, user, { includeDocUrls: true }));
});

// GET /api/documents/:filename — authenticated document serving
// Admin: access any file. Provider: only their own photoUrl / idDocUrl. Resident: 403.
router.get("/documents/:filename", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const { filename } = req.params as { filename: string };
  if (!filename || filename.includes("..") || filename.includes("/")) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }

  const role = req.session.role;

  if (role !== "admin") {
    const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, userId));
    if (!provider) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const requestedUrl = `/api/documents/${filename}`;
    const ownedUrls = [provider.idDocUrl, provider.photoUrl].filter(Boolean);
    if (!ownedUrls.includes(requestedUrl)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }

  const filePath = path.join(uploadsDir, filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: "File not found" });
    }
  });
});

export default router;
