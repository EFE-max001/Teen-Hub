// Teen-Hub/components/ui/AppLoadingGate.tsx
// components/ui/AppLoadingGate.tsx
import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { AnimatePresence } from 'framer-motion'
import { useAssetsReady } from '@/hooks/useAssetsReady'
import LoadingScreen from './LoadingScreen'
import PortalIntro from './PortalIntro'

// Home is the only route with the heavy hero scene (portal + butterfly
// flock), so it's the only one gated behind the loader — dashboard/login/etc
// keep loading instantly the way they do today, the 3D background just
// fades in quietly behind them like it already does.
const GATED_ROUTES = new Set(['/'])

// "Only first visit... it becomes QuestHub's signature." Persisted in
// localStorage (not sessionStorage) so it's genuinely a once-per-device
// moment rather than replaying every new tab/session.
const INTRO_SEEN_KEY = 'questhub_intro_seen'

// TEMP DEBUG: force the intro to play on every load while testing the new
// videos, ignoring the once-per-device flag below. Flip back to false when
// you're done — leaving this on means every visitor sees it every time.
const FORCE_INTRO_EVERY_TIME = true

export default function AppLoadingGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const isGated = GATED_ROUTES.has(router.pathname)
  const { ready, progress } = useAssetsReady()

  // null = "haven't checked localStorage yet" — treated as still-blocking
  // below so a first-time visitor can never see a flash of the homepage
  // before the intro overlay mounts.
  const [introSeen, setIntroSeen] = useState<boolean | null>(null)
  const [introDone, setIntroDone] = useState(false)
  const [skipped, setSkipped] = useState(false)

  useEffect(() => {
    if (!isGated) return
    if (FORCE_INTRO_EVERY_TIME) {
      setIntroSeen(false)
      return
    }
    try {
      setIntroSeen(window.localStorage.getItem(INTRO_SEEN_KEY) === '1')
    } catch {
      // storage unavailable (private browsing, etc.) — fail open rather
      // than blocking the page forever
      setIntroSeen(true)
    }
  }, [isGated])

  const introPending = isGated && introSeen === null
  const showIntro = isGated && ready && introSeen === false && !introDone
  const showLoader = isGated && !ready && !skipped
  const blocking = showLoader || introPending || showIntro

  function handleIntroDone() {
    if (!FORCE_INTRO_EVERY_TIME) {
      try {
        window.localStorage.setItem(INTRO_SEEN_KEY, '1')
      } catch {
        // ignore — worst case the intro plays again next visit
      }
    }
    setIntroDone(true)
  }

  return (
    <>
      <div
        style={{
          opacity: blocking ? 0 : 1,
          transition: 'opacity 0.9s ease',
          // keep it non-interactive (and out of tab order) until revealed,
          // rather than just visually hidden
          pointerEvents: blocking ? 'none' : 'auto',
        }}
        aria-hidden={blocking}
      >
        {children}
      </div>
      <AnimatePresence>
        {showLoader && <LoadingScreen progress={progress} onSkip={() => setSkipped(true)} />}
        {!showLoader && showIntro && <PortalIntro onDone={handleIntroDone} />}
      </AnimatePresence>
    </>
  )
}