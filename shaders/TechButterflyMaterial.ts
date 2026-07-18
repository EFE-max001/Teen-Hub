import * as THREE from 'three'

// Wing material for the "Design Tech Butterflies" brief: wings made from
// transparent glass, circuit traces, holographic crystal, glowing energy —
// explicitly NOT a solid emissive fill. Previously the butterflies reused
// createGlowMaterial(), which was built for the AI avatar's armor plating —
// a single fresnel rim + upward vein pulse. That reads as "glowing wireframe
// robot part", not "living crystal wing", which is most of why the flock
// didn't feel right. This material is purpose-built for wings instead:
//
//  - fresnel-driven glass translucency (dim across the face, bright and
//    near-opaque only right at the silhouette edge, like light catching
//    the rim of actual glass)
//  - two crossing families of thin procedural lines radiating out from the
//    body, standing in for circuit-trace / vein branching
//  - a slow energy pulse that travels outward from body to wingtip and
//    loops, riding along those veins
//  - iridescent colorA/colorB drift with view angle + time, like light
//    refracting through crystal rather than a flat single-color tint
export function createTechButterflyMaterial(colorA: string, colorB: string) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
      uTime: { value: 0 },
      uSeed: { value: Math.random() * 100 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPosition.xyz);
        vPos = position;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uTime;
      uniform float uSeed;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vPos;

      void main() {
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 1.8);

        // distance out along the wing from the body — local X is the span
        // direction on this model, local Z folded in lightly so the pattern
        // isn't a perfectly straight radial line
        float d = abs(vPos.x) + abs(vPos.z) * 0.4;

        // two crossing line families at shallow, non-parallel angles — reads
        // as veins branching toward the wing edge rather than a grid
        float v1 = abs(sin(vPos.x * 14.0 + vPos.y * 3.0 + uSeed));
        float v2 = abs(sin(vPos.x * 6.0 - vPos.y * 11.0 + uSeed * 1.7));
        float veins = smoothstep(0.94, 1.0, v1) + smoothstep(0.96, 1.0, v2) * 0.7;

        // energy pulse loops outward from body to tip along the veins
        float phase = fract(d * 1.6 - uTime * 0.9);
        float pulse = smoothstep(0.0, 0.15, phase) * smoothstep(0.3, 0.15, phase);

        // iridescence: mix A/B by viewing angle, drifting slowly over time so
        // it never locks into a static gradient
        float mixT = clamp(fresnel * 0.7 + 0.3 * sin(uTime * 0.5 + uSeed), 0.0, 1.0);
        vec3 base = mix(uColorA, uColorB, mixT);

        // glass: dim on the face, bright at the rim — this is the main
        // difference from the old flat-fill look
        float glassAlpha = 0.58 + fresnel * 0.3;
        float veinGlow = veins * 0.8;
        float pulseGlow = pulse * 1.5;

        vec3 color = base * (0.55 + fresnel * 1.0) + base * veinGlow + vec3(1.0) * pulseGlow * 0.45;
        // floor raised to 0.5 — a wing facing the camera has near-zero
        // fresnel across most of its face, so a fresnel-only alpha (the
        // previous version) left the interior almost fully transparent and
        // only the rim visible: a flock of thin edge-outlines that read as
        // scattered triangles/shards rather than butterflies. The vein/
        // pulse/fresnel terms now layer detail on TOP of a guaranteed
        // silhouette instead of being the only thing making it visible.
        float alpha = clamp(glassAlpha + veinGlow * 0.3 + pulseGlow * 0.4, 0.5, 1.0);

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}