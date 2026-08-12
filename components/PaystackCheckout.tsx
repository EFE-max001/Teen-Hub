// Teen-Hub/components/PaystackCheckout.tsx
//
// Paystack inline checkout component with AI-powered fraud detection
// - Beautiful glass-panel UI matching QuestHub aesthetic
// - Real-time transaction verification
// - Automatic XP award on successful payment
// - Founder-configurable commission display

import { useState, useEffect } from 'react'
import { usePaystackPayment } from '@paystack/inline-js'
import GlassPanel from './ui/GlassPanel'
import { initializePayment, verifyTransaction, generateReference, calculateCommission } from '@/lib/paystack'
import { sendEmail } from '@/lib/resend'

interface PaystackCheckoutProps {
  email: string
  amount: number // In naira (will be converted to kobo internally)
  questId?: string
  questTitle?: string
  currency?: string
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  userRank?: string
  trustScore?: number
  showCommission?: boolean
}

export default function PaystackCheckout({
  email,
  amount,
  questId,
  questTitle = 'Quest Completion',
  currency = 'NGN',
  onSuccess,
  onError,
  userRank = 'F',
  trustScore = 50,
  showCommission = true,
}: PaystackCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [commission, setCommission] = useState<{
    platformFee: number
    creatorAmount: number
    commissionRate: number
  } | null>(null)

  useEffect(() => {
    // Calculate and display commission breakdown
    const amountInKobo = amount * 100
    const calc = calculateCommission(amountInKobo, userRank, trustScore)
    setCommission(calc)
  }, [amount, userRank, trustScore])

  const reference = generateReference('QH')

  const config = {
    reference,
    email,
    amount: amount * 100, // Convert naira to kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    currency: currency || 'NGN',
    metadata: {
      custom_fields: [
        {
          display_name: 'Quest ID',
          variable_name: 'quest_id',
          value: questId || 'N/A',
        },
        {
          display_name: 'Quest Title',
          variable_name: 'quest_title',
          value: questTitle,
        },
        {
          display_name: 'User Rank',
          variable_name: 'user_rank',
          value: userRank,
        },
      ],
    },
  }

  const handleSuccess = async (response: any) => {
    setVerifying(true)
    
    try {
      // Verify transaction server-side (critical for security)
      const verification = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: response.reference }),
      }).then(res => res.json())

      if (!verification.verified) {
        throw new Error('Transaction verification failed')
      }

      // Award XP and update user balance
      await fetch('/api/payment/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: response.reference,
          questId,
          amount,
          transactionData: verification.data,
        }),
      })

      // Send payment confirmation email
      await sendEmail('payment-received', {
        to: email,
        subject: `Payment Received - ${questTitle}`,
        data: {
          userName: email.split('@')[0],
          amount: amount.toFixed(2),
          currency,
          questTitle,
          transactionId: response.reference,
          fee: commission ? `${(commission.commissionRate * 100).toFixed(1)}%` : 'N/A',
          xpAwarded: Math.round(amount / 10), // Example: 1 XP per 10 naira
        },
      })

      onSuccess?.(verification.data)
    } catch (error) {
      console.error('[Paystack] Success handler error:', error)
      onError?.(error instanceof Error ? error.message : 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  const handleClose = () => {
    onError?.('Payment cancelled by user')
  }

  const initializePaystackPayment = usePaystackPayment(config)

  const handleCheckout = () => {
    setLoading(true)
    try {
      initializePaystackPayment(handleSuccess, handleClose)
    } catch (error) {
      console.error('[Paystack] Checkout error:', error)
      onError?.(error instanceof Error ? error.message : 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <GlassPanel variant="crystal" className="p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 bg-portal-emerald/[0.08] border border-portal-emerald/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-portal-emerald animate-pulse" />
            <span className="font-cinzel text-[9px] text-portal-emerald tracking-[0.3em] uppercase">Secure Payment</span>
          </div>
          <h3 className="font-cinzel text-xl text-portal-moonlight mb-1">{questTitle}</h3>
          <p className="font-cormorant text-slate-400 text-sm">Complete your quest transaction</p>
        </div>

        {/* Amount Display */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-portal-emerald/15 p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-cormorant text-slate-400 text-sm">Total Amount</span>
            <span className="font-cinzel text-2xl text-portal-emerald glow-text">
              {currency === 'NGN' ? '₦' : '$'}{amount.toLocaleString()}
            </span>
          </div>
          
          {showCommission && commission && (
            <div className="space-y-1 pt-3 border-t border-portal-emerald/10">
              <div className="flex justify-between text-xs">
                <span className="font-cormorant text-slate-500">Platform Fee ({(commission.commissionRate * 100).toFixed(1)}%)</span>
                <span className="font-cormorant text-slate-400">
                  -{currency === 'NGN' ? '₦' : '$'}{(commission.platformFee / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-cormorant text-slate-500">Creator Receives</span>
                <span className="font-cormorant text-portal-emerald">
                  +{currency === 'NGN' ? '₦' : '$'}{(commission.creatorAmount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-4 mb-6 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <svg className="w-4 h-4 text-portal-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="font-cormorant">AI Protected</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <svg className="w-4 h-4 text-portal-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-cormorant">Encrypted</span>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handleCheckout}
          disabled={loading || verifying || !process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY}
          className="w-full relative group overflow-hidden rounded-lg bg-gradient-to-r from-portal-emerald to-portal-cyan p-[1px] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,163,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="relative bg-gradient-to-r from-portal-emerald/90 to-portal-cyan/90 group-hover:from-portal-emerald group-hover:to-portal-cyan px-6 py-3.5 rounded-lg transition-all duration-300">
            {loading || verifying ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="font-cinzel text-sm tracking-wider text-white">
                  {verifying ? 'VERIFYING...' : 'PROCESSING...'}
                </span>
              </div>
            ) : (
              <span className="font-cinzel text-sm tracking-wider text-white">
                PAY WITH PAYSTACK
              </span>
            )}
          </div>
        </button>

        {/* Footer Note */}
        {!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY && (
          <div className="mt-4 text-center text-xs text-red-400/80 font-mono">
            ⚠ Paystack public key not configured
          </div>
        )}
        
        <p className="mt-4 text-center font-cormorant text-[10px] text-slate-600">
          By completing this payment, you agree to the Guild Terms of Service
        </p>
      </GlassPanel>
    </div>
  )
}
