'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ShiftClosePage() {
  const [staffName, setStaffName]   = useState('')
  const [shiftId, setShiftId]       = useState('')
  const [cashDeclared, setCash]     = useState('')
  const [mpesaDeclared, setMpesa]   = useState('')
  const [summary, setSummary]       = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const router = useRouter()

  useEffect(() => {
    const name  = localStorage.getItem('cl_staff_name')
    const shift = localStorage.getItem('cl_shift_id')
    if (!shift) { router.push('/pos'); return }
    setStaffName(name || 'Staff')
    setShiftId(shift)
  }, [])

  async function closeShift() {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/shifts/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId,
          cashDeclared:  Number(cashDeclared)  || 0,
          mpesaDeclared: Number(mpesaDeclared) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setLoading(false); return }
      setSummary(data.summary)
    } catch {
      setError('Connection error')
      setLoading(false)
    }
  }

  function signOut() {
    localStorage.removeItem('cl_staff_session')
    localStorage.removeItem('cl_staff_id')
    localStorage.removeItem('cl_staff_name')
    localStorage.removeItem('cl_shift_id')
    router.push('/pos')
  }

  const variance = summary?.variance || 0

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0a0a0a' }}>
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(13,148,136,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.06) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 w-full max-w-sm">

        {!summary ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>
                Close Shift
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>
                {staffName} — count your cash and enter totals
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(13,148,136,0.2)',
              borderRadius: '20px', padding: '24px 20px',
            }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px',
                  fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                  💵 Cash in till (KES)
                </label>
                <input type="number" value={cashDeclared}
                  onChange={e => setCash(e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', padding: '16px',
                    color: '#fff', fontSize: '26px',
                    fontWeight: 700, textAlign: 'center', outline: 'none',
                  }}
                  onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
                  onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px',
                  fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                  📱 M-Pesa received (KES)
                </label>
                <input type="number" value={mpesaDeclared}
                  onChange={e => setMpesa(e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', padding: '16px',
                    color: '#fff', fontSize: '26px',
                    fontWeight: 700, textAlign: 'center', outline: 'none',
                  }}
                  onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
                  onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                />
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '8px', padding: '10px 14px', marginBottom: '14px',
                }}>
                  <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0 }}>{error}</p>
                </div>
              )}

              <button onClick={closeShift} disabled={loading} style={{
                width: '100%',
                background: loading ? 'rgba(239,68,68,0.4)' : '#dc2626',
                border: 'none', borderRadius: '12px', padding: '16px',
                color: '#fff', fontSize: '16px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(220,38,38,0.2)',
              }}>
                {loading ? 'Closing shift...' : '🔒 Close shift'}
              </button>

              <button onClick={() => router.push('/pos/sessions')} style={{
                width: '100%', marginTop: '10px',
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.3)', fontSize: '13px',
                cursor: 'pointer', textDecoration: 'underline',
              }}>
                Cancel — go back
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                {Math.abs(variance) < 50 ? '✅' : variance > 0 ? '📈' : '⚠️'}
              </div>
              <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>
                Shift Closed
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>
                Great work {staffName}!
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(13,148,136,0.2)',
              borderRadius: '20px', overflow: 'hidden',
              marginBottom: '16px',
            }}>
              {[
                { label: 'Cash expected',    value: summary.cashExpected,   color: '#fff' },
                ...(summary.cashoutsDeducted > 0 ? [{
                  label: 'Cash-outs deducted', value: -summary.cashoutsDeducted,
                  color: '#c9a84c', prefix: '-',
                }] : []),
                { label: 'Cash declared',    value: summary.cashDeclared,   color: '#fff' },
                { label: 'M-Pesa expected',  value: summary.mpesaExpected,  color: '#fff' },
                { label: 'M-Pesa declared',  value: summary.mpesaDeclared,  color: '#fff' },
                { label: 'Total revenue',    value: summary.total,          color: '#0d9488' },
                { label: 'Variance',
                  value: variance,
                  color: Math.abs(variance) < 50 ? '#10b981' : variance > 0 ? '#0d9488' : '#f87171',
                  prefix: variance > 0 ? '+' : '',
                },
              ].map((row, i, arr) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '12px 16px',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                    {row.label}
                  </span>
                  <span style={{ color: row.color, fontSize: '15px', fontWeight: 700 }}>
                    {row.prefix === '-' ? '-' : row.prefix}KES {Number(Math.abs(row.value) || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <button onClick={signOut} style={{
              width: '100%', background: '#0d9488',
              border: 'none', borderRadius: '12px', padding: '16px',
              color: '#fff', fontSize: '16px', fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(13,148,136,0.3)',
            }}>
              Sign out
            </button>
          </>
        )}
      </div>
    </div>
  )
}
