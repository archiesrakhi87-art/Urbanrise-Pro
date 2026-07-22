import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, localPartnersTable } from "@workspace/db";
import {
  ListLocalPartnersQueryParams,
  CreateLocalPartnerBody,
  UpdateLocalPartnerParams,
  UpdateLocalPartnerBody,
  DeleteLocalPartnerParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /local-partners
router.get("/local-partners", async (req, res): Promise<void> => {
  const params = ListLocalPartnersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let partners = await db.select().from(localPartnersTable);
  if (params.data.region) {
    partners = partners.filter((p) => p.region.toLowerCase().includes(params.data.region!.toLowerCase()));
  }

  res.json(partners);
});

// POST /local-partners (admin)
router.post("/local-partners", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = CreateLocalPartnerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [partner] = await db.insert(localPartnersTable).values(parsed.data).returning();
  res.status(201).json(partner);
});

// PATCH /local-partners/:id (admin)
router.patch("/local-partners/:id", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const params = UpdateLocalPartnerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateLocalPartnerBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const update: Partial<typeof localPartnersTable.$inferInsert> = {};
  if (body.data.name) update.name = body.data.name;
  if (body.data.type) update.type = body.data.type;
  if (body.data.region) update.region = body.data.region;
  if (body.data.contactInfo !== undefined) update.contactInfo = body.data.contactInfo;

  const [partner] = await db.update(localPartnersTable).set(update).where(eq(localPartnersTable.id, params.data.id)).returning();
  if (!partner) {
    res.status(404).json({ error: "Partner not found" });
    return;
  }

  res.json(partner);
});

// DELETE /local-partners/:id (admin)
router.delete("/local-partners/:id", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const params = DeleteLocalPartnerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(localPartnersTable).where(eq(localPartnersTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
