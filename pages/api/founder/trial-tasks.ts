import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'GET') {
    const tasks = await prisma.trialTask.findMany({ orderBy: { createdAt: 'desc' } })
    return res.json({ tasks })
  }

  if (req.method === 'POST') {
    const { title, description, category, difficulty, instructions, deadlineHours } = req.body
    if (!title || !description || !instructions) {
      return res.status(400).json({ error: 'Title, description, and instructions required' })
    }
    const task = await prisma.trialTask.create({
      data: {
        title, description, category: category || 'General',
        difficulty: difficulty || 'Medium', instructions,
        deadlineHours: parseInt(deadlineHours) || 24,
        isActive: true,
      },
    })
    return res.json({ task })
  }

  if (req.method === 'PATCH') {
    const { id, isActive } = req.body
    await prisma.trialTask.update({ where: { id }, data: { isActive } })
    return res.json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    await prisma.trialTask.delete({ where: { id } })
    return res.json({ ok: true })
  }

  res.status(405).end()
}
