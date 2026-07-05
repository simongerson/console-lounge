'use client'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const NO_NAV_ROUTES = ['/login', '/pos']

export default function NavWrapper({ children }) {
  const pathname = usePathname()

  const hideNav = NO_NAV_ROUTES.some(r =>
    pathname === r || pathname.startsWith(r + '/')
  )

  if (hideNav) return <>{children}</>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '220px', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}