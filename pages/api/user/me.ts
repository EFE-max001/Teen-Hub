import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      // Was `trial: true` — the frontend needs the actual assigned task's
      // title/description/etc to render, not just the raw assignedTaskId
      // FK. Without this include, dashboard/trial.tsx had no way to know
      // which single task was assigned, and fell back to rendering a
      // submission form under every task in the whole catalog instead —
      // see pages/dashboard/trial.tsx for the matching frontend fix.
      trial: { include: { assignedTask: true } },
      xpLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
      activityLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      questClaims: {
        where: { status: { in: ['CLAIMED', 'IN_PROGRESS', 'SUBMITTED'] } },
        orderBy: { claimedAt: 'desc' },
        take: 5,
        include: { quest: { select: { id: true, title: true, rewardXp: true, cashReward: true } } },
      },
      warnings: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })

  if (!user) return res.status(404).json({ error: 'User not found' })

  // Never send password
  const { passwordHash, ...safeUser } = user
  return res.status(200).json(safeUser)
}