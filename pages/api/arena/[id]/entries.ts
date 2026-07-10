import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Public-to-members entry list for a game — used to render VOTE_BATTLE submissions and rankings.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method !== 'GET') return res.status(405).end()

  const { id } = req.query as { id: string }

  const entries = await prisma.arenaEntry.findMany({
    where: { challengeId: id, aiFlagged: false },
    orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
    take: 50,
    include: { user: { select: { id: true, name: true, nickname: true, rank: true, profilePicUrl: true } } },
  })

  const myVotes = await prisma.arenaVote.findMany({
    where: { voterId: session.user.id, entry: { challengeId: id } },
    select: { entryId: true },
  })

  res.json({ entries, myVotedEntryIds: myVotes.map(v => v.entryId) })
}
