// components/ParticleNetwork.tsx
//
// Layer Two: the "Living Particle Network." Each particle reads as a mote
// of information rather than decoration — they drift slowly, draw a faint
// connecting line to nearby particles (a network, not snowfall), and
// gather gently toward the cursor within a radius, per the brief: "when
// users hover, nearby particles gather." Plain Canvas2D rather than
// WebGL/Three — a couple hundred particles here costs a fraction of an
// equivalent count of 3D sprites, which is the point of this whole layer
// given the "avoid heavy 3D" performance budget.
import { useEffect, useRef } from 'react'

type Particle = { x: number; y: number; vx: number; vy: number; r: number; colorIdx: number }

const COLORS = ['#00FFA3', '#00E5FF', '#FFC65C', '#8B5CF6']

export default function ParticleNetwork({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let particles: Particle[] = []
    let raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const COUNT = reducedMotion ? 20 : 45
    const LINK_DIST = 90

    function resize() {
      const parent = canvas!.parentElement
      width = parent ? parent.clientWidth : window.innerWidth
      height = parent ? parent.clientHeight : window.innerHeight
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      canvas!.style.width = width + 'px'
      canvas!.style.height = height + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function init() {
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: 1 + Math.random() * 1.8,
        colorIdx: Math.floor(Math.random() * COLORS.length),
      }))
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect()
      mouseRef.current.x = e.clientX - rect.left
      mouseRef.current.y = e.clientY - rect.top
    }
    function onMouseLeave() {
      mouseRef.current.x = -9999
      mouseRef.current.y = -9999
    }

    // One frame of work — separated from the scheduling loop below so a
    // reduced-motion visitor still gets a static, fully-drawn network
    // instead of nothing.
    function draw() {
      ctx!.clearRect(0, 0, width, height)
      const m = mouseRef.current

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        const dx = m.x - p.x
        const dy = m.y - p.y
        const dist = Math.hypot(dx, dy)
        if (dist < 160 && dist > 0.01) {
          const pull = (1 - dist / 160) * 0.4
          p.x += (dx / dist) * pull
          p.y += (dy / dist) * pull
        }

        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10
        if (p.y < -10) p.y = height + 10
        if (p.y > height + 10) p.y = -10
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < LINK_DIST) {
            ctx!.strokeStyle = `rgba(0, 229, 255, ${0.06 * (1 - d / LINK_DIST)})`
            ctx!.lineWidth = 1
            ctx!.beginPath()
            ctx!.moveTo(a.x, a.y)
            ctx!.lineTo(b.x, b.y)
            ctx!.stroke()
          }
        }
      }

      for (const p of particles) {
        ctx!.beginPath()
        ctx!.fillStyle = COLORS[p.colorIdx]
        ctx!.globalAlpha = 0.45
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1
    }

    function loop() {
      draw()
      raf = requestAnimationFrame(loop)
    }

    resize()
    init()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)

    if (reducedMotion) {
      draw()
    } else {
      raf = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [reducedMotion])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" aria-hidden />
}