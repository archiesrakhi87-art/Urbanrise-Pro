import { pgTable, text, serial, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const providersTable = pgTable("providers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  idDocUrl: text("id_doc_url"),
  kycStatus: text("kyc_status").notNull().default("pending"), // pending | submitted | verified | rejected
  kycNotes: text("kyc_notes"),
  badgeTags: text("badge_tags").array().notNull().default([]),
  serviceCategories: text("service_categories").array().notNull().default([]),
  priceList: text("price_list"),
  languagesSpoken: text("languages_spoken").array().notNull().default(["en"]),
  ratingAvg: real("rating_avg").notNull().default(0),
  totalJobs: integer("total_jobs").notNull().default(0),
  onboardingStep: integer("onboarding_step").notNull().default(0),
  policyAccepted: boolean("policy_accepted").notNull().default(false),
  digitalSignature: text("digital_signature"),
  flagged: boolean("flagged").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProviderSchema = createInsertSchema(providersTable).omit({ id: true, createdAt: true });
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Provider = typeof providersTable.$inferSelect;
