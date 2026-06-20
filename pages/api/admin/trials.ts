import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkPermission(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return null
  const role = session.user.role as string
  if (role === 'FOUNDER') return session
  const perms = await prisma.adminPermission.findUnique({ where: { userId: session.user.id } })
  if (!perms?.canTrials) return null
  return session
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await checkPermission(req, res)
  if (!session) return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'GET') {
    const trials = await prisma.trial.findMany({
      where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
      orderBy: { submittedAt: 'desc' },
      include: { user: { select: { id: true, name: true, nickname: true, email: true } } },
    })
    return res.json({ trials })
  }

  if (req.method === 'PATCH') {
    const { id, status } = req.body
    const trial = await prisma.trial.update({
      where: { id },
      data: { status, reviewedAt: new Date() },
      include: { user: true },
    })
    if (status === 'ACCEPTED') {
      await prisma.user.update({ where: { id: trial.userId }, data: { role: 'ACCEPTED_MEMBER' } })
    }
    return res.json({ trial })
  }

  res.status(405).end()
}
