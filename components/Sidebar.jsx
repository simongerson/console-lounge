'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const NAV = [
  {
    group: 'TODAY',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'grid' },
      { label: 'Reports',   path: '/reports',   icon: 'chart' },
    ]
  },
  {
    group: 'OPERATIONS',
    items: [
      { label: 'Shifts',     path: '/shifts',     icon: 'clock' },
      { label: 'Monitoring', path: '/monitoring', icon: 'monitor' },
      { label: 'Consoles',   path: '/consoles',   icon: 'device' },
      { label: 'Games',      path: '/rates',      icon: 'gamepad' },
      { label: 'Products',   path: '/products',   icon: 'box' },
    ]
  },
  {
    group: 'PEOPLE',
    items: [
      { label: 'Staff', path: '/staff', icon: 'user' },
    ]
  },
  {
    group: 'FINANCE',
    items: [
      { label: 'Cash Outs', path: '/cashouts', icon: 'wallet',  badge: true },
      { label: 'Debts',     path: '/debts',    icon: 'shield' },
      { label: 'Expenses',  path: '/expenses', icon: 'plus' },
      { label: 'Income',    path: '/income',   icon: 'trending' },
    ]
  },
]

const BOTTOM = [
  { label: 'Help & Guides', path: '/help',     icon: 'help' },
  { label: 'Settings',      path: '/settings', icon: 'settings' },
]

function Icon({ name, size = 16 }) {
  const s = { width: size, height: size, flexShrink: 0 }
  const icons = {
    grid: <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>,
    chart: <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>,
    clock: <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    monitor: <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"/></svg>,
    device: <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 10h2v2H7v2H5v-2H3v-2h2V8h2v2zm11.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-3 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM17 5H7C4.24 5 2 7.24 2 10v4c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5v-4c0-2.76-2.24-5-5-5z"/></svg>,
    gamepad: <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z"/></svg>,
    box: <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg>,
    user: <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>,
    wallet: <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"/></svg>,
    shield: <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>,
    plus: <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>,
    trending: <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>,
    help: <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/></svg>,
    settings: <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    signout: <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>,
  }
  return icons[name] || null
}

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [pendingCashouts] = useState(2) // will wire to API later
  const [today, setToday] = useState('')

  useEffect(() => {
    setToday(new Date().toLocaleDateString('en-KE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }))
  }, [])

  function isActive(path) {
    if (path === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(path)
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0,
      width: '220px', height: '100vh',
      background: '#0f0f0f',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      zIndex: 30, overflowY: 'auto',
    }}>

      {/* Logo + date */}
      <div style={{
        padding: '16px 16px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
              <path d="M7 10h2v2H7v2H5v-2H3v-2h2V8h2v2zm11.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-3 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM17 5H7C4.24 5 2 7.24 2 10v4c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5v-4c0-2.76-2.24-5-5-5z"/>
            </svg>
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>
            Console Lounge
          </span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>
          {today}
        </p>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
        {NAV.map(group => (
          <div key={group.group} style={{ marginBottom: '4px' }}>
            <p style={{
              color: 'rgba(255,255,255,0.25)', fontSize: '10px',
              fontWeight: 600, letterSpacing: '1px',
              padding: '10px 8px 4px', margin: 0,
            }}>
              {group.group}
            </p>
            {group.items.map(item => {
              const active = isActive(item.path)
              return (
                <button key={item.path}
                  onClick={() => router.push(item.path)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: '9px', padding: '8px 10px', borderRadius: '8px',
                    border: 'none', cursor: 'pointer', marginBottom: '1px',
                    background: active ? 'rgba(13,148,136,0.12)' : 'transparent',
                    color: active ? '#0d9488' : 'rgba(255,255,255,0.55)',
                    fontSize: '13px', fontWeight: active ? 600 : 400,
                    textAlign: 'left', transition: 'all 0.15s',
                    position: 'relative',
                  }}
                  onMouseOver={e => {
                    if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    if (!active) e.currentTarget.style.color = '#fff'
                  }}
                  onMouseOut={e => {
                    if (!active) e.currentTarget.style.background = 'transparent'
                    if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
                  }}
                >
                  <Icon name={item.icon} size={15} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {/* Badge for pending cashouts */}
                  {item.badge && pendingCashouts > 0 && (
                    <span style={{
                      background: '#0d9488', color: '#fff',
                      fontSize: '10px', fontWeight: 700,
                      padding: '1px 6px', borderRadius: '20px',
                      minWidth: '18px', textAlign: 'center',
                    }}>
                      {pendingCashouts}
                    </span>
                  )}
                  {/* Active indicator */}
                  {active && (
                    <div style={{
                      position: 'absolute', right: 0, top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px', height: '16px',
                      background: '#0d9488', borderRadius: '2px',
                    }} />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom links */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '8px 8px', flexShrink: 0,
      }}>
        {BOTTOM.map(item => (
          <button key={item.path}
            onClick={() => router.push(item.path)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: '9px', padding: '7px 10px', borderRadius: '8px',
              border: 'none', cursor: 'pointer', marginBottom: '1px',
              background: 'transparent',
              color: 'rgba(255,255,255,0.35)',
              fontSize: '12px', textAlign: 'left',
            }}
            onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent' }}
          >
            <Icon name={item.icon} size={14} />
            {item.label}
          </button>
        ))}

        {/* Sign out */}
        <button onClick={signOut} style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: '9px', padding: '7px 10px', borderRadius: '8px',
          border: 'none', cursor: 'pointer',
          background: 'transparent',
          color: 'rgba(255,255,255,0.35)',
          fontSize: '12px', textAlign: 'left',
        }}
          onMouseOver={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
          onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent' }}
        >
          <Icon name="signout" size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}