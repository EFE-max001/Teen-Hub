// Teen-Hub/components/ui/ButterfliesOverlay.tsx
// Pure CSS/SVG butterflies that float across the whole page and
// "land" on text elements — no WebGL, no extra deps, mobile-safe.
// These complement the R3F Butterflies in the hero canvas.

'use client'
import { useEffect, useRef } from 'react'
import { useDeviceCapability } from '@/hooks/useDeviceCapability'

// SVG butterfly path — a simple top-down wing silhouette
const WING_PATH = `M 0,-6 C -3,-10 -14,-8 -12,-2 C -10,4 -4,5 0,2 C 4,5 10,4 12,-2 C 14,-8 3,-10 0,-6 Z`

type ButterflyConfig = {
  id: number
  startX: number   // vw %
  startY: number   // vh %
  endX: number
  endY: number
  duration: number // ms
  delay: number
  size: number
  color: string
  land: boolean    // whether this one lands on a target element
  landSelector?: string
  wingSpeed: number
}

const PALETTE = [
  '#00FFA3', '#00E5FF', '#8B5CF6', '#FFC65C',
  '#E879F9', '#34D399', '#67E8F9', '#F59E0B',
]

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 4294967296
  }
}

function buildFlock(roamCount: number, landCount: number): ButterflyConfig[] {
  const configs: ButterflyConfig[] = []
  // Roaming butterflies — cross the full viewport
  for (let i = 0; i < roamCount; i++) {
    const r = seededRand(i * 37 + 11)
    const fromLeft = r() > 0.5
    configs.push({
      id: i,
      startX: fromLeft ? -8 : 108,
      startY: 8 + r() * 84,
      endX: fromLeft ? 108 : -8,
      endY: 8 + r() * 84,
      duration: 12000 + r() * 18000,
      delay: r() * 20000,
      size: 14 + r() * 22,
      color: PALETTE[Math.floor(r() * PALETTE.length)],
      land: false,
      wingSpeed: 0.3 + r() * 0.5,
    })
  }
  // Butterflies that land on text
  const LAND_TARGETS = [
    '.hero-land-target',
    '.rank-land-target',
    '.sentinel-land-target',
    '.quest-land-target',
    '.cta-land-target',
  ]
  for (let i = 0; i < landCount; i++) {
    const r = seededRand(i * 53 + 77)
    const fromLeft = r() > 0.5
    configs.push({
      id: 100 + i,
      startX: fromLeft ? -10 : 110,
      startY: 5 + r() * 60,
      endX: fromLeft ? 110 : -10,
      endY: 5 + r() * 60,
      duration: 14000 + r() * 10000,
      delay: 3000 + r() * 25000,
      size: 18 + r() * 16,
      color: PALETTE[Math.floor(r() * PALETTE.length)],
      land: true,
      landSelector: LAND_TARGETS[i % LAND_TARGETS.length],
      wingSpeed: 0.25 + r() * 0.35,
    })
  }
  return configs
}

// FLOCK is no longer a single fixed module-level constant — see
// ButterfliesOverlay below, which now builds a full-size flock (18 roam + 5
// land, the original counts, unchanged for anyone on capable hardware) or a
// reduced one (8 roam + 2 land) on low-end/slow-network devices, instead of
// running all 23 independent requestAnimationFrame loops unconditionally on
// every non-landing page for every visitor.

