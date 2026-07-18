import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="relative bg-black border-t border-cyan-500/20 mt-20">
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="font-orbitron font-black text-white text-lg tracking-widest mb-1">QUESTHUB</div>
            <div className="font-rajdhani text-cyan-400 tracking-[0.3em] text-sm mb-4">GUILD</div>
            <p className="text-slate-500 text-sm font-rajdhani leading-relaxed">
              An elite guild platform for talented teens ready to prove themselves and rise through the ranks.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-orbitron text-xs text-cyan-400 tracking-widest uppercase mb-4">Platform</h4>
            <ul className="flex flex-col gap-2">
              {[['/', 'Home'], ['/apply', 'Apply'], ['/auth/login', 'Login'], ['/auth/register', 'Register']].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-slate-500 hover:text-cyan-300 text-sm font-rajdhani tracking-wide transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-orbitron text-xs text-cyan-400 tracking-widest uppercase mb-4">Guild</h4>
            <ul className="flex flex-col gap-2">
              {[['/#ranks', 'Ranks'], ['/#quests', 'Quests'], ['/#how-it-works', 'How It Works']].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-slate-500 hover:text-cyan-300 text-sm font-rajdhani tracking-wide transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-orbitron text-xs text-cyan-400 tracking-widest uppercase mb-4">Status</h4>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-slate-500 text-sm font-rajdhani">Systems Online</span>
            </div>
            <p className="text-slate-600 text-xs font-rajdhani mt-3">Accepting applications</p>
          </div>
        </div>

        <div className="border-t border-cyan-500/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-700 text-xs font-rajdhani tracking-wider">
            © {new Date().getFullYear()} QUESTHUB GUILD. ALL RIGHTS RESERVED.
          </p>
          <p className="text-slate-700 text-xs font-rajdhani tracking-wider">
            BUILT FOR THE ELITE. EARNED BY THE WORTHY.
          </p>
        </div>
      </div>
    </footer>
  )
}