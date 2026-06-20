import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { name, nickname, age, dob, email, skills, strengths, whyJoin, availability, contactInfo, portfolioUrl } = req.body
  const ageValue = age ?? dob

  if (!name || !nickname || !ageValue || !email || !skills?.length || !strengths || !whyJoin || !availability || !contactInfo) {
    return res.status(400).json({ error: 'All required fields must be filled.' })
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { nickname }] },
  })

  if (existing) {
    return res.status(400).json({ error: 'An account with this email or nickname already exists.' })
  }

  // Create user as TRIAL_MEMBER with temp password
  const tempPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10)

  const user = await prisma.user.create({
    data: {
      name,
      nickname,
      email,
      passwordHash: tempPassword,
      role: 'TRIAL_MEMBER',
      rank: 'F',
      xp: 0,
      skills,
    },
  })

  await prisma.trial.create({
    data: {
      userId: user.id,
      age: parseInt(ageValue),
      skills,
      strengths,
      whyJoin,
      availability,
      contactInfo,
      portfolioUrl: portfolioUrl || null,
      status: 'PENDING',
    },
  })

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'APPLIED',
      details: 'Submitted guild application',
    },
  })

  return res.status(201).json({ success: true })
}