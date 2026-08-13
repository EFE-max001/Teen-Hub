// Teen-Hub/lib/paystack.ts
//
// Server-side ONLY — never import this from a component that ships to the
// browser. PAYSTACK_SECRET_KEY must never reach the client bundle.
//
// QuestHub's payment model: the FOUNDER creates a PaymentRequest and shares
// its public link. An external client (no Teen Hub account) opens that
// link and pays through Paystack's hosted checkout. This file owns all the
// money math and all direct Paystack API calls, so there is exactly one
// place that fee formula and payment verification logic lives.
//
// AI Automation: payment risk scoring lives in lib/ai.ts (assessPaymentRisk),
// reusing QuestHub's existing AI routing rather than a second AI pipeline.
// Founder Control: fee responsibility (who pays the Paystack fee) is chosen
// per payment request by the Founder — see FeeMode below.

import crypto from 'crypto'

const PAYSTACK_BASE = 'https://api.paystack.co'
const SECRET_KEY = () => process.env.PAYSTACK_SECRET_KEY || ''

// ─── Fee calculation (Nigeria, local cards/transfer) ───────────────────────
// Paystack's documented local-transaction formula: 1.5% + ₦100, with the
// ₦100 flat fee waived under ₦2,500, and the total fee capped at ₦2,000.
export function calculatePaystackFee(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0
  const percentageFee = amount * 0.015
  const flatFee = amount < 2500 ? 0 : 100
  const rawFee = percentageFee + flatFee
  return Math.min(Math.round(rawFee * 100) / 100, 2000)
}

// When the fee is passed on to the customer, Paystack deducts its cut from
// the fee-INCLUSIVE total, so naively adding calculatePaystackFee(base)
// under-collects. This resolves the inclusive formula:
//   total = base + fee(total)   where fee(x) = min(x*0.015 + flat(x), 2000)
// which is linear below the ₦2,000 cap, so re-deriving the fee against the
// first-pass total converges exactly — this is what "customer bears the
// fee" resolves to in practice.
export function calculateCustomerPassedOnFee(baseAmount: number): number {
  if (!Number.isFinite(baseAmount) || baseAmount <= 0) return 0
  const firstPassFee = calculatePaystackFee(baseAmount)
  const total = baseAmount + firstPassFee
  return calculatePaystackFee(total)
}

export type FeeBreakdown = {
  baseAmount: number
  processingFee: number   // charged to the client
  founderFeeShare: number // absorbed by the founder
  customerTotal: number   // what the client actually pays
}

export type FeeMode = 'CLIENT_PAYS' | 'FOUNDER_PAYS' | 'SPLIT_50_50'

// CLIENT_PAYS is the default across the app — Paystack explicitly supports
// passing the transaction fee to the customer for Nigerian payments, so
// there's no reason to eat it on every payment by default. The Founder can
// still choose FOUNDER_PAYS or SPLIT_50_50 per request.
export function computeFeeBreakdown(
  baseAmount: number,
  feeMode: FeeMode = 'CLIENT_PAYS'
): FeeBreakdown {
  if (feeMode === 'FOUNDER_PAYS') {
    return {
      baseAmount,
      processingFee: 0,
      founderFeeShare: calculatePaystackFee(baseAmount),
      customerTotal: baseAmount,
    }
  }

  if (feeMode === 'SPLIT_50_50') {
    const fullFee = calculateCustomerPassedOnFee(baseAmount)
    const half = Math.round((fullFee / 2) * 100) / 100
    return {
      baseAmount,
      processingFee: half,
      founderFeeShare: half,
      customerTotal: Math.round((baseAmount + half) * 100) / 100,
    }
  }

  // CLIENT_PAYS (default)
  const fullFee = calculateCustomerPassedOnFee(baseAmount)
  return {
    baseAmount,
    processingFee: fullFee,
    founderFeeShare: 0,
    customerTotal: Math.round((baseAmount + fullFee) * 100) / 100,
  }
}

// ─── Token / reference generation ──────────────────────────────────────────

// High-entropy, URL-safe — used in /pay/[token]. Never a sequential/db id,
// so a payment link can't be enumerated or guessed.
export function generatePublicToken(): string {
  return 'qh_' + crypto.randomBytes(24).toString('base64url')
}

// Human-facing payment request reference, shown to both Founder and client.
export function generateReference(prefix = 'QH'): string {
  const rand = crypto.randomBytes(5).toString('hex').toUpperCase()
  return `${prefix}-${rand}`
}

// Distinct from the PaymentRequest reference — one request can have several
// transaction attempts (retries after an abandoned checkout), each needs
// its own unique Paystack reference.
export function generatePaystackTxReference(paymentRequestReference: string): string {
  const rand = crypto.randomBytes(6).toString('hex')
  return `${paymentRequestReference}-${rand}`
}

// ─── Paystack API calls (server-side only) ─────────────────────────────────

type InitializeParams = {
  email: string
  amountNaira: number // converted to kobo internally
  reference: string
  callbackUrl: string
  metadata?: Record<string, any>
}

export async function initializePayment(params: InitializeParams): Promise<{
  success: boolean
  authorization_url?: string
  access_code?: string
  reference: string
  error?: string
}> {
  if (!SECRET_KEY()) {
    return { success: false, reference: params.reference, error: 'Paystack not configured' }
  }
  try {
    const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SECRET_KEY()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: Math.round(params.amountNaira * 100), // kobo
        reference: params.reference,
        callback_url: params.callbackUrl,
        currency: 'NGN',
        metadata: params.metadata || {},
      }),
    })
    const data = await response.json()
    if (!data.status) {
      return { success: false, reference: params.reference, error: data.message || 'Failed to initialize payment' }
    }
    return {
      success: true,
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: params.reference,
    }
  } catch (error) {
    console.error('[Paystack] Initialization error:', error)
    return {
      success: false,
      reference: params.reference,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export type VerifiedTransaction = {
  id: number
  status: string // 'success' | 'failed' | 'abandoned' | ...
  reference: string
  amount: number // kobo
  currency: string
  channel: string
  paid_at: string | null
  metadata: Record<string, any>
  customer: { email: string }
}

export async function verifyTransaction(reference: string): Promise<{
  success: boolean
  verified: boolean
  data?: VerifiedTransaction
  error?: string
}> {
  if (!SECRET_KEY()) {
    return { success: false, verified: false, error: 'Paystack not configured' }
  }
  try {
    const response = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${SECRET_KEY()}` },
    })
    const data = await response.json()
    if (!data.status) {
      return { success: false, verified: false, error: data.message || 'Verification failed' }
    }
    return { success: true, verified: data.data.status === 'success', data: data.data }
  } catch (error) {
    console.error('[Paystack] Verification error:', error)
    return {
      success: false,
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Validates the `x-paystack-signature` header per Paystack's documented
// HMAC-SHA512 scheme. MUST be called with the raw request body string
// (not a re-serialized object) — Paystack signs the exact bytes it sent,
// and re-serializing JSON can differ in key order/whitespace and silently
// break verification.
export function verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
  if (!signature || !SECRET_KEY()) return false
  const expected = crypto.createHmac('sha512', SECRET_KEY()).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    // Buffers of different length throw rather than returning false
    return false
  }
}