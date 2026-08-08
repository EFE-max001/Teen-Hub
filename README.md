# Teen-Hub

A gamified guild platform for teens — quests, ranks, XP, a live guild chat with party-game mechanics, an "Arena Protocol" mini-game engine, and an AI companion called **SENTINEL**.

Built with Next.js (Pages Router), React Three Fiber / Three.js for the 3D "Living Digital Forest" hero scene, Prisma + PostgreSQL, and NextAuth for authentication.

> ⚠️ This project is under active development. Some sections below (Design System, Arena Protocol) call out known gaps so contributors know exactly what still needs work.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Roles & Access](#roles--access)
- [The Arena Protocol (mini-games)](#the-arena-protocol-mini-games)
- [Design System](#design-system)
- [Known Issues / In Progress](#known-issues--in-progress)
- [Deployment](#deployment)

---

## Features

- **Quests** — Founder-created quests with multi-slot claiming, XP/coin rewards, and a member-submitted `QuestSuggestion` flow that routes through SENTINEL-mediated Founder DM threads.
- **Guild Chat** — real-time-feeling channel chat (`#General`, `#Quest Talk`, elite channel, announcements) with a "Ghost Mode" party-game layer (Truth or Dare, Would You Rather, Two Truths, Word Chain, Guild Trivia), AI-monitored for safety.
- **Arena Protocol** — a founder-configurable mini-game/challenge engine with AI-assisted grading. See [below](#the-arena-protocol-mini-games) for how it actually works today.
- **SENTINEL** — the platform's AI chat assistant, routed through OpenRouter with model fallbacks.
- **Profiles, ranks, XP, achievements, titles, trust & safety tooling** (reports, warnings, admin notes, activity log).
- **Founder War Room** — an internal admin console for managing users, trials, admins, quests, Arena games, community posts, achievements, and trust/safety.
- **3D hero scene** — a React Three Fiber "Living Digital Forest" (glowing root network, animated butterflies, portal ring) rendered only on the home route to keep other pages fast.

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | [Next.js](https://nextjs.org/) 14 (Pages Router), React 18, TypeScript |
| 3D / graphics | React Three Fiber, `@react-three/drei`, `@react-three/postprocessing`, Three.js |
| Styling | Tailwind CSS, Framer Motion |
| Auth | NextAuth (credentials provider), Prisma Adapter |
| Database | PostgreSQL via Prisma ORM (Supabase-hosted) |
| AI | OpenRouter (with Mistral / Hugging Face / NVIDIA NIM fallbacks) — see `lib/ai.ts` |
| Hosting / dev | Replit (dev), Replit Deployments (production) |

## Project Structure

```
pages/
  index.tsx              # Public landing page (3D hero scene lives here)
  dashboard/              # Member-facing app (quests, chat, arena, profile, trial…)
  founder/                # Founder War Room (single SPA-style page with tabs)
  admin/                  # Scoped admin console (permission-gated sub-set of Founder tools)
  api/                     # Next.js API routes — one per resource/feature
components/
  ui/                      # Shared primitives: GlowButton, GlowInput, StatusChip, RankBadge…
  dashboard/               # DashboardLayout, StatCard, profile widgets
  layout/                  # Navbar, Footer
lib/
  ai.ts                    # All AI calls: SENTINEL chat, Arena validator, Ghost Protocol games
  auth.ts                  # NextAuth config + Founder bootstrap logic
  prisma.ts                # Prisma client singleton
  middleware.ts            # requireAuth() role/rank gating for getServerSideProps
prisma/
  schema.prisma            # Full data model (35 models — users, quests, arena, trust & safety…)
```

## Getting Started

```bash
# install dependencies
npm install

# generate the Prisma client and push the schema to your database
npx prisma db push

# run the dev server (Replit runs this via the Run button)
npm run dev
```

The dev server binds to `0.0.0.0:5000` (see `package.json` scripts) so it works inside Replit's proxy.

## Environment Variables

Set these as Replit Secrets (or a local `.env`) — there is currently no committed `.env.example`, so treat this table as the source of truth:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (Prisma) |
| `NEXTAUTH_URL` | Full deployed URL — **must** be set correctly in production or auth (e.g. logout) breaks on some browsers |
| `NEXTAUTH_SECRET` | NextAuth session/JWT signing secret |
| `FOUNDER_BOOTSTRAP_EMAIL` / `FOUNDER_BOOTSTRAP_PASSWORD` | Seeds/authenticates the initial Founder account |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client (used for storage/asset handling) |
| `OpenRouter_Api_Key` / `OpenRouter_Api_Key_2` | Primary + fallback OpenRouter keys for all SENTINEL / Arena AI / Ghost Protocol calls |
| `Mistral_Api_Key` | Fallback model when OpenRouter is unavailable |
| `HuggingFace_Api_Key` | Additional model fallback |
| `NVIDIA_Api_Key` | NVIDIA NIM model fallback |

> Note the inconsistent casing on the AI keys (`OpenRouter_Api_Key` rather than `OPENROUTER_API_KEY`) — this matches what `lib/ai.ts` actually reads today. Worth normalizing in a future cleanup pass.

## Database

Schema lives in `prisma/schema.prisma` (35 models, covering users/auth, quests, chat, the Arena Protocol, achievements/titles, and trust & safety). This project uses **`prisma db push` only** — there is no `prisma/migrations` folder, so schema changes are pushed directly rather than tracked as migrations. Keep this in mind when working across environments.

## Roles & Access

- **Founder** — full control via `/founder` (Users, Trials, Admins, Quests, Suggestions, Arena, Posts, Achievements, Titles, Trust, AI Alerts, Feedback, Feature Unlocks…). **All application-user info (roster, roles, ranks, status) lives under `/founder` → People → Users tab.**
- **Admin** — a permission-scoped subset of Founder tools at `/admin`, gated per-admin by `AdminPermission`.
- **Member** — the standard dashboard experience at `/dashboard/*`, gated by `requireAuth()` (role/rank-based, see `lib/middleware.ts`).

## The Arena Protocol (mini-games)

This is the mini-game system exposed to members at `/dashboard/arena`, built by Founders at `/founder` → Arena.

**How it currently works:**

1. A Founder fills out a form (title, mechanics type, difficulty, validation type, time limit, entry/cooldown rules, rewards) **including an "Objective / Description" field**. That field is the *only* place the actual task/question text comes from — it is shown to players in the play modal and is also the context the AI grader uses to score submissions.
2. A member opens a game card, reads the objective + any custom rules, and types a free-text response into a textarea.
3. On submit, unless `validationType` is `manual`, the response is sent to an AI validator (`validateArenaEntry` in `lib/ai.ts`) which scores it 0–100 for relevance/effort/creativity and can flag it as spam/low-effort.
4. XP is awarded automatically only for `auto`-validated, non-flagged entries.

**Important — this is not currently AI-generated trivia.** The Arena engine does **not** pull questions from a hardcoded list, but it also does **not** use AI to generate the prompt. The AI is only used for *grading*, not *authoring*. There is an unused helper, `generateArenaPrompt()` in `lib/ai.ts`, that was scaffolded to have AI generate a fresh prompt/question per category+difficulty — but it is currently **dead code**, never called from any page or API route. Wiring that function into the Founder's Arena creation flow (e.g. an "Auto-generate objective" button) is the natural next step if that's the intended feature.

**Why deployed games can feel like "no specification":** the Objective/Description field is labeled required (`*`) in the UI but isn't actually enforced server-side (`pages/api/founder/arena.ts` only requires `title` and `endsAt`). If a Founder submits a game with that field blank, the game deploys successfully but players see no real instructions — only generic boilerplate — and the AI grader has nothing to score against (this is exactly what happened with the "Test 1" game: the AI flagged the single-word entry "Bello" as ungradable because the objective field was empty). To fix this at the root, either enforce `objective`/`description` as required server-side, or default it to the AI-generated prompt from `generateArenaPrompt()` when left blank.

## Design System

The project is mid-migration from an early **Orbitron/Rajdhani + purple holographic HUD** aesthetic to a newer **Cinzel/Cormorant Garamond serif + emerald/gold/cyan/violet "Living Digital Forest"** aesthetic (see `tailwind.config.js`, which explicitly comments that `cinzel`/`cormorant` should be preferred for new work).

**Fully migrated:** `components/layout/Navbar.tsx`, `components/ui/GlowButton.tsx`, the landing page (`pages/index.tsx`).

**Still on the old font/aesthetic (`font-orbitron` / `font-rajdhani`)** — these are the pages/components that will look "old" until updated:
- `components/dashboard/DashboardLayout.tsx` — the shared shell wrapping *every* dashboard page (chat, arena, quests, profile, trial, messages, posts, achievements, feedback), which is why the old HUD look shows up almost everywhere inside `/dashboard`.
- `components/dashboard/StatCard.tsx`, `components/dashboard/index.tsx`, `components/dashboard/profile.tsx`
- `components/layout/Footer.tsx`
- `components/ui/AIChatWidget.tsx`, `components/ui/GhostModePanel.tsx`, `components/ui/GlowInput.tsx`, `components/ui/RankBadge.tsx`, `components/ui/StatusChip.tsx`, `components/ui/XPBar.tsx`
- Most individual dashboard pages (`arena.tsx`, `chat.tsx`, `achievements.tsx`, `feedback.tsx`, `messages.tsx`, `posts.tsx`, `quest/[id].tsx`, `quests.tsx`, `trial.tsx`) and `founder/index.tsx`, `admin/index.tsx`, `auth/login.tsx`, `auth/register.tsx`, `apply.tsx`, `admin-login.tsx`, `404.tsx`, `_error.tsx`

Because `DashboardLayout` and most of the shared `components/ui/*` primitives haven't been migrated, updating those handful of files (rather than every page individually) will cascade the new look across nearly the whole app.

## Known Issues / In Progress

- Arena's Objective/Description field isn't enforced server-side, allowing effectively-blank games to deploy (see above).
- `generateArenaPrompt()` exists but is unused — decide whether Arena should support AI-generated prompts or remove the dead code.
- Design migration to the Cinzel/Cormorant + emerald palette is incomplete (see [Design System](#design-system)).
- No `prisma/migrations` history — schema changes are applied via `prisma db push`, so keep environments in sync manually.

## Deployment

Deployed via **Replit Deployments** from this Repl. Production build: `npm run build` then `npm run start` (both bind to `0.0.0.0:5000`). Make sure `NEXTAUTH_URL` matches the deployed domain exactly — a mismatch here has previously caused logout crashes on Safari/iOS.