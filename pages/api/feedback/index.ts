import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { triageFeedback } from '@/lib/ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (req.method === 'POST') {
    const { content, type, email } = req.body
    if (!content || content.trim().length < 5) {
      return res.status(400).json({ error: 'Feedback content is required (min 5 characters)' })
    }

    // AI triage: auto-categorize, prioritize, and flag toxic feedback so the
    // founder's inbox is pre-sorted instead of a flat unsorted list.
    let triage: { category: string; priority: string; toxic: boolean; summary: string } | null = null
    try {
      triage = await triageFeedback({ message: content.trim() })
    } catch { /* AI unavailable, falls back to raw content below */ }

    const feedback = await prisma.feedback.create({
      data: {
        content: content.trim(),
        type: type || triage?.category || 'GENERAL',
        status: triage?.toxic ? 'FLAGGED' : 'OPEN',
        email: session?.user?.email || email || null,
        userId: session?.user?.id || null,
      },
    })
    return res.status(201).json({ feedback, triage })
  }

  if (req.method === 'GET') {
    if (!session) return res.status(401).json({ error: 'Unauthorized' })

    const isFounder = session.user.role === 'FOUNDER'
    const isAdmin = ['FOUNDER', 'ADMIN', 'COORDINATOR'].includes(session.user.role)

    if (isAdmin) {
      const feedbacks = await prisma.feedback.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, nickname: true, name: true, email: true, role: true } },
          replies: {
            include: { author: { select: { id: true, nickname: true, name: true, role: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      })
      return res.json({ feedbacks })
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        replies: {
          include: { author: { select: { id: true, nickname: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    return res.json({ feedbacks })
  }

  res.status(405).end()
}
