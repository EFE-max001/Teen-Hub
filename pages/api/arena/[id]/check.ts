import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Lets the quiz UI show an instant right/wrong flash + explanation the
// moment a player locks in an answer, without ever shipping the full
// answer key up front (pages/api/arena.ts strips correctIndex from every
// question for exactly that reason). Only reveals the ONE question just
// answered — questions not yet reached stay hidden.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) return res.status(401).json({ error: 'Unauthorized' })
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { id } = req.query as { id: string }
    const { questionIndex, chosenIndex } = req.body

    const game = await prisma.arenaChallenge.findUnique({ where: { id } })
    if (!game) return res.status(404).json({ error: 'Game not found' })

    const config = (game.config as any) || {}
    const question = config.quiz?.questions?.[questionIndex]
    if (!question) return res.status(400).json({ error: 'Invalid question index' })

    const correct = chosenIndex === question.correctIndex
    return res.status(200).json({
      correct,
      correctIndex: question.correctIndex,
      explanation: question.explanation || null,
    })
  } catch (err: any) {
    console.error('[arena/check] failed:', err)
    return res.status(500).json({ error: err?.message || 'Unexpected server error' })
  }
}