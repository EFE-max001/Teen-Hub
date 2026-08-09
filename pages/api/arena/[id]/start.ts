import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Called when a member opens a game with a time limit. Stamps `startedAt`
// exactly once per user/challenge — reopening the modal never resets the
// clock. submit.ts checks this against config.time_limit_seconds so the
// limit shown in the UI is actually enforced instead of purely cosmetic.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method !== 'POST') return res.status(405).end()

  const { id } = req.query as { id: string }

  const game = await prisma.arenaChallenge.findUnique({ where: { id } })
  if (!game) return res.status(404).json({ error: 'Game not found' })
  if (game.status !== 'ACTIVE') return res.status(400).json({ error: 'This game is closed' })

  const existing = await prisma.arenaEntry.findUnique({
    where: { challengeId_userId: { challengeId: id, userId: session.user.id } },
  })

  if (existing?.response) {
    return res.status(400).json({ error: 'You already submitted an entry for this game' })
  }

  const entry = existing
    ? existing
    : await prisma.arenaEntry.create({
        data: { challengeId: id, userId: session.user.id, startedAt: new Date() },
      })

  const config = (game.config as any) || {}
  res.json({
    startedAt: entry.startedAt,
    timeLimitSeconds: config.time_limit_seconds || 0,
  })
}