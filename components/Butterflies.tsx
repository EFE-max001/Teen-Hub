// components/Butterflies.tsx
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { createGlowMaterial } from '../shaders/GlowMaterial'

const MODEL_PATH = '/models/blue_butterfly.glb'

// Compensates for the model's own authored forward axis so "yaw 0" reads as
// "facing the direction of travel" rather than side-on.
const BASE_YAW = Math.PI * 0.15

type Behavior = 'hover' | 'orbit' | 'roam'

type FlightConfig = {
  home: THREE.Vector3
  // per-axis "area of effect" — how far this individual butterfly's flight
  // actually ranges, not a shared constant, so tight hoverers and big
  // travelers coexist in the same flock
  area: THREE.Vector3
  speed: number
  seed: number
  scale: number
  behavior: Behavior
  orbitDir: 1 | -1
  color: string
}

// Hand-placed so the flock reads as a loose, asymmetric cluster that
// actually crosses the hero text — a couple of large "hero" butterflies
// that travel far and wide, mid-size ones looping in slow orbits (some
// clockwise, some not — they shouldn't all bank the same way), and small
// ones just hovering close to center for texture.
const FLOCK: Array<Omit<FlightConfig, 'color'>> = [
  { home: new THREE.Vector3(-1.7, 3.6, -0.5), area: new THREE.Vector3(2.6, 0.5, 0.5), speed: 0.22, seed: 0.3, scale: 0.26, behavior: 'roam', orbitDir: 1 },
  { home: new THREE.Vector3(1.9, 2.6, 0.1), area: new THREE.Vector3(0.9, 0.35, 0.45), speed: 0.4, seed: 2.1, scale: 0.15, behavior: 'orbit', orbitDir: 1 },
  { home: new THREE.Vector3(-1.9, 2.2, 0.15), area: new THREE.Vector3(0.16, 0.1, 0.12), speed: 0.6, seed: 4.4, scale: 0.07, behavior: 'hover', orbitDir: 1 },
  { home: new THREE.Vector3(1.3, 4.0, -0.4), area: new THREE.Vector3(2.3, 0.55, 0.4), speed: 0.19, seed: 6.7, scale: 0.22, behavior: 'roam', orbitDir: -1 },
  { home: new THREE.Vector3(0.9, 1.9, 0.35), area: new THREE.Vector3(0.14, 0.08, 0.1), speed: 0.55, seed: 8.8, scale: 0.06, behavior: 'hover', orbitDir: 1 },
  { home: new THREE.Vector3(-0.5, 4.4, -0.15), area: new THREE.Vector3(0.85, 0.3, 0.4), speed: 0.35, seed: 1.2, scale: 0.12, behavior: 'orbit', orbitDir: -1 },
  { home: new THREE.Vector3(0.3, 1.75, 0.5), area: new THREE.Vector3(0.18, 0.1, 0.12), speed: 0.5, seed: 3.5, scale: 0.08, behavior: 'hover', orbitDir: 1 },
  { home: new THREE.Vector3(-0.8, 3.0, 0.2), area: new THREE.Vector3(1.8, 0.4, 0.35), speed: 0.28, seed: 5.9, scale: 0.13, behavior: 'roam', orbitDir: 1 },
  { home: new THREE.Vector3(2.1, 3.9, 0.2), area: new THREE.Vector3(0.13, 0.08, 0.1), speed: 0.62, seed: 7.3, scale: 0.065, behavior: 'hover', orbitDir: 1 },
  { home: new THREE.Vector3(0.5, 2.9, -0.3), area: new THREE.Vector3(0.55, 0.25, 0.3), speed: 0.45, seed: 9.6, scale: 0.11, behavior: 'orbit', orbitDir: 1 },
  { home: new THREE.Vector3(-0.3, 2.4, 0.4), area: new THREE.Vector3(0.12, 0.07, 0.09), speed: 0.58, seed: 0.9, scale: 0.05, behavior: 'hover', orbitDir: -1 },
  // — extended flock spread across the full width, framing the portal instead
  // carry the full width of the scene rather than cluster near one figure —
  { home: new THREE.Vector3(-3.2, 2.8, -0.6), area: new THREE.Vector3(1.4, 0.4, 0.4), speed: 0.24, seed: 11.2, scale: 0.18, behavior: 'roam', orbitDir: 1 },
  { home: new THREE.Vector3(3.4, 3.2, -0.3), area: new THREE.Vector3(1.6, 0.45, 0.4), speed: 0.21, seed: 13.5, scale: 0.2, behavior: 'roam', orbitDir: -1 },
  { home: new THREE.Vector3(-2.6, 1.7, 0.3), area: new THREE.Vector3(0.5, 0.2, 0.25), speed: 0.42, seed: 15.1, scale: 0.09, behavior: 'orbit', orbitDir: 1 },
  { home: new THREE.Vector3(2.7, 1.6, 0.25), area: new THREE.Vector3(0.45, 0.22, 0.25), speed: 0.47, seed: 17.8, scale: 0.08, behavior: 'orbit', orbitDir: -1 },
  { home: new THREE.Vector3(0.0, 4.6, 0.1), area: new THREE.Vector3(1.1, 0.3, 0.35), speed: 0.3, seed: 19.4, scale: 0.14, behavior: 'roam', orbitDir: 1 },
  { home: new THREE.Vector3(-1.2, 1.4, -0.2), area: new THREE.Vector3(0.2, 0.1, 0.12), speed: 0.53, seed: 21.0, scale: 0.06, behavior: 'hover', orbitDir: -1 },
  { home: new THREE.Vector3(1.5, 1.35, -0.15), area: new THREE.Vector3(0.18, 0.09, 0.1), speed: 0.57, seed: 23.3, scale: 0.055, behavior: 'hover', orbitDir: 1 },
  { home: new THREE.Vector3(-2.2, 3.9, 0.35), area: new THREE.Vector3(0.6, 0.3, 0.3), speed: 0.33, seed: 25.6, scale: 0.1, behavior: 'orbit', orbitDir: 1 },
  { home: new THREE.Vector3(2.4, 4.1, 0.3), area: new THREE.Vector3(0.62, 0.28, 0.3), speed: 0.31, seed: 27.9, scale: 0.11, behavior: 'orbit', orbitDir: -1 },
  { home: new THREE.Vector3(3.6, 2.2, -0.5), area: new THREE.Vector3(0.9, 0.3, 0.35), speed: 0.26, seed: 29.7, scale: 0.15, behavior: 'roam', orbitDir: 1 },
  { home: new THREE.Vector3(-3.5, 2.4, -0.5), area: new THREE.Vector3(0.95, 0.32, 0.35), speed: 0.25, seed: 31.4, scale: 0.16, behavior: 'roam', orbitDir: -1 },
  { home: new THREE.Vector3(0.7, 3.6, 0.6), area: new THREE.Vector3(0.2, 0.12, 0.12), speed: 0.51, seed: 33.8, scale: 0.065, behavior: 'hover', orbitDir: 1 },
  { home: new THREE.Vector3(-0.9, 3.5, 0.55), area: new THREE.Vector3(0.19, 0.11, 0.12), speed: 0.49, seed: 35.2, scale: 0.06, behavior: 'hover', orbitDir: -1 },
]

