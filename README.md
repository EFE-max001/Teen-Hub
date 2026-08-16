# ⚡ QuestHub Guild

<p align="center">
  <strong>A place where ambitious teens connect, grow, prove their skills, and earn opportunities.</strong>
</p>

<p align="center">
  What started as Teen-Hub is becoming <strong>QuestHub Guild</strong> — a structured, active guild for ambitious teens.
</p>

---

## 🌌 What is QuestHub?

QuestHub Guild is a gamified guild platform for teens.

It is designed to be more than a group chat or a community that becomes inactive after a few days. QuestHub combines:

🎮 **Challenges & events**  
🤝 **An active teen community**  
📈 **Skill growth, XP & ranks**  
🧠 **Creative projects**  
⚡ **Quests & opportunities**  
🏆 **Achievements, titles & reputation**  
🤖 **SENTINEL AI**  
💳 **Founder-controlled client payments**

The long-term vision is to create a structured environment where talented teens can build useful skills, prove what they can do, and eventually access real opportunities.

> **Talent is common. Proof is rare.**

---

# 🧭 Core Experience

```text
                   ┌─────────────────────┐
                   │   QUESTHUB GUILD ⚡  │
                   └──────────┬──────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   🎮 CHALLENGES          📈 PROGRESSION       🤝 COMMUNITY
   Games & events         XP • Ranks           Guild Chat
   Arena Protocol         Achievements         Social features
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                         ⚡ QUESTS
                              │
                              ▼
                    Real projects & work
                              │
                              ▼
                       💰 OPPORTUNITIES
```

QuestHub is built around the idea that **participation should lead somewhere**: members can learn, compete, build experience, earn XP, improve their reputation, and eventually take on quests.

---

# ✨ Core Features

### ⚡ Quests

Founder-created quests with multi-slot claiming, XP / coin rewards, member participation, and a `QuestSuggestion` flow.

QuestHub does **not** use an external marketplace model where outside clients create quests themselves. The Founder controls the quest and project pipeline.

### 🏆 Ranks, XP & Achievements

Members progress through:

**F → E → D → C → B → A → S → SS → SSS**

Ranks are intended to represent earned progression, reputation, and performance.

### 🎮 Arena Protocol

A Founder-configurable challenge / mini-game system with logic, typing, quiz-style, creative, and social challenges, plus AI-assisted grading and XP rewards.

### 💬 Guild Chat & Ghost Protocol

Guild Chat supports community channels, while Ghost Protocol adds party-game mechanics such as Truth or Dare, Would You Rather, Two Truths and a Lie, Word Chain, and Guild Trivia.

### 🤖 SENTINEL AI

SENTINEL is QuestHub's AI layer. It supports areas such as member assistance, Arena validation, community features, quest intelligence, payment-risk signals, operational summaries, and future automations.

AI assists the platform; critical financial state remains server-controlled.

### 💳 Founder-Controlled Payments

The Founder creates a payment request and shares a secure public link.

The external client:

1. Opens the payment link.
2. Provides contact information.
3. Reviews the amount and processing fee.
4. Pays through Paystack.
5. Receives confirmation through Resend.

The client does **not** need a QuestHub account.

### 📧 Transactional Email

Resend handles transactional messages such as payment receipts, reminders, application notifications, and trial notifications.

---

# 🏗️ Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                         BROWSER / USERS                      │
├──────────────────────┬───────────────────┬───────────────────┤
│ Public Landing Page  │ Member Dashboard  │ Founder War Room │
│ 3D / visual system   │ quests / chat     │ operations        │
│                      │ arena / profile   │ payments / AI     │
└─────────────┬────────┴─────────┬─────────┴─────────┬─────────┘
              │                  │                   │
              └──────────────────┼───────────────────┘
                                 ▼
