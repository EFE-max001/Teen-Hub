// Teen-Hub/components/LivingBackground.tsx
// components/LivingBackground.tsx
//
// Phase 1 composite. Stacks the new lightweight atmosphere layers around
// the existing 3D scene (portal + butterflies + trees + grass), which now
// represents the redesign brief's "5% optimized low-poly 3D assets" slice
// rather than the whole background. Z-order, back to front:
//   fog (CSS)  →  3D scene (portal/trees/butterflies/grass)  →
//   glowing roots (SVG)  →  particle network (canvas2D, frontmost so it
//   reads as floating information in front of everything else)
import dynamic from 'next/dynamic'
import FogLayer from './FogLayer'
import GlowingRoots from './GlowingRoots'
import ParticleNetwork from './ParticleNetwork'

// R3F touches WebGL/canvas APIs that don't exist on the server.
const Scene = dynamic(() => import('./Scene'), { ssr: false })

export default function LivingBackground({
  reducedMotion = false,
  progress = 0,
}: {
  reducedMotion?: boolean
  progress?: number
}) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <FogLayer />
      <div className="absolute inset-0 pointer-events-auto">
        <Scene reducedMotion={reducedMotion} progress={progress} />
      </div>
      <GlowingRoots reducedMotion={reducedMotion} growth={progress} />
      <ParticleNetwork reducedMotion={reducedMotion} />
    </div>
  )
}