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
  let lowEnd = false

  const memory = (navigator as any).deviceMemory as number | undefined
  if (typeof memory === 'number' && memory <= 4) lowEnd = true

  const cores = navigator.hardwareConcurrency
  if (typeof cores === 'number' && cores <= 4) lowEnd = true

  const conn = (navigator as any).connection
  if (conn && ['slow-2g', '2g', '3g'].includes(conn.effectiveType)) lowEnd = true

  return lowEnd
}