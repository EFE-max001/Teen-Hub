// Teen-Hub/components/ui/LoadingScreen.tsx
// components/ui/LoadingScreen.tsx
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Ordered so each line roughly matches how far along a real load usually
// is at that point, rather than cycling on a blind timer unrelated to
// actual progress — "Waking the sentinel" now reliably shows near the end
// instead of possibly firing at 10%.
const FLAVOR_LINES = [
  'Calibrating neural core...',
  'Summoning the butterfly swarm...',
  'Charging the energy grid...',
  'Compiling guild protocols...',
  'Syncing rank data...',
  'Waking the sentinel...',
]

const MOTE_COLORS = ['#00E5FF', '#8B5CF6', '#FFC65C', '#00FFA3']

// If a load genuinely stalls (slow connection, an asset that never fires
// its progress event) the old version just sat there forever with no way
// out. This surfaces a way forward instead of trapping the visitor.
const STALL_MS = 8000

export default function LoadingScreen({ progress, onSkip }: { progress: number; onSkip?: () => void }) {
  const lineIndex = Math.min(FLAVOR_LINES.length - 1, Math.floor((progress / 100) * FLAVOR_LINES.length))
  const [stalled, setStalled] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setStalled(true), STALL_MS)
    return () => clearTimeout(id)
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: '#03060A' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: 'easeInOut' }}
    >
      {/* faint moving grid, same texture as the site background so the
          transition into the real scene doesn't pop */}
      <div
        className="absolute inset-0 grid-bg"
        style={{ maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 75%)' }}
      />

      {/* soft ambient glow behind the mark */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(0,229,255,0.22) 0%, rgba(139,92,246,0.1) 45%, transparent 70%)',
          filter: 'blur(10px)',
        }}
      />

      {/* ambient drifting motes — carries the same particle language into
          the portal intro (and page-transition bursts) that follow this
          screen, so the loader doesn't feel like a separate, plainer moment */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 16 }).map((_, i) => {
          const left = 6 + ((i * 6.3) % 88)
          const delay = (i % 8) * 0.35
          const color = MOTE_COLORS[i % MOTE_COLORS.length]
          return (
            <motion.span
              key={i}
              className="absolute bottom-0 rounded-full"
              style={{ left: `${left}%`, width: 2.5, height: 2.5, background: color, boxShadow: `0 0 6px ${color}` }}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: -520, opacity: [0, 0.7, 0] }}
              transition={{ duration: 5.5, delay, repeat: Infinity, ease: 'linear' }}
            />
          )
        })}
      </div>

      <div className="relative flex flex-col items-center gap-8 px-6">
        {/* rotating diamond rings — the guild mark, spinning up like a
            console splash rather than a generic spinner */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 border border-[#00E5FF]/40 rounded-lg"
            style={{ borderRadius: '30%' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-3 border border-[#8B5CF6]/60 rounded-lg"
            style={{ borderRadius: '30%' }}
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="w-6 h-6 bg-gradient-to-br from-[#8B5CF6] to-[#00E5FF]"
            style={{ borderRadius: '30%' }}
            animate={{ scale: [1, 1.25, 1], boxShadow: [
              '0 0 10px rgba(139,92,246,0.6)',
              '0 0 28px rgba(139,92,246,0.95)',
              '0 0 10px rgba(139,92,246,0.6)',
            ] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <h1
            className="text-2xl tracking-[0.3em] text-white glow-text font-cinzel"
          >
            QUESTHUB
          </h1>
          <p className="text-xs tracking-[0.4em] text-[#00E5FF]">GUILD NETWORK</p>
        </div>

        {/* progress bar */}
        <div className="w-64 flex flex-col gap-2">
          <div className="h-[3px] w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#00E5FF] via-[#8B5CF6] to-[#FFC65C]"
              animate={{ width: `${Math.max(4, progress)}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/50 tracking-wider">
            <AnimatePresence mode="wait">
              <motion.span
                key={lineIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
              >
                {FLAVOR_LINES[lineIndex]}
              </motion.span>
            </AnimatePresence>
            <span>{progress}%</span>
          </div>
        </div>

        {/* stall fallback — only appears if loading genuinely takes a
            while, so nobody gets stuck on a screen with no way through */}
        <AnimatePresence>
          {stalled && onSkip && (
            <motion.button
              onClick={onSkip}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-1 text-[11px] tracking-wider text-white/40 hover:text-[#FFC65C] underline underline-offset-4 transition-colors"
            >
              Taking longer than usual — continue anyway
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}