// Teen-Hub/pages/api/founder/payments/[id]/remind.ts
//
// This file previously contained the GET-details/PATCH-cancel-edit logic
// meant for pages/api/founder/payments/[id].ts (now moved there, where its
// own header comment always said it belonged). Because of the mix-up, this
// route had no POST handler at all — the "Remind" button in
// pages/founder/payments/index.tsx has been hitting a 405 this whole time,
// and lib/paymentEvents.ts's sendPaymentReminderEmail() (fully built,
// complete with its own reminderCount tracking and email template) was
// never actually called from anywhere. This is what wires it up for real.
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendPaymentReminderEmail } from '@/lib/paymentEvents'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session || session.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Forbidden' })
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { id } = req.query
    if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' })

    const pr = await prisma.paymentRequest.findUnique({ where: { id } })
    if (!pr) return res.status(404).json({ error: 'Not found' })

    if (!['ACTIVE', 'PENDING'].includes(pr.status)) {
      return res.status(409).json({ error: `Cannot remind on a request that is ${pr.status.toLowerCase()}.` })
    }
    if (!pr.clientEmail) {
      return res.status(400).json({ error: 'No client email on file for this request.' })
    }

    const { message } = (req.body || {}) as { message?: string }

    const result = await sendPaymentReminderEmail(
      pr,
      message || 'This is a friendly reminder that the payment below is still pending.'
    )

    if (result.ok) {
      await prisma.paymentRequest.update({
        where: { id },
        data: { reminderCount: { increment: 1 }, lastReminderAt: new Date() },
      })
    }

    return res.json(result)
  } catch (err: any) {
    console.error('[founder/payments/[id]/remind] failed:', err)
    return res.status(500).json({
      error: err?.message?.includes('Unknown arg') || err?.message?.includes('does not exist')
        ? `Prisma schema out of sync — run "npx prisma db push" and restart the server. (${err.message})`
        : (err?.message || 'Unexpected server error'),
    })
  }
}