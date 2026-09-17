# 🏗️ System Architecture

This document explains the full architecture of Relay — how each component works, how they communicate, and how failures are handled.

---

## Table of Contents

- [Overview](#overview)
- [High-Level Architecture Diagram](#high-level-architecture-diagram)
- [Component Breakdown](#component-breakdown)
  - [API Service](#1-api-service)
  - [Queue Manager](#2-queue-manager)
  - [Worker Services](#3-worker-services)
  - [Database Layer](#4-database-layer)
  - [Cache Layer](#5-cache-layer)
  - [Dashboard](#6-dashboard)
- [Data Flow — Happy Path](#data-flow--happy-path)
- [Data Flow — Failure Path](#data-flow--failure-path)
- [Multi-Tenancy Model](#multi-tenancy-model)
- [Authentication Model](#authentication-model)
- [Scalability Notes](#scalability-notes)

---

## Overview

Relay follows a **microservices architecture** where each channel (email, SMS, push, webhook) is handled by an independent worker service. The API service acts as the entry point and routes jobs into channel-specific queues. Workers process jobs asynchronously and report results back to the database.

This design means:
- Workers can scale independently
- A failure in the SMS worker does not affect email delivery
- New channels can be added without touching existing code
- Contributors can work on one service without understanding others

---

## High-Level Architecture Diagram

```
                          ┌─────────────────────┐
                          │   CLIENT APPLICATION │
                          │  (any app, any lang) │
                          └──────────┬──────────┘
                                     │
                             POST /notify
                             (+ API Key)
                                     │
                          ┌──────────▼──────────┐
                          │     API SERVICE      │
                          │      (NestJS)        │
                          │                      │
                          │  1. Authenticate     │
                          │  2. Validate payload │
                          │  3. Load template    │
                          │  4. Fill data        │
                          │  5. Route to queue   │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │    QUEUE MANAGER     │
                          │   (BullMQ + Redis)   │
                          │                      │
                          │  ┌────────────────┐  │
                          │  │  email-queue   │  │
                          │  │  sms-queue     │  │
                          │  │  push-queue    │  │
                          │  │  webhook-queue │  │
                          │  └────────────────┘  │
                          └──┬────┬────┬────┬───┘
                             │    │    │    │
               ┌─────────────┘    │    │    └────────────────┐
               │          ┌───────┘    └────────┐            │
               ▼          ▼                     ▼            ▼
        ┌──────────┐ ┌──────────┐        ┌──────────┐ ┌───────────┐
        │  Email   │ │   SMS    │        │   Push   │ │  Webhook  │
        │  Worker  │ │  Worker  │        │  Worker  │ │  Worker   │
        │          │ │          │        │          │ │           │
        │ SendGrid │ │  Twilio  │        │  FCM /   │ │  HTTP     │
        │  / SMTP  │ │          │        │  APNs    │ │  POST     │
        └────┬─────┘ └────┬─────┘        └────┬─────┘ └─────┬─────┘
             │            │                   │              │
             └────────────┴───────────────────┴──────────────┘
                                      │
                     ┌────────────────▼───────────────────┐
                     │           DATA LAYER               │
                     │                                    │
                     │  PostgreSQL   │   Redis            │
                     │  ─────────────────────────────     │
                     │  Templates    │  Queue state       │
                     │  API Keys     │  Rate limits       │
                     │  Tenants      │  Dedup cache       │
                     │  Delivery log │  Session cache     │
                     └────────────────┬───────────────────┘
                                      │
                     ┌────────────────▼───────────────────┐
                     │           DASHBOARD                │
                     │           (Next.js)                │
                     │                                    │
                     │  Analytics  │  Template Editor     │
                     │  Retry Ctr  │  API Key Manager     │
                     └────────────────────────────────────┘
```

---

## Component Breakdown

### 1. API Service

**Technology:** NestJS (TypeScript)
**Port:** 3000

The API Service is the single entry point for all external requests. It handles:

**Responsibilities:**
- API key authentication and tenant resolution
- Request validation (DTOs + class-validator)
- Template loading and dynamic data injection
- Routing jobs to the correct channel queue
- Webhook callback management (delivery status)
- Rate limiting per tenant (via Redis)

**Key Modules:**
```
api/
├── auth/           → API key validation, tenant context
├── notifications/  → POST /notify endpoint + routing logic
├── templates/      → CRUD for notification templates
├── tenants/        → Multi-tenant management
├── analytics/      → Delivery stats queries
└── health/         → GET /health (for Docker healthcheck)
```

**Why NestJS?**
NestJS enforces a clean module structure that makes it safe for multiple contributors to work in parallel without stepping on each other.

---

### 2. Queue Manager

**Technology:** BullMQ + Redis
**Purpose:** Async job distribution

When the API receives a notification request, it does NOT send the notification directly. It adds a **job** to the relevant queue and returns a `202 Accepted` response immediately. This makes the API fast and non-blocking.

**Queues:**
```
email-queue   → email delivery jobs
sms-queue     → SMS delivery jobs
push-queue    → mobile push notification jobs
webhook-queue → HTTP POST delivery jobs
```

**Job payload structure:**
```json
{
  "jobId": "uuid",
  "tenantId": "tenant-uuid",
  "to": "user@example.com",
  "channel": "email",
  "templateId": "template-uuid",
  "data": { "name": "Kasun", "orderId": "#1234" },
  "filledContent": {
    "subject": "Order Confirmed",
    "body": "Hi Kasun, your order #1234 is confirmed."
  },
  "attempts": 0,
  "createdAt": "2024-01-01T10:00:00Z"
}
```

**Queue features used:**
- Job priorities (urgent notifications process first)
- Concurrency limits per worker
- Automatic retries with configurable backoff
- Dead letter queue on max retry exceeded
- Job events (completed, failed, stalled)

---

### 3. Worker Services

Each worker is an **independent Node.js microservice** that:
1. Listens to its designated queue
2. Picks up jobs one at a time (or in controlled concurrency)
3. Calls the external provider (SendGrid, Twilio, FCM, etc.)
4. Updates the delivery log in PostgreSQL
5. Emits a status event back (for webhook callbacks)

**Email Worker** → Sends via SendGrid or SMTP (configurable per tenant)

**SMS Worker** → Sends via Twilio (configurable, provider-agnostic interface planned)

**Push Worker** → Sends via Firebase Cloud Messaging (FCM) for Android/Web, APNs for iOS

**Webhook Worker** → Makes HTTP POST to the tenant's configured endpoint with notification payload

Each worker is **intentionally simple** — it has one job and does it well. This is the best entry point for new contributors.

---

### 4. Database Layer

**Technology:** PostgreSQL + Prisma ORM

**Core tables:**

```
tenants          → organisations using the platform
api_keys         → authentication tokens per tenant
templates        → notification templates (with {{placeholders}})
notifications    → every notification request received
delivery_logs    → per-attempt delivery results
dead_letters     → failed jobs that exhausted retries
channels         → tenant channel configuration (API keys, SMTP, etc.)
```

**Why Prisma?**
Type-safe queries that match the TypeScript codebase. Schema changes are tracked as migrations, making contributions safe.

---

### 5. Cache Layer

**Technology:** Redis (shared with BullMQ)

Redis is used for two purposes:

| Purpose | How |
|---|---|
| BullMQ queue storage | BullMQ writes all job state to Redis |
| API rate limiting | Token bucket per `tenantId` + `API key` |
| Deduplication | Short TTL key on `notificationId` to prevent duplicate sends |
| Template caching | Hot templates cached to avoid repeated DB queries |
| Session / auth cache | Validated API keys cached for 5 minutes |

---

### 6. Dashboard

**Technology:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui

The dashboard is a **management interface** for developers using the platform. It is a standard Next.js app that calls the API service internally.

**Pages:**
```
/                    → Overview / analytics
/templates           → Create, edit, preview templates
/notifications       → Delivery history, filter by status
/dead-letters        → Failed notifications, retry controls
/settings/channels   → Configure email/SMS/push providers
/settings/api-keys   → Create and revoke API keys
/settings/team       → Invite team members
```

---

## Data Flow — Happy Path

```
1.  Client sends:  POST /notify  { to, channel, template, data }
2.  API validates the API key → resolves tenantId
3.  API loads the template from DB (or Redis cache)
4.  API fills the template with the provided data
5.  API creates a notification record in PostgreSQL (status: QUEUED)
6.  API adds job to BullMQ queue (e.g. email-queue)
7.  API returns:  202 Accepted  { notificationId }
8.  Email Worker picks up the job
9.  Worker calls SendGrid API
10. SendGrid returns 200 OK
11. Worker updates notification status → DELIVERED in PostgreSQL
12. Worker emits delivery event
13. If tenant has a delivery webhook configured → Webhook Worker fires callback
```

Total time for client: **< 50ms** (queue insertion, not full delivery)

---

## Data Flow — Failure Path

```
1.  Worker calls SendGrid → 500 Internal Server Error
2.  BullMQ marks job as failed
3.  BullMQ waits 30 seconds (attempt 1 backoff)
4.  Worker retries → fails again
5.  BullMQ waits 2 minutes (attempt 2 backoff)
6.  Worker retries → fails again
7.  BullMQ waits 5 minutes (attempt 3 backoff)
8.  Worker retries → fails again (attempt 3 exhausted)
9.  Job moves to Dead Letter Queue (DLQ)
10. PostgreSQL updated: status → FAILED
11. Dashboard shows failure under Dead Letters tab
12. Red Team or developer can manually retry from dashboard
```

**Backoff schedule:** 30s → 2min → 5min → DLQ (configurable)

---

## Multi-Tenancy Model

Each organisation that uses Relay is a **tenant**. Tenants are isolated at the data level:

- Every database record has a `tenantId` foreign key
- API keys are scoped to a tenant
- Queue jobs carry `tenantId` and workers verify it
- Tenant rate limits are enforced separately in Redis
- Channel configurations (SMTP creds, Twilio keys) are stored encrypted per tenant

---

## Authentication Model

| Actor | Method |
|---|---|
| External app (API user) | API Key in `Authorization: Bearer` header |
| Dashboard user | JWT (stored in HttpOnly cookie) |
| Worker ↔ Queue | Internal — BullMQ Redis, no HTTP auth |
| Worker ↔ DB | Prisma connection string in env var |

---

## Scalability Notes

The architecture is designed to scale horizontally:

- **API Service** — stateless, can run multiple instances behind a load balancer
- **Workers** — each worker can run multiple instances (BullMQ handles concurrency safely)
- **Redis** — can be replaced with Redis Cluster for higher throughput
- **PostgreSQL** — read replicas can be added for analytics queries
- **Dashboard** — static export or edge deployment possible via Vercel/Cloudflare

For the **MVP**, everything runs on a single machine via Docker Compose. Horizontal scaling is a post-MVP milestone.

---

*Last updated: See [`Logs.md`](./Logs.md)*
