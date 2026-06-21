import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  const isAdmin = ['FOUNDER', 'ADMIN', 'COORDINATOR'].includes(session.user.role)

  if (req.method === 'PATCH') {
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' })
    const { status, isRead } = req.body
    const feedback = await prisma.feedback.update({
      where: { id: id as string },
      data: {
        ...(status ? { status } : {}),
        ...(isRead !== undefined ? { isRead } : {}),
      },
    })
    return res.json({ feedback })
  }

  if (req.method === 'POST') {
    // Reply to feedback
    if (!isAdmin) return res.status(403).json({ error: 'Only admin can reply' })
    const { content } = req.body
    if (!content?.trim()) return res.status(400).json({ error: 'Reply content required' })

    const [reply] = await prisma.$transaction([
      prisma.feedbackReply.create({
        data: { feedbackId: id as string, authorId: session.user.id, content: content.trim() },
        include: { author: { select: { id: true, nickname: true, name: true, role: true } } },
      }),
      prisma.feedback.update({
        where: { id: id as string },
        data: { status: 'REPLIED' },
      }),
    ])
    return res.json({ reply })
  }

  if (req.method === 'DELETE') {
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' })
    await prisma.feedback.delete({ where: { id: id as string } })
    return res.json({ ok: true })
  }

  res.status(405).end()
}
