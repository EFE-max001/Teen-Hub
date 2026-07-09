import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateAdminRec } from '@/lib/ai'

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

    // Every trial already carries an AI score/summary from submission time —
    // layer a second-opinion admin recommendation on top for the human reviewer.
    const trialsWithAi = await Promise.all(trials.map(async t => {
      let adminRec = null
      try {
        adminRec = await generateAdminRec({
          type: 'TRIAL_DECISION',
          details: `Applicant AI score: ${t.aiScore ?? 'n/a'}/100. AI summary: ${t.aiSummary ?? 'none'}. AI recommendation: ${t.aiRecommendation ?? 'none'}. Skills: ${t.skills.join(', ')}. Availability: ${t.availability}.`,
        })
      } catch { /* AI unavailable, admin reviews manually */ }
      return { ...t, adminRec }
    }))

    return res.json({ trials: trialsWithAi })
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
