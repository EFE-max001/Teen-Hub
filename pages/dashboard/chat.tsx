import { useEffect, useState, useRef } from 'react'
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

export default function ChatPage() {
  const { data: session } = useSession()
  const [channel, setChannel] = useState('general')
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)

  const userRank = session?.user?.rank || 'F'

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
    if (!text.trim()) return
    const res = await fetch(`/api/chat/${channel}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessages(prev => [...prev, data.message])
      setText('')
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
                      onClick={() => accessible && setChannel(ch.id)}
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
            </div>

            {/* Chat */}
            <div className="flex-1 flex flex-col">
              <div className="px-5 py-3 border-b border-purple-500/15 flex items-center gap-3">
                <span className="font-orbitron text-xs text-white tracking-wide">
                  #{CHANNELS.find(c => c.id === channel)?.label || channel}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-rajdhani text-[10px] text-slate-600">AI-monitored</span>
                </div>
              </div>

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
                  messages.map((msg: any) => (
                    <div key={msg.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <RankBadge rank={msg.user?.rank || 'F'} size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-orbitron text-[11px] text-purple-300">
                            {msg.user?.nickname || msg.user?.name || 'Unknown'}
                          </span>
                          <span className="font-rajdhani text-[10px] text-slate-600">
                            {new Date(msg.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="font-rajdhani text-slate-300 text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={endRef} />
              </div>

              <div className="px-4 py-3 border-t border-purple-500/15 flex items-center gap-3">
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder={`Message #${CHANNELS.find(c => c.id === channel)?.label || channel}…`}
                  className="flex-1 bg-black/40 border border-purple-500/20 text-slate-200 text-sm font-rajdhani px-4 py-2.5 focus:outline-none focus:border-purple-400/50 transition-colors"
                />
                <button
                  onClick={send}
                  className="bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:bg-purple-600/50 transition-colors px-4 py-2.5 font-orbitron text-xs tracking-widest"
                >
                  SEND
                </button>
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
