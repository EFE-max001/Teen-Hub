
import Head from 'next/head'
import Link from 'next/link'
import Layout from '@/components/layout/Layout'
import GlowButton from '@/components/ui/GlowButton'

const RANKS = [
  { rank: 'F',   label: 'Initiate',  color: 'text-slate-400',  border: 'border-slate-600/40',  desc: 'New & untested'        },
  { rank: 'E',   label: 'Operative', color: 'text-green-400',  border: 'border-green-600/40',  desc: 'Basic active member'   },
  { rank: 'D',   label: 'Specialist',color: 'text-blue-400',   border: 'border-blue-600/40',   desc: 'Starter worker'        },
  { rank: 'C',   label: 'Vanguard',  color: 'text-yellow-400', border: 'border-yellow-600/40', desc: 'Dependable contributor'},
  { rank: 'B',   label: 'Commander', color: 'text-orange-400', border: 'border-orange-600/40', desc: 'Strong performer'      },
  { rank: 'A',   label: 'Elite',     color: 'text-purple-400', border: 'border-purple-500/60', desc: 'Highly trusted'        },
  { rank: 'S',   label: 'Sovereign', color: 'text-pink-400',   border: 'border-pink-500/60',   desc: 'Guild legend'          },
  { rank: 'SS',  label: 'Warlord',   color: 'text-red-400',    border: 'border-red-500/60',    desc: 'Legendary status'      },
  { rank: 'SSS', label: 'Mythic',    color: 'text-amber-300',  border: 'border-amber-400/60',  desc: 'Ultra-rare. Chosen.'   },
]

