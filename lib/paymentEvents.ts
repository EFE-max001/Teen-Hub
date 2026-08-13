// Teen-Hub/lib/paymentEvents.ts
//
// Sits between the payment flow (webhook, reminders) and lib/resend.ts.
// Every send here is guarded by PaymentEmailLog's unique
// [paymentRequestId, template, recipient] constraint, so a duplicate
// webhook delivery — or a retried API call — can never result in the
// client or founder getting the same transactional email twice.
//
// Deliberately does not throw: a Resend outage must never roll back a
// payment that has already been committed to the database as PAID.

import { prisma } from '@/lib/prisma'
import { sendEmail, EmailType } from '@/lib/resend'
import { logPaymentEvent } from '@/lib/paymentAudit'
import type { PaymentRequest } from '@prisma/client'

async function sendOnce(
  paymentRequestId: string,
  template: EmailType,
  recipient: string,
  subject: string,
  data: Record<string, any>
) {
  const existing = await prisma.paymentEmailLog
    .findUnique({
      where: {
        paymentRequestId_template_recipient: { paymentRequestId, template, recipient },
      },
    })
    .catch(() => null)

  if (existing) return // already sent — duplicate webhook/call, do nothing

  const result = await sendEmail(template, { to: recipient, subject, data })
  const ok = 'success' in result && !!result.success

  await prisma.paymentEmailLog
    .create({
      data: {
        paymentRequestId,
        template,
        recipient,
        status: ok ? 'SENT' : 'FAILED',
        error: ok ? null : JSON.stringify((result as any).error ?? 'unknown'),
      },
    })
    .catch(() => {})

  await logPaymentEvent(ok ? 'PAYMENT_EMAIL_SENT' : 'PAYMENT_EMAIL_FAILED', 'system', paymentRequestId, {
    template,
    recipient,
  })
}

function appOrigin() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'
}

export async function sendPaymentSuccessEmails(pr: PaymentRequest, founderEmail: string | null) {
  const founderUrl = `${appOrigin()}/founder/payments/${pr.id}`

  if (pr.clientEmail) {
    await sendOnce(pr.id, 'payment-success-client', pr.clientEmail, 'Payment received — QuestHub', {
      clientName: pr.clientName,
      title: pr.title,
      baseAmount: pr.baseAmount,
      processingFee: pr.processingFee,
      customerTotal: pr.customerTotal,
      currency: pr.currency,
      paymentChannel: pr.paymentChannel,
      reference: pr.reference,
      paidAt: pr.paidAt,
    })
  }

  if (founderEmail) {
    await sendOnce(pr.id, 'payment-success-founder', founderEmail, 'New payment received — QuestHub', {
      clientName: pr.clientName,
      clientEmail: pr.clientEmail,
      clientPhone: pr.clientPhone,
      title: pr.title,
      baseAmount: pr.baseAmount,
      processingFee: pr.processingFee,
      customerTotal: pr.customerTotal,
      currency: pr.currency,
      paymentChannel: pr.paymentChannel,
      reference: pr.reference,
      founderUrl,
    })
  }
}

export async function sendPaymentFailedEmail(pr: PaymentRequest) {
  if (!pr.clientEmail) return
  const payUrl = `${appOrigin()}/pay/${pr.publicToken}`
  await sendOnce(pr.id, 'payment-failed', pr.clientEmail, 'Payment was not completed — QuestHub', {
    clientName: pr.clientName,
    title: pr.title,
    payUrl,
  })
}

// Reminders are allowed to send more than once over time (that's the whole
// point of a reminder), so this does NOT use sendOnce's flat idempotency —
// each reminder gets its own template key so it's still logged and
// auditable without being deduped away.
export async function sendPaymentReminderEmail(pr: PaymentRequest, message: string) {
  if (!pr.clientEmail) return { ok: false, error: 'No client email on file' }
  const payUrl = `${appOrigin()}/pay/${pr.publicToken}`
  const result = await sendEmail('payment-reminder', {
    to: pr.clientEmail,
    subject: `Reminder: payment due for ${pr.title}`,
    data: {
      clientName: pr.clientName,
      title: pr.title,
      message,
      customerTotal: pr.customerTotal,
      currency: pr.currency,
      reference: pr.reference,
      payUrl,
    },
  })
  const ok = 'success' in result && !!result.success
  await prisma.paymentEmailLog
    .create({
      data: {
        paymentRequestId: pr.id,
        template: `payment-reminder-${pr.reminderCount + 1}`,
        recipient: pr.clientEmail,
        status: ok ? 'SENT' : 'FAILED',
        error: ok ? null : JSON.stringify((result as any).error ?? 'unknown'),
      },
    })
    .catch(() => {})
  await logPaymentEvent('PAYMENT_REMINDER_SENT', 'founder', pr.id, { ok })
  return { ok }
}

export async function sendPaymentRefundedEmail(pr: PaymentRequest) {
  if (!pr.clientEmail) return
  await sendOnce(pr.id, 'payment-refunded', pr.clientEmail, 'Payment refunded — QuestHub', {
    title: pr.title,
    customerTotal: pr.customerTotal,
    currency: pr.currency,
    reference: pr.reference,
  })
}