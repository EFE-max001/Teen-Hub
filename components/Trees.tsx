// components/Trees.tsx
//
// v2 — the first pass (a trunk + one big wireframe icosahedron canopy) read
// as a floating glowing ball, not a tree: the trunk color (#050510) was
// nearly identical to the scene background (#03060A) and effectively
// invisible, and a single smooth sphere doesn't carry any branching
// silhouette. This version fixes both: the trunk uses the same fresnel
// rim-glow material as the portal/butterflies so it's actually visible as
// a silhouette against the stars, and the canopy is built from individual
// branches fanning out from the crown — each ending in a small bright
// node — so it reads as a structure, not a blob. Tech + magic + nature:
// branches are glowing energy conduits (tech), tipped with gold/emerald
// light-nodes (magic + nature) rather than literal foliage.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createGlowMaterial } from '../shaders/GlowMaterial'

type Branch = {
  start: THREE.Vector3
  dir: THREE.Vector3
  length: number
  radius: number
  twig?: { dir: THREE.Vector3; length: number }
}

type TreeSpec = {
  position: [number, number, number]
  height: number
  spread: number
  color: string
  seed: number
}

// Loose ring flanking the portal — far background layer, pushed back in Z
// and spread wide in X so they frame the scene rather than crowd it.
const TREES: TreeSpec[] = [
  { position: [-4.6, 0, -4.2], height: 3.0, spread: 1.5, color: '#FFC65C', seed: 1 },
  { position: [-3.0, 0, -5.6], height: 2.3, spread: 1.1, color: '#00FFA3', seed: 2 },
  { position: [4.4, 0, -4.3], height: 3.2, spread: 1.6, color: '#00FFA3', seed: 3 },
  { position: [3.0, 0, -5.7], height: 2.2, spread: 1.0, color: '#FFC65C', seed: 4 },
  { position: [-5.9, 0, -6.4], height: 3.7, spread: 1.8, color: '#FFC65C', seed: 5 },
  { position: [5.9, 0, -6.5], height: 3.5, spread: 1.7, color: '#00FFA3', seed: 6 },
]

// Cheap deterministic pseudo-random in [0,1), seeded — stable across
// re-renders without needing to store generated branches in state.
function rand(seed: number) {
  const x = Math.sin(seed * 127.1) * 43758.5453
  return x - Math.floor(x)
}

function buildBranches(spec: TreeSpec): Branch[] {
  const trunkTop = new THREE.Vector3(0, spec.height, 0)
  const count = 5
  const branches: Branch[] = []
  for (let i = 0; i < count; i++) {
    const s = spec.seed * 31 + i * 7.3
    const theta = rand(s) * Math.PI * 2
    // mostly upward (60°–85° from horizontal) so it reads as a crown, not
    // a starburst
    const phi = THREE.MathUtils.degToRad(55 + rand(s + 1) * 30)
    const dir = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    ).normalize()
    const length = spec.spread * (0.6 + rand(s + 2) * 0.5)
    const branch: Branch = {
      start: trunkTop,
      dir,
      length,
      radius: 0.03 + rand(s + 3) * 0.015,
    }
    // a couple of branches get a secondary twig for a less symmetric,
    // more fractal-feeling crown
    if (i % 2 === 0) {
      const twigTheta = theta + (rand(s + 4) - 0.5) * 1.4
      const twigPhi = phi - THREE.MathUtils.degToRad(15 + rand(s + 5) * 15)
      branch.twig = {
        dir: new THREE.Vector3(
          Math.sin(twigPhi) * Math.cos(twigTheta),
          Math.cos(twigPhi),
          Math.sin(twigPhi) * Math.sin(twigTheta)
        ).normalize(),
        length: length * 0.55,
      }
    }
    branches.push(branch)
  }
  return branches
}

const UP = new THREE.Vector3(0, 1, 0)

