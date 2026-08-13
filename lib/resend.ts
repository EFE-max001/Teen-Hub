// Teen-Hub/lib/resend.ts
//
// Resend email service for transactional emails
// - Application confirmations
// - Trial results
// - Quest notifications
// - Payment Center emails (payment requests, receipts, reminders)
//
// Founder Control: sender identity is environment-configured (RESEND_FROM).
// AI Automation: payment event orchestration lives in lib/paymentEvents.ts,
// which calls sendEmail() here and never sends the same transactional email
// twice for the same event (see PaymentEmailLog idempotency guard there).
//
// Deliberately isolated from payment logic: a payment already committed to
// the database as PAID must stay PAID even if Resend is down. Treat this
// module's return value as informational, never as a reason to roll back a
// payment state change.

import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY

if (!RESEND_API_KEY) {
  console.warn('[Resend] RESEND_API_KEY not found in environment variables')
}

export const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

export type EmailType =
  | 'application-confirmation'
  | 'trial-invitation'
  | 'trial-result'
  | 'quest-assigned'
  | 'quest-completed'
  | 'rank-updated'
  | 'achievement-unlocked'
  | 'trust-alert'
  | 'payment-created'
  | 'payment-reminder'
  | 'payment-success-client'
  | 'payment-success-founder'
  | 'payment-failed'
  | 'payment-expired'
  | 'payment-cancelled'
  | 'payment-refunded'

export interface EmailContext {
  to: string
  subject: string
  data: Record<string, any>
}

// Provider-safe default while the QuestHub domain is being verified with
// Resend. Once a branded domain is verified, set RESEND_FROM in the
// environment (e.g. "QuestHub <payments@yourdomain.com>") — never
// hard-code the future domain here.
const DEFAULT_FROM = 'QuestHub Guild <onboarding@resend.dev>'

/**
 * Send transactional email via Resend.
 */
