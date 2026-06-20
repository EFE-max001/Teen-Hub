import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import RankBadge from '@/components/ui/RankBadge'
import XPBar from '@/components/ui/XPBar'
import StatusChip from '@/components/ui/StatusChip'
import GlowButton from '@/components/ui/GlowButton'
import { GlowInput, GlowTextarea } from '@/components/ui/GlowInput'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ bio: '', portfolioUrl: '' })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetch('/api/user/me')
        .then(r => r.json())
        .then(data => {
          setUserData(data)
          setForm({ bio: data.bio || '', portfolioUrl: data.portfolioUrl || '' })
        })
    }
  }, [session])

  async function saveProfile() {
    setSaving(true)
    await fetch('/api/user/update-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setEditing(false)
    const data = await fetch('/api/user/me').then(r => r.json())
    setUserData(data)
  }

  if (!session || !userData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <>
      <Head><title>My Profile — QuestHub Guild</title></Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto flex flex-col gap-5">

          {/* Profile card */}
          <div className="relative bg-[#0d0017] border border-purple-500/20 p-5 sm:p-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent pointer-events-none" />
            <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-purple-500/50" />
            <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-purple-500/50" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start gap-5">
              <RankBadge rank={userData.rank} size="lg" showLabel />

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <StatusChip status={userData.status} size="sm" />
                  <StatusChip status={userData.role.replace('_', ' ')} size="sm" />
                </div>
                <h1 className="font-orbitron font-black text-xl sm:text-2xl text-white mb-0.5">
                  {userData.nickname}
                </h1>
                <p className="font-rajdhani text-slate-500 text-sm mb-4">{userData.name} · {userData.email}</p>
                <XPBar xp={userData.xp} rank={userData.rank} showNumbers />
              </div>
            </div>
          </div>

          {/* Skills */}
          {userData.skills?.length > 0 && (
            <div className="bg-[#0d0017] border border-purple-500/20 p-5">
              <h2 className="font-orbitron font-bold text-sm text-white tracking-widest uppercase mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {userData.skills.map((skill: string) => (
                  <span key={skill} className="px-3 py-1 border border-purple-500/30 text-purple-300 font-rajdhani text-xs tracking-wide bg-purple-900/10">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio + portfolio */}
          <div className="bg-[#0d0017] border border-purple-500/20 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-orbitron font-bold text-sm text-white tracking-widest uppercase">About</h2>
              {!editing && (
                <GlowButton variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  Edit
                </GlowButton>
              )}
            </div>

            {editing ? (
              <div className="flex flex-col gap-4">
                <GlowTextarea
                  label="Bio"
                  placeholder="Tell the guild about yourself..."
                  rows={4}
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                />
                <GlowInput
                  label="Portfolio / Social Link"
                  placeholder="https://..."
                  value={form.portfolioUrl}
                  onChange={e => setForm(f => ({ ...f, portfolioUrl: e.target.value }))}
                />
                <div className="flex gap-3">
                  <GlowButton variant="primary" size="sm" loading={saving} onClick={saveProfile}>
                    Save Changes
                  </GlowButton>
                  <GlowButton variant="ghost" size="sm" onClick={() => setEditing(false)}>
                    Cancel
                  </GlowButton>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="font-rajdhani text-slate-400 text-sm leading-relaxed">
                  {userData.bio || 'No bio set yet.'}
                </p>
                {userData.portfolioUrl && (
                  <a
                    href={userData.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-rajdhani text-purple-400 hover:text-purple-300 text-sm underline underline-offset-2 transition-colors"
                  >
                    {userData.portfolioUrl}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Member since */}
          <div className="bg-[#0d0017] border border-purple-500/20 p-5">
            <h2 className="font-orbitron font-bold text-sm text-white tracking-widest uppercase mb-3">Guild Record</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Member Since', value: new Date(userData.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Total XP', value: userData.xp.toLocaleString() },
                { label: 'Current Rank', value: userData.rank },
              ].map(item => (
                <div key={item.label}>
                  <p className="font-orbitron text-[9px] text-purple-400/60 tracking-widest uppercase mb-1">{item.label}</p>
                  <p className="font-rajdhani font-semibold text-slate-300 text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}