# Security Policy

**WorkSafe — Occupational Health Platform**
Copyright (c) 2026 Aryan Rajendra Suthar. All Rights Reserved.

---

## Supported Versions

This is a proprietary project under active development. Security fixes are
applied to the current development branch only.

| Version | Supported |
|---|---|
| Current (main branch) | Yes |
| All prior versions | No |

---

## Reporting a Vulnerability

If you discover a security vulnerability in WorkSafe, please report it
responsibly.

**Contact:** aryanrajendrasuthar@gmail.com
**Subject line:** `[SECURITY] WorkSafe — <brief description>`

### What to include

- A clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Any suggested remediation (optional)

### What to expect

- Acknowledgment within 48 hours
- Assessment and status update within 7 days
- Fix timeline communicated upon severity assessment

---

## Responsible Disclosure Policy

- Do **not** publicly disclose vulnerabilities before they are patched
- Do **not** exploit vulnerabilities beyond what is necessary to demonstrate the issue
- Do **not** access, modify, or exfiltrate data from any live deployment
- Responsible reporters will be credited in release notes (if desired)

---

## Security Architecture Notes

The following security measures are implemented in this project:

### Authentication
- JWT-based access + refresh token rotation (short-lived access tokens: 15 min)
- bcrypt password hashing (industry-standard salt rounds)
- Google OAuth 2.0 via Passport.js
- SAML 2.0 SSO for enterprise integrations
- TOTP-based Multi-Factor Authentication (MFA)
- Refresh token invalidation on logout

### Authorization
- Role-based access control (RBAC): WORKER, THERAPIST, SAFETY_MANAGER, HR_ADMIN, COMPANY_ADMIN
- All API endpoints protected by JWT guard + roles guard
- Primary admin account cannot be deactivated or have role changed
- Organization-scoped data isolation (users only access their own org's data)

### Data Protection
- All API mutations logged to an immutable audit trail
- Input validation via class-validator DTOs on all endpoints
- HTTP-only considerations for token storage

### Infrastructure
- CORS restricted to known frontend origins
- Environment secrets never committed to version control
- `.gitignore` excludes all `.env` files

---

## Out of Scope

The following are not in scope for this project's security policy:

- Third-party SaaS services (SendGrid, Railway, Vercel, etc.)
- Stripe payment processing (not yet wired up)
- Demo instance data (demo accounts use publicly posted credentials)

---

*This security policy applies to the WorkSafe codebase owned by Aryan Rajendra Suthar.*
