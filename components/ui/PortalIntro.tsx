// Teen-Hub/components/ui/PortalIntro.tsx
// components/ui/PortalIntro.tsx
//
// QuestHub's arrival moment: after AppLoadingGate finishes loading assets,
// this plays one full-screen, full-opacity video — portal-materializes.mp4
// — then fades out to reveal the (already-loaded) homepage underneath.
// Shown once per device (see the localStorage flag in AppLoadingGate).
//
// Used to chain a second clip (glowing-portal-forest.mp4) after this one,
// making every first visit sit through ~20s of video. Cut back to just the
// one clip.
//
// This is deliberately just the video, foreground and full-strength — no
// particle/butterfly/portal CSS choreography layered on or under it.
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

const CLIP_SRC = '/videos/portal-materializes.mp4'

export default function PortalIntro({ onDone }: { onDone: () => void }) {
  const [revealing, setRevealing] = useState(false)
  // guards against both "clip ends" and the skip button firing the reveal twice
  const revealStarted = useRef(false)

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
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={CLIP_SRC}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={startReveal}
      />

      {/* Skip — lets an impatient visitor straight through instead of
          forcing the full clip every time. */}
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