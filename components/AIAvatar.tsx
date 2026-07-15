// components/AIAvatar.tsx
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { createGlowMaterial } from '../shaders/GlowMaterial'

// ── Skeleton ──────────────────────────────────────────────────────────────
// Real joint coordinates for a standing humanoid, one arm extended forward —
// shoulder→elbow→wrist, hip→knee→ankle, spine, head. Exported so
// EnergyParticles.tsx can start its stream exactly at the fingertip of the
// extended hand.
export const JOINTS = {
  pelvis:    new THREE.Vector3(0, 1.55, 0),
  chest:     new THREE.Vector3(0, 2.75, 0),
  neckTop:   new THREE.Vector3(0, 3.0, 0),
  head:      new THREE.Vector3(0, 3.3, 0),

  hipL:      new THREE.Vector3(-0.18, 1.55, 0),
  kneeL:     new THREE.Vector3(-0.24, 0.85, 0.02),
  ankleL:    new THREE.Vector3(-0.23, 0.22, 0.04),
  footL:     new THREE.Vector3(-0.22, 0.05, 0.08),

  hipR:      new THREE.Vector3(0.18, 1.55, 0),
  kneeR:     new THREE.Vector3(0.24, 0.85, 0.02),
  ankleR:    new THREE.Vector3(0.23, 0.22, 0.04),
  footR:     new THREE.Vector3(0.22, 0.05, 0.08),

  clavicleL: new THREE.Vector3(-0.22, 2.75, 0),
  shoulderL: new THREE.Vector3(-0.42, 2.75, 0),
  elbowL:    new THREE.Vector3(-0.55, 2.05, 0.08),
  wristL:    new THREE.Vector3(-0.5, 1.42, 0.15),

  clavicleR: new THREE.Vector3(0.22, 2.75, 0),
  shoulderR: new THREE.Vector3(0.42, 2.75, 0),
  elbowR:    new THREE.Vector3(0.85, 2.45, 0.3),
  // extended forward/down — energy flows from the fingertip into the grid
  wristR:    new THREE.Vector3(1.25, 1.85, 0.6),
} as const

// Derived tip points, computed from the skeleton so they stay in
// proportion automatically — toes extend forward from the foot, fingertips
// extend along the forearm direction past the wrist.
function extend(from: THREE.Vector3, to: THREE.Vector3, amount: number) {
  return to.clone().add(to.clone().sub(from).normalize().multiplyScalar(amount))
}

const neckBase = JOINTS.head.clone().add(new THREE.Vector3(0, -0.22, 0))
const footTipL = JOINTS.footL.clone().add(new THREE.Vector3(0, -0.02, 0.26))
const footTipR = JOINTS.footR.clone().add(new THREE.Vector3(0, -0.02, 0.26))
const handTipL = extend(JOINTS.elbowL, JOINTS.wristL, 0.16)
// exported — this is where EnergyParticles.tsx should start its stream
export const handTipR = extend(JOINTS.elbowR, JOINTS.wristR, 0.2)

// ── Procedural continuous mesh ───────────────────────────────────────────
// Instead of separate capsule "bones" glued together at ball-joint spheres
// (which read as a crude Tinkertoy skeleton), every limb is one tapered,
// faceted tube whose ring vertices are shared between segments — so the
// surface flows continuously from shoulder to elbow to wrist with no seam,
// closer to a real low-poly character mesh than a rigged stick figure.
const RADIAL_SEGMENTS = 6 // low, deliberately faceted — smooth tubes read as generic

function ringBasis(tangent: THREE.Vector3) {
  const t = tangent.clone().normalize()
  // fall back to a different reference axis when the limb runs near-vertical
  // (spine, legs) so cross() doesn't degenerate
  const ref = Math.abs(t.y) > 0.98 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0)
  const right = new THREE.Vector3().crossVectors(ref, t).normalize()
  const up = new THREE.Vector3().crossVectors(t, right).normalize()
  return { right, up }
}

