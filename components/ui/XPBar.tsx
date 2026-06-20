interface XPBarProps {
  xp: number
  rank: string
  showNumbers?: boolean
}

const RANK_THRESHOLDS: Record<string, { min: number; max: number; next: string | null }> = {
  F:   { min: 0,    max: 100,  next: 'E'   },
  E:   { min: 100,  max: 300,  next: 'D'   },
  D:   { min: 300,  max: 700,  next: 'C'   },
  C:   { min: 700,  max: 1500, next: 'B'   },
  B:   { min: 1500, max: 3000, next: 'A'   },
  A:   { min: 3000, max: 6000, next: 'S'   },
  S:   { min: 6000, max: 12000,next: 'SS'  },
  SS:  { min: 12000,max: 25000,next: 'SSS' },
  SSS: { min: 25000,max: 25000,next: null  },
}

const RANK_COLORS: Record<string, string> = {
  F:   'from-slate-600 to-slate-500',
  E:   'from-green-700 to-green-500',
  D:   'from-blue-700 to-blue-500',
  C:   'from-yellow-700 to-yellow-500',
  B:   'from-orange-700 to-orange-500',
  A:   'from-purple-700 to-purple-500',
  S:   'from-pink-700 to-pink-500',
  SS:  'from-red-700 to-red-500',
  SSS: 'from-amber-600 to-amber-400',
}

export default function XPBar({ xp, rank, showNumbers = true }: XPBarProps) {
  const threshold = RANK_THRESHOLDS[rank] ?? RANK_THRESHOLDS['F']
  const progress = threshold.max === threshold.min
    ? 100
    : Math.min(100, Math.round(((xp - threshold.min) / (threshold.max - threshold.min)) * 100))
  const gradient = RANK_COLORS[rank] ?? RANK_COLORS['F']

  return (
    <div className="w-full flex flex-col gap-1.5">
      {showNumbers && (
        <div className="flex items-center justify-between">
          <span className="font-orbitron text-[10px] text-purple-300/70 tracking-widest uppercase">
            XP Progress
          </span>
          <span className="font-orbitron text-[10px] text-slate-500 tracking-widest">
            {xp.toLocaleString()} / {threshold.max.toLocaleString()}
          </span>
        </div>
      )}

      {/* Track */}
      <div className="relative h-2 w-full bg-black/60 border border-purple-500/20 overflow-hidden">
        {/* Fill */}
        <div
          className={`h-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out relative`}
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </div>

        {/* Tick marks every 25% */}
        {[25, 50, 75].map(pct => (
          <span
            key={pct}
            className="absolute top-0 bottom-0 w-px bg-black/40"
            style={{ left: `${pct}%` }}
          />
        ))}
      </div>

      {showNumbers && threshold.next && (
        <p className="font-rajdhani text-[11px] text-slate-600">
          {threshold.max - xp > 0
            ? `${(threshold.max - xp).toLocaleString()} XP until rank ${threshold.next}`
            : `Ready for rank-up to ${threshold.next}!`}
        </p>
      )}
    </div>
  )
}