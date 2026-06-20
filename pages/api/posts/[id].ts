import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ROLE_LEVEL: Record<string, number> = {
  GUEST:0,TRIAL_MEMBER:1,ACCEPTED_MEMBER:2,ACTIVE_WORKER:3,
  MODERATOR:4,COORDINATOR:5,ADMIN:6,FOUNDER:7,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query as { id: string }
  const post = await prisma.communityPost.findUnique({ where: { id } })
  if (!post) return res.status(404).json({ error: 'Not found' })

  const isOwner = post.authorId === session.user.id
  const isAdmin = ROLE_LEVEL[session.user.role] >= ROLE_LEVEL['ADMIN']

  if (req.method === 'DELETE') {
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' })
    await prisma.communityPost.delete({ where: { id } })
    return res.json({ success: true })
  }

  if (req.method === 'PATCH') {
    if (!isAdmin) return res.status(403).json({ error: 'Admins only' })
    const { flagged, isPinned } = req.body
    const updated = await prisma.communityPost.update({
      where: { id },
      data: {
        ...(flagged !== undefined ? { flagged } : {}),
        ...(isPinned !== undefined ? { isPinned } : {}),
      },
    })
    return res.json({ post: updated })
  }

  res.status(405).end()
}
