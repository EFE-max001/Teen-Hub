// Teen-Hub/components/Butterflies.tsx
// components/Butterflies.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations, Trail } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";

// The flock now alternates between two real butterfly models rather than
// one shared rig. The two source GLBs are authored completely differently
// (different scale, different forward axis, different node names), so each
// gets its own small config below instead of forcing them through one set
// of assumptions.
type ModelConfig = {
  path: string;
  // Compensates for this model's own authored forward axis, same idea as
  // the old shared BASE_YAW — but per-model, since the two GLBs weren't
  // rigged facing the same way. Start at 0 and nudge in ~Math.PI/2 steps
  // if a model appears to fly sideways or backwards.
  yawOffset: number;
};

// Per-model size correction is no longer hand-guessed here — see
// `autoScale` in Butterfly() below, which measures each clone's actual
// bounding box at load time and normalizes it to butterfly.glb's own
// native size. That's what keeps every model in this list reading as the
// same apparent size, automatically, even though they're authored at
// completely different native scales.
const MODELS: ModelConfig[] = [
  // butterfly.glb — Sketchfab model, multi-mesh body (wings/legs/antennae
  // as separate primitives), single combined "ArmatureAction" clip.
  { path: "/models/butterfly.glb", yawOffset: 0 },
  // butterfly-cartoon.glb — stylized low-poly cartoon butterfly. Animates
  // via ~12 directly-keyframed parts (wings/body/antennae as separate
  // rigid meshes), NOT a bone skeleton — deliberately chosen to replace
  // butterfly-loop.glb, whose 59-joint skinned rig rendered as one
  // enormous broken shape at runtime (root cause never fully isolated
  // beyond "something in its posed skinning"; see git history). A model
  // with no skinning at all can't hit that failure mode. Its wing/body
  // materials also ship with a cyan/teal emissive glow already baked in —
  // see the emissive useEffect below, which now preserves that instead of
  // overwriting it.
  { path: "/models/butterfly-cartoon.glb", yawOffset: 0 },
];

// Compensates for the model's own authored forward axis so "yaw 0" reads as
// "facing the direction of travel" rather than side-on. Applies on top of
// each model's own yawOffset above.
// Single global size knob — applied on top of each model's auto-normalized
// bounding box (see `autoScale` below) and each FLOCK entry's own `scale`.
// Tune this one number to make the whole flock uniformly bigger/smaller.
// Was 0.6 (sized against blue_butterfly.glb, then re-verified correct for
// butterfly.glb via independent GLTF-level measurement). Bumped to 0.75 —
// a modest ~25% increase — since the flock read too small at 0.6. Nudge
// further in small steps rather than jumping if it still needs tuning.
const GLOBAL_SCALE = 1.20;

const BASE_YAW = Math.PI * 0.15;

type Behavior = "hover" | "orbit" | "roam" | "traverse";

type FlightConfig = {
  home: THREE.Vector3;
  // per-axis "area of effect" — how far this individual butterfly's flight
  // actually ranges, not a shared constant, so tight hoverers and big
  // travelers coexist in the same flock
  area: THREE.Vector3;
  speed: number;
  seed: number;
  scale: number;
  behavior: Behavior;
  orbitDir: 1 | -1;
  color: string;
  colorB: string;
  trail: boolean;
  // Which entry in MODELS this instance uses — alternated across the flock
  // (see the default export below) so both real models are represented.
  modelIndex: 0 | 1;
  // "Intelligent butterflies" — one instance in the flock ignores the
  // procedural wander entirely and tracks the cursor instead. See the
  // followCursor branch in Butterfly()'s useFrame below.
  followCursor?: boolean;
  // "traverse" behavior only: a genuine point-A-to-point-B journey across
  // the visible scene (not a wander around `home`) — from traverseFrom to
  // traverseTo and back, repeating every traverseDuration seconds, with a
  // fade in/out near each end. This is the "arrives, crosses the screen,
  // leaves" flight the CSS/SVG dashboard butterflies (ButterfliesOverlay)
  // have that hover/roam/orbit never did — those all anchor to a fixed
  // `home` and never actually leave the scene or fade.
  traverseFrom?: THREE.Vector3;
  traverseTo?: THREE.Vector3;
  traverseDuration?: number;
};

// Hand-placed so the flock reads as a loose, asymmetric cluster that
// actually crosses the hero text — a couple of large "hero" butterflies
// that travel far and wide, mid-size ones looping in slow orbits (some
// clockwise, some not — they shouldn't all bank the same way), and small
// ones just hovering close to center for texture.
const FLOCK: Array<
  Omit<FlightConfig, "color" | "colorB" | "trail" | "modelIndex">
