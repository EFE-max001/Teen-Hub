// Teen-Hub/pages/founder/payments/new.tsx
import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'
import { requireAuth } from '@/lib/middleware'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { GlowInput, GlowTextarea, GlowSelect } from '@/components/ui/GlowInput'
import GlowButton from '@/components/ui/GlowButton'

const FEE_MODES = [
  { value: 'CLIENT_PAYS', label: 'Client pays processing fee (default)' },
  { value: 'FOUNDER_PAYS', label: 'Founder absorbs processing fee' },
  { value: 'SPLIT_50_50', label: 'Split the fee 50/50' },
]

function calcPreviewFee(baseAmount: number): number {
  if (!baseAmount || baseAmount <= 0) return 0
  const pct = baseAmount * 0.015
  const flat = baseAmount < 2500 ? 0 : 100
  const first = Math.min(Math.round((pct + flat) * 100) / 100, 2000)
  const total = baseAmount + first
  const pct2 = total * 0.015
  const flat2 = total < 2500 ? 0 : 100
  return Math.min(Math.round((pct2 + flat2) * 100) / 100, 2000)
}

export default function NewPaymentRequest() {
  const router = useRouter()
  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCompany: '',
    title: '',
    description: '',
    baseAmount: '',
    currency: 'NGN',
    expiresAt: '',
    founderNote: '',
    feeMode: 'CLIENT_PAYS',
  })
  const [notes, setNotes] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ payUrl: string; reference: string } | null>(null)
  const [copied, setCopied] = useState(false)

  function set(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function draftWithAI() {
    if (!notes.trim()) return
    setDrafting(true)
    try {
      const res = await fetch('/api/ai/payment-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'draft', notes }),
      })
      const data = await res.json()
      if (data.title) set('title', data.title)
      if (data.description) set('description', data.description)
    } finally {
      setDrafting(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const baseAmount = Number(form.baseAmount)
    if (!form.title.trim() || !form.description.trim() || !baseAmount || baseAmount <= 0) {
      setError('Title, description, and a positive amount are required.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/founder/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, baseAmount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create payment request.')
      setResult({ payUrl: data.payUrl, reference: data.paymentRequest.reference })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function copyLink() {
    if (!result) return
    await navigator.clipboard.writeText(result.payUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const baseAmount = Number(form.baseAmount) || 0
  const previewFee = form.feeMode === 'FOUNDER_PAYS' ? 0 : form.feeMode === 'SPLIT_50_50' ? calcPreviewFee(baseAmount) / 2 : calcPreviewFee(baseAmount)
  const previewTotal = baseAmount + previewFee

  if (result) {
    return (
      <DashboardLayout title="Payment Request Created">
        <Head><title>Payment Request Created — QuestHub</title></Head>
        <div className="max-w-lg mx-auto mt-10">
          <div className="crystal-glass bg-black/50 border border-portal-emerald/25 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">✓</div>
            <h1 className="font-cinzel font-bold text-xl text-portal-emerald mb-1">Payment request created</h1>
            <p className="font-cormorant text-slate-500 text-sm mb-6">Reference: <span className="font-mono text-slate-300">{result.reference}</span></p>

            <div className="bg-black/60 border border-portal-emerald/15 rounded-lg p-3 mb-6 font-mono text-xs text-slate-300 break-all">
              {result.payUrl}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <GlowButton variant="primary" onClick={copyLink}>{copied ? 'Copied ✓' : 'Copy Link'}</GlowButton>
              <a href={result.payUrl} target="_blank" rel="noopener noreferrer">
                <GlowButton variant="secondary">Open Payment Page</GlowButton>
              </a>
              <GlowButton variant="ghost" onClick={() => router.push('/founder/payments')}>Done</GlowButton>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="New Payment Request">
      <Head><title>New Payment Request — QuestHub</title></Head>

      <div className="max-w-2xl mx-auto">
        <h1 className="font-cinzel font-black text-xl text-white mb-1">CREATE PAYMENT REQUEST</h1>
        <p className="font-cormorant text-slate-500 text-sm mb-6">
          Set the amount and details, then share the generated link with your client directly. They don't need a Teen Hub account.
        </p>

        {/* AI drafting assist */}
        <div className="crystal-glass bg-black/40 border border-portal-emerald/15 rounded-xl p-4 mb-6">
          <div className="font-cinzel text-[10px] text-portal-emerald tracking-widest uppercase mb-2">SENTINEL Drafting Assist</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder='e.g. "Client wants 10 posts and 5 reels"'
              className="flex-1 bg-black/50 border border-cyan-500/25 rounded-lg px-4 py-2.5 text-sm font-cormorant text-slate-200 focus:outline-none focus:border-cyan-400/70"
            />
            <button
              type="button"
              onClick={draftWithAI}
              disabled={drafting || !notes.trim()}
              className="font-cinzel text-[10px] text-portal-emerald border border-portal-emerald/30 rounded-lg px-4 py-2.5 hover:bg-portal-emerald/10 disabled:opacity-40 tracking-widest whitespace-nowrap"
            >
              {drafting ? 'DRAFTING...' : 'DRAFT TITLE + DESCRIPTION'}
            </button>
          </div>
          <p className="font-cormorant text-slate-600 text-xs mt-2">Optional — fills the fields below, which you can still edit before saving.</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="crystal-glass bg-black/30 border border-portal-emerald/10 rounded-xl p-5">
            <div className="font-cinzel text-[10px] text-slate-500 tracking-widest uppercase mb-3">Client</div>
            <div className="grid sm:grid-cols-2 gap-4">
              <GlowInput label="Client Name" value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Example Client" />
              <GlowInput label="Client Email" type="email" value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} placeholder="client@example.com" />
              <GlowInput label="Client Phone" value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)} placeholder="08000000000" />
              <GlowInput label="Company (optional)" value={form.clientCompany} onChange={e => set('clientCompany', e.target.value)} />
            </div>
          </div>

          <div className="crystal-glass bg-black/30 border border-portal-emerald/10 rounded-xl p-5">
            <div className="font-cinzel text-[10px] text-slate-500 tracking-widest uppercase mb-3">Payment Details</div>
            <div className="space-y-4">
              <GlowInput label="Title" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Social Media Package" required />
              <GlowTextarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="10 graphics + 5 short-form videos" required />
              <div className="grid sm:grid-cols-2 gap-4">
                <GlowInput label="Amount (₦)" type="number" min="1" value={form.baseAmount} onChange={e => set('baseAmount', e.target.value)} placeholder="50000" required />
                <GlowInput label="Expires (optional)" type="date" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} />
              </div>
              <GlowSelect
                label="Fee Responsibility"
                value={form.feeMode}
                onChange={e => set('feeMode', e.target.value)}
                options={FEE_MODES}
                hint="Client pays processing fee is the default — Paystack supports passing the fee to the customer."
              />
            </div>
          </div>

          {baseAmount > 0 && (
            <div className="crystal-glass bg-black/40 border border-portal-emerald/20 rounded-xl p-4 font-mono text-xs">
              <div className="flex justify-between py-1 text-slate-400"><span>Project amount</span><span>₦{baseAmount.toLocaleString()}</span></div>
              <div className="flex justify-between py-1 text-slate-400"><span>Processing fee ({form.feeMode.replace(/_/g, ' ').toLowerCase()})</span><span>₦{previewFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between py-1 text-portal-emerald font-bold border-t border-portal-emerald/15 mt-1 pt-2"><span>Client pays</span><span>₦{previewTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
            </div>
          )}

          <GlowTextarea label="Founder Note (private, optional)" value={form.founderNote} onChange={e => set('founderNote', e.target.value)} rows={2} hint="Never shown to the client." />

          {error && <p className="font-cormorant text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <GlowButton type="submit" variant="primary" loading={saving}>Create Payment Request</GlowButton>
            <GlowButton type="button" variant="ghost" onClick={() => router.push('/founder/payments')}>Cancel</GlowButton>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const redirect = await requireAuth(ctx, 'FOUNDER')
  if (redirect) return redirect
  return { props: {} }
}