// Smooth, deterministic, non-repeating-looking wander per axis — a cheap
// stand-in for Perlin/simplex noise using three uncorrelated sine layers,
// so no extra dependency is needed for organic-feeling drift.
function noise1(t: number, seed: number) {
  return (
    Math.sin(t * 0.9 + seed * 6.283) * 0.55 +
    Math.sin(t * 0.37 + seed * 11.3) * 0.3 +
    Math.sin(t * 0.13 + seed * 3.7) * 0.15
  )
}

function wanderOffset(t: number, seed: number, area: THREE.Vector3, out: THREE.Vector3) {
  out.set(
    noise1(t, seed) * area.x,
    noise1(t * 0.8, seed + 4.1) * area.y,
    noise1(t * 0.6, seed + 9.3) * area.z
  )
  return out
}

const _pos = new THREE.Vector3()
const _tmp = new THREE.Vector3()

// Position at time t for a given flight config — pulled out as a pure
// function of time (rather than integrated velocity/state) so it stays
// perfectly smooth and jump-free no matter when it's sampled, which also
// lets us finite-difference it below to get a real heading to bank into.
function flightPosition(cfg: FlightConfig, t: number, out: THREE.Vector3) {
  const tt = t * cfg.speed
  if (cfg.behavior === 'hover') {
    wanderOffset(tt * 0.6, cfg.seed, cfg.area, out)
  } else if (cfg.behavior === 'roam') {
    // slow wide drift — this is what actually carries a butterfly from one
    // side of the headline to the other and back, unlike a fixed small loop
    wanderOffset(tt * 0.5, cfg.seed, cfg.area, out)
  } else {
    // orbit — a real loop (some clockwise, some not) with organic wobble
    // layered on top so it doesn't read as a perfect repeating ellipse
    const angle = tt * cfg.orbitDir
    wanderOffset(tt * 0.6, cfg.seed, cfg.area, _tmp)
    out.set(
      Math.cos(angle) * cfg.area.x + _tmp.x * 0.25,
      Math.sin(angle * 1.3) * cfg.area.y * 0.7 + _tmp.y * 0.3,
      Math.sin(angle) * cfg.area.z + _tmp.z * 0.25
    )
  }
  out.add(cfg.home)
  return out
}

