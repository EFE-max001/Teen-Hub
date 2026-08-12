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
  { rank: 'F',   label: 'Initiate',   color: 'text-slate-400',  border: 'border-slate-600/40',  glow: '',                                  desc: 'Your starting point. Show up, explore, and find your lane.' },
  { rank: 'E',   label: 'Contributor',color: 'text-green-400',  border: 'border-green-600/40',  glow: 'shadow-[0_0_15px_rgba(74,222,128,0.15)]',  desc: 'Active in the guild and building momentum.' },
  { rank: 'D',   label: 'Specialist', color: 'text-blue-400',   border: 'border-blue-600/40',   glow: 'shadow-[0_0_15px_rgba(96,165,250,0.15)]',  desc: 'Growing a useful skill and taking on bigger challenges.' },
  { rank: 'C',   label: 'Vanguard',   color: 'text-yellow-400', border: 'border-yellow-600/40', glow: 'shadow-[0_0_15px_rgba(250,204,21,0.15)]',  desc: 'Reliable, consistent, and ready for team projects.' },
  { rank: 'B',   label: 'Builder',    color: 'text-orange-400', border: 'border-orange-500/50', glow: 'shadow-[0_0_20px_rgba(251,146,60,0.2)]',   desc: 'A proven track record that opens more opportunities.' },
  { rank: 'A',   label: 'Elite',      color: 'text-portal-emerald', border: 'border-portal-emerald/60', glow: 'shadow-[0_0_20px_rgba(0,255,163,0.25)]',  desc: 'One of the guild\'s most trusted contributors.' },
  { rank: 'S',   label: 'Sovereign',  color: 'text-pink-400',   border: 'border-pink-500/60',   glow: 'shadow-[0_0_20px_rgba(236,72,153,0.25)]',  desc: 'A standout creator others want on their team.' },
  { rank: 'SS',  label: 'Warlord',    color: 'text-red-400',    border: 'border-red-500/60',    glow: 'shadow-[0_0_25px_rgba(239,68,68,0.3)]',    desc: 'A pillar of the community and a dependable lead.' },
  { rank: 'SSS', label: 'Mythic',     color: 'text-amber-300',  border: 'border-amber-400/70',  glow: 'shadow-[0_0_30px_rgba(252,211,77,0.35)]',  desc: 'A rare builder shaping what the Guild becomes next.' },
]

const STEPS = [
  { step: '01', title: 'Enter the Guild',    icon: 'I', desc: 'Meet ambitious teens, find your people, and join a community built to stay active.' },
  { step: '02', title: 'Learn & Participate', icon: 'II', desc: 'Jump into challenges, events, and creative projects that make building skills fun.' },
  { step: '03', title: 'Build Your Proof',     icon: 'III', desc: 'Complete trials and projects that turn effort into a visible record of what you can do.' },
  { step: '04', title: 'Take a Paid Quest', icon: 'IV', desc: 'As opportunities grow, apply for real small projects with real deliverables and real pay.' },
]

const QUEST_TYPES = [
  { icon: '01', label: 'Graphic Design',  color: 'text-portal-emerald', desc: 'Logos, banners, social visuals, brand identity work'  },
  { icon: '02', label: 'Writing & Copy',  color: 'text-blue-400',   desc: 'Captions, articles, scripts, ad copy, blog posts'      },
  { icon: '03', label: 'Video Editing',   color: 'text-pink-400',   desc: 'Reels, short-form promos, YouTube edits, transitions'  },
  { icon: '04', label: 'Research Ops',    color: 'text-yellow-400', desc: 'Market data, competitor analysis, sourcing, reports'   },
  { icon: '05', label: 'Web Operations',  color: 'text-green-400',  desc: 'Site updates, QA testing, CMS management, bug reports' },
  { icon: '06', label: 'Social Media',    color: 'text-orange-400', desc: 'Content planning, scheduling, community growth'        },
]

