// Teen-Hub/pages/founder/payments/index.tsx
import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { GetServerSideProps } from 'next'
import { requireAuth } from '@/lib/middleware'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import StatusChip from '@/components/ui/StatusChip'
import GlowButton from '@/components/ui/GlowButton'

type PaymentRequest = {
  id: string
  reference: string
  status: string
  title: string
  clientName: string | null
  clientEmail: string | null
  baseAmount: number
  processingFee: number
  customerTotal: number
  currency: string
  feeMode: string
  createdAt: string
  paidAt: string | null
  publicToken: string
  linkedQuest: { id: string; title: string } | null
}

function money(currency: string, amount: number) {
  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : `${currency} `
  return `${symbol}${Number(amount).toLocaleString()}`
}

export default function PaymentCenter() {
  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/founder/payments')
    const data = await res.json()
    setRequests(data.requests || [])
    setSummary(data.summary || null)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function copyLink(pr: PaymentRequest) {
    const url = `${window.location.origin}/pay/${pr.publicToken}`
    await navigator.clipboard.writeText(url)
    setCopiedId(pr.id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  async function cancelRequest(pr: PaymentRequest) {
    if (!confirm(`Cancel payment request ${pr.reference}?`)) return
    await fetch(`/api/founder/payments/${pr.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    })
    load()
  }

  async function remind(pr: PaymentRequest) {
    const res = await fetch(`/api/founder/payments/${pr.id}/remind`, { method: 'POST' })
    const data = await res.json()
    alert(data.ok ? 'Reminder sent.' : `Could not send reminder: ${data.error || 'unknown error'}`)
    load()
  }

  async function getAiSummary() {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/payment-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'summary' }),
      })
      const data = await res.json()
      setAiSummary(data.summary || null)
    } finally {
      setAiLoading(false)
    }
  }

  const SUMMARY_CARDS = summary
    ? [
        { label: 'Total Received', value: money('NGN', summary.totalReceived) },
        { label: 'Paid This Month', value: money('NGN', summary.paidThisMonth) },
        { label: 'Outstanding', value: money('NGN', summary.outstanding) },
        { label: 'Pending', value: summary.pendingCount },
        { label: 'Paid', value: summary.paidCount },
        { label: 'Failed', value: summary.failedCount },
      ]
    : []

  return (
    <DashboardLayout title="Payment Center">
      <Head><title>Payment Center — QuestHub Founder</title></Head>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-cinzel font-black text-xl sm:text-2xl text-white">PAYMENT CENTER</h1>
          <p className="font-cormorant text-slate-500 text-sm mt-1">
            Create client payment links, track receipts, and manage reminders — money stays under founder control.
          </p>
        </div>
        <Link href="/founder/payments/new">
          <GlowButton variant="primary">+ New Payment Request</GlowButton>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {SUMMARY_CARDS.map((c) => (
          <div key={c.label} className="crystal-glass bg-black/50 border border-portal-emerald/15 rounded-xl p-4">
            <div className="font-cinzel text-lg sm:text-xl text-portal-emerald">{c.value}</div>
            <div className="font-cormorant text-[11px] text-slate-500 uppercase tracking-wider mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* AI summary */}
      <div className="crystal-glass bg-black/40 border border-portal-emerald/15 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="font-cinzel text-[10px] text-portal-emerald tracking-widest uppercase">SENTINEL Payment Digest</div>
          <button
            onClick={getAiSummary}
            disabled={aiLoading}
            className="font-cinzel text-[10px] text-slate-400 hover:text-portal-emerald tracking-widest disabled:opacity-40"
          >
            {aiLoading ? 'THINKING...' : aiSummary ? 'REFRESH' : 'GENERATE'}
          </button>
        </div>
        {aiSummary && <p className="font-cormorant text-slate-300 text-sm mt-2">{aiSummary}</p>}
        {!aiSummary && !aiLoading && (
          <p className="font-cormorant text-slate-600 text-sm mt-2">Generate a plain-English summary of this week's payment activity.</p>
        )}
      </div>

      {/* Table */}
      <div className="crystal-glass bg-black/40 border border-portal-emerald/15 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-portal-emerald/15 text-left">
                {['Client', 'Description', 'Total', 'Status', 'Created', 'Reference', 'Actions'].map(h => (
                  <th key={h} className="font-cinzel text-[10px] text-slate-500 tracking-wider uppercase px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center font-cormorant text-slate-500">Loading...</td></tr>
              )}
              {!loading && requests.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center font-cormorant text-slate-500">No payment requests yet. Create your first one.</td></tr>
              )}
              {requests.map(pr => (
                <tr key={pr.id} className="border-b border-portal-emerald/5 last:border-0 hover:bg-portal-emerald/[0.03] transition-colors">
                  <td className="px-4 py-3 font-cormorant text-slate-300 whitespace-nowrap">
                    <div>{pr.clientName || '—'}</div>
                    <div className="text-[11px] text-slate-600">{pr.clientEmail || ''}</div>
                  </td>
                  <td className="px-4 py-3 font-cormorant text-slate-400 max-w-[220px] truncate">
                    <Link href={`/founder/payments/${pr.id}`} className="hover:text-portal-emerald">{pr.title}</Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-portal-emerald whitespace-nowrap">{money(pr.currency, pr.customerTotal)}</td>
                  <td className="px-4 py-3"><StatusChip status={pr.status} size="sm" /></td>
                  <td className="px-4 py-3 font-cormorant text-slate-500 text-xs whitespace-nowrap">{new Date(pr.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">{pr.reference}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button onClick={() => copyLink(pr)} className="font-cinzel text-[10px] text-slate-400 hover:text-portal-emerald tracking-wider">
                        {copiedId === pr.id ? 'COPIED ✓' : 'COPY LINK'}
                      </button>
                      {['ACTIVE', 'PENDING', 'FAILED'].includes(pr.status) && pr.clientEmail && (
                        <button onClick={() => remind(pr)} className="font-cinzel text-[10px] text-slate-400 hover:text-portal-gold tracking-wider">
                          REMIND
                        </button>
                      )}
                      {['DRAFT', 'ACTIVE', 'PENDING', 'FAILED'].includes(pr.status) && (
                        <button onClick={() => cancelRequest(pr)} className="font-cinzel text-[10px] text-slate-400 hover:text-red-400 tracking-wider">
                          CANCEL
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const redirect = await requireAuth(ctx, 'FOUNDER')
  if (redirect) return redirect
  return { props: {} }
}