> = [
  {
    home: new THREE.Vector3(-1.7, 3.6, -0.5),
    area: new THREE.Vector3(2.6, 0.5, 0.5),
    speed: 0.22,
    seed: 0.3,
    scale: 0.26,
    behavior: "roam",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(1.9, 2.6, 0.1),
    area: new THREE.Vector3(0.9, 0.35, 0.45),
    speed: 0.4,
    seed: 2.1,
    scale: 0.15,
    behavior: "orbit",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(-1.9, 2.2, 0.15),
    area: new THREE.Vector3(0.16, 0.1, 0.12),
    speed: 0.6,
    seed: 4.4,
    scale: 0.12,
    behavior: "hover",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(1.3, 4.0, -0.4),
    area: new THREE.Vector3(2.3, 0.55, 0.4),
    speed: 0.19,
    seed: 6.7,
    scale: 0.22,
    behavior: "roam",
    orbitDir: -1,
  },
  {
    home: new THREE.Vector3(0.9, 1.9, 0.35),
    area: new THREE.Vector3(0.14, 0.08, 0.1),
    speed: 0.55,
    seed: 8.8,
    scale: 0.11,
    behavior: "hover",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(-0.5, 4.4, -0.15),
    area: new THREE.Vector3(0.85, 0.3, 0.4),
    speed: 0.35,
    seed: 1.2,
    scale: 0.12,
    behavior: "orbit",
    orbitDir: -1,
    followCursor: true,
  },
  {
    home: new THREE.Vector3(0.3, 1.75, 0.5),
    area: new THREE.Vector3(0.18, 0.1, 0.12),
    speed: 0.5,
    seed: 3.5,
    scale: 0.13,
    behavior: "hover",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(-0.8, 3.0, 0.2),
    area: new THREE.Vector3(1.8, 0.4, 0.35),
    speed: 0.28,
    seed: 5.9,
    scale: 0.13,
    behavior: "roam",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(2.1, 3.9, 0.2),
    area: new THREE.Vector3(0.13, 0.08, 0.1),
    speed: 0.62,
    seed: 7.3,
    scale: 0.11,
    behavior: "hover",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(0.5, 2.9, -0.3),
    area: new THREE.Vector3(0.55, 0.25, 0.3),
    speed: 0.45,
    seed: 9.6,
    scale: 0.11,
    behavior: "orbit",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(-0.3, 2.4, 0.4),
    area: new THREE.Vector3(0.12, 0.07, 0.09),
    speed: 0.58,
    seed: 0.9,
    scale: 0.10,
    behavior: "hover",
    orbitDir: -1,
  },
  {
    home: new THREE.Vector3(-3.2, 2.8, -0.6),
    area: new THREE.Vector3(1.4, 0.4, 0.4),
    speed: 0.24,
    seed: 11.2,
    scale: 0.18,
    behavior: "roam",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(3.4, 3.2, -0.3),
    area: new THREE.Vector3(1.6, 0.45, 0.4),
    speed: 0.21,
    seed: 13.5,
    scale: 0.2,
    behavior: "roam",
    orbitDir: -1,
  },
  {
    home: new THREE.Vector3(-2.6, 1.7, 0.3),
    area: new THREE.Vector3(0.5, 0.2, 0.25),
    speed: 0.42,
    seed: 15.1,
    scale: 0.13,
    behavior: "orbit",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(2.7, 1.6, 0.25),
    area: new THREE.Vector3(0.45, 0.22, 0.25),
    speed: 0.47,
    seed: 17.8,
    scale: 0.13,
    behavior: "orbit",
    orbitDir: -1,
  },
  {
    home: new THREE.Vector3(0.0, 4.6, 0.1),
    area: new THREE.Vector3(1.1, 0.3, 0.35),
    speed: 0.3,
    seed: 19.4,
    scale: 0.14,
    behavior: "roam",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(-1.2, 1.4, -0.2),
    area: new THREE.Vector3(0.2, 0.1, 0.12),
    speed: 0.53,
    seed: 21.0,
    scale: 0.11,
    behavior: "hover",
    orbitDir: -1,
  },
  {
    home: new THREE.Vector3(1.5, 1.35, -0.15),
    area: new THREE.Vector3(0.18, 0.09, 0.1),
    speed: 0.57,
    seed: 23.3,
    scale: 0.10,
    behavior: "hover",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(-2.2, 3.9, 0.35),
    area: new THREE.Vector3(0.6, 0.3, 0.3),
    speed: 0.33,
    seed: 25.6,
    scale: 0.1,
    behavior: "orbit",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(2.4, 4.1, 0.3),
    area: new THREE.Vector3(0.62, 0.28, 0.3),
    speed: 0.31,
    seed: 27.9,
    scale: 0.11,
    behavior: "orbit",
    orbitDir: -1,
  },
  {
    home: new THREE.Vector3(3.6, 2.2, -0.5),
    area: new THREE.Vector3(0.9, 0.3, 0.35),
    speed: 0.26,
    seed: 29.7,
    scale: 0.15,
    behavior: "roam",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(-3.5, 2.4, -0.5),
    area: new THREE.Vector3(0.95, 0.32, 0.35),
    speed: 0.25,
    seed: 31.4,
    scale: 0.16,
    behavior: "roam",
    orbitDir: -1,
  },
  {
    home: new THREE.Vector3(0.7, 3.6, 0.6),
    area: new THREE.Vector3(0.2, 0.12, 0.12),
    speed: 0.51,
    seed: 33.8,
    scale: 0.11,
    behavior: "hover",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(-0.9, 3.5, 0.55),
    area: new THREE.Vector3(0.19, 0.11, 0.12),
    speed: 0.49,
    seed: 35.2,
    scale: 0.11,
    behavior: "hover",
    orbitDir: -1,
  },
  // ── Traverse — genuine point-to-point crossings ─────────────────────
  // Everything above wanders around a fixed `home` no matter how wide the
  // sweep; these two actually arrive from one side, cross the scene, fade
  // out the other side, pause, then do it again — the "arrives, crosses,
  // leaves" flight the 2D ButterfliesOverlay butterflies on every other
  // page already had (see components/ui/ButterfliesOverlay.tsx) and the
  // 3D flock never did. Endpoints are placed beyond the visible frustum
  // (camera fov 38 / distance 8.4 puts the visible half-width at roughly
  // ±2.9) so they're already off-scene — and faded to 0 opacity by
  // traverseFadeFactor — before they'd otherwise pop at a hard edge.
  {
    home: new THREE.Vector3(0, 2.6, 0.3),
    traverseFrom: new THREE.Vector3(-5.2, 3.1, 0.4),
    traverseTo: new THREE.Vector3(5.2, 2.2, -0.3),
    traverseDuration: 21,
    area: new THREE.Vector3(0.35, 0.2, 0.25),
    speed: 0.6,
    seed: 38.6,
    scale: 0.13,
    behavior: "traverse",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(0, 1.8, 0.2),
    traverseFrom: new THREE.Vector3(5.4, 1.6, -0.4),
    traverseTo: new THREE.Vector3(-5.4, 2.5, 0.3),
    traverseDuration: 27,
    area: new THREE.Vector3(0.3, 0.18, 0.22),
    speed: 0.55,
    seed: 41.9,
    scale: 0.12,
    behavior: "traverse",
    orbitDir: -1,
  },
];

