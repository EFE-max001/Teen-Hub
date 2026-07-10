import Navbar from './Navbar'
import Footer from './Footer'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  showFooter?: boolean
}

export default function Layout({ children, showFooter = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  )
}