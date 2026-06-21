import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import GlowButton from '@/components/ui/GlowButton'
import { GetServerSideProps } from 'next'
import { requireAuth } from '@/lib/middleware'

interface Reply {
  id: string
  content: string
  createdAt: string
  author: { nickname: string | null; name: string | null; role: string }
}

interface FeedbackItem {
  id: string
  content: string
  type: string
  status: string
  createdAt: string
  replies: Reply[]
}

const TYPES = [
  { value: 'GENERAL',    label: 'General Feedback' },
  { value: 'BUG',        label: 'Bug Report'       },
  { value: 'QUEST',      label: 'Quest Issue'      },
  { value: 'SUGGESTION', label: 'Suggestion'       },
  { value: 'COMPLAINT',  label: 'Complaint'        },
]

const STATUS_COLORS: Record<string, string> = {
  OPEN:    'text-yellow-400 border-yellow-500/30 bg-yellow-950/20',
  REPLIED: 'text-green-400 border-green-500/30 bg-green-950/20',
  CLOSED:  'text-slate-400 border-slate-600/30 bg-slate-900/20',
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [content, setContent] = useState('')
  const [type, setType] = useState('GENERAL')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const res = await fetch('/api/feedback')
      const data = await res.json()
      setFeedbacks(data.feedbacks || [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), type }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to submit')
      } else {
        setSuccess('Feedback submitted. The Founder will review it.')
        setContent('')
        setType('GENERAL')
        load()
      }
    } catch {
      setError('Submission failed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const roleLabel = (role: string) => {
    if (role === 'FOUNDER') return '[Founder]'
    if (role === 'ADMIN') return '[Admin]'
    if (role === 'COORDINATOR') return '[Coord]'
    return ''
  }

  return (
    <DashboardLayout title="Feedback">
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">

        {/* Header */}
        <div>
          <span className="font-orbitron text-[9px] text-purple-400 tracking-[0.4em] uppercase">Communications</span>
          <h1 className="font-orbitron font-black text-xl sm:text-2xl text-white mt-1">FEEDBACK</h1>
          <p className="font-rajdhani text-slate-400 text-sm mt-1">
            Send feedback, bug reports, or suggestions to the Founder. You'll get a reply here.
          </p>
        </div>

        {/* Submit form */}
        <div className="relative bg-card-bg border border-purple-500/20 p-5 sm:p-6">
          <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-500/40" />
          <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-500/40" />
          <h2 className="font-orbitron font-bold text-sm text-white mb-4">SUBMIT FEEDBACK</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-orbitron text-[9px] text-purple-400 tracking-widest uppercase block mb-2">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-black/60 border border-purple-500/20 text-white font-rajdhani text-sm px-3 py-2.5 focus:outline-none focus:border-purple-500/50"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-orbitron text-[9px] text-purple-400 tracking-widest uppercase block mb-2">Message</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder="Be specific and clear. The Founder reads every message."
                className="w-full bg-black/60 border border-purple-500/20 text-white font-rajdhani text-sm px-3 py-2.5 resize-none focus:outline-none focus:border-purple-500/50 placeholder-slate-600"
              />
            </div>
            {error && <p className="font-rajdhani text-red-400 text-sm">{error}</p>}
            {success && <p className="font-rajdhani text-green-400 text-sm">{success}</p>}
            <GlowButton type="submit" variant="primary" disabled={submitting || !content.trim()} className="w-full sm:w-auto">
              {submitting ? 'Submitting...' : 'Send Feedback'}
            </GlowButton>
          </form>
        </div>

        {/* Past feedback */}
        <div>
          <h2 className="font-orbitron font-bold text-sm text-white mb-4">YOUR SUBMISSIONS</h2>
          {loading ? (
            <p className="font-rajdhani text-slate-500 text-sm">Loading...</p>
          ) : feedbacks.length === 0 ? (
            <p className="font-rajdhani text-slate-600 text-sm">No feedback submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="relative bg-card-bg border border-purple-500/15 p-4 sm:p-5">
                  <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-purple-500/30" />
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-orbitron text-[9px] text-purple-400 tracking-widest">{fb.type}</span>
                      <span className={`font-orbitron text-[8px] border px-1.5 py-0.5 ${STATUS_COLORS[fb.status] || STATUS_COLORS.OPEN}`}>
                        {fb.status}
                      </span>
                    </div>
                    <span className="font-rajdhani text-[10px] text-slate-600">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-rajdhani text-slate-300 text-sm leading-relaxed mb-3">{fb.content}</p>

                  {/* Replies */}
                  {fb.replies.length > 0 && (
                    <div className="border-t border-purple-500/15 pt-3 space-y-2">
                      {fb.replies.map((r) => (
                        <div key={r.id} className="bg-purple-950/20 border border-purple-500/20 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-orbitron text-[8px] text-purple-400">
                              {roleLabel(r.author.role)} {r.author.nickname || r.author.name}
                            </span>
                            <span className="font-rajdhani text-[9px] text-slate-600">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="font-rajdhani text-slate-300 text-sm">{r.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
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
  const r = await requireAuth(ctx, 'GUEST')
  if (r) return r
  return { props: {} }
}