// Smooth, deterministic, non-repeating-looking wander per axis — a cheap
// stand-in for Perlin/simplex noise using three uncorrelated sine layers,
// so no extra dependency is needed for organic-feeling drift.
function noise1(t: number, seed: number) {
  return (
    Math.sin(t * 0.9 + seed * 6.283) * 0.55 +
    Math.sin(t * 0.37 + seed * 11.3) * 0.3 +
    Math.sin(t * 0.13 + seed * 3.7) * 0.15
  );
}

// Real butterfly flight doesn't move at constant speed — it's a chain of
// quick wing-beat bursts and brief glides/pauses, which is what actually
// reads as "alive" rather than "drifting on a fixed path". This warps the
// time value fed into the wander function so the same smooth curve gets
// traversed unevenly: fast through some stretches, nearly stalled at others.
// It's still a pure function of t (no stored/mutable target), so the
// finite-difference heading sample below stays continuous and jump-free.
function burstGlide(t: number, seed: number) {
  const burst = 0.5 + 0.5 * Math.sin(t * 1.7 + seed * 4.0);
  const eased = Math.pow(burst, 1.6);
  return t + eased * 0.6;
}

function wanderOffset(
  t: number,
  seed: number,
  area: THREE.Vector3,
  out: THREE.Vector3,
) {
  const wt = burstGlide(t, seed);
  out.set(
    noise1(wt, seed) * area.x,
    noise1(wt * 0.8, seed + 4.1) * area.y,
    noise1(wt * 0.6, seed + 9.3) * area.z,
  );
  // quick, higher-frequency, non-harmonic jitter on top of the wander base —
  // the erratic short-range flutter real butterflies show even mid-glide
  out.x += Math.sin(wt * 5.3 + seed * 2.0) * area.x * 0.07;
  out.z += Math.cos(wt * 4.1 + seed * 3.3) * area.z * 0.07;
  return out;
}

const _pos = new THREE.Vector3();
const _tmp = new THREE.Vector3();
const _cursorVec = new THREE.Vector3();
const _cursorDir = new THREE.Vector3();

