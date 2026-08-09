// Teen-Hub/pages/dashboard/arena.tsx
import { useEffect, useState } from 'react'
import Head from 'next/head'
import { GetServerSideProps } from 'next'
import { requireAuth } from '@/lib/middleware'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import GlowButton from '@/components/ui/GlowButton'

function useCountdown(endsAt?: string) {
  const [left, setLeft] = useState('')
  useEffect(() => {
    if (!endsAt) return
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now()
      if (diff <= 0) return setLeft('00:00:00')
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1000)
      setLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt])
  return left
}

function GameCard({ game, onOpen }: { game: any; onOpen: () => void }) {
  const countdown = useCountdown(game.isDaily ? game.endsAt : undefined)
  const myEntry = game.entries?.[0]
  const accent = game.isDaily ? 'amber' : 'purple'
  return (
    <button
      onClick={onOpen}
      className={`relative text-left border-2 aspect-[4/5] flex flex-col items-center justify-center gap-2 px-3 py-4 transition-all duration-300 group overflow-hidden rounded-sm ${
        game.isDaily
          ? 'border-amber-400/70 bg-gradient-to-b from-amber-950/40 via-[#03060A] to-[#03060A] shadow-[0_0_30px_rgba(245,158,11,0.25)]'
          : 'border-portal-emerald/40 bg-gradient-to-b from-portal-black/20 via-[#03060A] to-[#03060A] hover:border-portal-emerald/80 hover:shadow-[0_0_30px_rgba(0,255,163,0.25)]'
      }`}
    >
      {/* corner brackets */}

      {game.isDaily && (
        <span className="absolute top-2 left-1/2 -translate-x-1/2 font-cinzel text-[7px] text-amber-300 bg-amber-900/90 border border-amber-500/60 px-2 py-0.5 tracking-widest animate-pulse whitespace-nowrap">
          🔥 DAILY CHALLENGE
        </span>
      )}

      <div className={`relative w-14 h-14 rounded-full flex items-center justify-center text-3xl mt-3 transition-transform duration-300 group-hover:scale-110 ${
        game.isDaily ? 'shadow-[0_0_25px_rgba(245,158,11,0.5)] bg-amber-500/10' : 'shadow-[0_0_20px_rgba(0,255,163,0.35)] bg-portal-emerald/10'
      }`}>
        <span className={`absolute inset-0 rounded-full border ${game.isDaily ? 'border-amber-400/50' : 'border-portal-emerald/40'}`} />
        {game.icon || '◆'}
      </div>

      <h3 className={`font-cinzel font-bold text-[11px] text-center leading-snug tracking-wider uppercase mt-1 ${game.isDaily ? 'text-amber-200' : 'text-white group-hover:text-portal-emerald'}`}>
        {game.title}
      </h3>

      {game.isDaily && countdown ? (
        <span className="font-cinzel text-[10px] text-amber-400">{countdown}</span>
      ) : (
        <span className="font-cinzel text-[9px] text-green-400">+{game.xpReward} XP</span>
      )}

      <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">
        <span className={`font-cinzel uppercase ${accent === 'amber' ? 'text-amber-400/70' : 'text-portal-emerald/70'}`}>{game.category}</span>
        <span className="font-cinzel text-slate-600">· {game._count?.entries ?? 0} plays</span>
      </div>

      {myEntry && (
        <div className="absolute top-2 right-2 font-cinzel text-[8px] text-portal-emerald bg-black/60 backdrop-blur-sm rounded-xl px-1.5 py-0.5 border border-portal-emerald/30">
          {myEntry.aiScore ?? '—'}
        </div>
      )}
    </button>
  )
}

