'use client'
import { useState, useEffect } from 'react'

const STATUS_STYLE = {
  pending:  { bg: '#fffbeb', color: '#8a6020', border: '#f0d080' },
  approved: { bg: '#f0faf4', color: '#2d7a4f', border: '#b8dfc8' },
  rejected: { bg: '#fef2f2', color: '#c0392b', border: '#f5c0c0' },
}

export default function CashoutsPage() {
  const [cashouts, setCashouts] = useState([])
  const [summary, setSummary]   = useState({})
  const [date, setDate]         = useState(
    new Date().toISOString().split('T')[0]
  )
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [form, setForm]         = useState({ amount: '', reason: '' })

  useEffect(() => { loadCashouts() }, [date])

  async function loadCashouts() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/cashouts?date=${date}`)
      const data = await res.json()
      setCashouts(data.cashouts || [])
      setSummary(data.summary  || {})
    } catch {}
    setLoading(false)
  }

  async function addCashout() {
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Enter a valid amount'); return
    }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/cashouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(form.amount),
          reason: form.reason,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setSaving(false); return }
      setForm({ amount: '', reason: '' })
      setShowForm(false)
      await loadCashouts()
    } catch { setError('Connection error') }
    setSaving(false)
  }

  async function updateStatus(id, status) {
    await fetch(`/api/cashouts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await loadCashouts()
  }

  async function deleteCashout(id) {
    if (!confirm('Delete this cash out request?')) return
    await fetch(`/api/cashouts/${id}`, { method: 'DELETE' })
    await loadCashouts()
  }

  const S = {
    page:  { minHeight: '100vh', background: '#f4f1eb', padding: '28px 32px' },
    card:  { background: '#fff', border: '1px solid #e8e4dc', borderRadius: '12px' },
    label: { fontSize: '11px', fontWeight: 500, textTransform: 'uppercase',
             letterSpacing: '0.8px', color: '#8a8780',
             display: 'block', marginBottom: '6px' },
    inp:   { width: '100%', boxSizing: 'border-box',
             border: '1px solid #e8e4dc', borderRadius: '8px',
             padding: '10px 14px', fontSize: '14px',
             color: '#1a1a1a', background: '#f9f7f3', outline: 'none' },
    btn:   { background: '#3a5c32', border: 'none', borderRadius: '8px',
             padding: '10px 22px', color: '#fff',
             fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
    ghost: { background: '#fff', border: '1px solid #e8e4dc',
             borderRadius: '8px', padding: '10px 22px',
             color: '#1a1a1a', fontSize: '14px', cursor: 'pointer' },
  }

  const pending = Number(summary.pending || 0)

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700,
            color: '#1a1a1a', margin: '0 0 2px' }}>
            Cash Outs
            {pending > 0 && (
              <span style={{
                marginLeft: '10px', fontSize: '13px', fontWeight: 600,
                background: '#fffbeb', color: '#8a6020',
                border: '1px solid #f0d080', borderRadius: '20px',
                padding: '3px 10px', verticalAlign: 'middle',
              }}>
                {pending} pending review
              </span>
            )}
          </h1>
          <p style={{ fontSize: '13px', color: '#8a8780', margin: 0 }}>
            Staff withdrawals from the till — approve or reject each one
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input type="date" value={date}
            onChange={e => setDate(e.target.value)}
            style={{ ...S.inp, width: 'auto', padding: '8px 12px' }}
          />
          <button onClick={() => { setShowForm(true); setError('') }}
            style={S.btn}>
            + Add Cash Out
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Summary cards */}
        <div style={{ display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {[
            { label: 'Total Amount',
              val: `Ksh ${Number(summary.total || 0).toLocaleString()}`,
              color: '#c0392b' },
            { label: 'Pending',
              val: summary.pending  || 0, color: '#8a6020' },
            { label: 'Approved',
              val: summary.approved || 0, color: '#2d7a4f' },
            { label: 'Rejected',
              val: summary.rejected || 0, color: '#8a8780' },
          ].map(s => (
            <div key={s.label} style={{ ...S.card, padding: '16px 20px' }}>
              <p style={{ ...S.label, marginBottom: '6px' }}>{s.label}</p>
              <p style={{ fontSize: '22px', fontWeight: 700,
                color: s.color, margin: 0 }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Cash outs list */}
        <div style={S.card}>
          <div style={{ padding: '14px 20px',
            borderBottom: '1px solid #f0ede6' }}>
            <p style={{ ...S.label, margin: 0 }}>
              {cashouts.length} request{cashouts.length !== 1 ? 's' : ''} on{' '}
              {new Date(date + 'T12:00:00').toLocaleDateString('en-KE', {
                weekday: 'long', day: 'numeric', month: 'long'
              })}
            </p>
          </div>

          {loading ? (
            <p style={{ color: '#8a8780', textAlign: 'center',
              padding: '40px' }}>Loading...</p>
          ) : cashouts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <p style={{ fontSize: '28px', margin: '0 0 8px' }}>💵</p>
              <p style={{ color: '#8a8780', fontSize: '14px', margin: 0 }}>
                No cash out requests for this date
              </p>
            </div>
          ) : cashouts.map((c, i) => {
            const st = STATUS_STYLE[c.status] || STATUS_STYLE.pending
            return (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '16px 20px',
                borderBottom: i < cashouts.length - 1
                  ? '1px solid #f0ede6' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center',
                  gap: '14px' }}>
                  {/* Amount circle */}
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: '#f4f1eb', display: 'flex',
                    flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '10px', color: '#8a8780' }}>Ksh</span>
                    <span style={{ fontSize: '14px', fontWeight: 700,
                      color: '#c0392b', lineHeight: 1 }}>
                      {Number(c.amount).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600,
                      color: '#1a1a1a', margin: '0 0 2px' }}>
                      {c.staff_name || 'Unknown staff'}
                    </p>
                    {c.reason && (
                      <p style={{ fontSize: '12px', color: '#8a8780',
                        margin: '0 0 2px' }}>{c.reason}</p>
                    )}
                    <p style={{ fontSize: '11px', color: '#b0ada8', margin: 0 }}>
                      {new Date(c.created_at).toLocaleTimeString('en-KE', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Status badge */}
                  <span style={{
                    fontSize: '11px', fontWeight: 600, padding: '4px 10px',
                    borderRadius: '20px', letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    background: st.bg, color: st.color,
                    border: `1px solid ${st.border}`,
                  }}>
                    {c.status}
                  </span>

                  {/* Action buttons — only for pending */}
                  {c.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(c.id, 'approved')}
                        style={{
                          background: '#f0faf4', border: '1px solid #b8dfc8',
                          borderRadius: '8px', padding: '6px 14px',
                          color: '#2d7a4f', fontSize: '13px',
                          fontWeight: 500, cursor: 'pointer',
                        }}>
                        Approve
                      </button>
                      <button onClick={() => updateStatus(c.id, 'rejected')}
                        style={{
                          background: '#fef2f2', border: '1px solid #f5c0c0',
                          borderRadius: '8px', padding: '6px 14px',
                          color: '#c0392b', fontSize: '13px',
                          fontWeight: 500, cursor: 'pointer',
                        }}>
                        Reject
                      </button>
                    </>
                  )}

                  {/* Undo approved/rejected */}
                  {c.status !== 'pending' && (
                    <button onClick={() => updateStatus(c.id, 'pending')}
                      style={{
                        background: 'none', border: 'none',
                        color: '#b0ada8', fontSize: '12px',
                        cursor: 'pointer', padding: '4px',
                      }}>
                      Undo
                    </button>
                  )}

                  <button onClick={() => deleteCashout(c.id)}
                    style={{
                      background: 'none', border: 'none',
                      color: '#d0cdc8', fontSize: '18px',
                      cursor: 'pointer', lineHeight: 1, padding: '2px 4px',
                    }}
                    onMouseOver={e => e.target.style.color = '#c0392b'}
                    onMouseOut={e => e.target.style.color = '#d0cdc8'}>
                    ×
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add cash out modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          zIndex: 50, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '16px',
        }} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{
            background: '#fff', borderRadius: '16px',
            padding: '28px', width: '100%', maxWidth: '380px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700,
              color: '#1a1a1a', margin: '0 0 20px' }}>
              Add Cash Out
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={S.label}>Amount (KSH)</label>
                <input type="number" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0" autoFocus
                  style={{ ...S.inp, fontSize: '28px', fontWeight: 700,
                    textAlign: 'center' }}
                  onFocus={e => e.target.style.border = '1px solid #0d9488'}
                  onBlur={e => e.target.style.border = '1px solid #e8e4dc'}
                />
              </div>
              <div>
                <label style={S.label}>
                  Reason{' '}
                  <span style={{ color: '#b0ada8', fontWeight: 400,
                    textTransform: 'none' }}>(optional)</span>
                </label>
                <input type="text" value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="e.g. Bought printer paper"
                  style={S.inp}
                  onFocus={e => e.target.style.border = '1px solid #0d9488'}
                  onBlur={e => e.target.style.border = '1px solid #e8e4dc'}
                />
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #f0d080',
                borderRadius: '8px', padding: '10px 14px' }}>
                <p style={{ fontSize: '12px', color: '#8a6020', margin: 0 }}>
                  ⚠️ This will be marked as <strong>pending</strong> until the
                  owner approves it. It reduces the expected cash at shift close.
                </p>
              </div>

              {error && (
                <p style={{ color: '#c0392b', fontSize: '13px', margin: 0 }}>
                  {error}
                </p>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button onClick={() => setShowForm(false)} style={S.ghost}>
                  Cancel
                </button>
                <button onClick={addCashout} disabled={saving}
                  style={{ ...S.btn, flex: 1, opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : 'Submit request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}