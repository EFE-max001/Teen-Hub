import { useState, useEffect, ChangeEvent } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import RankBadge from '@/components/ui/RankBadge'
import XPBar from '@/components/ui/XPBar'
import StatusChip from '@/components/ui/StatusChip'
import GlowButton from '@/components/ui/GlowButton'
import { GlowInput, GlowTextarea } from '@/components/ui/GlowInput'

const RANK_LEVEL: Record<string, number> = { F:0,E:1,D:2,C:3,B:4,A:5,S:6,SS:7,SSS:8 }

const VERIFICATION_REQUIREMENTS: Record<string, { label: string; type: string; color: string; minRank: string }[]> = {
  F:   [],
  E:   [],
  D:   [{ label: 'Social Verification', type: 'social',   color: 'text-blue-400',   minRank: 'D' }],
  C:   [{ label: 'Location Verification',type:'location', color: 'text-yellow-400', minRank: 'C' }],
  B:   [{ label: 'Face Verification',    type: 'face',    color: 'text-orange-400', minRank: 'B' }],
  A:   [{ label: 'Identity Verification',type:'identity', color: 'text-red-400',    minRank: 'A' }],
  S:   [],SS:[],SSS:[],
}

const TRUST_COLORS: Record<string, string> = {
  ELITE: 'text-amber-300',
  TRUSTED: 'text-green-400',
  RISING: 'text-blue-400',
  NEW: 'text-slate-400',
  WATCH: 'text-orange-400',
  RISK: 'text-red-400',
}

