import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { evaluateTrial } from '@/lib/ai'

const ROLE_LEVEL: Record<string, number> = {
  GUEST:0,TRIAL_MEMBER:1,ACCEPTED_MEMBER:2,ACTIVE_WORKER:3,
  MODERATOR:4,COORDINATOR:5,ADMIN:6,FOUNDER:7,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session || ROLE_LEVEL[session.user.role] < ROLE_LEVEL['ADMIN']) {
    return res.status(403).json({ error: 'Admins only' })
  }

  const { trialId } = req.body
  if (!trialId) return res.status(400).json({ error: 'trialId required' })

  const trial = await prisma.trial.findUnique({ where: { id: trialId } })
  if (!trial) return res.status(404).json({ error: 'Trial not found' })

  const result = await evaluateTrial({
    strengths: trial.strengths,
    whyJoin: trial.whyJoin,
    skills: trial.skills,
    availability: trial.availability,
    age: trial.age,
  })

  await prisma.trial.update({
    where: { id: trialId },
    data: {
      aiScore: result.score,
      aiSummary: result.summary,
      aiRecommendation: result.recommendation,
      status: 'UNDER_REVIEW',
    },
  })

  return res.json({ result })
}
