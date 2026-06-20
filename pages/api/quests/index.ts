import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ROLE_LEVEL: Record<string, number> = {
  GUEST: 0, TRIAL_MEMBER: 1, ACCEPTED_MEMBER: 2, ACTIVE_WORKER: 3,
  MODERATOR: 4, COORDINATOR: 5, ADMIN: 6, FOUNDER: 7,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  if (ROLE_LEVEL[session.user.role] < ROLE_LEVEL['ACCEPTED_MEMBER']) {
    return res.status(403).json({ error: 'Access denied' })
  }

  const quests = await prisma.quest.findMany({
    where: { status: { in: ['OPEN', 'CLAIMED', 'IN_PROGRESS'] } },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ quests })
}
