// Teen-Hub/components/ui/Card.tsx
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  glow?: boolean
  onClick?: () => void
}

// Rewritten to match the landing page's glass-panel language (translucent
// fill + backdrop-blur + soft rounded corners) instead of the old flat
// solid panel with sharp HUD corner-accents — this is the shared card used
// across dashboard pages, so fixing it here fixes every page that renders one.
export default function Card({ children, className = '', glow = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        relative crystal-glass rounded-2xl bg-white/[0.03] border border-portal-emerald/15 backdrop-blur-sm
        transition-all duration-300
        ${glow ? 'hover:border-portal-gold/40 hover:bg-portal-emerald/[0.04] hover:shadow-[0_0_30px_rgba(0,255,163,0.12)]' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}