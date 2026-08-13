# How to apply this update to EFE-max001/Teen-Hub

This folder mirrors your repo's exact directory structure. Every file here
either replaces an existing file at that path, or is a brand-new file.

## Option A — copy files directly (simplest)
Copy each file in this zip into your local clone at the matching path,
overwriting what's there. Git will show you the diff before you commit.

## Option B — apply the patch
From your repo root:
    git apply CHANGES.patch
(CHANGES.patch is a git diff between your last commit, dc1dd01, and this
update — if your local main has moved past dc1dd01, use Option A instead.)

## One file must be DELETED manually
    pages/api/payment/verify.ts
It referenced Prisma models that don't exist (prisma.user.transactions,
prisma.flaggedTransaction) and would crash at runtime. It's superseded by:
- pages/api/payment/request/[token].ts (status polling)
- pages/api/webhooks/paystack.ts (the actual source of payment truth)

## After copying files in
1. npm install          — adds the `resend` package (added to package.json)
2. Copy .env.example → .env.local and fill in real values, especially:
   PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY, RESEND_API_KEY
3. npx prisma generate && npx prisma migrate dev
   (adds PaymentRequest, PaymentTransaction, PaymentEmailLog, PaymentAuditLog
   models + new enums — I could not run this myself, no network access to
   Prisma's engine binaries from my sandbox)
4. In your Paystack dashboard, set the webhook URL to:
   https://<your-domain>/api/webhooks/paystack

## What changed, file by file

NEW FILES
- lib/paymentLifecycle.ts   — payment status state machine + input validation
- lib/paymentAudit.ts       — durable audit trail (PaymentAuditLog)
- lib/paymentEvents.ts      — idempotent email dispatch (never double-sends)
- pages/api/payment/request/[token].ts   — public read + status poll
- pages/api/payment/initialize.ts        — public checkout start
- pages/api/webhooks/paystack.ts         — Paystack webhook, source of truth
- pages/api/founder/payments/index.ts    — founder list + create
- pages/api/founder/payments/[id].ts     — founder detail + cancel/edit
- pages/api/founder/payments/[id]/remind.ts — founder-triggered reminder
- pages/api/ai/payment-assist.ts         — AI drafting + weekly summary
- pages/founder/payments/index.tsx       — Payment Center UI
- pages/founder/payments/new.tsx         — Create Payment Request UI
- pages/founder/payments/[id].tsx        — Payment detail UI
- pages/pay/[token].tsx                  — public client payment page
- components/ui/ButterfliesOverlay.tsx   — page-wide CSS/SVG butterflies
- .env.example                           — documents every required env var

REWRITTEN IN PLACE
- lib/paystack.ts    — fixed Nigeria fee formula, CLIENT_PAYS default, fixed
                        webhook signature bug (was hashing re-serialized JSON
                        instead of the raw body)
- lib/resend.ts       — added the 6 payment email templates
- lib/ai.ts           — appended assessPaymentRisk, draftPaymentRequest,
                        summarizePaymentActivity, draftPaymentReminder
- components/PaystackCheckout.tsx — was importing an uninstalled package
                        (@paystack/inline-js) and calling a route that
                        doesn't exist; rewritten as a redirect-based button

SMALL EDITS
- prisma/schema.prisma        — new models/enums, PaymentRequest relations
                                 on User + Quest, QuestStatus.FUNDED added
- package.json                 — added "resend" dependency
- pages/_app.tsx                — mounts ButterfliesOverlay app-wide
- components/Scene.tsx          — wider 3D butterfly flock (FOV 38→52)
- components/ui/StatusChip.tsx  — added payment status colors
- components/dashboard/DashboardLayout.tsx — added Payment Center nav link
- pages/index.tsx               — crystal-glass reflection + 5 butterfly
                                   landing-text targets

DELETE MANUALLY
- pages/api/payment/verify.ts (broken, superseded — see above)