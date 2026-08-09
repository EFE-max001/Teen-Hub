// Teen-Hub/components/ui/AmbientGlow.tsx
// The landing page gets the full 3D "Living Digital Forest" hero scene via
// SentinelBackground. Every other route deliberately does NOT mount that
// scene (see pages/_app.tsx — it was previously mounted globally and made
// the whole app feel sluggish). That fix was correct, but it also meant
// every non-landing page ended up completely flat and dark, with the only
// "living" light in the whole app being the emerald glow on the active
// sidebar nav item.
//
// This component gives every other page that same glow ambience back —
// pure CSS radial gradients + a slow opacity pulse, no WebGL, no canvas,
// no per-frame JS. It's effectively free performance-wise, so it can sit
// behind literally every page without reintroducing the problem the
// SentinelBackground gating fixed.
export default function AmbientGlow() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute -top-24 -left-24 w-[36rem] h-[36rem] rounded-full opacity-[0.10] blur-[110px] animate-glow-drift-a"
        style={{ background: 'radial-gradient(circle, #00FFA3 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] rounded-full opacity-[0.08] blur-[120px] animate-glow-drift-b"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-32 left-1/4 w-[30rem] h-[30rem] rounded-full opacity-[0.06] blur-[110px] animate-glow-drift-c"
        style={{ background: 'radial-gradient(circle, #FFC65C 0%, transparent 70%)' }}
      />
    </div>
  )
}