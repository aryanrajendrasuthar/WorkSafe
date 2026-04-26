# Cryptographic Proof Guide

**WorkSafe — Occupational Health Platform**
*Optional steps to add cryptographically verifiable authorship evidence.*

---

## Why Cryptographic Proof Matters

Git commit timestamps and authorship metadata can technically be altered. While
the combination of commit hashes, a consistent email address, sprint structure,
and pre-git documents provides strong circumstantial evidence, cryptographic
tools create **tamper-evident, independently verifiable proof** that is much
harder to dispute.

These are recommendations — none are required for normal development, but each
adds a layer of defensibility.

---

## Option 1: GPG-Signed Commits (Recommended)

Every commit signed with your GPG key creates a cryptographic proof that:
- The commit was authored by the holder of that private key
- The commit content was not altered after signing

### Setup

```bash
# Generate a GPG key (if you don't have one)
gpg --full-generate-key
# Choose RSA 4096, never expires, use aryanrajendrasuthar@gmail.com as email

# Get your key ID
gpg --list-secret-keys --keyid-format LONG

# Configure git to sign all commits
git config --global user.signingkey <YOUR_KEY_ID>
git config --global commit.gpgsign true

# Export your public key (add to GitHub: Settings → SSH and GPG keys)
gpg --armor --export aryanrajendrasuthar@gmail.com
```

### Verify a signed commit

```bash
git log --show-signature -1
git verify-commit <commit-hash>
```

---

## Option 2: Signed Git Tags at Milestones

Tags are the standard way to mark named points in history. Signed tags add a
GPG signature, making the tag tamper-evident.

### Create signed milestone tags

```bash
# Tag the initial commit (first proof of creation)
git tag -s v0.1.0-sprint1 9fc522928ea442950c2c9efe5d6bab84e272fbbf \
  -m "Sprint 1: Foundation — initial commit by Aryan Rajendra Suthar, 2026-04-21"

git tag -s v0.2.0-sprint2 82cc77e144bd6fc1485d752c3cb6627a4d2d20e0 \
  -m "Sprint 2: Worker Core"

git tag -s v0.3.0-sprint3 138acc0c2903dfd773ac7377eb4da4c250a1f5c3 \
  -m "Sprint 3: Therapist Dashboard"

git tag -s v0.4.0-sprint4 9a54684cc51f950ed8b475366621af02fbc6e589 \
  -m "Sprint 4: Risk Engine"

git tag -s v0.5.0-sprint5 f74e6c17d1cd09b6646db19bfa4e0c4fed61dd67 \
  -m "Sprint 5: Enterprise Tier"

git tag -s v1.0.0 5e41efba8d2822326d814a0761e534552df4f0c2 \
  -m "v1.0.0: Full MVP — all five roles functional"

git tag -s v1.2.0 HEAD \
  -m "v1.2.0: MFA, SAML SSO, BullMQ reminders, notifications, exercise timer"

# Push tags to GitHub
git push origin --tags
```

### Verify a signed tag

```bash
git tag -v v1.0.0
```

---

## Option 3: SHA-256 Snapshot Hash

A timestamped hash of the project creates a fingerprint of the codebase at a
specific point in time. If someone later claims prior authorship, you can show
that your code existed and was hashed at a verifiable date.

### Generate a project hash

```bash
# Create a hash of all tracked files
git archive HEAD | sha256sum > PROJECT_HASH_$(date +%Y%m%d).txt

# Or hash the entire current state
find . -not -path './.git/*' -not -path './node_modules/*' -type f \
  | sort | xargs sha256sum > PROJECT_SNAPSHOT_HASH_$(date +%Y%m%d).txt

cat PROJECT_SNAPSHOT_HASH_$(date +%Y%m%d).txt | sha256sum
```

Store the output hash somewhere with a timestamp (email it to yourself, post
it to a public Gist, or use an RFC 3161 timestamping service).

---

## Option 4: RFC 3161 Trusted Timestamping

An RFC 3161 timestamp authority (TSA) issues a cryptographically signed
timestamp certificate that proves a file existed at a specific point in time,
verified by a trusted third party.

### Generate a timestamped proof

```bash
# Create an archive of the project
git archive --format=zip HEAD -o worksafe_snapshot_$(date +%Y%m%d).zip

# Compute SHA-256 hash
sha256sum worksafe_snapshot_$(date +%Y%m%d).zip

# Request a timestamp from a free RFC 3161 TSA (e.g. DigiCert)
openssl ts -query -data worksafe_snapshot_$(date +%Y%m%d).zip \
  -no_nonce -sha256 -out snapshot.tsq

curl -H "Content-Type: application/timestamp-query" \
  --data-binary @snapshot.tsq \
  https://timestamp.digicert.com > snapshot.tsr

# Verify
openssl ts -verify -in snapshot.tsr -queryfile snapshot.tsq \
  -CAfile /etc/ssl/cert.pem
```

Store `snapshot.tsr` alongside the ZIP. This is legally recognized proof of
existence at the stated time.

---

## Option 5: GitHub Release with Checksum

When you publish a GitHub Release (from a signed tag), GitHub records a public
timestamp on their servers and makes the release immutable. This creates a
third-party-hosted timestamp that is publicly auditable.

```bash
# After pushing signed tags
gh release create v1.2.0 \
  --title "WorkSafe v1.2.0 — MFA, SSO, Real-time Notifications" \
  --notes "See RELEASE_NOTES.md for full changelog." \
  --verify-tag
```

The release page URL becomes a public, timestamped record of your version.

---

## Authorship Verification Commands

Share these with anyone who needs to independently verify authorship:

```bash
# Confirm sole author
git log --format="%ae" | sort | uniq -c
# Expected: 18 aryanrajendrasuthar@gmail.com

# Show first commit with full metadata
git log --reverse --format="%H%n%ai%n%an <%ae>%n%s" | head -8

# Export full commit log to file (for archival)
git log --format="%H | %ai | %an <%ae> | %s" > commit_log_$(date +%Y%m%d).txt

# Show total number of commits
git rev-list --count HEAD

# Show all commit authors (should be exactly one)
git shortlog -sne
```

---

## Priority Order

| Priority | Action | Effort |
|---|---|---|
| 1 (HIGH) | Fix `user.name` to full legal name | 1 minute |
| 2 (HIGH) | Create signed milestone tags, push to GitHub | 10 minutes |
| 3 (MEDIUM) | Set up GPG signing for all future commits | 20 minutes |
| 4 (MEDIUM) | Generate and store a SHA-256 snapshot hash | 5 minutes |
| 5 (LOW) | RFC 3161 trusted timestamp on a ZIP snapshot | 15 minutes |
| 6 (LOW) | Create GitHub Release from signed v1.2.0 tag | 5 minutes |

---

*This guide is for the use of Aryan Rajendra Suthar, sole owner of WorkSafe.*
*Copyright (c) 2026 Aryan Rajendra Suthar. All Rights Reserved.*
