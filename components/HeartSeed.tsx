// components/HeartSeed.tsx
//
// "It becomes the logo without replacing the logo" — per the redesign
// doc, sits at the portal's center as the living core the rest of the
// scene grows from. Unlike Crystal/Branch, this keeps its original
// materials/texture as authored (it has a real "BLueLight" + "Seed"
// material pair and one embedded texture) rather than overriding with a
// generic shader — no reason found to override it the way the butterfly
// wing material needed to be.
//
// ⚠️ See chat: the source filename ("transformers_seed") is worth
// confirming isn't a licensed Transformers-franchise asset before this
// becomes a permanent brand element — this component just makes it
// possible to look at and decide, not a recommendation to ship it as-is.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_PATH = '/models/heart-seed.glb'
// Tall/thin authored shape (Y span ~549 vs X/Z ~110-126) — normalized to a
// compact ~0.6-unit centerpiece rather than assuming a cubic bounding box.
const NORMALIZE_SCALE = 0.6 / 549

type HeartSeedProps = {
  position?: [number, number, number]
  scale?: number
  glowColor?: string
  reducedMotion?: boolean
}

export default function HeartSeed({
  position = [0, 0, 0],
  scale = 1,
  glowColor = '#FFC65C',
  reducedMotion = false,
}: HeartSeedProps) {
  const { scene } = useGLTF(MODEL_PATH)
  const cloned = useMemo(() => scene.clone(true), [scene])
  const groupRef = useRef<THREE.Group>(null!)
  const baseScale = scale * NORMALIZE_SCALE

  useFrame(state => {
    if (reducedMotion || !groupRef.current) return
    const t = state.clock.elapsedTime
    // slow breathing scale — "when pages load, the seed pulses"
    const s = 1 + Math.sin(t * 0.8) * 0.06
    groupRef.current.scale.setScalar(baseScale * s)
  })

  return (
    <group ref={groupRef} position={position} scale={baseScale}>
      <primitive object={cloned} />
      <pointLight color={glowColor} intensity={0.8} distance={3} decay={2} />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)