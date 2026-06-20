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
  if (delta === 0) return { trustScore: 50, trustLevel: 'NEW', delta: 0 }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { trustScore: true } })
  const current = user?.trustScore ?? 50
  const newScore = clampTrust(current + delta)
  const newLevel = computeTrustLevel(newScore)

  await Promise.all([
    prisma.trustEvent.create({
      data: { userId, action, delta, reason: reason || action, source },
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
