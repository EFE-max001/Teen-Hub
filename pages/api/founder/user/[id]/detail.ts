import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Forbidden' })
  if (req.method !== 'GET') return res.status(405).end()

  const { id } = req.query as { id: string }

  const [user, trial, quests, warnings] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.trial.findUnique({ where: { userId: id }, include: { assignedTask: true } }),
    prisma.quest.findMany({ where: { claimedById: id }, orderBy: { createdAt: 'desc' } }),
    prisma.warning.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' } }),
  ])

  if (!user) return res.status(404).json({ error: 'User not found' })

  const approved = quests.filter(q => q.status === 'APPROVED').length
  const rejected = quests.filter(q => q.status === 'REJECTED' || (q.reviewNote && q.status === 'OPEN' && q.claimedById === null)).length
  const totalReviewed = quests.filter(q => q.reviewedAt).length
  const completionRate = totalReviewed > 0 ? Math.round((approved / totalReviewed) * 100) : null
  const ratedQuests = quests.filter(q => q.clientRating != null)
  const avgRating = ratedQuests.length > 0
    ? Math.round((ratedQuests.reduce((s, q) => s + (q.clientRating || 0), 0) / ratedQuests.length) * 10) / 10
    : null

  // passwordHash deliberately excluded — never sent to the client
  const { passwordHash, ...safeUser } = user

  res.json({
    user: safeUser,
    trial,
    quests,
    warnings,
    stats: {
      totalClaimed: quests.length,
      approved,
      totalReviewed,
      completionRate,
      avgRating,
      ratedCount: ratedQuests.length,
    },
  })
}