// Decorative command-center radar — pure SVG + CSS, no canvas/JS loop, so it costs
// nothing at runtime. Concentric rings, a crosshair, a few "contact" blips, and a
// rotating sweep wedge (CSS animation on a conic-gradient div clipped to a circle).
// Built for the Founder "War Room" header to match the war_room_radar reference art:
// dark control-room base with a glowing radar screen as the focal point.
export default function RadarSweep({ size = 220, className = '' }: { size?: number; className?: string }) {
  const s = size
  const c = s / 2
  const rings = [0.28, 0.52, 0.76, 1].map(f => f * (c - 2))

  // Fixed "contact" blips at varying angle/radius so the sweep periodically lights them up.
  const blips = [
    { a: 40, r: 0.8 }, { a: 140, r: 0.55 }, { a: 210, r: 0.9 }, { a: 300, r: 0.35 },
  ]

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: s, height: s }}
      aria-hidden="true"
    >
      {/* rotating sweep wedge, clipped to the circle */}
      <div
        className="absolute inset-0 rounded-full animate-radar-spin"
        style={{
          background: 'conic-gradient(from 0deg, rgba(245,158,11,0.35) 0deg, rgba(245,158,11,0) 55deg)',
        }}
      />

      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="absolute inset-0">
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(245,158,11,0.10)" />
            <stop offset="100%" stopColor="rgba(245,158,11,0)" />
          </radialGradient>
        </defs>

        <circle cx={c} cy={c} r={c - 2} fill="url(#radarGlow)" />

        {rings.map((r, i) => (
          <circle key={i} cx={c} cy={c} r={r} fill="none" stroke="rgba(245,158,11,0.28)" strokeWidth={1} />
        ))}

        {/* crosshair */}
        <line x1={c} y1={2} x2={c} y2={s - 2} stroke="rgba(245,158,11,0.18)" strokeWidth={1} />
        <line x1={2} y1={c} x2={s - 2} y2={c} stroke="rgba(245,158,11,0.18)" strokeWidth={1} />

        {/* outer ring, brighter */}
        <circle cx={c} cy={c} r={c - 2} fill="none" stroke="rgba(245,158,11,0.5)" strokeWidth={1.5} />

        {/* contact blips */}
        {blips.map((b, i) => {
          const rad = (b.a * Math.PI) / 180
          const rr = b.r * (c - 10)
          const x = c + rr * Math.cos(rad)
          const y = c + rr * Math.sin(rad)
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={2.5}
              fill="#fbbf24"
              className="animate-pulse"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          )
        })}

        {/* center dot */}
        <circle cx={c} cy={c} r={3} fill="#fde68a" />
      </svg>
    </div>
  )
}