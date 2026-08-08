import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const myId = session.user.id
  const { requestId } = req.query as { requestId: string }

  // PATCH — accept or decline a request
  if (req.method === 'PATCH') {
    const { action } = req.body // 'accept' | 'decline'
    if (!['accept', 'decline'].includes(action)) return res.status(400).json({ error: 'Invalid action' })

    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } })
    if (!request) return res.status(404).json({ error: 'Request not found' })
    if (request.toId !== myId) return res.status(403).json({ error: 'Not your request' })
    if (request.status !== 'PENDING') return res.status(400).json({ error: 'Request already handled' })

    const status = action === 'accept' ? 'ACCEPTED' : 'DECLINED'
    await prisma.friendRequest.update({ where: { id: requestId }, data: { status } })

    if (action === 'accept') {
      const acceptorName = session.user.nickname || session.user.name || 'A guild member'
      await notify(
        request.fromId,
        'FRIEND_ACCEPTED',
        `${acceptorName} accepted your request`,
        'You are now connected. Start a conversation in Messages.',
        '/dashboard/messages'
      )
    }

    return res.json({ success: true, status })
  }

  // DELETE — unfriend (remove accepted connection)
  if (req.method === 'DELETE') {
    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } })
    if (!request) return res.status(404).json({ error: 'Not found' })
    if (request.fromId !== myId && request.toId !== myId) return res.status(403).json({ error: 'Forbidden' })

    await prisma.friendRequest.delete({ where: { id: requestId } })
    return res.json({ success: true })
  }

  res.status(405).end()
}