import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'

const COOLDOWN_DAYS = 7

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const myId = session.user.id
  const { nickname } = req.body

  if (!nickname || typeof nickname !== 'string') return res.status(400).json({ error: 'Nickname is required.' })

  const trimmed = nickname.trim()

  // Validate format
  if (trimmed.length < 3 || trimmed.length > 24)
    return res.status(400).json({ error: 'Nickname must be 3–24 characters.' })

  if (!/^[a-zA-Z0-9_\-. ]+$/.test(trimmed))
    return res.status(400).json({ error: 'Only letters, numbers, spaces, underscores, hyphens, and periods are allowed.' })

  // Check cooldown (founders are exempt)
  const user = await prisma.user.findUnique({
    where: { id: myId },
    select: { nickname: true, lastNicknameChange: true, role: true, name: true },
  })
  if (!user) return res.status(404).json({ error: 'User not found.' })

  const isFounder = user.role === 'FOUNDER'

  if (!isFounder && user.lastNicknameChange) {
    const daysSince = (Date.now() - new Date(user.lastNicknameChange).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince < COOLDOWN_DAYS) {
      const daysLeft = Math.ceil(COOLDOWN_DAYS - daysSince)
      return res.status(429).json({
        error: `You can change your name again in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
        daysLeft,
      })
    }
  }

  // Check uniqueness
  if (trimmed.toLowerCase() !== (user.nickname || '').toLowerCase()) {
    const existing = await prisma.user.findFirst({
      where: { nickname: { equals: trimmed, mode: 'insensitive' }, id: { not: myId } },
    })
    if (existing) return res.status(409).json({ error: 'That name is already taken.' })
  }

  const oldName = user.nickname || user.name || 'Unknown'
  const updated = await prisma.user.update({
    where: { id: myId },
    data: {
      nickname: trimmed,
      lastNicknameChange: isFounder ? undefined : new Date(),
    },
    select: { id: true, nickname: true, lastNicknameChange: true },
  })

  // Notify the founder (unless they changed their own name)
  if (!isFounder) {
    try {
      const founder = await prisma.user.findFirst({
        where: { role: 'FOUNDER' },
        select: { id: true },
      })
      if (founder) {
        await notify(
          founder.id,
          'NAME_CHANGE',
          'Member name changed',
          `${oldName} → ${trimmed}`,
          `/admin`
        )
      }
    } catch {
      // Non-critical — don't fail the request
    }
  }

  return res.json({ success: true, nickname: updated.nickname, lastNicknameChange: updated.lastNicknameChange })
}