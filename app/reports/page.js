'use client'
import { useState, useEffect } from 'react'

const PERIODS = [
  { key: '7d',     label: '7D' },
  { key: '30d',    label: '30D' },
  { key: '90d',    label: '90D' },
  { key: 'custom', label: 'Custom' },
]

export default function ReportsPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState('7d')
  const [from, setFrom]       = useState('')
  const [to, setTo]           = useState('')

  useEffect(() => {
    if (period !== 'custom') loadReports()
  }, [period])

  async function loadReports() {
    setLoading(true)
    try {
      let url = `/api/reports?period=${period}`
      if (period === 'custom' && from && to) {
        url += `&from=${from}&to=${to}`
      }
      const res  = await fetch(url)
      const json = await res.json()
      setData(json)
    } catch {}
    setLoading(false)
  }

  const S = {
    page:  { minHeight: '100vh', background: '#f4f1eb', padding: '28px 32px' },
    card:  { background: '#fff', border: '1px solid #e8e4dc', borderRadius: '12px' },
    label: { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
             letterSpacing: '1px', color: '#8a8780', margin: '0 0 10px' },
  }

  const rev     = data?.summary    || {}
  const chart   = data?.chartData  || []
  const byGame  = data?.byGame     || []
  const peak    = data?.peakData   || []
  const byStaff = data?.byStaff    || []
  const byCons  = data?.byConsole  || []
  const chartMax = Math.max(...chart.map(d => Number(d.total || 0)), 1)
  const peakMax  = Math.max(...peak.map(d => d.sessions || 0), 1)
  const gameMax  = Number(byGame[0]?.revenue || 0)

  const dateRange = data
    ? `${new Date(data.startDate + 'T12:00').toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} – ${new Date(data.endDate + 'T12:00').toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`
    : ''

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700,
            color: '#1a1a1a', margin: '0 0 2px' }}>Analytics</h1>
          <p style={{ fontSize: '13px', color: '#8a8780', margin: 0 }}>
            {dateRange}
          </p>
        </div>

        {/* Period tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ display: 'flex', background: '#1a1a1a',
            borderRadius: '8px', padding: '3px', gap: '1px' }}>
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)} style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none',
                background: period === p.key ? '#fff' : 'transparent',
                color: period === p.key ? '#1a1a1a' : 'rgba(255,255,255,0.5)',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom date range */}
      {period === 'custom' && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center',
          marginBottom: '16px' }}>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            style={{ border: '1px solid #e8e4dc', borderRadius: '8px',
              padding: '8px 12px', fontSize: '13px', color: '#1a1a1a',
              background: '#fff', outline: 'none' }} />
          <span style={{ color: '#8a8780' }}>to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            style={{ border: '1px solid #e8e4dc', borderRadius: '8px',
              padding: '8px 12px', fontSize: '13px', color: '#1a1a1a',
              background: '#fff', outline: 'none' }} />
          <button onClick={loadReports}
            disabled={!from || !to}
            style={{ background: '#3a5c32', border: 'none', borderRadius: '8px',
              padding: '8px 18px', color: '#fff', fontSize: '13px',
              fontWeight: 500, cursor: 'pointer', opacity: (!from || !to) ? 0.5 : 1 }}>
            Apply
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: '80px', color: '#8a8780' }}>
          Loading analytics...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Summary strip */}
          <div style={{ ...S.card, padding: '18px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
              <div>
                <p style={{ fontSize: '11px', color: '#8a8780', fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>
                  Revenue
                </p>
                <p style={{ fontSize: '32px', fontWeight: 700,
                  color: '#1a1a1a', margin: 0, letterSpacing: '-1px' }}>
                  <span style={{ fontSize: '16px', color: '#8a8780',
                    fontWeight: 400 }}>Ksh </span>
                  {Number(rev.total || 0).toLocaleString()}
                </p>
              </div>
              {[
                { label: 'Sessions', val: rev.sessions || 0 },
                { label: 'Avg / Session',
                  val: `Ksh ${(rev.avgPerSession || 0).toLocaleString()}` },
                { label: 'Cash',  val: `${rev.cashPct  || 0}%` },
                { label: 'M-Pesa', val: `${rev.mpesaPct || 0}%` },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ fontSize: '11px', color: '#8a8780', fontWeight: 500,
                    textTransform: 'uppercase', letterSpacing: '1px',
                    margin: '0 0 4px' }}>
                    {s.label}
                  </p>
                  <p style={{ fontSize: '22px', fontWeight: 700,
                    color: '#1a1a1a', margin: 0 }}>{s.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue trend chart */}
          <div style={{ ...S.card, padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '16px' }}>
              <p style={S.label}>Revenue Trend</p>
              <span style={{ fontSize: '12px', color: '#8a8780' }}>
                avg Ksh {(rev.avgPerDay || 0).toLocaleString()} / day
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end',
              gap: '6px', height: '120px', marginBottom: '8px' }}>
              {chart.map((d, i) => {
                const h = Math.max(4, Math.round(
                  (Number(d.total) / chartMax) * 120
                ))
                return (
                  <div key={d.day} style={{ flex: 1, display: 'flex',
                    flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'flex-end', gap: '6px', height: '100%' }}>
                    <div
                      title={`Ksh ${Number(d.total).toLocaleString()} · ${d.sessions} sessions`}
                      style={{
                        width: '100%', height: `${h}px`,
                        background: d.isToday ? '#2d5a3a' : '#c8d5cc',
                        borderRadius: '4px 4px 0 0',
                        cursor: 'default',
                        transition: 'background 0.2s',
                      }}
                      onMouseOver={e => e.target.style.background = d.isToday ? '#3a7a50' : '#a8c0ae'}
                      onMouseOut={e => e.target.style.background = d.isToday ? '#2d5a3a' : '#c8d5cc'}
                    />
                    <span style={{ fontSize: '10px',
                      color: d.isToday ? '#1a1a1a' : '#8a8780',
                      fontWeight: d.isToday ? 600 : 400,
                      textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {d.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* By Game + Peak Hours */}
          <div style={{ display: 'grid',
            gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

            {/* By game */}
            <div style={{ ...S.card, padding: '20px 24px' }}>
              <p style={S.label}>By Game</p>
              {byGame.length === 0 ? (
                <p style={{ color: '#8a8780', fontSize: '13px' }}>
                  No data yet
                </p>
              ) : byGame.map((g, i) => (
                <div key={g.game} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'baseline', marginBottom: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#b0ada8',
                        fontWeight: 500, minWidth: '14px' }}>{i + 1}</span>
                      <span style={{ fontSize: '14px', fontWeight: 600,
                        color: '#0d9488' }}>{g.game}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px',
                      alignItems: 'baseline' }}>
                      <span style={{ fontSize: '12px', color: '#8a8780' }}>
                        {g.sessions} sess.
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 700,
                        color: '#1a1a1a' }}>
                        Ksh {Number(g.revenue).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: '4px', background: '#f0ede6',
                    borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '2px',
                      background: '#2d5a3a',
                      width: `${gameMax > 0
                        ? Math.round((Number(g.revenue)/gameMax)*100) : 0}%`,
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Peak hours */}
            <div style={{ ...S.card, padding: '20px 24px' }}>
              <p style={S.label}>Peak Hours</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {peak.map(h => (
                  <div key={h.hour} style={{ display: 'flex',
                    alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#8a8780',
                      minWidth: '32px', textAlign: 'right' }}>{h.label}</span>
                    <div style={{ flex: 1, height: '6px', background: '#f0ede6',
                      borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        background: '#2d5a3a',
                        width: `${Math.round((h.sessions/peakMax)*100)}%`,
                      }} />
                    </div>
                    {h.sessions > 0 && (
                      <span style={{ fontSize: '11px', color: '#5a5a52',
                        minWidth: '16px', textAlign: 'right',
                        fontWeight: 500 }}>{h.sessions}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* By Staff + By Console */}
          <div style={{ display: 'grid',
            gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

            {/* Staff */}
            <div style={{ ...S.card, padding: '20px 24px' }}>
              <p style={S.label}>Staff</p>
              {byStaff.length === 0 ? (
                <p style={{ color: '#8a8780', fontSize: '13px' }}>No data</p>
              ) : byStaff.map((s, i) => {
                const staffMax = Number(byStaff[0]?.revenue || 0)
                return (
                  <div key={s.staff} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'baseline', marginBottom: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center',
                        gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#b0ada8',
                          fontWeight: 500, minWidth: '14px' }}>{i + 1}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600,
                          color: '#1a1a1a' }}>{s.staff}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px',
                        alignItems: 'baseline' }}>
                        <span style={{ fontSize: '12px', color: '#8a8780' }}>
                          {s.sessions} sess.
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 700,
                          color: '#1a1a1a' }}>
                          Ksh {Number(s.revenue).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div style={{ height: '4px', background: '#f0ede6',
                      borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '2px',
                        background: '#2d5a3a',
                        width: `${staffMax > 0
                          ? Math.round((Number(s.revenue)/staffMax)*100) : 0}%`,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Consoles */}
            <div style={{ ...S.card, padding: '20px 24px' }}>
              <p style={S.label}>Consoles</p>
              {byCons.length === 0 ? (
                <p style={{ color: '#8a8780', fontSize: '13px' }}>No data</p>
              ) : byCons.map((c, i) => {
                const consMax = Number(byCons[0]?.revenue || 0)
                return (
                  <div key={c.console} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'baseline', marginBottom: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center',
                        gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#b0ada8',
                          fontWeight: 500, minWidth: '14px' }}>{i + 1}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600,
                          color: '#1a1a1a' }}>{c.console}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px',
                        alignItems: 'baseline' }}>
                        <span style={{ fontSize: '12px', color: '#8a8780' }}>
                          {c.sessions} sess.
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 700,
                          color: '#1a1a1a' }}>
                          Ksh {Number(c.revenue).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div style={{ height: '4px', background: '#f0ede6',
                      borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '2px',
                        background: '#2d5a3a',
                        width: `${consMax > 0
                          ? Math.round((Number(c.revenue)/consMax)*100) : 0}%`,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}