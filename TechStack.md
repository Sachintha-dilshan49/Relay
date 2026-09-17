# 🛠️ Tech Stack

This document lists every technology used in the Relay platform, what it does, and why it was chosen.

---

## Summary Table

| Layer | Technology | Version |
|---|---|---|
| Backend API | NestJS + TypeScript | NestJS 10+, TS 5+ |
| Queue System | BullMQ | 5+ |
| Queue Storage | Redis | 7+ |
| Workers | Node.js | 20 LTS |
| ORM | Prisma | 5+ |
| Database | PostgreSQL | 16+ |
| Frontend | Next.js 14 + TypeScript | App Router |
| UI Components | shadcn/ui + Tailwind CSS | Latest |
| Containerization | Docker + Docker Compose | v25+ |
| CI/CD | GitHub Actions | — |
| Dev Hosting | Railway | — |
| Package Manager | npm Workspaces (Monorepo) | npm 10+ |

---

## Backend — API Service

### NestJS (TypeScript)

NestJS is a framework for building scalable Node.js server-side applications.

**Why NestJS over plain Express?**
- Built-in dependency injection forces clean, testable architecture
- Module system naturally separates concerns — each module is independently ownable by a contributor
- Decorators make validation, guards, and interceptors clean and readable
- TypeScript-first — no configuration needed
- Excellent documentation — friendly for contributors learning backend

**Key NestJS features used:**
- `@nestjs/common` — controllers, services, modules, pipes, guards
- `@nestjs/config` — environment variable management
- `class-validator` + `class-transformer` — DTO validation
- `@nestjs/swagger` — auto-generated API documentation

---

## Queue System

### BullMQ

BullMQ is a Node.js queue library built on top of Redis.

**Why BullMQ?**
- Battle-tested in production at scale (used by major companies)
- Handles retries, backoff, concurrency, priorities, and dead letter queues natively
- Redis-backed — fast, reliable, and well-understood
- Clean TypeScript API that fits naturally with NestJS
- Real-time job monitoring via Bull Board (dashboard UI)

**Key BullMQ concepts used in this project:**
| Concept | Purpose |
|---|---|
| Queue | Named list of jobs for each channel |
| Job | A single notification delivery task |
| Worker | Processes jobs from a queue |
| Concurrency | How many jobs a worker processes simultaneously |
| Backoff | Delay before retrying a failed job |
| Dead Letter Queue | Holds jobs that exhausted all retries |
| Events | `completed`, `failed`, `stalled` events for logging |

---

### Redis

Redis is an in-memory data store used as the backbone of BullMQ and for caching.

**Why Redis?**
- Required by BullMQ (no alternative)
- Extremely fast for rate limiting counters and caching
- Simple key-value model that is easy for contributors to learn

**Uses in this project:**
- BullMQ job storage and state management
- API key validation cache (5 min TTL)
- Template cache (per tenant, short TTL)
- Rate limiter (token bucket per API key)
- Notification deduplication (idempotency keys)

---

## Database

### PostgreSQL

The primary relational database for persistent data.

**Why PostgreSQL over MySQL or MongoDB?**
- ACID compliance — critical for delivery logs and financial-adjacent data (notifications can trigger billing)
- Better JSON support for flexible `data` payloads
- Strong ecosystem (Prisma, pg, etc.)
- Industry standard — interns will encounter it in most companies

**What is stored in PostgreSQL:**
- Tenant accounts and configuration
- API keys (hashed)
- Notification templates
- Notification records (every request received)
- Delivery logs (every attempt per notification)
- Dead letter records

---

### Prisma ORM

Prisma is a type-safe database client for Node.js and TypeScript.

**Why Prisma?**
- Auto-generated TypeScript types from schema — no manual model writing
- Migration system tracks schema changes in version control
- Easy for contributors who haven't used raw SQL
- Schema-first approach makes the database structure explicit and readable

---

## Frontend — Dashboard

### Next.js 14 (App Router)

Next.js is a React framework with server-side rendering and API routes.

**Why Next.js?**
- Industry standard for React applications
- App Router enables server components — dashboard data can be fetched on the server
- API routes allow simple BFF (Backend for Frontend) calls
- Deployed for free on Vercel or Railway

### Tailwind CSS

A utility-first CSS framework.

**Why Tailwind?**
- No context switching between CSS files and components
- Consistent design tokens (spacing, colour, typography)
- Very common in internship environments — contributors likely know it

### shadcn/ui

A component library built on Radix UI primitives with Tailwind styling.

**Why shadcn/ui?**
- Components are copied into the repo (not an external dependency) — fully customizable
- Accessible by default (Radix primitives)
- Looks professional with minimal effort
- Used by many production companies

---

## Infrastructure

### Docker + Docker Compose

**Why Docker?**
- Every contributor gets the exact same environment
- Redis and PostgreSQL are spun up in seconds — no local installation needed
- Production deployment uses the same images

**Docker Compose setup:**
- `docker-compose.dev.yml` — local development (Redis + PostgreSQL only, apps run with `npm run dev`)
- `docker-compose.yml` — full stack (all services containerized, for deployment)

### GitHub Actions (CI/CD)

Automated pipelines that run on every PR and push.

**Pipelines:**
| Pipeline | Trigger | What it does |
|---|---|---|
| `lint.yml` | PR to `dev` | ESLint check |
| `test.yml` | PR to `dev` | Unit + integration tests |
| `build.yml` | PR to `dev` | TypeScript build check |
| `discord-notify.yml` | Any event | Posts updates to Discord |

### Railway (Dev Hosting)

Railway is a cloud platform with a generous free tier.

**Why Railway?**
- Free tier covers PostgreSQL, Redis, and Node.js services
- No credit card required
- Deploys from GitHub on push — zero DevOps knowledge needed
- Perfect for contributors who want to test against a live deployment

---

## Monorepo Setup

The project uses **npm Workspaces** to manage the monorepo.

**Why a monorepo?**
- Shared TypeScript types between API and workers (no duplication)
- Single `npm install` at root installs all packages
- One CI pipeline covers the whole codebase
- Contributors can see the full system in one repo

**Workspace packages:**

| Package | Purpose |
|---|---|
| `apps/api` | NestJS API service |
| `apps/dashboard` | Next.js dashboard |
| `apps/workers/email-worker` | Email delivery microservice |
| `apps/workers/sms-worker` | SMS delivery microservice |
| `apps/workers/push-worker` | Push notification microservice |
| `apps/workers/webhook-worker` | Webhook delivery microservice |
| `packages/shared-types` | TypeScript interfaces shared across apps |
| `packages/shared-utils` | Common helper functions |
| `packages/database` | Prisma schema, client, and migrations |

---

*Last updated: See [`Logs.md`](./Logs.md)*
