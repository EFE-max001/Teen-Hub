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

  const { userId, titleId, setActive, expiresAt } = req.body
  if (!userId || !titleId) return res.status(400).json({ error: 'userId and titleId required' })

  const title = await prisma.title.findUnique({ where: { id: titleId } })
  if (!title) return res.status(404).json({ error: 'Title not found' })

  const existing = await prisma.userTitle.findUnique({
    where: { userId_titleId: { userId, titleId } },
  })
  if (existing) return res.status(409).json({ error: 'Already awarded' })

  const awarded = await prisma.userTitle.create({
    data: {
      userId, titleId,
      active: setActive || false,
      awardedById: session.user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    },
  })

  if (setActive) {
    await prisma.user.update({ where: { id: userId }, data: { activeTitle: title.name } })
  }

  await prisma.activityLog.create({
    data: { userId, action: 'TITLE_AWARDED', details: `Title: ${title.name}` },
  })

  return res.status(201).json({ awarded })
}
