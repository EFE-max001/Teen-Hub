interface RankBadgeProps {
  rank: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const RANK_CONFIG: Record<string, { color: string; glow: string; label: string; border: string }> = {
  F:   { color: 'text-slate-400',   glow: 'shadow-none',                                    label: 'Initiate',  border: 'border-slate-600/50' },
  E:   { color: 'text-green-400',   glow: 'shadow-[0_0_10px_rgba(74,222,128,0.3)]',          label: 'Operative', border: 'border-green-600/50' },
  D:   { color: 'text-blue-400',    glow: 'shadow-[0_0_10px_rgba(96,165,250,0.3)]',          label: 'Specialist',border: 'border-blue-600/50'  },
  C:   { color: 'text-yellow-400',  glow: 'shadow-[0_0_10px_rgba(250,204,21,0.3)]',          label: 'Vanguard',  border: 'border-yellow-600/50'},
  B:   { color: 'text-orange-400',  glow: 'shadow-[0_0_10px_rgba(251,146,60,0.3)]',          label: 'Commander', border: 'border-orange-600/50'},
  A:   { color: 'text-purple-400',  glow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]',          label: 'Elite',     border: 'border-purple-500/60'},
  S:   { color: 'text-pink-400',    glow: 'shadow-[0_0_20px_rgba(244,114,182,0.6)]',         label: 'Sovereign', border: 'border-pink-500/60'  },
  SS:  { color: 'text-red-400',     glow: 'shadow-[0_0_25px_rgba(248,113,113,0.7)]',         label: 'Warlord',   border: 'border-red-500/60'   },
  SSS: { color: 'text-amber-300',   glow: 'shadow-[0_0_30px_rgba(252,211,77,0.8)]',          label: 'Mythic',    border: 'border-amber-400/70' },
}

const sizes = {
  sm: { wrap: 'w-8 h-8',   text: 'text-xs',  label: 'text-[9px]'  },
  md: { wrap: 'w-12 h-12', text: 'text-base', label: 'text-[10px]' },
  lg: { wrap: 'w-16 h-16', text: 'text-xl',   label: 'text-xs'     },
}

export default function RankBadge({ rank, size = 'md', showLabel = false }: RankBadgeProps) {
  const cfg = RANK_CONFIG[rank] ?? RANK_CONFIG['F']
  const s = sizes[size]

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`
        relative ${s.wrap} border ${cfg.border} ${cfg.glow}
        rotate-45 flex items-center justify-center
        bg-black/60 flex-shrink-0
      `}>
        <span className={`-rotate-45 font-orbitron font-black ${s.text} ${cfg.color}`}>
          {rank}
        </span>
        {/* Inner glow */}
        <span className="absolute inset-0 bg-current opacity-5 rounded-sm" />
      </div>
      {showLabel && (
        <span className={`font-orbitron ${s.label} ${cfg.color} tracking-widest uppercase`}>
          {cfg.label}
        </span>
      )}
    </div>
  )
}