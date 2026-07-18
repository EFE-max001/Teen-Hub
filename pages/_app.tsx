import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import dynamic from 'next/dynamic'
import AppLoadingGate from '@/components/ui/AppLoadingGate'

const SentinelBackground = dynamic(() => import('@/components/ui/SentinelBackground'), { ssr: false })

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      {/* SentinelBackground mounts (and starts loading the portal + butterfly
          models) immediately, same as before. AppLoadingGate just decides
          when the page is allowed to become visible — on "/" that's "once
          the models are ready", everywhere else it's "immediately". */}
      <AppLoadingGate>
        <SentinelBackground />
        <Component {...pageProps} />
      </AppLoadingGate>
    </SessionProvider>
  )
}