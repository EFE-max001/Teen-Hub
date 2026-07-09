import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateAdminRec } from '@/lib/ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(403).json({ error: 'Forbidden' })
  const role = session.user.role as string
  if (role !== 'FOUNDER') {
    const perms = await prisma.adminPermission.findUnique({ where: { userId: session.user.id } })
    if (!perms?.canReports) return res.status(403).json({ error: 'No reports permission' })
  }

  if (req.method === 'GET') {
    const reports = await prisma.report.findMany({
      where: { resolved: false },
      orderBy: { createdAt: 'desc' },
      include: {
        reportedBy: { select: { name: true, nickname: true } },
        reportedAbout: { select: { name: true, nickname: true } },
      },
    })

    // AI decision support: give admins an actionable recommendation per report
    // instead of a blank list they have to judge cold.
    const reportsWithAi = await Promise.all(reports.map(async r => {
      let aiRec = null
      try {
        aiRec = await generateAdminRec({
          type: 'USER_RISK',
          details: `A user reported another user.\nReason: ${r.reason}\nDetails: ${r.details ?? 'none provided'}`,
        })
      } catch { /* AI unavailable, admin reviews manually */ }
      return { ...r, aiRec }
    }))

    return res.json({ reports: reportsWithAi })
  }

  if (req.method === 'PATCH') {
    const { id, resolved } = req.body
    await prisma.report.update({ where: { id }, data: { resolved } })
    return res.json({ ok: true })
  }

  res.status(405).end()
}
