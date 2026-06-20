import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Forbidden' })

  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, name: true, nickname: true, role: true,
      rank: true, xp: true, status: true, createdAt: true,
      adminPermission: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ users })
}
