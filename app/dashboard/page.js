'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState('today')
  const router = useRouter()

  const loadDashboard = useCallback(async () => {
    try {
      const res  = await fetch(`/api/dashboard?period=${period}`)
      const json = await res.json()
      setData(json)
    } catch {}
    setLoading(false)
  }, [period])

  useEffect(() => { loadDashboard() }, [loadDashboard])
  useEffect(() => {
    const t = setInterval(loadDashboard, 30000)
    return () => clearInterval(t)
  }, [loadDashboard])

  const rev     = data?.revenue || {}
  const consoles = data?.consoles || []
  const shifts   = data?.shifts   || []
  const sessions = data?.sessions || []
  const active  = consoles.filter(c => c.status === 'active').length
  const total   = consoles.length

  function timeElapsed(startedAt) {
    if (!startedAt) return ''
    const diff = Math.floor((Date.now() - new Date(startedAt)) / 60000)
    if (diff < 60) return `${diff}m`
    return `${Math.floor(diff/60)}h ${diff%60}m`
  }

  function pct(a, b) {
    if (!b || b === 0) return null
    const p = Math.round(((a - b) / b) * 100)
    return p
  }

  const vsYesterday = pct(rev.total, rev.yesterday)
  const vs7day      = pct(rev.total, rev.avg7day)

  // Simple bar chart data — last 7 days
  const chartData  = data?.chart || []
  const chartMax   = Math.max(...chartData.map(d => d.total || 0), 1)

  const today = new Date().toLocaleDateString('en-KE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  // Flagged sessions (zero payment on completed sessions)
  const flagged = sessions.filter(s =>
    s.status === 'completed' && Number(s.amount) === 0
  )

  const S = {
    card: {
      background: '#fff',
      border: '1px solid #e8e5de',
      borderRadius: '12px',
      padding: '18px 20px',
    },
    label: {
      fontSize: '11px', fontWeight: 500,
      textTransform: 'uppercase', letterSpacing: '0.8px',
      color: '#8a8780', margin: '0 0 6px',
    },
    val: { fontSize: '28px', fontWeight: 700, color: '#1a1a1a', margin: 0 },
    sub: { fontSize: '12px', color: '#8a8780', margin: 0 },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f1eb', padding: '24px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700,
            color: '#1a1a1a', margin: '0 0 2px' }}>Dashboard</h1>
          <p style={{ color: '#8a8780', fontSize: '13px', margin: 0 }}>{today}</p>
        </div>
        {/* Period tabs */}
        <div style={{
          display: 'flex', background: '#1a1a1a',
          borderRadius: '8px', padding: '3px', gap: '2px',
        }}>
          {['today','yesterday','week'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '6px 14px', borderRadius: '6px', border: 'none',
              background: period === p ? '#fff' : 'transparent',
              color: period === p ? '#1a1a1a' : 'rgba(255,255,255,0.5)',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}>
              {p === 'today' ? 'Today' : p === 'yesterday' ? 'Yesterday' : 'This Week'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: '80px', color: '#8a8780' }}>
          Loading...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Main revenue card */}
            <div style={{ ...S.card, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between' }}>

                {/* Revenue */}
                <div style={{ flex: 1 }}>
                  <p style={S.label}>Today's Revenue</p>
                  <p style={{ fontSize: '40px', fontWeight: 700,
                    color: '#1a1a1a', margin: '0 0 8px', letterSpacing: '-1px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 500,
                      color: '#8a8780', marginRight: '2px' }}>Ksh</span>
                    {(rev.total || 0).toLocaleString()}
                  </p>

                  {/* Comparisons */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                    {vsYesterday !== null && (
                      <span style={{
                        fontSize: '12px', fontWeight: 500,
                        color: vsYesterday >= 0 ? '#2d7a4f' : '#c0392b',
                      }}>
                        {vsYesterday >= 0 ? '↑' : '↓'} {Math.abs(vsYesterday)}% vs yesterday same time
                      </span>
                    )}
                    {vs7day !== null && (
                      <span style={{
                        fontSize: '12px', fontWeight: 500,
                        color: vs7day >= 0 ? '#2d7a4f' : '#c0392b',
                      }}>
                        {vs7day >= 0 ? '↑' : '↓'} {Math.abs(vs7day)}% vs 7-day avg
                      </span>
                    )}
                  </div>

                  {/* On pace */}
                  {rev.projected > 0 && (
                    <p style={{ fontSize: '12px', color: '#8a8780', margin: 0 }}>
                      On pace for{' '}
                      <span style={{ color: '#0d9488', fontWeight: 600 }}>
                        ~ Ksh {(rev.projected || 0).toLocaleString()}
                      </span>
                    </p>
                  )}
                </div>

                {/* Sessions + Cashouts */}
                <div style={{ display: 'flex', gap: '32px', textAlign: 'right',
                  flexShrink: 0, paddingLeft: '24px' }}>
                  <div>
                    <p style={{ ...S.label, textAlign: 'right' }}>Sessions</p>
                    <p style={{ fontSize: '28px', fontWeight: 700,
                      color: '#1a1a1a', margin: '0 0 2px' }}>
                      {rev.sessions || 0}
                    </p>
                    <p style={{ fontSize: '11px', color: '#8a8780', margin: 0 }}>
                      {rev.activeSessions || 0} paid ·{' '}
                      {(rev.sessions || 0) - (rev.activeSessions || 0)} unpaid
                    </p>
                  </div>
                  <div>
                    <p style={{ ...S.label, textAlign: 'right' }}>Cash Outs</p>
                    <p style={{ fontSize: '28px', fontWeight: 700,
                      color: '#1a1a1a', margin: '0 0 2px' }}>
                      <span style={{ fontSize: '14px', color: '#8a8780' }}>Ksh </span>
                      {(rev.cashouts || 0).toLocaleString()}
                    </p>
                    {rev.pendingCashouts > 0 && (
                      <button onClick={() => router.push('/cashouts')}
                        style={{ fontSize: '11px', color: '#0d9488', background: 'none',
                          border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
                        {rev.pendingCashouts} to review →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cash / M-Pesa / Debts row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
              {[
                { label: 'Cash',               val: rev.cash  || 0 },
                { label: 'M-Pesa',             val: rev.mpesa || 0 },
                { label: 'Outstanding Debts',  val: rev.debts || 0 },
              ].map(item => (
                <div key={item.label} style={S.card}>
                  <p style={S.label}>{item.label}</p>
                  <p style={{ fontSize: '22px', fontWeight: 700,
                    color: '#1a1a1a', margin: 0 }}>
                    <span style={{ fontSize: '13px', color: '#8a8780',
                      fontWeight: 400 }}>Ksh </span>
                    {item.val.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Needs attention */}
            {(flagged.length > 0 || rev.pendingCashouts > 0) && (
              <div style={{
                background: '#fffdf5',
                border: '1px solid #e8e2c8',
                borderRadius: '12px', padding: '14px 18px',
              }}>
                <p style={{ ...S.label, color: '#8a7a50', marginBottom: '8px' }}>
                  Needs Attention
                </p>
                {flagged.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#5a4a2a' }}>
                      <span style={{ color: '#c9a84c', fontWeight: 600 }}>
                        {flagged.length} session{flagged.length > 1 ? 's' : ''} flagged as unusual
                      </span>
                    </span>
                    <button onClick={() => router.push('/reports')}
                      style={{ fontSize: '12px', color: '#8a7a50', background: 'none',
                        border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                      Review →
                    </button>
                  </div>
                )}
                {rev.pendingCashouts > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#5a4a2a' }}>
                      {rev.pendingCashouts} cashouts pending your review
                    </span>
                    <button onClick={() => router.push('/cashouts')}
                      style={{ fontSize: '12px', color: '#8a7a50', background: 'none',
                        border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                      Review →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Flagged sessions detail */}
            {flagged.length > 0 && (
              <div style={S.card}>
                <p style={{ ...S.label, marginBottom: '12px' }}>Flagged Sessions</p>
                {flagged.map((s, i) => (
                  <div key={s.id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', padding: '10px 0',
                    borderBottom: i < flagged.length - 1
                      ? '1px solid #f0ede6' : 'none',
                  }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600,
                        color: '#1a1a1a', margin: '0 0 2px' }}>
                        {s.console_name} · {s.staff_name}
                      </p>
                      <p style={{ fontSize: '12px', color: '#c9a84c',
                        margin: 0, fontWeight: 500 }}>
                        Zero payment recorded for paid session
                      </p>
                    </div>
                    <span style={{ fontSize: '12px', color: '#8a8780' }}>
                      {timeElapsed(s.started_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Revenue chart — last 7 days */}
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '16px' }}>
                <p style={S.label}>Revenue — Last 7 Days</p>
                <span style={{ fontSize: '12px', color: '#8a8780' }}>
                  7-day avg: Ksh {(rev.avg7day || 0).toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end',
                gap: '8px', height: '80px' }}>
                {chartData.length > 0 ? chartData.map((d, i) => {
                  const isToday = i === chartData.length - 1
                  const h = Math.max(4, Math.round((d.total / chartMax) * 80))
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex',
                      flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '100%', height: `${h}px`,
                        background: isToday ? '#2d5a4a' : '#c8d5cc',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s',
                      }} />
                      <span style={{ fontSize: '10px', color: '#8a8780',
                        fontWeight: isToday ? 600 : 400,
                        color: isToday ? '#1a1a1a' : '#8a8780' }}>
                        {d.label}
                      </span>
                    </div>
                  )
                }) : (
                  // Empty state bars
                  ['Mon','Tue','Wed','Thu','Fri','Sat','Today'].map((d, i) => (
                    <div key={d} style={{ flex: 1, display: 'flex',
                      flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '100%', height: '8px',
                        background: i === 6 ? '#2d5a4a' : '#e8e4dc',
                        borderRadius: '3px 3px 0 0',
                      }} />
                      <span style={{ fontSize: '10px',
                        color: i === 6 ? '#1a1a1a' : '#8a8780',
                        fontWeight: i === 6 ? 600 : 400 }}>{d}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Bays panel */}
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '14px' }}>
                <p style={S.label}>{total} Bays</p>
                <span style={{ fontSize: '12px', color: '#0d9488', fontWeight: 600 }}>
                  {active} playing
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {consoles.map((c, i) => {
                  const isActive = c.status === 'active'
                  return (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 0',
                      borderBottom: i < consoles.length - 1
                        ? '1px solid #f0ede6' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Status dot */}
                        <div style={{
                          width: '7px', height: '7px', borderRadius: '50%',
                          background: isActive ? '#2d7a4f' : '#d4cfc5',
                          boxShadow: isActive ? '0 0 5px rgba(45,122,79,0.5)' : 'none',
                          flexShrink: 0,
                        }} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center',
                            gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600,
                              color: '#1a1a1a' }}>{c.name}</span>
                            {isActive && c.rate_name && (
                              <span style={{ fontSize: '11px', color: '#0d9488',
                                fontWeight: 500 }}>{c.rate_name}</span>
                            )}
                          </div>
                          <p style={{ fontSize: '11px', color: '#8a8780', margin: 0 }}>
                            {isActive
                              ? `${c.session_count || 1} session${(c.session_count || 1) > 1 ? 's' : ''} · Ksh ${Number(c.session_amount || 0).toLocaleString()}`
                              : 'Open'
                            }
                          </p>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '11px', fontWeight: 600,
                        color: isActive ? '#2d7a4f' : '#d4cfc5',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>
                        {isActive ? 'PLAYING' : 'OPEN'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* On Shift panel */}
            {shifts.length > 0 && (
              <div style={S.card}>
                <p style={{ ...S.label, marginBottom: '14px' }}>On Shift</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {shifts.map((sh, i) => (
                    <div key={sh.id} style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', padding: '10px 0',
                      borderBottom: i < shifts.length - 1
                        ? '1px solid #f0ede6' : 'none',
                    }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600,
                          color: '#1a1a1a', margin: '0 0 2px' }}>
                          {sh.staff_name}
                        </p>
                        <p style={{ fontSize: '11px', color: '#8a8780', margin: 0 }}>
                          {sh.session_count || 0} sessions · since{' '}
                          {new Date(sh.opened_at).toLocaleTimeString('en-KE', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '13px', fontWeight: 700,
                          color: '#1a1a1a', margin: '0 0 2px' }}>
                          Ksh {Number(sh.revenue || 0).toLocaleString()}
                        </p>
                        <p style={{ fontSize: '10px', color: '#8a8780',
                          fontWeight: 500, margin: 0, textTransform: 'uppercase',
                          letterSpacing: '0.5px' }}>
                          Collected
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}