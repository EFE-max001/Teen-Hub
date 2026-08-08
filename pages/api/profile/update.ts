// Teen-Hub/pages/api/profile/update.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const {
    name, bio, portfolioUrl,
    timezone, country, workStyle,
    preferredTaskType, experience,
    availabilityText, profilePicUrl,
    socialLinks, portfolioVault,
  } = req.body

  if (name !== undefined) {
    const trimmed = typeof name === 'string' ? name.trim() : ''
    if (trimmed.length < 2 || trimmed.length > 60) {
      return res.status(400).json({ error: 'Full name must be 2–60 characters.' })
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined            ? { name: name.trim() } : {}),
      ...(bio !== undefined           ? { bio }              : {}),
      ...(portfolioUrl !== undefined  ? { portfolioUrl }     : {}),
      ...(timezone !== undefined      ? { timezone }         : {}),
      ...(country !== undefined       ? { country }          : {}),
      ...(workStyle !== undefined     ? { workStyle }        : {}),
      ...(preferredTaskType !== undefined ? { preferredTaskType } : {}),
      ...(experience !== undefined    ? { experience }       : {}),
      ...(availabilityText !== undefined ? { availabilityText } : {}),
      ...(profilePicUrl !== undefined ? { profilePicUrl }    : {}),
      ...(socialLinks !== undefined   ? { socialLinks }      : {}),
      ...(portfolioVault !== undefined ? { portfolioVault }  : {}),
    },
    select: {
      id: true, name: true, nickname: true, bio: true, portfolioUrl: true,
      timezone: true, country: true, workStyle: true,
      preferredTaskType: true, experience: true,
      availabilityText: true, profilePicUrl: true,
      socialLinks: true, trustScore: true, trustLevel: true,
    },
  })

  return res.json({ user: updated })
}