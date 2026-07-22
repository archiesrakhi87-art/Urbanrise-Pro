import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const serviceCategoriesTable = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  basePriceMin: integer("base_price_min"),
  basePriceMax: integer("base_price_max"),
});

export const insertServiceCategorySchema = createInsertSchema(serviceCategoriesTable).omit({ id: true });
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type ServiceCategory = typeof serviceCategoriesTable.$inferSelect;
