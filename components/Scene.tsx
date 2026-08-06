// Teen-Hub/components/Scene.tsx
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import Butterflies from './Butterflies'
import Grid from './Grid'
import Stars from './Stars'
import Portal from './Portal'
import HeartSeed from './HeartSeed'
import Crystal from './Crystal'
import Trees from './Trees'

// "Living Digital Forest" palette — tech + magic + nature. Cyan carries
// the tech read, gold carries magic, emerald carries nature, violet
// bridges tech/magic, moonlight is the soft neutral highlight (text,
// portal core) rather than pure white.
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

// Branch (sci-fi_artificial_tree.glb) intentionally left out of the scene:
// its leaf-card texture turned out to be a sparse orange circuit-line
// graphic, not foliage — rendering it correctly (which the earlier material
// fix did) just makes that clearer, not better. Worth revisiting with a
// model that actually has leaf/foliage texture content, not this one tuned
// further.

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

// The camera looks at the portal, centered. Per the brief: "never stop the
// camera completely... an almost imperceptible drift, like breathing."
function CameraRig({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const { camera } = useThree()
  const base = useRef(new THREE.Vector3(0, 2.6, 8.4))

  useEffect(() => {
    camera.position.copy(base.current)
    camera.lookAt(0, 2.4, 0)
    if (camera instanceof THREE.PerspectiveCamera) camera.updateProjectionMatrix()
  }, [camera])

  useFrame((state) => {
    if (reducedMotion) return
    const t = state.clock.elapsedTime
    // small, slow sinusoidal drift — not a step forward, just breathing —
    // plus the faintest forward creep so the scene never feels frozen
    const breatheX = Math.sin(t * 0.12) * 0.12
    const breatheY = Math.sin(t * 0.09) * 0.06

    // subtle mouse parallax on top of the breathing drift — state.pointer
    // is already normalized device coordinates (-1..1) that R3F tracks
    // for us, so this needs no separate mousemove listener. Kept small on
    // purpose: per the brief, "tiny parallax, almost invisible, huge
    // immersion" — this is meant to be felt, not noticed.
    const parallaxX = state.pointer.x * 0.18
    const parallaxY = state.pointer.y * 0.1

    camera.position.x = base.current.x + breatheX + parallaxX
    camera.position.y = base.current.y + breatheY + parallaxY
    camera.position.z = base.current.z - Math.min(t * 0.01, 0.6)
    camera.lookAt(0, 2.4, 0)
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
  // scene and crystals brighten as a member's rank climbs. Base counts
  // stay exactly what they were for guests/rank F (progress = 0), so
  // nothing changes for anyone who hasn't earned rank yet.
  const baseButterflyCount = isMobile ? 6 : 11
  const maxButterflyBonus = isMobile ? 4 : 6
  const butterflyCount = Math.min(15, Math.round(baseButterflyCount + progress * maxButterflyBonus))
  const crystalBrightness = 1 + progress * 0.6

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 38, near: 0.1, far: 100 }}
    >
      {/* No opaque background color here on purpose — this Canvas now
          sits inside LivingBackground on top of the CSS FogLayer, and an
          opaque fill would completely hide it. */}
      <ambientLight intensity={0.5} color={COLORS.violet} />
      <directionalLight position={[2, 4, 3]} intensity={0.65} color={COLORS.cyan} />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} color={COLORS.violet} />
      <pointLight position={[0, 3, -4.5]} intensity={0.7} color={COLORS.gold} distance={14} decay={2} />

      <CameraRig reducedMotion={reducedMotion} />
      <Stars isMobile={isMobile} />
      <Grid color={COLORS.navy} />

      <Suspense fallback={null}>
        {/* Was built but never rendered anywhere — this is the actual "3D
            forest" layer the scene has been missing. Purely procedural
            (glowing trunk/branch/node geometry, no external GLB), so it
            costs nothing to load and matches the fresnel-glow material
            already used on the portal and crystals. */}
        <Trees reducedMotion={reducedMotion} />
        <Portal center={[0, 2.4, -0.3]} radius={1.9} reducedMotion={reducedMotion} />
        <HeartSeed position={[0, 2.4, -0.3]} glowColor={COLORS.gold} reducedMotion={reducedMotion} />
        <Crystal position={[2.6, 3.6, -0.8]} color={COLORS.cyan} scale={0.8} reducedMotion={reducedMotion} brightness={crystalBrightness} />
        {/* Mirrors the original crystal onto the left side, smaller and
            further back, so the scene doesn't read as lopsided/empty when
            the camera drifts. Uses the emerald palette color to reinforce
            the "nature" half of the tech+magic+nature read, and a lower
            brightness multiplier since it's meant to recede, not compete. */}
        <Crystal position={[-2.9, 3.1, -2.2]} color={COLORS.emerald} scale={0.5} reducedMotion={reducedMotion} brightness={crystalBrightness * 0.7} />
        {/* A third, small and deep in the background — gives the scene a
            sense of extending past the portal instead of stopping at it. */}
        <Crystal position={[0.6, 1.6, -4.5]} color={COLORS.violet} scale={0.35} reducedMotion={reducedMotion} brightness={crystalBrightness * 0.5} />
        <Butterflies
          colors={[COLORS.cyan, COLORS.violet, COLORS.emerald, COLORS.gold]}
          reducedMotion={reducedMotion}
          count={butterflyCount}
        />
      </Suspense>

      {/* Bloom turns the flat additive glow into the soft neon halo from
          the reference art. Lighter settings on mobile to protect frame
          budget. */}
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