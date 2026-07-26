// components/GrassField.tsx
//
// The uploaded grass.blend, once converted to .glb, kept its two crossed
// planes but lost UV coordinates entirely — there was no way to correctly
// re-wrap the original grass texture onto that geometry. Rather than guess
// at a mapping, this rebuilds the classic "grass card" cross (two unit
// quads crossed at 90°, properly UV'd 0–1) natively and applies the real
// grass.png texture from the same asset. One InstancedMesh, one draw call,
// scattered around the tree bases and the portal so the forest floor
// actually looks grown-in rather than bare grid.
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

const TEXTURE_PATH = '/textures/grass-blade.png'

function buildCrossGeometry(): THREE.BufferGeometry {
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  const addQuad = (angle: number) => {
    const base = positions.length / 3
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const corners: [number, number][] = [
      [-0.5, 0],
      [0.5, 0],
      [0.5, 1],
      [-0.5, 1],
    ]
    for (const [x, y] of corners) positions.push(x * cos, y, x * sin)
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1)
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }

  addQuad(0)
  addQuad(Math.PI / 2)

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

type Patch = { center: [number, number]; radius: number; count: number }

// Clustered around each tree base (position matches TREES in Trees.tsx)
// plus a wider general patch near the portal, so grass reads as growing
// out from the same points the trees do rather than scattered uniformly.
const PATCHES: Patch[] = [
  { center: [-4.6, -4.2], radius: 1.5, count: 22 },
  { center: [-3.0, -5.6], radius: 1.1, count: 16 },
  { center: [4.4, -4.3], radius: 1.6, count: 24 },
  { center: [3.0, -5.7], radius: 1.0, count: 15 },
  { center: [-5.9, -6.4], radius: 1.8, count: 26 },
  { center: [5.9, -6.5], radius: 1.7, count: 25 },
  { center: [0, -2.8], radius: 2.6, count: 30 },
]

// Darker, less saturated than the literal palette colors — a bright wall
// of emerald/gold at full saturation competed with the hero copy sitting
// just above it. This is meant to read as ground texture, not a focal
// element in its own right.
const PALETTE = ['#1F8A5E', '#B98A3C', '#1AAD78']

export default function GrassField() {
  const texture = useTexture(TEXTURE_PATH)
  const geometry = useMemo(() => buildCrossGeometry(), [])
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.4,
        side: THREE.DoubleSide,
      }),
    [texture]
  )

  const totalCount = useMemo(() => PATCHES.reduce((sum, p) => sum + p.count, 0), [])
  const meshRef = useRef<THREE.InstancedMesh>(null!)

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    let i = 0
    for (const patch of PATCHES) {
      for (let j = 0; j < patch.count; j++) {
        const angle = Math.random() * Math.PI * 2
        // sqrt-distributed radius so density is even across the circle
        // instead of clumping toward the center
        const r = Math.sqrt(Math.random()) * patch.radius
        const x = patch.center[0] + Math.cos(angle) * r
        const z = patch.center[1] + Math.sin(angle) * r
        const scale = 0.14 + Math.random() * 0.18
        dummy.position.set(x, 0, z)
        dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
        dummy.scale.set(scale, scale * (0.75 + Math.random() * 0.6), scale)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
        color.set(PALETTE[i % PALETTE.length])
        mesh.setColorAt(i, color)
        i++
      }
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [totalCount])

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, totalCount]}
      frustumCulled={false}
    />
  )
}