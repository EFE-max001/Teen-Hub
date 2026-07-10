import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateArenaEntry } from '@/lib/ai'

// Handles submissions for any Arena Protocol game archetype (rule-engine driven).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method !== 'POST') return res.status(405).end()

  const { id } = req.query as { id: string }
  const { response } = req.body
  if (!response?.trim()) return res.status(400).json({ error: 'Submission cannot be empty' })

  const game = await prisma.arenaChallenge.findUnique({ where: { id } })
  if (!game) return res.status(404).json({ error: 'Game not found' })
  if (game.status !== 'ACTIVE') return res.status(400).json({ error: 'This game is closed' })
  if (new Date(game.endsAt) < new Date()) return res.status(400).json({ error: 'Deadline has passed' })

  const config = (game.config as any) || {}
  const attemptRules = config.attempt_rules || { entry_limit: 1, cooldown_minutes: 0 }

  const existing = await prisma.arenaEntry.findMany({
    where: { challengeId: id, userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  if (attemptRules.entry_limit && existing.length >= attemptRules.entry_limit) {
    return res.status(400).json({ error: 'Entry limit reached for this game' })
  }
  if (attemptRules.cooldown_minutes && existing[0]) {
    const cooldownMs = attemptRules.cooldown_minutes * 60_000
    const elapsed = Date.now() - new Date(existing[0].createdAt).getTime()
    if (elapsed < cooldownMs) {
      const waitMin = Math.ceil((cooldownMs - elapsed) / 60_000)
      return res.status(400).json({ error: `Cooldown active — try again in ${waitMin}m` })
    }
  }

  // AI validator layer — auto-grades unless the game requires manual/hybrid review.
  const validationType = config.mechanics?.validation_type || 'auto'
  let aiScore: number | null = null
  let aiFeedback: string | null = null
  let aiFlagged = false

  if (validationType !== 'manual') {
    const result = await validateArenaEntry({
      gameTitle: game.title,
      category: game.category || 'General',
      objective: config.objective || game.description,
      validationType,
      content: response,
    })
    aiScore = result.score
    aiFeedback = result.feedback
    aiFlagged = result.flagged
  }

  const entry = await prisma.arenaEntry.upsert({
    where: { challengeId_userId: { challengeId: id, userId: session.user.id } },
    create: {
      challengeId: id,
      userId: session.user.id,
      response: response.trim(),
      score: aiScore ?? 0,
      aiScore, aiFeedback, aiFlagged,
    },
    update: {
      response: response.trim(),
      score: aiScore ?? 0,
      aiScore, aiFeedback, aiFlagged,
    },
  })

  // Award XP immediately for auto-graded, non-flagged entries.
  let xpAwarded = 0
  if (validationType === 'auto' && !aiFlagged && config.rewards?.xp) {
    xpAwarded = config.rewards.xp
    await prisma.user.update({
      where: { id: session.user.id },
      data: { xp: { increment: xpAwarded } },
    })
    await prisma.xpLog.create({
      data: { userId: session.user.id, amount: xpAwarded, reason: `Arena: ${game.title}` },
    }).catch(() => {})
  }

  res.json({ entry, aiFlagged, xpAwarded })
}