┌──────────────────────────────────────────────────────────────┐
│                      NEXT.JS API ROUTES                      │
│ auth • quests • arena • chat • payments • webhooks • AI     │
└───────────────┬───────────────────┬───────────────────┬──────┘
                │                   │                   │
                ▼                   ▼                   ▼
        ┌──────────────┐    ┌───────────────┐   ┌──────────────┐
        │ PostgreSQL   │    │   Paystack    │   │    Resend    │
        │ Prisma ORM   │    │ Hosted / API  │   │ Transactional│
        └──────────────┘    └───────────────┘   └──────────────┘
                │
                ▼
        ┌───────────────────────────────────────┐
        │              SENTINEL AI              │
        │ model routing / grading / assistance  │
        └───────────────────────────────────────┘
```

### Payment flow

```text
Founder
   │
   ▼
Create Payment Request
   │
   ▼
/pay/[token]
   │
   ▼
External Client
   │
   ▼
Paystack Checkout
   │
   ▼
Paystack Webhook
   │
   ▼
Payment Record → QuestHub DB
   │
   ├──────────────► Founder notification
   │
   └──────────────► Client receipt via Resend
```

---

# 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (Pages Router) |
| UI | React 18 + TypeScript |
| 3D / Graphics | React Three Fiber, Drei, Three.js, postprocessing |
| Styling | Tailwind CSS + Framer Motion |
| Authentication | NextAuth |
| Database | PostgreSQL + Prisma |
| Storage / Assets | Supabase |
| Payments | Paystack |
| Email | Resend |
| AI | SENTINEL AI + configured model providers |
| Development | Replit |
| Production | Replit Deployments |

---

# 📁 Project Structure

```text
pages/
├── index.tsx
├── pay/
│   └── [token].tsx
├── dashboard/
├── founder/
├── admin/
└── api/
    ├── payment/
    ├── webhooks/
    └── founder/

components/
├── ui/
├── dashboard/
└── layout/

lib/
├── ai.ts
├── auth.ts
├── prisma.ts
├── middleware.ts
├── paystack.ts
├── resend.ts
├── paymentLifecycle.ts
├── paymentEvents.ts
└── paymentAudit.ts

prisma/
└── schema.prisma
```

---

# 🚀 Run Locally

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Use a local `.env` or Replit Secrets.

## 3. Generate Prisma Client

```bash
npx prisma generate
```

## 4. Sync the development database

This project currently uses Prisma schema synchronization:

```bash
npx prisma db push
```

> ⚠️ Keep database environments synchronized carefully when changing `schema.prisma`.

## 5. Start development

```bash
npm run dev
```

---

# 🔐 Environment Variables

Never commit secrets to GitHub.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection |
| `NEXTAUTH_URL` | Public application URL |
| `NEXTAUTH_SECRET` | NextAuth signing secret |
| `FOUNDER_BOOTSTRAP_EMAIL` | Initial Founder account |
| `FOUNDER_BOOTSTRAP_PASSWORD` | Initial Founder bootstrap credential |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public client key |
| `PAYSTACK_SECRET_KEY` | **Server-only** Paystack secret |
| `RESEND_API_KEY` | **Server-only** Resend key |
| `RESEND_FROM` | Verified Resend sender |
| `NEXT_PUBLIC_APP_URL` | Public QuestHub URL |
| AI provider keys | Required by the current `lib/ai.ts` configuration |

> **Security:** never expose `PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, database credentials, or model-provider secrets in browser code.

---

# 💳 Payments

QuestHub uses a **Founder → Client → Payment Link** model.

### Founder flow

```text
Founder creates request
        ↓
QuestHub generates secure payment link
        ↓
Founder copies / shares link
        ↓
Client opens public payment page
        ↓
Client enters:
name • email • phone • optional business
        ↓
Client sees:
amount • processing fee • total
        ↓
Paystack checkout
        ↓
Webhook confirms payment
        ↓
QuestHub records payment
        ↓
Resend sends confirmation
```

### Fee modes

The payment system supports:

- `CLIENT_PAYS`
- `FOUNDER_PAYS`
- `SPLIT_50_50`

The project amount must remain separate from the processing fee.

### Payment truth

The browser redirect is **not** proof of payment.

Payment state must be confirmed server-side through Paystack verification / webhook processing.

Webhook handling should be idempotent so duplicate events do not create duplicate transactions, quest funding, or email receipts.

---

# 🤖 AI & Automation

QuestHub uses AI where it adds real value.

