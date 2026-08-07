// Teen-Hub/pages/api/members/search.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const RANK_LEVEL: Record<string, number> = { F: 0, E: 1, D: 2, C: 3, B: 4, A: 5, S: 6, SS: 7, SSS: 8 }

// Any Rank D+ member can look up other members to start a DM with. Without this,
// the Messages page had no way to begin a new conversation — a member with an
// empty inbox and no deep link was stuck, since the page only ever showed
// conversations that already existed.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const myRank = (session.user.rank || 'F') as string
  if (RANK_LEVEL[myRank] < RANK_LEVEL['D']) {
    return res.status(403).json({ error: 'Messaging unlocks at Rank D.' })
  }

  const q = ((req.query.q as string) || '').trim()

  const users = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
      status: 'ACTIVE',
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { nickname: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: { id: true, name: true, nickname: true, rank: true, role: true },
    orderBy: [{ nickname: 'asc' }, { name: 'asc' }],
    take: 20,
  })

  res.json({
    members: users.map((u) => ({
      userId: u.id,
      name: u.nickname || u.name || 'Unknown',
      rank: u.rank,
      role: u.role,
    })),
  })
}