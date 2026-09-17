# 📋 Changelog

All notable changes to the Relay are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
and [Semantic Versioning](https://semver.org/).

---

## Format

```
## [version] — YYYY-MM-DD
### Added       → New features
### Changed     → Changes to existing features
### Fixed       → Bug fixes
### Removed     → Removed features
### Security    → Security patches
### Deprecated  → Features to be removed in a future version
```

---

## [Unreleased]

### Added
- Initial repository setup
- README, CONTRIBUTING, and full documentation
- GitHub Actions workflow for Discord notifications
- Base monorepo structure with npm workspaces

---

## Releases

*No releases yet. First release will be tagged once the MVP is complete.*

---

## Roadmap

### v0.1.0 — Foundation (MVP Phase 1)
- [ ] NestJS API service with authentication
- [ ] BullMQ + Redis queue setup
- [ ] Email worker (SendGrid integration)
- [ ] PostgreSQL schema + Prisma migrations
- [ ] Docker Compose dev environment
- [ ] GitHub Actions CI (lint + test + build)

### v0.2.0 — Channel Expansion (MVP Phase 2)
- [ ] SMS worker (Twilio)
- [ ] Push worker (FCM)
- [ ] Webhook worker
- [ ] Exponential backoff retry logic
- [ ] Dead letter queue

### v0.3.0 — Dashboard (MVP Phase 3)
- [ ] Next.js dashboard bootstrap
- [ ] Delivery analytics page
- [ ] Template editor
- [ ] Dead letter retry UI

### v0.4.0 — Multi-Tenancy
- [ ] Tenant isolation at DB level
- [ ] Per-tenant channel configuration
- [ ] API key management UI
- [ ] Rate limiting per tenant

### v1.0.0 — Public Release
- [ ] Full test coverage
- [ ] Production Docker Compose
- [ ] Railway one-click deploy
- [ ] Public documentation site
