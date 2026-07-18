import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { createPortalMaterial } from '../shaders/PortalMaterial'
import { createGlowMaterial } from '../shaders/GlowMaterial'

// Small floating "glass shard" polygons scattered around the ring — per the
// brief's "floating polygons" layer. Cheap low-poly geometry, each spinning
// on its own axis at its own speed so the cluster never looks synchronized.
type ShardConfig = {
  angle: number
  radius: number
  y: number
  scale: number
  spinSpeed: number
  geometry: 'tetra' | 'octa' | 'icosa'
  color: string
}

function Shard({ config }: { config: ShardConfig }) {
  const ref = useRef<THREE.Mesh>(null!)
  const material = useMemo(() => createGlowMaterial(config.color), [config.color])
  const geometry = useMemo(() => {
    switch (config.geometry) {
      case 'tetra':
        return new THREE.TetrahedronGeometry(config.scale)
      case 'octa':
        return new THREE.OctahedronGeometry(config.scale)
      default:
        return new THREE.IcosahedronGeometry(config.scale)
    }
  }, [config.geometry, config.scale])

  const x = Math.cos(config.angle) * config.radius
  const z = Math.sin(config.angle) * config.radius * 0.35

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    ref.current.rotation.x += delta * config.spinSpeed
    ref.current.rotation.y += delta * config.spinSpeed * 0.7
  })

  return <mesh ref={ref} position={[x, config.y, z]} geometry={geometry} material={material} />
}

const SHARDS: ShardConfig[] = [
  { angle: 0.3, radius: 2.05, y: 0.4, scale: 0.1, spinSpeed: 0.4, geometry: 'tetra', color: '#00E5FF' },
  { angle: 1.1, radius: 2.15, y: 0.9, scale: 0.07, spinSpeed: 0.55, geometry: 'octa', color: '#8B5CF6' },
  { angle: 2.0, radius: 1.95, y: 0.6, scale: 0.09, spinSpeed: 0.35, geometry: 'icosa', color: '#00FFA3' },
  { angle: 2.8, radius: 2.2, y: -0.3, scale: 0.08, spinSpeed: 0.48, geometry: 'tetra', color: '#8B5CF6' },
  { angle: 3.6, radius: 2.0, y: -0.7, scale: 0.11, spinSpeed: 0.3, geometry: 'octa', color: '#00E5FF' },
  { angle: 4.3, radius: 2.1, y: -0.35, scale: 0.06, spinSpeed: 0.6, geometry: 'icosa', color: '#00FFA3' },
  { angle: 5.0, radius: 1.9, y: 0.2, scale: 0.09, spinSpeed: 0.42, geometry: 'tetra', color: '#00E5FF' },
  { angle: 5.7, radius: 2.15, y: 0.75, scale: 0.07, spinSpeed: 0.5, geometry: 'octa', color: '#8B5CF6' },
]

export default function Portal({
  center = [0, 2.4, -0.3] as [number, number, number],
  radius = 1.9,
  reducedMotion = false,
}: {
  center?: [number, number, number]
  radius?: number
  reducedMotion?: boolean
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const ringMaterial = useMemo(() => createPortalMaterial('#00E5FF', '#8B5CF6'), [])
  const ringGeometry = useMemo(() => new THREE.TorusGeometry(radius, 0.035, 16, 220), [radius])

  useFrame((state, delta) => {
    ringMaterial.uniforms.uTime.value = state.clock.elapsedTime
    if (!reducedMotion) {
      groupRef.current.rotation.z += delta * 0.045
    }
  })

  return (
    <group position={center}>
      <group ref={groupRef}>
        <mesh geometry={ringGeometry} material={ringMaterial} />
      </group>
      {SHARDS.map((s, i) => (
        <Shard key={i} config={s} />
      ))}
      {/* particle motes drifting near the ring — "tiny particles" +
          "floating dust" layer from the brief */}
      <Sparkles
        count={70}
        scale={[radius * 2.3, radius * 2.3, 1.2]}
        size={2.2}
        speed={reducedMotion ? 0 : 0.25}
        color="#F5FBFF"
        opacity={0.7}
      />
    </group>
  )
}