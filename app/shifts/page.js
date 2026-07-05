'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function DiscrepancyDot({ variance }) {
  const v = Number(variance || 0)
  const color = v === 0 ? '#2d7a4f'
    : Math.abs(v) < 100 ? '#c9a84c'
    : '#c0392b'
  return (
    <div title={`Ksh ${v}`} style={{
      width: '10px', height: '10px', borderRadius: '50%',
      background: color, flexShrink: 0,
    }} />
  )
}

export default function ShiftsPage() {
  const [shifts, setShifts]     = useState([])
  const [summary, setSummary]   = useState({})
  const [history, setHistory]   = useState({})
  const [staffList, setStaff]   = useState([])
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0])
  const [staffId, setStaffId]   = useState('')
  const [loading, setLoading]   = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadStaff()
  }, [])

  useEffect(() => {
    loadShifts()
  }, [date, staffId])

  async function loadStaff() {
    try {
      const res  = await fetch('/api/staff')
      const data = await res.json()
      setStaff(data.staff || [])
    } catch {}
  }

  async function loadShifts() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ date })
      if (staffId) params.append('staffId', staffId)
      const res  = await fetch(`/api/shifts?${params}`)
      const data = await res.json()
      setShifts(data.shifts   || [])
      setSummary(data.summary || {})
      setHistory(data.history || {})
    } catch {}
    setLoading(false)
  }

  function formatDuration(openedAt, closedAt) {
    const end   = closedAt ? new Date(closedAt) : new Date()
    const start = new Date(openedAt)
    const mins  = Math.floor((end - start) / 60000)
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const S = {
    page:  { minHeight: '100vh', background: '#f4f1eb', padding: '28px 32px' },
    card:  { background: '#fff', border: '1px solid #e8e4dc',
             borderRadius: '12px', padding: '20px 24px' },
    label: { fontSize: '11px', fontWeight: 500, textTransform: 'uppercase',
             letterSpacing: '0.8px', color: '#8a8780', margin: '0 0 6px' },
    val:   { fontSize: '26px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 2px' },
    sub:   { fontSize: '12px', color: '#8a8780', margin: 0 },
  }

  const discrepancy = Number(summary.net_discrepancy || 0)

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700,
          color: '#1a1a1a', margin: '0 0 4px' }}>
          Shifts & Reconciliation
        </h1>
        <p style={{ fontSize: '13px', margin: 0 }}>
          <span style={{ color: '#8a8780' }}>Cash accountability, session history, </span>
          <span style={{ color: '#c9a84c' }}>discrepancy tracking</span>
          <span style={{ color: '#8a8780' }}>.</span>
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Discrepancy history */}
        {Object.keys(history).length > 0 && (
          <div style={S.card}>
            <p style={{ ...S.label, marginBottom: '14px' }}>
              Discrepancy History — Last 10 Shifts Each
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.values(history).map(h => (
                <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600,
                    color: '#1a1a1a', minWidth: '60px' }}>{h.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {h.variances.slice().reverse().map((v, i) => (
                      <DiscrepancyDot key={i} variance={v} />
                    ))}
                    {h.variances.length === 0 && (
                      <span style={{ fontSize: '12px', color: '#c0c0b8' }}>No closed shifts yet</span>
                    )}
                  </div>
                  {h.variances.length > 0 && (
                    <>
                      <span style={{ fontSize: '11px', color: '#c0c0b8' }}>oldest</span>
                      <span style={{ fontSize: '11px', color: '#8a8780' }}>→</span>
                      <span style={{ fontSize: '11px', color: '#c0c0b8' }}>latest</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
          {[
            {
              label: 'Shifts',
              val: summary.total_shifts || 0,
              sub: `${summary.live_shifts || 0} live · ${(summary.total_shifts || 0) - (summary.live_shifts || 0)} done`,
              color: '#1a1a1a',
            },
            {
              label: 'Expected Cash',
              val: `Ksh ${Number(summary.expected_cash || 0).toLocaleString()}`,
              sub: 'completed shifts', color: '#1a1a1a',
            },
            {
              label: 'Cash Counted',
              val: `Ksh ${Number(summary.cash_counted || 0).toLocaleString()}`,
              sub: 'actual in till', color: '#1a1a1a',
            },
            {
              label: 'Net Discrepancy',
              val: `Ksh ${Math.abs(discrepancy).toLocaleString()}`,
              sub: discrepancy < 0 ? 'short' : discrepancy > 0 ? 'over' : 'balanced',
              color: discrepancy === 0 ? '#2d7a4f' : discrepancy < 0 ? '#c0392b' : '#c9a84c',
            },
          ].map(stat => (
            <div key={stat.label} style={S.card}>
              <p style={S.label}>{stat.label}</p>
              <p style={{ ...S.val, color: stat.color, fontSize: '22px' }}>
                {stat.val}
              </p>
              <p style={S.sub}>{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ ...S.card, padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <p style={{ ...S.label, marginBottom: '4px' }}>Date</p>
              <input type="date" value={date}
                onChange={e => setDate(e.target.value)}
                style={{
                  border: '1px solid #e8e4dc', borderRadius: '8px',
                  padding: '7px 12px', fontSize: '13px', color: '#1a1a1a',
                  background: '#fff', outline: 'none', cursor: 'pointer',
                }}
              />
            </div>
            <div>
              <p style={{ ...S.label, marginBottom: '4px' }}>Staff</p>
              <select value={staffId} onChange={e => setStaffId(e.target.value)}
                style={{
                  border: '1px solid #e8e4dc', borderRadius: '8px',
                  padding: '7px 12px', fontSize: '13px', color: '#1a1a1a',
                  background: '#fff', outline: 'none', cursor: 'pointer',
                  minWidth: '120px',
                }}>
                <option value=''>All staff</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '18px' }}>
              <button
                onClick={() => { setStaffId(''); setDate(new Date().toISOString().split('T')[0]) }}
                style={{
                  padding: '7px 16px', borderRadius: '8px',
                  border: '1px solid #e8e4dc', background: '#fff',
                  fontSize: '13px', color: '#1a1a1a', cursor: 'pointer', fontWeight: 500,
                }}>All</button>
              <button
                onClick={() => setDate(new Date().toISOString().split('T')[0])}
                style={{
                  padding: '7px 16px', borderRadius: '8px',
                  border: '1px solid #e8e4dc', background: '#fff',
                  fontSize: '13px', color: '#1a1a1a', cursor: 'pointer', fontWeight: 500,
                }}>Today</button>
            </div>
          </div>
        </div>

        {/* Shift cards */}
        {loading ? (
          <p style={{ color: '#8a8780', textAlign: 'center', padding: '40px' }}>
            Loading...
          </p>
        ) : shifts.length === 0 ? (
          <p style={{ color: '#8a8780', textAlign: 'center', padding: '40px' }}>
            No shifts found for this date.
          </p>
        ) : shifts.map(sh => {
          const isLive     = !sh.closed_at
          const variance   = Number(sh.variance || 0)
          const mpesaOff   = Number(sh.mpesa_revenue || 0) - Number(sh.mpesa_declared || 0)

          return (
            <div key={sh.id} style={{
              ...S.card, padding: 0, overflow: 'hidden',
              borderLeft: isLive ? '3px solid #2d7a4f' : '3px solid transparent',
            }}>
              {/* Shift header */}
              <div style={{ padding: '16px 20px',
                borderBottom: '1px solid #f0ede6',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a' }}>
                    {sh.staff_name}
                  </span>
                  <span style={{ fontSize: '13px', color: '#8a8780', marginLeft: '10px' }}>
                    {new Date(sh.opened_at).toLocaleDateString('en-KE', {
                      day: 'numeric', month: 'short'
                    })}, {new Date(sh.opened_at).toLocaleTimeString('en-KE', {
                      hour: '2-digit', minute: '2-digit'
                    })} · {formatDuration(sh.opened_at, sh.closed_at)}
                  </span>
                </div>
                {isLive && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%',
                      background: '#2d7a4f' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600,
                      color: '#2d7a4f', letterSpacing: '0.5px' }}>LIVE</span>
                  </div>
                )}
                {!isLive && variance !== 0 && (
                  <span style={{
                    fontSize: '12px', fontWeight: 600,
                    color: variance < 0 ? '#c0392b' : '#c9a84c',
                    background: variance < 0 ? '#fef2f2' : '#fffdf5',
                    padding: '3px 10px', borderRadius: '20px',
                  }}>
                    {variance < 0 ? 'Short' : 'Over'} Ksh {Math.abs(variance).toLocaleString()}
                  </span>
                )}
                {!isLive && variance === 0 && (
                  <span style={{ fontSize: '12px', fontWeight: 600,
                    color: '#2d7a4f', background: '#f0fdf4',
                    padding: '3px 10px', borderRadius: '20px' }}>
                    Balanced
                  </span>
                )}
              </div>

              {/* Sessions breakdown */}
              <div style={{ padding: '14px 20px' }}>
                <div style={{ display: 'grid',
                  gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>

                  {/* Left — gaming revenue */}
                  <div>
                    <p style={{ ...S.label, marginBottom: '10px' }}>
                      {sh.session_count} Sessions
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#2d7a4f', fontWeight: 500 }}>
                          Gaming Revenue
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
                          Ksh {Number(sh.revenue || 0).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                        paddingLeft: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#8a8780' }}>↳ Cash</span>
                        <span style={{ fontSize: '12px', color: '#1a1a1a' }}>
                          Ksh {Number(sh.cash_revenue || 0).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                        paddingLeft: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#8a8780' }}>↳ M-Pesa</span>
                        <span style={{ fontSize: '12px', color: '#1a1a1a' }}>
                          Ksh {Number(sh.mpesa_revenue || 0).toLocaleString()}
                        </span>
                      </div>
                      {sh.unpaid_count > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                          marginTop: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#c0392b', fontWeight: 500 }}>
                            Unpaid ({sh.unpaid_count})
                          </span>
                          <span style={{ fontSize: '12px', color: '#c0392b' }}>Ksh 0</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right — reconciliation */}
                  {!isLive && (
                    <div>
                      <p style={{ ...S.label, marginBottom: '10px' }}>Reconciliation</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {[
                          { label: 'Expected cash', val: sh.cash_expected },
                          { label: 'Cash declared', val: sh.cash_declared },
                          { label: 'Expected M-Pesa', val: sh.mpesa_expected },
                          { label: 'M-Pesa declared', val: sh.mpesa_declared },
                        ].map(row => (
                          <div key={row.label} style={{ display: 'flex',
                            justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: '#8a8780' }}>
                              {row.label}
                            </span>
                            <span style={{ fontSize: '12px', color: '#1a1a1a', fontWeight: 500 }}>
                              Ksh {Number(row.val || 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* M-Pesa not in till warning */}
                {!isLive && Number(sh.mpesa_revenue || 0) > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '10px',
                    borderTop: '1px solid #f0ede6' }}>
                    <span style={{ fontSize: '12px', color: '#8a8780' }}>
                      M-Pesa: <strong style={{ color: '#1a1a1a' }}>
                        Ksh {Number(sh.mpesa_revenue || 0).toLocaleString()}
                      </strong>{' '}
                      <span style={{ color: '#c9a84c' }}>not in till</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}