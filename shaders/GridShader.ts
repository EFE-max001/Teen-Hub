import * as THREE from 'three'

// Shader-based infinite neon grid (per spec: "shader-based infinite grid" —
// a real GPU plane instead of hand-drawn 2D canvas lines). Perspective and
// convergence come from real 3D geometry + the camera, not faked with 2D
// projection math. Lines fade out with distance to suggest an infinite floor.
export function createGridMaterial(color: string) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying float vDist;
      void main() {
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vDist = length(worldPosition.xz);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec2 vUv;
      varying float vDist;

      float gridLine(vec2 uv, float cell, float thickness) {
        vec2 c = fract(uv * cell);
        vec2 d = min(c, 1.0 - c);
        float line = min(d.x, d.y);
        return 1.0 - smoothstep(0.0, thickness, line);
      }

      void main() {
        vec2 scrolled = vUv + vec2(0.0, uTime * 0.05);
        float line = gridLine(scrolled, 28.0, 0.012);
        float fade = clamp(1.0 - vDist / 16.0, 0.0, 1.0);
        float alpha = line * fade * 0.55;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}