import { useEffect, useMemo, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import RobotAvatar from './RobotAvatar'
import Butterflies from './Butterflies'
import Grid from './Grid'
import Stars from './Stars'
import EnergyParticles from './EnergyParticles'

// Exact palette from the UI/UX Design Guide.
const COLORS = {
  background: '#050510',
  primary: '#9D4DFF',
  glow: '#C670FF',
  grid: '#5D2EFF',
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

// Positions/aims the camera. Fixed on a point left of scene-center — NOT on
// the avatar itself. (Pointing the camera directly at the avatar's own
// position cancels out any offset you give it, which is why it rendered
// dead-center over the headline before.) The avatar's own group position is
// what creates the visual offset to the right; the camera just holds still.
function CameraRig({ lookAtX }: { lookAtX: number }) {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(0, 2.3, 7.6)
    camera.lookAt(lookAtX, 1.9, 0)
    if (camera instanceof THREE.PerspectiveCamera) camera.updateProjectionMatrix()
  }, [lookAtX, camera])
  return null
}

export default function Scene({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const isMobile = useIsMobile()
  const avatarX = isMobile ? 0 : 2.6
  const lookAtX = isMobile ? 0 : -0.9
  const particleCount = isMobile ? 100 : 250

  // measured off the robot's actual mesh bounds once it loads (see
  // RobotAvatar's onCoreAnchor) rather than a hardcoded hand position
  const [coreAnchor, setCoreAnchor] = useState<THREE.Vector3 | undefined>(undefined)

  const dpr = useMemo<[number, number]>(() => (isMobile ? [1, 1.5] : [1, 2]), [isMobile])

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 34, near: 0.1, far: 100 }}
    >
      <color attach="background" args={[COLORS.background]} />
      <ambientLight intensity={0.5} color={COLORS.primary} />
      <directionalLight position={[2, 4, 3]} intensity={0.7} color={COLORS.primary} />
      {/* soft fill so the robot's metal reads with some shape instead of
          going flat/dark on its shadow side */}
      <directionalLight position={[-3, 2, -2]} intensity={0.25} color={COLORS.glow} />

      <CameraRig lookAtX={lookAtX} />
      <Stars isMobile={isMobile} />
      <Grid color={COLORS.grid} />

      <group position={[avatarX, 0, 0]}>
        <RobotAvatar color={COLORS.primary} reducedMotion={reducedMotion} onCoreAnchor={setCoreAnchor} />
        <EnergyParticles count={particleCount} color={COLORS.glow} origin={coreAnchor} />
        <Butterflies
          colors={[COLORS.glow, COLORS.primary]}
          reducedMotion={reducedMotion}
          count={isMobile ? 5 : 11}
        />
      </group>

      {/* Bloom is what turns the flat additive glow into the soft neon halo
          from the reference art — a plain emissive material can't produce
          that falloff on its own. Lighter settings on mobile to protect the
          frame budget. */}
      <EffectComposer multisampling={isMobile ? 0 : 4}>
        <Bloom
          luminanceThreshold={0.15}
          luminanceSmoothing={0.4}
          intensity={isMobile ? 0.8 : 1.3}
          mipmapBlur
          radius={0.6}
        />
        <Vignette eskil={false} offset={0.25} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  )
}