const AI_FEATURES = [
  { title: 'Trial Feedback',  desc: 'SENTINEL helps the council evaluate quality, reliability, and attitude so growth is based on more than hype.' },
  { title: 'Trust & Reliability',     desc: 'Participation, project completions, and follow-through build a record people can trust.' },
  { title: 'Opportunity Matching',    desc: 'As the quest board grows, your skills and track record help surface projects that fit your lane.' },
  { title: 'Milestone Engine',desc: 'Progress is recognized as you hit meaningful milestones, from your first challenge to your first paid quest.' },
]

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>QuestHub Guild — A Teen Community for Skills, Projects & Paid Quests</title>
        <meta name="description" content="QuestHub Guild is an active community for ambitious teens to connect, grow skills, join challenges, build proof, and take on real small projects that pay." />
      </Head>

      <div className="min-h-screen bg-transparent flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">

          {/* ── HERO ──────────────────────────────────────────── */}
          <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-20">
            {/* The atmosphere is mounted globally so this hero can focus on
                the message, proof, and first action instead of competing
                with a second local scene. */}

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

            <div className="relative z-10 max-w-6xl mx-auto w-full">

              {/* Status badge */}
              <div className="hero-assemble inline-flex items-center gap-3 mb-6 border border-portal-emerald/25 bg-portal-emerald/[0.06] px-4 py-2 backdrop-blur-sm rounded-full" style={{ animationDelay: '40ms' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-portal-emerald animate-pulse" />
                 <span className="font-cinzel text-[9px] sm:text-[10px] text-portal-moonlight/70 tracking-[0.35em] uppercase">Teen Guild / Open Doors</span>
                <div className="w-1.5 h-1.5 rounded-full bg-portal-emerald animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>

              <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-8 lg:gap-14 items-center">
                <div className="text-center lg:text-left">
                  <div className="hero-assemble mb-4" style={{ animationDelay: '120ms' }}>
                    <h1 className="font-cinzel font-semibold leading-[.92] tracking-wide">
                      <span className="block text-[clamp(3.1rem,12vw,8rem)] text-portal-moonlight">
                        Quest<span className="text-transparent bg-clip-text bg-gradient-to-r from-portal-gold via-portal-emerald to-portal-cyan">Hub</span>
                      </span>
                      <span className="block text-xl sm:text-2xl md:text-3xl text-slate-400 tracking-[0.3em] mt-4 font-normal">Guild</span>
                    </h1>
                  </div>
                  <div className="hero-assemble flex items-center lg:justify-start justify-center gap-4 mb-2" style={{ animationDelay: '220ms' }}>
                    <span className="font-cinzel text-[10px] text-portal-gold/80 tracking-[0.4em] uppercase">Teen Community / Skills → Projects → Paid Quests</span>
                  </div>
                  <div className="hero-assemble mb-6 lg:mx-0" style={{ animationDelay: '260ms' }}><OrnamentDivider color="#FFC65C" /></div>
                  <p className="hero-assemble font-cormorant text-lg sm:text-xl md:text-2xl text-slate-300/90 max-w-2xl mb-8 leading-relaxed px-2 lg:px-0 italic" style={{ animationDelay: '340ms' }}>
                    Find your people. Build real skills. <span className="text-portal-moonlight not-italic font-semibold">Get paid to do work you’re proud of.</span> QuestHub is the teen guild where challenges and creative projects can lead to real small jobs, a stronger portfolio, and a reputation worth carrying.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3 sm:gap-4 mb-8">
                    <Link href="/apply"><GlowButton size="lg" variant="primary" className="w-52 sm:w-auto animate-pulse-glow">Apply to Join</GlowButton></Link>
                    <Link href="/auth/register"><GlowButton size="lg" variant="secondary" className="w-52 sm:w-auto">Create Account</GlowButton></Link>
                    <Link href="/auth/login"><GlowButton size="lg" variant="ghost" className="w-52 sm:w-auto">Sign In</GlowButton></Link>
                  </div>
                </div>

                <aside className="hero-assemble hero-panel relative overflow-hidden border border-portal-emerald/25 bg-portal-black/65 backdrop-blur-md p-5 sm:p-6 text-left" style={{ animationDelay: '420ms' }} aria-label="Guild status">
                  <div className="guild-signal absolute top-0 left-0 right-0 h-px" />
                  <div className="flex items-center justify-between border-b border-portal-emerald/15 pb-4 mb-5">
                    <div><span className="font-cinzel text-[9px] tracking-[.3em] text-portal-gold uppercase">Guild Brief</span><h2 className="font-cinzel text-lg text-portal-moonlight mt-1">Build something real.</h2></div>
                    <span className="font-mono text-[10px] text-portal-emerald">LIVE / 01</span>
                  </div>
                  <div className="space-y-4 font-mono text-[11px]">
                    <div className="flex justify-between gap-4"><span className="text-slate-500">GUILD STATUS</span><span className="text-portal-emerald">OPEN TO AMBITIOUS TEENS</span></div>
                    <div className="h-px bg-portal-emerald/10"><div className="h-px w-[68%] bg-gradient-to-r from-portal-emerald to-portal-gold" /></div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="border-l border-portal-gold/50 pl-3"><div className="text-portal-gold text-lg font-cinzel">GROW</div><div className="text-slate-500 text-[10px] mt-1">SKILLS + RANKS</div></div>
                      <div className="border-l border-portal-cyan/50 pl-3"><div className="text-portal-cyan text-lg font-cinzel">EARN</div><div className="text-slate-500 text-[10px] mt-1">PAID QUESTS</div></div>
                    </div>
                    <p className="text-slate-400 leading-relaxed pt-2">Start with the community. Build your proof. When a paid opportunity fits, take the quest and deliver.</p>
                  </div>
                </aside>
              </div>

              {/* Stats bar */}
              <div className="mt-8 lg:mt-10 w-full lg:w-auto inline-flex flex-col sm:flex-row items-center gap-0 sm:gap-px border border-portal-emerald/20 bg-portal-black/50 backdrop-blur-md overflow-hidden">
                {[
                  ['LIVE', 'Community'],
                  ['∞', 'Ways to Grow'],
                  ['REAL', 'Projects'],
                  ['$', 'Paid Quests'],
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
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce hidden sm:flex">
              <div className="w-px h-8 bg-gradient-to-b from-portal-emerald/60 to-transparent" />
              <div className="w-1.5 h-1.5 bg-portal-emerald rotate-45" />
            </div>
          </section>

          {/* ── TICKER ──────────────────────────────────────────── */}
          <div className="border-y border-portal-emerald/20 bg-portal-black/75 backdrop-blur-sm overflow-hidden py-2.5">
            <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
              {Array.from({ length: 3 }).flatMap(() => [
                '[01] CHALLENGE ARENA ACTIVE',
                '[02] GUILD HALL OPEN',
                '[03] PROJECT LAB ONLINE',
                '[04] QUEST BOARD GROWING',
                '[05] BUILD SKILLS / BUILD PROOF',
                '[06] PAID QUESTS AS OPPORTUNITIES LAND',
                '[07] ACTIVE COMMUNITY / REAL PEOPLE',
                '[08] RANKS EARNED THROUGH CONTRIBUTION',
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
                <span className="font-cinzel text-[10px] text-portal-gold/80 tracking-[0.4em] uppercase">Your Guild Loop</span>
                <h2 className="glow-sweep-text font-cinzel font-semibold text-2xl sm:text-3xl md:text-4xl text-portal-moonlight mt-3 mb-4">
                  From Hangout to Opportunity
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
                <span className="font-cinzel text-[9px] text-portal-emerald tracking-[0.5em] uppercase">Progress You Can See</span>
                <h2 className="font-cinzel font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-4">
                  THE GUILD LADDER
                </h2>
                <div className="w-20 h-px bg-gradient-to-r from-transparent via-portal-emerald to-transparent mx-auto mb-4" />
                <p className="font-cormorant text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
                  Nine tiers of progress. F to SSS. Every rank reflects your effort,
                  consistency, and the quality of what you contribute.
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

          {/* ── SENTINEL AI ──────────────────────────────────────── */}
          <section className="py-20 sm:py-28 px-4 sm:px-6 bg-portal-black/45 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-portal-emerald/30 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-portal-emerald/30 to-transparent pointer-events-none" />

            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                {/* Left */}
                <div>
                  <span className="font-cinzel text-[9px] text-portal-emerald tracking-[0.5em] uppercase">The Guild Support Layer</span>
                  <h2 className="font-cinzel font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-4">
                    SENTINEL
                  </h2>
                  <div className="w-20 h-px bg-gradient-to-r from-portal-emerald to-transparent mb-6" />
                  <p className="font-cormorant text-slate-400 text-base sm:text-lg leading-relaxed mb-6">
                    SENTINEL helps the Guild stay fair, active, and useful — from giving
                    trial feedback to tracking follow-through and helping the right
                    opportunities find the right contributors.
                  </p>
                  <div className="bg-black/60 backdrop-blur-sm rounded-xl border border-portal-emerald/20 p-4 font-mono text-xs">
                    <div className="text-green-400/80 mb-1">{'>'} SENTINEL.review(member_progress)</div>
                    <div className="text-slate-500 mb-1">{'>'} Checking effort... quality... follow-through...</div>
                    <div className="text-portal-emerald mb-1">{'>'} Momentum: <span className="text-green-400">RISING</span></div>
                    <div className="text-slate-500">{'>'} Next step: <span className="text-green-400">BUILD PROOF</span></div>
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
                <span className="font-cinzel text-[9px] text-portal-emerald tracking-[0.5em] uppercase">The Guild Stays Moving</span>
                <h2 className="font-cinzel font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-4">
                  COMMUNITY IN MOTION
                </h2>
                <div className="w-20 h-px bg-gradient-to-r from-transparent via-portal-emerald to-transparent mx-auto mb-4" />
                <p className="font-cormorant text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
                  Challenges, conversations, and creative projects give the Guild a reason to come back tomorrow.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                <div className="relative bg-black/60 backdrop-blur-sm rounded-xl border border-portal-emerald/20 p-6 group hover:border-amber-400/50 transition-all duration-300 overflow-hidden">
                  <div className="font-mono text-xs text-amber-400/70 mb-3">GUILD MODE / 01</div>
                  <h3 className="font-cinzel font-bold text-sm sm:text-base text-amber-400 mb-2 tracking-widest">CHALLENGE ARENA</h3>
                  <p className="font-cormorant text-slate-500 text-sm leading-relaxed">
                    Logic, typing, quiz, creative, and social challenges keep the energy high.
                    Jump in, have fun, earn XP, and discover what you’re good at.
                  </p>
                </div>

                <div className="relative bg-black/60 backdrop-blur-sm rounded-xl border border-portal-emerald/20 p-6 group hover:border-portal-emerald/50 transition-all duration-300 overflow-hidden">
                  <div className="font-mono text-xs text-portal-emerald/70 mb-3">GUILD MODE / 02</div>
                  <h3 className="font-cinzel font-bold text-sm sm:text-base text-portal-emerald mb-2 tracking-widest">GUILD HALL</h3>
                  <p className="font-cormorant text-slate-500 text-sm leading-relaxed">
                    A chill place to talk, share ideas, find teammates, and actually make
                    friends — with events and party games ready when the chat needs a spark.
                  </p>
                </div>

                <div className="relative bg-black/60 backdrop-blur-sm rounded-xl border border-portal-emerald/20 p-6 group hover:border-cyan-400/50 transition-all duration-300 overflow-hidden">
                  <div className="font-mono text-xs text-cyan-400/70 mb-3">GUILD MODE / 03</div>
                  <h3 className="font-cinzel font-bold text-sm sm:text-base text-cyan-400 mb-2 tracking-widest">PROJECT LAB</h3>
                  <p className="font-cormorant text-slate-500 text-sm leading-relaxed">
                    Turn ideas into portfolio pieces with other members. Build together
                    before you’re ready to build for someone else.
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
                <span className="font-cinzel text-[9px] text-portal-emerald tracking-[0.5em] uppercase">Small Work / Real Opportunity</span>
                <h2 className="font-cinzel font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-4">
                  THE QUEST BOARD
                </h2>
                <div className="w-20 h-px bg-gradient-to-r from-transparent via-portal-emerald to-transparent mx-auto mb-4" />
                <p className="font-cormorant text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
                  Build the skill first, then put it to work. Quests are small projects
                  with clear deliverables — and quests marked paid come with real pay.
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
                <span className="font-cinzel text-[9px] text-portal-emerald tracking-[0.5em] uppercase">Built for Momentum</span>
                <h2 className="font-cinzel font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-4">
                  NOT ANOTHER DEAD GROUP.
                </h2>
                <div className="w-20 h-px bg-gradient-to-r from-transparent via-portal-emerald to-transparent mx-auto mb-4" />
                <p className="font-cormorant text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                  QuestHub Guild is a living teen community — a place to connect, learn,
                  make things, and grow into real opportunities. The fun keeps it active.
                  The proof makes the opportunities possible.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                  {[
                   { icon: '01', title: 'Active by Design',    desc: 'Challenges, events, projects, and conversation give members reasons to return and contribute.' },
                   { icon: '02',  title: 'Proof Over Hype', desc: 'Ranks come from effort, consistency, and quality — not follower counts or empty self-promotion.' },
                   { icon: '03', title: 'Real Opportunity',      desc: 'Paid quests are built around clear work, clear expectations, and contributions people can stand behind.' },
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
               <span className="font-cinzel text-[9px] text-portal-emerald tracking-[0.5em] uppercase block mb-4">Start Where You Are</span>
              <h2 className="font-cinzel font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-4 leading-none">
                 BUILD YOUR
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-portal-emerald via-fuchsia-400 to-pink-500 mt-1">
                   NEXT QUEST.
                </span>
              </h2>
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-portal-emerald to-transparent mx-auto my-6" />
              <p className="font-cormorant text-slate-400 text-sm sm:text-base md:text-lg mb-10 leading-relaxed">
                 Join the community, try a challenge, learn something useful, and start
                 building proof. The next paid project could begin with the thing you make today.
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