// Teen-Hub/components/Scene.tsx
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import Butterflies from './Butterflies'
import Stars from './Stars'

// "Living Digital Forest" palette — tech + magic + nature. Cyan carries
// the tech read, gold carries magic, emerald carries nature, violet
// bridges tech/magic, moonlight is the soft neutral highlight.
const COLORS = {
  background: '#040A08',
  navy: '#0A1A16',
  cyan: '#00E5FF',
  emerald: '#00FFA3',
  violet: '#8B5CF6',
  gold: '#FFC65C',
  moonlight: '#D9EDE6',
  whiteGlow: '#F5FBFF',
}

// Portal ring, Crystal(s), HeartSeed, and the floor Grid were all part of
// the earlier "3D forest gate" scene and are intentionally removed here —
// they read as clutter on small screens and didn't earn their weight on
// mobile. Same reasoning already applied to Branch (sci-fi_artificial_tree)
// and now to GlowingRoots (removed from LivingBackground.tsx). What's left
// is the lightweight, universally-liked pair: butterflies + starfield
// sparkle — plus the 2D FogLayer/ParticleNetwork CSS/canvas layers that
// wrap this Canvas in LivingBackground.tsx.

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

// Slow, gentle drift — a wide shot of the starfield/butterflies rather than
// a camera locked onto a now-removed portal centerpiece.
function CameraRig({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const { camera } = useThree()
  const base = useRef(new THREE.Vector3(0, 1.6, 8.4))

  useEffect(() => {
    camera.position.copy(base.current)
    camera.lookAt(0, 1.4, 0)
    if (camera instanceof THREE.PerspectiveCamera) camera.updateProjectionMatrix()
  }, [camera])

  useFrame((state) => {
    if (reducedMotion) return
    const t = state.clock.elapsedTime
    const breatheX = Math.sin(t * 0.12) * 0.15
    const breatheY = Math.sin(t * 0.09) * 0.08
    const parallaxX = state.pointer.x * 0.18
    const parallaxY = state.pointer.y * 0.1

    camera.position.x = base.current.x + breatheX + parallaxX
    camera.position.y = base.current.y + breatheY + parallaxY
    camera.lookAt(0, 1.4, 0)
  })

  return null
}

export default function Scene({
  reducedMotion = false,
  progress = 0,
}: {
  reducedMotion?: boolean
  progress?: number
}) {
  const isMobile = useIsMobile()

  const dpr = useMemo<[number, number]>(() => (isMobile ? [1, 1.5] : [1, 2]), [isMobile])

  // "The World Evolves" — per the brief, more butterflies inhabit the
  // scene as a member's rank climbs. Base counts stay what they were for
  // guests/rank F (progress = 0).
  // Bumped from 6/11 base + 4/6 bonus — the flock now needs to feel like it
  // spans the whole page, not just cluster near the headline.
  const baseButterflyCount = isMobile ? 10 : 18
  const maxButterflyBonus = isMobile ? 6 : 6
  const butterflyCount = Math.min(24, Math.round(baseButterflyCount + progress * maxButterflyBonus))

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 52, near: 0.1, far: 100 }}
    >
      {/* No opaque background color here on purpose — this Canvas sits
          inside LivingBackground on top of the CSS FogLayer. Wider FOV
          (52 vs 38) so the flock spans a much larger horizontal area. */}
      <ambientLight intensity={0.6} color={COLORS.violet} />
      <directionalLight position={[2, 4, 3]} intensity={0.8} color={COLORS.cyan} />
      <directionalLight position={[-3, 2, -2]} intensity={0.5} color={COLORS.violet} />
      <pointLight position={[0, 3, -4.5]} intensity={0.6} color={COLORS.gold} distance={14} decay={2} />
      {/* Fill lights at the horizontal edges so peripheral butterflies,
          now visible thanks to the wider FOV, aren't left unlit. */}
      <pointLight position={[-8, 2, 0]} intensity={0.3} color={COLORS.emerald} distance={12} decay={2} />
      <pointLight position={[8, 2, 0]} intensity={0.3} color={COLORS.cyan} distance={12} decay={2} />

      <CameraRig reducedMotion={reducedMotion} />
      <Stars isMobile={isMobile} />

      <Suspense fallback={null}>
        <Butterflies
          colors={[COLORS.cyan, COLORS.violet, COLORS.emerald, COLORS.gold]}
          reducedMotion={reducedMotion}
          count={butterflyCount}
        />
      </Suspense>

      {/* Bloom turns the flat additive glow into a soft neon halo. Lighter
          settings on mobile to protect frame budget. */}
      <EffectComposer multisampling={isMobile ? 0 : 4}>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.4}
          intensity={isMobile ? 0.7 : 1.05}
          mipmapBlur
          radius={0.6}
        />
        <Vignette eskil={false} offset={0.25} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  )
}