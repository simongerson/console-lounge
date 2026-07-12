'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SalesPage() {
  const [sessions, setSessions] = useState([])
  const [summary, setSummary]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [staffName, setStaffName] = useState('')
  const router = useRouter()

  useEffect(() => {
    const staffId = localStorage.getItem('cl_staff_id')
    const shiftId = localStorage.getItem('cl_shift_id')
    const name    = localStorage.getItem('cl_staff_name')
    if (!staffId || !shiftId) { router.push('/pos'); return }
    setStaffName(name || 'Staff')
    loadSales(staffId, shiftId)
  }, [])

  async function loadSales(staffId, shiftId) {
    try {
      const res  = await fetch(`/api/sessions/mine?staffId=${staffId}&shiftId=${shiftId}`)
      const data = await res.json()
      setSessions(data.sessions || [])
      setSummary(data.summary || null)
    } catch {}
    setLoading(false)
  }

  const METHOD_LABELS = { cash: 'Cash', mpesa: 'M-Pesa', mpesa_stk: 'M-Pesa', pending: '—' }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0a' }}>
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(13,148,136,0.15)',
        padding: '14px 16px', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: '16px', margin: 0 }}>
              My Sales
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>
              {staffName} — current shift
            </p>
          </div>
          <button onClick={() => router.push('/pos/sessions')} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', padding: '7px 14px',
            color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer',
          }}>
            ← Back
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>
        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px' }}>
            Loading...
          </p>
        ) : (
          <>
            {summary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px' }}>
                {[
                  { label: 'Total', value: summary.total },
                  { label: 'Cash', value: summary.cash },
                  { label: 'M-Pesa', value: summary.mpesa },
                ].map(s => (
                  <div key={s.label} style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', padding: '12px', textAlign: 'center',
                  }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px',
                      fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px' }}>
                      {s.label}
                    </p>
                    <p style={{ color: '#0d9488', fontSize: '16px', fontWeight: 700, margin: 0 }}>
                      KES {Number(s.value || 0).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {sessions.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px' }}>
                No sales recorded yet this shift.
              </p>
            ) : (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px', overflow: 'hidden',
              }}>
                {sessions.map((s, i) => (
                  <div key={s.id} style={{
                    padding: '12px 16px',
                    borderBottom: i < sessions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <p style={{ color: '#fff', fontWeight: 600, fontSize: '13px', margin: '0 0 2px' }}>
                        {s.console_name}
                        {s.customer_name && <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}> — {s.customer_name}</span>}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>
                        {new Date(s.ended_at || s.started_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        {s.status === 'debt' ? 'Debt' : s.status === 'cancelled' ? 'Cancelled' : (METHOD_LABELS[s.payment_method] || s.payment_method)}
                      </p>
                    </div>
                    <span style={{
                      color: s.status === 'cancelled' ? 'rgba(255,255,255,0.3)' : '#0d9488',
                      fontWeight: 700, fontSize: '14px',
                    }}>
                      KES {Number(s.amount || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