// The wingtip isn't at a fixed offset we can hardcode — it's whichever
// corner of the wing mesh's own bounding box sits farthest from the wing's
// pivot (local origin). Computing it from the actual geometry means this
// keeps working correctly even if the model is swapped for a different
// GLB later, rather than a coordinate baked in from inspecting this one file.
function farthestCorner(mesh: THREE.Mesh): THREE.Vector3 {
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox;
  if (!box) return new THREE.Vector3();
  let best = new THREE.Vector3(box.min.x, box.min.y, box.min.z);
  let bestDist = 0;
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        const d = x * x + y * y + z * z;
        if (d > bestDist) {
          bestDist = d;
          best = new THREE.Vector3(x, y, z);
        }
      }
    }
  }
  return best;
}

// Position at time t for a given flight config — pulled out as a pure
// function of time (rather than integrated velocity/state) so it stays
// perfectly smooth and jump-free no matter when it's sampled, which also
// lets us finite-difference it below to get a real heading to bank into.
function flightPosition(cfg: FlightConfig, t: number, out: THREE.Vector3) {
  const tt = t * cfg.speed;
  if (cfg.behavior === "traverse") {
    // Real elapsed seconds drive the cycle (not tt) — traverseDuration is
    // an actual "how many seconds does one crossing take" value, not a
    // wander-pacing knob like cfg.speed is for the other behaviors. The
    // seed-based offset staggers multiple traverse instances so they don't
    // all launch/pause in lockstep.
    const duration = cfg.traverseDuration ?? 22;
    const pause = duration * 0.35; // brief gap off-scene before the next crossing
    const cycle = duration + pause;
    const phase = (((t + cfg.seed * 3.7) % cycle) + cycle) % cycle;
    const progress = THREE.MathUtils.clamp(phase / duration, 0, 1);
    const from = cfg.traverseFrom ?? cfg.home;
    const to = cfg.traverseTo ?? cfg.home;
    // Smoothstep ease — accelerates away from the start edge, settles into
    // the end edge, instead of constant-velocity sliding across the scene.
    const eased = progress * progress * (3 - 2 * progress);
    out.lerpVectors(from, to, eased);
    // Same organic wobble every other behavior gets, layered on top of the
    // straight-line path rather than replacing it.
    wanderOffset(t * cfg.speed * 0.6, cfg.seed, cfg.area, _tmp);
    out.add(_tmp);
    return out; // absolute position already — skip the cfg.home add below
  }
  if (cfg.behavior === "hover") {
    wanderOffset(tt * 0.6, cfg.seed, cfg.area, out);
  } else if (cfg.behavior === "roam") {
    // slow wide drift — this is what actually carries a butterfly from one
    // side of the headline to the other and back, unlike a fixed small loop
    wanderOffset(tt * 0.5, cfg.seed, cfg.area, out);
  } else {
    // orbit — a real loop (some clockwise, some not) with organic wobble
    // layered on top so it doesn't read as a perfect repeating ellipse
    const angle = burstGlide(tt, cfg.seed) * cfg.orbitDir;
    wanderOffset(tt * 0.6, cfg.seed, cfg.area, _tmp);
    out.set(
      Math.cos(angle) * cfg.area.x + _tmp.x * 0.25,
      Math.sin(angle * 1.3) * cfg.area.y * 0.7 + _tmp.y * 0.3,
      Math.sin(angle) * cfg.area.z + _tmp.z * 0.25,
    );
  }
  out.add(cfg.home);
  return out;
}

// 0 while comfortably mid-flight, ramping to 1 right at the two ends of a
// traverse crossing — drives opacity so the butterfly visibly fades in as
// it enters the scene and fades out as it leaves, rather than popping in
// solid at whatever an off-screen edge happens to be. Exported as its own
// function (not folded into flightPosition) since Butterfly()'s useFrame
// needs this value independently of position, to drive material opacity.
function traverseFadeFactor(cfg: FlightConfig, t: number): number {
  if (cfg.behavior !== "traverse") return 1;
  const duration = cfg.traverseDuration ?? 22;
  const pause = duration * 0.35;
  const cycle = duration + pause;
  const phase = (((t + cfg.seed * 3.7) % cycle) + cycle) % cycle;
  if (phase >= duration) return 0; // in the pause gap, fully invisible
  const progress = phase / duration;
  const EDGE = 0.08; // fraction of the crossing spent fading at each end
  if (progress < EDGE) return progress / EDGE;
  if (progress > 1 - EDGE) return (1 - progress) / EDGE;
  return 1;
}

