// components/ui/AppLoadingGate.tsx
import { ReactNode } from 'react'
import { useRouter } from 'next/router'
import { AnimatePresence } from 'framer-motion'
import { useAssetsReady } from '@/hooks/useAssetsReady'
import LoadingScreen from './LoadingScreen'

// Home is the only route with the heavy hero scene (portal + butterfly
// flock), so it's the only one gated behind the loader — dashboard/login/etc
// keep loading instantly the way they do today, the 3D background just
// fades in quietly behind them like it already does.
const GATED_ROUTES = new Set(['/'])

export default function AppLoadingGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const isGated = GATED_ROUTES.has(router.pathname)
  const { ready, progress } = useAssetsReady()
  const showLoader = isGated && !ready

  return (
    <>
      <div
        style={{
          opacity: showLoader ? 0 : 1,
          transition: 'opacity 0.9s ease',
          // keep it non-interactive (and out of tab order) until revealed,
          // rather than just visually hidden
          pointerEvents: showLoader ? 'none' : 'auto',
        }}
        aria-hidden={showLoader}
      >
        {children}
      </div>
      <AnimatePresence>{showLoader && <LoadingScreen progress={progress} />}</AnimatePresence>
    </>
  )
}