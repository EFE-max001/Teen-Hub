// Teen-Hub/hooks/useDeviceCapability.ts
//
// No file anywhere in this codebase checked actual device capability before
// this — Scene.tsx's old useIsMobile() only checked screen width, so a
// narrow-but-powerful phone and a wide-but-weak budget phone got treated
// identically (and a narrow, weak phone got the same full experience as a
// desktop). This checks the signals that actually correlate with weak
// hardware/networks, per the Android "Build for Billions" playbook:
// deviceMemory, hardwareConcurrency, and the Network Information API's
// saveData/effectiveType.
//
// Fails safe: any API that doesn't exist on a given browser (Safari doesn't
// support deviceMemory or connection at all) is simply skipped rather than
// treated as a signal either way, so unsupported browsers get the full
// experience by default, not the reduced one.
import { useEffect, useState } from 'react'

export function useDeviceCapability() {
  const [isLowEnd, setIsLowEnd] = useState(() => detectLowEnd())
  const [saveData, setSaveData] = useState(() => !!(navigator as any)?.connection?.saveData)

  useEffect(() => {
    // Re-check once on mount too — some browsers (notably Chrome) only
    // populate navigator.connection reliably after the page has settled,
    // so the lazy initializer above can occasionally under-detect on the
    // very first paint. This corrects that without causing the "full flock
    // then rebuild" flash a useEffect-only approach would have.
    setIsLowEnd(detectLowEnd())
    const conn = (navigator as any).connection
    if (conn) setSaveData(!!conn.saveData)
  }, [])

  return { isLowEnd, saveData }
}

function detectLowEnd(): boolean {
  if (typeof navigator === 'undefined') return false

  // A single so-so signal (e.g. Chrome capping deviceMemory at 4, or a
  // perfectly normal 4-core/4-thread laptop CPU) used to be enough to flag
  // a machine as "low-end" on its own. That's why real desktops were
  // landing in the reduced flock. Now: memory and cores both have to look
  // weak — not just below a mid-range bar — before we call it low-end.
  // Slow network is still judged on its own, since a fast machine on a
  // bad connection genuinely benefits from the lighter flock.
  const memory = (navigator as any).deviceMemory as number | undefined
  const cores = navigator.hardwareConcurrency
  const memoryWeak = typeof memory === 'number' && memory <= 2
  const coresWeak = typeof cores === 'number' && cores <= 2
  const hardwareWeak = memoryWeak && coresWeak

  const conn = (navigator as any).connection
  const networkWeak = !!conn && ['slow-2g', '2g', '3g'].includes(conn.effectiveType)

  return hardwareWeak || networkWeak
}