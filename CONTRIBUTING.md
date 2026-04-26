# Contributing Guidelines

**WorkSafe — Occupational Health Platform**
Copyright (c) 2026 Aryan Rajendra Suthar. All Rights Reserved.

---

## This is a Proprietary, Single-Author Project

WorkSafe is not an open-source project. It is the exclusive intellectual
property of **Aryan Rajendra Suthar**.

External contributions are **not accepted** unless explicitly authorized in
writing by the Owner. Submitting a pull request or issue does not constitute
acceptance of a contribution and does not grant any rights over the codebase.

---

## For Authorized Reviewers

If you have been granted access for academic evaluation or code review:

- You may read and evaluate the code
- You may not submit pull requests, issues, or code changes
- You may not fork or clone this repository for any purpose other than review
- Your access is time-limited to the evaluation period

---

## For the Owner (Aryan Rajendra Suthar)

### Branch conventions

| Branch prefix | Purpose |
|---|---|
| `main` | Stable, production-ready code |
| `feature/` | New features under development |
| `fix/` | Bug fixes |
| `sprint/` | Sprint-based development milestones |
| `legal/` | IP, licensing, and provenance documentation |

### Commit message conventions

```
<type>: <short description>

Types: feat, fix, refactor, docs, chore, test, style
```

### Development workflow

1. Branch from `main`
2. Develop and commit with descriptive messages
3. Run `pnpm lint` and `pnpm typecheck` before merging
4. Merge to `main` when ready

### Code standards

- TypeScript strict mode in both `apps/api` and `apps/web`
- ESLint + Prettier enforced via CI
- All new API endpoints must have Swagger `@ApiOperation` decorators
- All new routes must be guarded with `JwtAuthGuard` + `RolesGuard`

---

## Intellectual Property

Any work performed on or contributed to this codebase — if authorized — remains
the property of Aryan Rajendra Suthar unless a separate written agreement
specifies otherwise.

Contact: aryanrajendrasuthar@gmail.com
