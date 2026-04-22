# WorkSafe — Occupational Health Platform

Enterprise SaaS platform for musculoskeletal injury prevention and return-to-work management.

---

## Architecture

```
worksafe/
  apps/
    web/          React 18 + Vite + TypeScript (port 3000)
    api/          NestJS + TypeScript (port 3001)
  packages/
    shared/       Shared TS types and enums
```

**Tech stack:**

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v3, shadcn/ui, Framer Motion |
| State | Zustand, TanStack Query v5 |
| Charts | Recharts |
| Backend | NestJS, TypeScript, Prisma 7 (adapter-based) |
| Database | PostgreSQL 16 |
| Auth | Passport.js, JWT (access + refresh token rotation), bcrypt, Google OAuth 2.0 |
| PWA | vite-plugin-pwa + Workbox |

---

## Local Setup

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- PostgreSQL 16 (Homebrew: `brew install postgresql@16`)

### 1. Clone and install

```bash
git clone <repo-url>
cd worksafe
pnpm install
```

### 2. Environment variables

Copy the example and fill in your values:

```bash
cp apps/api/.env.example apps/api/.env
```

The required fields are documented in the [Environment Variables](#environment-variables) section below.

### 3. Database

```bash
# Start PostgreSQL (Homebrew)
brew services start postgresql@16

# Create database and user (first time only)
psql postgres -c "CREATE USER worksafe WITH PASSWORD 'worksafe_dev_secret' CREATEDB;"
psql postgres -c "CREATE DATABASE worksafe_db OWNER worksafe;"

# Run migrations
pnpm --filter api run db:migrate

# Seed demo data
pnpm --filter api run db:seed
```

### 4. Start development servers

```bash
# Terminal 1 — NestJS API on :3001
pnpm --filter api run dev

# Terminal 2 — Vite frontend on :3000
pnpm --filter web run dev
```

- App: http://localhost:3000
- API docs (Swagger): http://localhost:3001/api/docs

> **Important:** Always start the API (`pnpm --filter api run dev`) before the frontend. If you see login errors after restarting your machine, there may be stale Node processes — run `pkill -f "nest start"` then restart the API.

---

## Environment Variables

All variables live in `apps/api/.env`. Copy from `apps/api/.env.example` and fill in:

### Required (app won't start without these)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://worksafe:secret@localhost:5432/worksafe_db` |
| `JWT_SECRET` | Secret for signing access tokens | Any long random string |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | A different long random string |

Generate secure secrets with:
```bash
openssl rand -base64 64
```

### Google OAuth (required for "Continue with Google")

| Variable | Description | Where to get it |
|---|---|---|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret | Same as above |
| `GOOGLE_CALLBACK_URL` | Must match your Google Console setting | `http://localhost:3001/auth/google/callback` (dev) |

**Google Cloud Console setup:**
1. Create a project → Enable "Google+ API" and "People API"
2. OAuth consent screen → External → add your email as test user
3. Credentials → Create OAuth 2.0 Client ID → Web application
4. Add `http://localhost:3001/auth/google/callback` to Authorized redirect URIs

### JWT configuration (optional, defaults shown)

| Variable | Default | Description |
|---|---|---|
| `JWT_ACCESS_EXPIRES` | `15m` | How long access tokens live |
| `JWT_REFRESH_EXPIRES` | `7d` | How long refresh tokens live |

Access tokens auto-refresh silently in the frontend. When a 401 is received, the refresh token is used to get a new access token without logging the user out.

### Email — not yet implemented

The `SENDGRID_API_KEY` and `EMAIL_FROM` variables are in `.env` but **email sending is not implemented yet**. Invitation links are stored in the database and can be copied manually from the HR Admin → Invites page. No emails are sent currently.

**When you're ready to add email:**
1. Sign up at [sendgrid.com](https://sendgrid.com) (free tier: 100 emails/day)
2. Verify a sender email address
3. Create an API key and add it to `.env`
4. An `EmailService` class needs to be built in `apps/api/src/notifications/`

### Stripe — not integrated

`STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are placeholders. The billing UI exists (Company Admin → Billing) but payment processing is not wired up.

---

## Demo Accounts

These are created by the seed (`pnpm --filter api run db:seed`):

| Role | Email | Password |
|---|---|---|
| Worker | worker@demo.worksafe.com | Password123! |
| Therapist | therapist@demo.worksafe.com | Password123! |
| Safety Manager | safety@demo.worksafe.com | Password123! |
| HR Admin | hr@demo.worksafe.com | Password123! |
| Company Admin | admin@demo.worksafe.com | Password123! |

The seed is idempotent — safe to run multiple times.

---

## Features by Role

### Worker
- **Daily check-in** — 60-second mobile-first body map flow with per-area intensity sliders
- **Pain history** — 30-day trend chart by body region
- **Exercise programs** — sequential exercise cards, session tracking, completion rings
- **Streak tracking** — achievement badges at 7, 30, and 100-day streaks
- **Notifications** — in-app alert center with unread count

### Therapist
- **Worker roster** — risk-sorted list with escalation badges and trend indicators
- **Worker detail** — multi-line pain trend chart, RTW milestones, check-in log table
- **Program builder** — create/edit programs with drag-ordered exercises, assign to workers
- **Incident management** — log incidents, track RTW milestones (Light → Modified → Full Duty)
- **Escalation alerts** — workers with rising pain intensity flagged automatically

### Safety Manager
- **Org risk dashboard** — KPI cards, 90-day area chart, department risk heatmap
- **Department drill-down** — dept-level risk distribution, body regions, program compliance
- **Alert management** — threshold-based alerts (org/dept/compliance) with acknowledge/resolve
- **OSHA reports** — 300-log table, summary stats, year-filtered, printable

### HR Admin
- **Employee roster** — search + role filter, activate/deactivate workers
- **Department management** — create, edit, delete departments
- **Invite management** — create invite links by role, copy link, revoke

### Company Admin
- **Audit log** — full history of all mutating API actions with user, IP, and resource
- **Billing UI** — subscription tier display and plan comparison (payment not wired up)

---

## Risk Scoring

```
riskScore = min(100, round(avgPainIntensity × 10))
  where avgPainIntensity = mean of all body area intensities across last 7 check-ins

riskLevel:
  low      < 25
  medium   < 50
  high     < 75
  critical ≥ 75

Escalation detection (7-day rolling):
  - Compare first-half vs second-half avg intensity
  - delta > 0.5  → trend = 'up'
  - delta < -0.5 → trend = 'down'
  - Predictive flag: trend === 'up' && riskScore >= 30

Org/dept alert thresholds:
  - Org risk score ≥ 65
  - Dept risk score ≥ 70
  - Check-in compliance < 50%
```

---

## API Reference

Base URL: `http://localhost:3001`  
Full Swagger docs: http://localhost:3001/api/docs

**Auth**
```
POST /auth/register          Create new org + admin account
POST /auth/login             Email + password login
POST /auth/refresh           Refresh access token
POST /auth/logout            Invalidate refresh token
GET  /auth/me                Get current user
GET  /auth/google            Initiate Google OAuth
GET  /auth/google/callback   Google OAuth callback
POST /auth/invite/create     Create invite link (Admin/HR)
POST /auth/invite/accept     Register via invite token
```

**Worker**
```
POST /workers/onboarding     Complete worker onboarding
POST /checkins               Submit daily check-in
GET  /checkins/history       Get check-in history
GET  /exercises              Browse exercise library
GET  /programs               Get programs assigned to me
POST /programs/:id/sessions  Log a session completion
```

**Therapist**
```
GET  /therapist/workers         Worker roster with risk scores
GET  /therapist/workers/:id     Worker detail with pain trend
GET  /therapist/escalations     Workers with rising pain trend
POST /programs                  Create a program
PUT  /programs/:id              Edit a program
POST /programs/:id/assign       Assign to worker(s)
GET  /programs/org              All org programs
POST /incidents                 Log an incident
GET  /incidents                 List incidents
GET  /incidents/:id             Incident detail
PATCH /incidents/:id/status     Update incident status
POST /incidents/:id/milestones  Add RTW milestone
PATCH /incidents/milestones/:id/clear  Clear a milestone
```

**Safety Manager / Company Admin**
```
GET  /risk/summary              Org-wide risk summary + dept scores
GET  /risk/departments/:id      Department risk detail
GET  /risk/alerts               Active alerts
PATCH /risk/alerts/:id/acknowledge
PATCH /risk/alerts/:id/resolve
GET  /risk/check-alerts         Manually trigger alert check
POST /incidents/osha            OSHA report (query: ?year=2026)
```

**HR Admin**
```
GET  /hr/stats                  Org stats (workers, depts, invites)
GET  /hr/users                  Full employee roster
PATCH /hr/users/:id/role        Change user role
PATCH /hr/users/:id/department  Move to department
PATCH /hr/users/:id/deactivate  Deactivate user
PATCH /hr/users/:id/reactivate  Reactivate user
GET  /hr/departments            List departments
POST /hr/departments            Create department
PATCH /hr/departments/:id       Edit department
DELETE /hr/departments/:id      Delete department
GET  /hr/invites                List all invites
DELETE /hr/invites/:id          Revoke invite
GET  /hr/audit-logs             Recent audit log entries
```

---

## Database Schema Highlights

- **User + JobProfile** — role-based access, department assignment, physical demand level
- **DailyCheckin + BodyAreaEntry** — daily pain capture, body part + intensity + severity
- **Exercise + Program + ProgramExercise** — library → ordered program → worker assignment
- **WorkerProgram + SessionLog** — per-worker progress tracking
- **Incident + RTWMilestone** — injury lifecycle with milestone sign-offs
- **RiskScore** — computed scores persisted with contributing factors JSON
- **Alert** — threshold-breach notifications with acknowledgment workflow
- **AuditLog** — full API mutation history (action, resource, user, IP)
- **Notification** — in-app notification model (email sending not yet implemented)
- **InviteToken** — invite-based registration links with expiry and role assignment

---

## Project Structure

```
apps/api/src/
  auth/           JWT, Passport, Google OAuth, invite tokens
  workers/        Worker onboarding
  checkins/       Daily check-in submission + history
  exercises/      Exercise library
  programs/       Program CRUD + session logging
  therapist/      Therapist-scoped worker data + escalation detection
  incidents/      Incident logging + RTW milestones + OSHA reports
  risk/           Risk score engine + alerts
  hr/             HR admin: users, departments, invites, audit logs
  users/          User profile management
  prisma/         Database client service
  common/         Global exception filter, transform interceptor, audit interceptor

apps/web/src/
  pages/
    Landing.tsx               Public marketing page
    auth/                     Login, Register, InviteAccept, GoogleCallback
    Terms.tsx, Privacy.tsx    Legal pages
    worker/                   Dashboard, Checkin, Exercises, Programs, Onboarding
    therapist/                Dashboard, Workers, WorkerDetail, Programs, ProgramBuilder, Incidents, IncidentDetail
    safety-manager/           Dashboard, Departments, DepartmentDetail, Alerts, OshaReports
    hr-admin/                 Dashboard, Employees, DepartmentsPage, Invites
    company-admin/            Dashboard, AuditLog, Billing
  components/
    layout/                   AppLayout, AppSidebar, TopBar
    ui/                       shadcn/ui components
    BodyMap.tsx               Interactive SVG body map
    CheckinHeatmap.tsx        GitHub-style contribution heatmap
  store/
    auth.store.ts             Zustand auth state + token management
    theme.store.ts            Dark mode toggle with persistence
  lib/
    api.ts                    Axios instance + 401 refresh interceptor
    queryClient.ts            TanStack Query configuration
```

---

## Sprint History

| Tag | Sprint | Scope |
|---|---|---|
| `v0.1.0-sprint1` | Foundation | Monorepo, auth, role layouts, worker onboarding |
| `v0.2.0-sprint2` | Worker Core | Body map check-ins, exercise programs, mobile responsive |
| `v0.3.0-sprint3` | Therapist | Dashboard, program builder, escalation alerts, incident logging |
| `v0.4.0-sprint4` | Risk Engine | Org risk intelligence, safety manager dashboard, alert system |
| `v0.5.0-sprint5` | Enterprise | RTW workflow, OSHA reports, HR admin, audit logs |
| `v1.0.0` | Polish | Dark mode, PWA, code splitting, predictive risk, DB indexes, accessibility |

---

## CI

GitHub Actions runs on every push and PR:
- ESLint lint check
- TypeScript type check (both apps)

See `.github/workflows/ci.yml`.

---

## What's Not Implemented Yet

| Feature | Status | Notes |
|---|---|---|
| Email sending | Not built | `SENDGRID_API_KEY` is wired in env, `Notification` model exists in DB, but no `EmailService`. Invite links are copy-paste only. |
| Stripe billing | Not integrated | UI exists, payment processing not wired up |
| Push notifications | Not built | `NotificationChannel.PUSH` enum exists but no service worker push configured |
| MFA (TOTP) | Not built | `isMfaEnabled` / `mfaSecret` columns exist in `User` table |
| SAML SSO | Not built | Planned for enterprise tier |
| Redis / BullMQ queues | Not running | Risk score and notification jobs planned but not scheduled |
