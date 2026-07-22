import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const upskillingModulesTable = pgTable("upskilling_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  contentUrl: text("content_url"),
  category: text("category").notNull(),
  completionCriteria: text("completion_criteria"),
});

export const providerProgressTable = pgTable("provider_progress", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull(),
  moduleId: integer("module_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  badgeUnlocked: boolean("badge_unlocked").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertUpskillingModuleSchema = createInsertSchema(upskillingModulesTable).omit({ id: true });
export type InsertUpskillingModule = z.infer<typeof insertUpskillingModuleSchema>;
export type UpskillingModule = typeof upskillingModulesTable.$inferSelect;

export const insertProviderProgressSchema = createInsertSchema(providerProgressTable).omit({ id: true });
export type InsertProviderProgress = z.infer<typeof insertProviderProgressSchema>;
export type ProviderProgress = typeof providerProgressTable.$inferSelect;
