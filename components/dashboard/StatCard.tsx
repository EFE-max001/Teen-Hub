// Teen-Hub/components/dashboard/StatCard.tsx
interface StatCardProps {
  label: string
  value: string | number
  icon: string
  sub?: string
  color?: 'purple' | 'green' | 'blue' | 'red' | 'amber'
}

const COLOR_MAP = {
  purple: 'border-portal-emerald/30 text-portal-emerald',
  green:  'border-green-500/30 text-green-400',
  blue:   'border-blue-500/30 text-blue-400',
  red:    'border-red-500/30 text-red-400',
  amber:  'border-amber-500/30 text-amber-400',
}

export default function StatCard({ label, value, icon, sub, color = 'purple' }: StatCardProps) {
  const colors = COLOR_MAP[color]

  return (
    <div className={`relative crystal-glass bg-portal-black/70 backdrop-blur-md rounded-xl border ${colors} p-4 sm:p-5 group hover:shadow-[0_0_25px_rgba(0,255,163,0.08)] transition-all duration-300`}>

      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="font-cinzel text-[10px] text-slate-600 tracking-widest uppercase">{label}</span>
      </div>

      <div className="font-cinzel font-black text-2xl sm:text-3xl text-white mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {sub && (
        <p className="font-cormorant text-xs text-slate-600">{sub}</p>
      )}
    </div>
  )
}