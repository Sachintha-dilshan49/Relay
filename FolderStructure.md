# 📁 Folder Structure

This document explains the complete folder structure of the Relay monorepo.

> **Note for contributors:** You do not need to understand every folder. Find the module you're contributing to and focus there. Each app and package is self-contained.

---

## Full Structure

```
relay/                              ← Root of the monorepo
│
├── .github/                             ← GitHub configuration
│   ├── workflows/
│   │   ├── discord-notify.yml           ← Discord notification on repo events
│   │   ├── lint.yml                     ← ESLint check on PRs
│   │   ├── test.yml                     ← Run tests on PRs
│   │   └── build.yml                    ← TypeScript build check on PRs
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md                ← Template for bug reports
│   │   └── feature_request.md           ← Template for feature requests
│   └── pull_request_template.md         ← PR description template
│
├── apps/                                ← Runnable applications
│   │
│   ├── api/                             ← NestJS backend API service
│   │   ├── src/
│   │   │   ├── main.ts                  ← App entry point
│   │   │   ├── app.module.ts            ← Root module
│   │   │   │
│   │   │   ├── auth/                    ← API key auth + tenant context
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.guard.ts        ← Guard applied to all routes
│   │   │   │   └── api-key.strategy.ts
│   │   │   │
│   │   │   ├── notifications/           ← Core notification routing
│   │   │   │   ├── notifications.module.ts
│   │   │   │   ├── notifications.controller.ts  ← POST /notify
│   │   │   │   ├── notifications.service.ts     ← Orchestration logic
│   │   │   │   └── dto/
│   │   │   │       └── create-notification.dto.ts
│   │   │   │
│   │   │   ├── templates/               ← Template CRUD
│   │   │   │   ├── templates.module.ts
│   │   │   │   ├── templates.controller.ts
│   │   │   │   ├── templates.service.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── tenants/                 ← Tenant management
│   │   │   │   ├── tenants.module.ts
│   │   │   │   ├── tenants.controller.ts
│   │   │   │   └── tenants.service.ts
│   │   │   │
│   │   │   ├── analytics/               ← Delivery stats endpoints
│   │   │   │   ├── analytics.module.ts
│   │   │   │   ├── analytics.controller.ts
│   │   │   │   └── analytics.service.ts
│   │   │   │
│   │   │   ├── queue/                   ← BullMQ queue producers
│   │   │   │   ├── queue.module.ts
│   │   │   │   └── queue.service.ts     ← Adds jobs to queues
│   │   │   │
│   │   │   ├── health/                  ← GET /health endpoint
│   │   │   │   └── health.controller.ts
│   │   │   │
│   │   │   └── common/                  ← Shared API utilities
│   │   │       ├── filters/             ← Exception filters
│   │   │       ├── interceptors/        ← Logging, transform
│   │   │       └── pipes/               ← Validation pipes
│   │   │
│   │   ├── test/                        ← E2E and unit tests
│   │   ├── .env.example                 ← Environment variable template
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── dashboard/                       ← Next.js 14 dashboard (App Router)
│   │   ├── app/
│   │   │   ├── layout.tsx               ← Root layout
│   │   │   ├── page.tsx                 ← Dashboard home / analytics
│   │   │   │
│   │   │   ├── templates/               ← Template management UI
│   │   │   │   ├── page.tsx             ← Template list
│   │   │   │   └── [id]/page.tsx        ← Template editor
│   │   │   │
│   │   │   ├── notifications/           ← Delivery history
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── dead-letters/            ← Failed jobs + retry UI
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── channels/page.tsx    ← Provider config (SendGrid, Twilio)
│   │   │       ├── api-keys/page.tsx    ← API key management
│   │   │       └── team/page.tsx        ← Team member management
│   │   │
│   │   ├── components/                  ← Reusable UI components
│   │   │   ├── ui/                      ← shadcn/ui components
│   │   │   ├── charts/                  ← Analytics charts
│   │   │   ├── layout/                  ← Sidebar, navbar, etc.
│   │   │   └── notifications/           ← Notification-specific components
│   │   │
│   │   ├── lib/                         ← Utilities, API client
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── workers/                         ← Delivery worker microservices
│       │
│       ├── email-worker/                ← Sends emails via SendGrid / SMTP
│       │   ├── src/
│       │   │   ├── index.ts             ← Worker entry point
│       │   │   ├── email.worker.ts      ← BullMQ worker process
│       │   │   ├── email.sender.ts      ← Actual send logic (SendGrid)
│       │   │   ├── providers/
│       │   │   │   ├── sendgrid.ts
│       │   │   │   └── smtp.ts
│       │   │   └── types.ts
│       │   ├── .env.example
│       │   └── package.json
│       │
│       ├── sms-worker/                  ← Sends SMS via Twilio
│       │   ├── src/
│       │   │   ├── index.ts
│       │   │   ├── sms.worker.ts
│       │   │   ├── sms.sender.ts
│       │   │   └── providers/
│       │   │       └── twilio.ts
│       │   ├── .env.example
│       │   └── package.json
│       │
│       ├── push-worker/                 ← Sends push via FCM / APNs
│       │   ├── src/
│       │   │   ├── index.ts
│       │   │   ├── push.worker.ts
│       │   │   ├── push.sender.ts
│       │   │   └── providers/
│       │   │       ├── fcm.ts           ← Firebase Cloud Messaging
│       │   │       └── apns.ts          ← Apple Push Notification Service
│       │   ├── .env.example
│       │   └── package.json
│       │
│       └── webhook-worker/              ← HTTP POST to tenant endpoints
│           ├── src/
│           │   ├── index.ts
│           │   ├── webhook.worker.ts
│           │   └── webhook.sender.ts    ← Axios HTTP POST with retry
│           ├── .env.example
│           └── package.json
│
├── packages/                            ← Shared packages (used by multiple apps)
│   │
│   ├── shared-types/                    ← TypeScript types used across the repo
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── notification.types.ts    ← NotificationJob, Channel, Status enums
│   │   │   ├── template.types.ts
│   │   │   └── tenant.types.ts
│   │   └── package.json
│   │
│   ├── shared-utils/                    ← Common utilities
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── template-engine.ts       ← Fills {{placeholders}} in templates
│   │   │   ├── logger.ts                ← Shared logger config
│   │   │   └── retry.ts                 ← Backoff calculation helper
│   │   └── package.json
│   │
│   └── database/                        ← Prisma schema + migrations
│       ├── prisma/
│       │   ├── schema.prisma            ← Database schema (source of truth)
│       │   └── migrations/              ← Auto-generated migration files
│       ├── src/
│       │   └── index.ts                 ← Exports PrismaClient singleton
│       └── package.json
│
├── infrastructure/                      ← Docker and deployment configs
│   └── docker/
│       ├── docker-compose.yml           ← Full stack (all services)
│       ├── docker-compose.dev.yml       ← Dev only (Redis + PostgreSQL)
│       └── Dockerfiles/
│           ├── api.Dockerfile
│           ├── dashboard.Dockerfile
│           ├── email-worker.Dockerfile
│           ├── sms-worker.Dockerfile
│           ├── push-worker.Dockerfile
│           └── webhook-worker.Dockerfile
│
├── docs/                                ← Project documentation
│   ├── Architecture.md                  ← System architecture (this project)
│   ├── TechStack.md                     ← Technology choices and reasoning
│   ├── FolderStructure.md               ← This file
│   └── Logs.md                          ← Changelog and release notes
│
├── README.md                            ← Project overview and quick start
├── CONTRIBUTING.md                      ← Contribution guide
├── package.json                         ← Root package.json (npm workspaces)
├── tsconfig.base.json                   ← Shared TypeScript config
├── .eslintrc.js                         ← ESLint config (shared)
├── .prettierrc                          ← Prettier config
├── .gitignore
└── .env.example                         ← Root env var reference
```

