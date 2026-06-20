import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VERIFICATION_TYPES = ['social', 'location', 'face', 'identity']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const { type, evidence } = req.body
  if (!type || !VERIFICATION_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${VERIFICATION_TYPES.join(', ')}` })
  }

  const existing = await prisma.profileVerification.findFirst({
    where: { userId: session.user.id, type, status: 'PENDING' },
  })
  if (existing) return res.status(409).json({ error: 'Verification already pending review' })

  const verification = await prisma.profileVerification.create({
    data: { userId: session.user.id, type, evidence: evidence || null },
  })

  return res.status(201).json({ verification })
}
