interface StatCardProps {
  label: string
  value: string | number
  icon: string
  sub?: string
  color?: 'purple' | 'green' | 'blue' | 'red' | 'amber'
}

const COLOR_MAP = {
  purple: 'border-purple-500/30 text-purple-400',
  green:  'border-green-500/30 text-green-400',
  blue:   'border-blue-500/30 text-blue-400',
  red:    'border-red-500/30 text-red-400',
  amber:  'border-amber-500/30 text-amber-400',
}

export default function StatCard({ label, value, icon, sub, color = 'purple' }: StatCardProps) {
  const colors = COLOR_MAP[color]

  return (
    <div className={`relative bg-[#0d0017] border ${colors} p-4 sm:p-5 group hover:shadow-[0_0_25px_rgba(168,85,247,0.08)] transition-all duration-300`}>
      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-current opacity-40" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-current opacity-40" />

      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="font-orbitron text-[10px] text-slate-600 tracking-widest uppercase">{label}</span>
      </div>

      <div className="font-orbitron font-black text-2xl sm:text-3xl text-white mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {sub && (
        <p className="font-rajdhani text-xs text-slate-600">{sub}</p>
      )}
    </div>
  )
}