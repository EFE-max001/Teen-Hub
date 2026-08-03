// Teen-Hub/components/ui/PortalIntro.tsx
// components/ui/PortalIntro.tsx
//
// QuestHub's arrival moment: after AppLoadingGate finishes loading assets,
// this plays two videos back-to-back, full-screen and full-opacity —
// portal-materializes.mp4, then glowing-portal-forest.mp4 — then fades out
// to reveal the (already-loaded) homepage underneath. Shown once per
// device (see the localStorage flag in AppLoadingGate).
//
// This is deliberately just the videos, foreground and full-strength — no
// particle/butterfly/portal CSS choreography layered on or under them.
import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Clip = { src: string }

const CLIPS: Clip[] = [
  { src: '/videos/portal-materializes.mp4' },
  { src: '/videos/glowing-portal-forest.mp4' },
]

export default function PortalIntro({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0)
  const [revealing, setRevealing] = useState(false)
  // guards against both the "last clip ends" path and the skip button
  // firing the reveal twice
  const revealStarted = useRef(false)

  function handleEnded() {
    if (index < CLIPS.length - 1) {
      setIndex(i => i + 1)
    } else {
      startReveal()
    }
  }

  function startReveal() {
    if (revealStarted.current) return
    revealStarted.current = true
    setRevealing(true)
    // matches the container's fade-out transition below
    setTimeout(onDone, 550)
  }

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black"
      initial={{ opacity: 1 }}
      animate={{ opacity: revealing ? 0 : 1 }}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
    >
      <AnimatePresence mode="wait">
        <motion.video
          key={CLIPS[index].src}
          className="absolute inset-0 w-full h-full object-cover"
          src={CLIPS[index].src}
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={handleEnded}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />
      </AnimatePresence>

      {/* Skip — two 10s clips back-to-back is a real wait on a first visit;
          this lets an impatient visitor straight through instead of
          forcing the full ~20s every time. */}
      {!revealing && (
        <motion.button
          onClick={startReveal}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="absolute bottom-6 right-6 z-10 text-[11px] tracking-wider text-white/50 hover:text-[#00E5FF] underline underline-offset-4 transition-colors"
        >
          Skip intro
        </motion.button>
      )}
    </motion.div>
  )
}