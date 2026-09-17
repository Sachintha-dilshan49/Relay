# 🤝 Contributing to Relay

Welcome! Relay is an open-source project maintained by the **Open Circle** community on Discord.
We built this platform specifically so that future interns and students can contribute to real, production-grade backend systems.

You don't need to understand the whole system. Pick a module, pick an issue, and ship code. That's it.

---

## 📋 Table of Contents

- [Before You Start](#-before-you-start)
- [How to Pick an Issue](#-how-to-pick-an-issue)
- [Setting Up Locally](#-setting-up-locally)
- [Branch Naming Convention](#-branch-naming-convention)
- [Commit Message Convention](#-commit-message-convention)
- [Submitting a Pull Request](#-submitting-a-pull-request)
- [PR Review Process](#-pr-review-process)
- [Code Style Guidelines](#-code-style-guidelines)
- [Issue Labels Explained](#-issue-labels-explained)
- [Community & Support](#-community--support)

---

## 👋 Before You Start

1. **Star the repository** so you can follow updates
2. **Join the Open Circle Discord** server and introduce yourself in `#introductions`
3. **Read the docs** — at minimum [`docs/Architecture.md`](./docs/Architecture.md) and [`docs/FolderStructure.md`](./docs/FolderStructure.md)
4. **Don't ask to be assigned** — just comment on an issue that you're working on it and start

---

## 🎯 How to Pick an Issue

Go to the [Issues tab](https://github.com/open-circle-org/relay/issues) and filter by label:

| Label | Meaning |
|---|---|
| `good-first-issue` | Start here if you're new |
| `backend` | API service, queue, worker logic |
| `frontend` | Dashboard, UI components |
| `devops` | Docker, CI/CD, GitHub Actions |
| `testing` | Unit / integration tests |
| `documentation` | Markdown docs, code comments |
| `bug` | Something is broken |
| `enhancement` | New feature or improvement |
| `help-wanted` | Needs attention from community |

**Never worked on open source before?** Look for `good-first-issue` + `documentation` first. Writing or improving a doc is a real contribution.

**Intermediate?** Look for `good-first-issue` + `backend` or `frontend`.

**Confident?** Take any open `enhancement` or `bug` issue.

---

## 💻 Setting Up Locally

### Prerequisites
- Node.js v20+
- Docker + Docker Compose
- Git

### Steps

```bash
# 1. Fork the repo (click Fork on GitHub first)

# 2. Clone YOUR fork
git clone https://github.com/YOUR_USERNAME/relay.git
cd relay

# 3. Add upstream remote
git remote add upstream https://github.com/open-circle-org/relay.git

# 4. Install all dependencies
npm install

# 5. Start infrastructure
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d

# 6. Set up environment
cp apps/api/.env.example apps/api/.env
# Edit .env with your local values

# 7. Run DB migrations
cd packages/database && npx prisma migrate dev && cd ../..

# 8. Start development
npm run dev   # Starts API + Dashboard together
```

---

## 🌿 Branch Naming Convention

Always branch off from `dev`, never from `main`.

```bash
git checkout dev
git pull upstream dev
git checkout -b <type>/<short-description>
```

**Branch name format:** `type/short-description`

| Type | When to Use |
|---|---|
| `feature/` | Adding new functionality |
| `fix/` | Fixing a bug |
| `docs/` | Documentation changes only |
| `refactor/` | Code improvement, no feature change |
| `test/` | Adding or fixing tests |
| `chore/` | Config, deps, CI changes |

**Examples:**
```
feature/email-worker-retry-logic
fix/queue-deadlock-on-startup
docs/update-architecture-diagram
test/api-key-validation-unit-tests
chore/update-prisma-to-v6
```

---

## 💬 Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <short description>
```

**Types:** `feat` · `fix` · `docs` · `refactor` · `test` · `chore`

**Scope** (optional but recommended): `api` · `email-worker` · `sms-worker` · `push-worker` · `webhook-worker` · `queue` · `dashboard` · `db` · `docker` · `ci`

**Examples:**
```
feat(email-worker): add exponential backoff on send failure
fix(queue): resolve race condition on concurrent job pickup
docs(architecture): add sequence diagram for failure path
test(api): add unit tests for API key validation
chore(ci): add lint step to GitHub Actions workflow
refactor(dashboard): extract retry panel into own component
```

**Rules:**
- Use present tense: `add` not `added`
- Keep the first line under 72 characters
- No period at the end of the subject line
- Add a body if the change needs explanation

---

## 📬 Submitting a Pull Request

1. Make sure your branch is up to date with `dev`:
   ```bash
   git fetch upstream
   git rebase upstream/dev
   ```

2. Run linting and tests locally before pushing:
   ```bash
   npm run lint
   npm run test
   ```

3. Push your branch to **your fork**:
   ```bash
   git push origin feature/your-branch-name
   ```

4. Open a Pull Request on GitHub:
   - **Base branch:** `dev` ← NOT `main`
   - **Title:** follow the commit convention format
   - **Description:** fill in the PR template (what, why, screenshots if UI)
   - **Link the issue:** add `Closes #<issue-number>` in the description

5. Wait for Red Team review. Don't merge your own PR.

---

## 🔍 PR Review Process

All PRs are reviewed by the **Red Team** (maintainers).

| Step | Who | What happens |
|---|---|---|
| PR opened | Contributor | Automated checks run (lint, test, build) |
| Review assigned | Red Team | Red Team member picks up the PR |
| Feedback given | Red Team | Comments, change requests, or approval |
| Changes made | Contributor | Push new commits to the same branch |
| Approved | Red Team | PR merged into `dev` |
| Release | Red Team | `dev` → `main` on scheduled releases |

**Response time:** Red Team aims to review within **48 hours**. If no response after 72 hours, ping in `#pr-review` on Discord with your PR link.

**What gets rejected:**
- PRs against `main` directly
- Missing tests for backend logic
- Breaking changes without discussion in an issue first
- PR that doesn't link to an issue

---

## 🎨 Code Style Guidelines

### TypeScript
- Use strict TypeScript. No `any` unless absolutely unavoidable and justified in a comment
- Always type function parameters and return values
- Use interfaces over type aliases for object shapes

### NestJS (API)
- One controller per route group
- Business logic goes in Services, not Controllers
- DTOs for all request bodies with validation decorators

### React / Next.js (Dashboard)
- Functional components only
- One component per file
- Keep components under ~150 lines; extract if larger

### General
- No commented-out code in PRs
- No `console.log` in production code (use the Logger service)
- Write tests for all non-trivial logic

---

## 🏷️ Issue Labels Explained

| Label | Color | Meaning |
|---|---|---|
| `good-first-issue` | 🟢 Green | Safe starting point for new contributors |
| `backend` | 🔵 Blue | Involves API / workers / queue |
| `frontend` | 🟣 Purple | Involves dashboard / UI |
| `devops` | 🟠 Orange | Docker / CI / infra |
| `testing` | 🟡 Yellow | Test coverage work |
| `documentation` | ⚪ Grey | Docs only |
| `bug` | 🔴 Red | Something is broken |
| `enhancement` | 🔵 Blue | New feature |
| `help-wanted` | 🟤 Brown | Needs community input |
| `blocked` | ⬛ Black | Waiting on another issue/PR |
| `wontfix` | ⬜ White | Decided not to implement |

---

## 💬 Community & Support

- **Discord:** Join `#open-circle` → `#general`, `#pr-review`, `#questions`
- **Issues:** For bugs or feature requests
- **Discussions:** For architecture questions or ideas before opening an issue

If you're stuck on a setup issue, post in `#questions` on Discord with:
1. What you're trying to do
2. What error you're getting
3. What you've already tried

We're here to help.

---

> *Built by the Open Circle community — for the next generation of developers.*