function Butterfly({ config }: { config: FlightConfig }) {
  const model = MODELS[config.modelIndex] ?? MODELS[0];
  const { scene, animations } = useGLTF(model.path);
  // butterfly.glb uses skeletal skinning (confirmed by inspecting the
  // source file — it has one glTF "skin"). butterfly-cartoon.glb doesn't
  // (verified via direct GLTF inspection — 0 skins, animates through
  // direct per-part keyframes instead), but SkeletonUtils.clone() works
  // correctly on non-skinned hierarchies too, so it's used unconditionally
  // for both rather than branching per model.
  // Plain Object3D.clone(true) does NOT correctly clone SkinnedMesh bone
  // bindings — the clone ends up with a broken/degenerate bounding sphere,
  // which Three.js's frustum culling then silently treats as out of view.
  // No error, no crash, nothing in the console — it just never draws. This
  // was the actual root cause of the models being invisible even after
  // the scale and emissive fixes: SkeletonUtils.clone() (from three-stdlib,
  // already a dependency via @react-three/drei) clones skinned rigs
  // correctly and works fine on non-skinned hierarchies too, so it's safe
  // to use unconditionally here rather than branching per model.
  const cloned = useMemo(
    () => SkeletonUtils.clone(scene) as THREE.Group,
    [scene],
  );
  // Normalize every model to butterfly.glb's own native size (measured via
  // console.log: maxDim ≈ 1.93669) rather than an arbitrary "1 unit". This
  // matters: GLOBAL_SCALE, every FLOCK `scale` value, and the trail-width
  // formula below were all originally tuned assuming a butterfly renders
  // at roughly this size. Normalizing to exactly 1 unit (an earlier
  // version of this fix) silently shrank every butterfly's body to about
  // half that — while trailWidth, unchanged, stayed calibrated to the
  // larger original size. The result: a trail ribbon 3-5x wider than the
  // (now smaller) body it was following — almost certainly the huge,
  // static-looking, hazy shape reported in testing. Anchoring to this
  // model's own real native size keeps every existing tuned constant
  // (GLOBAL_SCALE, FLOCK scales, trailWidth) valid without retuning them.
  const REFERENCE_MAX_DIM = 1.93669;
  const autoScale = useMemo(() => {
    const box = new THREE.Box3();
    let hasMesh = false;
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      mesh.geometry.computeBoundingBox?.();
      if (!mesh.geometry.boundingBox) return;
      const meshBox = mesh.geometry.boundingBox.clone();
      meshBox.applyMatrix4(mesh.matrixWorld);
      box.union(meshBox);
      hasMesh = true;
    });
    const size = new THREE.Vector3();
    if (hasMesh) box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const raw =
      maxDim > 0 && Number.isFinite(maxDim) ? REFERENCE_MAX_DIM / maxDim : 1;
    // Expected range given the two known models (~1.94 and ~0.0012):
    // roughly 1x to ~1650x. Clamp well outside that so a bad measurement
    // can't blow a model up, without constraining legitimate values.
    const clamped = THREE.MathUtils.clamp(raw, 0.3, 3000);
    // eslint-disable-next-line no-console
    console.log(
      `[Butterflies] ${model.path} bbox size:`,
      size.toArray().map((v) => v.toFixed(5)),
      "maxDim:",
      maxDim.toFixed(5),
      "autoScale:",
      clamped.toFixed(3),
      raw !== clamped ? "(CLAMPED — raw was " + raw.toFixed(3) + ")" : "",
    );
    return clamped;
  }, [cloned, model.path]);
  const groupRef = useRef<THREE.Group>(null!);
  const { actions, mixer } = useAnimations(animations, cloned);

  // per-instance wing-beat bob: frequency/phase/amplitude vary so butterflies
  // never bounce in lockstep. Kept separate from the position used for
  // heading/banking below so the bob doesn't make turns jittery.
  const bob = useMemo(
    () => ({
      freq: 7 + Math.random() * 5,
      phase: Math.random() * Math.PI * 2,
      amp: 0.035 + Math.random() * 0.02,
    }),
    [],
  );

  const downTipRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const upTipRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const [tipsReady, setTipsReady] = useState(false);
  const { gl } = useThree();
  // Collected during the material-setup effect below, used by the
  // traverse-behavior fade in useFrame. Only populated with `transparent`
  // enabled for traverse instances — every other behavior never fades, so
  // leaving them opaque avoids paying transparency's sort/blend cost for
  // butterflies that don't need it.
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  useEffect(() => {
    materialsRef.current = [];
    // Neither butterfly.glb nor the original butterfly-loop.glb shipped
    // with emissiveFactor set (both were [0,0,0]), unlike the scene's
    // deliberately dim lighting — a model relying only on that lighting
    // renders essentially black-on-black. butterfly-cartoon.glb (the
    // replacement for butterfly-loop.glb) is different: its wing/body
    // materials already ship with a real cyan/teal emissiveFactor baked
    // in by the artist, which happens to already match this scene's cyan
    // palette — so this only applies the "borrow the base color as an
    // emissive map" fix to materials that are still black-emissive, and
    // leaves any material that already has its own authored glow alone.
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const mat of materials) {
        const std = mat as THREE.MeshStandardMaterial;
        if (!std.isMeshStandardMaterial) continue;

        // Wing meshes in both GLBs are thin single-layer planes with only
        // one face wound outward. THREE defaults to FrontSide, which
        // backface-culls the other side — so depending on which way a
        // given wing is banked/turned mid-flight (see the bank/yaw/pitch
        // rotation in useFrame below), that wing can flicker to fully
        // invisible for part of the animation. DoubleSide keeps both
        // faces of every wing rendering no matter which way it's turned.
        std.side = THREE.DoubleSide;

        // The wing texture itself is a real 2048x2048 source image — plenty
        // of detail. But GLTFLoader/three.js leaves texture.anisotropy at
        // its default of 1 unless told otherwise, and at anisotropy 1 the
        // GPU aggressively blurs a texture whenever it's viewed at a
        // shallow angle rather than dead-on — exactly the situation a wing
        // is in for most of every flap/bank/turn. Raising it to the GPU's
        // actual max (usually 8 or 16, capped per-device) makes the GPU
        // sample the texture properly at those angles instead of mip-blurring
        // it into a soft blob, independent of the on-screen pixel size fix.
        if (std.map) {
          std.map.anisotropy = gl.capabilities.getMaxAnisotropy();
          std.map.needsUpdate = true;
        }

        const alreadyGlowing =
          std.emissive &&
          (std.emissive.r > 0.001 ||
            std.emissive.g > 0.001 ||
            std.emissive.b > 0.001);
        if (alreadyGlowing) continue;

        // Previously: emissive = white, emissiveMap = the diffuse map
        // itself, intensity 0.7. Emissive output isn't affected by light
        // direction or the material's normal map, so stacking a
        // full-strength copy of the diffuse map on top of the diffuse map
        // it was already showing didn't just "lift it out of the dark" —
        // it flattened every bit of real shading (normal-map detail,
        // roughness response, the light/dark modeling that makes a wing
        // read as a textured surface instead of a paper cutout). That's
        // the "can't see the surface" look.
        // Then dropped to 0.18 — which fixed the flattening, but the
        // Portal ring / Crystals / HeartSeed that used to sit in this
        // scene were also a meaningful source of ambient brightness (their
        // own bloom-fed glow lit the surroundings even though they aren't
        // literal point lights). With those removed for the mobile/clutter
        // cleanup, 0.18 alone now reads as too dark to see anything,
        // surface included. 0.32 is the middle ground: bright enough to
        // actually see the wing against a now-emptier dark background,
        // while staying well short of the intensity that blew out normal
        // map / roughness detail before.
        std.emissive = new THREE.Color(0xffffff);
        std.emissiveMap = std.map;
        std.emissiveIntensity = 0.32;

        materialsRef.current.push(std);
        if (config.behavior === "traverse") {
          // Only traverse instances ever have their opacity animated
          // (see the fade in useFrame below) — everyone else stays at
          // their authored opacity/transparent state untouched.
          std.transparent = true;
        }
      }
    });

    // No name-based hiding here — both GLBs render exactly as authored.
    // (The old model had a stray Blender reference cube that needed
    // hiding by name; neither of these two does, and butterfly.glb in
    // particular has real body parts named "Cube*", so a generic "hide
    // anything with cube in the name" rule would have deleted actual
    // wings/legs.)

    // Play every real animation clip on this model. Both source GLBs only
    // ship one meaningful clip each, so this just plays whatever's there.
    Object.entries(actions).forEach(([, action]) => {
      if (!action) return;
      action.reset().play();
      action.time = Math.random() * (action.getClip().duration || 1);
    });
    // Wing-flap animation playback speed. Was 1.6 + random*0.6 (1.6x-2.2x
    // the clip's authored speed) — too fast, especially on larger/closer
    // butterflies where the same flap rate reads as more frantic simply
    // because it covers more screen space. 1.0 = the clip's natural
    // authored speed. Steadier now: 0.85x-1.05x, much less variance
    // between individual butterflies too.
    mixer.timeScale = 0.85 + Math.random() * 0.2;

    // Wing-tip trail anchors only exist for models that expose nodes named
    // "wing_down"/"wing_up" — neither of the two new GLBs does, so trails
    // simply don't render for them (tipsReady stays false, guarded below).
    if (config.trail) {
      const down = cloned.getObjectByName("wing_down") as
        | THREE.Mesh
        | undefined;
      const up = cloned.getObjectByName("wing_up") as THREE.Mesh | undefined;
      if (down?.isMesh && up?.isMesh) {
        downTipRef.current.position.copy(farthestCorner(down));
        down.add(downTipRef.current);
        upTipRef.current.position.copy(farthestCorner(up));
        up.add(upTipRef.current);
        setTipsReady(true);
      }
    }
  }, [cloned, actions, mixer, config.trail]);

  const prevPos = useRef(new THREE.Vector3());
  const hasPrevPos = useRef(false);

  useFrame((state, delta) => {
    mixer.update(delta);

    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

    let vx: number;
    let vy: number;
    let vz: number;

    if (config.followCursor) {
      // Unproject the cursor to a world-space point at a fixed depth near
      // the portal, so the butterfly actually flies to where the cursor
      // visually appears on screen rather than an approximate 2D offset.
      _cursorVec
        .set(state.pointer.x, state.pointer.y, 0.5)
        .unproject(state.camera);
      _cursorDir.copy(_cursorVec).sub(state.camera.position).normalize();
      const targetZ = 0.4;
      const dist = (targetZ - state.camera.position.z) / _cursorDir.z;
      _pos.copy(state.camera.position).addScaledVector(_cursorDir, dist);
      // clamped so a grazing cursor angle can't send it flying wildly off
      // to the sides — it should track the cursor, not chase it off-screen
      _pos.x = THREE.MathUtils.clamp(_pos.x, -3.2, 3.2);
      _pos.y = THREE.MathUtils.clamp(_pos.y, 1.2, 4.4);
      // Depth wasn't clamped before — when _cursorDir.z lands near zero
      // (cursor near the horizon of the unproject), `dist` can spike or
      // flip sign, placing the follower right in front of the camera
      // instead of out in the scene. That reads as one enormous close-up
      // butterfly filling half the screen — exactly what showed up in
      // testing. Clamping the final z directly (rather than trying to
      // bulletproof the projection math itself) guarantees it stays in
      // the same depth band as the rest of the flock no matter what.
      _pos.z = THREE.MathUtils.clamp(_pos.z, -1, 1.5);

      // lags behind the cursor rather than snapping to it — "follows",
      // not "teleports onto"
      g.position.lerp(_pos, Math.min(delta * 2.2, 1));
    } else {
      flightPosition(config, t, _pos);
      g.position.copy(_pos);
    }

    if (config.behavior === "traverse" && materialsRef.current.length > 0) {
      const fade = traverseFadeFactor(config, t);
      for (const mat of materialsRef.current) mat.opacity = fade;
      // Skip rendering entirely during the invisible pause between
      // crossings — cheaper than drawing a fully-transparent butterfly
      // every frame, and avoids any faint transparency-sorting artifact
      // at opacity 0.
      g.visible = fade > 0.001;
    }

    if (config.followCursor) {
      // heading from actual frame-to-frame displacement, since there's no
      // pure position-as-function-of-time to finite-difference here
      if (hasPrevPos.current) {
        vx = g.position.x - prevPos.current.x;
        vy = g.position.y - prevPos.current.y;
        vz = g.position.z - prevPos.current.z;
      } else {
        vx = 0;
        vy = 0;
        vz = 0;
        hasPrevPos.current = true;
      }
      prevPos.current.copy(g.position);
    } else {
      // heading from a tiny central-difference sample of the same position
      // function — real velocity-based banking instead of a fixed rotation
      // formula, so turns actually look like turns and every butterfly's
      // orientation is a consequence of where it's actually going.
      const dt = 0.05;
      flightPosition(config, t - dt, _tmp);
      vx = _pos.x - _tmp.x;
      vy = _pos.y - _tmp.y;
      vz = _pos.z - _tmp.z;
    }

    const yaw = Math.atan2(vx, vz || 1e-4) + BASE_YAW + model.yawOffset;
    // sharper turn response than a smooth glider — butterflies bank hard
    // and quickly rather than easing into turns
    const bank = THREE.MathUtils.clamp(-vx * 7, -0.95, 0.95);
    const pitch = THREE.MathUtils.clamp(vy * 5, -0.5, 0.5);
    g.rotation.set(pitch, yaw, bank);

    // wing-beat bob applied after heading so it adds visible lift bounce
    // without corrupting the turn/banking calculation above
    g.position.y +=
      Math.sin(t * bob.freq + bob.phase) * bob.amp * (config.scale / 0.12);
  });

  // Two short trails — one per wing — each following an anchor parented
  // directly to that wing's own animated node, so the ribbon actually
  // flutters with the flap instead of trailing a static point on the body.
  // This is the "wings leave tiny pixel particles" detail from the brief.
  const trailWidth = Math.max(0.4, config.scale * 3);

  return (
    <group
      ref={groupRef}
      scale={config.scale * autoScale * GLOBAL_SCALE}
    >
      <primitive object={cloned} />
      {config.trail && tipsReady && (
        <>
          <Trail
            target={downTipRef}
            width={trailWidth}
            length={2.2}
            color={config.color}
            attenuation={(w: number) => w * w}
            decay={2.5}
          />
          <Trail
            target={upTipRef}
            width={trailWidth}
            length={2.2}
            color={config.colorB}
            attenuation={(w: number) => w * w}
            decay={2.5}
          />
        </>
      )}
    </group>
  );
}

