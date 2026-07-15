// components/RobotAvatar.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_PATH = '/models/robot12.glb'

// Matches roughly the head-height of the old procedural avatar (~3.3-3.6)
// so the camera framing, and the butterfly flock positions built around it,
// don't need to change.
const TARGET_HEIGHT = 3.5

// If the robot turns out to be facing away from the camera once this is
// actually rendered (glTF export axis-conventions vary), flip this to 0 —
// it's the only number that needs to change.
const FACING_OFFSET = Math.PI

export default function RobotAvatar({
  color = '#9D4DFF',
  reducedMotion = false,
  onCoreAnchor,
}: {
  color?: string
  reducedMotion?: boolean
  // reports the world-ish (group-local) position of the chest energy core
  // once it's known, so EnergyParticles can start its stream there instead
  // of a guessed hand position
  onCoreAnchor?: (v: THREE.Vector3) => void
}) {
  const { scene } = useGLTF(MODEL_PATH)
  const groupRef = useRef<THREE.Group>(null!)
  const coreRef = useRef<THREE.Mesh>(null!)
  const headBoneRef = useRef<THREE.Object3D | null>(null)
  const swayBonesRef = useRef<THREE.Object3D[]>([])
  const [coreAnchor, setCoreAnchor] = useState<THREE.Vector3 | null>(null)

  // deep clone so the loaded GLTF cache stays untouched (harmless here since
  // there's only one robot on screen, but keeps HMR/re-mounts clean)
  const cloned = useMemo(() => scene.clone(true), [scene])

  // thin glowing "rim" shell reused across every mesh — cheap single
  // material, gives the metal a neon silhouette without hiding its shape
  // the way a fully-transparent hologram material would on a model this
  // detailed
  const rimMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.55,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [color]
  )

  const coreMaterial = useMemo(() => {
    const c = new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.35)
    return new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.95 })
  }, [color])

  useEffect(() => {
    // 1. normalize scale + ground the model, whatever units it was
    // exported in — measured at runtime instead of hardcoded, since the
    // source file's native scale isn't something to guess at.
    const rawBox = new THREE.Box3().setFromObject(cloned)
    const rawHeight = rawBox.max.y - rawBox.min.y || 1
    const scale = TARGET_HEIGHT / rawHeight
    cloned.scale.setScalar(scale)
    cloned.rotation.y = FACING_OFFSET

    const box = new THREE.Box3().setFromObject(cloned)
    cloned.position.x -= (box.min.x + box.max.x) / 2
    cloned.position.z -= (box.min.z + box.max.z) / 2
    cloned.position.y -= box.min.y

    // 2. re-material every mesh: keep the model's own metal/roughness
    // authoring (that variation is what makes it read as a real machine
    // instead of one flat surface), just retint toward the brand's dark
    // violet-black and add a touch of emissive so bloom catches the seams.
    // Clone each material rather than mutating the cached GLTF material.
    const finalBox = new THREE.Box3().setFromObject(cloned)
    // Collect first, mutate after — traverse() walks the live children
    // array, so adding a new Mesh as a child *during* traversal makes it
    // visit that new mesh too, which adds another rim, which gets visited
    // too, and so on forever (this was the "Maximum call stack size
    // exceeded" crash). Reading into a plain array first and looping over
    // that instead avoids touching the tree mid-walk.
    const meshes: THREE.Mesh[] = []
    cloned.traverse(obj => {
      const mesh = obj as THREE.Mesh
      if (mesh.isMesh) meshes.push(mesh)

      // candidate bones for idle motion — a short standalone chain off the
      // root (as opposed to the long paired L/R limb chains) reads as the
      // head/sensor cluster; the wrist/palm joints get a gentle sway so the
      // hands don't look frozen.
      const name = obj.name
      if (name === 'Bone.001' && !headBoneRef.current) headBoneRef.current = obj
      if (name === 'Bone.038.L' || name === 'Bone.038.R') swayBonesRef.current.push(obj)
    })

    meshes.forEach(mesh => {
      const srcMat = mesh.material as THREE.MeshStandardMaterial
      const mat = srcMat.clone() as THREE.MeshStandardMaterial
      mat.color = new THREE.Color('#0b0710').lerp(new THREE.Color(color), 0.05)
      mat.emissive = new THREE.Color(color)
      mat.emissiveIntensity = 0.1
      mesh.material = mat

      const rim = new THREE.Mesh(mesh.geometry, rimMaterial)
      rim.scale.setScalar(1.015)
      rim.raycast = () => null
      mesh.add(rim)
    })

    // 3. chest energy-core anchor, placed proportionally to the model's own
    // measured bounding box rather than a guessed bone name, so it's correct
    // regardless of the rig's internal naming.
    const anchor = new THREE.Vector3(
      (finalBox.min.x + finalBox.max.x) / 2,
      finalBox.min.y + (finalBox.max.y - finalBox.min.y) * 0.62,
      finalBox.max.z + 0.06
    )
    setCoreAnchor(anchor)
    onCoreAnchor?.(anchor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloned, rimMaterial, color])

  useFrame(state => {
    const t = state.clock.elapsedTime
    if (reducedMotion) return

    // idle breathing / sway, same feel as the old avatar
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.03
      groupRef.current.rotation.y = FACING_OFFSET + Math.sin(t * 0.22) * 0.14
    }
    // head/sensor scan
    if (headBoneRef.current) {
      headBoneRef.current.rotation.y = Math.sin(t * 0.35) * 0.3
      headBoneRef.current.rotation.x = Math.sin(t * 0.5) * 0.08
    }
    // subtle wrist sway so the hands read as powered, not posed
    swayBonesRef.current.forEach((bone, i) => {
      bone.rotation.x = Math.sin(t * 0.9 + i * 1.7) * 0.06
      bone.rotation.z = Math.cos(t * 0.7 + i * 1.7) * 0.04
    })
    // chest core heartbeat pulse
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 2.4) * 0.15
      coreRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={cloned} />
      {coreAnchor && (
        <mesh ref={coreRef} position={coreAnchor} material={coreMaterial}>
          <octahedronGeometry args={[0.11, 0]} />
        </mesh>
      )}
    </group>
  )
}

useGLTF.preload(MODEL_PATH)