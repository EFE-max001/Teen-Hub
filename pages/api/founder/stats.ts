import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Forbidden' })

  const [totalUsers, activeQuests, pendingTrials, totalQuests] = await Promise.all([
    prisma.user.count(),
    prisma.quest.count({ where: { status: 'OPEN' } }),
    prisma.trial.count({ where: { status: 'PENDING' } }),
    prisma.quest.count(),
  ])

  res.json({ totalUsers, activeQuests, pendingTrials, totalQuests })
}
