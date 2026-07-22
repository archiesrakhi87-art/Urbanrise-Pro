import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  SendOtpBody,
  VerifyOtpBody,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/auth/send-otp", async (req, res): Promise<void> => {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { phone } = parsed.data;
  logger.info({ phone, stubOtp: "123456" }, "OTP stub sent");
  res.json({ message: "OTP sent" });
});

router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { phone, otp, role, referralCode } = parsed.data;

  if (!/^\d{6}$/.test(otp)) {
    res.status(401).json({ error: "Invalid OTP — use any 6-digit code" });
    return;
  }

  let [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));

  if (!user) {
    // Only allow public-facing roles on signup — admin accounts are seeded server-side only
    const allowedRoles = ["resident", "provider"] as const;
    type AllowedRole = (typeof allowedRoles)[number];
    const newRole: AllowedRole = allowedRoles.includes(role as AllowedRole) ? (role as AllowedRole) : "resident";
    const newReferralCode = `LP${phone.slice(-4)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    [user] = await db
      .insert(usersTable)
      .values({ phone, role: newRole, languagePref: "en", referralCode: newReferralCode, referredByCode: referralCode ?? null })
      .returning();
  }

  // Admin accounts must use the protected /auth/admin-login endpoint
  if (user.role === "admin") {
    res.status(403).json({ error: "Admin accounts cannot authenticate via OTP" });
    return;
  }

  req.session.userId = user.id;
  req.session.role = user.role;

  res.json({
    id: user.id,
    phone: user.phone,
    role: user.role,
    name: user.name,
    languagePref: user.languagePref,
    city: user.city,
    referralCode: user.referralCode,
    referralPoints: user.referralPoints,
  });
});

// Admin-only login protected by server-side ADMIN_SECRET env var
router.post("/auth/admin-login", async (req, res): Promise<void> => {
  const adminSecret = process.env["ADMIN_SECRET"];
  if (!adminSecret) {
    res.status(503).json({ error: "Admin login not configured" });
    return;
  }

  const { phone, secret } = req.body as { phone?: string; secret?: string };
  if (!phone || !secret) {
    res.status(400).json({ error: "phone and secret required" });
    return;
  }
  if (secret !== adminSecret) {
    res.status(401).json({ error: "Invalid admin secret" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (!user || user.role !== "admin") {
    res.status(401).json({ error: "Not an admin account" });
    return;
  }

  req.session.userId = user.id;
  req.session.role = user.role;

  res.json({
    id: user.id,
    phone: user.phone,
    role: user.role,
    name: user.name,
    languagePref: user.languagePref,
    city: user.city,
    referralCode: user.referralCode,
    referralPoints: user.referralPoints,
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    phone: user.phone,
    role: user.role,
    name: user.name,
    languagePref: user.languagePref,
    city: user.city,
    referralCode: user.referralCode,
    referralPoints: user.referralPoints,
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

export default router;