function buildTaperedTube(points: THREE.Vector3[], radii: number[]): THREE.BufferGeometry {
  const n = points.length
  const positions: number[] = []
  const indices: number[] = []

  // one shared ring per control point, oriented by the averaged direction of
  // its neighboring segments so consecutive tube sections don't twist
  const rings: THREE.Vector3[][] = []
  for (let i = 0; i < n; i++) {
    const prev = points[Math.max(i - 1, 0)]
    const next = points[Math.min(i + 1, n - 1)]
    const tangent = new THREE.Vector3().subVectors(next, prev)
    if (tangent.lengthSq() < 1e-8) tangent.set(0, 1, 0)
    const { right, up } = ringBasis(tangent)
    const ring: THREE.Vector3[] = []
    for (let k = 0; k < RADIAL_SEGMENTS; k++) {
      const angle = (k / RADIAL_SEGMENTS) * Math.PI * 2
      const r = right.clone().multiplyScalar(Math.cos(angle) * radii[i])
      const u = up.clone().multiplyScalar(Math.sin(angle) * radii[i])
      ring.push(points[i].clone().add(r).add(u))
    }
    rings.push(ring)
  }

  rings.forEach(ring => ring.forEach(v => positions.push(v.x, v.y, v.z)))

  for (let i = 0; i < n - 1; i++) {
    const a = i * RADIAL_SEGMENTS
    const b = (i + 1) * RADIAL_SEGMENTS
    for (let k = 0; k < RADIAL_SEGMENTS; k++) {
      const k2 = (k + 1) % RADIAL_SEGMENTS
      indices.push(a + k, b + k, b + k2)
      indices.push(a + k, b + k2, a + k2)
    }
  }

  // flat fan caps at both ends so the tube doesn't read as hollow tubing
  const startCenterIdx = positions.length / 3
  positions.push(points[0].x, points[0].y, points[0].z)
  for (let k = 0; k < RADIAL_SEGMENTS; k++) {
    const k2 = (k + 1) % RADIAL_SEGMENTS
    indices.push(startCenterIdx, k2, k)
  }
  const endCenterIdx = positions.length / 3
  const lastPoint = points[n - 1]
  positions.push(lastPoint.x, lastPoint.y, lastPoint.z)
  const lastRingStart = (n - 1) * RADIAL_SEGMENTS
  for (let k = 0; k < RADIAL_SEGMENTS; k++) {
    const k2 = (k + 1) % RADIAL_SEGMENTS
    indices.push(endCenterIdx, lastRingStart + k, lastRingStart + k2)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

function buildBodyGeometry(): THREE.BufferGeometry {
  const chains: Array<[THREE.Vector3[], number[]]> = [
    // spine + neck
    [[JOINTS.pelvis, JOINTS.chest, JOINTS.neckTop, neckBase], [0.2, 0.34, 0.14, 0.12]],
    // legs
    [[JOINTS.hipL, JOINTS.kneeL, JOINTS.ankleL, JOINTS.footL, footTipL], [0.16, 0.115, 0.08, 0.09, 0.05]],
    [[JOINTS.hipR, JOINTS.kneeR, JOINTS.ankleR, JOINTS.footR, footTipR], [0.16, 0.115, 0.08, 0.09, 0.05]],
    // arms — start at the clavicle point so they emerge from inside the
    // chest tube's radius instead of floating detached from the torso
    [[JOINTS.clavicleL, JOINTS.shoulderL, JOINTS.elbowL, JOINTS.wristL, handTipL], [0.14, 0.125, 0.085, 0.055, 0.03]],
    [[JOINTS.clavicleR, JOINTS.shoulderR, JOINTS.elbowR, JOINTS.wristR, handTipR], [0.14, 0.125, 0.09, 0.06, 0.03]],
  ]
  const geos = chains.map(([pts, radii]) => buildTaperedTube(pts, radii))
  const merged = mergeGeometries(geos, false)
  if (!merged) throw new Error('AIAvatar: failed to merge body geometry')
  return merged
}

export default function AIAvatar({
  color = '#9D4DFF',
  reducedMotion = false,
}: {
  color?: string
  reducedMotion?: boolean
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const headRef = useRef<THREE.Group>(null!)
  const leftEyeRef = useRef<THREE.Mesh>(null!)
  const rightEyeRef = useRef<THREE.Mesh>(null!)
  const coreRef = useRef<THREE.Mesh>(null!)
  const nodeRefs = useRef<THREE.Mesh[]>([])

  // one continuous welded mesh for the whole body — this is what makes the
  // wireframe read as a real character silhouette instead of separate parts
  const bodyGeometry = useMemo(buildBodyGeometry, [])
  // real triangle edges only (not the noisy diagonal-through-every-quad look
  // of material.wireframe = true), matching the clean faceted line pattern
  // in the reference art
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(bodyGeometry, 1), [bodyGeometry])
  const headEdgesGeometry = useMemo(() => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.3, 1), 1), [])

  const glowMaterial = useMemo(() => createGlowMaterial(color), [color])
  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [color]
  )
  const eyeMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 }),
    []
  )
  const nodeMaterials = useMemo(
    () => Array.from({ length: 5 }, () => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 })),
    [color]
  )
  const coreMaterial = useMemo(() => {
    const c = new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.35)
    return new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.95 })
  }, [color])

  useFrame(state => {
    const t = state.clock.elapsedTime
    glowMaterial.uniforms.uTime.value = t

    if (reducedMotion) return

    // idle breathing
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.03
      groupRef.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.006)
      groupRef.current.rotation.y = Math.sin(t * 0.22) * 0.14
    }
    // idle "looks around periodically"
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.35) * 0.25
      headRef.current.rotation.x = Math.sin(t * 0.5) * 0.08
    }
    // blink
    const blinking = (t % 3.2) > 3.05
    const eyeScale = blinking ? 0.15 : 1
    if (leftEyeRef.current) leftEyeRef.current.scale.y = eyeScale
    if (rightEyeRef.current) rightEyeRef.current.scale.y = eyeScale

    // chest energy core — heartbeat pulse
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 2.4) * 0.12
      coreRef.current.scale.setScalar(pulse)
    }
    // facial sensor nodes — sequential scanning pulse, each node lights in turn
    nodeRefs.current.forEach((node, i) => {
      if (!node) return
      const phase = (t * 1.4 + i * 0.6) % (nodeRefs.current.length * 0.6)
      const active = phase < 0.3
      const mat = node.material as THREE.MeshBasicMaterial
      mat.opacity = active ? 0.95 : 0.35
    })
  })

  return (
    <group ref={groupRef}>
      <mesh geometry={bodyGeometry} material={glowMaterial} />
      <lineSegments geometry={edgesGeometry} material={lineMaterial} />

      {/* chest energy core — the AI's power source, reads as distinctly non-humanoid */}
      <mesh ref={coreRef} position={JOINTS.chest.clone().add(new THREE.Vector3(0, 0, 0.34))} material={coreMaterial}>
        <octahedronGeometry args={[0.13, 0]} />
      </mesh>

      {/* head, separated out so it can look around independently of the body */}
      <group ref={headRef} position={JOINTS.head}>
        <mesh material={glowMaterial}>
          <icosahedronGeometry args={[0.3, 1]} />
        </mesh>
        <lineSegments geometry={headEdgesGeometry} material={lineMaterial} />
        {/* unique geometric face — asymmetric sensor-node cluster, not stock eye-dots */}
        <mesh ref={leftEyeRef} position={[-0.11, 0.03, 0.26]} material={eyeMaterial}>
          <sphereGeometry args={[0.035, 8, 8]} />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.11, 0.03, 0.26]} material={eyeMaterial}>
          <sphereGeometry args={[0.035, 8, 8]} />
        </mesh>
        {[
          [-0.18, -0.06, 0.19],
          [0.02, -0.12, 0.25],
          [0.19, -0.05, 0.18],
          [-0.06, 0.16, 0.2],
          [0.09, 0.15, 0.21],
        ].map((pos, i) => (
          <mesh
            key={i}
            ref={el => { if (el) nodeRefs.current[i] = el }}
            position={pos as [number, number, number]}
            material={nodeMaterials[i]}
          >
            <icosahedronGeometry args={[0.02, 0]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}