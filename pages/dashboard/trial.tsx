// Teen-Hub/pages/dashboard/trial.tsx
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
  const [loading, setLoading] = useState(true)
  const [submissionUrl, setSubmissionUrl] = useState('')
  const [submissionNote, setSubmissionNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    fetch('/api/user/me')
      .then(r => r.json())
      .then(data => {
        setTrial(data.trial)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function submitTask() {
    if (!submissionNote.trim()) return setSubmitError('Describe what you completed before submitting.')
    setSubmitting(true)
    setSubmitError('')
    const res = await fetch('/api/trial/submit-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionUrl: submissionUrl.trim() || undefined, submissionNote: submissionNote.trim() }),
    })
    const data = await res.json().catch(() => ({}))
    setSubmitting(false)
    if (!res.ok) return setSubmitError(data.error || 'Failed to submit')
    setTrial(data.trial)
  }

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
            <div className="w-10 h-10 border-2 border-portal-emerald/30 border-t-portal-emerald rounded-full animate-spin" />
            <p className="font-cinzel text-xs text-portal-emerald tracking-widest animate-pulse">LOADING TRIAL DATA...</p>
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
              <h1 className="font-cinzel font-black text-xl text-white tracking-widest uppercase">Trial Status</h1>
              <p className="font-cormorant text-slate-500 text-sm mt-1">Your guild evaluation progress</p>
            </div>
          </div>

          {!trial ? (
            <div className="bg-[#03060A] border border-portal-emerald/20 p-8 text-center">
              <div className="font-cinzel text-4xl text-slate-700 mb-4">◈</div>
              <p className="font-cinzel text-sm text-slate-500 tracking-widest mb-6">No Trial Application Found</p>
              <p className="font-cormorant text-slate-600 mb-6">You haven't submitted a guild application yet.</p>
              <Link href="/apply" className="inline-block bg-portal-emerald/20 border border-portal-emerald/40 px-6 py-2.5 font-cinzel text-xs text-portal-emerald hover:bg-portal-emerald/30 transition-all tracking-widest">
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
                    <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-current opacity-30" />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className={`w-14 h-14 border-2 ${cfg.border} rotate-45 flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-lg -rotate-45 ${cfg.color}`}>
                          {trial.status === 'ACCEPTED' ? '✓' : trial.status === 'REJECTED' ? '✕' : trial.status === 'UNDER_REVIEW' ? '◉' : '⏳'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-cinzel text-[10px] tracking-[0.3em] text-slate-500 uppercase mb-1">Evaluation Status</div>
                        <div className={`font-cinzel font-black text-lg ${cfg.color} tracking-wider`}>
                          {cfg.label.toUpperCase()}
                        </div>
                        <div className="font-cormorant text-slate-400 text-sm mt-1">
                          Submitted: {new Date(trial.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                      {trial.score !== null && trial.score !== undefined && (
                        <div className="text-right">
                          <div className="font-cinzel text-[10px] text-slate-600 tracking-widest uppercase">Trial Score</div>
                          <div className={`font-cinzel font-black text-3xl ${cfg.color}`}>{trial.score}</div>
                          <div className="font-cormorant text-slate-600 text-xs">/ 100</div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Trial Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#03060A] border border-portal-emerald/20 p-5">
                  <h3 className="font-cinzel text-xs text-portal-emerald tracking-widest uppercase mb-4">Application Details</h3>
                  <div className="flex flex-col gap-3">
                    {[
                      { label: 'Skills', value: trial.skills?.join(', ') || '—' },
                      { label: 'Availability', value: trial.availability || '—' },
                      { label: 'Portfolio', value: trial.portfolioUrl || 'Not provided' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div className="font-cinzel text-[9px] text-slate-600 tracking-widest uppercase">{label}</div>
                        <div className="font-cormorant text-slate-300 text-sm mt-0.5">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#03060A] border border-portal-emerald/20 p-5">
                  <h3 className="font-cinzel text-xs text-portal-emerald tracking-widest uppercase mb-4">Scoring Breakdown</h3>
                  {[
                    { label: 'Quality', pct: 40 },
                    { label: 'Reliability', pct: 30 },
                    { label: 'Communication', pct: 20 },
                    { label: 'Speed', pct: 10 },
                  ].map(({ label, pct }) => (
                    <div key={label} className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="font-cormorant text-xs text-slate-400">{label}</span>
                        <span className="font-cinzel text-[10px] text-portal-emerald">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 w-full">
                        <div className="h-full bg-portal-emerald/40" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Founder / Judge Notes */}
              {trial.judgeNotes && (
                <div className="bg-[#03060A] border border-amber-500/20 p-5">
                  <h3 className="font-cinzel text-xs text-amber-400 tracking-widest uppercase mb-3">Founder Notes</h3>
                  <p className="font-cormorant text-slate-300 leading-relaxed">{trial.judgeNotes}</p>
                </div>
              )}

              {/* Assigned Trial Task — previously this mapped over the ENTIRE
                  task catalog (/api/trial/tasks) and rendered a full,
                  independently-submittable form under every card, all
                  sharing one submissionNote/submitError state. Submitting
                  from any card always checked the real assignedTaskId
                  server-side, so if that lookup didn't match, the same
                  "No task has been assigned to you yet" error printed
                  under every single card. Now: exactly one card, for the
                  task actually on this trial (trial.assignedTask, joined
                  in /api/user/me), with a clear message when none exists yet. */}
              <div className="bg-[#03060A] border border-portal-emerald/20 p-5">
                <h3 className="font-cinzel text-xs text-portal-emerald tracking-widest uppercase mb-4">Assigned Trial Task</h3>
                {!trial.assignedTask ? (
                  <p className="font-cormorant text-slate-400 text-sm">
                    No task has been assigned to you yet — check back soon, or reach out if this seems like a mistake.
                  </p>
                ) : (
                  <div className="border border-portal-emerald/20 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-cinzel text-sm text-white mb-1">{trial.assignedTask.title}</div>
                        <div className="font-cormorant text-slate-400 text-sm leading-relaxed">{trial.assignedTask.description}</div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="font-cinzel text-[9px] text-portal-emerald border border-portal-emerald/30 px-2 py-0.5 tracking-widest">{trial.assignedTask.category}</span>
                          <span className="font-cinzel text-[9px] text-slate-500 tracking-widest">{trial.assignedTask.difficulty}</span>
                          <span className="font-cormorant text-xs text-slate-600">⏱ {trial.assignedTask.deadlineHours}h deadline</span>
                        </div>
                      </div>
                    </div>

                    {/* Submission — this whole block didn't exist before;
                        the task card used to just be a static description
                        with no way to actually turn work in. */}
                    {trial.taskSubmittedAt ? (
                      <div className="mt-4 pt-4 border-t border-portal-emerald/10">
                        <div className="font-cinzel text-[10px] text-portal-emerald tracking-widest uppercase mb-1">
                          ✓ Submitted {new Date(trial.taskSubmittedAt).toLocaleString()}
                        </div>
                        {trial.taskSubmissionNote && (
                          <p className="font-cormorant text-slate-400 text-sm italic mt-1">"{trial.taskSubmissionNote}"</p>
                        )}
                        {trial.taskSubmissionUrl && (
                          <a href={trial.taskSubmissionUrl} target="_blank" rel="noreferrer" className="font-cormorant text-portal-cyan text-sm underline mt-1 inline-block">
                            {trial.taskSubmissionUrl}
                          </a>
                        )}
                      </div>
                    ) : ['PENDING', 'UNDER_REVIEW'].includes(trial.status) ? (
                      <div className="mt-4 pt-4 border-t border-portal-emerald/10 flex flex-col gap-2">
                        <input
                          value={submissionUrl}
                          onChange={e => setSubmissionUrl(e.target.value)}
                          placeholder="Link to your work (optional) — https://..."
                          className="w-full bg-black/40 border border-portal-emerald/20 rounded px-3 py-2 font-cormorant text-sm text-slate-200 focus:outline-none focus:border-portal-emerald/50"
                        />
                        <textarea
                          value={submissionNote}
                          onChange={e => setSubmissionNote(e.target.value)}
                          placeholder="Describe what you completed *"
                          rows={3}
                          className="w-full bg-black/40 border border-portal-emerald/20 rounded px-3 py-2 font-cormorant text-sm text-slate-200 focus:outline-none focus:border-portal-emerald/50"
                        />
                        {submitError && <p className="font-cormorant text-red-400 text-xs">{submitError}</p>}
                        <button
                          onClick={submitTask}
                          disabled={submitting}
                          className="font-cinzel text-xs rounded-full px-4 py-2 border border-portal-emerald/40 text-portal-emerald hover:bg-portal-emerald/10 transition-all disabled:opacity-50 self-start"
                        >
                          {submitting ? 'SUBMITTING…' : 'SUBMIT TASK'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Rules */}
              <div className="bg-[#03060A] border border-portal-emerald/20 p-5">
                <h3 className="font-cinzel text-xs text-portal-emerald tracking-widest uppercase mb-4">Trial Rules</h3>
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
                      <span className="text-portal-emerald mt-0.5 flex-shrink-0 text-xs">◈</span>
                      <span className="font-cormorant text-slate-400 text-sm">{rule}</span>
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