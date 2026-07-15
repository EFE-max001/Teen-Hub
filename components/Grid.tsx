import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createGridMaterial } from '../shaders/GridShader'

export default function Grid({ color = '#5D2EFF' }: { color?: string }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const material = useMemo(() => createGridMaterial(color), [color])

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}>
      <planeGeometry args={[46, 46, 1, 1]} />
      <primitive ref={materialRef} object={material} attach="material" />
    </mesh>
  )
}