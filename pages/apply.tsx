import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Layout from '@/components/layout/Layout'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import GlowButton from '@/components/ui/GlowButton'
import { GlowInput, GlowTextarea } from '@/components/ui/GlowInput'

const SKILL_OPTIONS = [
  'Graphic Design', 'Video Editing', 'Writing & Copywriting',
  'Social Media', 'Research', 'Web Development',
  'Photography', 'Animation', 'Music/Audio',
  'Data Entry', 'Proofreading', 'Other',
]

const AVAILABILITY_OPTIONS = [
  '1–5 hrs/week', '5–10 hrs/week', '10–20 hrs/week', '20+ hrs/week',
]

export default function ApplyPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    nickname: '',
    dob: '',
    email: '',
    skills: [] as string[],
    strengths: '',
    whyJoin: '',
    availability: '',
    contactInfo: '',
    portfolioUrl: '',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleSkill(skill: string) {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }))
  }

  function validateStep1() {
    if (!form.name || !form.nickname || !form.dob || !form.email) {
      setError('Please fill in all required fields.')
      return false
    }

    const age = Math.floor(
      (Date.now() - new Date(form.dob).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
    )

    if (age < 13 || age > 19) {
      setError('You must be between 13 and 19 years old to apply.')
      return false
    }

    setError('')
    return true
  }

  function validateStep2() {
    if (form.skills.length === 0) {
      setError('Select at least one skill.')
      return false
    }
    if (!form.strengths || !form.whyJoin) {
      setError('Please fill in all required fields.')
      return false
    }
    setError('')
    return true
  }

  async function handleSubmit() {
    if (!form.availability || !form.contactInfo) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    setLoading(true)

    const res = await fetch('/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Submission failed. Try again.')
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <>
        <Head><title>Application Submitted — QuestHub Guild</title></Head>
        <Layout>
          <div className="min-h-screen flex items-center justify-center px-4 grid-bg">
            <div className="relative bg-card-bg glow-border p-8 sm:p-12 max-w-lg w-full text-center">
              <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-purple-500/70" />
              <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-purple-500/70" />
              <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-purple-500/70" />
              <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-purple-500/70" />

              <div className="w-16 h-16 border-2 border-purple-500/60 rotate-45 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl -rotate-45">✓</span>
              </div>

              <h2 className="font-orbitron font-black text-2xl text-white mb-3">
                APPLICATION RECEIVED
              </h2>

              <p className="font-rajdhani text-slate-400 leading-relaxed mb-8">
                Your application has been submitted to the Guild Council. You will be contacted via the details you provided once your trial status has been reviewed.
              </p>

              <div className="bg-black/40 border border-purple-500/20 px-4 py-3 mb-8">
                <p className="font-orbitron text-xs text-purple-400 tracking-widest">
                  STATUS: PENDING REVIEW
                </p>
              </div>

              <Link href="/">
                <GlowButton variant="secondary" size="md">
                  Return to Base
                </GlowButton>
              </Link>
            </div>
          </div>
        </Layout>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Apply — QuestHub Guild</title>
      </Head>

      <Layout>
        <div className="min-h-screen px-4 py-16 grid-bg">
          <div className="max-w-2xl mx-auto">

            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-8 h-px bg-purple-500/50" />
                <span className="font-orbitron text-xs text-purple-400 tracking-[0.3em] uppercase">
                  Enrollment
                </span>
                <div className="w-8 h-px bg-purple-500/50" />
              </div>

              <h1 className="font-orbitron font-black text-3xl sm:text-4xl text-white mb-3">
                APPLY TO THE GUILD
              </h1>

              <p className="font-rajdhani text-slate-400 text-base">
                Applications are reviewed by the Guild Council. Only serious operatives are accepted.
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-3 mb-10">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-8 h-8 border flex items-center justify-center font-orbitron text-xs font-bold transition-all duration-300 ${
                    step === s
                      ? 'border-purple-400 bg-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : step > s
                      ? 'border-purple-600/50 bg-purple-900/20 text-purple-500'
                      : 'border-slate-700 text-slate-600'
                  }`}>
                    {step > s ? '✓' : s}
                  </div>
                  {s < 3 && (
                    <div className={`w-12 sm:w-20 h-px transition-all duration-300 ${
                      step > s ? 'bg-purple-500/60' : 'bg-slate-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step labels */}
            <div className="flex justify-between mb-8 px-1">
              {['Identity', 'Skills', 'Availability'].map((label, i) => (
                <span
                  key={i}
                  className={`font-orbitron text-xs tracking-widest uppercase ${
                    step === i + 1 ? 'text-purple-400' : 'text-slate-600'
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Form card */}
            <div className="relative bg-card-bg glow-border p-6 sm:p-8">
              <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-purple-500/70" />
              <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-purple-500/70" />
              <span className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-purple-500/70" />
              <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-purple-500/70" />

              {/* Step 1 */}
              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <h3 className="font-orbitron font-bold text-white text-sm tracking-widest uppercase border-b border-purple-500/20 pb-3">
                    Identity Clearance
                  </h3>

                  <GlowInput
                    label="Full Name *"
                    placeholder="Your real name"
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                  />

                  <GlowInput
                    label="Operative Nickname *"
                    placeholder="Your guild codename"
                    value={form.nickname}
                    onChange={e => update('nickname', e.target.value)}
                  />

                  {/* DOB Added Here */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-[10px] font-orbitron tracking-[0.25em] text-purple-300/70 uppercase">
                      Date of Birth *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        max={new Date(Date.now() - 13 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        min={new Date(Date.now() - 19 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        value={form.dob}
                        onChange={e => update('dob', e.target.value)}
                        className="w-full bg-black/50 border border-purple-500/25 text-slate-200 text-sm font-rajdhani px-4 py-3 focus:outline-none focus:border-purple-400/70 focus:shadow-[0_0_18px_rgba(168,85,247,0.18)] transition-all duration-200 appearance-none [color-scheme:dark]"
                      />
                      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-purple-500/50 pointer-events-none" />
                      <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-purple-500/50 pointer-events-none" />
                      <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-purple-500/50 pointer-events-none" />
                      <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-purple-500/50 pointer-events-none" />
                    </div>

                    {form.dob && (
                      <p className="text-[11px] text-purple-400/70 font-rajdhani">
                        Age: {Math.floor(
                          (Date.now() - new Date(form.dob).getTime()) /
                          (365.25 * 24 * 60 * 60 * 1000)
                        )} years old
                      </p>
                    )}
                  </div>

                  <GlowInput
                    label="Email Address *"
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                  />
                </div>
              )}

              {/* Step 2 and Step 3 remain exactly the same */}
              {/* Step 2 */}
              {step === 2 && (
                <div className="flex flex-col gap-5">
                  <h3 className="font-orbitron font-bold text-white text-sm tracking-widest uppercase border-b border-purple-500/20 pb-3">
                    Skills & Capabilities
                  </h3>

                  <div>
                    <label className="block font-orbitron text-xs text-purple-300/80 tracking-widest uppercase mb-3">
                      Select Your Skills *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SKILL_OPTIONS.map(skill => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-2 text-xs font-rajdhani font-semibold border transition-all duration-200 text-left ${
                            form.skills.includes(skill)
                              ? 'border-purple-400 bg-purple-500/20 text-purple-200'
                              : 'border-slate-700 text-slate-500 hover:border-purple-500/40 hover:text-slate-300'
                          }`}
                        >
                          {form.skills.includes(skill) ? '✓ ' : ''}{skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  <GlowTextarea
                    label="Core Strengths *"
                    placeholder="What makes you valuable? Be specific."
                    rows={3}
                    value={form.strengths}
                    onChange={e => update('strengths', e.target.value)}
                  />

                  <GlowTextarea
                    label="Why Do You Want to Join? *"
                    placeholder="Convince the Council. Be real, not generic."
                    rows={4}
                    value={form.whyJoin}
                    onChange={e => update('whyJoin', e.target.value)}
                  />
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="flex flex-col gap-5">
                  <h3 className="font-orbitron font-bold text-white text-sm tracking-widest uppercase border-b border-purple-500/20 pb-3">
                    Deployment Details
                  </h3>

                  <div>
                    <label className="block font-orbitron text-xs text-purple-300/80 tracking-widest uppercase mb-3">
                      Weekly Availability *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {AVAILABILITY_OPTIONS.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => update('availability', opt)}
                          className={`px-4 py-3 text-sm font-rajdhani font-semibold border transition-all duration-200 ${
                            form.availability === opt
                              ? 'border-purple-400 bg-purple-500/20 text-purple-200'
                              : 'border-slate-700 text-slate-500 hover:border-purple-500/40 hover:text-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <GlowInput
                    label="Contact Info (WhatsApp / Telegram) *"
                    placeholder="+234... or @username"
                    value={form.contactInfo}
                    onChange={e => update('contactInfo', e.target.value)}
                  />

                  <GlowInput
                    label="Portfolio / Social Link (Optional)"
                    placeholder="https://..."
                    value={form.portfolioUrl}
                    onChange={e => update('portfolioUrl', e.target.value)}
                  />

                  {/* Warning */}
                  <div className="bg-yellow-900/10 border border-yellow-500/20 px-4 py-3">
                    <p className="font-rajdhani text-yellow-400/80 text-xs leading-relaxed">
                      ⚠ Submitting false information will result in permanent disqualification. The Guild Council reviews all applications manually.
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 bg-red-900/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm font-rajdhani">
                  ⚠ {error}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-purple-500/10">
                {step > 1 ? (
                  <GlowButton variant="ghost" size="sm" onClick={() => { setStep(s => s - 1); setError('') }}>
                    ← Back
                  </GlowButton>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <GlowButton
                    variant="primary"
                    size="md"
                    onClick={() => {
                      const valid = step === 1 ? validateStep1() : validateStep2()
                      if (valid) setStep(s => s + 1)
                    }}
                  >
                    Next →
                  </GlowButton>
                ) : (
                  <GlowButton variant="primary" size="md" loading={loading} onClick={handleSubmit}>
                    Submit Application
                  </GlowButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}


// Add this at the bottom of apply.tsx
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  // If not logged in, redirect to register first
  if (!session) {
    return {
      redirect: {
        destination: '/auth/register',
        permanent: false,
      },
    }
  }

  // If already past GUEST (already applied), redirect to dashboard
  if (session.user.role !== 'GUEST') {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    }
  }

  return { props: {} }
}