export async function sendEmail(type: EmailType, context: EmailContext) {
  if (!resend) {
    console.error('[Resend] Service not initialized - skipping email send:', type, '→', context.to)
    return { error: 'Resend not configured' }
  }

  try {
    const template = getEmailTemplate(type, context.data)

    const { data, error } = await resend.emails.send({
      from: context.data.from || process.env.RESEND_FROM || DEFAULT_FROM,
      to: [context.to],
      subject: context.subject,
      html: template.html,
      text: template.text,
    })

    if (error) {
      console.error('[Resend] Send failed:', error)
      return { error }
    }

    console.log('[Resend] Email sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (err) {
    console.error('[Resend] Unexpected error:', err)
    return { error: err }
  }
}

function money(currency: string, amount: number) {
  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : `${currency} `
  return `${symbol}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const baseStyle = `
  body { font-family: 'Cormorant Garamond', serif; background: #040A08; color: #D9EDE6; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .header { text-align: center; margin-bottom: 30px; }
  .badge { display: inline-block; padding: 8px 16px; background: rgba(0, 255, 163, 0.1); border: 1px solid rgba(0, 255, 163, 0.3); border-radius: 20px; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #00FFA3; }
  h1 { font-family: 'Cinzel', serif; font-size: 26px; color: #D9EDE6; margin: 20px 0; }
  .content { line-height: 1.8; color: #94A3B8; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; }
  .row span:first-child { color: #64748B; }
  .row span:last-child { color: #D9EDE6; font-weight: 600; }
  .total-row span:last-child { color: #00FFA3; font-size: 18px; }
  .box { background: rgba(255,255,255,0.03); border: 1px solid rgba(0, 255, 163, 0.15); padding: 20px; border-radius: 10px; margin: 20px 0; }
  .cta { display: inline-block; margin-top: 24px; padding: 14px 32px; background: linear-gradient(135deg, #00FFA3 0%, #00E5FF 100%); color: #040A08; text-decoration: none; border-radius: 6px; font-weight: bold; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(0, 255, 163, 0.1); font-size: 12px; color: #64748B; text-align: center; }
`

function wrap(inner: string) {
  return `<!DOCTYPE html><html><head><style>${baseStyle}</style></head><body><div class="container">${inner}</div></body></html>`
}

function getEmailTemplate(type: EmailType, data: Record<string, any>) {
  switch (type) {
    case 'application-confirmation':
      return {
        html: wrap(`
          <div class="header"><span class="badge">Guild Network</span><h1>Application Received</h1></div>
          <div class="content">
            <p>Greetings ${data.userName || 'Operative'},</p>
            <p>Your application to join QuestHub Guild has been received and logged in the Sentinel system.</p>
            <p>The Council will review your submission within <strong>${data.reviewTimeframe || '48-72 hours'}</strong>.</p>
            <p><strong>Application ID:</strong> ${data.applicationId || 'N/A'}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="footer"><p>This is an automated message from QuestHub Guild.</p></div>
        `),
        text: `QuestHub Guild - Application Received\n\nGreetings ${data.userName || 'Operative'},\nYour application has been received. The Council will review it within ${data.reviewTimeframe || '48-72 hours'}.\nApplication ID: ${data.applicationId || 'N/A'}`,
      }

    case 'trial-result':
      return {
        html: wrap(`
          <h1>Trial Evaluation Complete</h1>
          <div class="box">
            <div style="font-size:40px;font-weight:bold;color:${data.passed ? '#00FFA3' : '#EF4444'}">${data.score || 'N/A'}/100</div>
            <div class="row"><span>Quality</span><span>${data.qualityScore || '-'}</span></div>
            <div class="row"><span>Reliability</span><span>${data.reliabilityScore || '-'}</span></div>
            <div class="row"><span>Attitude</span><span>${data.attitudeScore || '-'}</span></div>
          </div>
          <p class="content">${data.message || 'Your trial has been evaluated by SENTINEL AI and reviewed by the Council.'}</p>
          ${data.nextStep ? `<p class="content"><strong>Next Step:</strong> ${data.nextStep}</p>` : ''}
        `),
        text: `Trial Evaluation Complete\nScore: ${data.score || 'N/A'}/100\n${data.message || ''}`,
      }

    // ── Payment Center emails ──────────────────────────────────────────
    case 'payment-created':
      return {
        html: wrap(`
          <div class="header"><span class="badge">Payment Portal</span><h1>Payment Request Created</h1></div>
          <div class="content"><p>${data.title}</p><p>${data.description || ''}</p></div>
          <div class="box">
            <div class="row"><span>Reference</span><span>${data.reference}</span></div>
            <div class="row"><span>Amount</span><span>${money(data.currency, data.baseAmount)}</span></div>
          </div>
          <a class="cta" href="${data.payUrl}">View Payment Link</a>
          <div class="footer"><p>QuestHub Guild — payments@questhub.gg</p></div>
        `),
        text: `Payment request created: ${data.title}\nReference: ${data.reference}\nAmount: ${money(data.currency, data.baseAmount)}\nLink: ${data.payUrl}`,
      }

    case 'payment-reminder':
      return {
        html: wrap(`
          <div class="header"><span class="badge">Payment Reminder</span><h1>${data.title}</h1></div>
          <div class="content"><p>Hi ${data.clientName || 'there'},</p><p>${data.message || 'This is a friendly reminder that the payment below is still pending.'}</p></div>
          <div class="box">
            <div class="row"><span>Amount due</span><span>${money(data.currency, data.customerTotal)}</span></div>
            <div class="row"><span>Reference</span><span>${data.reference}</span></div>
          </div>
          <a class="cta" href="${data.payUrl}">Complete Payment</a>
          <div class="footer"><p>QuestHub Guild</p></div>
        `),
        text: `Reminder: ${data.title}\nAmount due: ${money(data.currency, data.customerTotal)}\nLink: ${data.payUrl}`,
      }

    case 'payment-success-client':
      return {
        html: wrap(`
          <div class="header"><span class="badge">Payment Received</span><h1>Thank you, ${data.clientName || ''}!</h1></div>
          <div class="content"><p>Your payment for <strong>${data.title}</strong> has been received.</p></div>
          <div class="box">
            <div class="row"><span>Project amount</span><span>${money(data.currency, data.baseAmount)}</span></div>
            <div class="row"><span>Processing fee</span><span>${money(data.currency, data.processingFee)}</span></div>
            <div class="row total-row"><span>Total paid</span><span>${money(data.currency, data.customerTotal)}</span></div>
            <div class="row"><span>Payment method</span><span>${data.paymentChannel || 'Card/Transfer'}</span></div>
            <div class="row"><span>Reference</span><span>${data.reference}</span></div>
            <div class="row"><span>Date</span><span>${data.paidAt ? new Date(data.paidAt).toLocaleString() : new Date().toLocaleString()}</span></div>
          </div>
          <div class="footer"><p>QuestHub Guild — payments@questhub.gg</p></div>
        `),
        text: `Payment received — QuestHub\n${data.title}\nTotal paid: ${money(data.currency, data.customerTotal)}\nReference: ${data.reference}`,
      }

    case 'payment-success-founder':
      return {
        html: wrap(`
          <div class="header"><span class="badge">New Payment</span><h1>New payment received</h1></div>
          <div class="box">
            <div class="row"><span>Client</span><span>${data.clientName || '-'}</span></div>
            <div class="row"><span>Email</span><span>${data.clientEmail || '-'}</span></div>
            <div class="row"><span>Phone</span><span>${data.clientPhone || '-'}</span></div>
            <div class="row"><span>Description</span><span>${data.title}</span></div>
            <div class="row"><span>Base amount</span><span>${money(data.currency, data.baseAmount)}</span></div>
            <div class="row"><span>Processing fee</span><span>${money(data.currency, data.processingFee)}</span></div>
            <div class="row total-row"><span>Total paid</span><span>${money(data.currency, data.customerTotal)}</span></div>
            <div class="row"><span>Method</span><span>${data.paymentChannel || '-'}</span></div>
            <div class="row"><span>Reference</span><span>${data.reference}</span></div>
            ${data.linkedQuestTitle ? `<div class="row"><span>Linked Quest</span><span>${data.linkedQuestTitle}</span></div>` : ''}
          </div>
          <a class="cta" href="${data.founderUrl}">Open Payment</a>
        `),
        text: `New payment received — ${data.clientName || 'Client'} paid ${money(data.currency, data.customerTotal)} for ${data.title}. Ref: ${data.reference}`,
      }

    case 'payment-failed':
      return {
        html: wrap(`
          <div class="header"><span class="badge" style="color:#EF4444;border-color:rgba(239,68,68,0.3);background:rgba(239,68,68,0.1)">Payment Failed</span><h1>Payment was not completed</h1></div>
          <div class="content"><p>Hi ${data.clientName || 'there'}, your payment for <strong>${data.title}</strong> could not be completed.</p></div>
          <a class="cta" href="${data.payUrl}">Try Again</a>
        `),
        text: `Your payment for ${data.title} was not completed. Try again: ${data.payUrl}`,
      }

    case 'payment-expired':
      return {
        html: wrap(`<h1>Payment link expired</h1><p class="content">The payment link for ${data.title} has expired. Contact QuestHub for a new link.</p>`),
        text: `Payment link for ${data.title} has expired.`,
      }

    case 'payment-cancelled':
      return {
        html: wrap(`<h1>Payment request cancelled</h1><p class="content">The payment request for ${data.title} was cancelled.</p>`),
        text: `Payment request for ${data.title} was cancelled.`,
      }

    case 'payment-refunded':
      return {
        html: wrap(`
          <h1>Payment refunded</h1>
          <div class="box"><div class="row"><span>Amount refunded</span><span>${money(data.currency, data.customerTotal)}</span></div><div class="row"><span>Reference</span><span>${data.reference}</span></div></div>
        `),
        text: `Your payment of ${money(data.currency, data.customerTotal)} (ref ${data.reference}) has been refunded.`,
      }

    default:
      return {
        html: wrap(`<p>${data.message || 'Notification from QuestHub Guild'}</p>`),
        text: data.message || 'Notification from QuestHub Guild',
      }
  }
}