function GamePlayModal({ game, onClose, onSubmitted }: { game: any; onClose: () => void; onSubmitted: () => void }) {
  const [response, setResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [entries, setEntries] = useState<any[]>([])
  const [myVotes, setMyVotes] = useState<string[]>([])
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [expired, setExpired] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [taps, setTaps] = useState(0)
  const [tapWindowLeft, setTapWindowLeft] = useState<number | null>(null)
  const [tapDone, setTapDone] = useState(false)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState('')
  const [started, setStarted] = useState(false)

  const config = game.config || {}
  const mechanicsType = config.mechanics?.type
  const isVoteBattle = mechanicsType === 'creative' || mechanicsType === 'social_task'
  const isQuiz = mechanicsType === 'quiz' && !!config.quiz
  const isTapSpeed = mechanicsType === 'tap_speed'
  const timeLimitSeconds: number = config.time_limit_seconds || 0
  // Tap Speed is a short reaction burst, not a long "answer the objective"
  // window — cap it at 15s even if the founder set a longer overall limit.
  const tapWindowSeconds = Math.min(timeLimitSeconds || 10, 15)
  // The games-list API already tells us if this user has a past entry for
  // this game (game.entries[0], scoped server-side to the current user).
  // If they've already submitted, show that result immediately instead of
  // calling /start — which would otherwise correctly reject with "already
  // submitted" and surface as a confusing red error banner.
  const myEntry = game.entries?.[0]

  useEffect(() => {
    if (myEntry?.response) {
      setResult({
        entry: { aiScore: myEntry.aiScore, aiFeedback: myEntry.aiFeedback, aiFlagged: myEntry.aiFlagged },
        xpAwarded: 0,
        alreadySubmitted: true,
      })
    }
  }, [])

  useEffect(() => {
    if (isVoteBattle) {
      fetch(`/api/arena/${game.id}/entries`).then(r => r.json()).then(d => {
        setEntries(d.entries || [])
        setMyVotes(d.myVotedEntryIds || [])
      }).catch(() => {})
    }
  }, [game.id])

  // Timer — kicks off exactly once (server stamps startedAt only on first
  // open), then counts down locally. Submitting after it hits 0 is also
  // blocked server-side, so a slow client can't cheat the limit.
  // Failures used to be swallowed silently, leaving players staring at a
  // form with no countdown and a confusing "open the game first" error the
  // moment they tried to submit — this now surfaces the real problem with
  // a retry, instead of pretending nothing happened.
  function startTimer() {
    if (myEntry?.response) return // already played — nothing to time
    if (!timeLimitSeconds && !isTapSpeed) return
    setStarting(true)
    setStartError('')
    fetch(`/api/arena/${game.id}/start`, { method: 'POST' })
      .then(async r => {
        const ct = r.headers.get('content-type') || ''
        if (!ct.includes('application/json')) {
          // The server sent back an HTML error page (typically a 404) instead
          // of JSON — this means the /api/arena/[id]/start route itself isn't
          // deployed/registered, not a data problem. Distinguish it clearly
          // from a normal API error so it's actually fixable.
          throw new Error('ROUTE_NOT_FOUND')
        }
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || `Server returned ${r.status}`)
        return d
      })
      .then(d => {
        setStarting(false)
        setStarted(true)
        if (!timeLimitSeconds) return
        const deadline = new Date(d.startedAt).getTime() + timeLimitSeconds * 1000
        const tick = () => {
          const left = Math.max(0, Math.round((deadline - Date.now()) / 1000))
          setSecondsLeft(left)
          if (left <= 0) setExpired(true)
        }
        tick()
        const iv = setInterval(tick, 1000)
        return () => clearInterval(iv)
      })
      .catch(err => {
        setStarting(false)
        if (err.message === 'ROUTE_NOT_FOUND') {
          setStartError(
            "This game's timer endpoint isn't reachable on the server. Make sure pages/api/arena/[id]/start.ts exists in your deployment, then restart/redeploy — a plain code save often isn't enough to register a brand-new API route."
          )
        } else if (err.message?.includes('closed') || err.message?.includes('Unauthorized')) {
          setStartError(err.message)
        } else {
          setStartError(`Couldn't start the timer (${err.message}). This usually means the server needs a database sync (npx prisma db push) — try again in a moment.`)
        }
      })
  }

  useEffect(() => {
    if (myEntry?.response) return
    if (timeLimitSeconds > 0 || isTapSpeed) startTimer()
  }, [game.id])

  // Tap Speed's own short local countdown, independent of the server timer
  // (which only gates the overall submit deadline). Auto-submits on zero.
  useEffect(() => {
    if (!isTapSpeed || !started || tapDone) return
    setTapWindowLeft(tapWindowSeconds)
    const deadline = Date.now() + tapWindowSeconds * 1000
    const iv = setInterval(() => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000))
      setTapWindowLeft(left)
      if (left <= 0) {
        clearInterval(iv)
        setTapDone(true)
      }
    }, 100)
    return () => clearInterval(iv)
  }, [isTapSpeed, started])

  useEffect(() => {
    if (isTapSpeed && tapDone) doSubmit(String(taps))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tapDone])

  async function doSubmit(payload: string) {
    setSubmitting(true)
    setError('')
    const r = await fetch(`/api/arena/${game.id}/submit`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: payload }),
    })
    const d = await r.json()
    setSubmitting(false)
    if (!r.ok) {
      if (/time limit/i.test(d.error || '')) setExpired(true)
      return setError(d.error || 'Submission failed')
    }
    setResult(d)
    onSubmitted()
  }

  async function submit() {
    if (isQuiz) {
      if (selectedOption === null) return setError('Pick an answer first')
      if (expired) return setError("Time's up for this attempt")
      return doSubmit(String(selectedOption))
    }
    if (!response.trim()) return setError('Enter a response first')
    if (expired) return setError("Time's up for this attempt")
    return doSubmit(response)
  }

  async function vote(entryId: string) {
    const r = await fetch(`/api/arena/${game.id}/vote`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId }),
    })
    if (r.ok) {
      setMyVotes(v => [...v, entryId])
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, votes: (e.votes || 0) + 1 } : e))
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#03060A] border border-portal-emerald/40 max-w-lg w-full p-6 shadow-[0_0_60px_rgba(0,255,163,0.15)] max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{game.icon}</span>
              <h2 className="font-cinzel font-black text-white text-sm tracking-wide">{game.title}</h2>
            </div>
            <p className="font-cormorant text-slate-500 text-xs mt-1">{game.description}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg">✕</button>
        </div>

        {startError && (
          <div className="flex items-center justify-between gap-3 mb-4 px-3 py-2 rounded-lg border border-red-500/30 bg-red-900/10">
            <p className="font-cormorant text-red-300 text-xs">{startError}</p>
            <button onClick={startTimer} disabled={starting}
              className="font-cinzel text-[9px] rounded-full px-2.5 py-1 border border-red-500/40 text-red-300 hover:bg-red-900/20 flex-shrink-0">
              {starting ? '...' : 'RETRY'}
            </button>
          </div>
        )}

        {timeLimitSeconds > 0 && secondsLeft !== null && !result && (
          <div className={`flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border w-fit ${
            expired
              ? 'border-red-500/40 bg-red-900/20 text-red-300'
              : secondsLeft <= 10
                ? 'border-amber-500/40 bg-amber-900/20 text-amber-300'
                : 'border-portal-emerald/30 bg-portal-emerald/[0.06] text-portal-emerald'
          }`}>
            <span className="text-xs">⏱</span>
            <span className="font-cinzel text-[11px] tracking-widest">
              {expired ? "TIME'S UP" : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
            </span>
          </div>
        )}

        {config.rules?.length > 0 && (
          <ul className="font-cormorant text-slate-400 text-xs mb-4 list-disc list-inside space-y-0.5">
            {config.rules.map((r: string, i: number) => <li key={i}>{r}</li>)}
          </ul>
        )}

        {result ? (
          <div className="border border-green-500/30 bg-green-900/10 p-4 mb-4">
            <p className="font-cinzel text-green-400 text-xs mb-1">
              {result.entry?.aiFlagged ? '⚠ FLAGGED FOR REVIEW' : result.alreadySubmitted ? 'YOU ALREADY PLAYED THIS' : 'ENTRY RECORDED'}
            </p>
            {typeof result.entry?.aiScore === 'number' && (
              <p className="font-cormorant text-slate-300 text-sm">AI Score: {result.entry.aiScore}/100</p>
            )}
            {result.entry?.aiFeedback && (
              <p className="font-cormorant text-slate-500 text-xs mt-1">{result.entry.aiFeedback}</p>
            )}
            {typeof result.xpAwarded === 'number' && result.xpAwarded > 0 && (
              <p className="font-cinzel text-portal-emerald text-xs mt-2">+{result.xpAwarded} XP awarded</p>
            )}
          </div>
        ) : isQuiz ? (
          <>
            <p className="font-cormorant text-slate-200 text-sm mb-3">{config.quiz.question}</p>
            <div className="flex flex-col gap-2 mb-3">
              {config.quiz.options.map((opt: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedOption(i)}
                  disabled={expired}
                  className={`text-left font-cormorant text-sm rounded-lg border px-3 py-2.5 transition-all disabled:opacity-40 ${
                    selectedOption === i
                      ? 'border-portal-emerald/60 bg-portal-emerald/10 text-white'
                      : 'border-portal-emerald/20 bg-black/40 text-slate-300 hover:border-portal-emerald/40'
                  }`}
                >
                  <span className="font-cinzel text-[10px] text-portal-emerald mr-2">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              ))}
            </div>
            {error && <p className="font-cormorant text-red-400 text-xs mb-2">{error}</p>}
            <GlowButton variant="primary" size="md" loading={submitting} disabled={expired} onClick={submit} className="w-full">
              {expired ? "Time's Up" : 'Lock In Answer'}
            </GlowButton>
          </>
        ) : isTapSpeed ? (
          <div className="flex flex-col items-center gap-4 py-2">
            {!started ? (
              <p className="font-cormorant text-slate-400 text-sm">
                {starting ? 'Starting…' : startError ? 'Retry above to begin.' : 'Preparing…'}
              </p>
            ) : (
              <>
                <div className="font-cinzel text-[11px] text-portal-emerald tracking-widest">
                  {tapDone ? 'TIME! SUBMITTING…' : `${tapWindowLeft ?? tapWindowSeconds}s LEFT`}
                </div>
                <button
                  onClick={() => !tapDone && setTaps(t => t + 1)}
                  disabled={tapDone}
                  className="w-40 h-40 rounded-full border-4 border-portal-emerald/50 bg-portal-emerald/10 hover:bg-portal-emerald/20 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 select-none"
                >
                  <span className="font-cinzel font-black text-4xl text-portal-emerald">{taps}</span>
                </button>
                <p className="font-cormorant text-slate-500 text-xs">Tap as fast as you can before time runs out!</p>
              </>
            )}
            {error && <p className="font-cormorant text-red-400 text-xs">{error}</p>}
          </div>
        ) : (
          <>
            <textarea
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder="Type your answer / submission..."
              rows={4}
              className="w-full bg-black/40 backdrop-blur-sm rounded-lg border border-portal-emerald/20 text-slate-200 text-sm font-cormorant px-3 py-2.5 focus:outline-none focus:border-portal-emerald/50 mb-3"
            />
            {error && <p className="font-cormorant text-red-400 text-xs mb-2">{error}</p>}
            <GlowButton variant="primary" size="md" loading={submitting} disabled={expired} onClick={submit} className="w-full">
              {expired ? "Time's Up" : 'Submit Entry'}
            </GlowButton>
          </>
        )}

        {isVoteBattle && entries.length > 0 && (
          <div className="mt-5 pt-4 border-t border-portal-emerald/15">
            <p className="font-cinzel text-[10px] text-portal-emerald tracking-widest uppercase mb-2">Vote for the best entry</p>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {entries.map(e => (
                <div key={e.id} className="border border-portal-emerald/10 p-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-cormorant text-slate-300 text-xs truncate">{e.response}</p>
                    <p className="font-cinzel text-[9px] text-slate-600">{e.user?.nickname || e.user?.name} · {e.votes || 0} votes</p>
                  </div>
                  <button
                    onClick={() => vote(e.id)}
                    disabled={myVotes.includes(e.id)}
                    className="font-cinzel text-[9px] text-portal-emerald border border-portal-emerald/40 px-2 py-1 disabled:opacity-30 hover:bg-portal-emerald/[0.030]"
                  >
                    {myVotes.includes(e.id) ? 'VOTED' : 'VOTE'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ArenaPage() {
  const [games, setGames] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<any>(null)

  function load() {
    fetch('/api/arena')
      .then(r => r.json())
      .then(data => { setGames(data.challenges || []); setLeaderboard(data.leaderboard || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(load, [])

  const daily = games.find(g => g.isDaily)
  const others = games.filter(g => !g.isDaily)

  return (
    <>
      <Head><title>Arena Protocol — QuestHub Guild</title></Head>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          {/* Tournament-bracket header — angled purple panel with converging corner
              lines, echoing the arena_games_ui reference's "high-stakes bracket" feel
              instead of a plain title bar. */}
          <div className="relative overflow-hidden border border-portal-emerald/30 bg-gradient-to-r from-portal-black/50 via-[#03060A] to-[#03060A] px-5 py-5">
            {/* converging bracket lines, pure CSS */}
            <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" preserveAspectRatio="none">
              <line x1="0%" y1="0%" x2="14%" y2="50%" stroke="rgba(0,255,163,0.5)" strokeWidth="1" />
              <line x1="0%" y1="100%" x2="14%" y2="50%" stroke="rgba(0,255,163,0.5)" strokeWidth="1" />
              <line x1="100%" y1="0%" x2="86%" y2="50%" stroke="rgba(245,158,11,0.4)" strokeWidth="1" />
              <line x1="100%" y1="100%" x2="86%" y2="50%" stroke="rgba(245,158,11,0.4)" strokeWidth="1" />
            </svg>

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="font-cinzel text-[10px] text-portal-emerald/70 tracking-[0.4em] uppercase">Compete · Earn · Prove Worth</div>
                <h1 className="font-cinzel font-black text-2xl text-white tracking-widest uppercase glow-text">Arena Protocol</h1>
                <p className="font-cormorant text-slate-500 text-sm mt-1">Structured mini-game engine — rapid challenges, ranked entries, real XP</p>
              </div>
              <div className="flex items-center gap-2 border border-portal-emerald/30 bg-black/30 px-3 py-1.5">
                <div className="w-2 h-2 bg-portal-emerald rounded-full animate-pulse" />
                <span className="font-cinzel text-[10px] text-portal-emerald tracking-widest">GRID ONLINE</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            <div className="flex flex-col gap-6">
              {loading ? (
                <div className="flex items-center justify-center min-h-[30vh]">
                  <div className="w-10 h-10 border-2 border-portal-emerald/30 border-t-portal-emerald rounded-full animate-spin" />
                </div>
              ) : games.length === 0 ? (
                <div className="bg-[#03060A] border border-portal-emerald/20 p-12 text-center">
                  <div className="text-5xl mb-4 opacity-20">◆</div>
                  <p className="font-cinzel text-sm text-slate-600 tracking-widest">No Active Games</p>
                  <p className="font-cormorant text-slate-700 text-sm mt-1">The Founder will deploy new games soon.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {daily && <GameCard key={daily.id} game={daily} onOpen={() => setActive(daily)} />}
                  {others.map(g => <GameCard key={g.id} game={g} onOpen={() => setActive(g)} />)}
                </div>
              )}
            </div>

            <div className="bg-[#03060A] border border-portal-emerald/20 p-4 h-fit sticky top-20">
              <h3 className="font-cinzel text-[10px] text-portal-emerald tracking-widest uppercase mb-3 pb-2 border-b border-portal-emerald/15">
                Arena Leaderboard
              </h3>
              <div className="flex flex-col gap-1.5">
                {leaderboard.length === 0 ? (
                  <p className="font-cormorant text-slate-700 text-xs text-center py-4">No entries yet.</p>
                ) : leaderboard.map((u: any, i: number) => (
                  <div key={u.id} className="flex items-center gap-2 py-1">
                    <span className={`font-cinzel text-xs w-4 ${i === 0 ? 'text-amber-400' : i < 3 ? 'text-portal-emerald' : 'text-slate-600'}`}>{i + 1}</span>
                    <span className="font-cormorant text-slate-300 text-sm truncate flex-1">{u.nickname || u.name}</span>
                    <span className="font-cinzel text-[10px] text-portal-emerald">{u.xp?.toLocaleString?.() ?? u.xp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {active && (
          <GamePlayModal game={active} onClose={() => setActive(null)} onSubmitted={() => { load() }} />
        )}
      </DashboardLayout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const redirect = await requireAuth(context, 'ACCEPTED_MEMBER')
  if (redirect) return redirect
  return { props: {} }
}