const QUEST_TYPES = [
  { icon: '🎨', label: 'Graphic Design',  desc: 'Flyers, banners, brand visuals'   },
  { icon: '✍️', label: 'Writing',          desc: 'Captions, copy, articles'         },
  { icon: '🎬', label: 'Video Editing',   desc: 'Reels, clips, promos'             },
  { icon: '🔬', label: 'Research',        desc: 'Data gathering, reports'          },
  { icon: '🌐', label: 'Web Tasks',       desc: 'Site updates, testing'            },
  { icon: '📱', label: 'Social Media',    desc: 'Content, scheduling, growth'      },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Register',        desc: 'Create your operative account. This gives you access to the guild network.' },
  { step: '02', title: 'Apply',           desc: 'Submit your guild application from your dashboard. Show the Council what you are made of.' },
  { step: '03', title: 'Complete Trial',  desc: 'Prove your skills. Scored on quality, speed, reliability, and attitude.' },
  { step: '04', title: 'Rise Through Ranks', desc: 'Get accepted, earn XP, complete quests, and climb from F all the way to SSS.' },
]

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>QuestHub Guild — Elite Teen Talent Platform</title>
        <meta name="description" content="An elite guild for talented teens. Apply, rank up, complete quests, and rise through the ranks." />
      </Head>

      <Layout>

        {/* ── HERO ── */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg px-4">
          {/* Glow orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-800/10 rounded-full blur-3xl pointer-events-none" />

          {/* Accent lines */}
          <div className="absolute top-0 right-0 w-px h-64 bg-gradient-to-b from-transparent via-purple-500/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-px h-64 bg-gradient-to-t from-transparent via-purple-500/40 to-transparent" />

          <div className="relative z-10 text-center max-w-4xl mx-auto">
            {/* Tag */}
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="w-12 h-px bg-purple-500/60" />
              <span className="font-orbitron text-xs text-purple-400 tracking-[0.4em] uppercase">
                Elite Guild Platform
              </span>
              <div className="w-12 h-px bg-purple-500/60" />
            </div>

            {/* Headline */}
            <h1 className="font-orbitron font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-tight mb-6">
              PROVE YOUR
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-pink-400 glow-text">
                WORTH.
              </span>
              CLAIM YOUR
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-pink-400 glow-text">
                RANK.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="font-rajdhani text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              QuestHub Guild is an elite platform for talented teens. Complete quests, earn XP, rise through ranks — and build a real reputation that matters.
            </p>

            {/* CTAs — Register only, no apply */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <GlowButton size="lg" variant="primary">
                  Join the Guild
                </GlowButton>
              </Link>
              <Link href="/#how-it-works">
                <GlowButton size="lg" variant="secondary">
                  How It Works
                </GlowButton>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto">
              {[['9', 'Rank Tiers'], ['∞', 'Quests'], ['0', 'BS Tolerated']].map(([val, label]) => (
                <div key={label} className="text-center">
                  <div className="font-orbitron font-black text-2xl sm:text-3xl text-purple-300 glow-text">{val}</div>
                  <div className="font-rajdhani text-xs text-slate-500 tracking-widest uppercase mt-1">{label}</div>
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

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-20 px-4 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <span className="font-orbitron text-xs text-purple-400 tracking-[0.4em] uppercase">Protocol</span>
              <h2 className="font-orbitron font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3">
                HOW IT WORKS
              </h2>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto mt-4" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {HOW_IT_WORKS.map((item, i) => (
                <div
                  key={i}
                  className="relative bg-card-bg border border-purple-500/20 p-6 group hover:border-purple-500/50 transition-all duration-300"
                >
                  <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-purple-500/50 group-hover:border-purple-400 transition-colors" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-purple-500/50 group-hover:border-purple-400 transition-colors" />
                  <div className="font-orbitron font-black text-4xl text-purple-500/20 group-hover:text-purple-500/40 transition-colors mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-orbitron font-bold text-base text-white mb-2">{item.title}</h3>
                  <p className="font-rajdhani text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-purple-500/40 z-10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RANKS ── */}
        <section id="ranks" className="py-20 px-4 relative bg-black/30">
          <div className="absolute inset-0 bg-purple-glow opacity-30 pointer-events-none" />
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-14">
              <span className="font-orbitron text-xs text-purple-400 tracking-[0.4em] uppercase">Hierarchy</span>
              <h2 className="font-orbitron font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3">
                RANK SYSTEM
              </h2>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto mt-4" />
              <p className="font-rajdhani text-slate-400 mt-4 max-w-xl mx-auto">
                Every operative starts at F. Rise through discipline, consistency, and excellence. SS and SSS are reserved for the legendary few.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {RANKS.map((r) => (
                <div
                  key={r.rank}
                  className={`relative bg-card-bg border ${r.border} p-4 text-center group hover:scale-105 transition-all duration-300`}
                >
                  <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-30" />
                  <div className={`font-orbitron font-black text-3xl ${r.color} mb-1`}>{r.rank}</div>
                  <div className={`font-orbitron text-xs ${r.color} opacity-70 tracking-widest mb-2`}>{r.label}</div>
                  <div className="font-rajdhani text-slate-500 text-xs">{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── QUEST TYPES ── */}
        <section id="quests" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <span className="font-orbitron text-xs text-purple-400 tracking-[0.4em] uppercase">Operations</span>
              <h2 className="font-orbitron font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3">
                QUEST TYPES
              </h2>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto mt-4" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {QUEST_TYPES.map((q, i) => (
                <div
                  key={i}
                  className="relative bg-card-bg border border-purple-500/20 p-6 group hover:border-purple-400/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-all duration-300"
                >
                  <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-purple-500/40 group-hover:border-purple-400 transition-colors" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-purple-500/40 group-hover:border-purple-400 transition-colors" />
                  <div className="text-3xl mb-3">{q.icon}</div>
                  <h3 className="font-orbitron font-bold text-sm text-white mb-2">{q.label}</h3>
                  <p className="font-rajdhani text-slate-400 text-sm">{q.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST ── */}
        <section className="py-20 px-4 bg-black/30 relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <span className="font-orbitron text-xs text-purple-400 tracking-[0.4em] uppercase">Legitimacy</span>
            <h2 className="font-orbitron font-black text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-6">
              THIS IS REAL.
            </h2>
            <p className="font-rajdhani text-slate-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-12">
              QuestHub Guild is not a game. It is a structured, moderated platform with real quests, real admin oversight, real rank requirements, and real consequences for rule-breaking.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: '🛡️', title: 'Admin Moderated',   desc: 'Every quest, member, and submission is reviewed by trained admins.'         },
                { icon: '⚡',  title: 'Merit-Based',       desc: 'No shortcuts. Every rank is earned through consistent, quality work.'       },
                { icon: '🔒', title: 'Anti-Abuse System', desc: 'Strict rules, claim limits, moderation logs, and instant ban tools.'        },
              ].map((item, i) => (
                <div key={i} className="bg-card-bg border border-purple-500/20 p-6 text-left">
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <h3 className="font-orbitron font-bold text-sm text-white mb-2">{item.title}</h3>
                  <p className="font-rajdhani text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent pointer-events-none" />
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="font-orbitron font-black text-3xl sm:text-4xl md:text-5xl text-white mb-4 leading-tight">
              READY TO PROVE
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                YOUR WORTH?
              </span>
            </h2>
            <p className="font-rajdhani text-slate-400 text-base sm:text-lg mb-10">
              Create your account, submit your application, and let the Guild Council decide if you have what it takes.
            </p>
            <Link href="/auth/register">
              <GlowButton size="lg" variant="primary" className="animate-pulse-glow">
                Create Your Account
              </GlowButton>
            </Link>
          </div>
        </section>

      </Layout>
    </>
  )
}