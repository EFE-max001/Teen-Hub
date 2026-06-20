import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'
import { requireAuth } from '@/lib/middleware'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default function TrialPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [trial, setTrial] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/me')
      .then(r => r.json())
      .then(data => {
        setTrial(data.trial)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    fetch('/api/trial/tasks')
      .then(r => r.json())
      .then(data => setTasks(data.tasks || []))
      .catch(() => {})
  }, [])

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    PENDING:      { label: 'Awaiting Review',   color: 'text-yellow-400', bg: 'bg-yellow-900/15', border: 'border-yellow-500/30' },
    UNDER_REVIEW: { label: 'Under Active Review', color: 'text-blue-400',   bg: 'bg-blue-900/15',   border: 'border-blue-500/30'   },
    ACCEPTED:     { label: 'Trial Passed',       color: 'text-green-400',  bg: 'bg-green-900/15',  border: 'border-green-500/30'  },
    REJECTED:     { label: 'Not Accepted',       color: 'text-red-400',    bg: 'bg-red-900/15',    border: 'border-red-500/30'    },
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
            <p className="font-orbitron text-xs text-purple-400 tracking-widest animate-pulse">LOADING TRIAL DATA...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <>
      <Head><title>My Trial — QuestHub Guild</title></Head>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto flex flex-col gap-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-orbitron font-black text-xl text-white tracking-widest uppercase">Trial Status</h1>
              <p className="font-rajdhani text-slate-500 text-sm mt-1">Your guild evaluation progress</p>
            </div>
          </div>

          {!trial ? (
            <div className="bg-[#0d0017] border border-purple-500/20 p-8 text-center">
              <div className="font-orbitron text-4xl text-slate-700 mb-4">◈</div>
              <p className="font-orbitron text-sm text-slate-500 tracking-widest mb-6">No Trial Application Found</p>
              <p className="font-rajdhani text-slate-600 mb-6">You haven't submitted a guild application yet.</p>
              <Link href="/apply" className="inline-block bg-purple-600/20 border border-purple-500/40 px-6 py-2.5 font-orbitron text-xs text-purple-300 hover:bg-purple-600/30 transition-all tracking-widest">
                APPLY NOW
              </Link>
            </div>
          ) : (
            <>
              {/* Status Card */}
              {(() => {
                const cfg = statusConfig[trial.status] || statusConfig.PENDING
                return (
                  <div className={`relative ${cfg.bg} border ${cfg.border} p-6 overflow-hidden`}>
                    <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-current opacity-30" />
                    <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-current opacity-30" />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className={`w-14 h-14 border-2 ${cfg.border} rotate-45 flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-lg -rotate-45 ${cfg.color}`}>
                          {trial.status === 'ACCEPTED' ? '✓' : trial.status === 'REJECTED' ? '✕' : trial.status === 'UNDER_REVIEW' ? '◉' : '⏳'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-orbitron text-[10px] tracking-[0.3em] text-slate-500 uppercase mb-1">Evaluation Status</div>
                        <div className={`font-orbitron font-black text-lg ${cfg.color} tracking-wider`}>
                          {cfg.label.toUpperCase()}
                        </div>
                        <div className="font-rajdhani text-slate-400 text-sm mt-1">
                          Submitted: {new Date(trial.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                      {trial.score !== null && trial.score !== undefined && (
                        <div className="text-right">
                          <div className="font-orbitron text-[10px] text-slate-600 tracking-widest uppercase">Trial Score</div>
                          <div className={`font-orbitron font-black text-3xl ${cfg.color}`}>{trial.score}</div>
                          <div className="font-rajdhani text-slate-600 text-xs">/ 100</div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Trial Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0d0017] border border-purple-500/20 p-5">
                  <h3 className="font-orbitron text-xs text-purple-400 tracking-widest uppercase mb-4">Application Details</h3>
                  <div className="flex flex-col gap-3">
                    {[
                      { label: 'Skills', value: trial.skills?.join(', ') || '—' },
                      { label: 'Availability', value: trial.availability || '—' },
                      { label: 'Portfolio', value: trial.portfolioUrl || 'Not provided' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div className="font-orbitron text-[9px] text-slate-600 tracking-widest uppercase">{label}</div>
                        <div className="font-rajdhani text-slate-300 text-sm mt-0.5">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0d0017] border border-purple-500/20 p-5">
                  <h3 className="font-orbitron text-xs text-purple-400 tracking-widest uppercase mb-4">Scoring Breakdown</h3>
                  {[
                    { label: 'Quality', pct: 40 },
                    { label: 'Reliability', pct: 30 },
                    { label: 'Communication', pct: 20 },
                    { label: 'Speed', pct: 10 },
                  ].map(({ label, pct }) => (
                    <div key={label} className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="font-rajdhani text-xs text-slate-400">{label}</span>
                        <span className="font-orbitron text-[10px] text-purple-400">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 w-full">
                        <div className="h-full bg-purple-500/40" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Founder / Judge Notes */}
              {trial.judgeNotes && (
                <div className="bg-[#0d0017] border border-amber-500/20 p-5">
                  <h3 className="font-orbitron text-xs text-amber-400 tracking-widest uppercase mb-3">Founder Notes</h3>
                  <p className="font-rajdhani text-slate-300 leading-relaxed">{trial.judgeNotes}</p>
                </div>
              )}

              {/* Active Trial Tasks */}
              {tasks.length > 0 && (
                <div className="bg-[#0d0017] border border-purple-500/20 p-5">
                  <h3 className="font-orbitron text-xs text-purple-400 tracking-widest uppercase mb-4">Assigned Trial Tasks</h3>
                  <div className="flex flex-col gap-3">
                    {tasks.map((task: any) => (
                      <div key={task.id} className="border border-purple-500/20 p-4 hover:border-purple-400/40 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="font-orbitron text-sm text-white mb-1">{task.title}</div>
                            <div className="font-rajdhani text-slate-400 text-sm leading-relaxed">{task.description}</div>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="font-orbitron text-[9px] text-purple-400 border border-purple-500/30 px-2 py-0.5 tracking-widest">{task.category}</span>
                              <span className="font-orbitron text-[9px] text-slate-500 tracking-widest">{task.difficulty}</span>
                              <span className="font-rajdhani text-xs text-slate-600">⏱ {task.deadlineHours}h deadline</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules */}
              <div className="bg-[#0d0017] border border-purple-500/20 p-5">
                <h3 className="font-orbitron text-xs text-purple-400 tracking-widest uppercase mb-4">Trial Rules</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Complete all assigned tasks by the deadline',
                    'Do not communicate with clients directly',
                    'All work must be original — no plagiarism',
                    'Respond to messages within 24 hours',
                    'Ghosting automatically fails your trial',
                    'Founder override is final and absolute',
                  ].map((rule, i) => (
                    <div key={i} className="flex items-start gap-2 py-1.5">
                      <span className="text-purple-500 mt-0.5 flex-shrink-0 text-xs">◈</span>
                      <span className="font-rajdhani text-slate-400 text-sm">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
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
