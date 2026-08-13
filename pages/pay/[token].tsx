// Teen-Hub/pages/pay/[token].tsx
//
// PUBLIC. No Teen Hub account required. Renders every lifecycle state a
// payment link can be in. After Paystack redirects back here, this page
// polls /api/payment/request/[token] rather than trusting the return URL —
// the webhook is the only thing that ever marks a payment PAID.

import { useEffect, useState, useCallback } from 'react'
import Head from 'next/head'
import { GetServerSideProps } from 'next'
import GlassPanel from '@/components/ui/GlassPanel'
import PaystackCheckout from '@/components/PaystackCheckout'

type PaymentData = {
  reference: string
  status: string
  title: string
  description: string
  currency: string
  baseAmount: number
  processingFee: number
  customerTotal: number
  feeMode: string
  linkedQuestTitle: string | null
  expiresAt: string | null
  paidAt: string | null
  paymentChannel: string | null
  clientName: string | null
  clientEmail: string | null
  clientPhone: string | null
  clientCompany: string | null
  clientNote: string | null
}

function money(currency: string, amount: number) {
  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : `${currency} `
  return `${symbol}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function PublicPaymentPage({ token }: { token: string }) {
  const [data, setData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', note: '' })

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/payment/request/${token}`)
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      const d = await res.json()
      setData(d)
      setForm(f => ({
        name: f.name || d.clientName || '',
        email: f.email || d.clientEmail || '',
        phone: f.phone || d.clientPhone || '',
        company: f.company || d.clientCompany || '',
        note: f.note || d.clientNote || '',
      }))
    } catch {
      setError('Could not load this payment link. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  // If we returned from Paystack (?trxref= or ?reference=), poll a few
  // times in case the webhook is still landing — never mark PAID from the
  // URL itself, only from what this poll reports the server already knows.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (!params.get('trxref') && !params.get('reference')) return
    if (data?.status === 'PAID') return

    let attempts = 0
    const interval = setInterval(() => {
      attempts += 1
      load()
      if (attempts >= 8 || data?.status === 'PAID') clearInterval(interval)
    }, 2500)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.status])

  if (loading) {
    return <Shell><Centered><Spinner label="Loading payment details..." /></Centered></Shell>
  }

  if (notFound) {
    return (
      <Shell>
        <Centered>
          <GlassPanel variant="crystal" className="p-8 text-center max-w-md">
            <div className="text-3xl mb-3">✕</div>
            <h1 className="font-cinzel text-lg text-portal-moonlight mb-2">Payment link not found</h1>
            <p className="font-cormorant text-slate-500 text-sm">This link may be mistyped, or the payment request no longer exists.</p>
          </GlassPanel>
        </Centered>
      </Shell>
    )
  }

  if (!data) {
    return <Shell><Centered><p className="font-cormorant text-slate-500">{error || 'Something went wrong.'}</p></Centered></Shell>
  }

  if (data.status === 'PAID') {
    return (
      <Shell>
        <Centered>
          <GlassPanel variant="crystal" className="p-8 text-center max-w-md">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-portal-emerald/15 border border-portal-emerald/40 flex items-center justify-center text-2xl text-portal-emerald">✓</div>
            <h1 className="font-cinzel text-xl text-portal-emerald mb-1">Payment received</h1>
            <p className="font-cormorant text-slate-400 text-sm mb-4">{data.title}</p>
            <div className="bg-black/40 border border-portal-emerald/15 rounded-lg p-4 font-mono text-xs text-left space-y-1.5">
              <Row label="Reference" value={data.reference} />
              <Row label="Total paid" value={money(data.currency, data.customerTotal)} />
              {data.paymentChannel && <Row label="Method" value={data.paymentChannel} />}
              {data.paidAt && <Row label="Date" value={new Date(data.paidAt).toLocaleString()} />}
            </div>
            <p className="font-cormorant text-slate-600 text-xs mt-4">A receipt has been sent to your email.</p>
          </GlassPanel>
        </Centered>
      </Shell>
    )
  }

  if (data.status === 'EXPIRED') {
    return (
      <Shell><Centered>
        <GlassPanel variant="crystal" className="p-8 text-center max-w-md">
          <div className="text-3xl mb-3">⏱</div>
          <h1 className="font-cinzel text-lg text-portal-moonlight mb-2">This payment link has expired</h1>
          <p className="font-cormorant text-slate-500 text-sm">Please contact QuestHub for a new payment link.</p>
        </GlassPanel>
      </Centered></Shell>
    )
  }

  if (data.status === 'CANCELLED') {
    return (
      <Shell><Centered>
        <GlassPanel variant="crystal" className="p-8 text-center max-w-md">
          <div className="text-3xl mb-3">✕</div>
          <h1 className="font-cinzel text-lg text-portal-moonlight mb-2">Payment request cancelled</h1>
          <p className="font-cormorant text-slate-500 text-sm">This request is no longer active. Contact QuestHub if you believe this is a mistake.</p>
        </GlassPanel>
      </Centered></Shell>
    )
  }

  if (data.status === 'PENDING') {
    return (
      <Shell><Centered>
        <GlassPanel variant="crystal" className="p-8 text-center max-w-md">
          <Spinner label="" />
          <h1 className="font-cinzel text-lg text-portal-moonlight mt-4 mb-2">Confirming your payment</h1>
          <p className="font-cormorant text-slate-500 text-sm">This can take a few moments. This page will update automatically — you don't need to refresh.</p>
        </GlassPanel>
      </Centered></Shell>
    )
  }

  // ACTIVE or FAILED — show the payment form (FAILED allows retry)
  return (
    <Shell>
      <div className="max-w-lg mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-portal-emerald/[0.08] border border-portal-emerald/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-portal-emerald animate-pulse" />
            <span className="font-cinzel text-[9px] text-portal-emerald tracking-[0.3em] uppercase">QuestHub Payment Portal</span>
          </div>
        </div>

        {data.status === 'FAILED' && (
          <div className="mb-4 border border-red-500/30 bg-red-950/20 rounded-lg px-4 py-3">
            <p className="font-cormorant text-red-300 text-sm">Your last payment attempt was not completed. You can try again below.</p>
          </div>
        )}

        <GlassPanel variant="crystal" className="p-6 sm:p-8">
          <h1 className="font-cinzel text-xl text-portal-moonlight mb-1">{data.title}</h1>
          {data.description && <p className="font-cormorant text-slate-400 text-sm mb-6">{data.description}</p>}

          <div className="space-y-4 mb-6">
            <Field label="Full Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Your full name" />
            <Field label="Email *" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="you@example.com" />
            <Field label="Phone Number *" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="080..." />
            <Field label="Company / Organization" value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} placeholder="Optional" />
          </div>

          <div className="bg-black/40 border border-portal-emerald/15 rounded-lg p-4 mb-6 font-mono text-xs">
            <Row label="Project amount" value={money(data.currency, data.baseAmount)} />
            {data.processingFee > 0 && <Row label="Processing fee" value={money(data.currency, data.processingFee)} />}
            <div className="border-t border-portal-emerald/15 mt-2 pt-2">
              <Row label="Total" value={money(data.currency, data.customerTotal)} big />
            </div>
          </div>

          {formError(form) && <p className="font-cormorant text-red-400 text-sm mb-4">{formError(form)}</p>}

          <PaystackCheckout
            token={token}
            clientName={form.name}
            clientEmail={form.email}
            clientPhone={form.phone}
            clientCompany={form.company}
            clientNote={form.note}
            disabled={!!formError(form)}
            onError={setError}
          />
          {error && <p className="font-cormorant text-red-400 text-sm mt-3 text-center">{error}</p>}

          <p className="font-cormorant text-[11px] text-slate-600 text-center mt-4">Secure payment powered by Paystack</p>
        </GlassPanel>
      </div>
    </Shell>
  )
}

