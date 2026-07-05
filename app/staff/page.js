'use client'
import { useState, useEffect } from 'react'

export default function StaffPage() {
  const [staff, setStaff]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showPin, setShowPin]   = useState(null)
  const [form, setForm]       = useState({ name: '', pin: '', role: 'staff' })
  const [newPin, setNewPin]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => { loadStaff() }, [])

  async function loadStaff() {
    try {
      const res  = await fetch('/api/staff')
      const data = await res.json()
      setStaff(data.staff || [])
    } catch {}
    setLoading(false)
  }

  async function addStaff() {
    if (!form.name.trim() || form.pin.length !== 4) {
      setError('Name and 4-digit PIN required'); return
    }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setSaving(false); return }
      setForm({ name: '', pin: '', role: 'staff' })
      setShowForm(false)
      await loadStaff()
    } catch { setError('Connection error') }
    setSaving(false)
  }

  async function resetPin(id) {
    if (newPin.length !== 4) { setError('PIN must be 4 digits'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPin }),
      })
      if (res.ok) {
        setShowPin(null); setNewPin(''); await loadStaff()
      }
    } catch {}
    setSaving(false)
  }

  async function toggleActive(id, current) {
    await fetch(`/api/staff/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    await loadStaff()
  }

  const S = {
    page:  { minHeight: '100vh', background: '#0a0a0a', paddingBottom: '40px' },
    header:{ background: 'rgba(255,255,255,0.03)',
             borderBottom: '1px solid rgba(13,148,136,0.15)',
             padding: '16px', position: 'sticky', top: 0, zIndex: 10 },
    inner: { maxWidth: '600px', margin: '0 auto' },
    card:  { background: 'rgba(255,255,255,0.04)',
             border: '1px solid rgba(255,255,255,0.08)',
             borderRadius: '16px', overflow: 'hidden', marginBottom: '10px' },
    label: { color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: 600,
             textTransform: 'uppercase', letterSpacing: '1px',
             display: 'block', marginBottom: '6px' },
    input: { width: '100%', boxSizing: 'border-box',
             background: 'rgba(255,255,255,0.06)',
             border: '1px solid rgba(255,255,255,0.1)',
             borderRadius: '10px', padding: '12px 14px',
             color: '#fff', fontSize: '14px', outline: 'none' },
    btn:   { background: '#0d9488', border: 'none', borderRadius: '10px',
             padding: '12px 20px', color: '#fff', fontSize: '14px',
             fontWeight: 600, cursor: 'pointer' },
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ ...S.inner, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '18px',
              fontWeight: 700, margin: 0 }}>Staff</h1>
            <p style={{ color: 'rgba(255,255,255,0.35)',
              fontSize: '12px', margin: 0 }}>
              {staff.filter(s => s.is_active).length} active members
            </p>
          </div>
          <button onClick={() => setShowForm(true)} style={S.btn}>
            + Add staff
          </button>
        </div>
      </div>

      <div style={{ ...S.inner, padding: '16px' }}>

        {/* Add staff form */}
        {showForm && (
          <div style={{
            background: 'rgba(13,148,136,0.06)',
            border: '1px solid rgba(13,148,136,0.2)',
            borderRadius: '16px', padding: '20px', marginBottom: '16px',
          }}>
            <h2 style={{ color: '#fff', fontSize: '16px',
              fontWeight: 600, margin: '0 0 16px' }}>New staff member</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={S.label}>Full name</label>
                <input type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Jane Wanjiru"
                  style={S.input}
                  onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
                  onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                />
              </div>
              <div>
                <label style={S.label}>4-digit PIN</label>
                <input type="password" value={form.pin} maxLength={4}
                  onChange={e => setForm(f => ({
                    ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4)
                  }))}
                  placeholder="••••"
                  style={{ ...S.input, textAlign: 'center',
                    fontSize: '20px', letterSpacing: '6px' }}
                  onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
                  onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                />
              </div>
              <div>
                <label style={S.label}>Role</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['staff', 'manager'].map(r => (
                    <button key={r} onClick={() => setForm(f => ({ ...f, role: r }))}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px',
                        border: form.role === r
                          ? '1px solid #0d9488' : '1px solid rgba(255,255,255,0.1)',
                        background: form.role === r
                          ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.04)',
                        color: form.role === r ? '#0d9488' : 'rgba(255,255,255,0.5)',
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              {error && (
                <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0 }}>{error}</p>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setShowForm(false); setError('') }}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'none', color: 'rgba(255,255,255,0.4)',
                    fontSize: '14px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={addStaff} disabled={saving}
                  style={{ ...S.btn, flex: 1, opacity: saving ? 0.5 : 1 }}>
                  {saving ? 'Saving...' : 'Add staff'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Staff list */}
        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.3)',
            textAlign: 'center', padding: '40px' }}>Loading...</p>
        ) : staff.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)',
            textAlign: 'center', padding: '40px' }}>
            No staff yet. Add your first team member.
          </p>
        ) : staff.map(s => (
          <div key={s.id} style={S.card}>
            <div style={{ padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: s.is_active
                    ? 'rgba(13,148,136,0.2)' : 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: s.is_active ? '#0d9488' : 'rgba(255,255,255,0.3)',
                  fontWeight: 700, fontSize: '16px',
                }}>
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ color: s.is_active ? '#fff' : 'rgba(255,255,255,0.35)',
                    fontWeight: 600, fontSize: '14px', margin: '0 0 2px' }}>
                    {s.name}
                  </p>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 600, padding: '2px 7px',
                      borderRadius: '20px', textTransform: 'capitalize',
                      background: s.role === 'manager'
                        ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.06)',
                      color: s.role === 'manager'
                        ? '#c9a84c' : 'rgba(255,255,255,0.35)',
                    }}>{s.role}</span>
                    {!s.is_active && (
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                        Inactive
                      </span>
                    )}
                    {s.locked_until && new Date(s.locked_until) > new Date() && (
                      <span style={{ fontSize: '10px', color: '#f87171' }}>
                        🔒 Locked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => { setShowPin(s.id); setNewPin(''); setError('') }}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', padding: '6px 12px',
                    color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer',
                  }}>
                  Reset PIN
                </button>
                <button onClick={() => toggleActive(s.id, s.is_active)}
                  style={{
                    background: s.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                    border: `1px solid ${s.is_active ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
                    borderRadius: '8px', padding: '6px 12px',
                    color: s.is_active ? '#f87171' : '#10b981',
                    fontSize: '12px', cursor: 'pointer',
                  }}>
                  {s.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>

            {/* PIN reset inline */}
            {showPin === s.id && (
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                padding: '14px 16px',
                background: 'rgba(13,148,136,0.05)',
              }}>
                <label style={S.label}>New 4-digit PIN for {s.name}</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="password" value={newPin} maxLength={4}
                    onChange={e => setNewPin(e.target.value.replace(/\D/g,'').slice(0,4))}
                    placeholder="••••"
                    style={{ ...S.input, flex: 1, textAlign: 'center',
                      fontSize: '20px', letterSpacing: '6px' }}
                    onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
                    onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                  />
                  <button onClick={() => resetPin(s.id)} disabled={saving}
                    style={{ ...S.btn, opacity: saving ? 0.5 : 1 }}>
                    Save
                  </button>
                  <button onClick={() => { setShowPin(null); setError('') }}
                    style={{ background: 'none',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px', padding: '12px',
                      color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
                {error && (
                  <p style={{ color: '#fca5a5', fontSize: '12px', margin: '6px 0 0' }}>
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}