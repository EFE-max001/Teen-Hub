// Teen-Hub/components/GlowingRoots.tsx
// components/GlowingRoots.tsx
//
// Layers Three & Four: organic glowing roots growing upward from the base
// of the hero, with light travelling through them riding the same paths.
// Built as SVG rather than 3D geometry — stroke-dasharray handles the
// "grow in" animation for free on mount, and a small light dot animated
// with SMIL's animateMotion travels each path afterward with zero JS per
// frame (the browser's own animation engine drives it, not a render loop).
import { useMemo } from 'react'

type RootPath = { d: string; color: string; delay: number; duration: number }

// Hand-authored organic branching curves rising from the bottom edge,
// asymmetric left/right/center so it doesn't read as a mirrored template.
// Expressed in a fixed viewBox (see below) rather than real pixels, so
// they stay stable across window resizes without recomputation.
function buildRoots(w: number, h: number): RootPath[] {
  const [emerald, cyan, gold, violet] = ['#00FFA3', '#00E5FF', '#FFC65C', '#8B5CF6']
  return [
    { d: `M ${w * 0.08} ${h} C ${w * 0.095} ${h * 0.88}, ${w * 0.14} ${h * 0.84}, ${w * 0.15} ${h * 0.74}`, color: emerald, delay: 0, duration: 4.5 },
    { d: `M ${w * 0.08} ${h} C ${w * 0.07} ${h * 0.9}, ${w * 0.03} ${h * 0.85}, ${w * 0.01} ${h * 0.76}`, color: violet, delay: 0.6, duration: 4 },
    { d: `M ${w * 0.9} ${h} C ${w * 0.89} ${h * 0.89}, ${w * 0.85} ${h * 0.85}, ${w * 0.84} ${h * 0.73}`, color: gold, delay: 0.3, duration: 4.8 },
    { d: `M ${w * 0.9} ${h} C ${w * 0.92} ${h * 0.9}, ${w * 0.96} ${h * 0.85}, ${w * 0.97} ${h * 0.75}`, color: cyan, delay: 0.9, duration: 4.2 },
    { d: `M ${w * 0.5} ${h} C ${w * 0.49} ${h * 0.93}, ${w * 0.52} ${h * 0.9}, ${w * 0.51} ${h * 0.82}`, color: cyan, delay: 1.2, duration: 5 },
  ]
}

// "The World Evolves" — per the brief: "more roots appear" as a member
// progresses. These are extra branch offshoots layered on top of the base
// five, unlocked in tiers as `growth` (0–1, driven by rank) climbs — so a
// brand-new guest sees exactly the original five roots, and a top-ranked
// member sees a noticeably fuller root system.
function buildGrowthRoots(w: number, h: number): RootPath[] {
  const [emerald, cyan, gold, violet] = ['#00FFA3', '#00E5FF', '#FFC65C', '#8B5CF6']
  return [
    { d: `M ${w * 0.15} ${h * 0.74} C ${w * 0.19} ${h * 0.68}, ${w * 0.22} ${h * 0.66}, ${w * 0.24} ${h * 0.58}`, color: gold, delay: 0.2, duration: 4 },
    { d: `M ${w * 0.84} ${h * 0.73} C ${w * 0.8} ${h * 0.66}, ${w * 0.78} ${h * 0.63}, ${w * 0.76} ${h * 0.56}`, color: emerald, delay: 0.4, duration: 4.3 },
    { d: `M ${w * 0.01} ${h * 0.76} C ${w * -0.01} ${h * 0.68}, ${w * 0.01} ${h * 0.64}, ${w * 0.03} ${h * 0.55}`, color: cyan, delay: 0.8, duration: 4.6 },
    { d: `M ${w * 0.51} ${h * 0.82} C ${w * 0.53} ${h * 0.74}, ${w * 0.5} ${h * 0.7}, ${w * 0.52} ${h * 0.6}`, color: violet, delay: 1.5, duration: 5.2 },
  ]
}

// Percentage-based viewBox (0–100) rather than a fixed 1200×800 one — with
// preserveAspectRatio="none" this maps 1:1 to the actual container's own
// width/height, so the curves stay anchored near the bottom edge on any
// aspect ratio. The previous fixed-viewBox + "slice" combination scaled up
// and cropped on wide viewports, which is what stretched these into
// corner-to-corner diagonal lines instead of small curves.
const W = 100
const H = 100

export default function GlowingRoots({
  reducedMotion = false,
  growth = 0,
}: {
  reducedMotion?: boolean
  growth?: number
}) {
  const roots = useMemo(() => buildRoots(W, H), [])
  const growthRoots = useMemo(() => buildGrowthRoots(W, H), [])
  // Unlock the four bonus roots one at a time as growth climbs, rather
  // than all-at-once at some threshold — feels like gradual progress
  // instead of a single jarring change.
  const unlockedCount = Math.round(growth * growthRoots.length)
  const visibleGrowthRoots = growthRoots.slice(0, unlockedCount)
  const baseOpacity = 0.35 + growth * 0.15

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    >
      <defs>
        <filter id="root-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.25" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {[...roots, ...visibleGrowthRoots].map((r, i) => (
        <g key={i}>
          <path
            d={r.d}
            fill="none"
            stroke={r.color}
            strokeWidth={0.18}
            strokeLinecap="round"
            filter="url(#root-glow)"
            opacity={baseOpacity}
            style={
              reducedMotion
                ? undefined
                : {
                    strokeDasharray: 40,
                    strokeDashoffset: 40,
                    animation: `qhRootGrow ${r.duration}s ease-out ${r.delay}s forwards`,
                  }
            }
          />
          {!reducedMotion && (
            <circle r={0.3} fill={r.color} opacity={0.7}>
              <animateMotion
                path={r.d}
                dur={`${r.duration + 2}s`}
                begin={`${r.delay + r.duration}s`}
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
          )}
        </g>
      ))}
      <style>{`
        @keyframes qhRootGrow {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  )
}