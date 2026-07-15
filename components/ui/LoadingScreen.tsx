// components/ui/LoadingScreen.tsx
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const FLAVOR_LINES = [
  'Calibrating neural core...',
  'Summoning the butterfly swarm...',
  'Charging the energy grid...',
  'Compiling guild protocols...',
  'Waking the sentinel...',
  'Syncing rank data...',
]

export default function LoadingScreen({ progress }: { progress: number }) {
  const [lineIndex, setLineIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setLineIndex(i => (i + 1) % FLAVOR_LINES.length)
    }, 1400)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: '#020008' }}
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
            'radial-gradient(circle, rgba(157,77,255,0.25) 0%, rgba(157,77,255,0.08) 45%, transparent 70%)',
          filter: 'blur(10px)',
        }}
      />

      <div className="relative flex flex-col items-center gap-8 px-6">
        {/* rotating diamond rings — the guild mark, spinning up like a
            console splash rather than a generic spinner */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 border border-[#9D4DFF]/40 rounded-lg"
            style={{ borderRadius: '30%' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-3 border border-[#C670FF]/60 rounded-lg"
            style={{ borderRadius: '30%' }}
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="w-6 h-6 bg-gradient-to-br from-[#C670FF] to-[#9D4DFF]"
            style={{ borderRadius: '30%' }}
            animate={{ scale: [1, 1.25, 1], boxShadow: [
              '0 0 10px rgba(198,112,255,0.6)',
              '0 0 28px rgba(198,112,255,0.95)',
              '0 0 10px rgba(198,112,255,0.6)',
            ] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <h1
            className="text-2xl tracking-[0.3em] text-white glow-text"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            QUESTHUB
          </h1>
          <p className="text-xs tracking-[0.4em] text-[#9D4DFF]">GUILD NETWORK</p>
        </div>

        {/* progress bar */}
        <div className="w-64 flex flex-col gap-2">
          <div className="h-[3px] w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#7c3aed] to-[#C670FF]"
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
      </div>
    </motion.div>
  )
}