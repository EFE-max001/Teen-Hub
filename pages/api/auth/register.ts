import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password, name, nickname } = req.body

  if (!email || !password || !name || !nickname) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email } })
  const existingByNick  = await prisma.user.findFirst({ where: { nickname } })

  // Nickname taken by a different email
  if (existingByNick && existingByNick.email !== email) {
    return res.status(400).json({ error: 'Nickname already taken' })
  }

  // ── APPLICATION LINKING SYSTEM (Option A) ─────────────────────────────
  // If email already exists (created by apply.ts) → set their password, preserve trial
  if (existingByEmail) {
    // Only allow password setup if the account has no password yet (apply-first flow)
    if (existingByEmail.passwordHash) {
      return res.status(400).json({ error: 'Email already registered. Please log in.' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        passwordHash,
        ...(name ? { name } : {}),
        ...(nickname && !existingByEmail.nickname ? { nickname } : {}),
      },
    })

    await prisma.activityLog.create({
      data: { userId: existingByEmail.id, action: 'ACCOUNT_CLAIMED', details: 'Password set — account linked to application' },
    })

    return res.status(200).json({ success: true, linked: true })
  }

  // Standard registration — no pending application
  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email, name, nickname, passwordHash,
      role: 'GUEST', rank: 'F', xp: 0,
    },
  })

  await prisma.activityLog.create({
    data: { userId: user.id, action: 'REGISTERED', details: 'New account created' },
  })

  return res.status(201).json({ success: true })
}