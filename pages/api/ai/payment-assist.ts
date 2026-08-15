// Teen-Hub/pages/api/ai/payment-assist.ts
//
// Founder-only. AI here assists — drafting copy, summarizing numbers the
// server already computed — it never decides payment status or amounts.

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { draftPaymentRequest, summarizePaymentActivity } from '@/lib/ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session || session.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Forbidden' })

    const { action, notes } = req.body || {}

    if (action === 'draft') {
      if (!notes || typeof notes !== 'string') return res.status(400).json({ error: 'notes is required' })
      const draft = await draftPaymentRequest(notes)
      return res.json(draft)
    }

    if (action === 'summary') {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const requests = await prisma.paymentRequest.findMany({ where: { createdAt: { gte: weekAgo } } })
      const paid = requests.filter(r => r.status === 'PAID')
      const pending = requests.filter(r => ['ACTIVE', 'PENDING'].includes(r.status))
      const expiringSoon = requests.filter(
        r => r.expiresAt && r.expiresAt > now && r.expiresAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000
      )

      const summary = await summarizePaymentActivity({
        periodLabel: 'this week',
        receivedCount: paid.length,
        receivedTotal: paid.reduce((s, r) => s + r.baseAmount, 0),
        currency: 'NGN',
        pendingCount: pending.length,
        expiringSoonCount: expiringSoon.length,
      })

      return res.json({ summary })
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (err: any) {
    console.error('[ai/payment-assist] failed:', err)
    return res.status(500).json({
      error: err?.message?.includes('Unknown arg') || err?.message?.includes('does not exist')
        ? `Prisma schema out of sync — run "npx prisma db push" and restart the server. (${err.message})`
        : (err?.message || 'Unexpected server error'),
    })
  }
}