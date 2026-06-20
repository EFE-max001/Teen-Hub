import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const { titleId } = req.body

  if (titleId === null) {
    await prisma.userTitle.updateMany({
      where: { userId: session.user.id, active: true },
      data: { active: false },
    })
    await prisma.user.update({ where: { id: session.user.id }, data: { activeTitle: null } })
    return res.json({ success: true })
  }

  const userTitle = await prisma.userTitle.findUnique({
    where: { userId_titleId: { userId: session.user.id, titleId } },
    include: { title: true },
  })
  if (!userTitle) return res.status(404).json({ error: 'You do not have this title' })
  if (userTitle.expiresAt && userTitle.expiresAt < new Date()) {
    return res.status(400).json({ error: 'This title has expired' })
  }

  await prisma.userTitle.updateMany({
    where: { userId: session.user.id, active: true },
    data: { active: false },
  })
  await prisma.userTitle.update({ where: { id: userTitle.id }, data: { active: true } })
  await prisma.user.update({ where: { id: session.user.id }, data: { activeTitle: userTitle.title.name } })

  return res.json({ success: true })
}
