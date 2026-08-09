// Teen-Hub/pages/dashboard/messages.tsx
import { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'
import { requireAuth } from '@/lib/middleware'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

const RANK_LEVEL: Record<string, number> = { F:0,E:1,D:2,C:3,B:4,A:5,S:6,SS:7,SSS:8 }

type Tab = 'friends' | 'requests' | 'new'

export default function MessagesPage({ locked, lockReason }: { locked: boolean; lockReason?: string }) {
  const { data: session } = useSession()
  const router = useRouter()

  // Friends & requests
  const [friends, setFriends] = useState<any[]>([])
  const [incoming, setIncoming] = useState<any[]>([])
  const [outgoing, setOutgoing] = useState<any[]>([])
  const [blockedIds, setBlockedIds] = useState<string[]>([])

  // Conversation
  const [activeConv, setActiveConv] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [tab, setTab] = useState<Tab>('friends')
  const [loading, setLoading] = useState(true)
  const [sendError, setSendError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  // New friend search
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [requestStatus, setRequestStatus] = useState<Record<string, string>>({})

  // Block confirmation
  const [blockTarget, setBlockTarget] = useState<any>(null)

  async function loadFriends() {
    const res = await fetch('/api/friends')
    const data = await res.json()
    setFriends(data.friends || [])
    setIncoming(data.incoming || [])
    setOutgoing(data.outgoing || [])
    setBlockedIds(data.blockedIds || [])
    setLoading(false)
  }

  useEffect(() => {
    if (locked) return
    loadFriends()
  }, [locked])

  // Deep link ?tab=requests
  useEffect(() => {
    if (!router.isReady) return
    if (router.query.tab === 'requests') setTab('requests')
  }, [router.isReady, router.query.tab])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Debounced member search
  useEffect(() => {
    if (tab !== 'new') return
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/members/search?q=${encodeURIComponent(search)}`)
        const data = await res.json()
        setSearchResults(data.members || [])
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 250)
    return () => clearTimeout(t)
  }, [tab, search])

  async function openConv(friend: any) {
    setActiveConv(friend)
    setSendError('')
    const res = await fetch(`/api/messages/${friend.userId}`)
    const data = await res.json()
    setMessages(data.messages || [])
  }

  async function send() {
    if (!text.trim() || !activeConv) return
    setSendError('')
    const res = await fetch(`/api/messages/${activeConv.userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessages(prev => [...prev, data.message])
      setText('')
    } else {
      setSendError(data.error || 'Failed to send.')
    }
  }

  async function sendRequest(toId: string) {
    setRequestStatus(prev => ({ ...prev, [toId]: 'sending' }))
    const res = await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toId }),
    })
    const data = await res.json()
    if (res.ok) {
      setRequestStatus(prev => ({ ...prev, [toId]: 'sent' }))
    } else {
      setRequestStatus(prev => ({ ...prev, [toId]: data.error || 'error' }))
    }
  }

  async function respondRequest(requestId: string, action: 'accept' | 'decline') {
    await fetch(`/api/friends/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    await loadFriends()
    if (action === 'accept') setTab('friends')
  }

  async function unfriend(requestId: string) {
    await fetch(`/api/friends/${requestId}`, { method: 'DELETE' })
    if (activeConv) setActiveConv(null)
    await loadFriends()
  }

  async function blockUser(targetId: string) {
    await fetch('/api/friends/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockedId: targetId }),
    })
    setBlockTarget(null)
    if (activeConv?.userId === targetId) setActiveConv(null)
    await loadFriends()
  }

  async function unblock(targetId: string) {
    await fetch('/api/friends/block', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockedId: targetId }),
    })
    await loadFriends()
  }

  if (locked) {
    return (
      <>
        <Head><title>Messages — QuestHub Guild</title></Head>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="relative bg-portal-black border border-portal-emerald/20 p-10 max-w-md w-full text-center">
              <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-portal-emerald/40" />
              <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-portal-emerald/40" />
              <div className="text-4xl mb-4 text-slate-700">🔒</div>
              <h2 className="font-cinzel font-black text-lg text-white mb-3 tracking-widest">ACCESS LOCKED</h2>
              <p className="font-cormorant text-slate-400 leading-relaxed">{lockReason || 'Messages unlock at Rank D.'}</p>
              <div className="mt-6 bg-black/40 border border-portal-emerald/20 px-4 py-3">
                <p className="font-cinzel text-[10px] text-portal-emerald tracking-widest">REQUIREMENT: RANK D+</p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </>
    )
  }

  const isBlocked = (userId: string) => blockedIds.includes(userId)

  return (
    <>
      <Head><title>Messages — QuestHub Guild</title></Head>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto">
          <h1 className="font-cinzel font-black text-lg text-white tracking-widest uppercase mb-5">Messages</h1>

          <div className="flex border border-portal-emerald/20 bg-portal-black overflow-hidden" style={{ height: '76vh' }}>

            {/* ── Sidebar ── */}
            <div className="w-64 border-r border-portal-emerald/15 flex flex-col flex-shrink-0">

              {/* Tab bar */}
              <div className="flex border-b border-portal-emerald/15">
                {(['friends', 'requests', 'new'] as Tab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); if (t !== 'friends') setActiveConv(null) }}
                    className={`flex-1 py-2.5 font-cinzel text-[9px] tracking-widest uppercase transition-colors relative ${
                      tab === t ? 'text-portal-emerald' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {t === 'friends' && 'Messages'}
                    {t === 'requests' && (
                      <>
                        Requests
                        {incoming.length > 0 && (
                          <span className="absolute top-1.5 right-1 bg-red-500 text-white font-cinzel text-[8px] min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-0.5">
                            {incoming.length}
                          </span>
                        )}
                      </>
                    )}
                    {t === 'new' && '+ Add'}
                    {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-portal-emerald" />}
                  </button>
                ))}
              </div>

              {/* Tab: Friends (conversations) */}
              {tab === 'friends' && (
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="w-6 h-6 border border-portal-emerald/40 border-t-portal-emerald rounded-full animate-spin" />
                    </div>
                  ) : friends.length === 0 ? (
                    <div className="p-5 text-center space-y-2">
                      <p className="font-cormorant text-slate-600 text-sm">No connections yet.</p>
                      <p className="font-cormorant text-slate-700 text-xs">Use the <span className="text-portal-emerald">+ Add</span> tab to send a friend request.</p>
                    </div>
                  ) : (
                    friends.map(f => (
                      <button
                        key={f.userId}
                        onClick={() => openConv(f)}
                        className={`w-full px-4 py-3 text-left border-b border-portal-emerald/10 transition-colors hover:bg-portal-emerald/[0.05] ${
                          activeConv?.userId === f.userId ? 'bg-portal-emerald/[0.08]' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-cinzel text-xs text-white truncate">{f.name}</span>
                          <span className="font-cinzel text-[9px] text-portal-emerald/60 ml-1">{f.rank}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Tab: Requests */}
              {tab === 'requests' && (
                <div className="flex-1 overflow-y-auto">
                  {incoming.length > 0 && (
                    <div className="px-3 py-2 border-b border-portal-emerald/10">
                      <p className="font-cinzel text-[9px] text-portal-emerald tracking-widest uppercase mb-2">Incoming</p>
                      {incoming.map(r => (
                        <div key={r.requestId} className="mb-3 p-3 border border-portal-emerald/15 bg-portal-emerald/[0.03]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-cinzel text-[10px] text-white">{r.name}</span>
                            <span className="font-cinzel text-[9px] text-portal-emerald/60">{r.rank}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => respondRequest(r.requestId, 'accept')}
                              className="flex-1 font-cinzel text-[9px] text-emerald-400 border border-emerald-500/40 py-1.5 hover:bg-emerald-900/20 tracking-widest transition-colors"
                            >ACCEPT</button>
                            <button
                              onClick={() => respondRequest(r.requestId, 'decline')}
                              className="flex-1 font-cinzel text-[9px] text-slate-500 border border-slate-700 py-1.5 hover:bg-slate-800/40 tracking-widest transition-colors"
                            >DECLINE</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {outgoing.length > 0 && (
                    <div className="px-3 py-2">
                      <p className="font-cinzel text-[9px] text-slate-600 tracking-widest uppercase mb-2">Sent</p>
                      {outgoing.map(r => (
                        <div key={r.requestId} className="mb-2 flex items-center justify-between py-2 border-b border-portal-emerald/5">
                          <span className="font-cormorant text-slate-400 text-sm">{r.name}</span>
                          <span className="font-cinzel text-[9px] text-slate-600 tracking-widest">PENDING</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {incoming.length === 0 && outgoing.length === 0 && (
                    <div className="p-5 text-center">
                      <p className="font-cormorant text-slate-600 text-sm">No pending requests.</p>
                    </div>
                  )}

                  {/* Blocked users */}
                  {blockedIds.length > 0 && (
                    <div className="px-3 py-2 mt-2 border-t border-portal-emerald/10">
                      <p className="font-cinzel text-[9px] text-red-700 tracking-widest uppercase mb-2">Blocked</p>
                      {blockedIds.map(id => (
                        <div key={id} className="flex items-center justify-between py-1.5">
                          <span className="font-cormorant text-slate-600 text-xs">{id.slice(0, 8)}…</span>
                          <button onClick={() => unblock(id)} className="font-cinzel text-[9px] text-red-700 hover:text-red-400">UNBLOCK</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Add new friend */}
              {tab === 'new' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-2 border-b border-portal-emerald/15">
                    <input
                      autoFocus
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search members…"
                      className="w-full bg-black/40 border border-portal-emerald/20 text-slate-200 text-sm font-cormorant px-3 py-2 focus:outline-none focus:border-portal-emerald/50 transition-colors"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {searching ? (
                      <div className="flex items-center justify-center h-24">
                        <div className="w-5 h-5 border border-portal-emerald/40 border-t-portal-emerald rounded-full animate-spin" />
                      </div>
                    ) : searchResults.length === 0 ? (
                      <p className="font-cormorant text-slate-600 text-sm p-4 text-center">No members found.</p>
                    ) : (
                      searchResults.map((m: any) => {
                        const alreadyFriend = friends.some(f => f.userId === m.userId)
                        const alreadySent = outgoing.some(r => r.userId === m.userId)
                        const blocked = isBlocked(m.userId)
                        const status = requestStatus[m.userId]
                        return (
                          <div key={m.userId} className="px-4 py-3 border-b border-portal-emerald/10 flex items-center justify-between">
                            <div>
                              <span className="font-cinzel text-xs text-white">{m.name}</span>
                              <span className="font-cinzel text-[9px] text-portal-emerald/60 ml-2">{m.rank}</span>
                            </div>
                            {blocked ? (
                              <span className="font-cinzel text-[9px] text-red-700">BLOCKED</span>
                            ) : alreadyFriend ? (
                              <span className="font-cinzel text-[9px] text-portal-emerald tracking-widest">FRIEND</span>
                            ) : alreadySent || status === 'sent' ? (
                              <span className="font-cinzel text-[9px] text-slate-500 tracking-widest">SENT</span>
                            ) : (
                              <button
                                onClick={() => sendRequest(m.userId)}
                                disabled={status === 'sending'}
                                className="font-cinzel text-[9px] text-portal-emerald border border-portal-emerald/40 px-2 py-1 hover:bg-portal-emerald/10 transition-colors tracking-widest disabled:opacity-40"
                              >
                                {status === 'sending' ? '…' : 'ADD'}
                              </button>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Chat area ── */}
            <div className="flex-1 flex flex-col">
              {!activeConv ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                  <p className="font-cinzel text-slate-700 text-xs tracking-widest">SELECT A FRIEND TO MESSAGE</p>
                  <p className="font-cormorant text-slate-800 text-sm">Only connected members can exchange messages.</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="px-5 py-3 border-b border-portal-emerald/15 flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="font-cinzel text-xs text-white tracking-wide">{activeConv.name}</span>
                    <span className="font-cinzel text-[9px] text-portal-emerald/60 ml-1">{activeConv.rank}</span>
                    <div className="ml-auto flex items-center gap-3">
                      {/* Block button */}
                      <button
                        onClick={() => setBlockTarget(activeConv)}
                        className="font-cinzel text-[9px] text-red-800 hover:text-red-500 tracking-widest transition-colors"
                        title="Block user"
                      >
                        🚫
                      </button>
                      {/* Unfriend */}
                      <button
                        onClick={() => { const f = friends.find(f => f.userId === activeConv.userId); if (f) unfriend(f.requestId) }}
                        className="font-cinzel text-[9px] text-slate-600 hover:text-red-400 tracking-widest transition-colors"
                        title="Unfriend"
                      >
                        ✕ REMOVE
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                    {messages.length === 0 && (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="font-cormorant text-slate-700 text-sm">Say hello to start the conversation.</p>
                      </div>
                    )}
                    {messages.map((msg: any) => {
                      const mine = msg.fromId === session?.user?.id
                      // Show ghost display name if message was sent in ghost mode
                      const senderName = msg.isGhost && msg.ghostDisplayName
                        ? msg.ghostDisplayName
                        : (msg.from?.nickname || msg.from?.name || 'Unknown')
                      return (
                        <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs px-4 py-2.5 text-sm font-cormorant leading-relaxed ${
                            mine
                              ? 'bg-portal-emerald/[0.12] border border-portal-emerald/30 text-emerald-100'
                              : 'bg-slate-900/60 border border-slate-700/50 text-slate-300'
                          }`}>
                            {!mine && (
                              <div className="font-cinzel text-[9px] text-portal-emerald/70 mb-1">
                                {senderName}
                                {msg.isGhost && <span className="ml-1 text-slate-600">👻</span>}
                              </div>
                            )}
                            {msg.content}
                            <div className={`text-[10px] mt-1 ${mine ? 'text-portal-emerald/50' : 'text-slate-600'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={endRef} />
                  </div>

                  {sendError && (
                    <div className="px-5 py-1.5 border-t border-red-500/20 bg-red-900/10">
                      <p className="font-cormorant text-red-400 text-xs">{sendError}</p>
                    </div>
                  )}

                  <div className="px-4 py-3 border-t border-portal-emerald/15 flex items-center gap-3">
                    <input
                      value={text}
                      onChange={e => setText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && send()}
                      placeholder="Type a message…"
                      className="flex-1 bg-black/40 border border-portal-emerald/20 text-slate-200 text-sm font-cormorant px-4 py-2.5 focus:outline-none focus:border-portal-emerald/50 transition-colors"
                    />
                    <button
                      onClick={send}
                      className="bg-portal-emerald/[0.15] border border-portal-emerald/40 text-portal-emerald hover:bg-portal-emerald/30 transition-colors px-4 py-2.5 font-cinzel text-xs tracking-widest"
                    >
                      SEND
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="font-cormorant text-[11px] text-slate-700 mt-2">
            ⚠ All messages are AI-monitored. Contact information sharing is automatically blocked.
          </p>
        </div>

        {/* Block confirmation modal */}
        {blockTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="relative bg-portal-black border border-red-500/30 p-8 max-w-sm w-full mx-4">
              <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-500/40" />
              <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-red-500/40" />
              <h3 className="font-cinzel font-black text-white text-sm tracking-widest mb-2">BLOCK USER</h3>
              <p className="font-cormorant text-slate-400 text-sm mb-6">
                Block <span className="text-white">{blockTarget.name}</span>? They won't be able to message you and you will be removed from each other's friends.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => blockUser(blockTarget.userId)}
                  className="flex-1 font-cinzel text-[10px] text-red-400 border border-red-500/40 py-2.5 hover:bg-red-900/20 tracking-widest transition-colors"
                >BLOCK</button>
                <button
                  onClick={() => setBlockTarget(null)}
                  className="flex-1 font-cinzel text-[10px] text-slate-500 border border-slate-700 py-2.5 hover:bg-slate-800/40 tracking-widest transition-colors"
                >CANCEL</button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const redirectResult = await requireAuth(context, 'ACCEPTED_MEMBER')
  if (redirectResult) return redirectResult

  const session = await getServerSession(context.req, context.res, authOptions)
  const rank = (session?.user?.rank ?? 'F') as string
  if (RANK_LEVEL[rank] < RANK_LEVEL['D']) {
    return {
      props: {
        locked: true,
        lockReason: `Messages unlock at Rank D. Your current rank is ${rank}. Keep completing quests to advance.`,
      },
    }
  }

  return { props: { locked: false } }
}