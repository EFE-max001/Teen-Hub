import { useEffect, useRef } from 'react'

// SENTINEL GRID — animated 3D-style perspective grid background.
// Pure Canvas2D (no WebGL): a horizon-plane grid rendered with manual perspective
// projection, drifting toward the viewer, plus ambient neon particles and scanlines.
export default function SentinelBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0, height = 0, dpr = 1
    let rafId = 0
    let t = 0

    const COLS = 24
    const ROWS = 26
    const SPEED = 0.006

    type Particle = { x: number; y: number; z: number; s: number }
    const particles: Particle[] = Array.from({ length: 70 }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random(),
      s: Math.random() * 1.5 + 0.4,
    }))

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    // Projects a point on the ground plane (gx in [-1,1], gz in [0,1] depth-from-horizon)
    // into 2D screen space using a simple perspective divide — gives the 3D-grid illusion
    // without any WebGL/3D library.
    function project(gx: number, gz: number, horizonY: number, vanishScale: number) {
      const depth = gz + 0.08
      const perspective = 1 / depth
      const screenX = width / 2 + gx * width * 0.5 * perspective
      const screenY = horizonY + (height - horizonY) * (1 - perspective * vanishScale)
      return { x: screenX, y: screenY, perspective }
    }

    function draw() {
      t += SPEED
      ctx!.clearRect(0, 0, width, height)

      // deep space backdrop
      const bg = ctx!.createLinearGradient(0, 0, 0, height)
      bg.addColorStop(0, '#050008')
      bg.addColorStop(0.55, '#0a0212')
      bg.addColorStop(1, '#12021f')
      ctx!.fillStyle = bg
      ctx!.fillRect(0, 0, width, height)

      const horizonY = height * 0.42

      // horizon glow
      const glow = ctx!.createRadialGradient(width / 2, horizonY, 0, width / 2, horizonY, width * 0.6)
      glow.addColorStop(0, 'rgba(168,85,247,0.18)')
      glow.addColorStop(1, 'rgba(168,85,247,0)')
      ctx!.fillStyle = glow
      ctx!.fillRect(0, horizonY - height * 0.3, width, height * 0.6)

      // ambient starfield particles (upper half)
      for (const p of particles) {
        const px = width / 2 + p.x * width * 0.5
        const py = p.y * horizonY * 0.9
        if (py > horizonY - 4) continue
        const flicker = 0.4 + 0.6 * Math.abs(Math.sin(t * 40 + p.z * 10))
        ctx!.beginPath()
        ctx!.arc(px, py, p.s, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(200,170,255,${0.25 * flicker})`
        ctx!.fill()
      }

      // perspective ground grid — vertical lines (columns) converging toward center
      ctx!.lineWidth = 1
      for (let i = 0; i <= COLS; i++) {
        const gx = (i / COLS) * 2 - 1
        const near = project(gx, 1, horizonY, 1)
        const far = project(gx, 0.02, horizonY, 1)
        const grad = ctx!.createLinearGradient(far.x, far.y, near.x, near.y)
        grad.addColorStop(0, 'rgba(168,85,247,0)')
        grad.addColorStop(1, 'rgba(192,132,252,0.35)')
        ctx!.strokeStyle = grad
        ctx!.beginPath()
        ctx!.moveTo(far.x, far.y)
        ctx!.lineTo(near.x, near.y)
        ctx!.stroke()
      }

      // perspective ground grid — horizontal lines (rows), animated drifting toward viewer
      const scroll = t % (1 / ROWS)
      for (let j = 0; j <= ROWS; j++) {
        const gz = j / ROWS + scroll
        if (gz > 1) continue
        const left = project(-1, gz, horizonY, 1)
        const right = project(1, gz, horizonY, 1)
        const fade = Math.min(1, gz * 1.6)
        ctx!.strokeStyle = `rgba(192,132,252,${0.22 * fade})`
        ctx!.beginPath()
        ctx!.moveTo(left.x, left.y)
        ctx!.lineTo(right.x, right.y)
        ctx!.stroke()

        // node pulses at intersections along the nearest few rows
        if (gz > 0.55) {
          for (let i = 0; i <= COLS; i += 2) {
            const gx = (i / COLS) * 2 - 1
            const pt = project(gx, gz, horizonY, 1)
            const pulse = 0.5 + 0.5 * Math.sin(t * 60 + i * 0.7 + j * 0.5)
            ctx!.beginPath()
            ctx!.arc(pt.x, pt.y, 1.3 * fade, 0, Math.PI * 2)
            ctx!.fillStyle = `rgba(216,180,254,${0.5 * fade * pulse})`
            ctx!.fill()
          }
        }
      }

      // horizon line
      ctx!.strokeStyle = 'rgba(216,180,254,0.4)'
      ctx!.lineWidth = 1
      ctx!.beginPath()
      ctx!.moveTo(0, horizonY)
      ctx!.lineTo(width, horizonY)
      ctx!.stroke()

      // subtle scanline overlay
      ctx!.fillStyle = 'rgba(0,0,0,0.04)'
      for (let y = 0; y < height; y += 3) {
        ctx!.fillRect(0, y, width, 1)
      }

      rafId = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  )
}