// Cylinders default to extending along +Y from their own center — this
// gives the position/quaternion to place one running from `start` along
// `dir` for `length` units.
function segmentTransform(start: THREE.Vector3, dir: THREE.Vector3, length: number) {
  const mid = start.clone().addScaledVector(dir, length / 2)
  const quat = new THREE.Quaternion().setFromUnitVectors(UP, dir)
  const end = start.clone().addScaledVector(dir, length)
  return { mid, quat, end }
}

function Tree({ spec, reducedMotion }: { spec: TreeSpec; reducedMotion: boolean }) {
  const branches = useMemo(() => buildBranches(spec), [spec])
  const trunkMaterial = useMemo(() => createGlowMaterial(spec.color), [spec.color])
  const nodeRefs = useRef<THREE.Mesh[]>([])

  useFrame(state => {
    trunkMaterial.uniforms.uTime.value = state.clock.elapsedTime
    if (reducedMotion) return
    const t = state.clock.elapsedTime
    nodeRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      const s = 0.75 + 0.25 * Math.sin(t * (0.5 + i * 0.06) + spec.seed * i)
      mesh.scale.setScalar(s)
    })
  })

  let nodeIndex = 0

  return (
    <group position={spec.position}>
      {/* Trunk — same fresnel rim-glow material as the portal/butterflies,
          so it reads as an actual silhouette against the stars instead of
          disappearing into the background like the flat-fill version did. */}
      <mesh position={[0, spec.height / 2, 0]}>
        <cylinderGeometry args={[0.05, 0.14, spec.height, 6]} />
        <primitive object={trunkMaterial} attach="material" />
      </mesh>

      {/* Root flare — two short stubs so the base doesn't look like a pole
          planted straight into the ground. */}
      <mesh position={[0.1, 0.06, 0.04]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.02, 0.06, 0.22, 5]} />
        <primitive object={trunkMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.09, 0.06, -0.05]} rotation={[0, 0, 0.45]}>
        <cylinderGeometry args={[0.02, 0.055, 0.2, 5]} />
        <primitive object={trunkMaterial} attach="material" />
      </mesh>

      {/* Crown — branches fanning from the trunk top, each a tapered
          conduit ending in a small bright node. */}
      {branches.map((b, i) => {
        const { mid, quat, end } = segmentTransform(b.start, b.dir, b.length)
        const idx = nodeIndex++
        const twig = b.twig
        let twigEnd: THREE.Vector3 | null = null
        let twigIdx = -1
        if (twig) {
          const t = segmentTransform(end, twig.dir, twig.length)
          twigEnd = t.end
          twigIdx = nodeIndex++
        }
        return (
          <group key={i}>
            <mesh position={mid} quaternion={quat}>
              <cylinderGeometry args={[b.radius * 0.3, b.radius, b.length, 5]} />
              <primitive object={trunkMaterial} attach="material" />
            </mesh>
            <mesh
              position={end}
              ref={el => {
                if (el) nodeRefs.current[idx] = el
              }}
            >
              <icosahedronGeometry args={[0.05 + rand(spec.seed + i) * 0.03, 0]} />
              <meshBasicMaterial color={spec.color} transparent opacity={0.9} />
            </mesh>
            {twig && twigEnd && (
              <>
                <mesh
                  position={end.clone().addScaledVector(twig.dir, twig.length / 2)}
                  quaternion={new THREE.Quaternion().setFromUnitVectors(UP, twig.dir)}
                >
                  <cylinderGeometry args={[b.radius * 0.15, b.radius * 0.35, twig.length, 5]} />
                  <primitive object={trunkMaterial} attach="material" />
                </mesh>
                <mesh
                  position={twigEnd}
                  ref={el => {
                    if (el) nodeRefs.current[twigIdx] = el
                  }}
                >
                  <icosahedronGeometry args={[0.035, 0]} />
                  <meshBasicMaterial color={spec.color} transparent opacity={0.85} />
                </mesh>
              </>
            )}
          </group>
        )
      })}
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