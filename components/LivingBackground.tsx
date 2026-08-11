// Teen-Hub/components/LivingBackground.tsx
// components/LivingBackground.tsx
//
// Stacks the lightweight atmosphere layers around the 3D scene. GlowingRoots
// (the SVG "branch"-like corner curves) and the portal/trees/crystals in
// Scene.tsx were removed — they read as clutter on mobile. What's left is
// deliberately light: fog (CSS) → 3D scene (stars + butterflies only) →
// particle sparkle (canvas2D, frontmost so it reads as floating light in
// front of everything else).
import dynamic from 'next/dynamic'
import FogLayer from './FogLayer'
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
      <ParticleNetwork reducedMotion={reducedMotion} />
    </div>
  )
}