---

## Where to Go for What

| I want to... | Go to |
|---|---|
| Add a new API endpoint | `apps/api/src/notifications/` or the relevant module |
| Fix an email delivery bug | `apps/workers/email-worker/src/` |
| Add an SMS provider | `apps/workers/sms-worker/src/providers/` |
| Improve the dashboard UI | `apps/dashboard/app/` + `apps/dashboard/components/` |
| Change the database schema | `packages/database/prisma/schema.prisma` |
| Add shared TypeScript types | `packages/shared-types/src/` |
| Update Docker configs | `infrastructure/docker/` |
| Add a GitHub Actions workflow | `.github/workflows/` |
| Fix the retry logic | `apps/api/src/queue/queue.service.ts` |
| Add tests | `apps/<service>/test/` |

---

## Key Files to Know

| File | Why it matters |
|---|---|
| `packages/database/prisma/schema.prisma` | The full database schema — read this to understand data models |
| `apps/api/src/notifications/notifications.service.ts` | The core routing logic — how a request becomes a queue job |
| `apps/workers/email-worker/src/email.worker.ts` | How a job is consumed and an email is sent |
| `packages/shared-types/src/notification.types.ts` | The `NotificationJob` interface all workers use |
| `infrastructure/docker/docker-compose.dev.yml` | How to start the local environment |

---

*Last updated: See [`Logs.md`](./Logs.md)*
