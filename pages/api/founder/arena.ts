import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Founder builds Arena games from the structured rule-engine template.
// `config` holds the flexible JSON: mechanics/attempt_rules/rewards/anti_cheat/ranking.
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
    const {
      title, description, category, icon, type,
      xpReward, cashReward, endsAt, isDaily, config,
    } = req.body

    if (!title || !endsAt) return res.status(400).json({ error: 'Title and end date required' })
    if (!config?.mechanics?.type) return res.status(400).json({ error: 'Game mechanics type required' })

    if (isDaily) {
      // Only one daily challenge active at a time — demote any existing one.
      await prisma.arenaChallenge.updateMany({
        where: { isDaily: true, status: 'ACTIVE' },
        data: { isDaily: false },
      })
    }

    const challenge = await prisma.arenaChallenge.create({
      data: {
        title,
        description: description || config?.objective || '',
        type: type || config?.mechanics?.type || 'CREATIVE_PROMPT',
        category: category || 'Logic',
        icon: icon || '◆',
        xpReward: parseInt(xpReward) || config?.rewards?.xp || 50,
        cashReward: cashReward ? parseFloat(cashReward) : null,
        endsAt: new Date(endsAt),
        isDaily: !!isDaily,
        status: 'ACTIVE',
        config,
      },
    })
    return res.json({ challenge })
  }

  if (req.method === 'PATCH') {
    const { id, status, isDaily } = req.body
    if (!id) return res.status(400).json({ error: 'id required' })

    if (isDaily) {
      await prisma.arenaChallenge.updateMany({
        where: { isDaily: true, status: 'ACTIVE', NOT: { id } },
        data: { isDaily: false },
      })
    }

    const challenge = await prisma.arenaChallenge.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(typeof isDaily === 'boolean' ? { isDaily } : {}),
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
