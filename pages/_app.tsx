import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import SentinelBackground from '@/components/ui/SentinelBackground'

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <SentinelBackground />
      <Component {...pageProps} />
    </SessionProvider>
  )
}