// components/Trees.tsx
//
// "Technology behaving like nature" — trunks read as dark, near-silhouette
// forms (so the portal and butterflies stay the visual focus in front of
// them), canopies are built from glowing branch-light nodes rather than
// flat green foliage, per the brief: "Buttons grow from glowing vines made
// of light... Menus branch outward like leaves." No new dependencies —
// everything here is primitive geometry + emissive materials, kept low-poly
// since this sits behind an already-busy scene (portal + 24 butterflies).
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type TreeSpec = {
  position: [number, number, number]
  height: number
  canopyRadius: number
  color: string
  seed: number
}

// A loose ring of trees flanking the portal — far background layer, so
// they're pushed back in Z and spread wide in X, framing the scene rather
// than crowding it.
const TREES: TreeSpec[] = [
  { position: [-4.6, 0, -3.5], height: 3.4, canopyRadius: 1.1, color: '#00E5FF', seed: 1 },
  { position: [-3.1, 0, -4.8], height: 2.6, canopyRadius: 0.85, color: '#8B5CF6', seed: 2 },
  { position: [4.4, 0, -3.6], height: 3.6, canopyRadius: 1.15, color: '#00FFA3', seed: 3 },
  { position: [3.0, 0, -4.9], height: 2.5, canopyRadius: 0.8, color: '#8B5CF6', seed: 4 },
  { position: [-5.8, 0, -5.5], height: 4.2, canopyRadius: 1.3, color: '#00E5FF', seed: 5 },
  { position: [5.9, 0, -5.6], height: 4.0, canopyRadius: 1.25, color: '#00FFA3', seed: 6 },
  { position: [0.2, 0, -6.4], height: 3.0, canopyRadius: 1.0, color: '#8B5CF6', seed: 7 },
]

// Small glowing nodes scattered through the canopy volume — the "branches
// of light" detail. Positions are precomputed per tree rather than random
// every render, using a simple deterministic hash so it's stable and cheap.
function canopyNodes(spec: TreeSpec, count: number) {
  const nodes: THREE.Vector3[] = []
  for (let i = 0; i < count; i++) {
    const s = spec.seed * 97 + i * 13.7
    const theta = Math.sin(s) * Math.PI * 2
    const phi = Math.acos(2 * (Math.abs(Math.sin(s * 1.7)) % 1) - 1)
    const r = spec.canopyRadius * (0.5 + 0.5 * (Math.abs(Math.sin(s * 2.3)) % 1))
    nodes.push(
      new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        spec.height + spec.canopyRadius * 0.3 + r * Math.cos(phi) * 0.6,
        r * Math.sin(phi) * Math.sin(theta)
      )
    )
  }
  return nodes
}

function Tree({ spec, reducedMotion }: { spec: TreeSpec; reducedMotion: boolean }) {
  const nodes = useMemo(() => canopyNodes(spec, 10), [spec])
  const nodeRefs = useRef<THREE.Mesh[]>([])
  const trunkTop = spec.height

  useFrame(state => {
    if (reducedMotion) return
    const t = state.clock.elapsedTime
    // gentle asynchronous twinkle — each node pulses on its own phase so
    // the canopy reads as quietly alive rather than static
    nodeRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      const s = 0.7 + 0.3 * Math.sin(t * (0.6 + i * 0.07) + spec.seed * i)
      mesh.scale.setScalar(s)
    })
  })

  return (
    <group position={spec.position}>
      {/* Trunk — flat dark fill, no emissive: a true silhouette shape that
          lets the glowing canopy and the portal/butterflies in front of it
          stay the focal point. */}
      <mesh position={[0, trunkTop / 2, 0]}>
        <cylinderGeometry args={[0.06, 0.16, trunkTop, 6]} />
        <meshBasicMaterial color="#050510" />
      </mesh>
      {/* A couple of asymmetric branch stubs so the trunk doesn't read as a
          straight pole. */}
      <mesh position={[0.18, trunkTop * 0.7, 0.05]} rotation={[0, 0, -0.6]}>
        <cylinderGeometry args={[0.02, 0.05, trunkTop * 0.35, 5]} />
        <meshBasicMaterial color="#050510" />
      </mesh>
      <mesh position={[-0.15, trunkTop * 0.55, -0.08]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.02, 0.045, trunkTop * 0.3, 5]} />
        <meshBasicMaterial color="#050510" />
      </mesh>

      {/* Canopy — a soft glowing core plus scattered light-nodes standing
          in for "branches of light" rather than foliage. */}
      <mesh position={[0, trunkTop + spec.canopyRadius * 0.3, 0]}>
        <icosahedronGeometry args={[spec.canopyRadius * 0.55, 1]} />
        <meshBasicMaterial
          color={spec.color}
          transparent
          opacity={0.14}
          wireframe
        />
      </mesh>
      {nodes.map((pos, i) => (
        <mesh
          key={i}
          position={pos}
          ref={el => {
            if (el) nodeRefs.current[i] = el
          }}
        >
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshBasicMaterial color={spec.color} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  )
}

export default function Trees({ reducedMotion = false }: { reducedMotion?: boolean }) {
  return (
    <>
      {TREES.map((spec, i) => (
        <Tree key={i} spec={spec} reducedMotion={reducedMotion} />
      ))}
    </>
  )
}