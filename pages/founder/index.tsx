import { useState, useEffect } from 'react'
import Head from 'next/head'
import { GetServerSideProps } from 'next'
import { requireAuth } from '@/lib/middleware'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import RankBadge from '@/components/ui/RankBadge'
import StatusChip from '@/components/ui/StatusChip'
import { GlowInput, GlowTextarea } from '@/components/ui/GlowInput'
import GlowButton from '@/components/ui/GlowButton'

const TABS = ['Users','Quests','Trials','Admins','Arena','AI Alerts','Payouts','Settings']

const RANK_COLORS: Record<string, string> = {
  F:'text-slate-400',E:'text-green-400',D:'text-blue-400',C:'text-yellow-400',
  B:'text-orange-400',A:'text-purple-400',S:'text-pink-400',SS:'text-red-400',SSS:'text-amber-300',
}

export default function FounderDashboard() {
  const [tab, setTab] = useState('Users')
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [quests, setQuests] = useState<any[]>([])
  const [trials, setTrials] = useState<any[]>([])
  const [trialTasks, setTrialTasks] = useState<any[]>([])
  const [admins, setAdmins] = useState<any[]>([])
  const [arena, setArena] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')

  // Forms
  const [questForm, setQuestForm] = useState({ title:'',category:'Design',difficulty:'Medium',rankRequired:'F',rewardXp:'100',instructions:'',deadline:'' })
  const [taskForm, setTaskForm] = useState({ title:'',description:'',category:'Design',difficulty:'Medium',instructions:'',deadlineHours:'24' })
  const [adminForm, setAdminForm] = useState({ name:'',email:'',password:'',role:'MODERATOR',canTrials:false,canQuests:false,canUsers:false,canReports:false,canArena:false })
  const [arenaForm, setArenaForm] = useState({ title:'',description:'',type:'challenge',xpReward:'50',cashReward:'',endsAt:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [s,u,q,t,a,ar] = await Promise.all([
      fetch('/api/founder/stats').then(r=>r.json()).catch(()=>({})),
      fetch('/api/founder/users').then(r=>r.json()).catch(()=>({users:[]})),
      fetch('/api/founder/quests').then(r=>r.json()).catch(()=>({quests:[]})),
      fetch('/api/founder/trials').then(r=>r.json()).catch(()=>({trials:[],tasks:[]})),
      fetch('/api/founder/admins').then(r=>r.json()).catch(()=>({admins:[]})),
      fetch('/api/founder/arena').then(r=>r.json()).catch(()=>({challenges:[]})),
    ])
    setStats(s)
    setUsers(u.users || [])
    setQuests(q.quests || [])
    setTrials(t.trials || [])
    setTrialTasks(t.tasks || [])
    setAdmins(a.admins || [])
    setArena(ar.challenges || [])
    setLoading(false)
  }

  function msg(text: string) {
    setActionMsg(text)
    setTimeout(() => setActionMsg(''), 3000)
  }

  async function updateUser(id: string, action: string, value?: any) {
    await fetch(`/api/founder/user/${id}`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action, value }),
    })
    msg(`User ${action} applied.`)
    loadAll()
  }

  async function reviewTrial(id: string, status: string, score?: number, notes?: string) {
    await fetch(`/api/founder/trials`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id, status, score, judgeNotes: notes }),
    })
    msg(`Trial marked ${status}.`)
    loadAll()
  }

  async function postQuest() {
    setSaving(true)
    await fetch('/api/founder/quests', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(questForm),
    })
    setSaving(false)
    setQuestForm({ title:'',category:'Design',difficulty:'Medium',rankRequired:'F',rewardXp:'100',instructions:'',deadline:'' })
    msg('Quest posted.')
    loadAll()
  }

  async function postTrialTask() {
    setSaving(true)
    await fetch('/api/founder/trial-tasks', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(taskForm),
    })
    setSaving(false)
    setTaskForm({ title:'',description:'',category:'Design',difficulty:'Medium',instructions:'',deadlineHours:'24' })
    msg('Trial task created.')
    loadAll()
  }

  async function postArena() {
    setSaving(true)
    await fetch('/api/founder/arena', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(arenaForm),
    })
    setSaving(false)
    setArenaForm({ title:'',description:'',type:'challenge',xpReward:'50',cashReward:'',endsAt:'' })
    msg('Arena event posted.')
    loadAll()
  }

  async function createAdmin() {
    setSaving(true)
    const res = await fetch('/api/founder/admins', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(adminForm),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) msg(`Error: ${data.error}`)
    else { setAdminForm({ name:'',email:'',password:'',role:'MODERATOR',canTrials:false,canQuests:false,canUsers:false,canReports:false,canArena:false }); msg('Admin account created.') }
    loadAll()
  }

  async function revokeAdmin(id: string) {
    await fetch(`/api/founder/admins`, {
      method:'DELETE',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ userId: id }),
    })
    msg('Admin access revoked.')
    loadAll()
  }

  return (
    <>
      <Head><title>Founder War Room — QuestHub Guild</title></Head>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto flex flex-col gap-5">

          {/* Header */}
          <div className="relative bg-gradient-to-r from-amber-900/20 via-[#0d0017] to-amber-900/10 border border-amber-500/30 p-5 overflow-hidden">
            <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-amber-500/60" />
            <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-amber-500/60" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/40 rotate-45 flex items-center justify-center">
                  <span className="text-amber-400 -rotate-45 font-orbitron font-black text-lg">★</span>
                </div>
                <div>
                  <div className="font-orbitron text-[10px] text-amber-400/70 tracking-[0.4em] uppercase">Founder Access</div>
                  <h1 className="font-orbitron font-black text-xl text-white tracking-widest">WAR ROOM</h1>
                </div>
              </div>
              {stats && (
                <div className="flex flex-wrap gap-4 sm:ml-auto">
                  {[
                    { label:'Total Users', value: stats.totalUsers || 0 },
                    { label:'Active Quests', value: stats.activeQuests || 0 },
                    { label:'Pending Trials', value: stats.pendingTrials || 0 },
                  ].map(({label,value}) => (
                    <div key={label} className="text-center">
                      <div className="font-orbitron font-black text-xl text-amber-300">{value}</div>
                      <div className="font-rajdhani text-[10px] text-slate-500 tracking-widest uppercase">{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action message */}
          {actionMsg && (
            <div className="bg-green-900/20 border border-green-500/30 px-4 py-3 font-orbitron text-xs text-green-400 tracking-widest">
              ✓ {actionMsg}
            </div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-1">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`font-orbitron text-[10px] tracking-widest uppercase px-4 py-2 border transition-all ${
                  tab === t
                    ? 'border-amber-500/60 bg-amber-900/20 text-amber-300'
                    : 'border-slate-800 text-slate-600 hover:border-amber-500/20 hover:text-slate-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
                <p className="font-orbitron text-xs text-amber-400 tracking-widest animate-pulse">LOADING WAR ROOM DATA...</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── USERS TAB ── */}
              {tab === 'Users' && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label:'Total',   value: users.length,                                      color:'text-white'  },
                      { label:'Active',  value: users.filter(u=>u.status==='ACTIVE').length,        color:'text-green-400' },
                      { label:'Banned',  value: users.filter(u=>u.status==='BANNED').length,        color:'text-red-400'   },
                      { label:'Trial',   value: users.filter(u=>u.role==='TRIAL_MEMBER').length,    color:'text-yellow-400'},
                    ].map(({label,value,color}) => (
                      <div key={label} className="bg-[#0d0017] border border-purple-500/20 p-4 text-center">
                        <div className={`font-orbitron font-black text-2xl ${color}`}>{value}</div>
                        <div className="font-rajdhani text-xs text-slate-600 tracking-widest uppercase">{label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#0d0017] border border-purple-500/20 overflow-hidden">
                    <div className="px-5 py-3 border-b border-purple-500/15 flex items-center justify-between">
                      <h3 className="font-orbitron text-xs text-white tracking-widest uppercase">All Users</h3>
                      <span className="font-rajdhani text-xs text-slate-600">{users.length} registered</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-purple-500/10">
                            {['User','Role','Rank','XP','Status','Actions'].map(h => (
                              <th key={h} className="px-4 py-3 text-left font-orbitron text-[9px] text-slate-600 tracking-widest uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u:any) => (
                            <tr key={u.id} className="border-b border-purple-500/10 hover:bg-purple-900/5 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-orbitron text-xs text-white">{u.nickname || u.name}</div>
                                <div className="font-rajdhani text-[10px] text-slate-600">{u.email}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-rajdhani text-xs text-slate-400">{u.role.replace('_',' ')}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`font-orbitron font-black text-sm ${RANK_COLORS[u.rank] || 'text-slate-400'}`}>{u.rank}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-orbitron text-xs text-purple-400">{u.xp}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`font-orbitron text-[9px] px-2 py-0.5 border ${
                                  u.status==='ACTIVE' ? 'text-green-400 border-green-500/30' :
                                  u.status==='BANNED' ? 'text-red-400 border-red-500/30' :
                                  'text-yellow-400 border-yellow-500/30'
                                }`}>{u.status}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {['F','E','D','C','B','A','S','SS','SSS'].map(rank => (
                                    <button key={rank} onClick={() => updateUser(u.id,'setRank',rank)}
                                      className={`font-orbitron text-[8px] px-1.5 py-0.5 border transition-all ${u.rank===rank ? 'border-purple-400/60 text-purple-300' : 'border-slate-800 text-slate-700 hover:border-purple-500/30 hover:text-slate-400'}`}>
                                      {rank}
                                    </button>
                                  ))}
                                  <button onClick={() => updateUser(u.id, u.status==='BANNED'?'unban':'ban')}
                                    className={`font-orbitron text-[8px] px-2 py-0.5 border transition-all ml-1 ${u.status==='BANNED'?'border-green-500/40 text-green-400 hover:bg-green-900/20':'border-red-500/30 text-red-400 hover:bg-red-900/20'}`}>
                                    {u.status==='BANNED'?'UNBAN':'BAN'}
                                  </button>
                                  {u.status==='ACTIVE' && (
                                    <button onClick={() => updateUser(u.id,'suspend')}
                                      className="font-orbitron text-[8px] px-2 py-0.5 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-900/20 transition-all">
                                      SUSPEND
                                    </button>
                                  )}
                                  <button onClick={() => updateUser(u.id,'warn')}
                                    className="font-orbitron text-[8px] px-2 py-0.5 border border-orange-500/30 text-orange-400 hover:bg-orange-900/20 transition-all">
                                    WARN
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── QUESTS TAB ── */}
              {tab === 'Quests' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Post new quest */}
                  <div className="bg-[#0d0017] border border-amber-500/20 p-5">
                    <h3 className="font-orbitron text-xs text-amber-400 tracking-widest uppercase mb-5 pb-3 border-b border-amber-500/20">
                      Post New Quest
                    </h3>
                    <div className="flex flex-col gap-4">
                      <GlowInput label="Quest Title *" placeholder="Operation: Brand Revamp" value={questForm.title} onChange={e=>setQuestForm(p=>({...p,title:e.target.value}))} />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-orbitron text-[9px] text-purple-300/70 tracking-widest uppercase block mb-1.5">Category</label>
                          <select value={questForm.category} onChange={e=>setQuestForm(p=>({...p,category:e.target.value}))}
                            className="w-full bg-black/50 border border-purple-500/25 text-slate-200 text-sm font-rajdhani px-3 py-2.5 focus:outline-none focus:border-purple-400/70 transition-all">
                            {['Design','Writing','Coding','Research','Marketing','Social Media','Video Work','Other'].map(c=><option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="font-orbitron text-[9px] text-purple-300/70 tracking-widest uppercase block mb-1.5">Difficulty</label>
                          <select value={questForm.difficulty} onChange={e=>setQuestForm(p=>({...p,difficulty:e.target.value}))}
                            className="w-full bg-black/50 border border-purple-500/25 text-slate-200 text-sm font-rajdhani px-3 py-2.5 focus:outline-none focus:border-purple-400/70 transition-all">
                            {['Easy','Medium','Hard','Expert'].map(d=><option key={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="font-orbitron text-[9px] text-purple-300/70 tracking-widest uppercase block mb-1.5">Min Rank</label>
                          <select value={questForm.rankRequired} onChange={e=>setQuestForm(p=>({...p,rankRequired:e.target.value}))}
                            className="w-full bg-black/50 border border-purple-500/25 text-slate-200 text-sm font-rajdhani px-3 py-2.5 focus:outline-none focus:border-purple-400/70 transition-all">
                            {['F','E','D','C','B','A','S','SS','SSS'].map(r=><option key={r}>{r}</option>)}
                          </select>
                        </div>
                        <div>
                          <GlowInput label="XP Reward" type="number" placeholder="100" value={questForm.rewardXp} onChange={e=>setQuestForm(p=>({...p,rewardXp:e.target.value}))} />
                        </div>
                      </div>
                      <div>
                        <label className="font-orbitron text-[9px] text-purple-300/70 tracking-widest uppercase block mb-1.5">Deadline (optional)</label>
                        <input type="datetime-local" value={questForm.deadline} onChange={e=>setQuestForm(p=>({...p,deadline:e.target.value}))}
                          className="w-full bg-black/50 border border-purple-500/25 text-slate-200 text-sm font-rajdhani px-3 py-2.5 focus:outline-none focus:border-purple-400/70 transition-all [color-scheme:dark]" />
                      </div>
                      <GlowTextarea label="Instructions *" placeholder="Full mission briefing..." rows={4} value={questForm.instructions} onChange={e=>setQuestForm(p=>({...p,instructions:e.target.value}))} />
                      <GlowButton variant="primary" size="md" loading={saving} onClick={postQuest}>Post Quest</GlowButton>
                    </div>
                  </div>

                  {/* Existing quests */}
                  <div className="bg-[#0d0017] border border-purple-500/20 p-5">
                    <h3 className="font-orbitron text-xs text-white tracking-widest uppercase mb-5 pb-3 border-b border-purple-500/15">
                      All Quests ({quests.length})
                    </h3>
                    <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
                      {quests.length === 0 ? (
                        <p className="font-rajdhani text-slate-600 text-sm text-center py-8">No quests posted yet.</p>
                      ) : quests.map((q:any) => (
                        <div key={q.id} className="border border-purple-500/15 p-3 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-orbitron text-xs text-white truncate">{q.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-orbitron text-[9px] text-purple-400/70">{q.category}</span>
                              <span className="font-orbitron text-[9px] text-slate-600">{q.difficulty}</span>
                              <span className={`font-orbitron text-[9px] ${q.status==='OPEN'?'text-green-400':'text-yellow-400'}`}>{q.status}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            {q.status === 'OPEN' && (
                              <button onClick={async()=>{await fetch(`/api/founder/quests`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:q.id})});loadAll()}}
                                className="font-orbitron text-[8px] px-2 py-1 border border-red-500/30 text-red-400 hover:bg-red-900/20 transition-all">
                                REMOVE
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TRIALS TAB ── */}
              {tab === 'Trials' && (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Create Trial Task */}
                    <div className="bg-[#0d0017] border border-amber-500/20 p-5">
                      <h3 className="font-orbitron text-xs text-amber-400 tracking-widest uppercase mb-5 pb-3 border-b border-amber-500/20">
                        Create Trial Task
                      </h3>
                      <div className="flex flex-col gap-4">
                        <GlowInput label="Task Title *" placeholder="Design a logo for X" value={taskForm.title} onChange={e=>setTaskForm(p=>({...p,title:e.target.value}))} />
                        <GlowTextarea label="Description *" placeholder="What needs to be done..." rows={2} value={taskForm.description} onChange={e=>setTaskForm(p=>({...p,description:e.target.value}))} />
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-orbitron text-[9px] text-purple-300/70 tracking-widest uppercase block mb-1.5">Category</label>
                            <select value={taskForm.category} onChange={e=>setTaskForm(p=>({...p,category:e.target.value}))}
                              className="w-full bg-black/50 border border-purple-500/25 text-slate-200 text-sm font-rajdhani px-3 py-2.5 focus:outline-none focus:border-purple-400/70 transition-all">
                              {['Design','Writing','Coding','Research','Marketing','Video','Other'].map(c=><option key={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="font-orbitron text-[9px] text-purple-300/70 tracking-widest uppercase block mb-1.5">Difficulty</label>
                            <select value={taskForm.difficulty} onChange={e=>setTaskForm(p=>({...p,difficulty:e.target.value}))}
                              className="w-full bg-black/50 border border-purple-500/25 text-slate-200 text-sm font-rajdhani px-3 py-2.5 focus:outline-none focus:border-purple-400/70 transition-all">
                              {['Easy','Medium','Hard'].map(d=><option key={d}>{d}</option>)}
                            </select>
                          </div>
                        </div>
                        <GlowInput label="Deadline (hours)" type="number" placeholder="24" value={taskForm.deadlineHours} onChange={e=>setTaskForm(p=>({...p,deadlineHours:e.target.value}))} />
                        <GlowTextarea label="Full Instructions *" placeholder="Step-by-step instructions..." rows={3} value={taskForm.instructions} onChange={e=>setTaskForm(p=>({...p,instructions:e.target.value}))} />
                        <GlowButton variant="primary" size="md" loading={saving} onClick={postTrialTask}>Create Task</GlowButton>
                      </div>
                    </div>

                    {/* Active Trial Tasks */}
                    <div className="bg-[#0d0017] border border-purple-500/20 p-5">
                      <h3 className="font-orbitron text-xs text-white tracking-widest uppercase mb-4 pb-3 border-b border-purple-500/15">
                        Trial Task Pool ({trialTasks.length})
                      </h3>
                      <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                        {trialTasks.length === 0 ? (
                          <p className="font-rajdhani text-slate-600 text-sm text-center py-6">No trial tasks yet.</p>
                        ) : trialTasks.map((t:any) => (
                          <div key={t.id} className="border border-purple-500/10 p-3">
                            <div className="font-orbitron text-xs text-white mb-1">{t.title}</div>
                            <div className="flex items-center gap-2">
                              <span className="font-orbitron text-[9px] text-purple-400/70">{t.category}</span>
                              <span className="font-orbitron text-[9px] text-slate-600">{t.difficulty}</span>
                              <span className="font-rajdhani text-[10px] text-slate-600">⏱ {t.deadlineHours}h</span>
                              <span className={`font-orbitron text-[9px] ml-auto ${t.isActive?'text-green-400':'text-slate-600'}`}>
                                {t.isActive?'ACTIVE':'INACTIVE'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Trial Applications */}
                  <div className="bg-[#0d0017] border border-purple-500/20 p-5">
                    <h3 className="font-orbitron text-xs text-white tracking-widest uppercase mb-4 pb-3 border-b border-purple-500/15">
                      Trial Applications ({trials.length})
                    </h3>
                    <div className="flex flex-col gap-3">
                      {trials.length === 0 ? (
                        <p className="font-rajdhani text-slate-600 text-sm text-center py-6">No trial applications.</p>
                      ) : trials.map((t:any) => (
                        <TrialCard key={t.id} trial={t} onReview={reviewTrial} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ADMINS TAB ── */}
              {tab === 'Admins' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Create Admin */}
                  <div className="bg-[#0d0017] border border-amber-500/20 p-5">
                    <h3 className="font-orbitron text-xs text-amber-400 tracking-widest uppercase mb-5 pb-3 border-b border-amber-500/20">
                      Create Admin Account
                    </h3>
                    <div className="flex flex-col gap-4">
                      <GlowInput label="Full Name *" placeholder="Admin name" value={adminForm.name} onChange={e=>setAdminForm(p=>({...p,name:e.target.value}))} />
                      <GlowInput label="Email *" type="email" placeholder="admin@questhub.io" value={adminForm.email} onChange={e=>setAdminForm(p=>({...p,email:e.target.value}))} />
                      <GlowInput label="Temp Password *" type="password" placeholder="Temporary password" value={adminForm.password} onChange={e=>setAdminForm(p=>({...p,password:e.target.value}))} />
                      <div>
                        <label className="font-orbitron text-[9px] text-purple-300/70 tracking-widest uppercase block mb-1.5">Admin Role</label>
                        <select value={adminForm.role} onChange={e=>setAdminForm(p=>({...p,role:e.target.value}))}
                          className="w-full bg-black/50 border border-purple-500/25 text-slate-200 text-sm font-rajdhani px-3 py-2.5 focus:outline-none focus:border-purple-400/70 transition-all">
                          {['MODERATOR','COORDINATOR','ADMIN'].map(r=><option key={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="font-orbitron text-[9px] text-purple-300/70 tracking-widest uppercase block mb-2">Permissions</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            {key:'canTrials',label:'Trials'},
                            {key:'canQuests',label:'Quests'},
                            {key:'canUsers',label:'Users'},
                            {key:'canReports',label:'Reports'},
                            {key:'canArena',label:'Arena'},
                          ].map(({key,label}) => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={(adminForm as any)[key]}
                                onChange={e=>setAdminForm(p=>({...p,[key]:e.target.checked}))}
                                className="accent-purple-500" />
                              <span className="font-rajdhani text-sm text-slate-400">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <GlowButton variant="primary" size="md" loading={saving} onClick={createAdmin}>Create Admin</GlowButton>
                      <p className="font-rajdhani text-xs text-slate-600">
                        Admin will log in at <span className="text-purple-400">/admin-login</span> with these credentials.
                      </p>
                    </div>
                  </div>

                  {/* Existing Admins */}
                  <div className="bg-[#0d0017] border border-purple-500/20 p-5">
                    <h3 className="font-orbitron text-xs text-white tracking-widest uppercase mb-4 pb-3 border-b border-purple-500/15">
                      Active Admins ({admins.length})
                    </h3>
                    <div className="flex flex-col gap-3">
                      {admins.length === 0 ? (
                        <p className="font-rajdhani text-slate-600 text-sm text-center py-6">No admin accounts yet.</p>
                      ) : admins.map((a:any) => (
                        <div key={a.id} className="border border-purple-500/15 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-orbitron text-xs text-white">{a.name || a.nickname}</div>
                              <div className="font-rajdhani text-xs text-slate-500 mt-0.5">{a.email}</div>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                <span className="font-orbitron text-[9px] border border-red-500/30 text-red-300 px-2 py-0.5">{a.role.replace('_',' ')}</span>
                                {a.adminPermission && Object.entries(a.adminPermission)
                                  .filter(([k,v]) => k.startsWith('can') && v)
                                  .map(([k]) => (
                                    <span key={k} className="font-orbitron text-[9px] border border-slate-700 text-slate-500 px-2 py-0.5">
                                      {k.replace('can','').toUpperCase()}
                                    </span>
                                  ))
                                }
                              </div>
                            </div>
                            <button onClick={() => revokeAdmin(a.id)}
                              className="font-orbitron text-[9px] px-3 py-1.5 border border-red-500/40 text-red-400 hover:bg-red-900/20 transition-all flex-shrink-0">
                              REVOKE
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ARENA TAB ── */}
              {tab === 'Arena' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-[#0d0017] border border-amber-500/20 p-5">
                    <h3 className="font-orbitron text-xs text-amber-400 tracking-widest uppercase mb-5 pb-3 border-b border-amber-500/20">
                      Post Arena Event
                    </h3>
                    <div className="flex flex-col gap-4">
                      <GlowInput label="Event Title *" placeholder="Weekly Guild War" value={arenaForm.title} onChange={e=>setArenaForm(p=>({...p,title:e.target.value}))} />
                      <GlowTextarea label="Description *" placeholder="What's the challenge?" rows={3} value={arenaForm.description} onChange={e=>setArenaForm(p=>({...p,description:e.target.value}))} />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-orbitron text-[9px] text-purple-300/70 tracking-widest uppercase block mb-1.5">Type</label>
                          <select value={arenaForm.type} onChange={e=>setArenaForm(p=>({...p,type:e.target.value}))}
                            className="w-full bg-black/50 border border-purple-500/25 text-slate-200 text-sm font-rajdhani px-3 py-2.5 focus:outline-none focus:border-purple-400/70 transition-all">
                            {['challenge','tournament','poll','mini_game','guild_war'].map(t=><option key={t}>{t}</option>)}
                          </select>
                        </div>
                        <GlowInput label="XP Reward" type="number" placeholder="50" value={arenaForm.xpReward} onChange={e=>setArenaForm(p=>({...p,xpReward:e.target.value}))} />
                        <GlowInput label="Cash Reward ($, optional)" type="number" placeholder="0" value={arenaForm.cashReward} onChange={e=>setArenaForm(p=>({...p,cashReward:e.target.value}))} />
                        <div>
                          <label className="font-orbitron text-[9px] text-purple-300/70 tracking-widest uppercase block mb-1.5">End Date *</label>
                          <input type="datetime-local" value={arenaForm.endsAt} onChange={e=>setArenaForm(p=>({...p,endsAt:e.target.value}))}
                            className="w-full bg-black/50 border border-purple-500/25 text-slate-200 text-sm font-rajdhani px-3 py-2.5 focus:outline-none focus:border-purple-400/70 transition-all [color-scheme:dark]" />
                        </div>
                      </div>
                      <GlowButton variant="primary" size="md" loading={saving} onClick={postArena}>Post Event</GlowButton>
                    </div>
                  </div>

                  <div className="bg-[#0d0017] border border-purple-500/20 p-5">
                    <h3 className="font-orbitron text-xs text-white tracking-widest uppercase mb-4 pb-3 border-b border-purple-500/15">
                      Active Events ({arena.length})
                    </h3>
                    <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
                      {arena.length === 0 ? (
                        <p className="font-rajdhani text-slate-600 text-sm text-center py-6">No events posted yet.</p>
                      ) : arena.map((e:any) => (
                        <div key={e.id} className="border border-purple-500/10 p-3">
                          <div className="font-orbitron text-xs text-white mb-1">{e.title}</div>
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="font-orbitron text-purple-400/70">{e.type}</span>
                            <span className="font-orbitron text-green-400">+{e.xpReward}XP</span>
                            {e.cashReward && <span className="font-orbitron text-amber-400">${e.cashReward}</span>}
                            <span className={`ml-auto font-orbitron ${new Date(e.endsAt)>new Date()?'text-green-400':'text-slate-600'}`}>
                              {new Date(e.endsAt)>new Date()?'LIVE':'ENDED'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── AI ALERTS TAB ── */}
              {tab === 'AI Alerts' && (
                <div className="bg-[#0d0017] border border-red-500/20 p-6">
                  <h3 className="font-orbitron text-xs text-red-400 tracking-widest uppercase mb-5">System Alerts</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { icon:'⚠', label:'Suspicious Activity', value: 0, color:'text-yellow-400', border:'border-yellow-500/20' },
                      { icon:'◎', label:'Ghosting Risk',        value: users.filter(u=>u.role==='ACTIVE_WORKER').length > 0 ? 1 : 0, color:'text-orange-400', border:'border-orange-500/20' },
                      { icon:'⛔', label:'Plagiarism Flags',    value: 0, color:'text-red-400',    border:'border-red-500/20'    },
                      { icon:'◈', label:'Contact Leak Attempts',value: 0, color:'text-purple-400', border:'border-purple-500/20' },
                    ].map(({icon,label,value,color,border}) => (
                      <div key={label} className={`border ${border} p-4`}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-xl ${color}`}>{icon}</span>
                          <span className="font-orbitron text-xs text-white">{label}</span>
                        </div>
                        <div className={`font-orbitron font-black text-3xl ${color}`}>{value}</div>
                        <div className="font-rajdhani text-xs text-slate-600 mt-1">Active alerts</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 border border-purple-500/10 p-4">
                    <p className="font-rajdhani text-slate-600 text-sm">Full AI moderation system is operational. All messages, submissions and behavior patterns are being monitored by Sentinel.</p>
                  </div>
                </div>
              )}

              {/* ── PAYOUTS TAB ── */}
              {tab === 'Payouts' && (
                <div className="bg-[#0d0017] border border-purple-500/20 p-6">
                  <h3 className="font-orbitron text-xs text-white tracking-widest uppercase mb-5">Payout Management</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {[
                      { label:'Pending', value:'$0', color:'text-yellow-400' },
                      { label:'Approved', value:'$0', color:'text-green-400' },
                      { label:'Total Paid', value:'$0', color:'text-purple-400' },
                    ].map(({label,value,color}) => (
                      <div key={label} className="border border-purple-500/15 p-4 text-center">
                        <div className={`font-orbitron font-black text-2xl ${color}`}>{value}</div>
                        <div className="font-rajdhani text-xs text-slate-600 tracking-widest uppercase mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="font-rajdhani text-slate-600 text-sm">Payout system will activate once quests are completed and reviewed. All payouts require Founder approval.</p>
                </div>
              )}

              {/* ── SETTINGS TAB ── */}
              {tab === 'Settings' && (
                <div className="bg-[#0d0017] border border-purple-500/20 p-6">
                  <h3 className="font-orbitron text-xs text-white tracking-widest uppercase mb-5">Global Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="border border-purple-500/15 p-4">
                      <h4 className="font-orbitron text-xs text-purple-400 tracking-widest mb-3">Commission Rates</h4>
                      {[['F','40%'],['E','35%'],['D','30%'],['C','25%'],['B','20%'],['A','15%'],['S','10%'],['SS','5%'],['SSS','2%']].map(([rank,cut]) => (
                        <div key={rank} className="flex justify-between py-1.5 border-b border-purple-500/5 last:border-0">
                          <span className={`font-orbitron text-xs ${RANK_COLORS[rank] || 'text-slate-400'}`}>{rank}</span>
                          <span className="font-rajdhani text-sm text-slate-400">{cut} Founder cut</span>
                        </div>
                      ))}
                    </div>
                    <div className="border border-purple-500/15 p-4">
                      <h4 className="font-orbitron text-xs text-purple-400 tracking-widest mb-3">Access Rules</h4>
                      {[
                        ['Quest Board','Accepted Member+'],
                        ['Messages','Rank D+'],
                        ['Guild Chat','Accepted Member+'],
                        ['Fun Arena','Accepted Member+'],
                        ['Elite Channel','Rank A+'],
                        ['Admin Panel','Admin Role+'],
                        ['Founder Panel','Founder Only'],
                      ].map(([page,req]) => (
                        <div key={page} className="flex justify-between py-1.5 border-b border-purple-500/5 last:border-0">
                          <span className="font-rajdhani text-sm text-slate-400">{page}</span>
                          <span className="font-orbitron text-[10px] text-purple-400/70">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </>
  )
}

function TrialCard({ trial, onReview }: { trial: any; onReview: any }) {
  const [score, setScore] = useState('')
  const [notes, setNotes] = useState('')
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-purple-500/15 p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-orbitron text-xs text-white">{trial.user?.nickname || trial.user?.name || 'Unknown'}</div>
          <div className="font-rajdhani text-xs text-slate-500 mt-0.5">{trial.user?.email}</div>
          <div className="flex flex-wrap gap-2 mt-2">
            {trial.skills?.map((s:string) => (
              <span key={s} className="font-orbitron text-[9px] border border-purple-500/20 text-purple-400/70 px-1.5 py-0.5">{s}</span>
            ))}
          </div>
          <div className="font-rajdhani text-xs text-slate-500 mt-1">Availability: {trial.availability}</div>
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          <span className={`font-orbitron text-[10px] px-2 py-1 border text-center ${
            trial.status==='PENDING' ? 'text-yellow-400 border-yellow-500/30' :
            trial.status==='UNDER_REVIEW' ? 'text-blue-400 border-blue-500/30' :
            trial.status==='ACCEPTED' ? 'text-green-400 border-green-500/30' :
            'text-red-400 border-red-500/30'
          }`}>{trial.status.replace('_',' ')}</span>
          <button onClick={()=>setOpen(!open)}
            className="font-orbitron text-[9px] px-2 py-1 border border-amber-500/30 text-amber-400 hover:bg-amber-900/10 transition-all">
            {open?'CLOSE':'REVIEW'}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-purple-500/10 flex flex-col gap-3">
          <div className="font-rajdhani text-xs text-slate-400">
            <span className="font-orbitron text-[9px] text-purple-400 mr-2">WHY JOIN:</span>
            {trial.whyJoin}
          </div>
          <div className="font-rajdhani text-xs text-slate-400">
            <span className="font-orbitron text-[9px] text-purple-400 mr-2">STRENGTHS:</span>
            {trial.strengths}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-orbitron text-[9px] text-slate-600 tracking-widest uppercase block mb-1">Score (0-100)</label>
              <input type="number" min="0" max="100" value={score} onChange={e=>setScore(e.target.value)} placeholder="75"
                className="w-full bg-black/40 border border-purple-500/20 text-slate-200 text-sm font-rajdhani px-3 py-2 focus:outline-none focus:border-purple-400/50 transition-all" />
            </div>
            <div>
              <label className="font-orbitron text-[9px] text-slate-600 tracking-widest uppercase block mb-1">Notes</label>
              <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Founder notes..."
                className="w-full bg-black/40 border border-purple-500/20 text-slate-200 text-sm font-rajdhani px-3 py-2 focus:outline-none focus:border-purple-400/50 transition-all" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>onReview(trial.id,'ACCEPTED',score?parseInt(score):undefined,notes||undefined)}
              className="font-orbitron text-[10px] px-3 py-2 border border-green-500/40 text-green-400 hover:bg-green-900/20 transition-all">
              ACCEPT
            </button>
            <button onClick={()=>onReview(trial.id,'UNDER_REVIEW',score?parseInt(score):undefined,notes||undefined)}
              className="font-orbitron text-[10px] px-3 py-2 border border-blue-500/40 text-blue-400 hover:bg-blue-900/20 transition-all">
              MARK REVIEWING
            </button>
            <button onClick={()=>onReview(trial.id,'REJECTED',score?parseInt(score):undefined,notes||undefined)}
              className="font-orbitron text-[10px] px-3 py-2 border border-red-500/40 text-red-400 hover:bg-red-900/20 transition-all">
              REJECT
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const redirect = await requireAuth(context, 'FOUNDER')
  if (redirect) return redirect
  return { props: {} }
}
