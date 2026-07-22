import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const disputesTable = pgTable("disputes", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  raisedBy: integer("raised_by").notNull(),
  status: text("status").notNull().default("open"), // open | investigating | resolved
  slaDeadline: timestamp("sla_deadline", { withTimezone: true }).notNull(),
  resolutionNotes: text("resolution_notes"),
  issueType: text("issue_type"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDisputeSchema = createInsertSchema(disputesTable).omit({ id: true, createdAt: true });
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Dispute = typeof disputesTable.$inferSelect;
