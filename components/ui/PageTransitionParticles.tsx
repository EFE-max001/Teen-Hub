// Teen-Hub/components/ui/PageTransitionParticles.tsx
// components/ui/PageTransitionParticles.tsx
//
// The "particles → energy → next page" moment from the redesign brief,
// built the same way the brief asked for the portal upgrade: "no 3D model
// required, just shaders and layered effects." This is pure CSS — a
// handful of glowing motes launching outward from center and fading —
// mounted fresh on every route change (see _app.tsx, which keys the whole
// page tree by pathname) so its animation re-fires on every navigation
// with zero JS render loop.
const COLORS = ['#00FFA3', '#00E5FF', '#FFC65C', '#8B5CF6', '#D9EDE6']
const PARTICLE_COUNT = 14

export default function PageTransitionParticles() {
  return (
    <div className="fixed inset-0 z-[999] pointer-events-none overflow-hidden" aria-hidden="true">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2
        const dist = 46 + (i % 3) * 26
        const tx = Math.round(Math.cos(angle) * dist)
        const ty = Math.round(Math.sin(angle) * dist)
        const color = COLORS[i % COLORS.length]
        const delay = (i % 5) * 0.03

        return (
          <span
            key={i}
            className="qh-page-particle absolute left-1/2 top-1/2 rounded-full"
            style={
              {
                width: 4,
                height: 4,
                background: color,
                boxShadow: `0 0 8px ${color}`,
                animationDelay: `${delay}s`,
                '--tx': `${tx}px`,
                '--ty': `${ty}px`,
              } as React.CSSProperties
            }
          />
        )
      })}
      <style jsx>{`
        .qh-page-particle {
          animation: qhPageParticle 0.7s ease-out both;
        }
        @keyframes qhPageParticle {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0.9;
          }
          100% {
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .qh-page-particle {
            animation: none;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}