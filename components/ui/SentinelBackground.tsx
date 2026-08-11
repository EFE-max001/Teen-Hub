// Teen-Hub/components/ui/SentinelBackground.tsx
import { Component, useEffect, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { useUserProgress } from '@/hooks/useUserProgress'

const LivingBackground = dynamic(() => import('../LivingBackground'), { ssr: false })

// A CSS-only stand-in for the 3D scene — used when WebGL is unavailable or
// the browser refuses to create a context. It keeps the living-forest mood
// without exposing an implementation detail to first-time visitors.
function StaticFallbackBackground() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse 55% 45% at 18% 12%, rgba(0,255,163,0.14), transparent 68%), radial-gradient(ellipse 60% 50% at 88% 74%, rgba(139,92,246,0.14), transparent 70%), radial-gradient(ellipse 45% 38% at 50% 48%, rgba(255,198,92,0.07), transparent 72%), #040A08',
      }}
    />
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
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null)
  const [permanentlyFailed, setPermanentlyFailed] = useState(false)
  const progress = useUserProgress()

  useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)

    // Do a cheap capability check before mounting React Three Fiber. Some
    // mobile browsers and sandboxed previews report WebGL support but still
    // refuse the actual context; the error boundary below covers that case.
    let supported = false
    try {
      const canvas = document.createElement('canvas')
      supported = Boolean(
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
      )
    } catch {
      supported = false
    }
    setWebglAvailable(supported)

    return () => mq.removeEventListener('change', handler)
  }, [])

  const handleFail = (message: string, stack?: string) => {
    // Keep the error available in logs for diagnosis, but never make it part
    // of the visitor experience. A single failed mount should fall back.
    console.error('[SentinelBackground] Falling back from 3D scene:', message, stack)
    setPermanentlyFailed(true)
  }

  if (!mounted || webglAvailable === null) return null

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
      {!webglAvailable || permanentlyFailed ? (
        <StaticFallbackBackground />
      ) : (
        <WebGLErrorBoundary onFail={handleFail}>
          <LivingBackground reducedMotion={reducedMotion} progress={progress} />
        </WebGLErrorBoundary>
      )}
    </div>
  )
}