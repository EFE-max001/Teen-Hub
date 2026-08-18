// Teen-Hub/components/ui/AppLoadingGate.tsx
// The landing page no longer waits on a WebGL flock or video intro. Keeping
// the gate as a transparent composition layer means the first visit always
// reveals the actual page immediately, including on low-power mobile browsers.
import { ReactNode } from 'react'

export default function AppLoadingGate({ children }: { children: ReactNode }) {
  return <>{children}</>
}