export default function ButterfliesOverlay() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { isLowEnd } = useDeviceCapability()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const el = containerRef.current
    if (!el) return

    const flock = isLowEnd ? buildFlock(8, 2) : buildFlock(18, 5)

    // Create SVG butterfly elements
    flock.forEach((cfg) => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('viewBox', '-16 -16 32 32')
      svg.setAttribute('width', `${cfg.size}`)
      svg.setAttribute('height', `${cfg.size}`)
      svg.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        filter: drop-shadow(0 0 4px ${cfg.color}88);
        opacity: 0;
        will-change: transform, opacity;
        left: ${cfg.startX}vw;
        top: ${cfg.startY}vh;
      `

      // Wings (two mirrored paths)
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      const leftWing = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      leftWing.setAttribute('d', WING_PATH)
      leftWing.setAttribute('fill', cfg.color)
      leftWing.setAttribute('opacity', '0.85')
      const rightWing = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      rightWing.setAttribute('d', WING_PATH)
      rightWing.setAttribute('fill', cfg.color)
      rightWing.setAttribute('opacity', '0.85')
      rightWing.setAttribute('transform', 'scale(-1,1)')
      g.appendChild(leftWing)
      g.appendChild(rightWing)
      // body dot
      const body = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')
      body.setAttribute('cx', '0')
      body.setAttribute('cy', '0')
      body.setAttribute('rx', '1.5')
      body.setAttribute('ry', '5')
      body.setAttribute('fill', '#0a0f0c')
      g.appendChild(body)
      svg.appendChild(g)
      el.appendChild(svg)

      let animFrame: number
      let landed = false
      let landEl: Element | null = null
      let landX = 0
      let landY = 0
      let landedAt = 0
      const LAND_DURATION = 5000 + Math.random() * 8000

      function getWingAngle(t: number) {
        // realistic butterfly flap — fast close, slow open
        const raw = Math.sin(t * Math.PI * 2 * cfg.wingSpeed * 6)
        return raw > 0 ? Math.pow(raw, 0.6) * 38 : Math.pow(-raw, 1.6) * -12
      }

      function flyPhase(startTime: number, startX: number, startY: number) {
        // If has a land target, pick it and land mid-journey
        if (cfg.land && !landed) {
          landEl = document.querySelector(cfg.landSelector || '')
          if (landEl) {
            const rect = landEl.getBoundingClientRect()
            landX = ((rect.left + rect.width * (0.2 + Math.random() * 0.6)) / window.innerWidth) * 100
            landY = ((rect.top + rect.height * 0.5) / window.innerHeight) * 100
          }
        }

        function tick() {
          const now = performance.now()
          const elapsed = now - startTime
          const totalDist = Math.sqrt(
            Math.pow(cfg.endX - startX, 2) + Math.pow(cfg.endY - startY, 2)
          )
          const flightMs = cfg.duration

          // Check for landing
          if (cfg.land && !landed && landEl) {
            const progress = elapsed / flightMs
            const cx = startX + (cfg.endX - startX) * progress
            const cy = startY + (cfg.endY - startY) * progress
            const rect = landEl.getBoundingClientRect()
            const targetX = (rect.left + rect.width * 0.4) / window.innerWidth * 100
            const targetY = (rect.top + rect.height * 0.5) / window.innerHeight * 100
            const dist = Math.sqrt(Math.pow(cx - targetX, 2) + Math.pow(cy - targetY, 2))

            if (dist < 12 || (progress > 0.35 && progress < 0.65 && dist < 25)) {
              landed = true
              landedAt = now
              doLand(rect, now)
              return
            }
          }

          if (elapsed >= flightMs) {
            svg.style.opacity = '0'
            // Reset and fly again after delay
            setTimeout(() => {
              landed = false
              svg.style.left = `${cfg.startX}vw`
              svg.style.top = `${cfg.startY + (Math.random() - 0.5) * 20}vh`
              flyPhase(performance.now(), cfg.startX, cfg.startY)
            }, cfg.delay * 0.3)
            return
          }

          const t = elapsed / flightMs
          // smooth S-curve flight path with vertical sine wobble
          const x = startX + (cfg.endX - startX) * t + Math.sin(t * Math.PI * 3 + cfg.id) * 3
          const y = startY + (cfg.endY - startY) * t + Math.sin(t * Math.PI * 5 + cfg.id * 0.7) * 2.5

          // Heading angle
          const dx = (cfg.endX - startX) + Math.cos(t * Math.PI * 3 + cfg.id) * 9
          const dy = (cfg.endY - startY) + Math.cos(t * Math.PI * 5 + cfg.id * 0.7) * 7.5
          const angle = Math.atan2(dy, dx) * (180 / Math.PI)

          const wingAngle = getWingAngle(now / 1000)
          leftWing.setAttribute('transform', `rotate(${-wingAngle}, -1, 0)`)
          rightWing.setAttribute('transform', `rotate(${wingAngle}, 1, 0) scale(-1,1)`)

          const opacity = t < 0.05 ? t / 0.05 : t > 0.95 ? (1 - t) / 0.05 : 1

          svg.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`
          svg.style.left = `${x}vw`
          svg.style.top = `${y}vh`
          svg.style.opacity = `${opacity * 0.9}`

          animFrame = requestAnimationFrame(tick)
        }
        svg.style.opacity = '0'
        animFrame = requestAnimationFrame(tick)
      }

      function doLand(rect: DOMRect, startTime: number) {
        // Descend to land position
        const lx = rect.left + rect.width * (0.15 + Math.random() * 0.7)
        const ly = rect.top + (Math.random() > 0.5 ? -cfg.size * 0.3 : rect.height * 0.3)

        function tick() {
          const now = performance.now()
          const elapsed = now - startTime
          const t = Math.min(elapsed / 600, 1)
          const eased = 1 - Math.pow(1 - t, 3)

          // Slow wing flap while landing, then resting flutter
          const resting = t >= 1
          const flapSpeed = resting ? 0.8 : 3
          const flapAmp = resting ? 15 : 30
          const wingAngle = Math.sin((now / 1000) * flapSpeed * Math.PI) * flapAmp

          leftWing.setAttribute('transform', `rotate(${-Math.abs(wingAngle)}, -1, 0)`)
          rightWing.setAttribute('transform', `rotate(${Math.abs(wingAngle)}, 1, 0) scale(-1,1)`)

          const px = (lx / window.innerWidth) * 100
          const py = (ly / window.innerHeight) * 100
          svg.style.left = `${px}vw`
          svg.style.top = `${py}vh`
          svg.style.transform = `translate(-50%, -50%) rotate(0deg) scale(${0.6 + eased * 0.4})`
          svg.style.opacity = '0.92'

          const timeOnLand = now - (startTime + 600)
          if (t >= 1 && timeOnLand > LAND_DURATION) {
            // Take off
            landed = false
            flyPhase(performance.now(), px, py)
            return
          }
          animFrame = requestAnimationFrame(tick)
        }
        animFrame = requestAnimationFrame(tick)
      }

      // Start with delay
      setTimeout(() => {
        flyPhase(performance.now(), cfg.startX, cfg.startY)
      }, cfg.delay)

      return () => {
        cancelAnimationFrame(animFrame)
        el.removeChild(svg)
      }
    })
  }, [isLowEnd])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden"
      aria-hidden="true"
    />
  )
}