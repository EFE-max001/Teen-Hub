// Teen-Hub/lib/paymentLifecycle.ts
//
// The server owns PaymentRequest.status — no browser request may set it
// directly. Every mutation route imports canTransition() from here instead
// of hand-rolling its own status checks, so the state machine only lives
// in one place.

export type PaymentStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REFUNDED'

const TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  DRAFT: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['PENDING', 'EXPIRED', 'CANCELLED'],
  // FAILED -> PENDING is a pragmatic retry path (client tries the
  // checkout again) — not explicitly listed in the base spec but
  // required for a usable "try again" button, and consistent with it.
  PENDING: ['PAID', 'FAILED', 'EXPIRED'],
  FAILED: ['PENDING', 'EXPIRED', 'CANCELLED'],
  PAID: ['REFUNDED'],
  EXPIRED: [],
  CANCELLED: [],
  REFUNDED: [],
}

export function canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

// Statuses from which a client can still attempt/retry checkout.
export const PAYABLE_STATUSES: PaymentStatus[] = ['ACTIVE', 'PENDING', 'FAILED']

// Basic server-side validation — the public page must never be trusted to
// have validated this client-side.
export function validateClientInfo(input: {
  clientName?: string
  clientEmail?: string
  clientPhone?: string
}): string | null {
  const name = (input.clientName || '').trim()
  const email = (input.clientEmail || '').trim()
  const phone = (input.clientPhone || '').trim()

  if (!name || name.length < 2 || name.length > 120) return 'Please enter your full name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.'
  if (!/^[+]?[\d\s()-]{7,20}$/.test(phone)) return 'Please enter a valid phone number.'
  return null
}