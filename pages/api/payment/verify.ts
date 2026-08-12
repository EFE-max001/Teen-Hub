// Teen-Hub/pages/api/payment/verify.ts
//
// Server-side Paystack transaction verification
// Critical for security - never trust client-side verification alone

import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyTransaction, analyzePaymentRisk } from '@/lib/paystack'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { reference } = req.body

    if (!reference) {
      return res.status(400).json({ 
        success: false, 
        error: 'Reference required' 
      })
    }

    // Verify transaction with Paystack
    const verification = await verifyTransaction(reference)

    if (!verification.success || !verification.verified) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: verification.error || 'Verification failed',
      })
    }

    // Get user session for risk analysis
    const session = await getServerSession(req, res, authOptions)
    
    let riskAnalysis = null
    if (session?.user?.email) {
      // Fetch user profile for AI risk analysis
      const userProfile = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          transactions: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (userProfile) {
        // Run AI-powered fraud detection
        riskAnalysis = analyzePaymentRisk(
          {
            amount: verification.data.amount,
            country: verification.data.metadata?.country,
          },
          {
            recentTransactions: userProfile.transactions,
            avgTransactionAmount: userProfile.transactions.reduce((acc, t) => acc + (t as any).amount, 0) / userProfile.transactions.length || 0,
            lastLoginCountry: userProfile.lastLoginCountry,
            accountAgeDays: Math.floor((Date.now() - new Date(userProfile.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
          }
        )

        // Flag high-risk transactions for founder review
        if (riskAnalysis.riskLevel === 'high') {
          await prisma.flaggedTransaction.create({
            data: {
              userId: userProfile.id,
              reference,
              amount: verification.data.amount,
              riskLevel: riskAnalysis.riskLevel,
              flags: riskAnalysis.flags,
              status: 'PENDING_REVIEW',
            },
          })

          // Notify founder/admin of high-risk transaction
          console.log('[Paystack] HIGH RISK transaction flagged:', {
            reference,
            user: userProfile.email,
            flags: riskAnalysis.flags,
          })
        }
      }
    }

    return res.status(200).json({
      success: true,
      verified: true,
      data: verification.data,
      riskAnalysis,
    })
  } catch (error) {
    console.error('[Payment Verify] Error:', error)
    return res.status(500).json({
      success: false,
      verified: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    })
  }
}
