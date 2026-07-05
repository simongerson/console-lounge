'use client'
import { useState, useEffect, useRef } from 'react'

const MOCK_CONSOLES = [
  { id: 1, name: 'Bay 1', status: 'playing', game: 'Call of Duty', ip: '192.168.1.20', heartbeat: 4, ghost: false },
  { id: 2, name: 'Bay 2', status: 'ghost',   game: null,           ip: '192.168.1.21', heartbeat: 4, ghost: true, ghostMins: 14 },
  { id: 3, name: 'Bay 3', status: 'playing', game: 'GTA Online',   ip: '192.168.1.22', heartbeat: 4, ghost: false },
  { id: 4, name: 'Bay 4', status: 'idle',    game: null,           ip: '192.168.1.23', heartbeat: 4, ghost: false },
  { id: 5, name: 'Bay 5', status: 'playing', game: 'Call of Duty', ip: '192.168.1.24', heartbeat: 4, ghost: false },
  { id: 6, name: 'Bay 6', status: 'off',     game: null,           ip: '192.168.1.25', heartbeat: 4, ghost: false },
]

const MOCK_EVENTS = [
  { time: '14:29', type: 'session_start', bay: 'Bay 1', color: '#1a1a1a' },
  { time: '14:28', type: 'turned_on',     bay: 'Bay 1', color: '#1a1a1a' },
  { time: '14:16', type: 'ghost_detected',bay: 'Bay 2', color: '#c9a84c' },
]

export default function MonitoringPage() {
  const [consoles, setConsoles]     = useState(MOCK_CONSOLES)
  const [dismissed, setDismissed]   = useState([])
  const [scriptOnline]              = useState(true)
  const [lastHb, setLastHb]         = useState(4)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setLastHb(s => s + 15)
    }, 15000)
    return () => clearInterval(timerRef.current)
  }, [])

  function dismiss(bayId) {
    setDismissed(d => [...d, bayId])
    setConsoles(cs => cs.map(c =>
      c.id === bayId ? { ...c, ghost: false, status: 'idle' } : c
    ))
  }

  const ghosts    = consoles.filter(c => c.ghost && !dismissed.includes(c.id))
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

      {/* Header */}
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

        {/* Script status */}
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
              {scriptOnline ? 'Monitoring script online' : 'Monitoring script offline'}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#8a8780', margin: '4px 0 0 16px' }}>
            Heartbeat · {lastHb}s ago · updates every 15s
          </p>
        </div>

        {/* Monitor app notice */}
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

        {/* Console grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
        }}>
          {consoles.map(c => (
            <div key={c.id} style={{
              ...S.card, padding: '14px 16px',
              borderColor: c.ghost && !dismissed.includes(c.id)
                ? '#e8c070' : '#e8e4dc',
              background: c.ghost && !dismissed.includes(c.id)
                ? '#fffdf5' : '#fff',
            }}>
              {/* Bay header */}
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

              {/* Game name */}
              {c.game && (
                <p style={{ fontSize: '13px', color: '#0d9488',
                  fontWeight: 500, margin: '0 0 6px' }}>{c.game}</p>
              )}

              {/* Ghost alert */}
              {c.ghost && !dismissed.includes(c.id) && (
                <div style={{
                  background: '#fffbeb', border: '1px solid #f0d080',
                  borderRadius: '8px', padding: '8px 10px', marginBottom: '8px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: '12px', color: '#8a6020' }}>
                    On {c.ghostMins}m · no session open
                  </span>
                  <button onClick={() => dismiss(c.id)} style={{
                    background: 'none', border: 'none',
                    color: '#0d9488', fontSize: '12px',
                    fontWeight: 500, cursor: 'pointer', padding: 0,
                  }}>Dismiss</button>
                </div>
              )}

              {/* Heartbeat + IP */}
              <p style={{ fontSize: '11px', color: '#b0ada8', margin: '0 0 1px' }}>
                Heartbeat · {c.heartbeat}s ago
              </p>
              <p style={{ fontSize: '11px', color: '#c8c5c0', margin: 0, fontFamily: 'monospace' }}>
                {c.ip}
              </p>
            </div>
          ))}
        </div>

        {/* Ghost log */}
        {ghosts.length > 0 && (
          <div>
            <p style={{ ...S.label, marginBottom: '8px' }}>
              Ghost Log · {ghosts.length} Event{ghosts.length > 1 ? 's' : ''}
            </p>
            <div style={S.card}>
              {ghosts.map((c, i) => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 18px',
                  borderBottom: i < ghosts.length - 1
                    ? '1px solid #f0ede6' : 'none',
                }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#8a8780',
                      fontFamily: 'monospace', minWidth: '40px' }}>
                      {MOCK_EVENTS.find(e => e.bay === c.name && e.type === 'ghost_detected')?.time || '—'}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>
                      {c.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '13px', color: '#8a8780' }}>
                      {c.ghostMins}m on
                    </span>
                    <button onClick={() => dismiss(c.id)} style={{
                      background: 'none', border: 'none',
                      color: '#0d9488', fontSize: '13px',
                      fontWeight: 500, cursor: 'pointer',
                    }}>Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event log */}
        <div>
          <p style={{ ...S.label, marginBottom: '8px' }}>Event Log</p>
          <div style={S.card}>
            {MOCK_EVENTS.map((e, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '20px',
                padding: '11px 18px',
                borderBottom: i < MOCK_EVENTS.length - 1
                  ? '1px solid #f0ede6' : 'none',
              }}>
                <span style={{ fontSize: '13px', color: '#8a8780',
                  fontFamily: 'monospace', minWidth: '40px' }}>{e.time}</span>
                <span style={{
                  fontSize: '13px', fontWeight: 500,
                  color: e.type === 'ghost_detected' ? '#c9a84c' : '#1a1a1a',
                }}>
                  {e.type === 'session_start' ? 'session start'
                    : e.type === 'turned_on' ? 'Turned on'
                    : 'Ghost detected'}
                </span>
                <span style={{ fontSize: '13px', color: '#0d9488', fontWeight: 500 }}>
                  {e.bay}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}