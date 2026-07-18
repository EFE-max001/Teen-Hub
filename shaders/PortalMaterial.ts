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