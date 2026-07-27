import * as THREE from 'three'

// The portal ring's material — per the "Living Digital Forest" direction,
// this replaces a flat neon-blue ring with something that reads as living
// energy: two colors flowing into each other around the loop (cyan/violet),
// a fresnel rim so the tube's edges read brighter than its face, and a slow
// overall pulse so the ring never sits perfectly static.
export function createPortalMaterial(colorA: string, colorB: string) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec4 mvPosition = viewMatrix * worldPosition;
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 1.6);

        // color slowly cycles around the ring's circumference (vUv.x wraps
        // the loop) so it reads as energy flowing rather than a static
        // gradient
        float mixAmt = sin(vUv.x * 6.28318 + uTime * 0.4) * 0.5 + 0.5;
        vec3 base = mix(uColorA, uColorB, mixAmt);

        // bright streaks travel around the loop — "flowing data streams"
        float flow = fract(vUv.x * 3.0 - uTime * 0.35);
        float streak = smoothstep(0.0, 0.16, flow) * smoothstep(0.5, 0.16, flow);

        // gentle overall breathing pulse, ~4s period
        float pulse = 0.85 + 0.15 * sin(uTime * 0.8);

        float intensity = (0.95 + fresnel * 1.5 + streak * 1.2) * pulse;
        float alpha = clamp(0.8 + fresnel * 0.45, 0.0, 1.0);
        gl_FragColor = vec4(base * intensity, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

// Fills the ring's hollow center with slowly swirling energy fog — without
// this the portal was structurally just a ring shape, not a window/gateway.
// Cheap fake-FBM (three rotated sine layers at different speeds) rather
// than real noise, fresnel-style falloff toward the rim so it blends into
// the ring's own glow instead of reading as a hard-edged disc.
export function createPortalMistMaterial(colorA: string, colorB: string) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uTime;
      varying vec2 vUv;

      float swirl(vec2 uv, float t) {
        vec2 c = uv - 0.5;
        float a = atan(c.y, c.x);
        float r = length(c);
        float n =
          sin(a * 3.0 + t * 0.6 + r * 5.0) * 0.35 +
          sin(a * -5.0 + t * 0.4 - r * 8.0) * 0.25 +
          sin(a * 7.0 + t * 0.9 + r * 3.0) * 0.2;
        return n * 0.5 + 0.5;
      }

      void main() {
        vec2 c = vUv - 0.5;
        float r = length(c) * 2.0;
        // fades out well before the rim so it reads as fog inside the
        // window rather than a visible disc edge competing with the ring
        float edgeFade = 1.0 - smoothstep(0.55, 0.98, r);

        float n = swirl(vUv, uTime);
        vec3 color = mix(uColorA, uColorB, n);
        float alpha = edgeFade * (0.10 + n * 0.14);

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

// Sparks that escape the ring and drift outward, fading as they go. Fully
// GPU-driven — position and opacity are both computed from uTime and a
// per-point seed attribute inside the shaders, so there's no per-frame CPU
// work regardless of point count.
export function createSparkMaterial(color: string) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 },
      uRadius: { value: 1.9 },
    },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime;
      uniform float uRadius;
      varying float vLife;

      float hash(float n) { return fract(sin(n) * 43758.5453123); }

      void main() {
        // each point runs its own independent lifecycle loop, offset by
        // its seed so sparks never all launch in sync
        float cycle = 3.5 + hash(aSeed) * 2.5;
        float t = mod(uTime * 0.5 + aSeed * 37.0, cycle) / cycle;

        float angle = aSeed * 6.28318;
        float startR = uRadius * (0.96 + hash(aSeed + 1.0) * 0.06);
        // drifts outward and gently upward over its life, decelerating
        float outward = t * (0.5 + hash(aSeed + 2.0) * 0.6);
        float r = startR + outward;
        float y = sin(angle) * 0.35 + t * (0.3 + hash(aSeed + 3.0) * 0.4);
        vec3 pos = vec3(cos(angle) * r, y + cos(angle) * 0.35, sin(angle) * r * 0.35);

        vLife = 1.0 - t;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = (2.5 + hash(aSeed + 4.0) * 2.5) * vLife * (300.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vLife;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float glow = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(uColor, glow * vLife * 0.9);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
}