'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_STYLE = {
  pending:  { color: '#c9a84c', bg: 'rgba(201,168,76,0.12)' },
  approved: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  rejected: { color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
}

export default function StaffCashoutPage() {
  const [staffId, setStaffId] = useState('')
  const [shiftId, setShiftId] = useState('')
  const [staffName, setStaffName] = useState('')
  const [cashouts, setCashouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const sId = localStorage.getItem('cl_staff_id')
    const shId = localStorage.getItem('cl_shift_id')
    const name = localStorage.getItem('cl_staff_name')
    if (!sId || !shId) { router.push('/pos'); return }
    setStaffId(sId); setShiftId(shId); setStaffName(name || 'Staff')
    loadCashouts(sId, shId)
  }, [])

  async function loadCashouts(sId, shId) {
    try {
      const res  = await fetch(`/api/cashouts/mine?staffId=${sId}&shiftId=${shId}`)
      const data = await res.json()
      setCashouts(data.cashouts || [])
    } catch {}
    setLoading(false)
  }

  async function submitRequest() {
    if (!amount || Number(amount) <= 0) { setError('Enter a valid amount'); return }
    setSaving(true); setError(''); setSuccess(false)
    try {
      const res = await fetch('/api/cashouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, shiftId, amount: Number(amount), reason }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setSaving(false); return }
      setAmount(''); setReason('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
      await loadCashouts(staffId, shiftId)
    } catch { setError('Connection error') }
    setSaving(false)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0a' }}>
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(13,148,136,0.15)',
        padding: '14px 16px', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: '16px', margin: 0 }}>
              Cash Out
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

      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '16px' }}>

        {/* Request form */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(13,148,136,0.2)',
          borderRadius: '16px', padding: '20px', marginBottom: '20px',
        }}>
          <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px',
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
            display: 'block', marginBottom: '8px' }}>
            Amount (KES)
          </label>
          <input type="number" value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '14px',
              color: '#fff', fontSize: '26px', fontWeight: 700,
              textAlign: 'center', outline: 'none', marginBottom: '14px',
            }}
            onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
            onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
          />

          <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px',
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
            display: 'block', marginBottom: '8px' }}>
            Reason <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
          </label>
          <input type="text" value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Bought printer paper"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', padding: '11px 14px',
              color: '#fff', fontSize: '14px', outline: 'none', marginBottom: '14px',
            }}
          />

          <div style={{
            background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)',
            borderRadius: '10px', padding: '10px 12px', marginBottom: '14px',
          }}>
            <p style={{ color: '#c9a84c', fontSize: '12px', margin: 0 }}>
              This will be marked pending until the owner approves it. Approved
              cash-outs reduce the expected cash at your shift close, so you
              won't be flagged for a shortfall.
            </p>
          </div>

          {error && <p style={{ color: '#fca5a5', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
          {success && <p style={{ color: '#10b981', fontSize: '13px', marginBottom: '12px' }}>✅ Request submitted</p>}

          <button onClick={submitRequest} disabled={saving} style={{
            width: '100%', background: saving ? 'rgba(13,148,136,0.4)' : '#0d9488',
            border: 'none', borderRadius: '12px', padding: '14px',
            color: '#fff', fontSize: '15px', fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Submitting...' : 'Submit request'}
          </button>
        </div>

        {/* This shift's requests */}
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px',
          fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
          marginBottom: '8px' }}>
          This Shift's Requests
        </p>

        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px' }}>Loading...</p>
        ) : cashouts.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px' }}>
            No cash-out requests yet this shift.
          </p>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px', overflow: 'hidden',
          }}>
            {cashouts.map((c, i) => {
              const st = STATUS_STYLE[c.status] || STATUS_STYLE.pending
              return (
                <div key={c.id} style={{
                  padding: '12px 16px',
                  borderBottom: i < cashouts.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 600, fontSize: '14px', margin: '0 0 2px' }}>
                      KES {Number(c.amount).toLocaleString()}
                    </p>
                    {c.reason && (
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>
                        {c.reason}
                      </p>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, padding: '4px 10px',
                    borderRadius: '20px', textTransform: 'uppercase',
                    color: st.color, background: st.bg,
                  }}>
                    {c.status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
