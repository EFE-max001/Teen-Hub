import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useSession } from 'next-auth/react'
import { GetServerSideProps } from 'next'
import { requireAuth } from '@/lib/middleware'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default function AchievementsPage() {
  const { data: session } = useSession()
  const [achievements, setAchievements] = useState<any[]>([])
  const [titles, setTitles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [settingTitle, setSettingTitle] = useState(false)
  const [tab, setTab] = useState<'achievements' | 'titles'>('achievements')

  useEffect(() => {
    Promise.all([
      fetch('/api/achievements').then(r => r.json()),
      fetch('/api/titles').then(r => r.json()),
    ]).then(([a, t]) => {
      setAchievements(a.achievements || [])
      setTitles(t.titles || [])
      setLoading(false)
    })
  }, [])

  async function setActiveTitle(titleId: string | null) {
    setSettingTitle(true)
    await fetch('/api/titles/set-active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titleId }),
    })
    const t = await fetch('/api/titles').then(r => r.json())
    setTitles(t.titles || [])
    setSettingTitle(false)
  }

  const earnedAchievements = achievements.filter(a => a.awardedTo?.length > 0)
  const lockedAchievements = achievements.filter(a => !a.awardedTo?.length)
  const earnedTitles = titles.filter(t => t.awardedTo?.length > 0)

  return (
    <>
      <Head><title>Achievements & Titles — QuestHub Guild</title></Head>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-orbitron font-black text-xl text-white">HONOURS</h1>
              <p className="font-rajdhani text-slate-500 text-sm mt-0.5">
                {earnedAchievements.length} achievements · {earnedTitles.length} titles earned
              </p>
            </div>
            <div className="flex gap-1">
              {(['achievements', 'titles'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`font-orbitron text-xs tracking-widest px-4 py-2 transition-colors ${
                    tab === t
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t === 'achievements' ? '🏆 ACHIEVEMENTS' : '⚔️ TITLES'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
            </div>
          ) : tab === 'achievements' ? (
            <div className="flex flex-col gap-4">
              {earnedAchievements.length > 0 && (
                <div>
                  <h2 className="font-orbitron text-xs text-purple-400 tracking-widest uppercase mb-3">Earned</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {earnedAchievements.map(a => (
                      <div key={a.id} className="bg-[#0d0017] border border-purple-500/30 p-4 flex gap-3 items-start">
                        <span className="text-2xl">{a.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-orbitron font-bold text-sm text-white">{a.name}</span>
                            <span className={`text-[9px] font-orbitron tracking-widest px-1.5 py-0.5 border ${
                              a.type === 'PERMANENT' ? 'border-purple-500/40 text-purple-400' :
                              a.type === 'COMPETITIVE' ? 'border-yellow-500/40 text-yellow-400' :
                              'border-blue-500/40 text-blue-400'
                            }`}>{a.type}</span>
                          </div>
                          <p className="font-rajdhani text-slate-400 text-xs mt-1">{a.description}</p>
                          {a.xpBonus > 0 && (
                            <p className="font-orbitron text-[10px] text-purple-400 mt-1">+{a.xpBonus} XP</p>
                          )}
                          {a.awardedTo[0]?.awardedByAI && (
                            <p className="font-rajdhani text-[10px] text-slate-500 mt-1">⚡ AI Awarded</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lockedAchievements.length > 0 && (
                <div>
                  <h2 className="font-orbitron text-xs text-slate-600 tracking-widest uppercase mb-3">Locked</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lockedAchievements.map(a => (
                      <div key={a.id} className="bg-[#0a0010] border border-slate-700/30 p-4 flex gap-3 items-start opacity-50">
                        <span className="text-2xl grayscale">{a.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="font-orbitron font-bold text-sm text-slate-500">{a.name}</span>
                          <p className="font-rajdhani text-slate-600 text-xs mt-1">{a.condition}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {achievements.length === 0 && (
                <div className="text-center py-16">
                  <p className="font-orbitron text-slate-600 text-sm">No achievements configured yet</p>
                  <p className="font-rajdhani text-slate-700 text-xs mt-1">Complete quests and rank up to earn achievements</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {earnedTitles.length > 0 ? (
                <div>
                  <h2 className="font-orbitron text-xs text-purple-400 tracking-widest uppercase mb-3">Your Titles</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {earnedTitles.map(t => {
                      const ut = t.awardedTo[0]
                      const isActive = ut?.active
                      const expired = ut?.expiresAt && new Date(ut.expiresAt) < new Date()
                      return (
                        <div key={t.id} className={`bg-[#0d0017] border p-4 flex gap-3 items-start ${
                          isActive ? 'border-purple-400/60' : 'border-purple-500/20'
                        }`}>
                          <span className="text-2xl">{t.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-orbitron font-bold text-sm text-white">{t.name}</span>
                              {isActive && <span className="text-[9px] font-orbitron bg-purple-600/30 text-purple-300 px-1.5 py-0.5">ACTIVE</span>}
                              {expired && <span className="text-[9px] font-orbitron text-red-400 border border-red-500/30 px-1.5 py-0.5">EXPIRED</span>}
                            </div>
                            <p className="font-rajdhani text-slate-400 text-xs mt-1">{t.description}</p>
                            {!expired && (
                              <button
                                disabled={settingTitle}
                                onClick={() => setActiveTitle(isActive ? null : t.id)}
                                className={`mt-2 font-orbitron text-[10px] tracking-widest px-2 py-1 border transition-colors ${
                                  isActive
                                    ? 'border-slate-600 text-slate-500 hover:border-red-500/40 hover:text-red-400'
                                    : 'border-purple-500/40 text-purple-400 hover:bg-purple-600/20'
                                }`}
                              >
                                {isActive ? 'REMOVE' : 'SET ACTIVE'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="font-orbitron text-slate-600 text-sm">No titles earned yet</p>
                  <p className="font-rajdhani text-slate-700 text-xs mt-1">Titles are awarded by the Founder for special achievements</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const redirect = await requireAuth(context, 'TRIAL_MEMBER')
  if (redirect) return redirect
  return { props: {} }
}
