import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.notification.count({ where: { userId: session.user.id, read: false } }),
    ])
    return res.json({ notifications, unreadCount })
  }

  if (req.method === 'PATCH') {
    const { id, all } = req.body as { id?: string; all?: boolean }
    if (all) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true },
      })
      return res.json({ ok: true })
    }
    if (!id) return res.status(400).json({ error: 'id or all is required' })
    await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { read: true },
    })
    return res.json({ ok: true })
  }

  res.status(405).end()
}