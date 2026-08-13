// Teen-Hub/pages/api/payment/request/[token].ts
//
// PUBLIC. No Teen Hub account required. Returns only the fields a paying
// client should ever see — never the founder's identity, internal notes,
// risk score, or other payment requests. This doubles as the "verify"
// endpoint for the public page: after redirecting back from Paystack, the
// page polls this route to see whether the webhook has already flipped
// the status to PAID (the webhook is the source of truth, never the
// browser's return URL).

import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { logPaymentEvent } from '@/lib/paymentAudit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { token } = req.query
  if (typeof token !== 'string' || !token.startsWith('qh_')) {
    return res.status(404).json({ error: 'Payment link not found' })
  }

  const pr = await prisma.paymentRequest.findUnique({
    where: { publicToken: token },
    include: { linkedQuest: { select: { title: true } } },
  })

  if (!pr) return res.status(404).json({ error: 'Payment link not found' })

  // Lazily expire — a link past its expiry date should read as EXPIRED
  // even if no background job has swept it yet.
  let status = pr.status
  if (status === 'ACTIVE' && pr.expiresAt && pr.expiresAt < new Date()) {
    await prisma.paymentRequest.update({ where: { id: pr.id }, data: { status: 'EXPIRED' } })
    status = 'EXPIRED'
    await logPaymentEvent('PAYMENT_EXPIRED', 'system', pr.id)
  }

  // Fire-and-forget view log — never blocks the response.
  logPaymentEvent('PAYMENT_LINK_OPENED', 'client', pr.id).catch(() => {})

  return res.json({
    reference: pr.reference,
    status,
    title: pr.title,
    description: pr.description,
    currency: pr.currency,
    baseAmount: pr.baseAmount,
    processingFee: pr.processingFee,
    customerTotal: pr.customerTotal,
    feeMode: pr.feeMode,
    linkedQuestTitle: pr.linkedQuest?.title ?? null,
    expiresAt: pr.expiresAt,
    paidAt: pr.paidAt,
    paymentChannel: pr.paymentChannel,
    // Pre-fill values so the client doesn't retype what the Founder
    // already knows about them — still fully editable, never authoritative
    // for anything except contact info.
    clientName: pr.clientName,
    clientEmail: pr.clientEmail,
    clientPhone: pr.clientPhone,
    clientCompany: pr.clientCompany,
    clientNote: pr.clientNote,
  })
}