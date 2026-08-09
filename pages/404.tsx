// Teen-Hub/pages/404.tsx
import Link from 'next/link'
import Head from 'next/head'

export default function NotFound() {
  return (
    <>
      <Head><title>404 — QuestHub Guild</title></Head>
      <div className="min-h-screen bg-[#03060A] grid-bg flex items-center justify-center px-4">
        <div className="text-center">
          <div className="font-cinzel font-black text-8xl sm:text-9xl text-portal-emerald/20 mb-2 select-none">
            404
          </div>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-portal-emerald to-transparent mx-auto mb-6" />
          <h1 className="font-cinzel font-black text-xl sm:text-2xl text-white mb-3">
            SECTOR NOT FOUND
          </h1>
          <p className="font-cormorant text-slate-500 mb-10 max-w-sm mx-auto">
            This location does not exist in the guild network. You may have taken a wrong turn, operative.
          </p>
          <Link
            href="/"
            className="font-cinzel text-xs text-portal-emerald border border-portal-emerald/50 px-8 py-3 hover:border-portal-emerald hover:text-white hover:shadow-[0_0_20px_rgba(0,255,163,0.3)] transition-all duration-300 tracking-widest uppercase"
          >
            ← Return to Base
          </Link>
        </div>
      </div>
    </>
  )
}