import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const RANK_LEVEL: Record<string, number> = { F:0,E:1,D:2,C:3,B:4,A:5,S:6,SS:7,SSS:8 }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query as { id: string }
  const quest = await prisma.quest.findUnique({ where: { id } })
  if (!quest) return res.status(404).json({ error: 'Quest not found' })
  if (quest.status !== 'OPEN') return res.status(400).json({ error: 'Quest is not available' })

  const userRank = session.user.rank as string
  if (RANK_LEVEL[userRank] < RANK_LEVEL[quest.rankRequired]) {
    return res.status(403).json({ error: `This quest requires Rank ${quest.rankRequired} or higher` })
  }

  const updated = await prisma.quest.update({
    where: { id },
    data: {
      status: 'CLAIMED',
      claimedById: session.user.id,
      claimedAt: new Date(),
    },
  })

  await prisma.activityLog.create({
    data: { userId: session.user.id, action: 'QUEST_CLAIMED', details: `Claimed quest: ${quest.title}` },
  })

  res.json({ quest: updated })
}
