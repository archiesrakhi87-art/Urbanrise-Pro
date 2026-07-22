import { logger } from "./logger";

export type EventName =
  | "onboarding.step_completed"
  | "onboarding.submitted"
  | "provider.approved"
  | "provider.rejected"
  | "provider.badge_assigned"
  | "provider.document_uploaded"
  | "booking.created"
  | "booking.confirmed"
  | "booking.completed"
  | "booking.cancelled"
  | "booking.disputed"
  | "booking.status_changed";

export interface EventPayload {
  userId?: number;
  providerId?: number;
  adminId?: number;
  residentId?: number;
  bookingId?: number;
  serviceCategoryId?: number;
  fromStatus?: string;
  toStatus?: string;
  changedByRole?: string;
  step?: number;
  docType?: string;
  badge?: string;
  notes?: string;
}

export function logEvent(event: EventName, payload: EventPayload = {}): void {
  logger.info({ event, ...payload }, `[EVENT] ${event}`);
}
