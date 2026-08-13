// Teen-Hub/pages/api/founder/payments/index.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeFeeBreakdown, generatePublicToken, generateReference, FeeMode } from '@/lib/paystack'
import { logPaymentEvent } from '@/lib/paymentAudit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'GET') {
    const requests = await prisma.paymentRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { linkedQuest: { select: { id: true, title: true } } },
    })

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const summary = {
      totalReceived: requests.filter(r => r.status === 'PAID').reduce((s, r) => s + r.baseAmount, 0),
      paidThisMonth: requests.filter(r => r.status === 'PAID' && r.paidAt && r.paidAt >= monthStart).reduce((s, r) => s + r.baseAmount, 0),
      pendingCount: requests.filter(r => r.status === 'PENDING').length,
      outstanding: requests.filter(r => ['ACTIVE', 'PENDING'].includes(r.status)).reduce((s, r) => s + r.customerTotal, 0),
      failedCount: requests.filter(r => r.status === 'FAILED').length,
      expiredCount: requests.filter(r => r.status === 'EXPIRED').length,
      paidCount: requests.filter(r => r.status === 'PAID').length,
    }

    return res.json({ requests, summary })
  }

  if (req.method === 'POST') {
    const {
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      title,
      description,
      baseAmount,
      currency,
      expiresAt,
      linkedQuestId,
      founderNote,
      feeMode,
    } = req.body || {}

    if (!title || !description || !baseAmount || Number(baseAmount) <= 0) {
      return res.status(400).json({ error: 'Title, description, and a positive amount are required.' })
    }
    const mode: FeeMode = ['CLIENT_PAYS', 'FOUNDER_PAYS', 'SPLIT_50_50'].includes(feeMode) ? feeMode : 'CLIENT_PAYS'
    const fee = computeFeeBreakdown(Number(baseAmount), mode)

    const pr = await prisma.paymentRequest.create({
      data: {
        publicToken: generatePublicToken(),
        reference: generateReference(),
        status: 'ACTIVE',
        title,
        description,
        baseAmount: Number(baseAmount),
        currency: currency || 'NGN',
        feeMode: mode,
        processingFee: fee.processingFee,
        founderFeeShare: fee.founderFeeShare,
        customerTotal: fee.customerTotal,
        clientName: clientName || null,
        clientEmail: clientEmail || null,
        clientPhone: clientPhone || null,
        clientCompany: clientCompany || null,
        createdById: session.user.id,
        linkedQuestId: linkedQuestId || null,
        founderNote: founderNote || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    await logPaymentEvent('PAYMENT_REQUEST_CREATED', `founder:${session.user.id}`, pr.id, { reference: pr.reference })

    const origin = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.host}`
    return res.status(201).json({ paymentRequest: pr, payUrl: `${origin}/pay/${pr.publicToken}` })
  }

  res.status(405).end()
}