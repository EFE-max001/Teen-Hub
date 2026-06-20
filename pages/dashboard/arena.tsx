import { useEffect, useState } from 'react'
import Head from 'next/head'
import { GetServerSideProps } from 'next'
import { requireAuth } from '@/lib/middleware'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

const TYPE_ICONS: Record<string, string> = {
  challenge:   '⚡',
  tournament:  '🏆',
  poll:        '◈',
  mini_game:   '◆',
  guild_war:   '⚔',
}

export default function ArenaPage() {
  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/arena')
      .then(r => r.json())
      .then(data => { setChallenges(data.challenges || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <>
      <Head><title>Fun Arena — QuestHub Guild</title></Head>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto flex flex-col gap-6">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-orbitron font-black text-xl text-white tracking-widest uppercase">Fun Arena</h1>
              <p className="font-rajdhani text-slate-500 text-sm mt-1">Challenges, tournaments and guild events</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span className="font-orbitron text-[10px] text-purple-400 tracking-widest">LIVE</span>
            </div>
          </div>

          {/* Banner */}
          <div className="relative bg-gradient-to-r from-purple-900/30 via-[#0d0017] to-purple-900/20 border border-purple-500/30 p-6 overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
            <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-purple-500/60" />
            <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-purple-500/60" />
            <div className="relative z-10">
              <div className="font-orbitron text-[10px] text-purple-400 tracking-[0.4em] uppercase mb-2">Weekly Guild War</div>
              <h2 className="font-orbitron font-black text-2xl text-white mb-2">COMPETE. EARN. DOMINATE.</h2>
              <p className="font-rajdhani text-slate-400 text-sm max-w-lg">
                The Founder posts new challenges, tournaments and events. Complete them to earn XP, boost your rank, and occasionally win real rewards.
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Active Events',  value: challenges.filter(c => new Date(c.endsAt) > new Date()).length, color: 'text-green-400' },
              { label: 'XP Available',   value: challenges.reduce((s: number, c: any) => s + (c.xpReward || 0), 0), color: 'text-purple-400' },
              { label: 'Cash Prizes',    value: challenges.filter((c: any) => c.cashReward).length, color: 'text-amber-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#0d0017] border border-purple-500/20 p-4 text-center">
                <div className={`font-orbitron font-black text-2xl ${color} mb-1`}>{value}</div>
                <div className="font-rajdhani text-xs text-slate-600 tracking-widest uppercase">{label}</div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
                <p className="font-orbitron text-xs text-purple-400 tracking-widest animate-pulse">LOADING ARENA...</p>
              </div>
            </div>
          ) : challenges.length === 0 ? (
            <div className="bg-[#0d0017] border border-purple-500/20 p-12 text-center">
              <div className="text-5xl mb-4 opacity-20">⚡</div>
              <p className="font-orbitron text-sm text-slate-600 tracking-widest mb-2">No Active Events</p>
              <p className="font-rajdhani text-slate-700 text-sm">The Founder will post new challenges soon. Stay alert.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges.map((challenge: any) => {
                const ended = new Date(challenge.endsAt) < new Date()
                return (
                  <div
                    key={challenge.id}
                    className={`relative bg-[#0d0017] border p-5 transition-all duration-300 ${
                      ended ? 'border-slate-800 opacity-50' : 'border-purple-500/20 hover:border-purple-400/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.08)]'
                    }`}
                  >
                    <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-purple-500/30" />

                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{TYPE_ICONS[challenge.type] || '◈'}</span>
                        <h3 className="font-orbitron font-bold text-sm text-white leading-snug">{challenge.title}</h3>
                      </div>
                      {ended ? (
                        <span className="font-orbitron text-[9px] text-slate-600 border border-slate-800 px-2 py-0.5 flex-shrink-0">ENDED</span>
                      ) : (
                        <span className="font-orbitron text-[9px] text-green-400 border border-green-500/30 bg-green-900/10 px-2 py-0.5 flex-shrink-0">LIVE</span>
                      )}
                    </div>

                    <p className="font-rajdhani text-slate-400 text-sm leading-relaxed mb-4">{challenge.description}</p>

                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-purple-500/10">
                      <div>
                        <div className="font-orbitron text-[8px] text-slate-700 uppercase tracking-widest">XP</div>
                        <div className="font-orbitron text-purple-400 text-sm font-bold">+{challenge.xpReward}</div>
                      </div>
                      {challenge.cashReward && (
                        <div>
                          <div className="font-orbitron text-[8px] text-slate-700 uppercase tracking-widest">Cash</div>
                          <div className="font-orbitron text-amber-400 text-sm font-bold">${challenge.cashReward}</div>
                        </div>
                      )}
                      <div className="ml-auto">
                        <div className="font-orbitron text-[8px] text-slate-700 uppercase tracking-widest">Ends</div>
                        <div className="font-rajdhani text-slate-500 text-xs">
                          {new Date(challenge.endsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const redirect = await requireAuth(context, 'ACCEPTED_MEMBER')
  if (redirect) return redirect
  return { props: {} }
}
