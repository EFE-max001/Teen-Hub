// Teen-Hub/components/ui/AppLoadingGate.tsx
// components/ui/AppLoadingGate.tsx
import { ReactNode, useState } from 'react'
import { useRouter } from 'next/router'
import { AnimatePresence } from 'framer-motion'
import { useAssetsReady } from '@/hooks/useAssetsReady'
import LoadingScreen from './LoadingScreen'

// Home is the only route with the heavy hero scene (3D butterfly flock +
// starfield), so it's the only one gated behind the loader — dashboard/
// login/etc keep loading instantly the way they do today.
const GATED_ROUTES = new Set(['/'])

// This previously also played a full-screen video (PortalIntro) after the
// loader finished, once per device. Removed per request — this gate is now
// just the progress loader while 3D assets load, then a straight reveal.
// PortalIntro.tsx itself is left in the repo but is now unused dead code;
// safe to delete (see the dead-file list).
export default function AppLoadingGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const isGated = GATED_ROUTES.has(router.pathname)
  const { ready, progress } = useAssetsReady()
  const [skipped, setSkipped] = useState(false)

  const showLoader = isGated && !ready && !skipped

  return (
    <>
      <div
        style={{
          opacity: showLoader ? 0 : 1,
          transition: 'opacity 0.9s ease',
          pointerEvents: showLoader ? 'none' : 'auto',
        }}
        aria-hidden={showLoader}
      >
        {children}
      </div>
      <AnimatePresence>
        {showLoader && <LoadingScreen progress={progress} onSkip={() => setSkipped(true)} />}
      </AnimatePresence>
    </>
  )
}