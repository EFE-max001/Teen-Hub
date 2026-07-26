// components/ui/OrnamentDivider.tsx
//
// The thin gold hairline-with-a-leaf-glyph divider under section labels
// and headlines in the reference mockups. Small, reusable, no dependencies.
export default function OrnamentDivider({
  color = '#FFC65C',
  className = '',
}: {
  color?: string
  className?: string
}) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className="h-px w-10 sm:w-16" style={{ background: `linear-gradient(to right, transparent, ${color})` }} />
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color }}>
        <path
          d="M12 2C9 6 6 9 6 13a6 6 0 0 0 12 0c0-4-3-7-6-11Z"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="currentColor"
          fillOpacity="0.25"
        />
        <path d="M12 13V22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span className="h-px w-10 sm:w-16" style={{ background: `linear-gradient(to left, transparent, ${color})` }} />
    </div>
  )
}