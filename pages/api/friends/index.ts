import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const myId = session.user.id

  // GET — return friends list + pending incoming requests + sent requests
  if (req.method === 'GET') {
    const [accepted, incoming, outgoing, blocks] = await Promise.all([
      prisma.friendRequest.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [{ fromId: myId }, { toId: myId }],
        },
        include: {
          from: { select: { id: true, name: true, nickname: true, rank: true, profilePicUrl: true } },
          to:   { select: { id: true, name: true, nickname: true, rank: true, profilePicUrl: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.friendRequest.findMany({
        where: { toId: myId, status: 'PENDING' },
        include: {
          from: { select: { id: true, name: true, nickname: true, rank: true, profilePicUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.friendRequest.findMany({
        where: { fromId: myId, status: 'PENDING' },
        include: {
          to: { select: { id: true, name: true, nickname: true, rank: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userBlock.findMany({
        where: { blockerId: myId },
        select: { blockedId: true },
      }),
    ])

    const friends = accepted.map(r => {
      const other = r.fromId === myId ? r.to : r.from
      return { requestId: r.id, userId: other.id, name: other.nickname || other.name, rank: other.rank, pic: other.profilePicUrl }
    })

    const blockedIds = blocks.map(b => b.blockedId)

    return res.json({
      friends,
      incoming: incoming.map(r => ({
        requestId: r.id,
        userId: r.from.id,
        name: r.from.nickname || r.from.name,
        rank: r.from.rank,
        pic: r.from.profilePicUrl,
        createdAt: r.createdAt,
      })),
      outgoing: outgoing.map(r => ({
        requestId: r.id,
        userId: r.to.id,
        name: r.to.nickname || r.to.name,
        rank: r.to.rank,
      })),
      blockedIds,
    })
  }

  // POST — send a friend request
  if (req.method === 'POST') {
    const { toId } = req.body
    if (!toId || toId === myId) return res.status(400).json({ error: 'Invalid target' })

    // Check if blocked
    const blocked = await prisma.userBlock.findFirst({
      where: { OR: [{ blockerId: myId, blockedId: toId }, { blockerId: toId, blockedId: myId }] },
    })
    if (blocked) return res.status(403).json({ error: 'Cannot send request — user is blocked.' })

    // Check if already exists
    const existing = await prisma.friendRequest.findFirst({
      where: { OR: [{ fromId: myId, toId }, { fromId: toId, toId: myId }] },
    })
    if (existing) {
      if (existing.status === 'ACCEPTED') return res.status(400).json({ error: 'Already friends.' })
      if (existing.status === 'PENDING') return res.status(400).json({ error: 'Request already sent.' })
      // If declined, allow re-request by updating
      if (existing.fromId === myId) {
        await prisma.friendRequest.update({ where: { id: existing.id }, data: { status: 'PENDING' } })
        return res.json({ success: true, message: 'Request re-sent.' })
      }
      return res.status(400).json({ error: 'The other person declined previously. They need to send you a request.' })
    }

    const toUser = await prisma.user.findUnique({ where: { id: toId }, select: { id: true, name: true, nickname: true } })
    if (!toUser) return res.status(404).json({ error: 'User not found.' })

    const request = await prisma.friendRequest.create({ data: { fromId: myId, toId } })

    const senderName = session.user.nickname || session.user.name || 'A guild member'
    await notify(toId, 'FRIEND_REQUEST', `${senderName} wants to connect`, `You have a new friend request. Accept or decline in your Messages tab.`, '/dashboard/messages?tab=requests')

    return res.status(201).json({ success: true, requestId: request.id })
  }

  res.status(405).end()
}