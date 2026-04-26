# Origin Provenance Log

**WorkSafe — Occupational Health Platform**
*A formal record of this project's creation, ownership, and development history.*

---

## Ownership Declaration

| Field | Value |
|---|---|
| **Project Name** | WorkSafe — Occupational Health Platform |
| **Sole Creator** | Aryan Rajendra Suthar |
| **Owner Email** | aryanrajendrasuthar@gmail.com |
| **Type of Work** | Original software — not a fork, derivative, or academic assignment copy |
| **Creation Year** | 2026 |
| **Repository Host** | GitHub |
| **Branch of record** | `main` |

---

## Origin Story

WorkSafe was conceived by Aryan Rajendra Suthar as an enterprise SaaS platform
addressing musculoskeletal (MSK) injury prevention in occupational settings. The
concept arose from identifying a gap in tools available to occupational health
teams: no unified platform existed that combined daily worker health check-ins,
AI-assisted risk scoring, guided physiotherapy programs, clinician dashboards,
and enterprise compliance (OSHA reporting) in a single, role-aware system.

The design was shaped around five distinct user roles — Worker, Therapist, Safety
Manager, HR Admin, and Company Admin — each with their own workflows, data
access boundaries, and product goals. The architecture was designed from scratch
by the Owner, with no prior codebase, template, or copied project as a starting
point.

---

## Timeline of Creation

### Pre-Repository Phase

| Date | Event |
|---|---|
| On or before 2026-04-20 | Concept documentation written; `docs/WORKSAFE.docx` created (filesystem timestamp: 2026-04-20 01:02) |
| 2026-04-20 | Product requirements, architecture, and feature scope documented in `docs/WORKSAFE.docx` |

### Repository Phase

| Date | Git Commit Hash | Event |
|---|---|---|
| 2026-04-21 14:04 | `9fc52292` | **Initial commit** — sprint-1/WorkSafe: monorepo structure, authentication, role layouts, worker onboarding |
| 2026-04-21 16:51 | `82cc77e1` | Sprint 2: Worker core — body map check-ins, exercise programs, mobile responsive layout |
| 2026-04-21 17:13 | `138acc0c` | Sprint 3: Therapist dashboard, program builder, escalation alerts, incident logging |
| 2026-04-21 20:51 | `9a54684c` | Sprint 4: Backend risk module — org risk intelligence, safety manager dashboard, alert system |
| 2026-04-21 22:28 | `f74e6c17` | Sprint 5: OSHA reports, RTW workflow, HR admin, audit logs |
| 2026-04-21 22:43 | `5e41efba` | Sprint 6: Polish, dark mode, PWA, code splitting, predictive risk, DB indexes |
| 2026-04-22 17:21 | `6fc9de3c` | Role management UI, primary admin account lock |
| 2026-04-22 17:46 | `5c6e54d2` | Bug fixes and refinements |
| 2026-04-23 16:35 | `c6280ddc` | Full stack stabilization and testing |
| 2026-04-23 16:38 | `962c8e41` | Error fixes |
| 2026-04-23 16:47 | `02f8944f` | Error fixes (second pass) |
| 2026-04-25 15:04 | `56058c9a` | Modified flow, features, and architecture |
| 2026-04-25 15:09 | `d41b7993` | README comprehensive update |
| 2026-04-25 15:53 | `21f47f52` | Real-time notifications (SSE) implementation |
| 2026-04-25 20:17 | `b283df71` | Complete implementation — all features |
| 2026-04-26 01:26 | `d51abb89` | Final implementations: MFA, SAML SSO, BullMQ reminders, exercise timer redesign |

---

## Technology Authorship

All of the following were conceived and implemented solely by Aryan Rajendra Suthar:

- Full-stack monorepo architecture (NestJS + React + PostgreSQL)
- Five-role RBAC permission model and data isolation boundaries
- Body-map pain capture UI (interactive SVG with per-area intensity sliders)
- Risk scoring algorithm (rolling 7-day window, escalation detection, threshold alerts)
- Guided session player (set/rep progression, timed hold exercises, rest timer, pain flags)
- Post-session work readiness feedback system
- Nine-tier occupational health achievement system
- OSHA 300-log report generation
- Return-to-work (RTW) milestone tracking for injury lifecycle management
- Real-time notification system (Server-Sent Events)
- JWT access + refresh token rotation with automatic silent renewal
- MFA/TOTP setup and challenge-token verification flow
- SAML 2.0 SSO integration
- BullMQ-based scheduled reminder system

---

## Ownership Affirmation

This log serves as a formal declaration that WorkSafe in its entirety — including
all source code, product design, data architecture, UI/UX, and documentation —
is the original, independent work of Aryan Rajendra Suthar, created in April 2026.

No part of this project was created by a third party, acquired through purchase,
or derived from another existing project. All open-source libraries used are
acknowledged in `NOTICE`.

---

*Last updated: 2026-04-26*
*Author: Aryan Rajendra Suthar*
