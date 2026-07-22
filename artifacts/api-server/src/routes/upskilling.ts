import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, upskillingModulesTable, providerProgressTable, providersTable } from "@workspace/db";
import {
  ListUpskillingModulesQueryParams,
  GetUpskillingModuleParams,
  CompleteUpskillingModuleParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /upskilling/modules
router.get("/upskilling/modules", async (req, res): Promise<void> => {
  const userId = req.session.userId;

  const params = ListUpskillingModulesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let modules = await db.select().from(upskillingModulesTable);
  if (params.data.category) {
    modules = modules.filter((m) => m.category === params.data.category);
  }

  let completedIds: number[] = [];
  if (userId) {
    const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, userId));
    if (provider) {
      const progress = await db.select().from(providerProgressTable).where(
        and(eq(providerProgressTable.providerId, provider.id), eq(providerProgressTable.completed, true))
      );
      completedIds = progress.map((p) => p.moduleId);
    }
  }

  res.json(modules.map((m) => ({ ...m, completed: completedIds.includes(m.id) })));
});

// GET /upskilling/modules/:id
router.get("/upskilling/modules/:id", async (req, res): Promise<void> => {
  const userId = req.session.userId;

  const params = GetUpskillingModuleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [module] = await db.select().from(upskillingModulesTable).where(eq(upskillingModulesTable.id, params.data.id));
  if (!module) {
    res.status(404).json({ error: "Module not found" });
    return;
  }

  let completed = false;
  if (userId) {
    const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, userId));
    if (provider) {
      const [progress] = await db.select().from(providerProgressTable).where(
        and(eq(providerProgressTable.providerId, provider.id), eq(providerProgressTable.moduleId, params.data.id))
      );
      completed = progress?.completed ?? false;
    }
  }

  res.json({ ...module, completed });
});

// POST /upskilling/modules/:id/complete
router.post("/upskilling/modules/:id/complete", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const params = CompleteUpskillingModuleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, userId));
  if (!provider) {
    res.status(403).json({ error: "Not a provider" });
    return;
  }

  const allCompleted = await db.select().from(providerProgressTable).where(
    and(eq(providerProgressTable.providerId, provider.id), eq(providerProgressTable.completed, true))
  );
  const isNewMilestone = allCompleted.length + 1 >= 5;
  const badgeUnlocked = isNewMilestone;

  const [existing] = await db.select().from(providerProgressTable).where(
    and(eq(providerProgressTable.providerId, provider.id), eq(providerProgressTable.moduleId, params.data.id))
  );

  if (existing) {
    await db.update(providerProgressTable)
      .set({ completed: true, completedAt: new Date(), badgeUnlocked })
      .where(eq(providerProgressTable.id, existing.id));
  } else {
    await db.insert(providerProgressTable).values({
      providerId: provider.id,
      moduleId: params.data.id,
      completed: true,
      completedAt: new Date(),
      badgeUnlocked,
    });
  }

  res.json({ moduleId: params.data.id, completed: true, badgeUnlocked });
});

// GET /upskilling/progress
router.get("/upskilling/progress", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, userId));
  if (!provider) {
    res.status(403).json({ error: "Not a provider" });
    return;
  }

  const totalModules = await db.select().from(upskillingModulesTable);
  const completed = await db.select().from(providerProgressTable).where(
    and(eq(providerProgressTable.providerId, provider.id), eq(providerProgressTable.completed, true))
  );
  const badgesUnlocked = completed.filter((p) => p.badgeUnlocked).length;
  const progressPercent = totalModules.length > 0 ? (completed.length / totalModules.length) * 100 : 0;

  res.json({
    totalModules: totalModules.length,
    completedModules: completed.length,
    badgesUnlocked,
    progressPercent,
  });
});

export default router;
