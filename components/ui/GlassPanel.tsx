// Teen-Hub/components/ui/GlassPanel.tsx
//
// Advanced glass panel with realistic light reflection that responds to
// mouse position — simulates real glass catching ambient light as you move.
// Use this on any card/panel that should read as "carved from crystal"
// rather than flat translucent plastic.
import { motion } from 'framer-motion'
import { useRef } from 'react'

type GlassPanelProps = {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'crystal' | 'mirror'
  reflectionIntensity?: number
  onClick?: () => void
}

export default function GlassPanel({
  children,
  className = '',
  variant = 'crystal',
  reflectionIntensity = 0.7,
  onClick,
}: GlassPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  
  // Compute reflection gradient based on mouse position relative to panel
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!panelRef.current) return
    const rect = panelRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    
    panelRef.current.style.setProperty('--mouse-x', x.toString())
    panelRef.current.style.setProperty('--mouse-y', y.toString())
  }

  const baseStyles = "relative overflow-hidden backdrop-blur-md transition-all duration-300"
  
  const variants = {
    default: "bg-white/[0.03] border border-portal-emerald/15",
    crystal: "bg-white/[0.04] border border-portal-emerald/20 crystal-glass",
    mirror: "bg-gradient-to-br from-white/[0.08] via-transparent to-white/[0.02] border border-slate-300/20",
  }

  return (
    <motion.div
      ref={panelRef}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (panelRef.current) {
          panelRef.current.style.setProperty('--mouse-x', '0.5')
          panelRef.current.style.setProperty('--mouse-y', '0.5')
        }
      }}
      onClick={onClick}
      whileHover={{ 
        borderColor: 'rgba(0, 255, 163, 0.35)',
        boxShadow: '0 0 30px rgba(0, 255, 163, 0.08), inset 0 0 40px rgba(0, 255, 163, 0.03)'
      }}
      style={{
        '--reflection-intensity': reflectionIntensity.toString(),
      } as React.CSSProperties}
    >
      {/* Dynamic reflection overlay — follows cursor subtly */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse calc(80% * var(--reflection-intensity)) calc(60% * var(--reflection-intensity)) at calc(var(--mouse-x, 0.5) * 100%) calc(var(--mouse-y, 0.5) * 100%), rgba(255,255,255,0.12) 0%, transparent 60%)`,
        }}
      />
      
      {/* Edge highlight — simulates light catching the glass edge */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-40" />
        <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent opacity-50" />
        <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-40" />
      </div>
      
      {/* Content sits above all reflection layers */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