function formError(form: { name: string; email: string; phone: string }): string | null {
  if (!form.name.trim() && !form.email.trim() && !form.phone.trim()) return null // don't nag before they've typed anything
  if (form.name.trim().length > 0 && form.name.trim().length < 2) return 'Please enter your full name.'
  return null
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <title>QuestHub — Payment Portal</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-[#040A08] text-portal-moonlight">{children}</div>
    </>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex items-center justify-center px-4">{children}</div>
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-portal-emerald/25 border-t-portal-emerald rounded-full animate-spin" />
      {label && <p className="font-cormorant text-slate-500 text-sm">{label}</p>}
    </div>
  )
}

function Row({ label, value, big = false }: { label: string; value: string; big?: boolean }) {
  return (
    <div className={`flex justify-between py-0.5 ${big ? 'text-portal-emerald text-sm font-bold' : 'text-slate-400'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, type = 'text',
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="text-[10px] font-cinzel tracking-[0.25em] text-cyan-300/70 uppercase block mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black/50 backdrop-blur-sm rounded-lg border border-cyan-500/25 text-slate-200 text-sm font-cormorant px-4 py-3 focus:outline-none focus:border-cyan-400/70 focus:shadow-[0_0_18px_rgba(34,211,238,0.18)] placeholder:text-slate-600"
      />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const token = ctx.params?.token
  if (typeof token !== 'string') return { notFound: true }
  return { props: { token } }
}