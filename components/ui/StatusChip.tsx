interface StatusChipProps {
  status: string
  size?: 'sm' | 'md'
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  // Member status
  ACTIVE:     { label: 'Active',     color: 'border-green-500/40 text-green-400 bg-green-900/20',   dot: 'bg-green-400' },
  SUSPENDED:  { label: 'Suspended',  color: 'border-yellow-500/40 text-yellow-400 bg-yellow-900/20',dot: 'bg-yellow-400' },
  BANNED:     { label: 'Banned',     color: 'border-red-500/40 text-red-400 bg-red-900/20',         dot: 'bg-red-400' },
  INACTIVE:   { label: 'Inactive',   color: 'border-slate-500/40 text-slate-400 bg-slate-900/20',   dot: 'bg-slate-400' },
  // Trial status
  PENDING:       { label: 'Pending',      color: 'border-yellow-500/40 text-yellow-400 bg-yellow-900/20', dot: 'bg-yellow-400 animate-pulse' },
  UNDER_REVIEW:  { label: 'Under Review', color: 'border-blue-500/40 text-blue-400 bg-blue-900/20',       dot: 'bg-blue-400 animate-pulse' },
  ACCEPTED:      { label: 'Accepted',     color: 'border-green-500/40 text-green-400 bg-green-900/20',    dot: 'bg-green-400' },
  REJECTED:      { label: 'Rejected',     color: 'border-red-500/40 text-red-400 bg-red-900/20',          dot: 'bg-red-400' },
  // Quest status
  OPEN:        { label: 'Open',        color: 'border-purple-500/40 text-purple-400 bg-purple-900/20', dot: 'bg-purple-400' },
  CLAIMED:     { label: 'Claimed',     color: 'border-blue-500/40 text-blue-400 bg-blue-900/20',       dot: 'bg-blue-400' },
  IN_PROGRESS: { label: 'In Progress', color: 'border-orange-500/40 text-orange-400 bg-orange-900/20', dot: 'bg-orange-400 animate-pulse' },
  SUBMITTED:   { label: 'Submitted',   color: 'border-yellow-500/40 text-yellow-400 bg-yellow-900/20', dot: 'bg-yellow-400' },
  APPROVED:    { label: 'Approved',    color: 'border-green-500/40 text-green-400 bg-green-900/20',    dot: 'bg-green-400' },
}

export default function StatusChip({ status, size = 'md' }: StatusChipProps) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: 'border-slate-500/40 text-slate-400 bg-slate-900/20',
    dot: 'bg-slate-400',
  }

  return (
    <span className={`
      inline-flex items-center gap-1.5 border font-orbitron tracking-widest uppercase
      ${cfg.color}
      ${size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-[10px]'}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}