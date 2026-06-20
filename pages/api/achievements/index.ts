import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAchievements } from '@/lib/ai'

const ROLE_LEVEL: Record<string, number> = {
  GUEST:0,TRIAL_MEMBER:1,ACCEPTED_MEMBER:2,ACTIVE_WORKER:3,
  MODERATOR:4,COORDINATOR:5,ADMIN:6,FOUNDER:7,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const achievements = await prisma.achievement.findMany({
      where: { isActive: true },
      include: {
        awardedTo: {
          where: { userId: session.user.id },
          select: { createdAt: true, awardedByAI: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return res.json({ achievements })
  }

  if (req.method === 'POST') {
    if (ROLE_LEVEL[session.user.role] < ROLE_LEVEL['ADMIN']) {
      return res.status(403).json({ error: 'Admins only' })
    }
    const { name, description, type, icon, condition, xpBonus, expiresAt } = req.body
    if (!name || !description || !condition) {
      return res.status(400).json({ error: 'name, description, and condition required' })
    }
    const achievement = await prisma.achievement.create({
      data: {
        name, description,
        type: type || 'PERMANENT',
        icon: icon || '🏆',
        condition,
        xpBonus: parseInt(xpBonus) || 0,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        createdById: session.user.id,
      },
    })
    return res.status(201).json({ achievement })
  }

  res.status(405).end()
}
