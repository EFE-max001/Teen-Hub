// Teen-Hub/components/PaystackCheckout.tsx
//
// The "Pay Now" trigger on the public /pay/[token] page. Deliberately NOT
// an inline card-collection widget — per the payment architecture, Teen
// Hub never touches card data directly. This calls the server to create a
// pending transaction and initialize Paystack, then redirects the browser
// to Paystack's own hosted checkout (Paystack's approved flow).
//
// AI Automation: none here by design — money math and payment truth are
// 100% server-side (lib/paystack.ts + the webhook). This component is pure
// UI plumbing.
// Founder Control: nothing about the amount or fee is editable here — both
// come from the server-side PaymentRequest record.

import { useState } from 'react'
import GlassPanel from './ui/GlassPanel'

interface PaystackCheckoutProps {
  token: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientCompany?: string
  clientNote?: string
  disabled?: boolean
  onError?: (error: string) => void
}

export default function PaystackCheckout({
  token,
  clientName,
  clientEmail,
  clientPhone,
  clientCompany,
  clientNote,
  disabled = false,
  onError,
}: PaystackCheckoutProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    if (!clientName || !clientEmail || !clientPhone) {
      onError?.('Please fill in your name, email, and phone number first.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          clientName,
          clientEmail,
          clientPhone,
          clientCompany,
          clientNote,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.authorization_url) {
        throw new Error(data.error || 'Could not start payment. Please try again.')
      }
      window.location.href = data.authorization_url
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Checkout failed')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading || disabled}
      className="w-full relative group overflow-hidden rounded-lg bg-gradient-to-r from-portal-emerald to-portal-cyan p-[1px] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,163,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="relative bg-gradient-to-r from-portal-emerald/90 to-portal-cyan/90 group-hover:from-portal-emerald group-hover:to-portal-cyan px-6 py-3.5 rounded-lg transition-all duration-300">
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="font-cinzel text-sm tracking-wider text-white">REDIRECTING...</span>
          </div>
        ) : (
          <span className="font-cinzel text-sm tracking-wider text-white">CONTINUE TO SECURE PAYMENT</span>
        )}
      </div>
    </button>
  )
}