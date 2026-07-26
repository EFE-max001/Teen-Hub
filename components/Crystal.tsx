// components/Crystal.tsx
//
// "The application's heart" per the redesign doc — reused across loading
// states, AI-thinking indicators, notifications, and achievements in later
// phases. This component itself just handles loading + displaying the
// model; the state-driven behaviors (pulse-on-loading, burst-on-achievement)
// get wired in wherever those UI moments actually live, which is separate,
// broader-touching work.
//
// The source GLB has no textures (0 embedded) — it's meant to be an
// untextured glass/crystal form, so it gets the same fresnel glass
// material used for the portal and tree trunks rather than needing any
// texture work. Authored with its long axis along X (span ~1404 units,
// vs ~310/142 on Y/Z) — reads as a jagged lightning-bolt-shaped crystal,
// which fits "lightning crystal" as named.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { createGlowMaterial } from '../shaders/GlowMaterial'

const MODEL_PATH = '/models/crystal.glb'
const NORMALIZE_SCALE = 0.9 / 1404

type CrystalProps = {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  color?: string
  spin?: boolean
  reducedMotion?: boolean
}

export default function Crystal({
  position = [0, 0, 0],
  rotation = [0, 0, 0.35],
  scale = 1,
  color = '#00E5FF',
  spin = true,
  reducedMotion = false,
}: CrystalProps) {
  const { scene } = useGLTF(MODEL_PATH)
  const cloned = useMemo(() => scene.clone(true), [scene])
  const material = useMemo(() => createGlowMaterial(color), [color])
  const groupRef = useRef<THREE.Group>(null!)

  useEffect(() => {
    cloned.traverse(obj => {
      const mesh = obj as THREE.Mesh
      if (mesh.isMesh) mesh.material = material
    })
  }, [cloned, material])

  useFrame(state => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    if (reducedMotion || !spin || !groupRef.current) return
    groupRef.current.rotation.y += 0.004
  })

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale * NORMALIZE_SCALE}>
      <primitive object={cloned} />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)