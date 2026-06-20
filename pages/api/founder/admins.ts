import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'GET') {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'MODERATOR', 'COORDINATOR'] } },
      select: {
        id: true, name: true, nickname: true, email: true, role: true,
        status: true, createdAt: true, adminPermission: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return res.json({ admins })
  }

  if (req.method === 'POST') {
    const { name, email, password, role, canTrials, canQuests, canUsers, canReports, canArena } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' })
    }

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return res.status(400).json({ error: 'Email already in use' })

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name, email, passwordHash,
        role: role || 'MODERATOR',
        rank: 'F', xp: 0, status: 'ACTIVE',
      },
    })

    await prisma.adminPermission.create({
      data: {
        userId: user.id,
        role: role || 'MODERATOR',
        canTrials: canTrials || false,
        canQuests: canQuests || false,
        canUsers:  canUsers  || false,
        canReports: canReports || false,
        canArena:  canArena  || false,
      },
    })

    return res.json({ ok: true, userId: user.id })
  }

  if (req.method === 'DELETE') {
    const { userId } = req.body
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'GUEST' },
    })
    await prisma.adminPermission.deleteMany({ where: { userId } })
    return res.json({ ok: true })
  }

  res.status(405).end()
}
