import { ButtonHTMLAttributes } from 'react'

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

// v2 — rewritten from the old sharp-cornered HUD-bracket/scanline button
// (which read as military/technical) into the rounded glass "living
// crystal" pill from the redesign reference: soft translucent fill, a
// thin glowing border, and a root/vine underline that grows in on hover
// instead of a scanline. Same prop API as before (variant/size/loading) on
// purpose — this is a drop-in replacement, every existing call site across
// the app picks it up without changes.
export default function GlowButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}: GlowButtonProps) {
  const base = `
    group relative font-cinzel font-semibold tracking-wide
    transition-all duration-300 rounded-full border
    focus:outline-none focus-visible:ring-2 focus-visible:ring-portal-emerald/60
  `

  const variants = {
    primary: `
      bg-gradient-to-b from-portal-emerald/[0.12] to-portal-gold/[0.08]
      backdrop-blur-sm border-portal-emerald/50 text-portal-moonlight
      hover:border-portal-gold/70 hover:text-white
      hover:shadow-[0_0_28px_rgba(0,255,163,0.25),0_0_18px_rgba(255,198,92,0.2)]
      active:scale-[0.98]
    `,
    secondary: `
      bg-white/[0.03] backdrop-blur-sm border-portal-cyan/30 text-slate-300
      hover:border-portal-cyan/60 hover:text-portal-moonlight
      hover:shadow-[0_0_20px_rgba(0,229,255,0.18)]
      active:scale-[0.98]
    `,
    danger: `
      bg-red-950/30 backdrop-blur-sm border-red-500/40 text-red-200
      hover:border-red-400/70 hover:text-white
      hover:shadow-[0_0_24px_rgba(220,38,38,0.35)]
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent border-transparent text-slate-400
      hover:text-portal-emerald hover:border-portal-emerald/20
      active:scale-[0.98]
    `,
  }

  const sizes = {
    sm: 'px-5 py-2 text-[11px]',
    md: 'px-7 py-2.5 text-xs',
    lg: 'px-9 py-3.5 text-sm',
  }

  return (
    <button
      className={`
        ${base} ${variants[variant]} ${sizes[size]} ${className}
        ${disabled || loading ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {/* Root/vine underline — grows in on hover from the center outward,
          replacing the old scanline effect with something that matches
          the "everything grows" interaction philosophy. */}
      <span
        className="absolute left-1/2 bottom-1 h-px w-0 -translate-x-1/2 bg-gradient-to-r from-transparent via-portal-gold/70 to-transparent transition-all duration-500 ease-out group-hover:w-3/4 pointer-events-none"
        aria-hidden
      />

      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-portal-emerald/30 border-t-portal-emerald rounded-full animate-spin" />
          <span className="tracking-wide">Processing...</span>
        </span>
      ) : (
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      )}
    </button>
  )
}