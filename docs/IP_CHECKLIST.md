# Intellectual Property Checklist

**WorkSafe — Occupational Health Platform**
Copyright (c) 2026 Aryan Rajendra Suthar. All Rights Reserved.

*Use this checklist to verify and maintain IP protection status.*

---

## Ownership Signals

| Item | Status | Evidence |
|---|---|---|
| LICENSE file present | **DONE** | `/LICENSE` — Proprietary All Rights Reserved |
| NOTICE file present | **DONE** | `/NOTICE` — copyright + third-party acknowledgments |
| Copyright in README | **DONE** | Footer added to `README.md` |
| AUTHORS.md present | **DONE** | `/AUTHORS.md` — sole authorship declaration |
| ORIGIN_PROVENANCE.md present | **DONE** | `/ORIGIN_PROVENANCE.md` — provenance log |
| CREATION_TIMELINE.md present | **DONE** | `/docs/CREATION_TIMELINE.md` — git-verified timeline |
| RELEASE_NOTES.md present | **DONE** | `/RELEASE_NOTES.md` — milestone-based history |
| CONFIDENTIALITY.md present | **DONE** | `/CONFIDENTIALITY.md` — access restrictions |
| SECURITY.md present | **DONE** | `/SECURITY.md` — disclosure policy |
| CONTRIBUTING.md present | **DONE** | `/CONTRIBUTING.md` — no external contributions |
| ACADEMIC_REVIEW.md present | **DONE** | `/docs/ACADEMIC_REVIEW.md` — reviewer notice |

---

## Authorship Evidence

| Item | Status | Notes |
|---|---|---|
| Single author in all commits | **STRONG** | 18/18 commits: `aryanrajendrasuthar@gmail.com` |
| git user.email contains full name | **STRONG** | `aryanrajendrasuthar@gmail.com` |
| git user.name is full legal name | **WEAK** | Currently `Aryan` — should be `Aryan Rajendra Suthar` |
| Pre-git concept document | **MEDIUM** | `docs/WORKSAFE.docx` (2026-04-20, before first commit) |
| Sprint-based commit structure | **MEDIUM** | Named sprints show organized solo authorship |
| No co-author commits | **STRONG** | Zero instances of co-authorship in history |
| No force-pushed or rewritten history | **STRONG** | Linear history from initial commit |
| GitHub contribution graph | **MEDIUM** | All contributions tied to single GitHub account |

---

## Legal & Licensing

| Item | Status | Action Needed |
|---|---|---|
| Proprietary license applied | **DONE** | `/LICENSE` |
| Open-source deps acknowledged | **DONE** | `/NOTICE` |
| No GPL/AGPL deps that force license change | **VERIFY** | Run `license-checker --onlyAllow 'MIT;Apache-2.0;ISC;BSD-2-Clause;BSD-3-Clause'` |
| No code copied without attribution | **DONE** | All code is original; npm packages listed in NOTICE |
| No third-party assets (fonts, icons) without license | **VERIFY** | Lucide icons (ISC), Google Fonts (OFL) — both permissive |

---

## Cryptographic Proof

| Item | Status | Recommended Action |
|---|---|---|
| GPG-signed commits | **MISSING** | See `docs/CREATION_TIMELINE.md` — set up GPG signing |
| Signed git tags at milestones | **MISSING** | Run: `git tag -s v1.0.0 -m "Sprint 6 complete"` etc. |
| Notarized project snapshot | **MISSING** | Optional: zip + hash with `sha256sum` and timestamp via trusted timestamping authority |
| Archive snapshot with timestamp | **MISSING** | Optional: submit to GitHub Archive or create a dated ZIP |

---

## Repository Hygiene

| Item | Status | Notes |
|---|---|---|
| `.env` files excluded from git | **DONE** | `.gitignore` covers `*.env`, `.env*` |
| No secrets in commit history | **VERIFY** | Run `git log -p | grep -i "secret\|password\|key"` to confirm |
| No accidentally committed credentials | **VERIFY** | Review `.env.example` — ensure only placeholder values |
| README is up to date | **DONE** | Updated 2026-04-25, provenance footer added |

---

## Recommended Next Actions

Priority order:

1. **[HIGH]** Fix git `user.name` to full legal name:
   ```bash
   git config --global user.name "Aryan Rajendra Suthar"
   ```
   Then verify future commits use full name.

2. **[HIGH]** Create signed git tags for major milestones to timestamp them
   cryptographically. See `docs/CREATION_TIMELINE.md` for commands.

3. **[MEDIUM]** Set up GPG commit signing for all future commits.

4. **[MEDIUM]** Generate a SHA-256 hash of the current project state and
   record it with a trusted timestamp (e.g., RFC 3161 timestamp authority).

5. **[LOW]** Verify license compatibility of all npm dependencies using
   `license-checker`.

---

*Last updated: 2026-04-26*
*Maintained by: Aryan Rajendra Suthar*
