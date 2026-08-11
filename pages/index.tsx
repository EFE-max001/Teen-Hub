// Teen-Hub/pages/index.tsx
import Head from 'next/head'
import Link from 'next/link'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import GlowButton from '@/components/ui/GlowButton'
import OrnamentDivider from '@/components/ui/OrnamentDivider'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const RANKS = [
  { rank: 'F',   label: 'Initiate',   color: 'text-slate-400',  border: 'border-slate-600/40',  glow: '',                                  desc: 'Unproven. The starting point for every operative.' },
  { rank: 'E',   label: 'Operative',  color: 'text-green-400',  border: 'border-green-600/40',  glow: 'shadow-[0_0_15px_rgba(74,222,128,0.15)]',  desc: 'Proven active. Basic member rights unlocked. First paid quests available.' },
  { rank: 'D',   label: 'Specialist', color: 'text-blue-400',   border: 'border-blue-600/40',   glow: 'shadow-[0_0_15px_rgba(96,165,250,0.15)]',  desc: 'Skilled contributor. Higher-paying quests unlocked.' },
  { rank: 'C',   label: 'Vanguard',   color: 'text-yellow-400', border: 'border-yellow-600/40', glow: 'shadow-[0_0_15px_rgba(250,204,21,0.15)]',  desc: 'Dependable force. Premium quest access. Real earnings begin.' },
  { rank: 'B',   label: 'Commander',  color: 'text-orange-400', border: 'border-orange-500/50', glow: 'shadow-[0_0_15px_rgba(251,146,60,0.2)]',   desc: 'Strong track record. Leadership opportunities. Top-tier pay rates.' },
  { rank: 'A',   label: 'Elite',      color: 'text-portal-emerald', border: 'border-portal-emerald/60', glow: 'shadow-[0_0_20px_rgba(0,255,163,0.25)]',  desc: 'Top performer. Guild\'s most trusted operatives. Maximum earning potential.' },
  { rank: 'S',   label: 'Sovereign',  color: 'text-pink-400',   border: 'border-pink-500/60',   glow: 'shadow-[0_0_20px_rgba(236,72,153,0.25)]',  desc: 'Living legend. Rare. Chosen by the council. Exclusive high-value projects.' },
  { rank: 'SS',  label: 'Warlord',    color: 'text-red-400',    border: 'border-red-500/60',    glow: 'shadow-[0_0_25px_rgba(239,68,68,0.3)]',    desc: 'Mythic performer. One of the guild\'s pillars. Industry connections.' },
  { rank: 'SSS', label: 'Mythic',     color: 'text-amber-300',  border: 'border-amber-400/70',  glow: 'shadow-[0_0_30px_rgba(252,211,77,0.35)]',  desc: 'Ultra-rare. The absolute pinnacle. Career-defining opportunities.' },
]

const STEPS = [
  { step: '01', title: 'Join Free',    icon: '◈', desc: 'Register your operative profile. Your identity in the guild network starts here.' },
  { step: '02', title: 'Submit Application', icon: '◉', desc: 'Fill out the guild application. The Council reviews every submission personally.' },
  { step: '03', title: 'Complete Trial',     icon: '◍', desc: 'Assigned a real task. Scored on quality, speed, reliability, and attitude.' },
  { step: '04', title: 'Earn & Rise', icon: '◎', desc: 'Accepted into the guild. Complete paid quests, earn XP, climb from F to SSS, and build real income.' },
]

const QUEST_TYPES = [
  { icon: '◈', label: 'Graphic Design',  color: 'text-portal-emerald', desc: 'Logos, banners, social visuals, brand identity work — get paid per project'  },
  { icon: '◉', label: 'Writing & Copy',  color: 'text-blue-400',   desc: 'Captions, articles, scripts, ad copy, blog posts — monetize your words'      },
  { icon: '◍', label: 'Video Editing',   color: 'text-pink-400',   desc: 'Reels, short-form promos, YouTube edits, transitions — paid per edit'  },
  { icon: '◎', label: 'Research Ops',    color: 'text-yellow-400', desc: 'Market data, competitor analysis, sourcing, reports — earn while you investigate'   },
  { icon: '◆', label: 'Web Operations',  color: 'text-green-400',  desc: 'Site updates, QA testing, CMS management, bug reports — technical tasks that pay' },
  { icon: '◇', label: 'Social Media',    color: 'text-orange-400', desc: 'Content planning, scheduling, community growth — turn engagement into earnings'        },
]

