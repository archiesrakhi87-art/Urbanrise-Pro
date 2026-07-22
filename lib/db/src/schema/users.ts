import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  role: text("role").notNull().default("resident"), // resident | provider | admin
  name: text("name"),
  languagePref: text("language_pref").notNull().default("en"),
  city: text("city"),
  referralCode: text("referral_code").unique(),
  referralPoints: integer("referral_points").notNull().default(0),
  referredByCode: text("referred_by_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
