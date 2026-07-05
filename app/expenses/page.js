'use client'
import { useState, useEffect } from 'react'

const CATEGORIES = [
  'Electricity', 'Internet', 'Rent', 'Consumables',
  'Maintenance', 'Staff Meal', 'Transport', 'Other'
]

export default function ExpensesPage() {
  const [expenses, setExpenses]     = useState([])
  const [summary, setSummary]       = useState({})
  const [byCategory, setByCategory] = useState([])
  const [date, setDate]             = useState(
    new Date().toISOString().split('T')[0]
  )
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [form, setForm]             = useState({
    category: '', description: '', amount: '', custom: false
  })

  useEffect(() => { loadExpenses() }, [date])

  async function loadExpenses() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/expenses?date=${date}`)
      const data = await res.json()
      setExpenses(data.expenses   || [])
      setSummary(data.summary     || {})
      setByCategory(data.byCategory || [])
    } catch {}
    setLoading(false)
  }

  async function addExpense() {
    const cat = form.custom ? form.customCategory : form.category
    if (!cat || !form.amount) {
      setError('Category and amount are required'); return
    }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category:    cat.trim(),
          description: form.description,
          amount:      Number(form.amount),
          date,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setSaving(false); return }
      setForm({ category: '', description: '', amount: '', custom: false })
      setShowForm(false)
      await loadExpenses()
    } catch { setError('Connection error') }
    setSaving(false)
  }

  async function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return
    await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' })
    await loadExpenses()
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

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700,
            color: '#1a1a1a', margin: '0 0 2px' }}>Expenses</h1>
          <p style={{ fontSize: '13px', color: '#8a8780', margin: 0 }}>
            Track daily running costs — reduces your profit card
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input type="date" value={date}
            onChange={e => setDate(e.target.value)}
            style={{ ...S.inp, width: 'auto', padding: '8px 12px' }}
          />
          <button onClick={() => { setShowForm(true); setError('') }}
            style={S.btn}>
            + Add Expense
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Summary cards */}
        <div style={{ display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { label: 'Total Expenses',
              val: `Ksh ${Number(summary.total || 0).toLocaleString()}`,
              color: '#c0392b' },
            { label: 'No. of Entries',
              val: summary.count || 0, color: '#1a1a1a' },
            { label: 'Top Category',
              val: byCategory[0]?.category || '—', color: '#1a1a1a' },
          ].map(s => (
            <div key={s.label} style={{ ...S.card, padding: '16px 20px' }}>
              <p style={{ ...S.label, marginBottom: '6px' }}>{s.label}</p>
              <p style={{ fontSize: '22px', fontWeight: 700,
                color: s.color, margin: 0 }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* By category breakdown */}
        {byCategory.length > 0 && (
          <div style={{ ...S.card, padding: '16px 20px' }}>
            <p style={{ ...S.label, marginBottom: '12px' }}>By Category</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {byCategory.map(c => (
                <div key={c.category} style={{
                  background: '#f4f1eb', borderRadius: '8px',
                  padding: '8px 14px', display: 'flex',
                  alignItems: 'center', gap: '8px',
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 600,
                    color: '#1a1a1a' }}>{c.category}</span>
                  <span style={{ fontSize: '13px', color: '#c0392b',
                    fontWeight: 500 }}>
                    Ksh {Number(c.total).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '11px', color: '#8a8780' }}>
                    ({c.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses list */}
        <div style={S.card}>
          <div style={{ padding: '14px 20px',
            borderBottom: '1px solid #f0ede6' }}>
            <p style={{ ...S.label, margin: 0 }}>
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''} on{' '}
              {new Date(date + 'T12:00:00').toLocaleDateString('en-KE', {
                weekday: 'long', day: 'numeric', month: 'long'
              })}
            </p>
          </div>

          {loading ? (
            <p style={{ color: '#8a8780', textAlign: 'center',
              padding: '40px' }}>Loading...</p>
          ) : expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <p style={{ fontSize: '28px', margin: '0 0 8px' }}>📋</p>
              <p style={{ color: '#8a8780', fontSize: '14px', margin: 0 }}>
                No expenses recorded for this date
              </p>
            </div>
          ) : expenses.map((e, i) => (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '14px 20px',
              borderBottom: i < expenses.length - 1
                ? '1px solid #f0ede6' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: '#f4f1eb', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', flexShrink: 0,
                }}>
                  {e.category === 'Electricity' ? '⚡'
                    : e.category === 'Internet' ? '📶'
                    : e.category === 'Rent' ? '🏠'
                    : e.category === 'Maintenance' ? '🔧'
                    : e.category === 'Staff Meal' ? '🍽️'
                    : e.category === 'Transport' ? '🚗'
                    : e.category === 'Consumables' ? '🛒' : '📌'}
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600,
                    color: '#1a1a1a', margin: '0 0 2px' }}>
                    {e.category}
                  </p>
                  {e.description && (
                    <p style={{ fontSize: '12px', color: '#8a8780', margin: '0 0 1px' }}>
                      {e.description}
                    </p>
                  )}
                  <p style={{ fontSize: '11px', color: '#b0ada8', margin: 0 }}>
                    {new Date(e.created_at).toLocaleTimeString('en-KE', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                    {e.staff_name && ` · ${e.staff_name}`}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <p style={{ fontSize: '16px', fontWeight: 700,
                  color: '#c0392b', margin: 0 }}>
                  Ksh {Number(e.amount).toLocaleString()}
                </p>
                <button onClick={() => deleteExpense(e.id)} style={{
                  background: 'none', border: 'none',
                  color: '#d0cdc8', fontSize: '16px',
                  cursor: 'pointer', lineHeight: 1, padding: '2px 4px',
                }}
                  onMouseOver={e => e.target.style.color = '#c0392b'}
                  onMouseOut={e => e.target.style.color = '#d0cdc8'}>
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add expense modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          zIndex: 50, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '16px',
        }} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{
            background: '#fff', borderRadius: '16px',
            padding: '28px', width: '100%', maxWidth: '420px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700,
              color: '#1a1a1a', margin: '0 0 20px' }}>
              Add Expense
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Category pills */}
              <div>
                <label style={S.label}>Category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px',
                  marginBottom: '8px' }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat}
                      onClick={() => setForm(f => ({
                        ...f, category: cat, custom: false
                      }))}
                      style={{
                        padding: '6px 12px', borderRadius: '20px', border: 'none',
                        cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                        background: form.category === cat && !form.custom
                          ? '#3a5c32' : '#f4f1eb',
                        color: form.category === cat && !form.custom
                          ? '#fff' : '#5a5a52',
                      }}>
                      {cat}
                    </button>
                  ))}
                  <button
                    onClick={() => setForm(f => ({
                      ...f, custom: true, category: ''
                    }))}
                    style={{
                      padding: '6px 12px', borderRadius: '20px', border: 'none',
                      cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                      background: form.custom ? '#3a5c32' : '#f4f1eb',
                      color: form.custom ? '#fff' : '#5a5a52',
                    }}>
                    + Custom
                  </button>
                </div>
                {form.custom && (
                  <input type="text"
                    value={form.customCategory || ''}
                    onChange={e => setForm(f => ({
                      ...f, customCategory: e.target.value
                    }))}
                    placeholder="Enter category name"
                    autoFocus
                    style={S.inp}
                    onFocus={e => e.target.style.border = '1px solid #0d9488'}
                    onBlur={e => e.target.style.border = '1px solid #e8e4dc'}
                  />
                )}
              </div>

              {/* Description */}
              <div>
                <label style={S.label}>
                  Description{' '}
                  <span style={{ color: '#b0ada8', fontWeight: 400,
                    textTransform: 'none' }}>(optional)</span>
                </label>
                <input type="text" value={form.description}
                  onChange={e => setForm(f => ({
                    ...f, description: e.target.value
                  }))}
                  placeholder="e.g. Monthly electricity bill"
                  style={S.inp}
                  onFocus={e => e.target.style.border = '1px solid #0d9488'}
                  onBlur={e => e.target.style.border = '1px solid #e8e4dc'}
                />
              </div>

              {/* Amount */}
              <div>
                <label style={S.label}>Amount (KSH)</label>
                <input type="number" value={form.amount}
                  onChange={e => setForm(f => ({
                    ...f, amount: e.target.value
                  }))}
                  placeholder="0"
                  style={{ ...S.inp, fontSize: '22px', fontWeight: 700,
                    textAlign: 'center' }}
                  onFocus={e => e.target.style.border = '1px solid #0d9488'}
                  onBlur={e => e.target.style.border = '1px solid #e8e4dc'}
                />
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
                <button onClick={addExpense} disabled={saving}
                  style={{ ...S.btn, flex: 1, opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : 'Add expense'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}