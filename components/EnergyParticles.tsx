// components/EnergyParticles.tsx
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const DEFAULT_ORIGIN = new THREE.Vector3(0.6, 2.6, 0.4)

// Energy flows from the robot's chest core down into the grid. Origin is
// passed in (rather than imported from a specific avatar file) since it's
// measured at runtime off the robot's actual mesh bounds — see
// RobotAvatar's onCoreAnchor.
export default function EnergyParticles({
  count = 150,
  color = '#C670FF',
  origin = DEFAULT_ORIGIN,
}: {
  count?: number
  color?: string
  origin?: THREE.Vector3
}) {
  const pointsRef = useRef<THREE.Points>(null!)
  const target = useMemo(() => new THREE.Vector3(-0.4, 0, 1.9), [])

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) seeds[i] = Math.random()
    return { positions, seeds }
  }, [count])

  useFrame(state => {
    const t = state.clock.elapsedTime
    const geo = pointsRef.current.geometry
    const attr = geo.attributes.position as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    for (let i = 0; i < count; i++) {
      const phase = (t * 0.35 + seeds[i]) % 1
      const wobble = Math.sin(phase * 10 + seeds[i] * 20) * 0.06 * (1 - phase)
      arr[i * 3] = origin.x + (target.x - origin.x) * phase + wobble
      arr[i * 3 + 1] = origin.y + (target.y - origin.y) * phase
      arr[i * 3 + 2] = origin.z + (target.z - origin.z) * phase + wobble
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.045}
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}