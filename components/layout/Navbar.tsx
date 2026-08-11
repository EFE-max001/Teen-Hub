import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'

// v2 — restyled from the sharp-cornered cyan HUD look (diamond logo mark,
// uppercase Orbitron block caps, hard rectangular buttons) into the
// elegant glass/forest language: Cinzel small-caps type, rounded pill
// buttons, emerald/gold instead of flat cyan. Session/routing logic is
// unchanged from before.
export default function Navbar() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  const navLinks = [
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/#ranks',        label: 'Ranks'        },
    { href: '/#quests',       label: 'Quests'       },
    { href: '/#arena',        label: 'Protocols'    },
  ]

  return (
    <nav className="crystal-glass fixed top-0 left-0 right-0 z-50 bg-[#040A08]/85 backdrop-blur-md border-b border-portal-emerald/15">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-portal-gold/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="relative w-8 h-8 rounded-full border border-portal-emerald/50 bg-portal-emerald/[0.08] flex items-center justify-center group-hover:border-portal-gold/60 transition-colors duration-300">
              <span className="text-portal-emerald font-cinzel font-semibold text-xs group-hover:text-portal-gold transition-colors">Q</span>
            </div>
            <div>
              <span className="font-cinzel font-semibold text-portal-moonlight text-sm tracking-wide">QuestHub</span>
              <span className="block text-portal-gold/80 font-cinzel text-[10px] tracking-[0.3em]">GUILD</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex flex-col items-center">
            <div className="flex items-center gap-8">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-slate-400 hover:text-portal-emerald font-cinzel text-xs tracking-[0.15em] uppercase transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {/* Organic underline — a thin root-like track with a small
                light pulse traveling back and forth through it every few
                seconds, so the nav reads as part of the same living
                ecosystem instead of a static row of links. */}
            <div className="relative w-full h-px mt-3 bg-gradient-to-r from-transparent via-portal-emerald/20 to-transparent overflow-hidden">
              <div className="nav-pulse absolute top-0 h-full w-10 bg-gradient-to-r from-transparent via-portal-gold to-transparent" />
            </div>
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-portal-emerald hover:text-white font-cinzel text-xs tracking-[0.15em] uppercase transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: typeof window !== 'undefined' ? window.location.origin + '/' : '/' })}
                  className="rounded-full border border-portal-emerald/30 text-portal-emerald/90 hover:border-portal-gold/50 hover:text-white px-4 py-1.5 font-cinzel text-[11px] tracking-[0.15em] uppercase transition-all duration-200"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-slate-400 hover:text-portal-emerald font-cinzel text-xs tracking-[0.15em] uppercase transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-full bg-gradient-to-b from-portal-emerald/15 to-portal-gold/10 border border-portal-emerald/50 text-portal-moonlight hover:border-portal-gold/70 hover:text-white px-5 py-2 font-cinzel text-[11px] tracking-[0.15em] uppercase transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,163,0.25)]"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`w-6 h-0.5 rounded-full bg-portal-emerald transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-6 h-0.5 rounded-full bg-portal-emerald transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
            <span className={`w-6 h-0.5 rounded-full bg-portal-emerald transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#040A08]/98 border-t border-portal-emerald/15 px-4 py-6 flex flex-col gap-1">

          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-portal-emerald font-cinzel text-xs tracking-[0.15em] uppercase transition-colors rounded-lg border border-transparent hover:border-portal-emerald/20"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-portal-emerald/50 flex-shrink-0" />
              {link.label}
            </Link>
          ))}

          <div className="my-3 h-px bg-portal-emerald/15" />

          {session ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-portal-emerald hover:text-white font-cinzel text-xs tracking-[0.15em] uppercase transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-portal-emerald flex-shrink-0" />
                Dashboard
              </Link>
              <button
                onClick={() => { signOut({ callbackUrl: typeof window !== 'undefined' ? window.location.origin + '/' : '/' }); setMenuOpen(false) }}
                className="flex items-center gap-3 px-3 py-3 text-slate-500 hover:text-red-400 font-cinzel text-xs tracking-[0.15em] uppercase transition-colors text-left w-full"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-slate-300 hover:text-portal-emerald font-cinzel text-xs tracking-[0.15em] uppercase transition-colors rounded-lg border border-transparent hover:border-portal-emerald/20"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
                Login
              </Link>
              <Link
                href="/apply"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 mt-1 rounded-full bg-gradient-to-b from-portal-emerald/15 to-portal-gold/10 border border-portal-emerald/40 text-portal-moonlight hover:border-portal-gold/60 hover:text-white font-cinzel text-[11px] tracking-[0.15em] uppercase transition-all duration-200"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-portal-gold flex-shrink-0" />
                Apply Now →
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}