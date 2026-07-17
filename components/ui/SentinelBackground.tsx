import { Component, useEffect, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'

const Scene = dynamic(() => import('../Scene'), { ssr: false })

// A CSS-only stand-in for the 3D scene — used if WebGL genuinely can't
// initialize in this browser/tab, so the page still looks intentional
// instead of going blank.
function StaticFallbackBackground() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(circle at 30% 20%, rgba(157,77,255,0.25), transparent 60%), radial-gradient(circle at 80% 70%, rgba(198,112,255,0.18), transparent 55%), #050510',
      }}
    />
  )
}

// TEMPORARY DEBUG OVERLAY — prints the actual mount error on-screen so we
// don't need devtools open to read it. Remove once the Sentinel scene is
// confirmed stable.
function DebugErrorOverlay({ message, stack }: { message: string; stack?: string }) {
  return (
    <div
      className="absolute top-4 left-4 right-4 max-h-[60vh] overflow-auto rounded-md border border-red-500/50 bg-black/90 p-3 text-xs text-red-300 font-mono whitespace-pre-wrap pointer-events-auto"
      style={{ zIndex: 9999 }}
    >
      <div className="text-red-400 font-bold mb-1">
        [SentinelBackground] Scene failed to mount:
      </div>
      <div>{message}</div>
      {stack && <div className="mt-2 text-red-300/70">{stack}</div>}
    </div>
  )
}

class WebGLErrorBoundary extends Component<
  { children: ReactNode; onFail: (message: string, stack?: string) => void },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error) {
    // WebGL context failures used to disappear silently here — log it so
    // it's actually diagnosable from the browser console next time.
    console.error('[SentinelBackground] 3D scene failed to mount:', error)
    this.props.onFail(error?.message ?? String(error), error?.stack)
  }
  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

export default function SentinelBackground() {
  const [mounted, setMounted] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  // bumping this remounts <Scene>, since WebGL context failures are
  // frequently transient (GPU process hiccup, tab was backgrounded, browser
  // was momentarily over its context budget) and often succeed on a retry
  const [attempt, setAttempt] = useState(0)
  const [permanentlyFailed, setPermanentlyFailed] = useState(false)
  const [lastError, setLastError] = useState<{ message: string; stack?: string } | null>(null)

  useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const handleFail = (message: string, stack?: string) => {
    setLastError({ message, stack })
    if (attempt < 1) {
      const id = setTimeout(() => setAttempt(a => a + 1), 1500)
      return () => clearTimeout(id)
    }
    setPermanentlyFailed(true)
  }

  if (!mounted) return null

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
      {permanentlyFailed ? (
        <>
          <StaticFallbackBackground />
          {lastError && <DebugErrorOverlay message={lastError.message} stack={lastError.stack} />}
        </>
      ) : (
        <WebGLErrorBoundary key={attempt} onFail={handleFail}>
          <Scene reducedMotion={reducedMotion} />
        </WebGLErrorBoundary>
      )}
    </div>
  )
}