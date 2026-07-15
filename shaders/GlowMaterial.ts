import * as THREE from 'three'

// Single emissive material used for every part of the AI Avatar (per the
// Production Bible: "Single emissive PBR material, procedural glow, adaptive
// intensity"). Combines a fresnel rim-glow (bright at silhouette edges, like
// a hologram) with a soft pulse that travels upward through world-space Y —
// the avatar's "energy veins".
export function createGlowMaterial(color: string) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying float vWorldY;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldY = worldPosition.y;
        vec4 mvPosition = viewMatrix * worldPosition;
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying float vWorldY;
      void main() {
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.0);
        float band = fract(vWorldY * 0.9 - uTime * 0.6);
        float vein = smoothstep(0.0, 0.08, band) * smoothstep(0.22, 0.08, band);
        float flicker = 0.9 + 0.1 * sin(uTime * 6.0) * sin(uTime * 1.7);
        float intensity = (0.32 + fresnel * 1.3 + vein * 0.9) * flicker;
        float alpha = clamp(0.32 * 0.6 + fresnel * 0.9 + vein * 0.5, 0.0, 1.0);
        gl_FragColor = vec4(uColor * intensity, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}