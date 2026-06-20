---
name: Application Linking System
description: How apply.ts and register.ts handle email-based identity merging to prevent duplicates
---

## The Two Flows

**Option A — Apply first, sign up later:**
1. `POST /api/apply` → user applies with email, system creates account with random temp password (no login possible yet)
2. `POST /api/auth/register` with same email → system detects existing account with no password, sets their real password, preserves the trial

**Option B — Signed up first, apply later:**
1. `POST /api/auth/register` → creates GUEST account
2. `POST /api/apply` with same email → detects existing account, upgrades role to TRIAL_MEMBER, attaches trial record

## Anti-Duplicate Rules
- Nickname conflicts: blocked if the nick belongs to a DIFFERENT email
- Duplicate trial: if userId already has a Trial record → 409 error
- Duplicate registration: if email exists AND has a passwordHash → "already registered, please log in"

**Why:** Without this, users could create two accounts (one via apply, one via register) — enabling rank abuse, duplicate identity, and trust manipulation. This closes all loopholes described in V4 blueprint.

**How to apply:** Any future auth/apply flow must check existingByEmail separately from existingByNick.
