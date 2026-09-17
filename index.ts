// ─────────────────────────────────────────────────────────────────────────────
// Relay — Shared Types
// Used by: API, all workers, dashboard
// ─────────────────────────────────────────────────────────────────────────────

// Channel types
export type Channel = 'EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK';

// Notification status
export type NotificationStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

// ─────────────────────────────────────────────────────────────────────────────
// JOB PAYLOAD
// Shape of a job added to the BullMQ queue by the API service.
// Every worker receives a job with this shape.
// ─────────────────────────────────────────────────────────────────────────────

export interface NotificationJob {
  jobId: string;           // UUID — matches notification.id in DB
  tenantId: string;        // Which tenant this job belongs to
  channel: Channel;        // Which channel to use
  recipient: string;       // Email / phone number / device token / URL
  subject?: string;        // Email subject (email only, pre-filled)
  body: string;            // Notification body (pre-filled from template)
  provider: string;        // Which provider to use e.g. "sendgrid" | "twilio"
  providerConfig: Record<string, string>; // Provider credentials (from ChannelConfig)
  attemptNumber: number;   // Which attempt this is (1-based)
  metadata?: Record<string, unknown>; // Optional extra data
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKER RESULT
// What a worker returns after attempting delivery.
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkerResult {
  success: boolean;
  providerMsgId?: string;   // Provider's message ID (if returned)
  errorCode?: string;
  errorMessage?: string;
  durationMs: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API REQUEST / RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SendNotificationRequest {
  to: string;
  channel: Channel;
  template?: string;          // Template slug name
  subject?: string;           // Direct subject (if not using template)
  body?: string;              // Direct body (if not using template)
  data?: Record<string, unknown>; // Dynamic data for template variables
  idempotencyKey?: string;    // Dedup key from client
  sendAt?: string;            // ISO datetime for scheduled sends
}

export interface SendNotificationResponse {
  notificationId: string;
  status: 'QUEUED';
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUEUE NAMES
// Centralised — avoids hardcoding queue names in multiple places
// ─────────────────────────────────────────────────────────────────────────────

export const QUEUE_NAMES = {
  EMAIL: 'email-queue',
  SMS: 'sms-queue',
  PUSH: 'push-queue',
  WEBHOOK: 'webhook-queue',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
