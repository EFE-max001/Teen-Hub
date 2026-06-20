import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAchievements } from '@/lib/ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const userId = session.user.id

  const [user, allAchievements, existing, quests] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { rank: true, xp: true, trustScore: true, createdAt: true } }),
    prisma.achievement.findMany({ where: { isActive: true }, select: { id: true, name: true, condition: true } }),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
    prisma.quest.count({ where: { claimedById: userId, status: 'APPROVED' } }),
  ])

  if (!user) return res.status(404).json({ error: 'User not found' })

  const daysActive = Math.floor((Date.now() - user.createdAt.getTime()) / 86400000)
  const earned = await checkAchievements(
    {
      userId,
      rank: user.rank,
      xp: user.xp,
      questsCompleted: quests,
      trustScore: user.trustScore,
      daysActive,
      existingAchievements: existing.map(e => e.achievementId),
    },
    allAchievements
  )

  const awarded = []
  for (const achId of earned) {
    try {
      const a = await prisma.userAchievement.create({
        data: { userId, achievementId: achId, awardedByAI: true },
        include: { achievement: true },
      })
      const ach = await prisma.achievement.findUnique({ where: { id: achId } })
      if (ach?.xpBonus) {
        await prisma.user.update({ where: { id: userId }, data: { xp: { increment: ach.xpBonus } } })
      }
      awarded.push(a)
    } catch { /* already awarded */ }
  }

  return res.json({ awarded, count: awarded.length })
}
