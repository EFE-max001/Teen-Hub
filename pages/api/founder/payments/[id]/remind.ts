// Teen-Hub/pages/api/founder/payments/[id].ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canTransition } from '@/lib/paymentLifecycle'
import { logPaymentEvent } from '@/lib/paymentAudit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Forbidden' })

  const { id } = req.query
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' })

  if (req.method === 'GET') {
    const pr = await prisma.paymentRequest.findUnique({
      where: { id },
      include: {
        linkedQuest: { select: { id: true, title: true, status: true } },
        transactions: { orderBy: { createdAt: 'desc' } },
        emailLogs: { orderBy: { createdAt: 'desc' } },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
        createdBy: { select: { id: true, name: true, nickname: true } },
      },
    })
    if (!pr) return res.status(404).json({ error: 'Not found' })
    const origin = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.host}`
    return res.json({ paymentRequest: pr, payUrl: `${origin}/pay/${pr.publicToken}` })
  }

  if (req.method === 'PATCH') {
    const pr = await prisma.paymentRequest.findUnique({ where: { id } })
    if (!pr) return res.status(404).json({ error: 'Not found' })

    const { action } = req.body || {}

    if (action === 'cancel') {
      if (!canTransition(pr.status as any, 'CANCELLED')) {
        return res.status(409).json({ error: `Cannot cancel a request that is ${pr.status.toLowerCase()}.` })
      }
      const updated = await prisma.paymentRequest.update({ where: { id }, data: { status: 'CANCELLED' } })
      await logPaymentEvent('PAYMENT_REQUEST_CANCELLED', `founder:${session.user.id}`, id)
      return res.json({ paymentRequest: updated })
    }

    if (action === 'edit') {
      // Only pre-payment fields are editable, and only before the request
      // has ever been paid — money already collected is never silently
      // rewritten from here.
      if (pr.status === 'PAID' || pr.status === 'REFUNDED') {
        return res.status(409).json({ error: 'Cannot edit a request that has already been paid.' })
      }
      const { title, description, founderNote, expiresAt } = req.body || {}
      const updated = await prisma.paymentRequest.update({
        where: { id },
        data: {
          title: title ?? pr.title,
          description: description ?? pr.description,
          founderNote: founderNote ?? pr.founderNote,
          expiresAt: expiresAt ? new Date(expiresAt) : pr.expiresAt,
        },
      })
      await logPaymentEvent('PAYMENT_REQUEST_UPDATED', `founder:${session.user.id}`, id)
      return res.json({ paymentRequest: updated })
    }

    return res.status(400).json({ error: 'Unknown action' })
  }

  res.status(405).end()
}