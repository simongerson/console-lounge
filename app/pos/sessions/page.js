'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SessionsPage() {
  const [consoles, setConsoles]   = useState([])
  const [rates, setRates]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [staffName, setStaffName] = useState('')
  const [staffId, setStaffId]     = useState('')
  const [shiftId, setShiftId]     = useState('')
  const [showStart, setShowStart] = useState(false)
  const [selected, setSelected]   = useState(null)
  const [form, setForm]           = useState({
    rateId: '', customAmount: '',
    customerName: '', customerPhone: '', notes: ''
  })
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const router = useRouter()

  useEffect(() => {
    const id    = localStorage.getItem('cl_staff_id')
    const name  = localStorage.getItem('cl_staff_name')
    const shift = localStorage.getItem('cl_shift_id')
    if (!id || !shift) { router.push('/pos'); return }
    setStaffId(id)
    setStaffName(name || 'Staff')
    setShiftId(shift)
    loadData()
  }, [])

  useEffect(() => {
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    try {
      const [cRes, rRes] = await Promise.all([
        fetch('/api/consoles'),
        fetch('/api/rates'),
      ])
      const [cData, rData] = await Promise.all([cRes.json(), rRes.json()])
      setConsoles(cData.consoles || [])
      setRates(rData.rates || [])
    } catch {}
    setLoading(false)
  }

  function openStartModal(console_) {
    setSelected(console_)
    setForm({
      rateId: rates[0]?.id || '', customAmount: '',
      customerName: '', customerPhone: '', notes: ''
    })
    setError('')
    setShowStart(true)
  }

  function getAmount() {
    if (form.rateId === 'custom') return Number(form.customAmount) || 0
    const rate = rates.find(r => r.id === form.rateId)
    return rate ? Number(rate.price) : 0
  }

  async function startSession() {
    if (!form.rateId) { setError('Select a rate'); return }
    const amount = getAmount()
    if (form.rateId === 'custom' && !amount) {
      setError('Enter an amount'); return
    }
    setSaving(true); setError('')
    try {
      const rate = rates.find(r => r.id === form.rateId)
      const res  = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consoleId:     selected.id,
          staffId, shiftId,
          rateId:        form.rateId === 'custom' ? null : form.rateId,
          rateName:      rate?.name || 'Custom',
          amount,
          customerName:  form.customerName || null,
          customerPhone: form.customerPhone || null,
          notes:         form.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setSaving(false); return }
      setShowStart(false)
      await loadData()
    } catch {
      setError('Connection error')
    }
    setSaving(false)
  }

  async function forceCloseConsole(consoleId, consoleName) {
    if (!confirm(`Force close ${consoleName}? Use this only if the bay is stuck and won't end normally.`)) return
    try {
      await fetch(`/api/consoles/${consoleId}/force-close`, { method: 'POST' })
      await loadData()
    } catch {
      alert('Failed to force close. Try again or check the console directly.')
    }
  }

  function timeElapsed(startedAt) {
    if (!startedAt) return '0m'
    const diff = Math.floor((Date.now() - new Date(startedAt)) / 60000)
    if (diff < 60) return `${diff}m`
    return `${Math.floor(diff / 60)}h ${diff % 60}m`
  }

  const active = consoles.filter(c => c.status === 'active').length
  const open   = consoles.filter(c => c.status === 'open').length

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0a' }}>

      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(13,148,136,0.15)',
        padding: '14px 16px',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
                <path d="M7 10h2v2H7v2H5v-2H3v-2h2V8h2v2zm11.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-3 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM17 5H7C4.24 5 2 7.24 2 10v4c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5v-4c0-2.76-2.24-5-5-5z"/>
              </svg>
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: '14px', margin: 0 }}>
                {staffName}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>
                {active} playing · {open} open
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/pos/shift-close')}
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px', padding: '7px 14px',
              color: '#f87171', fontSize: '13px',
              fontWeight: 600, cursor: 'pointer',
            }}>
            End shift
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: '60px', color: 'rgba(255,255,255,0.3)' }}>
            Loading consoles...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
          }}>
            {consoles.map(c => {
              const isActive = c.status === 'active'
              return (
                <div key={c.id}
                  onClick={() => !isActive && openStartModal(c)}
                  style={{
                    background: isActive
                      ? 'rgba(13,148,136,0.08)'
                      : 'rgba(255,255,255,0.04)',
                    border: isActive
                      ? '1px solid rgba(13,148,136,0.35)'
                      : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '16px',
                    cursor: isActive ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                  }}>

                  <div style={{ display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: '10px' }}>
                    <p style={{ color: '#fff', fontWeight: 700,
                      fontSize: '15px', margin: 0 }}>
                      {c.name}
                    </p>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: isActive ? '#10b981' : 'rgba(255,255,255,0.2)',
                      boxShadow: isActive ? '0 0 6px #10b981' : 'none',
                    }} />
                  </div>

                  <p style={{
                    color: 'rgba(255,255,255,0.4)', fontSize: '11px',
                    margin: '0 0 10px', fontWeight: 500,
                  }}>
                    {c.console_type}
                  </p>

                  {isActive ? (
                    <>
                      <div style={{
                        background: 'rgba(16,185,129,0.08)',
                        borderRadius: '8px', padding: '8px 10px',
                        marginBottom: '10px',
                      }}>
                        <p style={{ color: '#10b981', fontSize: '12px',
                          fontWeight: 600, margin: '0 0 2px' }}>
                          ▶ {timeElapsed(c.started_at)}
                        </p>
                        {c.rate_name && (
                          <p style={{ color: 'rgba(255,255,255,0.4)',
                            fontSize: '11px', margin: 0 }}>
                            {c.rate_name}
                          </p>
                        )}
                        {c.customer_name && (
                          <p style={{ color: 'rgba(255,255,255,0.4)',
                            fontSize: '11px', margin: 0 }}>
                            👤 {c.customer_name}
                          </p>
                        )}
                      </div>
                      <p style={{ color: '#0d9488', fontSize: '14px',
                        fontWeight: 700, margin: 0 }}>
                        KES {Number(c.session_amount || 0).toLocaleString()}
                      </p>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          router.push(`/pos/sessions/end?sessionId=${c.session_id}&consoleId=${c.id}&consoleName=${encodeURIComponent(c.name)}`)
                        }}
                        style={{
                          width: '100%', marginTop: '10px',
                          background: 'rgba(239,68,68,0.15)',
                          border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: '8px', padding: '8px',
                          color: '#f87171', fontSize: '12px',
                          fontWeight: 600, cursor: 'pointer',
                        }}>
                        End session
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          forceCloseConsole(c.id, c.name)
                        }}
                        style={{
                          width: '100%', marginTop: '6px',
                          background: 'none',
                          border: 'none',
                          padding: '4px',
                          color: 'rgba(255,255,255,0.25)', fontSize: '10px',
                          cursor: 'pointer', textAlign: 'center',
                        }}>
                        Stuck? Force close
                      </button>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', paddingTop: '8px' }}>
                      <p style={{ color: 'rgba(255,255,255,0.25)',
                        fontSize: '12px', margin: '0 0 8px' }}>
                        Available
                      </p>
                      <div style={{
                        background: 'rgba(13,148,136,0.15)',
                        borderRadius: '8px', padding: '8px',
                        color: '#0d9488', fontSize: '12px', fontWeight: 600,
                      }}>
                        + Start session
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Start session modal — no payment step, that's all at End Session now */}
      {showStart && selected && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)', zIndex: 50,
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'center',
        }}
          onClick={e => e.target === e.currentTarget && setShowStart(false)}>
          <div style={{
            background: '#141414',
            border: '1px solid rgba(13,148,136,0.2)',
            borderRadius: '20px 20px 0 0',
            padding: '24px 20px 32px',
            width: '100%', maxWidth: '500px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ color: '#fff', fontSize: '18px',
                  fontWeight: 700, margin: 0 }}>
                  {selected.name}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.35)',
                  fontSize: '12px', margin: 0 }}>
                  {selected.console_type} · Start new session
                </p>
              </div>
              <button onClick={() => setShowStart(false)} style={{
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.4)', fontSize: '22px', cursor: 'pointer',
              }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px',
                  fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                  Rate
                </label>
                <div style={{ display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {rates.map(r => (
                    <button key={r.id}
                      onClick={() => setForm(f => ({ ...f, rateId: r.id }))}
                      style={{
                        padding: '10px 6px', borderRadius: '10px',
                        border: form.rateId === r.id
                          ? '1px solid #0d9488'
                          : '1px solid rgba(255,255,255,0.1)',
                        background: form.rateId === r.id
                          ? 'rgba(13,148,136,0.15)'
                          : 'rgba(255,255,255,0.04)',
                        color: form.rateId === r.id ? '#0d9488' : 'rgba(255,255,255,0.7)',
                        fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                        textAlign: 'center',
                      }}>
                      <div>{r.name}</div>
                      <div style={{ fontSize: '13px', marginTop: '2px',
                        color: form.rateId === r.id ? '#0d9488' : '#fff' }}>
                        {r.price > 0 ? `KES ${r.price}` : 'Manual'}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => setForm(f => ({ ...f, rateId: 'custom' }))}
                    style={{
                      padding: '10px 6px', borderRadius: '10px',
                      border: form.rateId === 'custom'
                        ? '1px solid #0d9488'
                        : '1px solid rgba(255,255,255,0.1)',
                      background: form.rateId === 'custom'
                        ? 'rgba(13,148,136,0.15)'
                        : 'rgba(255,255,255,0.04)',
                      color: form.rateId === 'custom' ? '#0d9488' : 'rgba(255,255,255,0.7)',
                      fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    }}>
                    <div>Custom</div>
                    <div style={{ fontSize: '13px', marginTop: '2px' }}>Amount</div>
                  </button>
                </div>
              </div>

              {form.rateId === 'custom' && (
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px',
                    fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                    Amount (KES)
                  </label>
                  <input type="number" value={form.customAmount}
                    onChange={e => setForm(f => ({ ...f, customAmount: e.target.value }))}
                    placeholder="0"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px', padding: '12px 14px',
                      color: '#fff', fontSize: '18px',
                      fontWeight: 700, outline: 'none',
                    }}
                    onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
                    onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                  />
                </div>
              )}

              <div>
                <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px',
                  fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                  Customer name <span style={{ color: 'rgba(255,255,255,0.25)',
                    fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                </label>
                <input type="text" value={form.customerName}
                  onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                  placeholder="e.g. John"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', padding: '11px 14px',
                    color: '#fff', fontSize: '14px', outline: 'none',
                  }}
                  onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
                  onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                />
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px',
                  fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                  Customer phone <span style={{ color: 'rgba(255,255,255,0.25)',
                    fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                </label>
                <input type="text" value={form.customerPhone}
                  onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                  placeholder="e.g. 0712345678"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', padding: '11px 14px',
                    color: '#fff', fontSize: '14px', outline: 'none',
                  }}
                  onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
                  onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                />
              </div>

              {error && (
                <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0 }}>{error}</p>
              )}

              <div style={{
                background: 'rgba(13,148,136,0.08)',
                border: '1px solid rgba(13,148,136,0.2)',
                borderRadius: '12px', padding: '12px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                  Total
                </span>
                <span style={{ color: '#0d9488', fontSize: '20px', fontWeight: 700 }}>
                  KES {getAmount().toLocaleString()}
                </span>
              </div>

              <button onClick={startSession} disabled={saving} style={{
                width: '100%',
                background: saving ? 'rgba(13,148,136,0.4)' : '#0d9488',
                border: 'none', borderRadius: '12px', padding: '16px',
                color: '#fff', fontSize: '16px', fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(13,148,136,0.3)',
              }}>
                {saving ? 'Starting...' : '▶ Start session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
