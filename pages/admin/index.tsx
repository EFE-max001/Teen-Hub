import { useState, useEffect } from 'react'
import Head from 'next/head'
import { GetServerSideProps } from 'next'
import { requireAuth } from '@/lib/middleware'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default function AdminDashboard({ permissions }: { permissions: any }) {
  const [tab, setTab] = useState('')
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  const availableTabs = [
    permissions?.canTrials  && 'Trials',
    permissions?.canQuests  && 'Quests',
    permissions?.canUsers   && 'Users',
    permissions?.canReports && 'Reports',
    permissions?.canArena   && 'Arena',
  ].filter(Boolean) as string[]

  useEffect(() => {
    if (availableTabs.length > 0 && !tab) setTab(availableTabs[0])
  }, [availableTabs.length])

  useEffect(() => {
    if (!tab) return
    setLoading(true)
    const endpoint = tab.toLowerCase()
    fetch(`/api/admin/${endpoint}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tab])

  function msg(text: string) {
    setActionMsg(text)
    setTimeout(() => setActionMsg(''), 3000)
  }

  async function reviewTrial(id: string, status: string) {
    await fetch('/api/admin/trials', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    msg(`Trial ${status.toLowerCase()}.`)
    const d = await fetch('/api/admin/trials').then(r => r.json())
    setData(d)
  }

  async function resolveReport(id: string) {
    await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, resolved: true }),
    })
    msg('Report resolved.')
    const d = await fetch('/api/admin/reports').then(r => r.json())
    setData(d)
  }

  return (
    <>
      <Head><title>Admin Panel — QuestHub Guild</title></Head>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto flex flex-col gap-5">

          <div className="relative bg-gradient-to-r from-red-900/20 via-[#0d0017] to-red-900/10 border border-red-500/30 p-5 overflow-hidden">
            <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500/60" />
            <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500/60" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-500/20 border border-red-500/40 rotate-45 flex items-center justify-center">
                <span className="text-red-400 -rotate-45 font-orbitron font-black text-sm">⬛</span>
              </div>
              <div>
                <div className="font-orbitron text-[10px] text-red-400/70 tracking-[0.4em] uppercase">Restricted Access</div>
                <h1 className="font-orbitron font-black text-lg text-white tracking-widest">ADMIN PANEL</h1>
              </div>
              <div className="ml-auto flex flex-wrap gap-1">
                {[
                  permissions?.canTrials  && { label:'Trials',  color:'text-yellow-400 border-yellow-500/30' },
                  permissions?.canQuests  && { label:'Quests',  color:'text-blue-400 border-blue-500/30'   },
                  permissions?.canUsers   && { label:'Users',   color:'text-green-400 border-green-500/30' },
                  permissions?.canReports && { label:'Reports', color:'text-red-400 border-red-500/30'     },
                  permissions?.canArena   && { label:'Arena',   color:'text-purple-400 border-purple-500/30'},
                ].filter(Boolean).map((p:any) => (
                  <span key={p.label} className={`font-orbitron text-[9px] border px-2 py-0.5 ${p.color}`}>{p.label}</span>
                ))}
              </div>
            </div>
          </div>

          {availableTabs.length === 0 ? (
            <div className="bg-[#0d0017] border border-red-500/20 p-10 text-center">
              <p className="font-orbitron text-sm text-red-400 tracking-widest mb-3">NO PERMISSIONS ASSIGNED</p>
              <p className="font-rajdhani text-slate-500">Contact the Founder to assign your admin permissions.</p>
            </div>
          ) : (
            <>
              {actionMsg && (
                <div className="bg-green-900/20 border border-green-500/30 px-4 py-3 font-orbitron text-xs text-green-400 tracking-widest">
                  ✓ {actionMsg}
                </div>
              )}

              <div className="flex gap-1 flex-wrap">
                {availableTabs.map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`font-orbitron text-[10px] tracking-widest uppercase px-4 py-2 border transition-all ${
                      tab === t
                        ? 'border-red-500/60 bg-red-900/20 text-red-300'
                        : 'border-slate-800 text-slate-600 hover:border-red-500/20 hover:text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex items-center justify-center min-h-[30vh]">
                  <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-400 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {tab === 'Trials' && (
                    <div className="bg-[#0d0017] border border-purple-500/20 p-5">
                      <h3 className="font-orbitron text-xs text-white tracking-widest uppercase mb-4">Trial Applications ({data.trials?.length || 0})</h3>
                      <div className="flex flex-col gap-3">
                        {(data.trials || []).length === 0 ? (
                          <p className="font-rajdhani text-slate-600 text-sm text-center py-6">No pending trials.</p>
                        ) : (data.trials || []).map((t:any) => (
                          <div key={t.id} className="border border-purple-500/15 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-orbitron text-xs text-white">{t.user?.nickname || t.user?.name}</div>
                                <div className="font-rajdhani text-xs text-slate-500">{t.availability} · {t.skills?.join(', ')}</div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => reviewTrial(t.id,'UNDER_REVIEW')}
                                  className="font-orbitron text-[9px] px-2 py-1 border border-blue-500/40 text-blue-400 hover:bg-blue-900/20 transition-all">
                                  REVIEWING
                                </button>
                                <button onClick={() => reviewTrial(t.id,'ACCEPTED')}
                                  className="font-orbitron text-[9px] px-2 py-1 border border-green-500/40 text-green-400 hover:bg-green-900/20 transition-all">
                                  ACCEPT
                                </button>
                                <button onClick={() => reviewTrial(t.id,'REJECTED')}
                                  className="font-orbitron text-[9px] px-2 py-1 border border-red-500/40 text-red-400 hover:bg-red-900/20 transition-all">
                                  REJECT
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tab === 'Quests' && (
                    <div className="bg-[#0d0017] border border-purple-500/20 p-5">
                      <h3 className="font-orbitron text-xs text-white tracking-widest uppercase mb-4">Quest Management ({data.quests?.length || 0})</h3>
                      <div className="flex flex-col gap-2">
                        {(data.quests || []).length === 0 ? (
                          <p className="font-rajdhani text-slate-600 text-sm text-center py-6">No quests.</p>
                        ) : (data.quests || []).map((q:any) => (
                          <div key={q.id} className="border border-purple-500/10 p-3 flex items-center justify-between gap-3">
                            <div>
                              <div className="font-orbitron text-xs text-white">{q.title}</div>
                              <div className="font-rajdhani text-xs text-slate-500">{q.category} · {q.status}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tab === 'Users' && (
                    <div className="bg-[#0d0017] border border-purple-500/20 p-5">
                      <h3 className="font-orbitron text-xs text-white tracking-widest uppercase mb-4">User Overview ({data.users?.length || 0})</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-purple-500/10">
                              {['User','Role','Rank','Status'].map(h => (
                                <th key={h} className="px-4 py-3 text-left font-orbitron text-[9px] text-slate-600 tracking-widest uppercase">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(data.users || []).map((u:any) => (
                              <tr key={u.id} className="border-b border-purple-500/10">
                                <td className="px-4 py-3">
                                  <div className="font-orbitron text-xs text-white">{u.nickname || u.name}</div>
                                  <div className="font-rajdhani text-[10px] text-slate-600">{u.email}</div>
                                </td>
                                <td className="px-4 py-3"><span className="font-rajdhani text-xs text-slate-400">{u.role.replace('_',' ')}</span></td>
                                <td className="px-4 py-3"><span className="font-orbitron text-xs text-purple-400">{u.rank}</span></td>
                                <td className="px-4 py-3"><span className="font-rajdhani text-xs text-slate-400">{u.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {tab === 'Reports' && (
                    <div className="bg-[#0d0017] border border-purple-500/20 p-5">
                      <h3 className="font-orbitron text-xs text-white tracking-widest uppercase mb-4">Reports ({data.reports?.length || 0})</h3>
                      <div className="flex flex-col gap-3">
                        {(data.reports || []).length === 0 ? (
                          <p className="font-rajdhani text-slate-600 text-sm text-center py-6">No open reports.</p>
                        ) : (data.reports || []).map((r:any) => (
                          <div key={r.id} className="border border-red-500/15 p-4">
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <div className="font-orbitron text-xs text-white mb-1">{r.reason}</div>
                                <div className="font-rajdhani text-xs text-slate-500">{r.details}</div>
                                <div className="font-rajdhani text-[10px] text-slate-600 mt-1">
                                  By: {r.reportedBy?.nickname || r.reportedBy?.name} → About: {r.reportedAbout?.nickname || r.reportedAbout?.name}
                                </div>
                              </div>
                              {!r.resolved && (
                                <button onClick={() => resolveReport(r.id)}
                                  className="font-orbitron text-[9px] px-2 py-1 border border-green-500/30 text-green-400 hover:bg-green-900/20 transition-all flex-shrink-0">
                                  RESOLVE
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tab === 'Arena' && (
                    <div className="bg-[#0d0017] border border-purple-500/20 p-5">
                      <h3 className="font-orbitron text-xs text-white tracking-widest uppercase mb-4">Arena Events ({data.challenges?.length || 0})</h3>
                      <div className="flex flex-col gap-2">
                        {(data.challenges || []).length === 0 ? (
                          <p className="font-rajdhani text-slate-600 text-sm text-center py-6">No arena events.</p>
                        ) : (data.challenges || []).map((e:any) => (
                          <div key={e.id} className="border border-purple-500/10 p-3">
                            <div className="font-orbitron text-xs text-white">{e.title}</div>
                            <div className="flex gap-2 mt-1">
                              <span className="font-orbitron text-[9px] text-purple-400/70">{e.type}</span>
                              <span className="font-orbitron text-[9px] text-green-400">+{e.xpReward}XP</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const redirectResult = await requireAuth(context, 'ADMIN')
  if (redirectResult) return redirectResult

  const session = await getServerSession(context.req, context.res, authOptions)
  if (session?.user?.role === 'FOUNDER') {
    return {
      redirect: { destination: '/founder', permanent: false },
    }
  }

  let permissions = null
  try {
    permissions = await prisma.adminPermission.findUnique({
      where: { userId: session.user.id },
    })
  } catch {}

  return {
    props: {
      permissions: permissions ? JSON.parse(JSON.stringify(permissions)) : null,
    },
  }
}