function Butterfly({ config }: { config: FlightConfig }) {
  const { scene, animations } = useGLTF(MODEL_PATH)
  // deep-clone the loaded hierarchy so each butterfly instance can animate
  // and flap independently — geometries/materials are shared by reference
  // until we override them below, so this stays cheap
  const cloned = useMemo(() => scene.clone(true), [scene])
  const groupRef = useRef<THREE.Group>(null!)
  const { actions, mixer } = useAnimations(animations, cloned)

  const glowMaterial = useMemo(() => createGlowMaterial(config.color), [config.color])
  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [config.color]
  )

  useEffect(() => {
    // same wireframe-glow treatment as the AI avatar, for stylistic
    // consistency with the rest of the scene
    cloned.traverse(obj => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.material = glowMaterial
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 20), lineMaterial)
      mesh.add(edges)
    })
    // random start phase + flap speed per instance so the flock doesn't
    // flutter in lockstep
    Object.values(actions).forEach(action => {
      if (!action) return
      action.reset().play()
      action.time = Math.random() * (action.getClip().duration || 1)
    })
    mixer.timeScale = 1.6 + Math.random() * 0.6
  }, [cloned, actions, mixer, glowMaterial, lineMaterial])

  useFrame((state, delta) => {
    glowMaterial.uniforms.uTime.value = state.clock.elapsedTime
    mixer.update(delta)

    const g = groupRef.current
    if (!g) return
    const t = state.clock.elapsedTime

    flightPosition(config, t, _pos)
    g.position.copy(_pos)

    // heading from a tiny central-difference sample of the same position
    // function — real velocity-based banking instead of a fixed rotation
    // formula, so turns actually look like turns and every butterfly's
    // orientation is a consequence of where it's actually going.
    const dt = 0.05
    flightPosition(config, t - dt, _tmp)
    const vx = _pos.x - _tmp.x
    const vy = _pos.y - _tmp.y
    const vz = _pos.z - _tmp.z

    const yaw = Math.atan2(vx, vz || 1e-4) + BASE_YAW
    const bank = THREE.MathUtils.clamp(-vx * 5, -0.7, 0.7)
    const pitch = THREE.MathUtils.clamp(vy * 4, -0.45, 0.45)
    g.rotation.set(pitch, yaw, bank)
  })

  return (
    <group ref={groupRef} scale={config.scale}>
      <primitive object={cloned} />
    </group>
  )
}

export default function Butterflies({
  colors,
  reducedMotion = false,
  count,
}: {
  colors: string[]
  reducedMotion?: boolean
  count?: number
}) {
  const flock = useMemo(() => {
    const n = count ?? FLOCK.length
    return FLOCK.slice(0, n).map((f, i) => ({
      ...f,
      color: colors[i % colors.length],
      // reduced motion keeps things alive (wings still flap via the baked
      // clip, gentle hover stays on) but drops long-distance travel
      behavior: reducedMotion ? ('hover' as Behavior) : f.behavior,
      area: reducedMotion ? f.area.clone().multiplyScalar(0.3) : f.area,
    }))
  }, [colors, reducedMotion, count])

  return (
    <>
      {flock.map((config, i) => (
        <Butterfly key={i} config={config} />
      ))}
    </>
  )
}

useGLTF.preload(MODEL_PATH)