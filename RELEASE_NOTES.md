# Release Notes

**WorkSafe — Occupational Health Platform**
Copyright (c) 2026 Aryan Rajendra Suthar. All Rights Reserved.

This changelog serves as a milestone-based record of the project's development
history, derived from the git commit log and sprint structure.

---

## v1.2.0 — Advanced Features & Security Hardening
**Date:** 2026-04-26
**Git commits:** `56058c9a`, `d41b7993`, `21f47f52`, `b283df71`, `d51abb89`
**Author:** Aryan Rajendra Suthar

### Added
- **MFA/TOTP** — Full multi-factor authentication: setup flow with QR code,
  verify-setup, disable (requires valid TOTP code), challenge-token login for
  email/password and SSO paths
- **SAML 2.0 SSO** — Enterprise single sign-on via `@node-saml/passport-saml`;
  `GET /auth/saml` initiates, `POST /auth/saml/callback` validates and issues tokens
- **Real-time notifications** — Server-Sent Events (SSE) stream delivers in-app
  toasts (top-right) on any page; color-coded by notification type
- **Browser push notifications** — VAPID-based web push with graceful fallback
  when keys are not configured
- **BullMQ scheduled reminders** — Daily 8 AM check-in reminder for workers
  with active programs who haven't checked in; 3-day session reminder for
  workers with no recent sessions (`EXERCISE_REMINDER` notification type)
- **SendGrid email integration** — Password reset, invite, and welcome emails;
  graceful console fallback when API key is a placeholder
- **Profile page** — Workers and all roles can view/edit name, avatar URL,
  and change password via `/profile`
- **Settings page** — Theme picker, browser push notification toggle, MFA
  setup/disable flow, account actions via `/settings`
- **Avatar dropdown in TopBar** — Profile, Settings, and Sign out options
- **Exercise timer redesign** — Replaced circular ring with full-width draining
  progress bar (brand gradient, tick marks, animated countdown) for timed holds;
  large rep counter with dot grid for rep-based exercises
- **Work readiness assessment** — Branching first step before body map: Full
  Duty / Modified Capacity / Recovery Mode; persisted and surfaced to clinicians

### Fixed
- **Cross-user data isolation** — `queryClient.clear()` called at all login and
  logout entry points to prevent React Query cache leakage between user sessions
- **SSE stream corruption** — Global `TransformInterceptor` was wrapping
  `MessageEvent` objects; fixed by detecting `Accept: text/event-stream` header
- **Vite SSE proxy buffering** — Dev EventSource connects directly to API port
  to bypass Vite proxy buffering of streaming responses
- **COMPANY_ADMIN nav** — `/admin/departments` link corrected to `/hr/departments`

---

## v1.1.0 — Role Management & Stabilization
**Date:** 2026-04-22 – 2026-04-23
**Git commits:** `6fc9de3c`, `5c6e54d2`, `d15a0a73`, `9fa91e36`, `c6280ddc`, `962c8e41`, `02f8944f`
**Author:** Aryan Rajendra Suthar

### Added
- **Role management UI** — Company Admin can change user roles via dropdown;
  role change is reflected immediately without page reload
- **Primary admin account lock** — The `aryanrajendrasuthar@gmail.com` account
  cannot have its role changed or be deactivated by any user in the organization;
  enforced in the backend with HTTP 403

### Fixed
- Various authentication and token refresh edge cases
- TypeScript type errors across API and frontend
- Cross-browser layout issues in the session player

---

## v1.0.0 — Full MVP (Sprint 6 Complete)
**Date:** 2026-04-21 22:43
**Git commit:** `5e41efba`
**Author:** Aryan Rajendra Suthar

### Summary
First complete, multi-role MVP covering all five user roles.

### Included features
- Dark mode (Zustand + Tailwind dark class strategy)
- PWA support (vite-plugin-pwa, Workbox service worker)
- Code splitting (React.lazy + Suspense)
- Database indexes for query performance
- Accessibility improvements (ARIA labels, keyboard navigation)
- Full CI pipeline (GitHub Actions: ESLint + TypeScript)

---

## v0.5.0 — Enterprise Tier (Sprint 5)
**Date:** 2026-04-21 22:28
**Git commit:** `f74e6c17`
**Author:** Aryan Rajendra Suthar

### Added
- OSHA 300-log report generation (year-filtered, printable)
- RTW (return-to-work) milestone tracking for injury lifecycle (Light → Modified → Full Duty)
- HR Admin: employee roster with role/department management
- HR Admin: invite token creation by role, copy link, revoke
- Company Admin: full team member list with role change
- Immutable audit log (all API mutations logged with user, IP, resource, action)
- Company Admin org settings page

---

## v0.4.0 — Risk Engine (Sprint 4)
**Date:** 2026-04-21 20:51
**Git commit:** `9a54684c`
**Author:** Aryan Rajendra Suthar

### Added
- Risk scoring algorithm: `min(100, round(avgPainIntensity × 10))` over last 7 check-ins
- Safety Manager dashboard: KPI cards, 90-day area chart, department heatmap
- Department drill-down: risk distribution by body region, program compliance rate
- Threshold alert system: org risk ≥ 65, dept risk ≥ 70, check-in compliance < 50%
- Alert acknowledgment and resolution workflow
- Escalation detection: rolling 7-day delta comparison, predictive flag at risk ≥ 30 + upward trend

---

## v0.3.0 — Therapist Dashboard (Sprint 3)
**Date:** 2026-04-21 17:13
**Git commit:** `138acc0c`
**Author:** Aryan Rajendra Suthar

### Added
- Therapist worker roster with risk-sorted list and escalation badges
- Worker detail: multi-line pain trend chart, check-in log, session feedback history
- Program builder: create programs with drag-ordered exercises, assign to workers
- Incident logging with status lifecycle (Open → Under Review → Resolved)
- Escalation alert system (workers with rising pain flagged automatically)

---

## v0.2.0 — Worker Core (Sprint 2)
**Date:** 2026-04-21 16:51
**Git commit:** `82cc77e1`
**Author:** Aryan Rajendra Suthar

### Added
- Interactive SVG body map with per-area pain intensity sliders
- Daily check-in 4-step flow (work readiness → body map → details → status + notes)
- Exercise library browser
- Program cards and guided session player foundation
- Circular rest timer with conic-gradient ring
- Set-by-set progression with set badge
- Pain flag per exercise set
- Mobile-responsive layout throughout

---

## v0.1.0 — Foundation (Sprint 1)
**Date:** 2026-04-21 14:04
**Git commit:** `9fc52292` (initial commit)
**Author:** Aryan Rajendra Suthar

### Added
- pnpm monorepo with `apps/api`, `apps/web`, `packages/shared`
- NestJS API with Prisma 7 (PostgreSQL 16)
- JWT access + refresh token authentication (bcrypt, Passport local strategy)
- Google OAuth 2.0 (Passport google strategy)
- Five-role RBAC: WORKER, THERAPIST, SAFETY_MANAGER, HR_ADMIN, COMPANY_ADMIN
- Role-aware sidebar navigation (`AppSidebar`)
- Worker onboarding flow
- React 18 + Vite + TypeScript + Tailwind CSS v3 frontend
- shadcn/ui component system
- Zustand auth store with token persistence
- TanStack Query v5 data fetching layer
- Swagger API documentation at `/api/docs`
- Docker Compose for local PostgreSQL

---

*All releases authored exclusively by Aryan Rajendra Suthar.*
*Copyright (c) 2026 Aryan Rajendra Suthar. All Rights Reserved.*
