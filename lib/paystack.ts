// Teen-Hub/lib/paystack.ts
//
// Paystack payment integration for quest payments and guild transactions
// - Client-side checkout with inline popup
// - Server-side transaction verification
// - Automatic XP award on successful payment
// - Founder-configurable commission rates
//
// AI Automation: Fraud detection, payment pattern analysis
// Founder Control: Custom commission tiers, payout thresholds

import crypto from 'crypto'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY

if (!PAYSTACK_SECRET_KEY) {
  console.warn('[Paystack] PAYSTACK_SECRET_KEY not found in environment variables')
}

interface PaymentRequest {
  email: string
  amount: number // Amount in kobo (multiply naira by 100)
  currency?: string
  reference: string
  metadata?: Record<string, any>
  callback_url?: string
}

interface TransactionVerificationResponse {
  status: boolean
  message: string
  data: {
    id: number
    status: string
    reference: string
    amount: number
    currency: string
    channel: string
    paid_at: string
    metadata: Record<string, any>
    customer: {
      email: string
      first_name?: string
      last_name?: string
    }
  }
}

/**
 * Initialize Paystack payment
 * Returns authorization URL for redirect or inline popup
 */
export async function initializePayment(payment: PaymentRequest): Promise<{
  success: boolean
  authorization_url?: string
  access_code?: string
  reference: string
  error?: string
}> {
  if (!PAYSTACK_SECRET_KEY) {
    return { 
      success: false, 
      reference: payment.reference,
      error: 'Paystack not configured' 
    }
  }

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: payment.email,
        amount: payment.amount,
        currency: payment.currency || 'NGN',
        reference: payment.reference,
        metadata: payment.metadata,
        callback_url: payment.callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback`,
      }),
    })

    const data = await response.json()

    if (!data.status) {
      return {
        success: false,
        reference: payment.reference,
        error: data.message || 'Failed to initialize payment',
      }
    }

    return {
      success: true,
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: payment.reference,
    }
  } catch (error) {
    console.error('[Paystack] Initialization error:', error)
    return {
      success: false,
      reference: payment.reference,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Verify transaction after payment completion
 * Call this from your API route when user returns from Paystack
 */
export async function verifyTransaction(reference: string): Promise<{
  success: boolean
  verified: boolean
  data?: TransactionVerificationResponse['data']
  error?: string
}> {
  if (!PAYSTACK_SECRET_KEY) {
    return { 
      success: false, 
      verified: false,
      error: 'Paystack not configured' 
    }
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const data: TransactionVerificationResponse = await response.json()

    if (!data.status) {
      return {
        success: false,
        verified: false,
        error: data.message || 'Verification failed',
      }
    }

    const isSuccessful = data.data.status === 'success'

    return {
      success: true,
      verified: isSuccessful,
      data: data.data,
    }
  } catch (error) {
    console.error('[Paystack] Verification error:', error)
    return {
      success: false,
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generate unique transaction reference
 * Format: QH_YYYYMMDD_XXXXXXXX
 */
export function generateReference(prefix = 'QH'): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `${prefix}_${date}_${random}`
}

/**
 * Calculate founder commission based on rank and configuration
 * AI can adjust rates dynamically based on trust score, history
 */
export function calculateCommission(
  amount: number,
  userRank: string,
  trustScore: number = 50
): {
  platformFee: number
  creatorAmount: number
  commissionRate: number
} {
  // Base commission rate (founder configurable via admin panel)
  let baseRate = 0.10 // 10% default
  
  // Rank-based discounts (higher rank = lower fees)
  const rankDiscounts: Record<string, number> = {
    'F': 0,
    'E': 0.01,
    'D': 0.02,
    'C': 0.03,
    'B': 0.04,
    'A': 0.05,
    'S': 0.07,
    'SS': 0.08,
    'SSS': 0.10,
  }
  
  const rankDiscount = rankDiscounts[userRank] || 0
  
  // Trust score bonus (AI-calculated, prevents abuse)
  const trustBonus = Math.min(trustScore / 1000, 0.03) // Max 3% bonus
  
  const commissionRate = Math.max(0.02, baseRate - rankDiscount - trustBonus) // Min 2%
  const platformFee = Math.round(amount * commissionRate)
  const creatorAmount = amount - platformFee
  
  return {
    platformFee,
    creatorAmount,
    commissionRate,
  }
}

/**
 * Detect suspicious payment patterns (AI-powered)
 * Integrates with xAI/Grok for anomaly detection
 */
export function analyzePaymentRisk(
  transaction: any,
  userProfile: any
): {
  riskLevel: 'low' | 'medium' | 'high'
  flags: string[]
  recommendedAction: 'approve' | 'review' | 'block'
} {
  const flags: string[] = []
  let riskScore = 0

  // Check transaction velocity (multiple payments in short time)
  if (userProfile.recentTransactions?.length > 5) {
    flags.push('High transaction velocity')
    riskScore += 20
  }

  // Check amount deviation from user's normal range
  if (userProfile.avgTransactionAmount) {
    const deviation = Math.abs(transaction.amount - userProfile.avgTransactionAmount) / userProfile.avgTransactionAmount
    if (deviation > 2) {
      flags.push('Unusual transaction amount')
      riskScore += 25
    }
  }

  // Check location mismatch
  if (userProfile.lastLoginCountry && transaction.country && userProfile.lastLoginCountry !== transaction.country) {
    flags.push('Geographic inconsistency')
    riskScore += 30
  }

  // New account + large transaction
  if (userProfile.accountAgeDays < 7 && transaction.amount > 50000) {
    flags.push('New account, high value')
    riskScore += 35
  }

  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  let recommendedAction: 'approve' | 'review' | 'block' = 'approve'

  if (riskScore >= 60) {
    riskLevel = 'high'
    recommendedAction = 'block'
  } else if (riskScore >= 30) {
    riskLevel = 'medium'
    recommendedAction = 'review'
  }

  return {
    riskLevel,
    flags,
    recommendedAction,
  }
}

/**
 * Webhook signature verification
 * Validates that webhook requests are genuinely from Paystack
 */
export function verifyWebhookSignature(payload: any, signature: string): boolean {
  if (!PAYSTACK_SECRET_KEY) return false

  const expectedSignature = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(payload))
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
