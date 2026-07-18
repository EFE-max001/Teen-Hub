import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import GlowButton from '@/components/ui/GlowButton'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

// R3F touches WebGL/canvas APIs that don't exist on the server, so this
// must be a client-only import or getServerSideProps below will crash the
// page on every request.
const Scene = dynamic(() => import('@/components/Scene'), { ssr: false })

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

const RANKS = [
  { rank: 'F',   label: 'Initiate',   color: 'text-slate-400',  border: 'border-slate-600/40',  glow: '',                                  desc: 'Unproven. The starting point for every operative.' },
  { rank: 'E',   label: 'Operative',  color: 'text-green-400',  border: 'border-green-600/40',  glow: 'shadow-[0_0_15px_rgba(74,222,128,0.15)]',  desc: 'Proven active. Basic member rights unlocked.' },
  { rank: 'D',   label: 'Specialist', color: 'text-blue-400',   border: 'border-blue-600/40',   glow: 'shadow-[0_0_15px_rgba(96,165,250,0.15)]',  desc: 'Skilled contributor. Quest access widens.' },
  { rank: 'C',   label: 'Vanguard',   color: 'text-yellow-400', border: 'border-yellow-600/40', glow: 'shadow-[0_0_15px_rgba(250,204,21,0.15)]',  desc: 'Dependable force. High-value tasks open.' },
  { rank: 'B',   label: 'Commander',  color: 'text-orange-400', border: 'border-orange-500/50', glow: 'shadow-[0_0_15px_rgba(251,146,60,0.2)]',   desc: 'Strong track record. Leadership adjacent.' },
  { rank: 'A',   label: 'Elite',      color: 'text-purple-400', border: 'border-purple-500/60', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.25)]',  desc: 'Top performer. Guild\'s most trusted operatives.' },
  { rank: 'S',   label: 'Sovereign',  color: 'text-pink-400',   border: 'border-pink-500/60',   glow: 'shadow-[0_0_20px_rgba(236,72,153,0.25)]',  desc: 'Living legend. Rare. Chosen by the council.' },
  { rank: 'SS',  label: 'Warlord',    color: 'text-red-400',    border: 'border-red-500/60',    glow: 'shadow-[0_0_25px_rgba(239,68,68,0.3)]',    desc: 'Mythic performer. One of the guild\'s pillars.' },
  { rank: 'SSS', label: 'Mythic',     color: 'text-amber-300',  border: 'border-amber-400/70',  glow: 'shadow-[0_0_30px_rgba(252,211,77,0.35)]',  desc: 'Ultra-rare. The absolute pinnacle. Unchallengeable.' },
]

const STEPS = [
  { step: '01', title: 'Create Account',    icon: '◈', desc: 'Register your operative profile. Your identity in the guild network starts here.' },
  { step: '02', title: 'Submit Application', icon: '◉', desc: 'Fill out the guild application. The Council reviews every submission personally.' },
  { step: '03', title: 'Complete Trial',     icon: '◍', desc: 'Assigned a real task. Scored on quality, speed, reliability, and attitude.' },
  { step: '04', title: 'Rise Through Ranks', icon: '◎', desc: 'Accepted into the guild. Earn XP, complete quests, and climb from F to SSS.' },
]

const QUEST_TYPES = [
  { icon: '◈', label: 'Graphic Design',  color: 'text-purple-400', desc: 'Logos, banners, social visuals, brand identity work'  },
  { icon: '◉', label: 'Writing & Copy',  color: 'text-blue-400',   desc: 'Captions, articles, scripts, ad copy, blog posts'      },
  { icon: '◍', label: 'Video Editing',   color: 'text-pink-400',   desc: 'Reels, short-form promos, YouTube edits, transitions'  },
  { icon: '◎', label: 'Research Ops',    color: 'text-yellow-400', desc: 'Market data, competitor analysis, sourcing, reports'   },
  { icon: '◆', label: 'Web Operations',  color: 'text-green-400',  desc: 'Site updates, QA testing, CMS management, bug reports' },
  { icon: '◇', label: 'Social Media',    color: 'text-orange-400', desc: 'Content planning, scheduling, community growth'        },
]

const AI_FEATURES = [
  { title: 'Trial Evaluation',  desc: 'SENTINEL AI scores every trial submission — quality, reliability, attitude — and generates a recommendation for the council.' },
  { title: 'Trust Scoring',     desc: 'Every action is logged. Quest completions, abandonments, warnings. Your trust score is calculated in real-time.' },
  { title: 'Risk Detection',    desc: 'Anomaly detection flags ghosting patterns, quality drops, and suspicious behavior before it becomes a problem.' },
  { title: 'Achievement Engine',desc: 'AI monitors member progress and auto-awards achievements the moment you hit a qualifying milestone.' },
]

