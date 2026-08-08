// Teen-Hub/pages/dashboard/chat.tsx
import { useEffect, useState, useRef, useMemo } from 'react'
import Head from 'next/head'
import { useSession } from 'next-auth/react'
import { GetServerSideProps } from 'next'
import { requireAuth } from '@/lib/middleware'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import RankBadge from '@/components/ui/RankBadge'

const CHANNELS = [
  { id: 'general',      label: 'General',       icon: '⬢', minRank: null    },
  { id: 'quest-talk',   label: 'Quest Talk',     icon: '◆', minRank: null    },
  { id: 'elite',        label: 'Elite Channel',  icon: '★', minRank: 'A'     },
  { id: 'announcements',label: 'Announcements',  icon: '◈', minRank: null    },
]

const RANK_LEVEL: Record<string, number> = { F:0,E:1,D:2,C:3,B:4,A:5,S:6,SS:7,SSS:8 }
const VALID_GHOST_RANKS = ['F','E','D','C','B','A','S','SS']

// Mirrors lib/ghostProtocol.ts's GHOST_COMMANDS — kept client-side (that file
// pulls in prisma, so it can't be imported directly into a page component).
const PARTY_COMMANDS = [
  { cmd: '/party truth-or-dare',    desc: 'Start Truth or Dare' },
  { cmd: '/party would-you-rather', desc: 'Start Would You Rather' },
  { cmd: '/party two-truths ',      desc: 'fact 1 | fact 2 | fact 3 — start Two Truths and a Lie' },
  { cmd: '/truth',                  desc: 'New Truth or Dare round' },
  { cmd: '/dare',                   desc: 'New Truth or Dare round' },
  { cmd: '/wyr',                    desc: 'New Would You Rather dilemma' },
  { cmd: '/guess ',                 desc: '1, 2, or 3 — guess the lie' },
  { cmd: '/endgame',                desc: 'End the active party game' },
  { cmd: '/help-party',             desc: 'Show this list in chat' },
]

