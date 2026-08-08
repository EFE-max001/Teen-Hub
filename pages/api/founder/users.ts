// Teen-Hub/pages/api/founder/users.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Forbidden' })

  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, name: true, nickname: true, role: true,
      rank: true, xp: true, status: true, createdAt: true,
      trustScore: true, trustLevel: true, lastNicknameChange: true,
      adminPermission: true,
      _count: {
        select: {
          messagesFrom: true,
          messagesTo: true,
          chatMessages: true,
          questClaims: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Flatten the usage counts onto each user so the Founder War Room table/detail
  // views don't need to know about Prisma's _count shape.
  const enriched = users.map(({ _count, ...u }) => ({
    ...u,
    messageCount: _count.messagesFrom + _count.messagesTo,
    chatMessageCount: _count.chatMessages,
    questClaimCount: _count.questClaims,
  }))

  res.json({ users: enriched })
}