// Teen-Hub/pages/auth/register.tsx
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import GlowButton from '@/components/ui/GlowButton'
import { GlowInput } from '@/components/ui/GlowInput'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    nickname: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      return setError('Passwords do not match.')
    }
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters.')
    }
    if (!form.name || !form.nickname || !form.email) {
      return setError('All fields are required.')
    }

    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        nickname: form.nickname,
        email: form.email,
        password: form.password,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setLoading(false)
      setError(data.error || 'Registration failed.')
      return
    }

    // Auto sign in after registration
    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    setLoading(false)

    if (result?.ok) {
      router.push('/dashboard')
    } else {
      router.push('/auth/login?registered=true')
    }
  }

  return (
    <>
      <Head>
        <title>Register — QuestHub Guild</title>
      </Head>

      <div className="min-h-screen bg-portal-black grid-bg flex items-center justify-center px-4 py-12">

        {/* Background glow */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-portal-emerald/[0.05] rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-portal-emerald/[0.03] rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md z-10">

          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex flex-col items-center gap-2 mb-6 group">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 bg-portal-emerald/20 rotate-45 group-hover:bg-portal-emerald/30 transition-all duration-300" />
                <div className="absolute inset-1.5 bg-portal-emerald/10 rotate-45" />
                <span className="absolute inset-0 flex items-center justify-center text-portal-emerald font-cinzel font-black text-lg">Q</span>
              </div>
            </Link>

            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-10 h-px bg-portal-emerald/30" />
              <span className="font-cinzel text-[10px] text-portal-emerald tracking-[0.4em] uppercase">
                New Operative
              </span>
              <div className="w-10 h-px bg-portal-emerald/30" />
            </div>

            <h1 className="font-cinzel font-black text-3xl sm:text-4xl text-white glow-text mb-2">
              ENROLL
            </h1>
            <p className="font-cormorant text-slate-500 text-sm tracking-wider">
              Create your operative account to begin your guild journey
            </p>
          </div>

          {/* Card */}
          <div className="relative crystal-glass bg-portal-black/70 backdrop-blur-md rounded-2xl glow-border p-6 sm:p-8">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-portal-emerald/50 to-transparent" />

            {/* Note */}
            <div className="bg-portal-emerald/[0.06] border border-portal-emerald/20 px-4 py-3 mb-6">
              <p className="font-cormorant text-portal-emerald/80 text-xs leading-relaxed">
                ◈ This creates your account. To <span className="text-portal-moonlight font-semibold">join the guild</span> as a member, you must also{' '}
                <Link href="/apply" className="text-portal-emerald hover:text-portal-emerald underline underline-offset-2">
                  submit an application
                </Link>{' '}
                after registering.
              </p>
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <GlowInput
                label="Full Name *"
                type="text"
                placeholder="Your real name"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                required
                autoComplete="name"
              />

              <GlowInput
                label="Operative Nickname *"
                type="text"
                placeholder="Your unique guild codename"
                value={form.nickname}
                onChange={e => update('nickname', e.target.value)}
                required
                hint="This is your public identity in the guild. Choose wisely."
              />

              <GlowInput
                label="Email Address *"
                type="email"
                placeholder="operative@email.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                required
                autoComplete="email"
              />

              <GlowInput
                label="Password *"
                type="password"
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                required
                autoComplete="new-password"
              />

              <GlowInput
                label="Confirm Password *"
                type="password"
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={e => update('confirm', e.target.value)}
                required
                autoComplete="new-password"
              />

              {error && (
                <div className="bg-red-900/20 border border-red-500/30 px-4 py-3 flex items-center gap-2">
                  <span className="text-red-400 text-sm flex-shrink-0">⚠</span>
                  <p className="font-cormorant text-red-300 text-sm">{error}</p>
                </div>
              )}

              <GlowButton
                type="submit"
                size="lg"
                loading={loading}
                className="w-full mt-2"
              >
                Create Operative Account
              </GlowButton>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-portal-emerald/10" />
              <span className="font-cormorant text-xs text-slate-700 tracking-widest uppercase">or</span>
              <div className="flex-1 h-px bg-portal-emerald/10" />
            </div>

            <div className="text-center">
              <p className="font-cormorant text-slate-600 text-sm">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-portal-emerald hover:text-portal-emerald transition-colors font-semibold"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link
              href="/"
              className="font-cormorant text-slate-700 text-xs hover:text-slate-500 tracking-[0.2em] uppercase transition-colors"
            >
              ← Return to Base
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="font-cinzel text-[9px] text-slate-700 tracking-[0.3em] uppercase">
              Guild Network Online
            </span>
          </div>
        </div>
      </div>
    </>
  )
}