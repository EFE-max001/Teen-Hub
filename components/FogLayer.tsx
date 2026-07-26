// components/FogLayer.tsx
//
// Layer One of the Living Digital Forest background: slow-moving
// atmospheric fog. Pure CSS — no canvas, no animation loop — four large,
// heavily blurred radial gradients drifting on independent, slow,
// non-repeating-looking keyframe cycles. This is the "85% CSS" part of
// the redesign brief's performance budget: it costs nothing at runtime
// beyond GPU compositing, unlike a particle system or 3D geometry.
export default function FogLayer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="qh-fog-blob qh-fog-blob-a" />
      <div className="qh-fog-blob qh-fog-blob-b" />
      <div className="qh-fog-blob qh-fog-blob-c" />
      <div className="qh-fog-blob qh-fog-blob-d" />
      <style>{`
        .qh-fog-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
          will-change: transform;
        }
        .qh-fog-blob-a {
          width: 60vw;
          height: 60vw;
          left: -10%;
          top: 10%;
          background: radial-gradient(circle, rgba(0, 255, 163, 0.18), transparent 70%);
          animation: qhDriftA 46s ease-in-out infinite;
        }
        .qh-fog-blob-b {
          width: 50vw;
          height: 50vw;
          right: -12%;
          top: 30%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.16), transparent 70%);
          animation: qhDriftB 58s ease-in-out infinite;
        }
        .qh-fog-blob-c {
          width: 45vw;
          height: 45vw;
          left: 20%;
          bottom: -15%;
          background: radial-gradient(circle, rgba(255, 198, 92, 0.12), transparent 70%);
          animation: qhDriftC 64s ease-in-out infinite;
        }
        .qh-fog-blob-d {
          width: 38vw;
          height: 38vw;
          right: 15%;
          bottom: -10%;
          background: radial-gradient(circle, rgba(0, 229, 255, 0.14), transparent 70%);
          animation: qhDriftD 52s ease-in-out infinite;
        }
        @keyframes qhDriftA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(6%, 4%) scale(1.08); }
          66% { transform: translate(-4%, 7%) scale(0.96); }
        }
        @keyframes qhDriftB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-7%, 5%) scale(1.05); }
          75% { transform: translate(3%, -6%) scale(0.94); }
        }
        @keyframes qhDriftC {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(5%, -5%) scale(1.1); }
        }
        @keyframes qhDriftD {
          0%, 100% { transform: translate(0, 0) scale(1); }
          45% { transform: translate(-5%, -4%) scale(1.06); }
        }
        @media (prefers-reduced-motion: reduce) {
          .qh-fog-blob { animation: none; }
        }
      `}</style>
    </div>
  )
}