// TEMP DEBUG: while confirming the flock actually flies, ignore whatever
// Scene.tsx passes in for reducedMotion/count and always render the full,
// fully-animated flock. Set to false once movement is confirmed working —
// leaving this on means a real visitor's reduced-motion preference (and
// any perf-driven count trim) gets overridden.
const FORCE_FULL_MOTION = true;

export default function Butterflies({
  colors,
  reducedMotion = false,
  count,
}: {
  colors: string[];
  reducedMotion?: boolean;
  count?: number;
}) {
  if (FORCE_FULL_MOTION) {
    reducedMotion = false;
    count = undefined;
  }

  const flock = useMemo(() => {
    const n = count ?? FLOCK.length;
    // Prefer peripheral homes (large |x|) over central ones when the count
    // is trimmed down — the text column sits near x≈0, so this keeps
    // butterflies framing the hero instead of flying through the headline.
    const sorted = [...FLOCK].sort(
      (a, b) => Math.abs(b.home.x) - Math.abs(a.home.x),
    );
    // The cursor-follower's home position is small-|x| (it's irrelevant to
    // its actual flight, which ignores `home` entirely) and would
    // otherwise almost always get cut by the sort above — guarantee it
    // survives the trim instead of leaving it to chance.
    const follower = FLOCK.find((f) => f.followCursor);
    const rest = sorted.filter((f) => !f.followCursor);
    const picked =
      follower && !reducedMotion
        ? [follower, ...rest.slice(0, Math.max(n - 1, 0))]
        : rest.slice(0, n);
    return picked.map((f, i) => ({
      ...f,
      // Wider horizontal spread — the original box (|x| ≤ ~3.6) reads as
      // clustered right around the headline in the center column. Scaling
      // just x (not y/z) pushes the flock further out to the sides without
      // changing how deep/tall the formation reads, so it frames a wider
      // "colony passing through" band across the hero instead of huddling
      // near the text.
      home: new THREE.Vector3(f.home.x * 1.55, f.home.y, f.home.z),
      color: colors[i % colors.length],
      colorB: colors[(i + 1) % colors.length],
      // only the larger roam/orbit butterflies get a trail — keeps draw
      // calls sane with a large flock and reads better anyway, since a
      // trail on a tiny hovering butterfly just looks like noise
      //
      // only the larger roam/orbit butterflies get a trail — keeps draw
      // calls sane with a large flock and reads better anyway, since a
      // trail on a tiny hovering butterfly just looks like noise
      trail: !reducedMotion && f.behavior !== "hover" && f.scale > 0.09,
      // reduced motion keeps things alive (wings still flap via the baked
      // clip, gentle hover stays on) but drops long-distance travel — and
      // disables cursor-following entirely, since chasing the mouse is
      // exactly the kind of motion prefers-reduced-motion asks to avoid
      followCursor: reducedMotion ? false : f.followCursor,
      behavior: reducedMotion ? ("hover" as Behavior) : f.behavior,
      // reducedMotion still needs the *smaller* range, so it multiplies
      // against the already-widened area set above (1.2 × 0.3) rather than
      // the original f.area — otherwise this would silently overwrite the
      // widened value and undo it for anyone with reduced motion on.
      area: reducedMotion ? f.area.clone().multiplyScalar(1.2 * 0.3) : f.area.clone().multiplyScalar(1.2),
      // Alternate between the two real models (see MODELS above) so the
      // flock reads as mixed rather than N clones of one GLB. Indexed off
      // position in the already-trimmed `picked` array (not FLOCK's
      // original index) so a reduced `count` still gets an even split.
      modelIndex: (i % 2) as 0 | 1,
    }));
  }, [colors, reducedMotion, count]);

  return (
    <>
      {flock.map((config, i) => (
        <Butterfly key={i} config={config} />
      ))}
    </>
  );
}

useGLTF.preload("/models/butterfly.glb");
useGLTF.preload("/models/butterfly-cartoon.glb");