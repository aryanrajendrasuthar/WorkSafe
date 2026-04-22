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
  docker-compose.yml  (optional — see Local Setup)
```

**Tech stack:**

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v3, shadcn/ui, Framer Motion |
| State | Zustand, TanStack Query v5 |
| Charts | Recharts |
| Backend | NestJS, TypeScript, Prisma 7 (adapter-based) |
| Database | PostgreSQL 16 |
| Auth | Passport.js, JWT (access + refresh token rotation), bcrypt |
| Jobs | BullMQ + Redis |
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

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit `apps/api/.env` — set at minimum:

```env
DATABASE_URL="postgresql://worksafe:worksafe@localhost:5432/worksafe_db"
JWT_SECRET="change-me-in-production"
JWT_REFRESH_SECRET="change-me-in-production-2"
```

### 3. Database

```bash
# Start PostgreSQL (Homebrew)
brew services start postgresql@16

# Create database and user (first time only)
psql postgres -c "CREATE USER worksafe WITH PASSWORD 'worksafe' CREATEDB;"
psql postgres -c "CREATE DATABASE worksafe_db OWNER worksafe;"

# Run migrations
pnpm --filter api run db:migrate

# Seed demo data
pnpm --filter api run db:seed
```

### 4. Start development servers

```bash
# In separate terminals (or use pnpm --parallel):
pnpm --filter api run dev    # NestJS on :3001
pnpm --filter web run dev    # Vite on :3000
```

API docs (Swagger): http://localhost:3001/api/docs

---

## Seeded Demo Accounts

| Role | Email | Password |
|---|---|---|
| Worker | worker@demo.worksafe.com | password123 |
| Therapist | therapist@demo.worksafe.com | password123 |
| Safety Manager | safety@demo.worksafe.com | password123 |
| HR Admin | hr@demo.worksafe.com | password123 |
| Company Admin | admin@demo.worksafe.com | password123 |

---

## Features by Role

### Worker
- **Daily check-in** — 60-second mobile-first body map flow with per-area intensity sliders
- **Pain history** — 30-day trend chart by body region
- **Exercise programs** — sequential exercise cards, session tracking, completion rings
- **Streak tracking** — 7/30/100-day achievement badges
- **Notifications** — in-app alert center with unread count

### Therapist
- **Worker roster** — risk-sorted list with escalation badges, trend indicators
- **Worker detail** — multi-line pain trend chart, RTW milestones, check-in log
- **Program builder** — create/edit programs with drag-ordered exercises
- **Incident management** — log incidents, track RTW milestones (Light → Modified → Full Duty)
- **Escalation alerts** — workers with rising pain intensity over 7 days

### Safety Manager
- **Org risk dashboard** — KPI cards, 90-day area chart, department heatmap
- **Department drill-down** — dept-scoped risk distribution, body region BarChart, program compliance
- **Alert management** — threshold-based org/dept/compliance alerts with acknowledge/resolve workflow
- **OSHA reports** — 300-log table, summary stats, year-filtered view (printable)

### HR Admin
- **Employee roster** — search + role filter, activate/deactivate workers
- **Department management** — create, edit, delete departments
- **Invite management** — email invites with role assignment, copy invite link, revoke

### Company Admin
- **Audit log** — complete history of all mutating API actions with method badges, IP, user info
- **Billing** — subscription tier display, plan comparison grid

---

## Risk Scoring

```
riskScore = min(100, round(avgPainIntensity × 10))
  where avgPainIntensity = mean(last 7 check-ins × all body area intensities)

riskLevel:
  low      < 25
  medium   < 50
  high     < 75
  critical ≥ 75

Escalation detection:
  - Compare first-half vs second-half avg intensity over 14 check-ins
  - delta > 0.5 → trend = 'up'
  - Predictive flag: trend === 'up' && riskScore >= 30
```

Org/dept alert thresholds (configurable):
- Org risk score ≥ 65
- Dept risk score ≥ 70
- Check-in compliance < 50%

---

## Database Schema Highlights

- **User + JobProfile** — role-based access, department assignment, physical demand level
- **DailyCheckin + BodyAreaEntry** — daily pain capture, body part + intensity + severity
- **Exercise + Program + ProgramExercise** — library → ordered program → worker assignment
- **WorkerProgram + SessionLog** — progress tracking per worker
- **Incident + RTWMilestone** — injury lifecycle with clearance sign-off
- **RiskScore** — computed worker/dept/org scores persisted with factors JSON
- **Alert** — threshold breach notifications with acknowledgment workflow
- **AuditLog** — full API mutation history
- **Notification** — in-app + email notification center

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
