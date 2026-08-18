import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session || session.user.role !== 'FOUNDER') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (req.method === 'GET') {
      /*
       * Payout amounts have two possible sources:
       *
       * 1. QuestClaim.payoutAmount
       *    Calculated from an actual client payment.
       *
       * 2. Quest.cashReward
       *    The older flat reward configured directly on the quest.
       *
       * We intentionally fetch Quest separately instead of using the
       * QuestClaim.quest relation here. This keeps this endpoint compatible
       * with the currently generated Prisma Client.
       */

      const claims = await prisma.questClaim.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            { payoutAmount: { not: null } },
            { questId: { not: '' } },
          ],
        },
        orderBy: {
          reviewedAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              name: true,
              email: true,
            },
          },
        },
      })

      /*
       * Fetch the quests separately using questId.
       * This avoids relying on QuestClaim.quest being present in
       * the generated Prisma Client type.
       */
      const questIds = Array.from(
        new Set(claims.map((claim) => claim.questId))
      )

      const quests =
        questIds.length > 0
          ? await prisma.quest.findMany({
              where: {
                id: {
                  in: questIds,
                },
              },
              select: {
                id: true,
                title: true,
                cashReward: true,
              },
            })
          : []

      const questById = new Map(
        quests.map((quest) => [quest.id, quest])
      )

      const claimsWithQuest = claims.map((claim) => ({
        ...claim,
        quest: questById.get(claim.questId) ?? null,
      }))

      const amountFor = (claim: (typeof claimsWithQuest)[number]) =>
        claim.payoutAmount ??
        claim.quest?.cashReward ??
        0

      const pending = claimsWithQuest.filter(
        (claim) => claim.payoutStatus === 'PENDING'
      )

      const paid = claimsWithQuest.filter(
        (claim) => claim.payoutStatus === 'PAID'
      )

      const totalPending = pending.reduce(
        (sum, claim) => sum + amountFor(claim),
        0
      )

      const totalPaid = paid.reduce(
        (sum, claim) => sum + amountFor(claim),
        0
      )

      return res.json({
        claims: claimsWithQuest.map((claim) => ({
          ...claim,
          resolvedPayoutAmount: amountFor(claim),
          payoutSource:
            claim.payoutAmount != null
              ? 'client_payment'
              : 'flat_reward',
        })),
        totalPending,
        totalPaid,
        pendingCount: pending.length,
        paidCount: paid.length,
      })
    }

    if (req.method === 'PATCH') {
      const { id, status } = req.body as {
        id: string
        status: 'PENDING' | 'PAID'
      }

      if (!id || !['PENDING', 'PAID'].includes(status)) {
        return res.status(400).json({
          error: 'id and a valid status are required',
        })
      }

      const claim = await prisma.questClaim.update({
        where: {
          id,
        },
        data: {
          payoutStatus: status,
          paidAt: status === 'PAID' ? new Date() : null,
        },
      })

      return res.json({ claim })
    }

    return res.status(405).json({
      error: 'Method not allowed',
    })
  } catch (err: any) {
    console.error('[founder/payouts] failed:', err)

    return res.status(500).json({
      error:
        err?.message?.includes('Unknown arg') ||
        err?.message?.includes('does not exist')
          ? `Prisma schema out of sync — check the generated Prisma Client. (${err.message})`
          : err?.message || 'Unexpected server error',
    })
  }
}