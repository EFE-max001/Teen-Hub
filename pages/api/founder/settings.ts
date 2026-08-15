// Teen-Hub/pages/api/founder/settings.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DEFAULT_COMMISSION_RATES: Record<string, number> = {
  F: 40, E: 35, D: 30, C: 25, B: 20, A: 15, S: 10, SS: 5, SSS: 2,
}
const DEFAULT_ACCESS_RULES: Record<string, string> = {
  'Quest Board': 'Accepted Member+',
  'Messages': 'Rank D+',
  'Guild Chat': 'Accepted Member+',
  'Fun Arena': 'Accepted Member+',
  'Elite Channel': 'Rank A+',
  'Admin Panel': 'Admin Role+',
  'Founder Panel': 'Founder Only',
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session || session.user.role !== 'FOUNDER') return res.status(403).json({ error: 'Forbidden' })

    if (req.method === 'GET') {
      let settings = await prisma.globalSettings.findUnique({ where: { id: 'singleton' } })
      if (!settings) {
        // First time this tab has ever been opened since this feature existed —
        // seed it with the same numbers that used to be hardcoded, so nothing
        // visibly changes until the Founder actually edits something.
        settings = await prisma.globalSettings.create({
          data: { id: 'singleton', commissionRates: DEFAULT_COMMISSION_RATES, accessRules: DEFAULT_ACCESS_RULES },
        })
      }
      return res.json({ settings })
    }

    if (req.method === 'PATCH') {
      const { commissionRates, accessRules } = req.body || {}
      const settings = await prisma.globalSettings.upsert({
        where: { id: 'singleton' },
        create: {
          id: 'singleton',
          commissionRates: commissionRates || DEFAULT_COMMISSION_RATES,
          accessRules: accessRules || DEFAULT_ACCESS_RULES,
          updatedById: session.user.id,
        },
        update: {
          ...(commissionRates ? { commissionRates } : {}),
          ...(accessRules ? { accessRules } : {}),
          updatedById: session.user.id,
        },
      })
      await prisma.activityLog.create({
        data: { userId: session.user.id, action: 'GLOBAL_SETTINGS_UPDATED', details: 'Updated commission rates / access rules' },
      }).catch(() => {})
      return res.json({ settings })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err: any) {
    console.error('[founder/settings] failed:', err)
    return res.status(500).json({
      error: err?.message?.includes('Unknown arg') || err?.message?.includes('does not exist')
        ? `Prisma schema out of sync — run "npx prisma db push" and restart the server. (${err.message})`
        : (err?.message || 'Unexpected server error'),
    })
  }
}