### Good AI use cases

- SENTINEL assistant
- Arena grading
- Payment-risk signals
- Payment-request drafting
- Founder operational summaries
- Smart reminders
- Quest intelligence
- Future recommendations

### Deterministic responsibilities

Money-related truth remains server-controlled:

- payment amount
- payment status
- transaction references
- webhook verification
- database updates
- payout eligibility
- audit records

AI can assist with these workflows; it should not silently become the financial authority.

---

# 👥 Roles & Access

### Founder

Full control through the Founder War Room.

### Admin

Permission-scoped Founder tools.

### Member

The normal QuestHub experience: dashboard, quests, chat, Arena, profile, progression, and achievements.

### External Client

No account required. The client interacts only through the public payment page provided by the Founder.

---

# 🎨 Design System

QuestHub's current design direction is a **dark, cinematic Living Digital Forest** aesthetic.

### Palette

- 🌌 Near-black / midnight backgrounds
- 🟢 Emerald
- 🔵 Cyan / teal
- 🟣 Violet
- 🟡 Gold

### Visual language

- 🦋 Animated butterflies
- ✨ Ambient particles
- 🌐 Flowing energy-network background
- 🏛️ Guild / fantasy-tech typography
- 🎬 Cinematic depth and glow

### Typography

The current direction favors:

- **Cinzel**
- **Cormorant Garamond**

Some older HUD-style Orbitron / Rajdhani components remain and are being migrated gradually.

> **Design principle:** the interface should feel like entering a living guild — not opening a generic SaaS dashboard.

---

# 🧪 Development Checklist

Before committing a major change:

```bash
npm run lint
npm run build
```

For schema changes:

```bash
npx prisma generate
npx prisma db push
```

For payment changes, test:

- successful payment
- failed payment
- pending payment
- duplicate webhook
- expired payment link
- wrong amount
- client information validation
- email failure after successful payment

---

# 🟡 Project Status

**QuestHub Guild is an active pre-launch project.**

Current work spans:

- 🎨 design migration
- 🎮 Arena expansion
- 💳 payment operations
- 📧 production Resend configuration
- 🤖 SENTINEL improvements
- 🛡️ trust & safety
- 📱 responsive/mobile refinement
- 🚢 production readiness

---

# 🚢 First Launch Checklist

## Application

- [ ] Production build succeeds
- [ ] Authentication works
- [ ] Founder access is protected
- [ ] Member dashboard works
- [ ] Mobile layouts checked
- [ ] Error pages checked

## Database

- [ ] Production database configured
- [ ] Prisma Client generated
- [ ] Schema synchronized
- [ ] Backup / recovery plan considered

## Payments

- [ ] Paystack production credentials configured
- [ ] Public payment links tested
- [ ] Client information validation tested
- [ ] Fee calculation verified
- [ ] Webhook registered and reachable
- [ ] Duplicate webhook behavior tested
- [ ] Successful test transaction completed
- [ ] Payment receipt confirmed

## Email

- [ ] Resend API key configured
- [ ] Sender domain verified
- [ ] Payment receipt tested
- [ ] Founder notification tested
- [ ] Reminder tested
- [ ] Duplicate-email protection tested

## Security

- [ ] Secrets are not committed
- [ ] Public payment tokens are high entropy
- [ ] Server validates all payment amounts
- [ ] Founder routes require authorization
- [ ] Webhook authenticity is verified
- [ ] Client information is not publicly exposed

---

# 🌱 Vision

QuestHub is starting small.

The goal is not simply to build another teen social platform.

It is to build a place where:

```text
CONNECT
   ↓
PARTICIPATE
   ↓
LEARN
   ↓
PROVE
   ↓
RANK UP
   ↓
BUILD EXPERIENCE
   ↓
TAKE ON QUESTS
   ↓
CREATE REAL OPPORTUNITIES
```

A guild that stays active.

A place where effort matters.

A place where talented teens can build something bigger together.

---

<p align="center">
  <strong>QuestHub Guild ⚡</strong><br/>
  <em>Connect. Grow. Prove yourself. Build what comes next.</em>
</p>
