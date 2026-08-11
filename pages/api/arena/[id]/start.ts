import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Called when a member opens a game with a time limit. Stamps `startedAt`
// exactly once per user/challenge — reopening the modal never resets the
// clock. submit.ts checks this against config.time_limit_seconds so the
// limit shown in the UI is actually enforced instead of purely cosmetic.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) return res.status(401).json({ error: 'Unauthorized' })

    // Quick manual diagnostic: visiting this URL directly in a browser sends
    // GET. If this route file genuinely isn't deployed, that request 404s
    // with Next's own page — nothing here can catch that. If it DOES reach
    // this code, you'll see this JSON instead, which proves the file is
    // live and any remaining error is happening below (Prisma), not routing.
    if (req.method === 'GET') {
      return res.status(200).json({ ok: true, route: 'pages/api/arena/[id]/start.ts', message: 'Route is deployed and reachable.' })
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { id } = req.query as { id: string }

    const game = await prisma.arenaChallenge.findUnique({ where: { id } })
    if (!game) return res.status(404).json({ error: 'Game not found' })
    if (game.status !== 'ACTIVE') return res.status(400).json({ error: 'This game is closed' })

    const existing = await prisma.arenaEntry.findUnique({
      where: { challengeId_userId: { challengeId: id, userId: session.user.id } },
    })

    if (existing?.response) {
      return res.status(400).json({ error: 'You already submitted an entry for this game' })
    }

    const entry = existing
      ? existing
      : await prisma.arenaEntry.create({
          data: { challengeId: id, userId: session.user.id, startedAt: new Date() },
        })

    const config = (game.config as any) || {}
    return res.status(200).json({
      startedAt: entry.startedAt,
      timeLimitSeconds: config.time_limit_seconds || 0,
    })
  } catch (err: any) {
    // A route that throws without a try/catch lets Next's dev server render
    // its HTML crash overlay instead of JSON — which is exactly what shows
    // up client-side as "Unexpected token '<' ... is not valid JSON", with
    // no clue what actually broke. This guarantees a real, readable error
    // instead. The most likely cause here is the Prisma client being out of
    // sync with schema.prisma (the `startedAt` field / compound unique key)
    // — if that's it, this message will say so directly.
    console.error('[arena/start] failed:', err)
    return res.status(500).json({
      error: err?.message?.includes('startedAt') || err?.message?.includes('Unknown arg')
        ? `Prisma schema out of sync — run "npx prisma db push" and restart the server. (${err.message})`
        : (err?.message || 'Unexpected server error'),
    })
  }
}