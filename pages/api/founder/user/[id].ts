import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Forbidden' })
  if (req.method !== 'PATCH') return res.status(405).end()

  const { id } = req.query as { id: string }
  const { action, value } = req.body

  try {
    if (action === 'setRank') {
      await prisma.user.update({ where: { id }, data: { rank: value } })
    } else if (action === 'ban') {
      await prisma.user.update({ where: { id }, data: { status: 'BANNED' } })
    } else if (action === 'unban') {
      await prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } })
    } else if (action === 'suspend') {
      await prisma.user.update({ where: { id }, data: { status: 'SUSPENDED' } })
    } else if (action === 'warn') {
      await prisma.warning.create({
        data: { userId: id, reason: 'Founder warning issued', issuedBy: session.user.id },
      })
    } else if (action === 'promote') {
      await prisma.user.update({ where: { id }, data: { role: value } })
    }

    await prisma.activityLog.create({
      data: { userId: id, action: `FOUNDER_${action.toUpperCase()}`, details: `Founder applied ${action}` },
    })

    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
}
