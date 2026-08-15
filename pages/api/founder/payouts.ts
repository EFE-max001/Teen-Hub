import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session || session.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Forbidden' })

    if (req.method === 'GET') {
      // Two sources of a payout amount now exist:
      //  - claim.payoutAmount: calculated from an actual client payment via
      //    a linked PaymentRequest (see lib/questPayout.ts) — the real
      //    "what was I actually paid for this" flow that didn't exist before.
      //  - quest.cashReward: the older flat, Founder-set reward, still valid
      //    for quests that were never linked to a client payment at all.
      // A claim only ever shows up here if it has one or the other.
      const claims = await prisma.questClaim.findMany({
        where: {
          status: 'APPROVED',
          OR: [{ payoutAmount: { not: null } }, { quest: { cashReward: { not: null } } }],
        },
        orderBy: { reviewedAt: 'desc' },
        include: {
          user: { select: { id: true, nickname: true, name: true, email: true, bankAccountName: true, paystackRecipientCode: true } },
          quest: { select: { id: true, title: true, cashReward: true } },
        },
      })

      const amountFor = (c: (typeof claims)[number]) => c.payoutAmount ?? c.quest.cashReward ?? 0

      const pending = claims.filter(c => c.payoutStatus === 'PENDING')
      const paid = claims.filter(c => c.payoutStatus === 'PAID')

      const totalPending = pending.reduce((sum, c) => sum + amountFor(c), 0)
      const totalPaid = paid.reduce((sum, c) => sum + amountFor(c), 0)

      return res.json({
        claims: claims.map(c => ({ ...c, resolvedPayoutAmount: amountFor(c), payoutSource: c.payoutAmount != null ? 'client_payment' : 'flat_reward' })),
        totalPending,
        totalPaid,
        pendingCount: pending.length,
        paidCount: paid.length,
      })
    }

    if (req.method === 'PATCH') {
      const { id, status } = req.body as { id: string; status: 'PENDING' | 'PAID' }
      if (!id || !['PENDING', 'PAID'].includes(status)) {
        return res.status(400).json({ error: 'id and a valid status are required' })
      }
      const claim = await prisma.questClaim.update({
        where: { id },
        data: { payoutStatus: status, paidAt: status === 'PAID' ? new Date() : null },
      })
      return res.json({ claim })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err: any) {
    console.error('[founder/payouts] failed:', err)
    return res.status(500).json({
      error: err?.message?.includes('Unknown arg') || err?.message?.includes('does not exist')
        ? `Prisma schema out of sync — run "npx prisma db push" and restart the server. (${err.message})`
        : (err?.message || 'Unexpected server error'),
    })
  }
}