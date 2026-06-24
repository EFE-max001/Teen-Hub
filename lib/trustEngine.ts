/**
 * Trust Engine — automatic trust score updates
 * Called internally by API routes when trust-relevant events happen.
 */
import { prisma } from './prisma'
import { TRUST_EVENTS, computeTrustLevel, clampTrust } from './ai'

export async function applyTrustEvent(
  userId: string,
  action: keyof typeof TRUST_EVENTS,
  reason?: string,
  source: string = 'SYSTEM'
): Promise<{ trustScore: number; trustLevel: string; delta: number }> {
  const delta = TRUST_EVENTS[action] ?? 0
  return applyRawTrustDelta(userId, delta, reason || action, source, action)
}

// For trust adjustments that aren't a fixed enum value — e.g. a client rating
// from 1-5 needs a variable delta, not one fixed number per action.
export async function applyRawTrustDelta(
  userId: string,
  delta: number,
  reason: string,
  source: string = 'SYSTEM',
  action: string = 'MANUAL'
): Promise<{ trustScore: number; trustLevel: string; delta: number }> {
  if (delta === 0) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { trustScore: true, trustLevel: true } })
    return { trustScore: user?.trustScore ?? 50, trustLevel: user?.trustLevel ?? 'NEW', delta: 0 }
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { trustScore: true } })
  const current = user?.trustScore ?? 50
  const newScore = clampTrust(current + delta)
  const newLevel = computeTrustLevel(newScore)

  await Promise.all([
    prisma.trustEvent.create({
      data: { userId, action, delta, reason, source },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { trustScore: newScore, trustLevel: newLevel },
    }),
  ])

  return { trustScore: newScore, trustLevel: newLevel, delta }
}

export async function applyVerificationTrust(userId: string, verificationType: string) {
  const actionMap: Record<string, string> = {
    email:    'VERIFICATION_EMAIL',
    social:   'VERIFICATION_SOCIAL',
    location: 'VERIFICATION_LOCATION',
    face:     'VERIFICATION_FACE',
    identity: 'VERIFICATION_ID',
  }
  const action = actionMap[verificationType]
  if (!action) return

  await applyTrustEvent(userId, action as any, `Verified: ${verificationType}`, 'VERIFICATION')

  const fieldMap: Record<string, object> = {
    email:    { emailVerified: new Date() },
    social:   { socialVerified: true },
    location: { locationVerified: true },
    face:     { faceVerified: true },
    identity: { identityVerified: true },
  }
  if (fieldMap[verificationType]) {
    await prisma.user.update({ where: { id: userId }, data: fieldMap[verificationType] })
  }
}