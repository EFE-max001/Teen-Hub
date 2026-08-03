// Teen-Hub/components/Butterflies.tsx
// components/Butterflies.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
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
  // Per-model scale correction. The two GLBs weren't authored at the same
  // real-world scale as each other — tune this in one place if one model
  // reads too big/small next to the other once you see it in the browser,
  // rather than re-tuning every FLOCK entry's `scale`.
  scaleMultiplier: number;
  // Compensates for this model's own authored forward axis, same idea as
  // the old shared BASE_YAW — but per-model, since the two GLBs weren't
  // rigged facing the same way. Start at 0 and nudge in ~Math.PI/2 steps
  // if a model appears to fly sideways or backwards.
  yawOffset: number;
};

const MODELS: ModelConfig[] = [
  // butterfly.glb — Sketchfab model, multi-mesh body (wings/legs/antennae
  // as separate primitives), single combined "ArmatureAction" clip.
  // Native bounding box ≈ 1.94 units (max dimension) — close to the
  // original blue_butterfly.glb's ≈2.63, so no correction needed.
  { path: "/models/butterfly.glb", scaleMultiplier: 1, yawOffset: 0 },
  // butterfly-loop.glb — fully rigged single-mesh model with a
  // "take_off_and_land" clip (this is the one uploaded as
  // "animated_flying_fluttering_butterfly_loop.glb"). Authored at a
  // completely different real-world scale than the other two models —
  // its native bounding box is ≈0.0012 units (max dimension), roughly
  // 1/2000th the size of butterfly.glb. Without this correction it renders
  // at a few pixels and is effectively invisible at the scene's camera
  // distance — this is why half the flock (every modelIndex===1 instance)
  // wasn't showing up. 1600x brings its apparent size back in line with
  // the other model's so both read as roughly the same-size butterfly.
  { path: "/models/butterfly-loop.glb", scaleMultiplier: 1600, yawOffset: 0 },
];

// Compensates for the model's own authored forward axis so "yaw 0" reads as
// "facing the direction of travel" rather than side-on. Applies on top of
// each model's own yawOffset above.
// Single global size knob — separate from each model's own scaleMultiplier
// (which only corrects for the two models' different native authoring
// scales relative to each other). Tune this one number to make the whole
// flock uniformly bigger/smaller without disturbing that per-model
// calibration. Original FLOCK `scale` values (0.05–0.26) were sized against
// blue_butterfly.glb; 0.6 brings the new, larger-reading models down to a
// comparable on-screen size — adjust up/down and eyeball it in the browser.
const GLOBAL_SCALE = 0.6;

const BASE_YAW = Math.PI * 0.15;

type Behavior = "hover" | "orbit" | "roam";

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
    scale: 0.07,
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
    scale: 0.06,
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
    scale: 0.08,
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
    scale: 0.065,
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
    scale: 0.05,
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
    scale: 0.09,
    behavior: "orbit",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(2.7, 1.6, 0.25),
    area: new THREE.Vector3(0.45, 0.22, 0.25),
    speed: 0.47,
    seed: 17.8,
    scale: 0.08,
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
    scale: 0.06,
    behavior: "hover",
    orbitDir: -1,
  },
  {
    home: new THREE.Vector3(1.5, 1.35, -0.15),
    area: new THREE.Vector3(0.18, 0.09, 0.1),
    speed: 0.57,
    seed: 23.3,
    scale: 0.055,
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
    scale: 0.065,
    behavior: "hover",
    orbitDir: 1,
  },
  {
    home: new THREE.Vector3(-0.9, 3.5, 0.55),
    area: new THREE.Vector3(0.19, 0.11, 0.12),
    speed: 0.49,
    seed: 35.2,
    scale: 0.06,
    behavior: "hover",
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

function Butterfly({ config }: { config: FlightConfig }) {
  const model = MODELS[config.modelIndex] ?? MODELS[0];
  const { scene, animations } = useGLTF(model.path);
  // Both butterfly.glb and butterfly-loop.glb use skeletal skinning
  // (confirmed by inspecting the source files — each has one glTF "skin").
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

  useEffect(() => {
    // Neither new GLB ships with emissiveFactor set (both are [0,0,0] —
    // confirmed by inspecting the files directly), unlike the original
    // blue_butterfly.glb which was authored fully emissive ([1,1,1]). This
    // scene's lighting is deliberately dim (one soft ambient light plus a
    // couple of low-intensity colored directional lights, per the "Living
    // Digital Forest" mood) — a model that depends entirely on that
    // lighting to be lit renders essentially black-on-black and is
    // invisible, independent of scale or position. This was the actual
    // cause of "I can't see any of the models", not the earlier scale bug.
    //
    // This sets each mesh's own base color texture as its emissive map too
    // (emissive must start non-black for an emissiveMap to have any
    // effect — it's multiplicative), so the butterfly becomes self-lit
    // using its own real colors/pattern rather than an arbitrary tint.
    // This is a visibility fix, not a recolor — "original models" still
    // holds, this just makes the original texture read in the dark.
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const mat of materials) {
        const std = mat as THREE.MeshStandardMaterial;
        if (!std.isMeshStandardMaterial) continue;
        std.emissive = new THREE.Color(0xffffff);
        std.emissiveMap = std.map;
        std.emissiveIntensity = 0.7;
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
    mixer.timeScale = 1.6 + Math.random() * 0.6;

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
      scale={config.scale * model.scaleMultiplier * GLOBAL_SCALE}
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
      color: colors[i % colors.length],
      colorB: colors[(i + 1) % colors.length],
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
      area: reducedMotion ? f.area.clone().multiplyScalar(0.3) : f.area,
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
useGLTF.preload("/models/butterfly-loop.glb");
