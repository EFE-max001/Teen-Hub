import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TRUST_EVENTS, computeTrustLevel, clampTrust } from '@/lib/ai'

const ROLE_LEVEL: Record<string, number> = {
  GUEST:0,TRIAL_MEMBER:1,ACCEPTED_MEMBER:2,ACTIVE_WORKER:3,
  MODERATOR:4,COORDINATOR:5,ADMIN:6,FOUNDER:7,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { userId } = req.query
    const targetId = (userId as string) || session.user.id

    if (targetId !== session.user.id && ROLE_LEVEL[session.user.role] < ROLE_LEVEL['ADMIN']) {
      return res.status(403).json({ error: 'Cannot view other users trust score' })
    }

    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: { trustScore: true, trustLevel: true, rank: true },
    })

    const events = await prisma.trustEvent.findMany({
      where: { userId: targetId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return res.json({ trustScore: user?.trustScore, trustLevel: user?.trustLevel, events })
  }

  if (req.method === 'POST') {
    if (ROLE_LEVEL[session.user.role] < ROLE_LEVEL['ADMIN']) {
      return res.status(403).json({ error: 'Admins only' })
    }

    const { userId, action, reason, source } = req.body
    if (!userId || !action) return res.status(400).json({ error: 'userId and action required' })

    const delta = TRUST_EVENTS[action] ?? 0
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { trustScore: true } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const newScore = clampTrust((user.trustScore || 50) + delta)
    const newLevel = computeTrustLevel(newScore)

    await prisma.trustEvent.create({
      data: { userId, action, delta, reason: reason || action, source: source || 'ADMIN' },
    })

    await prisma.user.update({
      where: { id: userId },
      data: { trustScore: newScore, trustLevel: newLevel },
    })

    return res.json({ trustScore: newScore, trustLevel: newLevel, delta })
  }

  res.status(405).end()
}
