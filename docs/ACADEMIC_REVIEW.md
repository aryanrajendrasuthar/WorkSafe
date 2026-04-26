# Academic Review Notice

**WorkSafe — Occupational Health Platform**
Copyright (c) 2026 Aryan Rajendra Suthar. All Rights Reserved.

---

## Notice to Academic Reviewers and Faculty

This repository contains the original, independent work of **Aryan Rajendra Suthar**,
submitted or presented for academic evaluation purposes.

---

## Authorship Certification

This project was conceived, designed, architected, and implemented entirely by
**Aryan Rajendra Suthar** without collaboration, pair-programming, or code
contributions from any other person.

The complete git commit history — accessible via `git log` — reflects 18 commits
spanning 2026-04-21 through 2026-04-26, all authored under a single identity:

```
Author: Aryan <aryanrajendrasuthar@gmail.com>
```

The email address `aryanrajendrasuthar@gmail.com` uniquely identifies the author.

---

## Scope of Original Work

The following were created from scratch by the author:

| Component | Description |
|---|---|
| System architecture | NestJS + React monorepo, database schema, API design |
| Frontend | All UI components, pages, routing, state management |
| Backend | All API endpoints, services, guards, strategies |
| Business logic | Risk scoring algorithm, escalation detection, achievement system |
| Data model | Prisma schema covering 20+ entities |
| Product design | Feature set, UX flows, role-based access model |
| DevOps | CI pipeline, Docker Compose, deployment documentation |

---

## Third-Party Code Acknowledgment

This project uses open-source frameworks and libraries (listed in `NOTICE` and
`package.json`). All such dependencies are standard npm packages — none of the
application logic, domain knowledge, or product design was borrowed from
another project.

---

## Evaluation Conditions

By accessing this repository for evaluation purposes, you agree to:

1. Treat the contents as confidential and proprietary
2. Not share access with unauthorized parties
3. Not retain copies of source code beyond the evaluation period
4. Evaluate the work as the original creation of Aryan Rajendra Suthar

---

## Verification

To independently verify authorship and timeline:

```bash
# View full commit history with author and timestamps
git log --format="%H %ai %an <%ae> %s"

# Confirm single author
git log --format="%ae" | sort | uniq -c

# View first commit (earliest timestamp)
git log --reverse --format="%H %ai %s" | head -1

# Count total commits
git rev-list --count HEAD
```

Expected output: all commits will show `aryanrajendrasuthar@gmail.com` as the
sole author, with the first commit dated 2026-04-21.

---

## Contact

**Aryan Rajendra Suthar**
Email: aryanrajendrasuthar@gmail.com

For questions about the project's scope, design decisions, or implementation
details, contact the author directly.
