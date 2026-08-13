// Teen-Hub/pages/founder/payments/[id].tsx
import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'
import { requireAuth } from '@/lib/middleware'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import StatusChip from '@/components/ui/StatusChip'
import GlowButton from '@/components/ui/GlowButton'

function money(currency: string, amount: number) {
  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : `${currency} `
  return `${symbol}${Number(amount).toLocaleString()}`
}

export default function PaymentDetail() {
  const router = useRouter()
  const { id } = router.query
  const [data, setData] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof id !== 'string') return
    fetch(`/api/founder/payments/${id}`).then(r => r.json()).then(setData)
  }, [id])

  if (!data?.paymentRequest) {
    return (
      <DashboardLayout title="Payment Detail">
        <p className="font-cormorant text-slate-500 p-6">Loading…</p>
      </DashboardLayout>
    )
  }

  const pr = data.paymentRequest

  async function copyLink() {
    await navigator.clipboard.writeText(data.payUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <DashboardLayout title={pr.reference}>
      <Head><title>{pr.reference} — Payment Center</title></Head>

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-cinzel font-black text-xl text-white">{pr.title}</h1>
              <StatusChip status={pr.status} />
            </div>
            <p className="font-mono text-xs text-slate-500 mt-1">{pr.reference}</p>
          </div>
          <GlowButton variant="secondary" onClick={copyLink}>{copied ? 'Copied ✓' : 'Copy Link'}</GlowButton>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="crystal-glass bg-black/40 border border-portal-emerald/15 rounded-xl p-4">
            <div className="font-cinzel text-[10px] text-slate-500 tracking-widest uppercase mb-3">Client</div>
            <div className="font-cormorant text-sm text-slate-300 space-y-1">
              <div>{pr.clientName || '—'}</div>
              <div className="text-slate-500">{pr.clientEmail || '—'}</div>
              <div className="text-slate-500">{pr.clientPhone || '—'}</div>
              {pr.clientCompany && <div className="text-slate-500">{pr.clientCompany}</div>}
            </div>
          </div>
          <div className="crystal-glass bg-black/40 border border-portal-emerald/15 rounded-xl p-4">
            <div className="font-cinzel text-[10px] text-slate-500 tracking-widest uppercase mb-3">Amounts</div>
            <div className="font-mono text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400"><span>Base</span><span>{money(pr.currency, pr.baseAmount)}</span></div>
              <div className="flex justify-between text-slate-400"><span>Processing fee</span><span>{money(pr.currency, pr.processingFee)}</span></div>
              <div className="flex justify-between text-portal-emerald font-bold border-t border-portal-emerald/15 pt-1.5"><span>Total {pr.status === 'PAID' ? 'paid' : 'due'}</span><span>{money(pr.currency, pr.customerTotal)}</span></div>
              <div className="flex justify-between text-slate-600 pt-1"><span>Fee mode</span><span>{pr.feeMode.replace(/_/g, ' ')}</span></div>
            </div>
          </div>
        </div>

        {pr.linkedQuest && (
          <div className="crystal-glass bg-black/40 border border-portal-emerald/15 rounded-xl p-4 mb-6">
            <div className="font-cinzel text-[10px] text-slate-500 tracking-widest uppercase mb-2">Linked Quest</div>
            <p className="font-cormorant text-slate-300 text-sm">{pr.linkedQuest.title} — <StatusChip status={pr.linkedQuest.status} size="sm" /></p>
          </div>
        )}

        {pr.riskLevel && (
          <div className={`crystal-glass rounded-xl p-4 mb-6 border ${pr.riskLevel === 'HIGH' ? 'border-red-500/30 bg-red-950/20' : pr.riskLevel === 'MEDIUM' ? 'border-yellow-500/30 bg-yellow-950/20' : 'border-portal-emerald/15 bg-black/40'}`}>
            <div className="font-cinzel text-[10px] tracking-widest uppercase mb-1">SENTINEL Risk Flag: {pr.riskLevel}</div>
            {pr.riskReason && <p className="font-cormorant text-slate-400 text-sm">{pr.riskReason}</p>}
          </div>
        )}

        {pr.founderNote && (
          <div className="crystal-glass bg-black/40 border border-portal-emerald/15 rounded-xl p-4 mb-6">
            <div className="font-cinzel text-[10px] text-slate-500 tracking-widest uppercase mb-2">Founder Note (private)</div>
            <p className="font-cormorant text-slate-400 text-sm">{pr.founderNote}</p>
          </div>
        )}

        <div className="crystal-glass bg-black/40 border border-portal-emerald/15 rounded-xl p-4 mb-6">
          <div className="font-cinzel text-[10px] text-slate-500 tracking-widest uppercase mb-3">Transactions</div>
          {pr.transactions.length === 0 ? (
            <p className="font-cormorant text-slate-600 text-sm">No checkout attempts yet.</p>
          ) : (
            <div className="space-y-2">
              {pr.transactions.map((t: any) => (
                <div key={t.id} className="flex justify-between items-center font-mono text-xs border-b border-portal-emerald/5 last:border-0 pb-2 last:pb-0">
                  <span className="text-slate-400">{t.paystackReference}</span>
                  <span className="text-slate-500">{t.channel || '—'}</span>
                  <StatusChip status={t.status === 'SUCCESS' ? 'PAID' : t.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="crystal-glass bg-black/40 border border-portal-emerald/15 rounded-xl p-4">
          <div className="font-cinzel text-[10px] text-slate-500 tracking-widest uppercase mb-3">Email History</div>
          {pr.emailLogs.length === 0 ? (
            <p className="font-cormorant text-slate-600 text-sm">No emails sent yet.</p>
          ) : (
            <div className="space-y-1.5">
              {pr.emailLogs.map((e: any) => (
                <div key={e.id} className="flex justify-between font-mono text-[11px] text-slate-500">
                  <span>{e.template} → {e.recipient}</span>
                  <span className={e.status === 'SENT' ? 'text-portal-emerald' : 'text-red-400'}>{e.status}</span>
                </div>
              ))}
            </div>
          )}
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