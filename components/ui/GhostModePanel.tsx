// components/ui/GhostModePanel.tsx
// Shown only to FOUNDER users — lets them create and toggle their anonymous identity
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS']

interface Ghost {
  id: string
  ghostName: string
  ghostRank: string
  isActive: boolean
}

export default function GhostModePanel() {
  const { data: session } = useSession()
  const [ghost, setGhost] = useState<Ghost | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  // Setup form
  const [setupMode, setSetupMode] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [rankInput, setRankInput] = useState('B')
  const [setupError, setSetupError] = useState('')
  const [setupSaving, setSetupSaving] = useState(false)

  useEffect(() => {
    if (session?.user?.role === 'FOUNDER') {
      fetch('/api/founder/ghost').then(r => r.json()).then(d => {
        setGhost(d.ghost)
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [session])

  if (session?.user?.role !== 'FOUNDER') return null

  async function toggle() {
    if (!ghost) return
    setToggling(true)
    const res = await fetch('/api/founder/ghost', { method: 'PATCH' })
    const data = await res.json()
    setToggling(false)
    if (res.ok) setGhost(data.ghost)
  }

  async function saveGhost() {
    if (!nameInput.trim()) return
    setSetupSaving(true)
    setSetupError('')
    const res = await fetch('/api/founder/ghost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ghostName: nameInput.trim(), ghostRank: rankInput }),
    })
    const data = await res.json()
    setSetupSaving(false)
    if (res.ok) {
      setGhost(data.ghost)
      setSetupMode(false)
      setNameInput('')
    } else {
      setSetupError(data.error || 'Failed to save.')
    }
  }

  const isActive = ghost?.isActive ?? false

  return (
    <div className="relative">
      {/* Trigger button in header */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 border font-cinzel text-[9px] tracking-widest transition-colors ${
          isActive
            ? 'border-violet-500/60 text-violet-400 bg-violet-900/20 animate-pulse'
            : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
        }`}
        title={isActive ? `Ghost mode ON — appearing as ${ghost?.ghostName}` : 'Ghost mode OFF'}
      >
        <span>👻</span>
        <span>{isActive ? `${ghost?.ghostName}` : 'GHOST'}</span>
        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-80 bg-[#0a0a0f] border border-violet-500/30 shadow-2xl shadow-violet-900/20">
            <div className="px-4 py-3 border-b border-violet-500/20">
              <div className="flex items-center justify-between">
                <p className="font-cinzel text-[10px] text-violet-400 tracking-widest">GHOST IDENTITY</p>
                {ghost && !setupMode && (
                  <button
                    onClick={() => { setSetupMode(true); setNameInput(ghost.ghostName); setRankInput(ghost.ghostRank) }}
                    className="font-cinzel text-[9px] text-slate-600 hover:text-slate-300 transition-colors"
                  >EDIT</button>
                )}
              </div>
              <p className="font-cormorant text-slate-500 text-xs mt-0.5">
                Participate anonymously. Your real identity is never revealed to other members.
              </p>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center h-12">
                  <div className="w-5 h-5 border border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />
                </div>
              ) : !ghost || setupMode ? (
                /* Setup / Edit form */
                <div className="space-y-3">
                  <div>
                    <label className="font-cinzel text-[9px] text-slate-500 tracking-widest block mb-1">GHOST NAME</label>
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveGhost()}
                      placeholder="e.g. Shadow, Void, Phantom"
                      maxLength={24}
                      className="w-full bg-black/60 border border-violet-500/30 text-white font-cormorant text-sm px-3 py-2 focus:outline-none focus:border-violet-400/60 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="font-cinzel text-[9px] text-slate-500 tracking-widest block mb-1">GHOST RANK</label>
                    <select
                      value={rankInput}
                      onChange={e => setRankInput(e.target.value)}
                      className="w-full bg-black/60 border border-violet-500/30 text-white font-cinzel text-xs px-3 py-2 focus:outline-none focus:border-violet-400/60"
                    >
                      {RANKS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <p className="font-cormorant text-slate-700 text-[10px] mt-1">SSS rank is excluded — it would give you away.</p>
                  </div>
                  {setupError && <p className="font-cormorant text-red-400 text-xs">{setupError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={saveGhost}
                      disabled={setupSaving || !nameInput.trim()}
                      className="flex-1 font-cinzel text-[10px] tracking-widest text-violet-300 border border-violet-500/50 py-2 hover:bg-violet-900/20 transition-colors disabled:opacity-40"
                    >{setupSaving ? '…' : ghost ? 'UPDATE' : 'CREATE GHOST'}</button>
                    {ghost && (
                      <button
                        onClick={() => { setSetupMode(false); setSetupError('') }}
                        className="font-cinzel text-[10px] tracking-widest text-slate-500 border border-slate-700 px-3 py-2 hover:bg-slate-800/40 transition-colors"
                      >✕</button>
                    )}
                  </div>
                </div>
              ) : (
                /* Ghost info + toggle */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border border-violet-500/20 bg-violet-900/10">
                    <div className="text-2xl">👻</div>
                    <div>
                      <p className="font-cinzel text-sm text-white">{ghost.ghostName}</p>
                      <p className="font-cinzel text-[9px] text-violet-400">Rank {ghost.ghostRank}</p>
                    </div>
                    <div className={`ml-auto w-2 h-2 rounded-full ${isActive ? 'bg-violet-400 animate-pulse' : 'bg-slate-700'}`} />
                  </div>

                  <div className="space-y-2">
                    <p className="font-cormorant text-slate-400 text-xs leading-relaxed">
                      {isActive
                        ? `You are currently appearing as ${ghost.ghostName}. Your messages and chats will show this identity.`
                        : `Ghost mode is off. You appear as your founder account.`}
                    </p>
                    <button
                      onClick={toggle}
                      disabled={toggling}
                      className={`w-full font-cinzel text-[10px] tracking-widest py-2.5 border transition-colors disabled:opacity-40 ${
                        isActive
                          ? 'text-slate-400 border-slate-700 hover:bg-slate-800/40'
                          : 'text-violet-300 border-violet-500/50 hover:bg-violet-900/20'
                      }`}
                    >
                      {toggling ? '…' : isActive ? '⬛  SWITCH BACK TO FOUNDER' : '👻  ACTIVATE GHOST MODE'}
                    </button>
                  </div>

                  <div className="border-t border-violet-500/10 pt-3">
                    <p className="font-cinzel text-[9px] text-slate-700 tracking-widest uppercase mb-2">You can send messages as</p>
                    <div className="flex gap-2">
                      <div className={`flex-1 text-center py-2 border font-cinzel text-[9px] tracking-widest cursor-pointer transition-colors ${
                        !isActive ? 'border-portal-emerald/50 text-portal-emerald' : 'border-slate-800 text-slate-700'
                      }`} onClick={isActive ? toggle : undefined}>
                        FOUNDER
                      </div>
                      <div className={`flex-1 text-center py-2 border font-cinzel text-[9px] tracking-widest cursor-pointer transition-colors ${
                        isActive ? 'border-violet-500/50 text-violet-400' : 'border-slate-800 text-slate-700'
                      }`} onClick={!isActive ? toggle : undefined}>
                        {ghost.ghostName}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}