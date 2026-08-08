import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Only the FOUNDER can use this endpoint
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Founders only.' })

  const founderId = session.user.id

  // GET — return current ghost identity
  if (req.method === 'GET') {
    const ghost = await prisma.founderGhostIdentity.findUnique({ where: { founderId } })
    return res.json({ ghost: ghost || null })
  }

  // POST — create ghost identity
  if (req.method === 'POST') {
    const { ghostName, ghostRank } = req.body
    if (!ghostName || typeof ghostName !== 'string')
      return res.status(400).json({ error: 'Ghost name is required.' })

    const trimmed = ghostName.trim()
    if (trimmed.length < 3 || trimmed.length > 24)
      return res.status(400).json({ error: 'Name must be 3–24 characters.' })

    if (!/^[a-zA-Z0-9_\-. ]+$/.test(trimmed))
      return res.status(400).json({ error: 'Only letters, numbers, spaces, underscores, hyphens, and periods allowed.' })

    const VALID_RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS']
    if (ghostRank && !VALID_RANKS.includes(ghostRank))
      return res.status(400).json({ error: 'Invalid rank. SSS is not available for ghost identity.' })

    // Check name uniqueness against real users AND other ghost identities
    const [userExists, ghostExists] = await Promise.all([
      prisma.user.findFirst({ where: { nickname: { equals: trimmed, mode: 'insensitive' } } }),
      prisma.founderGhostIdentity.findFirst({ where: { ghostName: { equals: trimmed, mode: 'insensitive' }, founderId: { not: founderId } } }),
    ])
    if (userExists || ghostExists) return res.status(409).json({ error: 'That name is already in use.' })

    const existing = await prisma.founderGhostIdentity.findUnique({ where: { founderId } })
    let ghost
    if (existing) {
      ghost = await prisma.founderGhostIdentity.update({
        where: { founderId },
        data: { ghostName: trimmed, ghostRank: ghostRank || 'B' },
      })
    } else {
      ghost = await prisma.founderGhostIdentity.create({
        data: { founderId, ghostName: trimmed, ghostRank: ghostRank || 'B' },
      })
    }

    return res.status(201).json({ ghost })
  }

  // PATCH — toggle ghost mode on/off
  if (req.method === 'PATCH') {
    const ghost = await prisma.founderGhostIdentity.findUnique({ where: { founderId } })
    if (!ghost) return res.status(404).json({ error: 'No ghost identity set up yet.' })

    const updated = await prisma.founderGhostIdentity.update({
      where: { founderId },
      data: { isActive: !ghost.isActive },
    })

    return res.json({ ghost: updated, isActive: updated.isActive })
  }

  res.status(405).end()
}