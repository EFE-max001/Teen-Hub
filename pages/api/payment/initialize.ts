// Teen-Hub/pages/api/payment/initialize.ts
//
// PUBLIC. The client has no Teen Hub account — this is the only mutation
// a public visitor can trigger, and even it is tightly scoped: it can only
// attach contact info to an EXISTING PaymentRequest and kick off a
// Paystack checkout for the SERVER's authoritative amount. The amount,
// fee, and identity of the Founder are never accepted from the request
// body.

import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import {
  initializePayment,
  generatePaystackTxReference,
  computeFeeBreakdown,
} from '@/lib/paystack'
import { validateClientInfo, PAYABLE_STATUSES, canTransition } from '@/lib/paymentLifecycle'
import { logPaymentEvent } from '@/lib/paymentAudit'
import { assessPaymentRisk } from '@/lib/ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { token, clientName, clientEmail, clientPhone, clientCompany, clientNote } = req.body || {}

  if (typeof token !== 'string' || !token.startsWith('qh_')) {
    return res.status(400).json({ error: 'Invalid payment link' })
  }

  const validationError = validateClientInfo({ clientName, clientEmail, clientPhone })
  if (validationError) return res.status(400).json({ error: validationError })

  const pr = await prisma.paymentRequest.findUnique({ where: { publicToken: token } })
  if (!pr) return res.status(404).json({ error: 'Payment link not found' })

  if (pr.expiresAt && pr.expiresAt < new Date()) {
    await prisma.paymentRequest.update({ where: { id: pr.id }, data: { status: 'EXPIRED' } })
    return res.status(410).json({ error: 'This payment link has expired.' })
  }

  if (!PAYABLE_STATUSES.includes(pr.status as any)) {
    return res.status(409).json({ error: `This payment request is ${pr.status.toLowerCase()} and can't be paid.` })
  }

  // Recompute the fee breakdown server-side from the authoritative
  // baseAmount + feeMode every time — never trust anything the client sent
  // about money, and never assume the previously stored numbers are still
  // correct if this is a retry.
  const fee = computeFeeBreakdown(pr.baseAmount, pr.feeMode as any)

  // AI risk assessment — advisory only, never blocks a legitimate payment.
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
  let riskReason = ''
  try {
    const recentFromSameEmail = await prisma.paymentRequest.count({
      where: { clientEmail, id: { not: pr.id } },
    })
    const failedAttempts = await prisma.paymentTransaction.count({
      where: { paymentRequestId: pr.id, status: 'FAILED' },
    })
    const risk = await assessPaymentRisk({
      baseAmount: pr.baseAmount,
      currency: pr.currency,
      clientEmail,
      clientPhone,
      isNewClient: recentFromSameEmail === 0,
      recentRequestsFromSameEmail: recentFromSameEmail,
      recentFailedAttempts: failedAttempts,
      hasLinkedQuest: !!pr.linkedQuestId,
    })
    riskLevel = risk.riskLevel
    riskReason = risk.reason
  } catch {
    // Risk assessment failing must never block a legitimate payment.
  }

  const txReference = generatePaystackTxReference(pr.reference)
  const origin = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.host}`

  const init = await initializePayment({
    email: clientEmail,
    amountNaira: fee.customerTotal,
    reference: txReference,
    callbackUrl: `${origin}/pay/${token}`,
    metadata: { paymentRequestId: pr.id, paymentRequestReference: pr.reference },
  })

  if (!init.success || !init.authorization_url) {
    return res.status(502).json({ error: init.error || 'Could not start payment. Please try again.' })
  }

  const nextStatus = canTransition(pr.status as any, 'PENDING') ? 'PENDING' : pr.status

  await prisma.$transaction([
    prisma.paymentTransaction.create({
      data: {
        paymentRequestId: pr.id,
        paystackReference: txReference,
        status: 'PENDING',
        amount: fee.customerTotal,
      },
    }),
    prisma.paymentRequest.update({
      where: { id: pr.id },
      data: {
        status: nextStatus as any,
        clientName,
        clientEmail,
        clientPhone,
        clientCompany: clientCompany || null,
        clientNote: clientNote || null,
        processingFee: fee.processingFee,
        founderFeeShare: fee.founderFeeShare,
        customerTotal: fee.customerTotal,
        riskLevel: riskLevel as any,
        riskReason: riskReason || null,
      },
    }),
  ])

  await logPaymentEvent('PAYMENT_INITIALIZED', 'client', pr.id, { txReference, riskLevel })

  return res.json({ authorization_url: init.authorization_url })
}