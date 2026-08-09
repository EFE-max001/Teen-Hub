// Teen-Hub/pages/_error.tsx
import { NextPageContext } from 'next'
import Link from 'next/link'

interface ErrorProps {
  statusCode?: number
}

export default function ErrorPage({ statusCode }: ErrorProps) {
  return (
    <div className="min-h-screen bg-[#03060A] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="font-cinzel font-black text-6xl text-portal-emerald/40 mb-4">
          {statusCode || '???'}
        </div>
        <h1 className="font-cinzel font-black text-2xl text-white mb-3">
          {statusCode === 404 ? 'PAGE NOT FOUND' : 'SYSTEM ERROR'}
        </h1>
        <p className="font-cormorant text-slate-500 mb-8">
          {statusCode === 404
            ? 'This sector does not exist in the guild network.'
            : 'An unexpected error occurred in the system.'}
        </p>
        <Link
          href="/"
          className="font-cinzel text-xs text-portal-emerald border border-portal-emerald/40 px-6 py-3 hover:border-portal-emerald hover:text-portal-emerald transition-all duration-200 tracking-widest uppercase"
        >
          Return to Base
        </Link>
      </div>
    </div>
  )
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}