# ✅ Features Specification

This document lists every planned feature for Relay, what it does, which module owns it, and its current status. Contributors should check this before picking an issue to understand what is being built and why.

---

## Status Legend

| Badge | Meaning |
|---|---|
| 🔴 Not Started | No work done yet — open for contributors |
| 🟡 In Progress | Someone is actively working on it |
| 🟢 Complete | Merged to `dev` |
| ⏸️ Blocked | Waiting on another feature |
| 🔵 Post-MVP | Planned but not in v1 scope |

---

## Phase 1 — Foundation

### F-01 · Monorepo & Project Setup
**Module:** Root / DevOps
**Status:** 🟢 Complete

Set up npm workspaces monorepo with shared TypeScript config, ESLint, Prettier, and a working local development environment.

---

### F-02 · Local Infrastructure (Docker)
**Module:** DevOps
**Status:** 🟢 Complete

Docker Compose setup for local development providing PostgreSQL and Redis with health checks and persistent volumes.

**Acceptance criteria:**
- `npm run docker:dev` starts Postgres + Redis
- Both services have health checks
- Data persists across container restarts

---

### F-03 · Database Schema
**Module:** Database
**Status:** 🟢 Complete

Full Prisma schema with all models: Tenant, TenantMember, ApiKey, ChannelConfig, Template, Notification, DeliveryLog, DeadLetter.

**Acceptance criteria:**
- Schema reflects all models in `packages/database/prisma/schema.prisma`
- Migrations run cleanly with `npm run db:migrate`

---

### F-04 · NestJS API Bootstrap
**Module:** API
**Status:** 🔴 Not Started

Set up the base NestJS application with config module, Swagger, health check endpoint, and global validation pipe.

**Acceptance criteria:**
- `GET /health` returns `{ status: "ok" }`
- Swagger UI accessible at `/api/docs` in development
- All requests validated through global validation pipe
- Unknown routes return proper 404 JSON

---

### F-05 · API Key Authentication
**Module:** API → Auth
**Status:** 🔴 Not Started

Implement API key authentication guard. Incoming requests must have a valid `Authorization: Bearer <key>` header. The guard resolves the tenant from the key and attaches it to the request context.

**Acceptance criteria:**
- Valid key → request proceeds with `req.tenant` attached
- Invalid / missing key → `401 Unauthorized`
- Expired key → `401 Unauthorized` with clear message
- Key validation result cached in Redis for 5 minutes
- Keys stored hashed (bcrypt) in PostgreSQL — plain key never stored

---

### F-06 · Tenant Management API
**Module:** API → Tenants
**Status:** 🔴 Not Started

REST endpoints for tenant registration and management.

**Endpoints:**
```
POST   /tenants            → Register new tenant
GET    /tenants/me         → Get current tenant details
PATCH  /tenants/me         → Update tenant details
```

**Acceptance criteria:**
- New tenant gets one API key generated on registration
- Slug must be unique (validated)
- Tenant can retrieve their own data only

---

### F-07 · API Key Management
**Module:** API → Auth
**Status:** 🔴 Not Started

Endpoints for tenants to manage their API keys.

**Endpoints:**
```
GET    /api-keys           → List all API keys for tenant
POST   /api-keys           → Create new API key
DELETE /api-keys/:id       → Revoke an API key
```

**Acceptance criteria:**
- Plain key returned ONLY on creation (never again)
- Only prefix shown on list view (e.g. `relay_live_****3n`)
- Revoking a key immediately invalidates Redis cache

---

### F-08 · Template Management API
**Module:** API → Templates
**Status:** 🔴 Not Started

CRUD endpoints for notification templates.

**Endpoints:**
```
GET    /templates          → List templates (filter by channel)
POST   /templates          → Create template
GET    /templates/:id      → Get single template
PATCH  /templates/:id      → Update template
DELETE /templates/:id      → Delete (soft delete → ARCHIVED)
```

**Template body example:**
```
Hello {{name}}, your order {{orderId}} has been confirmed.
Total: {{total}}. Estimated delivery: {{deliveryDate}}.
```

