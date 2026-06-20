import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { moderateMessage } from '@/lib/ai'

const ROLE_LEVEL: Record<string, number> = {
  GUEST:0,TRIAL_MEMBER:1,ACCEPTED_MEMBER:2,ACTIVE_WORKER:3,
  MODERATOR:4,COORDINATOR:5,ADMIN:6,FOUNDER:7,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const role = session.user.role
    const minVis = ROLE_LEVEL[role] >= ROLE_LEVEL['ACCEPTED_MEMBER'] ? 'ACCEPTED_ONLY' : 'MEMBERS_ONLY'

    const posts = await prisma.communityPost.findMany({
      where: {
        flagged: false,
        OR: [
          { visibility: 'PUBLIC' },
          ...(ROLE_LEVEL[role] >= ROLE_LEVEL['TRIAL_MEMBER'] ? [{ visibility: 'MEMBERS_ONLY' as const }] : []),
          ...(ROLE_LEVEL[role] >= ROLE_LEVEL['ACCEPTED_MEMBER'] ? [{ visibility: 'ACCEPTED_ONLY' as const }] : []),
        ],
      },
      include: {
        author: {
          select: { id: true, nickname: true, role: true, rank: true, activeTitle: true, profilePicUrl: true },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    })

    const processed = posts.map(p => ({
      ...p,
      author: p.isAnonymous && ROLE_LEVEL[role] < ROLE_LEVEL['ADMIN']
        ? { id: null, nickname: 'Anonymous', role: p.author.role, rank: null, activeTitle: null, profilePicUrl: null }
        : p.author,
    }))

    return res.json({ posts: processed })
  }

  if (req.method === 'POST') {
    if (ROLE_LEVEL[session.user.role] < ROLE_LEVEL['TRIAL_MEMBER']) {
      return res.status(403).json({ error: 'Members only' })
    }

    const { content, title, isAnonymous, visibility } = req.body
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' })

    const userRole = session.user.role
    const canPostAnonymous = ROLE_LEVEL[userRole] >= ROLE_LEVEL['ADMIN']
    const wantsAnonymous = isAnonymous && canPostAnonymous

    // AI moderation
    let flagged = false
    try {
      const mod = await moderateMessage(content)
      flagged = !mod.safe
    } catch { /* allow if AI fails */ }

    const post = await prisma.communityPost.create({
      data: {
        authorId: session.user.id,
        content: content.trim(),
        title: title?.trim() || null,
        isAnonymous: wantsAnonymous,
        visibility: visibility || 'MEMBERS_ONLY',
        flagged,
      },
    })

    return res.status(201).json({ post, flagged })
  }

  res.status(405).end()
}
