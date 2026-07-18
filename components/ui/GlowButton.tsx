import { ButtonHTMLAttributes } from 'react'

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

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
    relative font-orbitron font-bold tracking-widest uppercase
    transition-all duration-300 overflow-hidden border
    focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400
  `

  const variants = {
    primary: `
      bg-gradient-to-r from-cyan-900/50 to-violet-900/50
      border-cyan-400/60 text-cyan-100
      hover:from-cyan-700/60 hover:to-violet-700/60
      hover:border-cyan-300 hover:text-white
      hover:shadow-[0_0_35px_rgba(34,211,238,0.45),0_0_35px_rgba(139,92,246,0.25),inset_0_0_20px_rgba(34,211,238,0.08)]
      active:scale-[0.98]
    `,
    secondary: `
      bg-transparent border-slate-600/50 text-slate-300
      hover:border-cyan-400/60 hover:text-cyan-200
      hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]
      active:scale-[0.98]
    `,
    danger: `
      bg-gradient-to-r from-red-900/60 to-red-800/40
      border-red-500/60 text-red-200
      hover:from-red-700/70 hover:border-red-400 hover:text-white
      hover:shadow-[0_0_35px_rgba(220,38,38,0.5)]
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent border-transparent text-slate-400
      hover:text-cyan-300 hover:border-cyan-400/30
      active:scale-[0.98]
    `,
  }

  const sizes = {
    sm: 'px-4 py-1.5 text-[10px]',
    md: 'px-6 py-2.5 text-xs',
    lg: 'px-8 py-3.5 text-sm',
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
      {/* Animated background shimmer */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none" />

      {/* Corner accents — top left */}
      <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400/80 pointer-events-none" />
      {/* Corner accents — top right */}
      <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400/80 pointer-events-none" />
      {/* Corner accents — bottom left */}
      <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400/80 pointer-events-none" />
      {/* Corner accents — bottom right */}
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400/80 pointer-events-none" />

      {/* Scanning line effect */}
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none" />

      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-cyan-400/30 border-t-cyan-300 rounded-full animate-spin" />
          <span className="tracking-widest">Processing...</span>
        </span>
      ) : (
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      )}
    </button>
  )
}