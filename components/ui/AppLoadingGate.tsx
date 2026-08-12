import { ReactNode } from 'react'

// The landing page is ready to render immediately. Keeping the old full-screen
// loader/intro gate here could hide the page indefinitely when a browser or
// embedded preview cannot play video or initialize WebGL.
export default function AppLoadingGate({ children }: { children: ReactNode }) {
  return <>{children}</>
}