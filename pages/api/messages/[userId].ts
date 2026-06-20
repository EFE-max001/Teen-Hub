import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CONTACT_PATTERNS = [
  /\b\d{7,}\b/,
  /@[a-zA-Z0-9_]{3,}/,
  /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/,
  /whatsapp|telegram|discord|instagram|snapchat|phone|number/i,
]

function containsContactInfo(text: string): boolean {
  return CONTACT_PATTERNS.some(p => p.test(text))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const { userId: otherId } = req.query as { userId: string }
  const myId = session.user.id

  if (req.method === 'GET') {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromId: myId, toId: otherId },
          { fromId: otherId, toId: myId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        from: { select: { id: true, name: true, nickname: true } },
      },
    })
    return res.json({ messages })
  }

  if (req.method === 'POST') {
    const { content } = req.body
    if (!content?.trim()) return res.status(400).json({ error: 'Empty message' })

    if (containsContactInfo(content)) {
      return res.status(400).json({
        error: 'Message blocked. Sharing contact information outside the platform is not permitted.',
        blocked: true,
      })
    }

    const message = await prisma.message.create({
      data: { fromId: myId, toId: otherId, content: content.trim() },
      include: { from: { select: { id: true, name: true, nickname: true } } },
    })
    return res.json({ message })
  }

  res.status(405).end()
}
