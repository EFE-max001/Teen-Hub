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

  if (attemptRules.entry_limit && existing.filter(e => e.response).length >= attemptRules.entry_limit) {
    return res.status(400).json({ error: 'Entry limit reached for this game' })
  }
  if (attemptRules.cooldown_minutes && existing[0]?.response) {
    const cooldownMs = attemptRules.cooldown_minutes * 60_000
    const elapsed = Date.now() - new Date(existing[0].createdAt).getTime()
    if (elapsed < cooldownMs) {
      const waitMin = Math.ceil((cooldownMs - elapsed) / 60_000)
      return res.status(400).json({ error: `Cooldown active — try again in ${waitMin}m` })
    }
  }

  // Time limit enforcement — previously config.time_limit_seconds was collected
  // by the Founder form and shown in the UI but never actually checked anywhere.
  const timeLimitSeconds: number = config.time_limit_seconds || 0
  if (timeLimitSeconds > 0) {
    const startedAt = existing[0]?.startedAt
    if (!startedAt) {
      return res.status(400).json({ error: 'Open the game first so the timer can start' })
    }
    const elapsedSeconds = (Date.now() - new Date(startedAt).getTime()) / 1000
    if (elapsedSeconds > timeLimitSeconds) {
      return res.status(400).json({ error: 'Time limit expired for this attempt' })
    }
  }

  const mechanicsType = config.mechanics?.type
  const validationType = config.mechanics?.validation_type || 'auto'
  let aiScore: number | null = null
  let aiFeedback: string | null = null
  let aiFlagged = false

  if (mechanicsType === 'quiz' && config.quiz) {
    // Deterministic grading — no AI ambiguity, no 5/100-on-an-empty-field
    // situations. response is the chosen option's index as a string.
    const chosen = parseInt(response, 10)
    const correct = chosen === config.quiz.correctIndex
    aiScore = correct ? 100 : 0
    aiFeedback = config.quiz.explanation
      ? `${correct ? 'Correct! ' : 'Not quite. '}${config.quiz.explanation}`
      : (correct ? 'Correct!' : 'Not quite.')
    aiFlagged = false
  } else if (mechanicsType === 'tap_speed') {
    // response is the raw tap count from the client-side timer game.
    // 30 taps in the window is treated as a "perfect" score — arbitrary but
    // deterministic; Founders can't yet tune the target, so this is a
    // reasonable default rather than AI-guessed.
    const taps = Math.max(0, parseInt(response, 10) || 0)
    aiScore = Math.min(100, Math.round((taps / 30) * 100))
    aiFeedback = `${taps} taps recorded.`
    aiFlagged = false
  } else if (validationType !== 'manual') {
    // AI validator layer — for the free-text mechanics (puzzle/creative/
    // social_task) where there's no single deterministic correct answer.
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

  // Award XP immediately for auto-graded, non-flagged entries. Quiz games
  // only pay out on a correct answer — guessing shouldn't be free XP.
  let xpAwarded = 0
  const qualifiesForXp = mechanicsType === 'quiz' ? aiScore === 100 : true
  if (validationType === 'auto' && !aiFlagged && qualifiesForXp && config.rewards?.xp) {
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