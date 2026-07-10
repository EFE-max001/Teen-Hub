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
  return (
    <button
      onClick={onOpen}
      className={`relative text-left border p-4 flex flex-col gap-2 transition-all duration-300 group ${
        game.isDaily
          ? 'border-amber-500/60 bg-gradient-to-b from-amber-900/20 to-[#0d0017] shadow-[0_0_25px_rgba(245,158,11,0.15)]'
          : 'border-purple-500/25 bg-[#0d0017] hover:border-purple-400/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.12)]'
      }`}
    >
      {game.isDaily && (
        <span className="absolute -top-2 left-3 font-orbitron text-[8px] text-amber-300 bg-amber-900/80 border border-amber-500/60 px-2 py-0.5 tracking-widest animate-pulse">
          🔥 DAILY CHALLENGE
        </span>
      )}
      <div className="flex items-center justify-between mt-1">
        <span className="text-2xl">{game.icon || '◆'}</span>
        {game.isDaily && countdown && (
          <span className="font-orbitron text-[10px] text-amber-400">{countdown}</span>
        )}
      </div>
      <h3 className="font-orbitron font-bold text-sm text-white leading-snug group-hover:text-purple-200">{game.title}</h3>
      <p className="font-rajdhani text-slate-500 text-xs line-clamp-2">{game.description}</p>
      <div className="flex items-center gap-3 mt-1 pt-2 border-t border-purple-500/10 text-[10px]">
        <span className="font-orbitron text-purple-400/70 uppercase">{game.category}</span>
        <span className="font-orbitron text-green-400">+{game.xpReward}XP</span>
        <span className="ml-auto font-orbitron text-slate-600">{game._count?.entries ?? 0} plays</span>
      </div>
      {myEntry && (
        <div className="font-orbitron text-[9px] text-purple-400">
          Your score: {myEntry.aiScore ?? '—'}
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
  const config = game.config || {}
  const isVoteBattle = config.mechanics?.type === 'creative' || config.mechanics?.type === 'social_task'

  useEffect(() => {
    if (isVoteBattle) {
      fetch(`/api/arena/${game.id}/entries`).then(r => r.json()).then(d => {
        setEntries(d.entries || [])
        setMyVotes(d.myVotedEntryIds || [])
      }).catch(() => {})
    }
  }, [game.id])

  async function submit() {
    if (!response.trim()) return setError('Enter a response first')
    setSubmitting(true)
    setError('')
    const r = await fetch(`/api/arena/${game.id}/submit`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response }),
    })
    const d = await r.json()
    setSubmitting(false)
    if (!r.ok) return setError(d.error || 'Submission failed')
    setResult(d)
    onSubmitted()
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
        className="bg-[#0d0017] border border-purple-500/40 max-w-lg w-full p-6 shadow-[0_0_60px_rgba(168,85,247,0.15)] max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{game.icon}</span>
              <h2 className="font-orbitron font-black text-white text-sm tracking-wide">{game.title}</h2>
            </div>
            <p className="font-rajdhani text-slate-500 text-xs mt-1">{game.description}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg">✕</button>
        </div>

        {config.rules?.length > 0 && (
          <ul className="font-rajdhani text-slate-400 text-xs mb-4 list-disc list-inside space-y-0.5">
            {config.rules.map((r: string, i: number) => <li key={i}>{r}</li>)}
          </ul>
        )}

        {result ? (
          <div className="border border-green-500/30 bg-green-900/10 p-4 mb-4">
            <p className="font-orbitron text-green-400 text-xs mb-1">
              {result.entry?.aiFlagged ? '⚠ FLAGGED FOR REVIEW' : 'ENTRY RECORDED'}
            </p>
            {typeof result.entry?.aiScore === 'number' && (
              <p className="font-rajdhani text-slate-300 text-sm">AI Score: {result.entry.aiScore}/100</p>
            )}
            {result.entry?.aiFeedback && (
              <p className="font-rajdhani text-slate-500 text-xs mt-1">{result.entry.aiFeedback}</p>
            )}
            {typeof result.xpAwarded === 'number' && result.xpAwarded > 0 && (
              <p className="font-orbitron text-purple-400 text-xs mt-2">+{result.xpAwarded} XP awarded</p>
            )}
          </div>
        ) : (
          <>
            <textarea
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder="Type your answer / submission..."
              rows={4}
              className="w-full bg-black/40 border border-purple-500/20 text-slate-200 text-sm font-rajdhani px-3 py-2.5 focus:outline-none focus:border-purple-400/50 mb-3"
            />
            {error && <p className="font-rajdhani text-red-400 text-xs mb-2">{error}</p>}
            <GlowButton variant="primary" size="md" loading={submitting} onClick={submit} className="w-full">
              Submit Entry
            </GlowButton>
          </>
        )}

        {isVoteBattle && entries.length > 0 && (
          <div className="mt-5 pt-4 border-t border-purple-500/15">
            <p className="font-orbitron text-[10px] text-purple-400 tracking-widest uppercase mb-2">Vote for the best entry</p>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {entries.map(e => (
                <div key={e.id} className="border border-purple-500/10 p-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-rajdhani text-slate-300 text-xs truncate">{e.response}</p>
                    <p className="font-orbitron text-[9px] text-slate-600">{e.user?.nickname || e.user?.name} · {e.votes || 0} votes</p>
                  </div>
                  <button
                    onClick={() => vote(e.id)}
                    disabled={myVotes.includes(e.id)}
                    className="font-orbitron text-[9px] text-purple-300 border border-purple-500/40 px-2 py-1 disabled:opacity-30 hover:bg-purple-900/30"
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-orbitron font-black text-xl text-white tracking-widest uppercase">Arena Protocol</h1>
              <p className="font-rajdhani text-slate-500 text-sm mt-1">Structured mini-game engine — compete, earn XP, prove worth</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span className="font-orbitron text-[10px] text-purple-400 tracking-widest">GRID ONLINE</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            <div className="flex flex-col gap-6">
              {loading ? (
                <div className="flex items-center justify-center min-h-[30vh]">
                  <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
                </div>
              ) : games.length === 0 ? (
                <div className="bg-[#0d0017] border border-purple-500/20 p-12 text-center">
                  <div className="text-5xl mb-4 opacity-20">◆</div>
                  <p className="font-orbitron text-sm text-slate-600 tracking-widest">No Active Games</p>
                  <p className="font-rajdhani text-slate-700 text-sm mt-1">The Founder will deploy new games soon.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {daily && <GameCard key={daily.id} game={daily} onOpen={() => setActive(daily)} />}
                  {others.map(g => <GameCard key={g.id} game={g} onOpen={() => setActive(g)} />)}
                </div>
              )}
            </div>

            <div className="bg-[#0d0017] border border-purple-500/20 p-4 h-fit sticky top-20">
              <h3 className="font-orbitron text-[10px] text-purple-400 tracking-widest uppercase mb-3 pb-2 border-b border-purple-500/15">
                Arena Leaderboard
              </h3>
              <div className="flex flex-col gap-1.5">
                {leaderboard.length === 0 ? (
                  <p className="font-rajdhani text-slate-700 text-xs text-center py-4">No entries yet.</p>
                ) : leaderboard.map((u: any, i: number) => (
                  <div key={u.id} className="flex items-center gap-2 py-1">
                    <span className={`font-orbitron text-xs w-4 ${i === 0 ? 'text-amber-400' : i < 3 ? 'text-purple-300' : 'text-slate-600'}`}>{i + 1}</span>
                    <span className="font-rajdhani text-slate-300 text-sm truncate flex-1">{u.nickname || u.name}</span>
                    <span className="font-orbitron text-[10px] text-purple-400">{u.xp?.toLocaleString?.() ?? u.xp}</span>
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
