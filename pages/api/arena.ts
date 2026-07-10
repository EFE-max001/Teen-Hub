import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const challenges = await prisma.arenaChallenge.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ isDaily: 'desc' }, { createdAt: 'desc' }],
    include: {
      _count: { select: { entries: true } },
      entries: {
        where: { userId: session.user.id },
        select: { id: true, score: true, aiScore: true, createdAt: true, response: true },
      },
    },
  })

  const leaderboard = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { xp: 'desc' },
    take: 10,
    select: { id: true, name: true, nickname: true, xp: true, rank: true, profilePicUrl: true },
  })

  res.json({ challenges, leaderboard })
}
