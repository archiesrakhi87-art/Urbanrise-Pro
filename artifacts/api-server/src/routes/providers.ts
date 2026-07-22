import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
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

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): number | null {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return userId;
}

function requireRole(req: Request, res: Response, role: string): boolean {
  if (req.session.role !== role) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

async function buildProviderDetail(provider: typeof providersTable.$inferSelect, user: typeof usersTable.$inferSelect) {
  return {
    id: provider.id,
    userId: provider.userId,
    name: user.name,
    phone: user.phone,
    city: user.city,
    bio: provider.bio,
    photoUrl: provider.photoUrl,
    idDocUrl: provider.idDocUrl,
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
  const { serviceCategory, city, badge, limit = 20, offset = 0 } = params.data;

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
  if (badge) {
    filtered = filtered.filter(({ provider }) => provider.badgeTags.includes(badge));
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
  res.json(await buildProviderDetail(provider, user));
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

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  res.json(await buildProviderDetail(provider, user));
});

// POST /providers/me/upload (stub)
router.post("/providers/me/upload", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const docType = (req.body as Record<string, string>)["docType"] ?? "id_doc";
  const stubUrl = `/uploads/${userId}/${docType}-${Date.now()}.jpg`;

  const urlField = docType === "photo" ? "photoUrl" : "idDocUrl";
  await db.update(providersTable).set({ [urlField]: stubUrl }).where(eq(providersTable.userId, userId));

  res.json({ url: stubUrl, docType });
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
  res.json(await buildProviderDetail(provider, user));
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

  res.json(await Promise.all(results.map(({ provider, user }) => buildProviderDetail(provider, user))));
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

  res.json(await Promise.all(results.map(({ provider, user }) => buildProviderDetail(provider, user))));
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
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, provider.userId));
  res.json(await buildProviderDetail(provider, user));
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

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, provider.userId));
  res.json(await buildProviderDetail(provider, user));
});

export default router;
