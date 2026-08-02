// Teen-Hub/pages/_app.tsx
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import dynamic from 'next/dynamic'
import AppLoadingGate from '@/components/ui/AppLoadingGate'
import PageTransitionParticles from '@/components/ui/PageTransitionParticles'

const SentinelBackground = dynamic(() => import('@/components/ui/SentinelBackground'), { ssr: false })

// Only the landing page ("/") has the heavy hero scene (portal + butterfly
// flock + particle network). It used to mount unconditionally in every
// route via this file, which meant the WebGL render loop and ~1.4MB of
// glb models kept running underneath the dashboard, login, and every
// other page — competing with React for the main thread and making
// buttons/nav links feel sluggish everywhere, not just on "/". Gating the
// mount itself (not just its visibility, which AppLoadingGate already
// did) fixes that: the scene now only exists on the one route that shows it.
const SENTINEL_ROUTES = new Set(['/'])

// "Don't switch pages, grow them" — per the brief. AnimatePresence keyed by
// pathname holds the outgoing page on-screen just long enough to play its
// exit animation before the new one enters, so navigation reads as one page
// dissolving into the next rather than an instant hard cut. Kept deliberately
// cheap (opacity/scale/blur, no 3D) so it can't reintroduce the per-route
// perf cost the SentinelBackground fix above just removed.
const pageVariants = {
  initial: { opacity: 0, scale: 0.985, filter: 'blur(6px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 1.01, filter: 'blur(4px)', transition: { duration: 0.25, ease: 'easeIn' } },
}

function usePageTransitionBurst() {
  const router = useRouter()
  const [burst, setBurst] = useState<number | null>(null)

  useEffect(() => {
    const onStart = (url: string) => {
      const nextPath = url.split('?')[0].split('#')[0]
      if (nextPath === router.pathname) return
      setBurst(Date.now())
    }
    router.events.on('routeChangeStart', onStart)
    return () => router.events.off('routeChangeStart', onStart)
  }, [router])

  useEffect(() => {
    if (burst === null) return
    const id = setTimeout(() => setBurst(null), 800)
    return () => clearTimeout(id)
  }, [burst])

  return burst
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter()
  const showSentinel = SENTINEL_ROUTES.has(router.pathname)
  const burst = usePageTransitionBurst()
  const reducedMotion = useReducedMotion()

  return (
    <SessionProvider session={session}>
      <AppLoadingGate>
        {showSentinel && <SentinelBackground />}
        {burst !== null && !reducedMotion && <PageTransitionParticles key={burst} />}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={router.pathname}
            initial={reducedMotion ? undefined : 'initial'}
            animate={reducedMotion ? undefined : 'animate'}
            exit={reducedMotion ? undefined : 'exit'}
            variants={pageVariants}
          >
            <Component {...pageProps} />
          </motion.div>
        </AnimatePresence>
      </AppLoadingGate>
    </SessionProvider>
  )
}