export default function LandingPage() {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <>
      <Head>
        <title>QuestHub Guild — Elite Teen Talent Platform</title>
        <meta name="description" content="An elite guild for talented teens. Apply, survive the trial, rank up, and complete real quests that build a reputation that matters." />
      </Head>

      <div className="min-h-screen bg-transparent flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">

          {/* ── HERO ──────────────────────────────────────────── */}
          <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-20 bg-[#03060A]">
            {/* Living Digital Forest — portal, tech butterflies, 3D grid and
                stars. Replaces the old flat CSS grid + gradient orbs; this
                supplies the background color and all ambient motion now. */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <Scene reducedMotion={reducedMotion} />
            </div>

            {/* Accent lines */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-purple-500/40 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-t from-purple-500/40 to-transparent pointer-events-none" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-px w-32 bg-gradient-to-r from-transparent to-purple-500/30 pointer-events-none" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-px w-32 bg-gradient-to-l from-transparent to-purple-500/30 pointer-events-none" />

            <div className="relative z-10 text-center max-w-5xl mx-auto w-full">

              {/* Status badge */}
              <div className="inline-flex items-center gap-3 mb-8 border border-purple-500/25 bg-purple-950/30 px-4 py-2 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="font-orbitron text-[9px] sm:text-[10px] text-slate-400 tracking-[0.35em] uppercase">Guild Network Online</span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>

              {/* Main heading */}
              <div className="mb-4">
                <h1 className="font-orbitron font-black leading-none tracking-tight">
                  <span className="block text-4xl sm:text-6xl md:text-8xl lg:text-9xl text-white">
                    QUEST<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500">HUB</span>
                  </span>
                  <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-slate-500 tracking-[0.25em] mt-1">
                    G U I L D
                  </span>
                </h1>
              </div>

              {/* Divider line */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="flex-1 max-w-24 h-px bg-gradient-to-r from-transparent to-purple-500/50" />
                <span className="font-orbitron text-[9px] text-purple-400/70 tracking-[0.4em] uppercase">Elite Talent Platform</span>
                <div className="flex-1 max-w-24 h-px bg-gradient-to-l from-transparent to-purple-500/50" />
              </div>

              {/* Subtitle */}
              <p className="font-rajdhani text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed px-2">
                An elite guild for talented teens. Not everyone gets in — you have to earn it.
                Apply, survive the trial, rank up from{' '}
                <span className="text-slate-300 font-semibold">F to SSS</span>, and complete real operations
                that build a reputation that actually matters.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-14">
                <Link href="/apply">
                  <GlowButton size="lg" variant="primary" className="w-48 sm:w-auto animate-pulse-glow">
                    Apply to Join
                  </GlowButton>
                </Link>
                <Link href="/auth/register">
                  <GlowButton size="lg" variant="secondary" className="w-48 sm:w-auto">
                    Create Account
                  </GlowButton>
                </Link>
                <Link href="/auth/login">
                  <GlowButton size="lg" variant="ghost" className="w-48 sm:w-auto">
                    Sign In
                  </GlowButton>
                </Link>
              </div>

              {/* Stats bar */}
              <div className="inline-flex flex-col sm:flex-row items-center gap-0 sm:gap-px border border-purple-500/20 overflow-hidden">
                {[
                  ['9', 'Rank Tiers'],
                  ['∞', 'Operations'],
                  ['AI', 'Powered'],
                  ['0', 'BS Tolerated'],
                ].map(([val, label], i) => (
                  <div
                    key={label}
                    className="flex flex-row sm:flex-col items-center sm:items-center gap-3 sm:gap-0.5 px-6 sm:px-8 py-3 sm:py-4 border-b sm:border-b-0 sm:border-r border-purple-500/15 last:border-0 w-full sm:w-auto"
                  >
                    <span className="font-orbitron font-black text-lg sm:text-2xl text-purple-300 glow-text">{val}</span>
                    <span className="font-rajdhani text-[10px] text-slate-600 tracking-[0.25em] uppercase">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
              <div className="w-px h-8 bg-gradient-to-b from-purple-500/60 to-transparent" />
              <div className="w-1.5 h-1.5 bg-purple-400 rotate-45" />
            </div>
          </section>

          {/* ── TICKER ──────────────────────────────────────────── */}
          <div className="border-y border-purple-500/20 bg-purple-950/20 overflow-hidden py-2.5">
            <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
              {Array.from({ length: 3 }).flatMap(() => [
                '◈ GRAPHIC DESIGN OPS AVAILABLE',
                '◉ AI TRIAL EVALUATION ACTIVE',
                '◍ TRUST ENGINE MONITORING',
                '◎ QUEST BOARD LIVE',
                '◆ NEW RANK TIERS: SS AND SSS',
                '◇ SENTINEL AI ONLINE',
                '◈ ZERO TOLERANCE FOR GHOSTING',
                '◉ MERIT-BASED PROMOTIONS ONLY',
              ]).map((text, i) => (
                <span key={i} className="font-orbitron text-[9px] text-purple-400/60 tracking-[0.3em] uppercase flex-shrink-0">
                  {text}
                </span>
              ))}
            </div>
          </div>

          {/* ── HOW IT WORKS ──────────────────────────────────────── */}
          <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 relative">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 sm:mb-16">
                <span className="font-orbitron text-[9px] text-purple-400 tracking-[0.5em] uppercase">Initiation Protocol</span>
                <h2 className="font-orbitron font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-4">
                  THE PATH FORWARD
                </h2>
                <div className="w-20 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {STEPS.map((item, i) => (
                  <div key={i} className="relative">
                    {/* Connector line */}
                    {i < STEPS.length - 1 && (
                      <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-purple-500/30 to-transparent z-10 translate-x-[-50%]" style={{ width: 'calc(100% - 2.5rem)', left: '100%', transform: 'none', right: '-50%' }} />
                    )}
                    <div className="relative bg-black/60 border border-purple-500/20 p-5 sm:p-6 group hover:border-purple-500/50 hover:bg-purple-950/20 transition-all duration-300">
                      <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-500/50 group-hover:border-purple-400 transition-colors" />
                      <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-500/50 group-hover:border-purple-400 transition-colors" />

                      <div className="font-orbitron font-black text-5xl sm:text-6xl text-purple-500/15 group-hover:text-purple-500/30 transition-colors mb-3 leading-none">
                        {item.step}
                      </div>
                      <div className="font-orbitron text-purple-400/60 text-xl mb-2">{item.icon}</div>
                      <h3 className="font-orbitron font-bold text-sm sm:text-base text-white mb-2">{item.title}</h3>
                      <p className="font-rajdhani text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── RANK SYSTEM ──────────────────────────────────────── */}
          <section id="ranks" className="py-20 sm:py-28 px-4 sm:px-6 bg-black/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-purple-glow opacity-20 pointer-events-none" />
            <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center mb-12 sm:mb-16">
                <span className="font-orbitron text-[9px] text-purple-400 tracking-[0.5em] uppercase">Power Structure</span>
                <h2 className="font-orbitron font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-4">
                  THE HIERARCHY
                </h2>
                <div className="w-20 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto mb-4" />
                <p className="font-rajdhani text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
                  Nine tiers of power. F to SSS. Every rank is earned — never given.
                  SS and SSS are reserved for the legends.
                </p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-3">
                {RANKS.map((r, i) => (
                  <div
                    key={r.rank}
                    className={`relative bg-black/80 border ${r.border} ${r.glow} p-3 sm:p-4 text-center group hover:scale-105 transition-all duration-300 cursor-default`}
                    title={`${r.label}: ${r.desc}`}
                  >
                    <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-20" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-20" />
                    <div className={`font-orbitron font-black text-xl sm:text-2xl md:text-3xl ${r.color} mb-0.5 group-hover:glow-text transition-all`}>
                      {r.rank}
                    </div>
                    <div className={`font-orbitron text-[7px] sm:text-[8px] ${r.color} opacity-60 tracking-widest hidden sm:block`}>
                      {r.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Rank descriptions on hover — shown below on mobile */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {RANKS.slice(6).map((r) => (
                  <div key={r.rank} className={`border ${r.border} bg-black/60 p-3 flex items-start gap-3`}>
                    <span className={`font-orbitron font-black text-lg ${r.color} flex-shrink-0`}>{r.rank}</span>
                    <div>
                      <div className={`font-orbitron text-xs ${r.color} mb-0.5`}>{r.label}</div>
                      <div className="font-rajdhani text-slate-500 text-xs">{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── SENTINEL AI ──────────────────────────────────────── */}
          <section className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent pointer-events-none" />

            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                {/* Left */}
                <div>
                  <span className="font-orbitron text-[9px] text-purple-400 tracking-[0.5em] uppercase">AI Automation Layer</span>
                  <h2 className="font-orbitron font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-4">
                    SENTINEL AI
                  </h2>
                  <div className="w-20 h-px bg-gradient-to-r from-purple-500 to-transparent mb-6" />
                  <p className="font-rajdhani text-slate-400 text-base sm:text-lg leading-relaxed mb-6">
                    Every operative is watched by SENTINEL — our AI layer that scores trials,
                    tracks trust, detects risk, and awards achievements in real-time.
                    You cannot fake your way to the top.
                  </p>
                  <div className="bg-black/60 border border-purple-500/20 p-4 font-mono text-xs">
                    <div className="text-green-400/80 mb-1">{'>'} SENTINEL.evaluate(trial_submission)</div>
                    <div className="text-slate-500 mb-1">{'>'} Scoring quality... reliability... attitude...</div>
                    <div className="text-purple-400 mb-1">{'>'} Trust delta: <span className="text-green-400">+12pts</span></div>
                    <div className="text-slate-500">{'>'} Recommendation: <span className="text-green-400">ACCEPT</span></div>
                  </div>
                </div>

                {/* Right */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {AI_FEATURES.map((f, i) => (
                    <div key={i} className="relative bg-black/60 border border-purple-500/20 p-4 sm:p-5 group hover:border-purple-400/50 transition-all duration-300">
                      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-purple-500/40 group-hover:border-purple-400 transition-colors" />
                      <div className="font-orbitron font-bold text-xs sm:text-sm text-purple-400 mb-2">{f.title}</div>
                      <p className="font-rajdhani text-slate-500 text-xs sm:text-sm leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── ARENA / GHOST PROTOCOL / SENTINEL GRID ──────────────── */}
          <section id="arena" className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden bg-black/30">
            <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
            <div className="max-w-6xl mx-auto relative z-10">
              <div className="text-center mb-12 sm:mb-16">
                <span className="font-orbitron text-[9px] text-purple-400 tracking-[0.5em] uppercase">Beyond The Trial</span>
                <h2 className="font-orbitron font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-4">
                  THE PROTOCOLS
                </h2>
                <div className="w-20 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto mb-4" />
                <p className="font-rajdhani text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
                  Compete, socialize, and watch the Grid come alive around you.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                <div className="relative bg-black/60 border border-purple-500/20 p-6 group hover:border-amber-400/50 transition-all duration-300 overflow-hidden">
                  <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500/40 group-hover:border-amber-400 transition-colors" />
                  <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500/40 group-hover:border-amber-400 transition-colors" />
                  <div className="text-3xl mb-3">🕹️</div>
                  <h3 className="font-orbitron font-bold text-sm sm:text-base text-amber-400 mb-2 tracking-widest">ARENA PROTOCOL</h3>
                  <p className="font-rajdhani text-slate-500 text-sm leading-relaxed">
                    A structured mini-game engine — logic, typing, quiz, creative and social
                    challenges, all scored by AI. Rotating daily challenge, live leaderboard, real XP.
                  </p>
                </div>

                <div className="relative bg-black/60 border border-purple-500/20 p-6 group hover:border-purple-400/50 transition-all duration-300 overflow-hidden">
                  <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-500/40 group-hover:border-purple-400 transition-colors" />
                  <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-500/40 group-hover:border-purple-400 transition-colors" />
                  <div className="text-3xl mb-3">👻</div>
                  <h3 className="font-orbitron font-bold text-sm sm:text-base text-purple-400 mb-2 tracking-widest">GHOST PROTOCOL</h3>
                  <p className="font-rajdhani text-slate-500 text-sm leading-relaxed">
                    Party games live in Guild Chat: Truth or Dare, Would You Rather, Two Truths
                    and a Lie — triggered instantly with slash commands like <span className="text-purple-300">/party</span>.
                  </p>
                </div>

                <div className="relative bg-black/60 border border-purple-500/20 p-6 group hover:border-cyan-400/50 transition-all duration-300 overflow-hidden">
                  <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/40 group-hover:border-cyan-400 transition-colors" />
                  <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/40 group-hover:border-cyan-400 transition-colors" />
                  <div className="text-3xl mb-3">◈</div>
                  <h3 className="font-orbitron font-bold text-sm sm:text-base text-cyan-400 mb-2 tracking-widest">SENTINEL GRID</h3>
                  <p className="font-rajdhani text-slate-500 text-sm leading-relaxed">
                    The live perspective grid rendering beneath every screen — a signal that
                    the Sentinel network is always watching, always active.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── QUEST TYPES ──────────────────────────────────────── */}
          <section id="quests" className="py-20 sm:py-28 px-4 sm:px-6 bg-black/30 relative">
            <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
            <div className="max-w-6xl mx-auto relative z-10">
              <div className="text-center mb-12 sm:mb-16">
                <span className="font-orbitron text-[9px] text-purple-400 tracking-[0.5em] uppercase">Active Operations</span>
                <h2 className="font-orbitron font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-4">
                  QUEST TYPES
                </h2>
                <div className="w-20 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto mb-4" />
                <p className="font-rajdhani text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
                  Real work. Real skills. Some quests pay cash. All quests pay XP.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {QUEST_TYPES.map((q, i) => (
                  <div
                    key={i}
                    className="relative bg-black/60 border border-purple-500/15 p-5 sm:p-6 group hover:border-purple-400/40 hover:bg-purple-950/10 transition-all duration-300"
                  >
                    <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-500/30 group-hover:border-purple-400 transition-colors" />
                    <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-500/30 group-hover:border-purple-400 transition-colors" />
                    <div className={`font-orbitron text-3xl ${q.color} mb-3 group-hover:glow-text transition-all`}>{q.icon}</div>
                    <h3 className={`font-orbitron font-bold text-sm sm:text-base ${q.color} mb-2`}>{q.label}</h3>
                    <p className="font-rajdhani text-slate-500 text-sm leading-relaxed">{q.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── LEGITIMACY ──────────────────────────────────────── */}
          <section className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-purple-glow opacity-10 pointer-events-none" />
            <div className="max-w-5xl mx-auto relative z-10">
              <div className="text-center mb-10">
                <span className="font-orbitron text-[9px] text-purple-400 tracking-[0.5em] uppercase">Legitimacy</span>
                <h2 className="font-orbitron font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-4">
                  THIS IS REAL.
                </h2>
                <div className="w-20 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto mb-4" />
                <p className="font-rajdhani text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                  QuestHub Guild is not a game. Quests are real work with real consequences.
                  Every action is logged. Every rank is earned. The council is always watching.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                {[
                  { icon: '🛡️', title: 'Admin Moderated',    desc: 'Every trial, quest, and submission reviewed by real admins — not automated bots.' },
                  { icon: '⚡',  title: 'Merit-Only Ranking', desc: 'No shortcuts. No exceptions. Every rank is earned through consistent, quality output.' },
                  { icon: '🔒', title: 'Zero Tolerance',      desc: 'Ghosting, dishonesty, and low quality are actioned instantly. Warnings stack. Bans happen.' },
                ].map((item, i) => (
                  <div key={i} className="relative bg-black/60 border border-purple-500/20 p-5 sm:p-6 group hover:border-purple-400/40 transition-all duration-300">
                    <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-purple-500/30" />
                    <div className="text-2xl sm:text-3xl mb-3">{item.icon}</div>
                    <h3 className="font-orbitron font-bold text-sm text-white mb-2">{item.title}</h3>
                    <p className="font-rajdhani text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FINAL CTA ──────────────────────────────────────── */}
          <section className="py-24 sm:py-32 px-4 sm:px-6 relative overflow-hidden bg-black/50">
            <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
            <div className="absolute inset-0 bg-purple-glow opacity-20 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent pointer-events-none" />

            <div className="max-w-3xl mx-auto text-center relative z-10">
              <span className="font-orbitron text-[9px] text-purple-400 tracking-[0.5em] uppercase block mb-4">The Question Is Simple</span>
              <h2 className="font-orbitron font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-4 leading-none">
                DO YOU HAVE
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 mt-1">
                  WHAT IT TAKES?
                </span>
              </h2>
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto my-6" />
              <p className="font-rajdhani text-slate-400 text-sm sm:text-base md:text-lg mb-10 leading-relaxed">
                Create your account, submit your application, and let the Guild Council decide.
                Most applicants don't make it. The ones who do don't forget it.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/apply">
                  <GlowButton size="lg" variant="primary" className="w-52 sm:w-auto animate-pulse-glow">
                    Apply to the Guild
                  </GlowButton>
                </Link>
                <Link href="/auth/register">
                  <GlowButton size="lg" variant="secondary" className="w-52 sm:w-auto">
                    Create Account First
                  </GlowButton>
                </Link>
              </div>
            </div>
          </section>

        </main>
        <Footer />
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (session) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }
  return { props: {} }
}