const WORK_STYLES = ['Remote', 'Flexible hours', 'Set schedule', 'Project-based', 'Async']
const TASK_TYPES = ['Design', 'Video Editing', 'Copywriting', 'Social Media', 'Music', 'Web Dev', 'Animation', 'Other']
const TIMEZONES = ['UTC', 'UTC+1', 'UTC+2', 'UTC+3', 'UTC+5:30', 'UTC+8', 'UTC+9', 'UTC+10', 'UTC-5', 'UTC-6', 'UTC-8']

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [trustData, setTrustData] = useState<any>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  const [titles, setTitles] = useState<any[]>([])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [verifyMsg, setVerifyMsg] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  const [form, setForm] = useState({
    bio: '', portfolioUrl: '',
    timezone: '', country: '', workStyle: '',
    preferredTaskType: '', experience: '', availabilityText: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (session) loadAll()
  }, [session])

  async function loadAll() {
    const [u, t, a, ti] = await Promise.all([
      fetch('/api/user/me').then(r => r.json()).catch(() => null),
      fetch('/api/trust').then(r => r.json()).catch(() => null),
      fetch('/api/achievements').then(r => r.json()).catch(() => ({ achievements: [] })),
      fetch('/api/titles').then(r => r.json()).catch(() => ({ titles: [] })),
    ])
    if (u) {
      setUserData(u)
      setForm({
        bio: u.bio || '',
        portfolioUrl: u.portfolioUrl || '',
        timezone: u.timezone || '',
        country: u.country || '',
        workStyle: u.workStyle || '',
        preferredTaskType: u.preferredTaskType || '',
        experience: u.experience || '',
        availabilityText: u.availabilityText || '',
      })
    }
    if (t) setTrustData(t)
    setAchievements((a.achievements || []).filter((a: any) => a.awardedTo?.length > 0))
    setTitles((ti.titles || []).filter((t: any) => t.awardedTo?.length > 0))
  }

  async function saveProfile() {
    setSaving(true)
    await fetch('/api/profile/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setEditing(false)
    await loadAll()
  }

  function handleAvatarSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setAvatarError('Please choose an image file.'); return }
    setAvatarError('')
    setUploadingAvatar(true)

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = async () => {
        // Resize down to a max 256x256 square before storing — keeps the
        // resulting data URL small enough to live directly on the User row.
        const size = 256
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) { setUploadingAvatar(false); return }

        const scale = Math.max(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)

        const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
        if (dataUrl.length > 600_000) {
          setAvatarError('Image is still too large after resizing — try a simpler picture.')
          setUploadingAvatar(false)
          return
        }

        const res = await fetch('/api/profile/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profilePicUrl: dataUrl }),
        })
        setUploadingAvatar(false)
        if (!res.ok) { setAvatarError('Upload failed. Try again.'); return }
        await loadAll()
      }
      img.onerror = () => { setUploadingAvatar(false); setAvatarError('Could not read that image.') }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  async function submitVerification(type: string) {
    setVerifying(type)
    const r = await fetch('/api/profile/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
    const d = await r.json()
    setVerifying(null)
    setVerifyMsg(r.ok ? `${type} verification submitted for review.` : d.error)
    setTimeout(() => setVerifyMsg(''), 4000)
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

  const rank = userData.rank || 'F'
  const rankNum = RANK_LEVEL[rank] || 0
  const activeTitle = titles.find(t => t.awardedTo[0]?.active)

  return (
    <>
      <Head><title>My Profile — QuestHub Guild</title></Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto flex flex-col gap-5">

          {/* Profile hero card */}
          <div className="relative bg-[#0d0017] border border-purple-500/20 p-5 sm:p-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent pointer-events-none" />
            <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-purple-500/50" />
            <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-purple-500/50" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start gap-5">
              <div className="relative flex-shrink-0 group">
                <label className="cursor-pointer block">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} disabled={uploadingAvatar} />
                  {userData.profilePicUrl ? (
                    <img src={userData.profilePicUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-purple-500/40" />
                  ) : (
                    <RankBadge rank={userData.rank} size="lg" showLabel />
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="font-orbitron text-[9px] text-white text-center px-1">{uploadingAvatar ? '...' : 'CHANGE'}</span>
                  </div>
                </label>
                {avatarError && <p className="font-rajdhani text-[10px] text-red-400 mt-1 max-w-[90px] text-center">{avatarError}</p>}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <StatusChip status={userData.status} size="sm" />
                  <StatusChip status={userData.role.replace(/_/g, ' ')} size="sm" />
                </div>
                <h1 className="font-orbitron font-black text-xl sm:text-2xl text-white mb-0.5">
                  {userData.nickname}
                </h1>
                {activeTitle && (
                  <p className="font-rajdhani text-purple-400 text-sm italic mb-1">"{activeTitle.name}"</p>
                )}
                <p className="font-rajdhani text-slate-500 text-sm mb-4">{userData.name} · {userData.email}</p>
                <XPBar xp={userData.xp} rank={userData.rank} showNumbers />
              </div>

              {/* Trust score */}
              {trustData && (
                <div className="flex-shrink-0 text-center border border-purple-500/20 px-4 py-3 bg-black/30">
                  <div className="font-orbitron text-[9px] text-purple-400/60 tracking-widest uppercase mb-1">Trust</div>
                  <div className="font-orbitron font-black text-2xl text-white">{trustData.trustScore}</div>
                  <div className={`font-orbitron text-[10px] tracking-widest mt-1 ${TRUST_COLORS[trustData.trustLevel] || 'text-slate-400'}`}>
                    {trustData.trustLevel}
                  </div>
                </div>
              )}
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

          {/* Achievements & Titles preview */}
          {(achievements.length > 0 || titles.length > 0) && (
            <div className="bg-[#0d0017] border border-purple-500/20 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-orbitron font-bold text-sm text-white tracking-widest uppercase">Honours</h2>
                <Link href="/dashboard/achievements" className="font-orbitron text-[10px] text-purple-400 hover:text-purple-300 tracking-widest">VIEW ALL →</Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {achievements.slice(0, 4).map((a: any) => (
                  <div key={a.id} className="flex items-center gap-1.5 border border-purple-500/20 px-2 py-1">
                    <span className="text-sm">{a.icon}</span>
                    <span className="font-orbitron text-[10px] text-purple-300">{a.name}</span>
                  </div>
                ))}
                {titles.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-1.5 border border-amber-500/20 px-2 py-1">
                    <span className="text-sm">{t.icon}</span>
                    <span className="font-orbitron text-[10px] text-amber-300">{t.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About — editable */}
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
                <GlowTextarea label="Bio" placeholder="Tell the guild about yourself..." rows={4}
                  value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
                <GlowInput label="Portfolio / Website" placeholder="https://..."
                  value={form.portfolioUrl} onChange={e => setForm(f => ({ ...f, portfolioUrl: e.target.value }))} />

                <div className="border-t border-purple-500/10 pt-4">
                  <p className="font-orbitron text-[9px] text-purple-400/60 tracking-widest uppercase mb-3">Extended Profile</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-orbitron text-[9px] text-purple-400/60 tracking-widest uppercase block mb-1.5">Timezone</label>
                      <select value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                        className="w-full bg-black/50 border border-purple-500/25 text-slate-200 text-sm font-rajdhani px-3 py-2.5 focus:outline-none focus:border-purple-400/70">
                        <option value="">Select timezone</option>
                        {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <GlowInput label="Country" placeholder="e.g. United States"
                      value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
                    <div>
                      <label className="font-orbitron text-[9px] text-purple-400/60 tracking-widest uppercase block mb-1.5">Work Style</label>
                      <select value={form.workStyle} onChange={e => setForm(f => ({ ...f, workStyle: e.target.value }))}
                        className="w-full bg-black/50 border border-purple-500/25 text-slate-200 text-sm font-rajdhani px-3 py-2.5 focus:outline-none focus:border-purple-400/70">
                        <option value="">Select work style</option>
                        {WORK_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="font-orbitron text-[9px] text-purple-400/60 tracking-widest uppercase block mb-1.5">Preferred Task Type</label>
                      <select value={form.preferredTaskType} onChange={e => setForm(f => ({ ...f, preferredTaskType: e.target.value }))}
                        className="w-full bg-black/50 border border-purple-500/25 text-slate-200 text-sm font-rajdhani px-3 py-2.5 focus:outline-none focus:border-purple-400/70">
                        <option value="">Select type</option>
                        {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <GlowTextarea label="Experience" placeholder="Describe your experience and background..." rows={3}
                      value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} />
                    <GlowTextarea label="Availability" placeholder="When are you typically available?" rows={3}
                      value={form.availabilityText} onChange={e => setForm(f => ({ ...f, availabilityText: e.target.value }))} />
                  </div>
                </div>

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
              <div className="flex flex-col gap-4">
                <p className="font-rajdhani text-slate-400 text-sm leading-relaxed">
                  {userData.bio || 'No bio set yet.'}
                </p>
                {userData.portfolioUrl && (
                  <a href={userData.portfolioUrl} target="_blank" rel="noopener noreferrer"
                    className="font-rajdhani text-purple-400 hover:text-purple-300 text-sm underline underline-offset-2 transition-colors">
                    {userData.portfolioUrl}
                  </a>
                )}
                {(userData.timezone || userData.country || userData.workStyle || userData.preferredTaskType) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-purple-500/10">
                    {userData.timezone && <div><p className="font-orbitron text-[9px] text-purple-400/60 tracking-widest uppercase">Timezone</p><p className="font-rajdhani text-slate-300 text-sm">{userData.timezone}</p></div>}
                    {userData.country && <div><p className="font-orbitron text-[9px] text-purple-400/60 tracking-widest uppercase">Country</p><p className="font-rajdhani text-slate-300 text-sm">{userData.country}</p></div>}
                    {userData.workStyle && <div><p className="font-orbitron text-[9px] text-purple-400/60 tracking-widest uppercase">Work Style</p><p className="font-rajdhani text-slate-300 text-sm">{userData.workStyle}</p></div>}
                    {userData.preferredTaskType && <div><p className="font-orbitron text-[9px] text-purple-400/60 tracking-widest uppercase">Speciality</p><p className="font-rajdhani text-slate-300 text-sm">{userData.preferredTaskType}</p></div>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Identity Growth System — Trust Ladder */}
          <div className="bg-[#0d0017] border border-purple-500/20 p-5">
            <h2 className="font-orbitron font-bold text-sm text-white tracking-widest uppercase mb-2">Identity & Trust Ladder</h2>
            <p className="font-rajdhani text-slate-600 text-xs mb-4">As you rank up, more verification is required — this increases your trust score, quest access, and payout eligibility.</p>
            {verifyMsg && (
              <div className="bg-purple-900/20 border border-purple-500/30 px-3 py-2 font-rajdhani text-xs text-purple-300 mb-3">{verifyMsg}</div>
            )}
            <div className="flex flex-col gap-2">
              {[
                { rank:'F', label:'Basic Profile',             desc:'Profile pic, bio, skills',             required: false, done: true },
                { rank:'D', label:'Social Verification',       desc:'Link a social profile',                 required: rankNum >= 2, done: userData.socialVerified },
                { rank:'C', label:'Location Verification',     desc:'Confirm your country/region',           required: rankNum >= 3, done: userData.locationVerified },
                { rank:'B', label:'Face Verification',         desc:'Face photo for trusted status',         required: rankNum >= 4, done: userData.faceVerified },
                { rank:'A', label:'Identity Verification',     desc:'Government ID for elite access',        required: rankNum >= 5, done: userData.identityVerified },
              ].map(step => {
                const typeMap: Record<string, string> = { 'Social Verification': 'social', 'Location Verification': 'location', 'Face Verification': 'face', 'Identity Verification': 'identity' }
                const vType = typeMap[step.label]
                return (
                  <div key={step.rank} className={`flex items-center gap-3 p-3 border ${
                    step.done ? 'border-green-500/30 bg-green-900/5' :
                    step.required ? 'border-yellow-500/30 bg-yellow-900/5' :
                    'border-purple-500/10 opacity-50'
                  }`}>
                    <div className={`w-6 h-6 flex items-center justify-center text-xs font-orbitron font-black flex-shrink-0 ${
                      step.done ? 'bg-green-500/20 text-green-400' :
                      step.required ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-800 text-slate-600'
                    }`}>
                      {step.done ? '✓' : step.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-orbitron text-[10px] text-white tracking-widest">{step.label}</p>
                      <p className="font-rajdhani text-xs text-slate-500">{step.desc}</p>
                    </div>
                    {vType && !step.done && step.required && (
                      <button
                        disabled={verifying === vType}
                        onClick={() => submitVerification(vType)}
                        className="font-orbitron text-[9px] tracking-widest px-2 py-1 border border-yellow-500/40 text-yellow-400 hover:bg-yellow-900/20 transition-colors flex-shrink-0"
                      >
                        {verifying === vType ? '...' : 'SUBMIT'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Guild Record */}
          <div className="bg-[#0d0017] border border-purple-500/20 p-5">
            <h2 className="font-orbitron font-bold text-sm text-white tracking-widest uppercase mb-3">Guild Record</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Member Since', value: new Date(userData.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Total XP', value: userData.xp.toLocaleString() },
                { label: 'Current Rank', value: userData.rank },
                { label: 'Trust Score', value: `${trustData?.trustScore ?? userData.trustScore ?? 50}/100` },
                { label: 'Trust Level', value: trustData?.trustLevel ?? userData.trustLevel ?? 'NEW' },
                { label: 'Achievements', value: achievements.length },
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