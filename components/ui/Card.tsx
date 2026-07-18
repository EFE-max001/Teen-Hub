import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  glow?: boolean
  onClick?: () => void
}

export default function Card({ children, className = '', glow = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        relative bg-[#0d0017] border border-cyan-500/20
        transition-all duration-300
        ${glow ? 'hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.12)]' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Corner accents */}
      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500/40 pointer-events-none" />
      <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/40 pointer-events-none" />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-500/40 pointer-events-none" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/40 pointer-events-none" />

      {children}
    </div>
  )
}