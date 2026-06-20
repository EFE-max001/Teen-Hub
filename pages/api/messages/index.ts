import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const userId = session.user.id

  const messages = await prisma.message.findMany({
    where: { OR: [{ fromId: userId }, { toId: userId }] },
    include: {
      from: { select: { id: true, name: true, nickname: true } },
      to:   { select: { id: true, name: true, nickname: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Group into conversations
  const convMap = new Map<string, any>()
  for (const msg of messages) {
    const otherId = msg.fromId === userId ? msg.toId : msg.fromId
    const other   = msg.fromId === userId ? msg.to  : msg.from
    if (!convMap.has(otherId)) {
      convMap.set(otherId, {
        userId: otherId,
        name: other.nickname || other.name,
        lastMessage: msg.content,
      })
    }
  }

  res.json({ conversations: Array.from(convMap.values()) })
}
