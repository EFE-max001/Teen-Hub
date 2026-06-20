import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { GetServerSideProps } from 'next'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import GlowButton from '@/components/ui/GlowButton'

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy:   'text-green-400 border-green-500/40',
  Medium: 'text-yellow-400 border-yellow-500/40',
  Hard:   'text-orange-400 border-orange-500/40',
  Expert: 'text-red-400 border-red-500/40',
}

export default function QuestDetailPage({ quest }: { quest: any }) {
  const router = useRouter()
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleClaim() {
    setClaiming(true)
    setError('')
    const res = await fetch(`/api/quests/${quest.id}/claim`, { method: 'POST' })
    const data = await res.json()
    setClaiming(false)
    if (!res.ok) setError(data.error || 'Failed to claim quest')
    else { setSuccess('Quest claimed. Report for duty.'); setTimeout(() => router.push('/dashboard/quests'), 1500) }
  }

  return (
    <>
      <Head><title>{quest.title} — QuestHub Guild</title></Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto flex flex-col gap-6">

          <div className="flex items-center gap-3">
            <Link href="/dashboard/quests" className="font-rajdhani text-slate-600 hover:text-purple-400 text-sm transition-colors">
              ← Quest Board
            </Link>
          </div>

          <div className="relative bg-[#0d0017] border border-purple-500/20 p-6 sm:p-8 overflow-hidden">
            <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-purple-500/50" />
            <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-purple-500/50" />

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="font-orbitron text-[9px] border border-purple-500/30 bg-purple-900/20 text-purple-400 px-2 py-0.5 tracking-widest">
                {quest.category}
              </span>
              {quest.difficulty && (
                <span className={`font-orbitron text-[9px] border px-2 py-0.5 tracking-widest ${DIFFICULTY_COLOR[quest.difficulty] || 'text-slate-400 border-slate-700'}`}>
                  {quest.difficulty}
                </span>
              )}
              <span className="font-orbitron text-[9px] border border-slate-700 text-slate-500 px-2 py-0.5 tracking-widest">
                Rank {quest.rankRequired}+
              </span>
              <span className={`font-orbitron text-[9px] px-2 py-0.5 tracking-widest border ${
                quest.status === 'OPEN' ? 'text-green-400 border-green-500/40' : 'text-slate-500 border-slate-700'
              }`}>
                {quest.status.replace('_', ' ')}
              </span>
            </div>

            <h1 className="font-orbitron font-black text-xl sm:text-2xl text-white mb-4 leading-tight">{quest.title}</h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 p-4 bg-black/30 border border-purple-500/10">
              <div>
                <div className="font-orbitron text-[9px] text-slate-600 tracking-widest uppercase">XP Reward</div>
                <div className="font-orbitron font-black text-lg text-purple-400 mt-1">+{quest.rewardXp}</div>
              </div>
              {quest.deadline && (
                <div>
                  <div className="font-orbitron text-[9px] text-slate-600 tracking-widest uppercase">Deadline</div>
                  <div className="font-rajdhani text-slate-300 text-sm mt-1">
                    {new Date(quest.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              )}
              <div>
                <div className="font-orbitron text-[9px] text-slate-600 tracking-widest uppercase">Client</div>
                <div className="font-rajdhani text-slate-500 text-sm mt-1">— Hidden —</div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-orbitron text-xs text-purple-400 tracking-widest uppercase mb-3">Mission Briefing</h3>
              <div className="font-rajdhani text-slate-300 leading-relaxed whitespace-pre-wrap">{quest.instructions}</div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm font-rajdhani mb-4">
                ⚠ {error}
              </div>
            )}
            {success && (
              <div className="bg-green-900/20 border border-green-500/40 px-4 py-3 text-green-300 text-sm font-rajdhani mb-4">
                ✓ {success}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-purple-500/10">
              {quest.status === 'OPEN' && (
                <GlowButton variant="primary" size="md" loading={claiming} onClick={handleClaim}>
                  Apply for Quest
                </GlowButton>
              )}
              <GlowButton variant="ghost" size="md" onClick={() => router.back()}>
                Back
              </GlowButton>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const redirect = await requireAuth(context, 'ACCEPTED_MEMBER')
  if (redirect) return redirect

  const { id } = context.params as { id: string }
  const quest = await prisma.quest.findUnique({ where: { id } })
  if (!quest) return { notFound: true }

  return {
    props: {
      quest: JSON.parse(JSON.stringify(quest)),
    },
  }
}
