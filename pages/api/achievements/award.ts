import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ROLE_LEVEL: Record<string, number> = {
  GUEST:0,TRIAL_MEMBER:1,ACCEPTED_MEMBER:2,ACTIVE_WORKER:3,
  MODERATOR:4,COORDINATOR:5,ADMIN:6,FOUNDER:7,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session || ROLE_LEVEL[session.user.role] < ROLE_LEVEL['ADMIN']) {
    return res.status(403).json({ error: 'Admins only' })
  }

  const { userId, achievementId } = req.body
  if (!userId || !achievementId) return res.status(400).json({ error: 'userId and achievementId required' })

  const achievement = await prisma.achievement.findUnique({ where: { id: achievementId } })
  if (!achievement) return res.status(404).json({ error: 'Achievement not found' })

  const existing = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId } },
  })
  if (existing) return res.status(409).json({ error: 'Already awarded' })

  const awarded = await prisma.userAchievement.create({
    data: { userId, achievementId, awardedById: session.user.id },
  })

  if (achievement.xpBonus > 0) {
    await prisma.user.update({ where: { id: userId }, data: { xp: { increment: achievement.xpBonus } } })
    await prisma.xpLog.create({ data: { userId, amount: achievement.xpBonus, reason: `Achievement: ${achievement.name}` } })
  }

  await prisma.activityLog.create({
    data: { userId, action: 'ACHIEVEMENT_EARNED', details: `Earned: ${achievement.name}` },
  })

  return res.status(201).json({ awarded })
}
