import { prisma } from './prisma'
import { Rank } from '@prisma/client'

const RANK_ORDER: Rank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS']

const RANK_THRESHOLDS: Record<Rank, number> = {
  F:   0,
  E:   100,
  D:   300,
  C:   700,
  B:   1500,
  A:   3000,
  S:   6000,
  SS:  12000,
  SSS: 25000,
}

export function getRankForXP(xp: number): Rank {
  let current: Rank = 'F'
  for (const rank of RANK_ORDER) {
    if (xp >= RANK_THRESHOLDS[rank]) current = rank
    else break
  }
  return current
}

export function getNextRank(rank: Rank): Rank | null {
  const idx = RANK_ORDER.indexOf(rank)
  return idx < RANK_ORDER.length - 1 ? RANK_ORDER[idx + 1] : null
}

export function getXPProgress(xp: number, rank: Rank) {
  const next = getNextRank(rank)
  const min = RANK_THRESHOLDS[rank]
  const max = next ? RANK_THRESHOLDS[next] : min
  const progress = max === min ? 100 : Math.min(100, Math.round(((xp - min) / (max - min)) * 100))
  return { min, max, progress, next, xpNeeded: Math.max(0, max - xp) }
}

export async function awardXP(userId: string, amount: number, reason: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
  })

  await prisma.xpLog.create({
    data: { userId, amount, reason },
  })

  // Check for rank up
  const newRank = getRankForXP(user.xp)
  if (newRank !== user.rank) {
    await prisma.user.update({
      where: { id: userId },
      data: { rank: newRank },
    })
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'RANK_UP',
        details: `Ranked up from ${user.rank} to ${newRank}`,
      },
    })
  }

  return user
}

export async function deductXP(userId: string, amount: number, reason: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return

  const newXP = Math.max(0, user.xp - amount)

  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXP },
  })

  await prisma.xpLog.create({
    data: { userId, amount: -amount, reason },
  })

  await prisma.activityLog.create({
    data: { userId, action: 'XP_DEDUCTED', details: reason },
  })
}