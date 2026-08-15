// Teen-Hub/lib/questPayout.ts
//
// The missing link: a PaymentRequest can be linked to a quest, and the
// webhook already flips that quest to FUNDED once the client pays — but
// nothing ever calculated what the teen who did the work is actually owed,
// or moved their QuestClaim into the payout queue. This is that link.
//
// This only ever calculates and records an amount + sets payoutStatus to
// PENDING — it never triggers an actual transfer. The Founder still has to
// go approve it in the War Room (pages/api/founder/payouts.ts), same as
// every other payout. AI/automation here is limited to doing the commission
// math correctly and consistently; money only ever moves on Founder click.
import { prisma } from '@/lib/prisma'

const DEFAULT_COMMISSION_RATES: Record<string, number> = {
  F: 40, E: 35, D: 30, C: 25, B: 20, A: 15, S: 10, SS: 5, SSS: 2,
}

export async function linkQuestPaymentToPayout(questId: string, clientPaidAmount: number) {
  // APPROVED, not just SUBMITTED — only work the Founder has actually signed
  // off on gets queued for a real payout. A quest with more than one
  // approved claim (maxParticipants > 1) splits the payment evenly between
  // them; that's a reasonable default, but flag it if it's ever wrong for
  // a specific quest.
  const approvedClaims = await prisma.questClaim.findMany({
    where: { questId, status: 'APPROVED' },
    include: { user: { select: { id: true, rank: true } } },
  })
  if (approvedClaims.length === 0) return { linked: 0 }

  const settings = await prisma.globalSettings.findUnique({ where: { id: 'singleton' } })
  const commissionRates = (settings?.commissionRates as Record<string, number>) || DEFAULT_COMMISSION_RATES

  const perClaimGross = clientPaidAmount / approvedClaims.length

  for (const claim of approvedClaims) {
    const commissionPct = commissionRates[claim.user.rank] ?? DEFAULT_COMMISSION_RATES[claim.user.rank] ?? 30
    const teenShare = Math.round(perClaimGross * (1 - commissionPct / 100) * 100) / 100

    await prisma.questClaim.update({
      where: { id: claim.id },
      data: { payoutAmount: teenShare, payoutStatus: 'PENDING' },
    })
  }

  return { linked: approvedClaims.length }
}