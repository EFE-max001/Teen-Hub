// components/Branch.tsx
//
// Replaces the procedural Trees.tsx with the real supplied low-poly model.
// Authored at a large scale with its long axis along Z (world-space spans:
// X~106, Y~33, Z~192) rather than a tall Y-up trunk — since it's named a
// "tree," that reads as lying on its side rather than standing, so a
// default -90° X rotation stands the long axis up into Y. This is an
// educated guess, not a visually-confirmed fix (no way to render 3D output
// in this environment) — `rotation` is exposed as a prop specifically so
// it's a one-line change if it looks wrong once you see it live.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_PATH = '/models/branch.glb'
const NORMALIZE_SCALE = 4 / 192

type BranchProps = {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  reducedMotion?: boolean
}

export default function Branch({
  position = [0, 0, 0],
  rotation = [-Math.PI / 2, 0, 0],
  scale = 1,
  reducedMotion = false,
}: BranchProps) {
  const { scene, animations } = useGLTF(MODEL_PATH)
  const cloned = useMemo(() => scene.clone(true), [scene])
  const groupRef = useRef<THREE.Group>(null!)
  const { actions, mixer } = useAnimations(animations, cloned)

  useEffect(() => {
    cloned.traverse(obj => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (!mat) return
      // The source GLB has its leaf-card texture wired into the emissive
      // channel only, with the base color alpha set to 0.354 under BLEND
      // mode — meaning without this fix, the leaves rendered at ~35%
      // opacity with no actual texture in the albedo channel, reading as
      // faint, jagged, mostly-invisible shapes rather than solid cards.
      if (mat.emissiveMap && !mat.map) {
        mat.map = mat.emissiveMap
        mat.opacity = 1
        mat.transparent = true
        mat.alphaTest = 0.3
        mat.side = THREE.DoubleSide
        mat.needsUpdate = true
      }
    })
  }, [cloned])

  useEffect(() => {
    Object.values(actions).forEach(action => {
      if (!action) return
      action.reset().play()
      action.paused = reducedMotion
    })
  }, [actions, reducedMotion])

  useFrame((_, delta) => {
    if (!reducedMotion) mixer.update(delta)
  })

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale * NORMALIZE_SCALE}>
      <primitive object={cloned} />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)