export default function ChatPage() {
  const { data: session } = useSession()
  const [channel, setChannel] = useState('general')
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const userRank = session?.user?.rank || 'F'
  const isFounder = session?.user?.role === 'FOUNDER'

  // ── Ghost Mode (Founder only) ──
  // Lets the Founder post under a disguised identity. The server already
  // resolves this correctly per-message (pages/api/chat/[channel].ts checks
  // FounderGhostIdentity.isActive) — what was missing was any UI that ever
  // called /api/founder/ghost, so isActive stayed false forever and every
  // post showed the Founder's real name no matter what.
  const [ghost, setGhost] = useState<any>(null)
  const [ghostLoading, setGhostLoading] = useState(false)
  const [ghostPanelOpen, setGhostPanelOpen] = useState(false)
  const [ghostNameInput, setGhostNameInput] = useState('')
  const [ghostRankInput, setGhostRankInput] = useState('B')
  const [ghostError, setGhostError] = useState('')

  useEffect(() => {
    if (!isFounder) return
    fetch('/api/founder/ghost')
      .then(r => r.json())
      .then(data => {
        setGhost(data.ghost || null)
        if (data.ghost) {
          setGhostNameInput(data.ghost.ghostName)
          setGhostRankInput(data.ghost.ghostRank)
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFounder])

  async function saveGhostIdentity() {
    setGhostError('')
    setGhostLoading(true)
    try {
      const res = await fetch('/api/founder/ghost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ghostName: ghostNameInput, ghostRank: ghostRankInput }),
      })
      const data = await res.json()
      if (!res.ok) { setGhostError(data.error || 'Could not save ghost identity.'); return }
      setGhost(data.ghost)
      setGhostPanelOpen(false)
    } finally {
      setGhostLoading(false)
    }
  }

  async function toggleGhostActive() {
    setGhostLoading(true)
    try {
      const res = await fetch('/api/founder/ghost', { method: 'PATCH' })
      const data = await res.json()
      if (res.ok) setGhost(data.ghost)
    } finally {
      setGhostLoading(false)
    }
  }

  // ── Slash-command palette ──
  const showPalette = text.startsWith('/') && text.length >= 1
  const paletteMatches = useMemo(() => {
    if (!showPalette) return []
    const typed = text.toLowerCase()
    return PARTY_COMMANDS.filter(c => c.cmd.toLowerCase().startsWith(typed) || typed === '/')
  }, [showPalette, text])

  function pickCommand(cmd: string) {
    setText(cmd)
    inputRef.current?.focus()
  }

  function canAccessChannel(minRank: string | null) {
    if (!minRank) return true
    return RANK_LEVEL[userRank] >= RANK_LEVEL[minRank]
  }

  useEffect(() => {
    setLoading(true)
    fetch(`/api/chat/${channel}`)
      .then(r => r.json())
      .then(data => { setMessages(data.messages || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [channel])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const trimmed = text.trim()
    if (!trimmed) return
    setError('')

    const res = await fetch(`/api/chat/${channel}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: trimmed }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessages(prev => [...prev, data.message])
      setText('')
    } else {
      setError(data.error || 'Message failed to send')
    }
  }

  return (
    <>
      <Head><title>Guild Chat — QuestHub Guild</title></Head>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto">
          <h1 className="font-orbitron font-black text-lg text-white tracking-widest uppercase mb-5">Guild Chat</h1>

          <div className="flex border border-purple-500/20 bg-[#0d0017] overflow-hidden" style={{ height: '72vh' }}>
            {/* Channel List */}
            <div className="w-52 border-r border-purple-500/15 flex flex-col flex-shrink-0">
              <div className="px-4 py-3 border-b border-purple-500/15">
                <span className="font-orbitron text-[10px] text-slate-600 tracking-widest uppercase">Channels</span>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {CHANNELS.map(ch => {
                  const accessible = canAccessChannel(ch.minRank)
                  const active = channel === ch.id
                  return (
                    <button
                      key={ch.id}
                      onClick={() => accessible && (setChannel(ch.id), setText(''))}
                      disabled={!accessible}
                      className={`w-full px-4 py-2.5 text-left flex items-center gap-2 transition-colors ${
                        !accessible
                          ? 'cursor-not-allowed opacity-30'
                          : active
                            ? 'bg-purple-900/30 text-purple-300'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-purple-900/10'
                      }`}
                    >
                      <span className="text-sm">{ch.icon}</span>
                      <span className="font-rajdhani text-sm font-semibold">{ch.label}</span>
                      {!accessible && <span className="ml-auto text-[10px]">🔒</span>}
                      {ch.minRank && accessible && (
                        <span className="ml-auto font-orbitron text-[8px] text-purple-500/60">{ch.minRank}+</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Ghost Mode status — Founder only */}
              {isFounder && (
                <div className="border-t border-purple-500/15 p-3">
                  <button
                    onClick={() => setGhostPanelOpen(v => !v)}
                    className="w-full flex items-center gap-1.5 font-orbitron text-[9px] text-purple-300 tracking-widest"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${ghost?.isActive ? 'bg-purple-400 animate-pulse' : 'bg-slate-700'}`} />
                    👻 GHOST MODE: {ghost?.isActive ? 'ON' : 'OFF'}
                  </button>
                  {ghost?.isActive && (
                    <p className="font-rajdhani text-[10px] text-slate-500 mt-1 truncate">as {ghost.ghostName} ({ghost.ghostRank})</p>
                  )}
                </div>
              )}
            </div>

            {/* Chat */}
            <div className="flex-1 flex flex-col">
              <div className="px-5 py-3 border-b border-purple-500/15 flex items-center gap-3">
                <span className="font-orbitron text-xs text-white tracking-wide">
                  #{CHANNELS.find(c => c.id === channel)?.label || channel}
                </span>
                <div className="ml-auto flex items-center gap-3">
                  <button
                    onClick={() => setShowHelp(v => !v)}
                    className="relative flex items-center gap-1.5 font-orbitron text-[9px] text-purple-300 border border-purple-500/40 bg-purple-900/10 px-2.5 py-1.5 hover:bg-purple-900/25 tracking-widest transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    👻 PARTY GAMES
                  </button>
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-rajdhani text-[10px] text-slate-600">AI-monitored</span>
                </div>
              </div>

              {/* Founder Ghost Mode setup panel */}
              {isFounder && ghostPanelOpen && (
                <div className="px-5 py-3 border-b border-purple-500/15 bg-purple-900/10 flex flex-col gap-2">
                  <p className="font-orbitron text-[10px] text-purple-300 tracking-widest uppercase">
                    {ghost ? 'Ghost Identity' : 'Set Up Ghost Identity'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={ghostNameInput}
                      onChange={e => setGhostNameInput(e.target.value)}
                      placeholder="Ghost display name"
                      className="bg-black/40 border border-purple-500/20 text-slate-200 text-sm font-rajdhani px-3 py-1.5 focus:outline-none focus:border-purple-400/50 transition-colors"
                    />
                    <select
                      value={ghostRankInput}
                      onChange={e => setGhostRankInput(e.target.value)}
                      className="bg-black/40 border border-purple-500/20 text-slate-200 text-sm font-rajdhani px-2 py-1.5 focus:outline-none focus:border-purple-400/50"
                    >
                      {VALID_GHOST_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button
                      onClick={saveGhostIdentity}
                      disabled={ghostLoading || ghostNameInput.trim().length < 3}
                      className="bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:bg-purple-600/50 transition-colors px-3 py-1.5 font-orbitron text-[10px] tracking-widest disabled:opacity-40"
                    >
                      {ghost ? 'UPDATE' : 'CREATE'}
                    </button>
                    {ghost && (
                      <button
                        onClick={toggleGhostActive}
                        disabled={ghostLoading}
                        className={`px-3 py-1.5 font-orbitron text-[10px] tracking-widest border transition-colors ${
                          ghost.isActive
                            ? 'border-red-500/40 text-red-400 hover:bg-red-900/20'
                            : 'border-green-500/40 text-green-400 hover:bg-green-900/20'
                        }`}
                      >
                        {ghost.isActive ? 'TURN OFF' : 'TURN ON'}
                      </button>
                    )}
                  </div>
                  {ghostError && <p className="font-rajdhani text-xs text-red-400">{ghostError}</p>}
                  <p className="font-rajdhani text-[10px] text-slate-600">
                    While ON, every message and party-game post you send appears under this name and rank instead of your real one.
                  </p>
                </div>
              )}

              {showHelp && (
                <div className="px-5 py-3 border-b border-purple-500/15 bg-purple-900/10 font-rajdhani text-xs text-slate-400 space-y-1">
                  <p className="font-orbitron text-[10px] text-purple-300 tracking-widest uppercase mb-1">Party Game Commands</p>
                  {PARTY_COMMANDS.map(c => (
                    <p key={c.cmd}>
                      <code className="text-purple-300">{c.cmd.trim()}</code> — {c.desc}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-6 h-6 border border-purple-500/40 border-t-purple-400 rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="font-rajdhani text-slate-700 text-sm">No messages yet. Be the first.</p>
                  </div>
                ) : (
                  messages.map((msg: any) => {
                    const isGamePost = msg.content?.startsWith('👻')
                    if (isGamePost) {
                      const body = msg.content.replace(/^👻\s*/, '')
                      const game =
                        /truth or dare/i.test(body) ? { label: 'TRUTH OR DARE', icon: '🎲', color: 'amber' } :
                        /would you rather/i.test(body) ? { label: 'WOULD YOU RATHER', icon: '⚖️', color: 'purple' } :
                        /two truths/i.test(body) ? { label: 'TWO TRUTHS AND A LIE', icon: '🕵️', color: 'green' } :
                        { label: 'GHOST PROTOCOL', icon: '👻', color: 'purple' }
                      const styles: Record<string, string> = {
                        amber: 'border-amber-500/35 bg-amber-900/10',
                        purple: 'border-purple-500/35 bg-purple-900/10',
                        green: 'border-emerald-500/35 bg-emerald-900/10',
                      }
                      const labelColor: Record<string, string> = {
                        amber: 'text-amber-300',
                        purple: 'text-purple-300',
                        green: 'text-emerald-300',
                      }
                      return (
                        <div key={msg.id} className={`relative border px-4 py-3 ${styles[game.color]}`}>
                          <span className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${styles[game.color].split(' ')[0]}`} />
                          <span className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${styles[game.color].split(' ')[0]}`} />
                          <div className={`flex items-center gap-1.5 mb-1.5 font-orbitron text-[9px] tracking-widest ${labelColor[game.color]}`}>
                            <span>{game.icon}</span>
                            <span>{game.label}</span>
                          </div>
                          <p className="font-rajdhani text-purple-100 text-sm leading-relaxed whitespace-pre-line">{body}</p>
                        </div>
                      )
                    }
                    return (
                      <div key={msg.id} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <RankBadge rank={(msg.isGhost && msg.ghostRank) ? msg.ghostRank : (msg.user?.rank || 'F')} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-orbitron text-[11px] text-purple-300">
                              {msg.isGhost && msg.ghostDisplayName
                                ? msg.ghostDisplayName
                                : (msg.user?.nickname || msg.user?.name || 'Unknown')}
                            </span>
                            {msg.isGhost && (
                              <span className="font-orbitron text-[8px] text-purple-500/60" title="Posted in Ghost Mode">👻</span>
                            )}
                            <span className="font-rajdhani text-[10px] text-slate-600">
                              {new Date(msg.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="font-rajdhani text-slate-300 text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={endRef} />
              </div>

              {error && (
                <div className="px-5 py-1.5 border-t border-red-500/20 bg-red-900/10">
                  <p className="font-rajdhani text-red-400 text-xs">{error}</p>
                </div>
              )}

              <div className="relative px-4 pt-3 pb-2 border-t border-purple-500/15">
                {/* Slash-command palette — appears as soon as "/" is typed so
                    commands never need to be memorized or typed exactly. */}
                {showPalette && paletteMatches.length > 0 && (
                  <div className="absolute left-4 right-4 bottom-full mb-1 bg-[#0d0017] border border-purple-500/30 max-h-48 overflow-y-auto shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
                    {paletteMatches.map(c => (
                      <button
                        key={c.cmd}
                        onClick={() => pickCommand(c.cmd)}
                        className="w-full text-left px-3 py-2 hover:bg-purple-900/20 transition-colors flex items-center gap-2 border-b border-purple-500/10 last:border-b-0"
                      >
                        <code className="font-mono text-xs text-purple-300 flex-shrink-0">{c.cmd.trim()}</code>
                        <span className="font-rajdhani text-[11px] text-slate-500 truncate">{c.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showPalette && paletteMatches.length === 0 && (
                  <div className="absolute left-4 right-4 bottom-full mb-1 bg-[#0d0017] border border-purple-500/30 px-3 py-2">
                    <span className="font-rajdhani text-[11px] text-slate-600">No matching command — this will send as a regular message.</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input
                    ref={inputRef}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder={`Message #${CHANNELS.find(c => c.id === channel)?.label || channel}…`}
                    autoComplete="off"
                    spellCheck={false}
                    className="flex-1 bg-black/40 border border-purple-500/20 text-slate-200 text-sm font-rajdhani px-4 py-2.5 focus:outline-none focus:border-purple-400/50 transition-colors"
                  />
                  <button
                    onClick={send}
                    className="bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:bg-purple-600/50 transition-colors px-4 py-2.5 font-orbitron text-xs tracking-widest"
                  >
                    SEND
                  </button>
                </div>
                <p className="font-rajdhani text-[10px] text-slate-700 mt-1.5 pl-1">
                  Type <span className="text-purple-500/70 font-mono">/</span> to see party game commands
                </p>
              </div>
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
  return { props: {} }
}