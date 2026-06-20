import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password, name, nickname } = req.body

  if (!email || !password || !name || !nickname) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { nickname }] },
  })

  if (existing) {
    return res.status(400).json({ error: 'Email or nickname already taken' })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email,
      name,
      nickname,
      passwordHash,
      role: 'GUEST',
      rank: 'F',
      xp: 0,
    },
  })

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'REGISTERED',
      details: 'New account created',
    },
  })

  return res.status(201).json({ success: true })
}