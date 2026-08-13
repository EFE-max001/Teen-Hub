// Teen-Hub/lib/paymentAudit.ts
import { prisma } from '@/lib/prisma'

export type PaymentAuditAction =
  | 'PAYMENT_REQUEST_CREATED'
  | 'PAYMENT_REQUEST_UPDATED'
  | 'PAYMENT_REQUEST_CANCELLED'
  | 'PAYMENT_LINK_OPENED'
  | 'PAYMENT_INITIALIZED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_EXPIRED'
  | 'PAYMENT_REMINDER_SENT'
  | 'PAYMENT_EMAIL_SENT'
  | 'PAYMENT_EMAIL_FAILED'
  | 'QUEST_FUNDED'
  | 'WEBHOOK_DUPLICATE_IGNORED'
  | 'WEBHOOK_INVALID_SIGNATURE'

// actor is a free-form label ("founder:<userId>", "client", "webhook",
// "system", "ai") rather than a hard FK — public clients and the Paystack
// webhook generate audit events too, and neither has a Teen Hub User row.
export async function logPaymentEvent(
  action: PaymentAuditAction,
  actor: string,
  paymentRequestId: string | null,
  metadata?: Record<string, any>
) {
  try {
    await prisma.paymentAuditLog.create({
      data: {
        action,
        actor,
        paymentRequestId,
        metadata: metadata ? (metadata as any) : undefined,
      },
    })
  } catch (err) {
    // Audit logging must never break the payment flow it's observing.
    console.error('[paymentAudit] failed to write audit log:', err)
  }
}