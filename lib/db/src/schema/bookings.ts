import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id").notNull(),
  providerId: integer("provider_id").notNull(),
  serviceCategoryId: integer("service_category_id").notNull(),
  scheduledTime: text("scheduled_time"),
  status: text("status").notNull().default("requested"), // requested | confirmed | completed | cancelled | disputed
  price: integer("price").notNull(),
  address: text("address").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
