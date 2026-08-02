// Teen-Hub/components/ui/PortalIntro.tsx
// components/ui/PortalIntro.tsx
//
// The "better portal introduction" from the redesign brief: black →
// particles → butterfly → seed → portal forms → camera moves → homepage,
// played once (see the localStorage flag in AppLoadingGate) as QuestHub's
// signature arrival moment. Runs after the real scene's assets are already
// ready — this sits on top of it as an opaque overlay and fades out at the
// end to reveal the actual (already-loaded) homepage underneath, so there's
// no additional wait beyond the sequence itself.
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type Phase = 'black' | 'particles' | 'butterfly' | 'seed' | 'portal' | 'reveal'

// Weighted so the total lands close to the brief's "2 seconds" while still
// giving each beat (particles → butterfly → seed → portal) room to read.
const PHASE_DURATIONS: Record<Phase, number> = {
  black: 200,
  particles: 350,
  butterfly: 450,
  seed: 350,
  portal: 900,
  reveal: 550,
}

const PHASE_ORDER: Phase[] = ['black', 'particles', 'butterfly', 'seed', 'portal', 'reveal']

export default function PortalIntro({ onDone }: { onDone: () => void }) {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const phase = PHASE_ORDER[phaseIndex]

  useEffect(() => {
    if (phaseIndex >= PHASE_ORDER.length - 1) {
      const id = setTimeout(onDone, PHASE_DURATIONS.reveal)
      return () => clearTimeout(id)
    }
    const id = setTimeout(() => setPhaseIndex(i => i + 1), PHASE_DURATIONS[phase])
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIndex])

  const showParticles = phase !== 'black'
  const showButterfly = phase === 'butterfly' || phase === 'seed' || phase === 'portal' || phase === 'reveal'
  const showSeed = phase === 'seed' || phase === 'portal' || phase === 'reveal'
  const showPortal = phase === 'portal' || phase === 'reveal'
  const revealing = phase === 'reveal'

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#03060A]"
      initial={{ opacity: 1 }}
      animate={{ opacity: revealing ? 0 : 1 }}
      transition={{ duration: revealing ? 0.55 : 0.3, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      {/* Ambient particles drifting up — the "particles gather" beat */}
      {showParticles && (
        <div className="absolute inset-0">
          {Array.from({ length: 18 }).map((_, i) => {
            const left = 8 + ((i * 5.1) % 84)
            const delay = (i % 6) * 0.09
            const color = ['#00FFA3', '#00E5FF', '#FFC65C', '#8B5CF6', '#D9EDE6'][i % 5]
            return (
              <motion.span
                key={i}
                className="absolute bottom-0 rounded-full"
                style={{ left: `${left}%`, width: 3, height: 3, background: color, boxShadow: `0 0 6px ${color}` }}
                initial={{ y: 0, opacity: 0 }}
                animate={{ y: -420, opacity: [0, 0.9, 0] }}
                transition={{ duration: 2.6, delay, repeat: Infinity, ease: 'easeOut' }}
              />
            )
          })}
        </div>
      )}

      {/* Camera-move stand-in: the whole formation drifts inward/upward
          slightly and settles as the portal completes, echoing "camera
          moves" without needing an actual 3D camera for this overlay. */}
      <motion.div
        className="relative flex flex-col items-center justify-center"
        animate={{ scale: showPortal ? 1 : 0.92, y: showPortal ? 0 : 10 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Butterfly — "one lands" per the brief's butterfly behavior notes */}
        {showButterfly && (
          <motion.div
            className="absolute text-2xl"
            initial={{ opacity: 0, x: -60, y: -30, rotate: -20 }}
            animate={{ opacity: showSeed ? 0.85 : 1, x: 0, y: showSeed ? -70 : -20, rotate: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,163,0.6))' }}
          >
            🦋
          </motion.div>
        )}

        {/* Seed — a small glowing core the portal forms around */}
        {showSeed && (
          <motion.div
            className="rounded-full"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: showPortal ? 1.3 : 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              width: 10,
              height: 10,
              background: '#FFC65C',
              boxShadow: '0 0 18px 6px rgba(255,198,92,0.7)',
            }}
          />
        )}

        {/* Portal — the actual generated "portal materializes" footage,
            circle-masked and sped up so its formation reads clearly in
            the ~1s this phase has, rather than the hand-drawn SVG ring
            this replaced. */}
        {showPortal && (
          <div
            className="absolute rounded-full overflow-hidden"
            style={{ width: 240, height: 240, boxShadow: '0 0 40px 12px rgba(0,229,255,0.35)' }}
          >
            <video
              className="w-full h-full object-cover"
              src="/videos/portal-materializes.mp4"
              poster="/videos/portal-materializes-poster.jpg"
              autoPlay
              muted
              playsInline
              ref={el => {
                if (el) el.playbackRate = 2.2
              }}
            />
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}