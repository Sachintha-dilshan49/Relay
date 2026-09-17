# 🔔 Relay — Notification Infrastructure Platform

> An open-source, self-hostable notification delivery engine that lets any application send **email, SMS, push, and webhook** notifications through a single API call — with built-in queuing, retry logic, and a real-time monitoring dashboard.

---

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)
![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red)
![Built with NestJS](https://img.shields.io/badge/Backend-NestJS-red)
![Built with Next.js](https://img.shields.io/badge/Dashboard-Next.js-black)

---

## 📌 What Is This?

Most applications need to notify their users — confirmation emails, OTP SMS messages, payment alerts, or webhook callbacks. Building this reliably from scratch for every product is repetitive and error-prone.

**Relay** is a backend infrastructure platform that solves this once, reliably:

- **One API call** from your app triggers the notification
- The platform **queues** it, **selects the right channel**, **delivers** it, and **retries on failure**
- Everything is **tracked and visible** in a real-time dashboard

Think of it as a self-hosted, open-source alternative to [Novu](https://novu.co) or [SendGrid](https://sendgrid.com).

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT APPLICATION                │
│         (Any app that calls our REST API)           │
└───────────────────────┬─────────────────────────────┘
                        │ POST /notify
                        ▼
┌─────────────────────────────────────────────────────┐
│              API SERVICE  (NestJS)                  │
│   Auth → Validate → Template Fill → Route to Queue  │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│           QUEUE MANAGER  (BullMQ + Redis)           │
│   email-queue │ sms-queue │ push-queue │ webhook-q   │
└──────┬────────┴─────┬─────┴─────┬──────┴──────┬─────┘
       ▼              ▼           ▼              ▼
┌──────────┐  ┌──────────┐ ┌──────────┐ ┌───────────┐
│  Email   │  │   SMS    │ │   Push   │ │  Webhook  │
│  Worker  │  │  Worker  │ │  Worker  │ │  Worker   │
└──────────┘  └──────────┘ └──────────┘ └───────────┘
       │              │           │              │
       └──────────────┴───────────┴──────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│         PostgreSQL + Redis (State & Logs)           │
│   Templates │ API Keys │ Tenants │ Delivery Logs    │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│            DASHBOARD  (Next.js)                     │
│   Analytics │ Template Editor │ Retry Center        │
└─────────────────────────────────────────────────────┘

Failure Path:
  Worker fails → Retry (exponential backoff: 30s → 2m → 5m)
               → Dead Letter Queue → Dashboard Alert ❌
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend API | NestJS + TypeScript |
| Queue System | BullMQ + Redis |
| Workers | Node.js Microservices |
| Database | PostgreSQL + Prisma ORM |
| Cache / State | Redis |
| Dashboard | Next.js + Tailwind CSS + shadcn/ui |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Dev Hosting | Railway |

> Full details in [`docs/TechStack.md`](./docs/TechStack.md)

---

## 📁 Project Structure

```
relay/
├── apps/
│   ├── api/                  → NestJS backend (main API)
│   ├── dashboard/            → Next.js dashboard (frontend)
│   └── workers/
│       ├── email-worker/     → Email delivery microservice
│       ├── sms-worker/       → SMS delivery microservice
│       ├── push-worker/      → Push notification microservice
│       └── webhook-worker/   → Webhook delivery microservice
├── packages/
│   ├── shared-types/         → Shared TypeScript types
│   ├── shared-utils/         → Common utilities
│   └── database/             → Prisma schema + migrations
├── infrastructure/
│   └── docker/               → Docker Compose configs
├── docs/                     → Project documentation
└── .github/workflows/        → GitHub Actions CI/CD
```

> Full structure in [`docs/FolderStructure.md`](./docs/FolderStructure.md)

---

## 🚀 Quick Start (Local Development)

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v20+
- [Docker](https://www.docker.com/) + Docker Compose
- [Git](https://git-scm.com/)

### 1. Clone the repository

```bash
git clone https://github.com/open-circle-org/relay.git
cd relay
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start infrastructure (Redis + PostgreSQL)

```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d
```

### 4. Set up environment variables

```bash
cp apps/api/.env.example apps/api/.env
# Fill in your values
```

### 5. Run database migrations

```bash
cd packages/database
npx prisma migrate dev
```

### 6. Start the API

```bash
cd apps/api
npm run start:dev
```

### 7. Start the dashboard

```bash
cd apps/dashboard
npm run dev
```

The API runs at `http://localhost:3000` and the dashboard at `http://localhost:3001`.

---

## 📬 API Usage Example

Once running, any app can send a notification with a single API call:

```bash
curl -X POST http://localhost:3000/notify \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "channel": "email",
    "template": "order-confirmed",
    "data": {
      "name": "Kasun",
      "orderId": "#1234",
      "total": "Rs. 5,500"
    }
  }'
```

**Supported channels:** `email` · `sms` · `push` · `webhook` · `multi`

---

## 🤝 Contributing

We welcome contributions from everyone — especially interns and students building their portfolio.

**Good first issues** are labelled [`good-first-issue`](https://github.com/open-circle-org/relay/issues?q=label%3Agood-first-issue) on the Issues tab.

Every module is isolated — you don't need to understand the full system to contribute.

| Module | Difficulty | Good for |
|---|---|---|
| Email / SMS / Push Workers | ⭐⭐ | Beginners |
| Dashboard UI | ⭐⭐ | Frontend contributors |
| REST API endpoints | ⭐⭐⭐ | Backend contributors |
| Queue + Retry Logic | ⭐⭐⭐⭐ | Intermediate |
| Tests + Docs | ⭐ | Absolute beginners |

Read the full guide: [`CONTRIBUTING.md`](./CONTRIBUTING.md)

---

## 📄 Documentation

| Document | Description |
|---|---|
| [`docs/Architecture.md`](./docs/Architecture.md) | Full system architecture and component breakdown |
| [`docs/TechStack.md`](./docs/TechStack.md) | All technologies used and why |
| [`docs/FolderStructure.md`](./docs/FolderStructure.md) | Full monorepo folder structure explained |
| [`docs/Logs.md`](./docs/Logs.md) | Changelog and release notes |

---

## 📜 License

This project is licensed under the **MIT License**.
You are free to use, modify, and distribute this software.

---

<div align="center">
  Built with ❤️ by the <strong>Open Circle</strong> community<br/>
  Helping the next generation of developers build real things.
</div>
