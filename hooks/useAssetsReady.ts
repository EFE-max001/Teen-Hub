// hooks/useAssetsReady.ts
import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'

// Drives the game-style loading screen. `useProgress` reads three.js's
// global LoadingManager, so it sees every useGLTF() load in the app (robot,
// butterflies) without needing to wire each one up manually.
//
// Two gotchas this works around:
//  - the manager can report "done" for an instant at t=0, before any load
//    has actually been queued yet — so we only trust "done" once we've
//    actually observed a load in progress (`startedRef`).
//  - a real download always takes at least a beat; `minMs` keeps the screen
//    up long enough to read as intentional rather than a flicker, and
//    `maxMs` is a hard ceiling so a stalled/failed asset can never leave the
//    user stuck behind the loader forever.
export function useAssetsReady(minMs = 1200, maxMs = 9000) {
  const { active, progress, total } = useProgress()
  const [ready, setReady] = useState(false)
  const startedRef = useRef(false)
  const mountedAtRef = useRef<number>(Date.now())

  if (active || total > 0) startedRef.current = true

  useEffect(() => {
    if (ready) return
    const elapsed = Date.now() - mountedAtRef.current
    const finishedLoading = startedRef.current && !active && progress >= 100
    const timedOut = elapsed > maxMs

    if (timedOut) {
      setReady(true)
      return
    }
    if (finishedLoading) {
      const wait = Math.max(0, minMs - elapsed)
      const id = setTimeout(() => setReady(true), wait)
      return () => clearTimeout(id)
    }
  }, [active, progress, ready, minMs, maxMs])

  return { ready, progress: Math.min(100, Math.round(progress)) }
}