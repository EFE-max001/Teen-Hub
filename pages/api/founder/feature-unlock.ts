import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const UNLOCKABLE_FEATURES = [
  { key: 'MESSAGES',        label: 'Direct Messages',      desc: 'Access the messaging system' },
  { key: 'HIGH_VALUE_QUEST',label: 'High-Value Quests',    desc: 'Access quests worth 500+ XP' },
  { key: 'EARLY_RANK_UP',   label: 'Early Rank Promotion', desc: 'Promote before XP threshold' },
  { key: 'ARENA',           label: 'Arena Challenges',     desc: 'Access the Arena before rank B' },
  { key: 'TITLE_CHOICE',    label: 'Custom Title',         desc: 'Choose any available title' },
  { key: 'PORTFOLIO',       label: 'Portfolio Showcase',   desc: 'Featured on guild portfolio page' },
  { key: 'POST_ANON',       label: 'Anonymous Posting',    desc: 'Post anonymously in community' },
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'GET') {
    const { userId } = req.query
    const unlocks = await prisma.userFeatureUnlock.findMany({
      where: userId ? { userId: userId as string } : {},
      include: { user: { select: { id: true, nickname: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return res.json({ unlocks, features: UNLOCKABLE_FEATURES })
  }

  if (req.method === 'POST') {
    const { userId, feature, note } = req.body
    if (!userId || !feature) return res.status(400).json({ error: 'userId and feature required' })
    if (!UNLOCKABLE_FEATURES.find((f) => f.key === feature)) {
      return res.status(400).json({ error: 'Unknown feature key' })
    }

    const unlock = await prisma.userFeatureUnlock.upsert({
      where: { userId_feature: { userId, feature } },
      create: { userId, feature, unlockedById: session.user.id, note: note || null },
      update: { unlockedById: session.user.id, note: note || null },
    })

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'FEATURE_UNLOCKED',
        details: `Feature "${feature}" unlocked by Founder`,
      },
    })

    return res.json({ unlock })
  }

  if (req.method === 'DELETE') {
    const { userId, feature } = req.body
    if (!userId || !feature) return res.status(400).json({ error: 'userId and feature required' })

    await prisma.userFeatureUnlock.delete({
      where: { userId_feature: { userId, feature } },
    })

    return res.json({ ok: true })
  }

  res.status(405).end()
}
