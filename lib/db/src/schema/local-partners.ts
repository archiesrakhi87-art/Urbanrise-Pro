import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const localPartnersTable = pgTable("local_partners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // shop | NGO | municipal
  region: text("region").notNull(),
  contactInfo: text("contact_info"),
});

export const insertLocalPartnerSchema = createInsertSchema(localPartnersTable).omit({ id: true });
export type InsertLocalPartner = z.infer<typeof insertLocalPartnerSchema>;
export type LocalPartner = typeof localPartnersTable.$inferSelect;
