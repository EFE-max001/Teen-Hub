import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(403).json({ error: 'Forbidden' })
  const role = session.user.role as string
  if (role !== 'FOUNDER') {
    const perms = await prisma.adminPermission.findUnique({ where: { userId: session.user.id } })
    if (!perms?.canArena) return res.status(403).json({ error: 'No arena permission' })
  }

  const challenges = await prisma.arenaChallenge.findMany({ orderBy: { createdAt: 'desc' } })
  res.json({ challenges })
}
