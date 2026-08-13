// Teen-Hub/pages/api/webhooks/paystack.ts
//
// This is the ONLY place a PaymentRequest is ever marked PAID. The public
// page's return-URL redirect is never trusted for that (see the "Important
// Payment Truth Rule" this route implements) — it only polls
// /api/payment/request/[token] to see what this webhook has already
// written to the database.
//
// Idempotency: guarded on PaymentTransaction.status. If a transaction is
// already SUCCESS, a duplicate delivery of the same event is a no-op — no
// double-marking PAID, no duplicate email (lib/paymentEvents.ts adds a
// second independent guard on top of this one), no duplicate quest funding.

import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature, verifyTransaction } from '@/lib/paystack'
import { logPaymentEvent } from '@/lib/paymentAudit'
import { sendPaymentSuccessEmails, sendPaymentFailedEmail } from '@/lib/paymentEvents'

export const config = {
  api: { bodyParser: false }, // Paystack's signature is computed over the raw body
}

function readRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await readRawBody(req)
  const signature = req.headers['x-paystack-signature'] as string | undefined

  if (!verifyWebhookSignature(rawBody, signature)) {
    await logPaymentEvent('WEBHOOK_INVALID_SIGNATURE', 'webhook', null, {
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    })
    return res.status(401).json({ error: 'Invalid signature' })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return res.status(400).json({ error: 'Malformed payload' })
  }

  // Acknowledge immediately for event types we don't act on, so Paystack
  // doesn't keep retrying something we intentionally ignore.
  if (!['charge.success', 'charge.failed'].includes(event?.event)) {
    return res.status(200).json({ received: true })
  }

  const reference: string | undefined = event?.data?.reference
  if (!reference) return res.status(400).json({ error: 'Missing reference' })

  const tx = await prisma.paymentTransaction.findUnique({
    where: { paystackReference: reference },
    include: { paymentRequest: true },
  })

  if (!tx) {
    // A reference we never created — acknowledge so Paystack stops
    // retrying, but don't touch anything.
    return res.status(200).json({ received: true })
  }

  if (tx.status === 'SUCCESS' || tx.status === 'FAILED') {
    // Already processed — duplicate delivery. Idempotent no-op.
    await logPaymentEvent('WEBHOOK_DUPLICATE_IGNORED', 'webhook', tx.paymentRequestId, { reference })
    return res.status(200).json({ received: true, duplicate: true })
  }

  // Never trust the webhook payload alone for the final word — re-verify
  // server-side against Paystack directly, per the "no false payment
  // claims" rule.
  const verification = await verifyTransaction(reference)
  const paystackData = verification.data

  if (!verification.success || !paystackData) {
    // Verification itself failed (network/API issue) — leave the
    // transaction PENDING so a later retry (or manual founder check) can
    // resolve it, rather than guessing.
    return res.status(200).json({ received: true, pendingVerification: true })
  }

  const pr = tx.paymentRequest

  if (paystackData.status === 'success') {
    await prisma.$transaction([
      prisma.paymentTransaction.update({
        where: { id: tx.id },
        data: {
          status: 'SUCCESS',
          channel: paystackData.channel,
          paidAt: paystackData.paid_at ? new Date(paystackData.paid_at) : new Date(),
          rawEvent: event,
        },
      }),
      prisma.paymentRequest.update({
        where: { id: pr.id },
        data: {
          status: 'PAID',
          paidAt: paystackData.paid_at ? new Date(paystackData.paid_at) : new Date(),
          paystackReference: reference,
          paystackTransactionId: String(paystackData.id),
          paymentChannel: paystackData.channel,
        },
      }),
      ...(pr.linkedQuestId
        ? [prisma.quest.update({ where: { id: pr.linkedQuestId }, data: { status: 'FUNDED' as any } })]
        : []),
    ])

    await logPaymentEvent('PAYMENT_SUCCESS', 'webhook', pr.id, { reference, amount: paystackData.amount })
    if (pr.linkedQuestId) await logPaymentEvent('QUEST_FUNDED', 'webhook', pr.id, { questId: pr.linkedQuestId })

    // Look up the Founder's email for the internal notification —
    // never send it to the client.
    const founder = await prisma.user.findUnique({ where: { id: pr.createdById }, select: { email: true } })

    const updatedPr = await prisma.paymentRequest.findUnique({ where: { id: pr.id } })
    if (updatedPr) await sendPaymentSuccessEmails(updatedPr, founder?.email ?? null)
  } else {
    await prisma.$transaction([
      prisma.paymentTransaction.update({
        where: { id: tx.id },
        data: { status: 'FAILED', channel: paystackData.channel, rawEvent: event },
      }),
      prisma.paymentRequest.update({ where: { id: pr.id }, data: { status: 'FAILED' } }),
    ])
    await logPaymentEvent('PAYMENT_FAILED', 'webhook', pr.id, { reference })

    const updatedPr = await prisma.paymentRequest.findUnique({ where: { id: pr.id } })
    if (updatedPr) await sendPaymentFailedEmail(updatedPr)
  }

  return res.status(200).json({ received: true })
}