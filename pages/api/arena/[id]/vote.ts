import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Vote on an ArenaEntry (used by VOTE_BATTLE-type games). One vote per entry per user.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method !== 'POST') return res.status(405).end()

  const { entryId } = req.body
  if (!entryId) return res.status(400).json({ error: 'entryId required' })

  const entry = await prisma.arenaEntry.findUnique({ where: { id: entryId } })
  if (!entry) return res.status(404).json({ error: 'Entry not found' })
  if (entry.userId === session.user.id) return res.status(400).json({ error: "You can't vote for your own entry" })

  try {
    await prisma.arenaVote.create({ data: { entryId, voterId: session.user.id } })
  } catch {
    return res.status(400).json({ error: 'You already voted on this entry' })
  }

  const updated = await prisma.arenaEntry.update({
    where: { id: entryId },
    data: { votes: { increment: 1 }, score: { increment: 1 } },
  })

  res.json({ entry: updated })
}