const AI_FEATURES = [
  { title: 'Quest Matching',    desc: 'AI matches your skills and rank with the best-paying quests. Higher rank = better opportunities.' },
  { title: 'Payment Protection',desc: 'Smart contracts ensure you get paid for completed work. No client ghosting, no unpaid projects.' },
  { title: 'Skill Analytics',   desc: 'Track your growth, identify strengths, and get personalized recommendations to maximize earnings.' },
  { title: 'Auto Achievements', desc: 'AI monitors your progress and awards achievements the moment you hit earning or XP milestones.' },
]

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>QuestHub Guild — Where Talented Teens Connect, Grow & Earn</title>
        <meta name="description" content="QuestHub Guild — where ambitious teens connect, grow, learn skills, join challenges, and take on paid quests. Build your reputation and earn real money." />
      </Head>

      <div className="min-h-screen bg-transparent flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">

          {/* ── HERO ──────────────────────────────────────────── */}
          <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-20">
            {/* Background video removed from here — it was landing on top
                of (not behind) the interactive scene in testing and wasn't
                rendering reliably. Kept only in the one-time PortalIntro
                sequence, where it's confirmed working. */}

            {/* No local background mount here anymore — the Living Digital
                Forest (fog + roots + particles + portal/butterflies/branch)
                is mounted once, globally, via SentinelBackground in
                _app.tsx, so it's consistent across every page instead of
                just this hero, and so there's only ever one WebGL canvas
                running instead of two stacked on top of each other. */}

            {/* Text-legibility vignette — sits between the background and
                the copy (not touching either), so the headline/body text
                stays readable regardless of what's animating behind it,
                without having to dim the whole scene globally. */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 42%, rgba(2,6,4,0.55) 0%, rgba(2,6,4,0.25) 55%, transparent 80%)' }}
            />

            {/* Accent lines */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-portal-emerald/40 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-t from-portal-emerald/40 to-transparent pointer-events-none" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-px w-32 bg-gradient-to-r from-transparent to-portal-gold/30 pointer-events-none" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-px w-32 bg-gradient-to-l from-transparent to-portal-gold/30 pointer-events-none" />

            {/* Legibility scrim — a soft dark radial gradient behind the
                copy block only, not the whole hero. Without this, the
                headline/subtitle have to compete directly with whatever
                the background layer is doing at any given moment, which is
                exactly the "chaotic" problem: text needs guaranteed
                contrast independent of the ambient scene underneath it. */}
            <div
              className="absolute inset-0 z-[5] pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 60% 55% at 50% 45%, rgba(2,6,4,0.72) 0%, rgba(2,6,4,0.35) 55%, transparent 80%)',
              }}
            />

            {/* Hero focal glow — the 3D scene used to center on a portal
                ring; now that's gone (mobile perf + visual clutter), this
                slow-pulsing gradient orb behind the headline replaces it as
                the hero's visual anchor. Pure CSS, no WebGL cost. */}
            <div
              className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] max-w-[90vw] max-h-[90vw] rounded-full pointer-events-none animate-hero-orb-pulse"
              style={{ background: 'radial-gradient(circle, rgba(0,255,163,0.16) 0%, rgba(139,92,246,0.10) 45%, transparent 72%)' }}
            />

            <div className="relative z-10 text-center max-w-5xl mx-auto w-full">

              {/* Status badge */}
              <div className="hero-assemble inline-flex items-center gap-3 mb-8 border border-portal-emerald/25 bg-portal-emerald/[0.06] px-4 py-2 backdrop-blur-sm rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-portal-emerald animate-pulse" />
                <span className="font-cinzel text-[9px] sm:text-[10px] text-portal-moonlight/70 tracking-[0.35em] uppercase">Guild Network Online</span>
                <div className="w-1.5 h-1.5 rounded-full bg-portal-emerald animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>

              {/* Main heading */}
              <div className="hero-assemble mb-4" style={{ animationDelay: '120ms' }}>
                <h1 className="font-cinzel font-semibold leading-none tracking-wide">
                  <span className="block text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-portal-moonlight">
                    Quest<span className="text-transparent bg-clip-text bg-gradient-to-r from-portal-gold via-portal-emerald to-portal-cyan">Hub</span>
                  </span>
                  <span className="block text-xl sm:text-2xl md:text-3xl lg:text-4xl text-slate-400 tracking-[0.3em] mt-2 font-normal">
                    Guild
                  </span>
                </h1>
              </div>

              {/* Divider line */}
              <div className="hero-assemble flex items-center justify-center gap-4 mb-2" style={{ animationDelay: '220ms' }}>
                <span className="font-cinzel text-[10px] text-portal-gold/80 tracking-[0.4em] uppercase">Teen Guild • Learn • Earn • Grow</span>
              </div>
              <div className="hero-assemble mb-8" style={{ animationDelay: '260ms' }}>
                <OrnamentDivider color="#FFC65C" />
              </div>

              {/* Subtitle */}
              <p
                className="hero-assemble font-cormorant text-base sm:text-lg md:text-xl text-slate-300/90 max-w-2xl mx-auto mb-10 leading-relaxed px-2 italic"
                style={{ animationDelay: '340ms' }}
              >
                A teen guild/community where ambitious teens connect, grow, learn skills, join fun challenges, and take on real paid quests.
                Not just another dead group — this is an active space for talented teens to build something bigger together.
                Rank up from{' '}
                <span className="text-portal-moonlight font-semibold not-italic">F to SSS</span>, complete paid projects, and turn your skills into real income.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-14">
                <Link href="/apply">
                  <GlowButton size="lg" variant="primary" className="w-48 sm:w-auto animate-pulse-glow">
                    Start Your Journey
                  </GlowButton>
                </Link>
                <Link href="/auth/register">
                  <GlowButton size="lg" variant="secondary" className="w-48 sm:w-auto">
                    Create Account
                  </GlowButton>
                </Link>
                <Link href="/auth/login">
                  <GlowButton size="lg" variant="ghost" className="w-48 sm:w-auto">
                    Member Login
                  </GlowButton>
                </Link>
              </div>

              {/* Stats bar */}
              <div className="inline-flex flex-col sm:flex-row items-center gap-0 sm:gap-px border border-portal-emerald/20 bg-portal-black/50 backdrop-blur-md overflow-hidden">
                {[
                  ['Paid', 'Quests Available'],
                  ['Active', 'Teen Community'],
                  ['AI', 'Matched Jobs'],
                  ['100%', 'Payment Protected'],
                ].map(([val, label], i) => (
                  <div
                    key={label}
                    className="flex flex-row sm:flex-col items-center sm:items-center gap-3 sm:gap-0.5 px-6 sm:px-8 py-3 sm:py-4 border-b sm:border-b-0 sm:border-r border-portal-emerald/15 last:border-0 w-full sm:w-auto"
                  >
                    <span className="font-cinzel font-black text-lg sm:text-2xl text-portal-emerald glow-text">{val}</span>
                    <span className="font-cormorant text-[10px] text-slate-300/80 tracking-[0.25em] uppercase">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
              <div className="w-px h-8 bg-gradient-to-b from-portal-emerald/60 to-transparent" />
              <div className="w-1.5 h-1.5 bg-portal-emerald rotate-45" />
            </div>
          </section>

          {/* ── TICKER ──────────────────────────────────────────── */}
          <div className="border-y border-portal-emerald/20 bg-portal-black/75 backdrop-blur-sm overflow-hidden py-2.5">
            <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
              {Array.from({ length: 3 }).flatMap(() => [
                '◈ PAID QUESTS AVAILABLE NOW',
                '◉ TEEN COMMUNITY ACTIVE',
                '◍ EARN WHILE YOU LEARN',
                '◎ SKILL GROWTH TRACKING',
                '◆ FUN CHALLENGES & EVENTS',
                '◇ AI JOB MATCHING ONLINE',
                '◈ BUILD REAL PORTFOLIO',
                '◉ GET PAID PER PROJECT',
              ]).map((text, i) => (
                <span key={i} className="font-cinzel text-[9px] text-portal-emerald/85 tracking-[0.3em] uppercase flex-shrink-0">
                  {text}
                </span>
              ))}
            </div>
          </div>

          {/* ── HOW IT WORKS ──────────────────────────────────────── */}
          <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 bg-portal-black/45 backdrop-blur-sm relative">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 sm:mb-16">
                <span className="font-cinzel text-[10px] text-portal-gold/80 tracking-[0.4em] uppercase">Your Journey Starts Here</span>
                <h2 className="glow-sweep-text font-cinzel font-semibold text-2xl sm:text-3xl md:text-4xl text-portal-moonlight mt-3 mb-4">
                  Join QuestHub Guild
                </h2>
                <OrnamentDivider color="#00FFA3" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {STEPS.map((item, i) => (
                  <div key={i} className="relative">
                    {/* Connector line */}
                    {i < STEPS.length - 1 && (
                      <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-portal-emerald/30 to-transparent z-10 translate-x-[-50%]" style={{ width: 'calc(100% - 2.5rem)', left: '100%', transform: 'none', right: '-50%' }} />
                    )}
                    <div className="relative rounded-2xl bg-white/[0.03] border border-portal-emerald/15 backdrop-blur-sm p-5 sm:p-6 group hover:border-portal-gold/40 hover:bg-portal-emerald/[0.04] transition-all duration-300 overflow-hidden">
                      {/* Soft inner highlight sweeping in on hover, standing
                          in for the "carved from crystal" reflection from
                          the brief instead of flat glass */}
                      <div className="absolute -inset-full bg-gradient-to-br from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                      {/* Step number as a small luminous crystal shard
                          rather than a flat oversized numeral — a slowly
                          rotating diamond glow ring behind Cinzel digits */}
                      <div className="relative w-14 h-14 mb-4 flex items-center justify-center">
                        <div className="absolute inset-0 border border-portal-gold/30 rounded-md rotate-45 animate-[spin_12s_linear_infinite] group-hover:border-portal-gold/60 transition-colors" />
                        <div className="absolute inset-2 border border-portal-emerald/20 rounded-md rotate-45 animate-[spin_9s_linear_infinite_reverse]" />
                        <span className="relative font-cinzel font-semibold text-xl text-portal-moonlight z-10">
                          {item.step}
                        </span>
                      </div>

                      <div className="font-cinzel text-portal-emerald/70 text-lg mb-2">{item.icon}</div>
                      <h3 className="font-cinzel font-semibold text-sm sm:text-base text-portal-moonlight mb-2">{item.title}</h3>
                      <p className="font-cormorant text-slate-400 text-[15px] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── RANK SYSTEM ──────────────────────────────────────── */}
          <section id="ranks" className="py-20 sm:py-28 px-4 sm:px-6 bg-black/40 backdrop-blur-sm rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-purple-glow opacity-20 pointer-events-none" />
            <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center mb-12 sm:mb-16">
                <span className="font-cinzel text-[9px] text-portal-emerald tracking-[0.5em] uppercase">Power Structure</span>
                <h2 className="font-cinzel font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-4">
                  THE HIERARCHY
                </h2>
                <div className="w-20 h-px bg-gradient-to-r from-transparent via-portal-emerald to-transparent mx-auto mb-4" />
                <p className="font-cormorant text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
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
                    <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-20" />
                    <div className={`font-cinzel font-black text-xl sm:text-2xl md:text-3xl ${r.color} mb-0.5 group-hover:glow-text transition-all`}>
                      {r.rank}
                    </div>
                    <div className={`font-cinzel text-[7px] sm:text-[8px] ${r.color} opacity-60 tracking-widest hidden sm:block`}>
                      {r.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Rank descriptions on hover — shown below on mobile */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {RANKS.slice(6).map((r) => (
                  <div key={r.rank} className={`border ${r.border} bg-black/60 backdrop-blur-sm rounded-xl p-3 flex items-start gap-3`}>
                    <span className={`font-cinzel font-black text-lg ${r.color} flex-shrink-0`}>{r.rank}</span>
                    <div>
                      <div className={`font-cinzel text-xs ${r.color} mb-0.5`}>{r.label}</div>
                      <div className="font-cormorant text-slate-500 text-xs">{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── SMART MATCHING ENGINE ──────────────────────────────────────── */}
          <section className="py-20 sm:py-28 px-4 sm:px-6 bg-portal-black/45 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-portal-emerald/30 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-portal-emerald/30 to-transparent pointer-events-none" />

            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                {/* Left */}
                <div>
                  <span className="font-cinzel text-[9px] text-portal-emerald tracking-[0.5em] uppercase">AI-Powered • Founder Controlled</span>
                  <h2 className="font-cinzel font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-4">
                    SENTINEL AI
                  </h2>
                  <div className="w-20 h-px bg-gradient-to-r from-portal-emerald to-transparent mb-6" />
                  <p className="font-cormorant text-slate-400 text-base sm:text-lg leading-relaxed mb-6">
                    Our AI matches you with the best-paying quests based on your skills, rank, and past performance.
                    Founders maintain full control while AI handles matching, payments, and growth tracking.
                    Everyone wins: teens earn money, founders get quality work.
                  </p>
                  <div className="bg-black/60 backdrop-blur-sm rounded-xl border border-portal-emerald/20 p-4 font-mono text-xs">
                    <div className="text-green-400/80 mb-1">{'>'} AI.matchQuest(user_profile)</div>
                    <div className="text-slate-500 mb-1">{'>'} Analyzing skills... rank... availability...</div>
                    <div className="text-portal-emerald mb-1">{'>'} Match found: <span className="text-green-400">$50 quest</span></div>
                    <div className="text-slate-500">{'>'} Payment: <span className="text-green-400">PROTECTED</span></div>
                  </div>
                </div>

                {/* Right */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {AI_FEATURES.map((f, i) => (
                    <div key={i} className="relative bg-black/60 backdrop-blur-sm rounded-xl border border-portal-emerald/20 p-4 sm:p-5 group hover:border-portal-emerald/50 transition-all duration-300">
                      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-portal-emerald/40 group-hover:border-portal-emerald transition-colors" />
                      <div className="font-cinzel font-bold text-xs sm:text-sm text-portal-emerald mb-2">{f.title}</div>
                      <p className="font-cormorant text-slate-500 text-xs sm:text-sm leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── ARENA / GHOST PROTOCOL / SENTINEL GRID ──────────────── */}
          <section id="arena" className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden bg-portal-black/45 backdrop-blur-sm">
            <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
            <div className="max-w-6xl mx-auto relative z-10">
              <div className="text-center mb-12 sm:mb-16">
                <span className="font-cinzel text-[9px] text-portal-emerald tracking-[0.5em] uppercase">Beyond The Trial</span>
                <h2 className="font-cinzel font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-4">
                  THE PROTOCOLS
                </h2>
                <div className="w-20 h-px bg-gradient-to-r from-transparent via-portal-emerald to-transparent mx-auto mb-4" />
                <p className="font-cormorant text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
                  Compete, socialize, and watch the Grid come alive around you.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                <div className="relative bg-black/60 backdrop-blur-sm rounded-xl border border-portal-emerald/20 p-6 group hover:border-amber-400/50 transition-all duration-300 overflow-hidden">
                  <div className="text-3xl mb-3">🕹️</div>
                  <h3 className="font-cinzel font-bold text-sm sm:text-base text-amber-400 mb-2 tracking-widest">ARENA PROTOCOL</h3>
                  <p className="font-cormorant text-slate-500 text-sm leading-relaxed">
                    A structured mini-game engine — logic, typing, quiz, creative and social
                    challenges, all scored by AI. Rotating daily challenge, live leaderboard, real XP.
                  </p>
                </div>

                <div className="relative bg-black/60 backdrop-blur-sm rounded-xl border border-portal-emerald/20 p-6 group hover:border-portal-emerald/50 transition-all duration-300 overflow-hidden">
                  <div className="text-3xl mb-3">👻</div>
                  <h3 className="font-cinzel font-bold text-sm sm:text-base text-portal-emerald mb-2 tracking-widest">GHOST PROTOCOL</h3>
                  <p className="font-cormorant text-slate-500 text-sm leading-relaxed">
                    Party games live in Guild Chat: Truth or Dare, Would You Rather, Two Truths
                    and a Lie — triggered instantly with slash commands like <span className="text-portal-emerald">/party</span>.
                  </p>
                </div>

                <div className="relative bg-black/60 backdrop-blur-sm rounded-xl border border-portal-emerald/20 p-6 group hover:border-cyan-400/50 transition-all duration-300 overflow-hidden">
                  <div className="text-3xl mb-3">◈</div>
                  <h3 className="font-cinzel font-bold text-sm sm:text-base text-cyan-400 mb-2 tracking-widest">SENTINEL GRID</h3>
                  <p className="font-cormorant text-slate-500 text-sm leading-relaxed">
                    The live perspective grid rendering beneath every screen — a signal that
                    the Sentinel network is always watching, always active.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── QUEST TYPES ──────────────────────────────────────── */}
          <section id="quests" className="py-20 sm:py-28 px-4 sm:px-6 bg-portal-black/45 backdrop-blur-sm relative">
            <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
            <div className="max-w-6xl mx-auto relative z-10">
              <div className="text-center mb-12 sm:mb-16">
                <span className="font-cinzel text-[9px] text-portal-emerald tracking-[0.5em] uppercase">Active Operations</span>
                <h2 className="font-cinzel font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-4">
                  QUEST TYPES
                </h2>
                <div className="w-20 h-px bg-gradient-to-r from-transparent via-portal-emerald to-transparent mx-auto mb-4" />
                <p className="font-cormorant text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
                  Real work. Real skills. Some quests pay cash. All quests pay XP.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {QUEST_TYPES.map((q, i) => (
                  <div
                    key={i}
                    className="relative bg-black/60 backdrop-blur-sm rounded-xl border border-portal-emerald/15 p-5 sm:p-6 group hover:border-portal-emerald/40 hover:bg-portal-black/10 transition-all duration-300"
                  >
                    <div className={`font-cinzel text-3xl ${q.color} mb-3 group-hover:glow-text transition-all`}>{q.icon}</div>
                    <h3 className={`font-cinzel font-bold text-sm sm:text-base ${q.color} mb-2`}>{q.label}</h3>
                    <p className="font-cormorant text-slate-500 text-sm leading-relaxed">{q.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── LEGITIMACY ──────────────────────────────────────── */}
          <section className="py-20 sm:py-28 px-4 sm:px-6 bg-portal-black/45 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-purple-glow opacity-10 pointer-events-none" />
            <div className="max-w-5xl mx-auto relative z-10">
              <div className="text-center mb-10">
                <span className="font-cinzel text-[9px] text-portal-emerald tracking-[0.5em] uppercase">Why QuestHub Guild</span>
                <h2 className="font-cinzel font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-4">
                  MORE THAN JUST A GUILD.
                </h2>
                <div className="w-20 h-px bg-gradient-to-r from-transparent via-portal-emerald to-transparent mx-auto mb-4" />
                <p className="font-cormorant text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                  QuestHub Guild is a space where talented teens connect, grow, and earn together.
                  Fun challenges keep it active. Real quests build your portfolio. AI matching finds your perfect opportunities.
                  This isn't one of those dead groups that dies after 3 days — we're building something bigger.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                {[
                  { icon: '🤝', title: 'Active Community',   desc: 'Daily challenges, events, and a chill teen environment. No ghost towns here.' },
                  { icon: '💰', title: 'Real Earnings',      desc: 'Get paid for completed quests. Build income while building skills and connections.' },
                  { icon: '📈', title: 'Skill Growth',       desc: 'Track your progress, level up your abilities, and unlock higher-paying opportunities.' },
                ].map((item, i) => (
                  <div key={i} className="relative bg-black/60 backdrop-blur-sm rounded-xl border border-portal-emerald/20 p-5 sm:p-6 group hover:border-portal-emerald/40 transition-all duration-300">
                    <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-portal-emerald/30" />
                    <div className="text-2xl sm:text-3xl mb-3">{item.icon}</div>
                    <h3 className="font-cinzel font-bold text-sm text-white mb-2">{item.title}</h3>
                    <p className="font-cormorant text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FINAL CTA ──────────────────────────────────────── */}
          <section className="py-24 sm:py-32 px-4 sm:px-6 relative overflow-hidden bg-black/50">
            <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
            <div className="absolute inset-0 bg-purple-glow opacity-20 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-portal-emerald/50 to-transparent pointer-events-none" />

            <div className="max-w-3xl mx-auto text-center relative z-10">
              <span className="font-cinzel text-[9px] text-portal-emerald tracking-[0.5em] uppercase block mb-4">The Question Is Simple</span>
              <h2 className="font-cinzel font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-4 leading-none">
                DO YOU HAVE
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-portal-emerald via-fuchsia-400 to-pink-500 mt-1">
                  WHAT IT TAKES?
                </span>
              </h2>
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-portal-emerald to-transparent mx-auto my-6" />
              <p className="font-cormorant text-slate-400 text-sm sm:text-base md:text-lg mb-10 leading-relaxed">
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
                    Create Your Account
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