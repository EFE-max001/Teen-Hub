import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'GET') {
    const challenges = await prisma.arenaChallenge.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { entries: true } } },
    })
    return res.json({ challenges })
  }

  if (req.method === 'POST') {
    const { title, description, type, xpReward, cashReward, endsAt } = req.body
    if (!title || !endsAt) return res.status(400).json({ error: 'Title and end date required' })

    const challenge = await prisma.arenaChallenge.create({
      data: {
        title, description: description || '',
        type: type || 'challenge',
        xpReward: parseInt(xpReward) || 50,
        cashReward: cashReward ? parseFloat(cashReward) : null,
        endsAt: new Date(endsAt),
      },
    })
    return res.json({ challenge })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    await prisma.arenaChallenge.delete({ where: { id } })
    return res.json({ ok: true })
  }

  res.status(405).end()
}
