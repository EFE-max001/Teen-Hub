import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import Butterflies from './Butterflies'
import Grid from './Grid'
import Stars from './Stars'
import Portal from './Portal'

// "Living Digital Forest" palette — replaces the earlier single-purple
// cyberpunk set. Restrained per the brief: midnight/navy base, electric
// cyan + emerald + violet accents, white glow for particles/highlights.
const COLORS = {
  background: '#03060A',
  navy: '#0A1428',
  cyan: '#00E5FF',
  emerald: '#00FFA3',
  violet: '#8B5CF6',
  whiteGlow: '#F5FBFF',
}

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
    camera.position.x = base.current.x + Math.sin(t * 0.12) * 0.12
    camera.position.y = base.current.y + Math.sin(t * 0.09) * 0.06
    camera.position.z = base.current.z - Math.min(t * 0.01, 0.6)
    camera.lookAt(0, 2.4, 0)
  })

  return null
}

export default function Scene({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const isMobile = useIsMobile()

  const dpr = useMemo<[number, number]>(() => (isMobile ? [1, 1.5] : [1, 2]), [isMobile])

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 38, near: 0.1, far: 100 }}
    >
      <color attach="background" args={[COLORS.background]} />
      <ambientLight intensity={0.55} color={COLORS.violet} />
      <directionalLight position={[2, 4, 3]} intensity={0.7} color={COLORS.cyan} />
      <directionalLight position={[-3, 2, -2]} intensity={0.5} color={COLORS.violet} />

      <CameraRig reducedMotion={reducedMotion} />
      <Stars isMobile={isMobile} />
      <Grid color={COLORS.navy} />

      <Suspense fallback={null}>
        <Portal center={[0, 2.4, -0.3]} radius={1.9} reducedMotion={reducedMotion} />
        <Butterflies
          colors={[COLORS.cyan, COLORS.violet, COLORS.emerald]}
          reducedMotion={reducedMotion}
          count={isMobile ? 10 : 24}
        />
      </Suspense>

      {/* Bloom turns the flat additive glow into the soft neon halo from
          the reference art. Lighter settings on mobile to protect frame
          budget. */}
      <EffectComposer multisampling={isMobile ? 0 : 4}>
        <Bloom
          luminanceThreshold={0.12}
          luminanceSmoothing={0.4}
          intensity={isMobile ? 0.9 : 1.4}
          mipmapBlur
          radius={0.65}
        />
        <Vignette eskil={false} offset={0.25} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  )
}