**Acceptance criteria:**
- Variables auto-extracted and stored on save
- Updating increments version number
- Archived templates cannot be used in new notifications
- Templates scoped to tenant (cannot see other tenants' templates)

---

### F-09 · Send Notification Endpoint
**Module:** API → Notifications
**Status:** 🔴 Not Started

The core `POST /notify` endpoint. Receives a notification request, fills the template, and routes the job to the correct BullMQ queue.

**Request:**
```json
{
  "to": "user@example.com",
  "channel": "EMAIL",
  "template": "order-confirmed",
  "data": { "name": "Kasun", "orderId": "#1234", "total": "Rs. 5,500" }
}
```

**Response:**
```json
{
  "notificationId": "uuid",
  "status": "QUEUED",
  "message": "Notification queued successfully"
}
```

**Acceptance criteria:**
- Returns `202 Accepted` immediately (non-blocking)
- Validates all required fields
- Template filled before queuing
- `notificationId` matches DB record
- Idempotency key deduplication — duplicate requests return same ID

---

### F-10 · BullMQ Queue Setup
**Module:** API → Queue
**Status:** 🔴 Not Started

Set up BullMQ queues in the API service for all four channels. The queue service adds jobs; workers consume them.

**Queues:**
- `email-queue`
- `sms-queue`
- `push-queue`
- `webhook-queue`

**Acceptance criteria:**
- All queues initialized on app startup
- Queue connection uses shared Redis config
- Failed queue connection throws on startup (fail fast)
- Job payload matches `NotificationJob` type from `@relay/shared-types`

---

## Phase 2 — Workers

### F-11 · Email Worker (SendGrid)
**Module:** Workers → Email
**Status:** 🔴 Not Started

Worker that consumes jobs from `email-queue` and sends emails via SendGrid.

**Acceptance criteria:**
- Picks up jobs from `email-queue`
- Sends via SendGrid API
- Writes `DeliveryLog` record on success and failure
- Updates `Notification.status` to DELIVERED or FAILED
- Handles SendGrid rate limit errors gracefully (retry with backoff)
- Logs each attempt with duration in ms

---

### F-12 · Email Worker (SMTP Fallback)
**Module:** Workers → Email
**Status:** 🔴 Not Started

Add SMTP as an alternative email provider using Nodemailer. Tenant chooses provider via `ChannelConfig`.

**Acceptance criteria:**
- Provider selected based on tenant `ChannelConfig`
- SMTP sends with Nodemailer
- Same `DeliveryLog` behaviour as SendGrid

---

### F-13 · SMS Worker (Twilio)
**Module:** Workers → SMS
**Status:** 🔴 Not Started

Worker that consumes `sms-queue` jobs and sends SMS via Twilio.

**Acceptance criteria:**
- Sends SMS to recipient phone number
- Stores Twilio message SID as `providerMsgId`
- Writes `DeliveryLog` on each attempt
- Handles Twilio errors (invalid number, etc.) gracefully

---

### F-14 · Push Worker (FCM)
**Module:** Workers → Push
**Status:** 🔴 Not Started

Worker that sends push notifications via Firebase Cloud Messaging to Android and web devices.

**Acceptance criteria:**
- Sends to FCM token (device token as `recipient`)
- Stores FCM message ID as `providerMsgId`
- Handles expired/invalid tokens — marks as FAILED, does not retry

---

### F-15 · Webhook Worker
**Module:** Workers → Webhook
**Status:** 🔴 Not Started

Worker that makes HTTP POST requests to tenant-configured URLs.

**Request body sent to tenant's URL:**
```json
{
  "notificationId": "uuid",
  "event": "order.confirmed",
  "data": { ... }
}
```

**Acceptance criteria:**
- POST to tenant's configured URL
- Follows redirects (max 3)
- Timeout after 10 seconds
- 2xx response = success, anything else = failure
- Stores response status code in DeliveryLog

---

### F-16 · Retry + Dead Letter Queue
**Module:** Workers (all)
**Status:** 🔴 Not Started

All workers must implement exponential backoff retry and move failed jobs to the DLQ after max attempts.

**Retry schedule:**
- Attempt 1 → immediate
- Attempt 2 → wait 30 seconds
- Attempt 3 → wait 2 minutes
- Attempt 4 → wait 5 minutes
- All failed → Dead Letter Queue

**Acceptance criteria:**
- `DeliveryLog` created for every attempt
- `DeadLetter` record created on DLQ
- `Notification.status` → FAILED on DLQ
- DLQ jobs visible in dashboard

---

## Phase 3 — Dashboard

### F-17 · Dashboard Bootstrap
**Module:** Dashboard
**Status:** 🔴 Not Started

Set up Next.js 14 with App Router, Tailwind CSS, shadcn/ui, and authentication via NextAuth.

**Acceptance criteria:**
- Login page works
- Sidebar navigation renders
- Authenticated routes redirect to login if not signed in

---

### F-18 · Analytics Overview Page
**Module:** Dashboard
**Status:** 🔴 Not Started

Home page showing high-level delivery statistics for the tenant.

**Metrics shown:**
- Total notifications sent (today / this week / this month)
- Delivery rate (%)
- Failed count
- Breakdown by channel (bar chart)
- Delivery trend (line chart — last 7 days)

---

### F-19 · Notification History Page
**Module:** Dashboard
**Status:** 🔴 Not Started

Table of all notifications with filters by status, channel, and date range. Clicking a row shows full delivery log.

---

### F-20 · Template Editor
**Module:** Dashboard
**Status:** 🔴 Not Started

UI for creating and editing notification templates with a live preview panel showing filled output.

---

### F-21 · Dead Letter Retry UI
**Module:** Dashboard
**Status:** 🔴 Not Started

View all failed notifications in the DLQ with the ability to retry individually or in bulk.

---

### F-22 · API Key Management UI
**Module:** Dashboard
**Status:** 🔴 Not Started

Create, view (prefix only), and revoke API keys from the settings panel.

---

### F-23 · Channel Configuration UI
**Module:** Dashboard
**Status:** 🔴 Not Started

Form for tenants to connect their own provider credentials (SendGrid key, Twilio SID/token, FCM config).

---

## Phase 4 — Post-MVP (v0.4.0+)

| Feature | Description | Status |
|---|---|---|
| F-24 · Multi-channel fallback | Try push → SMS → email if previous fails | 🔵 Post-MVP |
| F-25 · Scheduled notifications | Send at a future datetime | 🔵 Post-MVP |
| F-26 · Notification preferences | Recipients opt out of channels | 🔵 Post-MVP |
| F-27 · Team member management | Invite team members to tenant | 🔵 Post-MVP |
| F-28 · Rate limiting UI | Configure per-tenant rate limits from dashboard | 🔵 Post-MVP |
| F-29 · Webhook delivery callbacks | Notify tenant app when delivery status changes | 🔵 Post-MVP |
| F-30 · APNs support | iOS push notifications via Apple Push Notification Service | 🔵 Post-MVP |

---

*To claim a feature, open or comment on its corresponding GitHub issue. Do not start work without a linked issue.*
