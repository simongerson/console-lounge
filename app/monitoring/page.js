'use client'
import { useState, useEffect, useCallback } from 'react'

export default function MonitoringPage() {
  const [consoles, setConsoles]         = useState([])
  const [scriptOnline, setScriptOnline] = useState(false)
  const [lastHb, setLastHb]             = useState(null)
  const [loading, setLoading]           = useState(true)
  const [dismissing, setDismissing]     = useState(null)

  const loadMonitoring = useCallback(async () => {
    try {
      const res  = await fetch('/api/monitoring')
      const data = await res.json()
      setConsoles(data.consoles || [])
      setScriptOnline(data.scriptOnline)
      setLastHb(data.lastHeartbeatSeconds)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { loadMonitoring() }, [loadMonitoring])
  useEffect(() => {
    const interval = setInterval(loadMonitoring, 15000)
    return () => clearInterval(interval)
  }, [loadMonitoring])

  async function dismiss(consoleId) {
    setDismissing(consoleId)
    try {
      await fetch('/api/monitoring/dismiss-ghost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consoleId }),
      })
      await loadMonitoring()
    } catch {}
    setDismissing(null)
  }

  const ghosts = consoles.filter(c => c.ghost)
  const ghostCount = ghosts.length

  function statusColor(status) {
    if (status === 'playing') return '#2d7a4f'
    if (status === 'ghost')   return '#c9a84c'
    if (status === 'idle')    return '#8a8780'
    return '#d0cdc8'
  }

  function statusLabel(status) {
    return status.toUpperCase()
  }

  const S = {
    page:  { minHeight: '100vh', background: '#f4f1eb', padding: '28px 32px' },
    card:  { background: '#fff', border: '1px solid #e8e4dc', borderRadius: '12px' },
    label: { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
             letterSpacing: '0.8px', color: '#8a8780', margin: 0 },
  }

  return (
    <div style={S.page}>

      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700,
            color: '#1a1a1a', margin: '0 0 4px' }}>Smart Monitoring</h1>
          <p style={{ fontSize: '13px', color: '#8a8780', margin: 0 }}>
            Detects PlayStation & Xbox activity on your WiFi · flags sessions that weren't logged
          </p>
        </div>
        {ghostCount > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#fff', border: '1px solid #e8c070',
            borderRadius: '20px', padding: '6px 14px',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%',
              background: '#c9a84c' }} />
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#8a6020' }}>
              {ghostCount} ghost alert{ghostCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Script status — real, based on whether ANY console has
            reported a heartbeat in the last 45 seconds. Until an actual
            monitoring agent exists and calls /api/monitoring/heartbeat,
            this will correctly show offline — that's accurate, not broken. */}
        <div style={{
          ...S.card, padding: '14px 18px',
          borderColor: scriptOnline ? '#b8dfc8' : '#e8e4dc',
          background: scriptOnline ? '#f0faf4' : '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: scriptOnline ? '#2d7a4f' : '#d0cdc8',
              boxShadow: scriptOnline ? '0 0 5px rgba(45,122,79,0.5)' : 'none',
            }} />
            <span style={{ fontSize: '14px', fontWeight: 600,
              color: scriptOnline ? '#2d7a4f' : '#8a8780' }}>
              {scriptOnline ? 'Monitoring script online' : 'No monitoring agent reporting'}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#8a8780', margin: '4px 0 0 16px' }}>
            {scriptOnline
              ? `Heartbeat · ${lastHb}s ago · updates every 15s`
              : 'Install the monitor app on your lounge PC to enable live ghost detection'}
          </p>
        </div>

        <div style={{ ...S.card, padding: '14px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600,
              color: '#1a1a1a', margin: '0 0 2px' }}>Console Lounge Monitor App</p>
            <p style={{ fontSize: '12px', color: '#8a8780', margin: 0 }}>
              Windows 10 / 11 · Pre-configured for your lounge
            </p>
          </div>
          <button style={{
            border: '1px solid #e8e4dc', borderRadius: '8px',
            padding: '7px 16px', background: '#fff',
            fontSize: '13px', color: '#8a8780', cursor: 'pointer',
          }}>
            Available after signup
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#8a8780', padding: '40px' }}>Loading...</p>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
          }}>
            {consoles.map(c => (
              <div key={c.id} style={{
                ...S.card, padding: '14px 16px',
                borderColor: c.ghost ? '#e8c070' : '#e8e4dc',
                background: c.ghost ? '#fffdf5' : '#fff',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: statusColor(c.status),
                      boxShadow: c.status === 'playing'
                        ? '0 0 5px rgba(45,122,79,0.4)' : 'none',
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: '15px', fontWeight: 700,
                      color: '#1a1a1a' }}>{c.name}</span>
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 600,
                    letterSpacing: '0.5px',
                    color: statusColor(c.status),
                  }}>
                    {statusLabel(c.status)}
                  </span>
                </div>

                {c.game && (
                  <p style={{ fontSize: '13px', color: '#0d9488',
                    fontWeight: 500, margin: '0 0 6px' }}>{c.game}</p>
                )}

                {c.ghost && (
                  <div style={{
                    background: '#fffbeb', border: '1px solid #f0d080',
                    borderRadius: '8px', padding: '8px 10px', marginBottom: '8px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '12px', color: '#8a6020' }}>
                      On {c.ghostMins}m · no session open
                    </span>
                    <button onClick={() => dismiss(c.id)} disabled={dismissing === c.id} style={{
                      background: 'none', border: 'none',
                      color: '#0d9488', fontSize: '12px',
                      fontWeight: 500, cursor: 'pointer', padding: 0,
                    }}>
                      {dismissing === c.id ? '...' : 'Dismiss'}
                    </button>
                  </div>
                )}

                <p style={{ fontSize: '11px', color: '#b0ada8', margin: '0 0 1px' }}>
                  {c.heartbeatFresh
                    ? `Heartbeat · ${c.heartbeatAgeSeconds}s ago`
                    : 'No heartbeat data'}
                </p>
                {c.ip && (
                  <p style={{ fontSize: '11px', color: '#c8c5c0', margin: 0, fontFamily: 'monospace' }}>
                    {c.ip}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {ghosts.length > 0 && (
          <div>
            <p style={{ ...S.label, marginBottom: '8px' }}>
              Ghost Log · {ghosts.length} Active
            </p>
            <div style={S.card}>
              {ghosts.map((c, i) => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 18px',
                  borderBottom: i < ghosts.length - 1 ? '1px solid #f0ede6' : 'none',
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>
                    {c.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '13px', color: '#8a8780' }}>
                      {c.ghostMins}m on
                    </span>
                    <button onClick={() => dismiss(c.id)} disabled={dismissing === c.id} style={{
                      background: 'none', border: 'none',
                      color: '#0d9488', fontSize: '13px',
                      fontWeight: 500, cursor: 'pointer',
                    }}>
                      {dismissing === c.id ? '...' : 'Dismiss'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
