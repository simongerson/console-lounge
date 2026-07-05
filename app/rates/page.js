'use client'
import { useState, useEffect } from 'react'

const PRICING_TYPES = [
  { key: 'time',     label: 'Time Based',  desc: 'Charge per hour or fixed duration' },
  { key: 'per_game', label: 'Per Game',    desc: 'Charge per match/round played' },
  { key: 'both',     label: 'Both',        desc: 'Per game + time combined' },
]

const EMPTY_FORM = {
  name: '', pricingType: 'time', price: '',
  pricePerGame: '', freeAfterGames: '0',
  avgMinutesPerGame: '20', durationMinutes: '',
}

export default function RatesPage() {
  const [rates, setRates]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => { loadRates() }, [])

  async function loadRates() {
    try {
      const res  = await fetch('/api/rates')
      const data = await res.json()
      setRates(data.rates || [])
    } catch {}
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(rate) {
    setEditing(rate.id)
    setForm({
      name:              rate.name,
      pricingType:       rate.pricing_type,
      price:             rate.price || '',
      pricePerGame:      rate.price_per_game || '',
      freeAfterGames:    rate.free_after_games ?? 0,
      avgMinutesPerGame: rate.avg_minutes_per_game || 20,
      durationMinutes:   rate.duration_minutes || '',
    })
    setError('')
    setShowForm(true)
  }

  function describeRate(rate) {
    const parts = []
    if (rate.pricing_type === 'time' || rate.pricing_type === 'both') {
      const dur = rate.duration_minutes ? `${rate.duration_minutes} min` : '/hr'
      parts.push(`KES ${rate.price} / ${dur}`)
    }
    if (rate.pricing_type === 'per_game' || rate.pricing_type === 'both') {
      parts.push(`KES ${rate.price_per_game} / game`)
    }
    if (rate.free_after_games > 0) {
      parts.push(`free after ${rate.free_after_games}`)
    }
    if ((rate.pricing_type === 'per_game' || rate.pricing_type === 'both') && rate.avg_minutes_per_game) {
      parts.push(`~${rate.avg_minutes_per_game} min avg`)
    }
    return parts.join(' · ')
  }

  async function save() {
    if (!form.name.trim()) { setError('Name required'); return }
    if (form.pricingType === 'time' && !form.price) {
      setError('Price required for time-based rates'); return
    }
    if ((form.pricingType === 'per_game' || form.pricingType === 'both') && !form.pricePerGame) {
      setError('Price per game required'); return
    }
    setSaving(true); setError('')

    const body = {
      name:              form.name.trim(),
      pricingType:       form.pricingType,
      price:             Number(form.price) || 0,
      pricePerGame:      Number(form.pricePerGame) || 0,
      freeAfterGames:    Number(form.freeAfterGames) || 0,
      avgMinutesPerGame: Number(form.avgMinutesPerGame) || 20,
      durationMinutes:   form.durationMinutes ? Number(form.durationMinutes) : null,
    }

    try {
      const url    = editing ? `/api/rates/${editing}` : '/api/rates'
      const method = editing ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setSaving(false); return }
      setShowForm(false)
      await loadRates()
    } catch { setError('Connection error') }
    setSaving(false)
  }

  async function toggleActive(rate) {
    await fetch(`/api/rates/${rate.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !rate.is_active }),
    })
    await loadRates()
  }

  const S = {
    page:  { minHeight: '100vh', background: '#0a0a0a', paddingBottom: '40px' },
    hdr:   { background: 'rgba(255,255,255,0.03)',
             borderBottom: '1px solid rgba(13,148,136,0.15)',
             padding: '16px', position: 'sticky', top: 0, zIndex: 10 },
    inner: { maxWidth: '680px', margin: '0 auto' },
    card:  { background: 'rgba(255,255,255,0.04)',
             border: '1px solid rgba(255,255,255,0.08)',
             borderRadius: '14px', overflow: 'hidden', marginBottom: '8px' },
    lbl:   { color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: 600,
             textTransform: 'uppercase', letterSpacing: '1px',
             display: 'block', marginBottom: '6px' },
    inp:   { width: '100%', boxSizing: 'border-box',
             background: 'rgba(255,255,255,0.06)',
             border: '1px solid rgba(255,255,255,0.1)',
             borderRadius: '10px', padding: '11px 14px',
             color: '#fff', fontSize: '14px', outline: 'none' },
    btn:   { background: '#0d9488', border: 'none', borderRadius: '10px',
             padding: '11px 20px', color: '#fff',
             fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  }

  const activeCnt = rates.filter(r => r.is_active).length

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.hdr}>
        <div style={{ ...S.inner, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '18px',
              fontWeight: 700, margin: 0 }}>Game Types</h1>
            <p style={{ color: '#0d9488', fontSize: '12px', margin: '2px 0 0' }}>
              {activeCnt} configured
            </p>
          </div>
          <button onClick={openAdd} style={S.btn}>+ Add Game Type</button>
        </div>
      </div>

      <div style={{ ...S.inner, padding: '16px' }}>

        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.3)',
            textAlign: 'center', padding: '40px' }}>Loading...</p>
        ) : rates.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)',
            textAlign: 'center', padding: '40px' }}>
            No game types yet. Add your first one.
          </p>
        ) : (
          <div style={S.card}>
            {rates.map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderBottom: i < rates.length - 1
                  ? '1px solid rgba(255,255,255,0.05)' : 'none',
                opacity: r.is_active ? 1 : 0.5,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ color: '#fff', fontWeight: 600,
                      fontSize: '14px', margin: 0 }}>{r.name}</p>
                    <span style={{
                      fontSize: '10px', fontWeight: 600, padding: '2px 7px',
                      borderRadius: '20px',
                      background: r.is_active
                        ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)',
                      color: r.is_active ? '#10b981' : 'rgba(255,255,255,0.4)',
                    }}>
                      {r.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: 600, padding: '2px 7px',
                      borderRadius: '20px',
                      background: 'rgba(13,148,136,0.12)',
                      color: '#0d9488',
                    }}>
                      {r.pricing_type === 'time'     ? 'Time Based'
                       : r.pricing_type === 'per_game' ? 'Per Game'
                       : 'Both'}
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.4)',
                    fontSize: '12px', margin: '3px 0 0' }}>
                    {describeRate(r)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => openEdit(r)} style={{
                    background: 'none', border: 'none',
                    color: '#0d9488', fontSize: '13px',
                    fontWeight: 600, cursor: 'pointer', padding: '4px 8px',
                  }}>Edit</button>
                  <button onClick={() => toggleActive(r)} style={{
                    background: 'none', border: 'none',
                    color: r.is_active ? '#f87171' : '#10b981',
                    fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', padding: '4px 8px',
                  }}>
                    {r.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{
            background: '#141414',
            border: '1px solid rgba(13,148,136,0.2)',
            borderRadius: '20px', padding: '28px 24px',
            width: '100%', maxWidth: '420px',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0 }}>
                {editing ? 'Edit Game Type' : 'Add Game Type'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.4)', fontSize: '22px', cursor: 'pointer',
              }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Name */}
              <div>
                <label style={S.lbl}>Name</label>
                <input type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. FC 26"
                  style={S.inp}
                  onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
                  onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Pricing type */}
              <div>
                <label style={S.lbl}>Pricing type</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {PRICING_TYPES.map(pt => (
                    <button key={pt.key}
                      onClick={() => setForm(f => ({ ...f, pricingType: pt.key }))}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                        border: form.pricingType === pt.key
                          ? '1px solid #0d9488'
                          : '1px solid rgba(255,255,255,0.1)',
                        background: form.pricingType === pt.key
                          ? 'rgba(13,148,136,0.12)'
                          : 'rgba(255,255,255,0.04)',
                        textAlign: 'left',
                      }}>
                      <div>
                        <p style={{ color: form.pricingType === pt.key
                          ? '#0d9488' : '#fff',
                          fontSize: '13px', fontWeight: 600, margin: 0 }}>
                          {pt.label}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.35)',
                          fontSize: '11px', margin: '1px 0 0' }}>{pt.desc}</p>
                      </div>
                      {form.pricingType === pt.key && (
                        <span style={{ color: '#0d9488', fontSize: '16px' }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time price */}
              {(form.pricingType === 'time' || form.pricingType === 'both') && (
                <div>
                  <label style={S.lbl}>
                    Price (KSH)
                    {form.pricingType === 'time' && ' — per session/hour'}
                  </label>
                  <input type="number" value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="200"
                    style={S.inp}
                    onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
                    onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                  />
                </div>
              )}

              {/* Per game price */}
              {(form.pricingType === 'per_game' || form.pricingType === 'both') && (
                <div>
                  <label style={S.lbl}>Price per game (KSH)</label>
                  <input type="number" value={form.pricePerGame}
                    onChange={e => setForm(f => ({ ...f, pricePerGame: e.target.value }))}
                    placeholder="50"
                    style={S.inp}
                    onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
                    onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                  />
                </div>
              )}

              {/* Duration (for time-based) */}
              {(form.pricingType === 'time' || form.pricingType === 'both') && (
                <div>
                  <label style={S.lbl}>
                    Duration (minutes) <span style={{ color: 'rgba(255,255,255,0.25)',
                      fontWeight: 400, textTransform: 'none' }}>(blank = open)</span>
                  </label>
                  <input type="number" value={form.durationMinutes}
                    onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))}
                    placeholder="60"
                    style={S.inp}
                    onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
                    onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                  />
                </div>
              )}

              {/* Free after N games */}
              {(form.pricingType === 'per_game' || form.pricingType === 'both') && (
                <div>
                  <label style={S.lbl}>Free game after (0 = none)</label>
                  <input type="number" value={form.freeAfterGames}
                    onChange={e => setForm(f => ({ ...f, freeAfterGames: e.target.value }))}
                    placeholder="0"
                    style={S.inp}
                    onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
                    onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                  />
                </div>
              )}

              {/* Avg minutes per game */}
              {(form.pricingType === 'per_game' || form.pricingType === 'both') && (
                <div>
                  <label style={S.lbl}>Avg. minutes per game</label>
                  <input type="number" value={form.avgMinutesPerGame}
                    onChange={e => setForm(f => ({ ...f, avgMinutesPerGame: e.target.value }))}
                    placeholder="20"
                    style={S.inp}
                    onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
                    onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                  />
                </div>
              )}

              {error && (
                <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0 }}>{error}</p>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={() => setShowForm(false)} style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'none', color: 'rgba(255,255,255,0.4)',
                  fontSize: '14px', cursor: 'pointer',
                }}>Cancel</button>
                <button onClick={save} disabled={saving} style={{
                  ...S.btn, flex: 1, opacity: saving ? 0.5 : 1,
                }}>
                  {saving ? 'Saving...' : editing ? 'Save changes' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}