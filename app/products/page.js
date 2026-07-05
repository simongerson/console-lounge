'use client'
import { useState, useEffect } from 'react'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [sales, setSales]       = useState([])
  const [tab, setTab]           = useState('catalog')
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState(null)
  const [saving, setSaving]     = useState(false)
  const [form, setForm]         = useState({ name: '', price: '', stock: '' })
  const [error, setError]       = useState('')

  useEffect(() => { loadProducts() }, [])
  useEffect(() => { if (tab === 'sales') loadSales() }, [tab])

  async function loadProducts() {
    try {
      const res  = await fetch('/api/products')
      const data = await res.json()
      setProducts(data.products || [])
    } catch {}
    setLoading(false)
  }

  async function loadSales() {
    try {
      const res  = await fetch('/api/products/sales')
      const data = await res.json()
      setSales(data.sales || [])
    } catch {}
  }

  function openAdd() {
    setEditId(null)
    setForm({ name: '', price: '', stock: '' })
    setError('')
    setShowForm(true)
  }

  function openEdit(p) {
    setEditId(p.id)
    setForm({ name: p.name, price: p.price, stock: p.stock || '' })
    setError('')
    setShowForm(true)
  }

  async function save() {
    if (!form.name.trim() || !form.price) {
      setError('Name and price are required'); return
    }
    setSaving(true); setError('')
    try {
      const url    = editId ? `/api/products/${editId}` : '/api/products'
      const method = editId ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:  form.name.trim(),
          price: Number(form.price),
          stock: form.stock ? Number(form.stock) : null,
        }),
      })
      if (res.ok) { setShowForm(false); await loadProducts() }
    } catch {}
    setSaving(false)
  }

  async function toggleActive(p) {
    await fetch(`/api/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !p.is_active }),
    })
    await loadProducts()
  }

  const S = {
    page:  { minHeight: '100vh', background: '#f4f1eb', padding: '28px 32px' },
    card:  { background: '#fff', border: '1px solid #e8e4dc', borderRadius: '12px' },
    label: { fontSize: '11px', fontWeight: 500, textTransform: 'uppercase',
             letterSpacing: '0.8px', color: '#8a8780',
             display: 'block', marginBottom: '6px' },
    inp:   { width: '100%', boxSizing: 'border-box', border: '1px solid #e8e4dc',
             borderRadius: '8px', padding: '10px 14px', fontSize: '14px',
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
        alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700,
            color: '#1a1a1a', margin: '0 0 2px' }}>Products</h1>
          <p style={{ fontSize: '13px', color: '#0d9488', margin: 0 }}>
            Jersey sales and product catalog
          </p>
        </div>
        <button onClick={openAdd} style={S.btn}>Add Product</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e8e4dc',
        marginBottom: '20px' }}>
        {[
          { key: 'catalog', label: 'Catalog' },
          { key: 'sales',   label: 'Sales History' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 18px', background: 'none', border: 'none',
            fontSize: '14px', fontWeight: tab === t.key ? 600 : 400,
            color: tab === t.key ? '#1a1a1a' : '#8a8780',
            cursor: 'pointer',
            borderBottom: tab === t.key ? '2px solid #1a1a1a' : '2px solid transparent',
            marginBottom: '-1px',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Catalog tab */}
      {tab === 'catalog' && (
        loading ? (
          <p style={{ color: '#8a8780' }}>Loading...</p>
        ) : (
          <div style={{ ...S.card, maxWidth: '600px' }}>
            {products.length === 0 ? (
              <p style={{ color: '#8a8780', textAlign: 'center', padding: '40px' }}>
                No products yet. Add your first one.
              </p>
            ) : products.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: i < products.length - 1
                  ? '1px solid #f0ede6' : 'none',
                opacity: p.is_active ? 1 : 0.5,
              }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600,
                    color: '#1a1a1a', margin: '0 0 2px' }}>{p.name}</p>
                  <p style={{ fontSize: '12px', color: '#0d9488',
                    fontWeight: 500, margin: '0 0 1px' }}>
                    Ksh {Number(p.price).toLocaleString()}
                  </p>
                  {p.stock !== null && (
                    <p style={{ fontSize: '11px', color: '#8a8780', margin: 0 }}>
                      Stock: {p.stock}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, padding: '3px 8px',
                    borderRadius: '4px',
                    background: p.is_active ? '#f0f0ed' : '#fef2f2',
                    color: p.is_active ? '#5a5a52' : '#c0392b',
                    letterSpacing: '0.5px',
                  }}>
                    {p.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <button onClick={() => openEdit(p)} style={{
                    background: 'none', border: 'none',
                    color: '#0d9488', fontSize: '13px',
                    cursor: 'pointer', fontWeight: 500, padding: '2px 4px',
                  }}>Edit</button>
                  <button onClick={() => toggleActive(p)} style={{
                    background: 'none', border: 'none',
                    color: '#c0392b', fontSize: '13px',
                    cursor: 'pointer', fontWeight: 500, padding: '2px 4px',
                  }}>
                    {p.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Sales history tab */}
      {tab === 'sales' && (
        <div style={{ ...S.card, maxWidth: '600px' }}>
          {sales.length === 0 ? (
            <p style={{ color: '#8a8780', textAlign: 'center', padding: '40px' }}>
              No sales recorded yet.
            </p>
          ) : sales.map((s, i) => (
            <div key={s.id} style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '12px 20px',
              borderBottom: i < sales.length - 1
                ? '1px solid #f0ede6' : 'none',
            }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600,
                  color: '#1a1a1a', margin: '0 0 2px' }}>
                  {s.product_name}
                  {s.quantity > 1 && (
                    <span style={{ color: '#8a8780', fontWeight: 400 }}>
                      {' '}× {s.quantity}
                    </span>
                  )}
                </p>
                <p style={{ fontSize: '11px', color: '#8a8780', margin: 0 }}>
                  {s.staff_name} · {new Date(s.created_at).toLocaleString('en-KE', {
                    day: 'numeric', month: 'short',
                    hour: '2-digit', minute: '2-digit',
                  })} · {s.payment_method}
                </p>
              </div>
              <p style={{ fontSize: '14px', fontWeight: 700,
                color: '#1a1a1a', margin: 0 }}>
                Ksh {Number(s.amount).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{
            background: '#fff', borderRadius: '16px',
            padding: '28px 28px 24px', width: '100%', maxWidth: '420px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700,
              color: '#1a1a1a', margin: '0 0 20px' }}>
              {editId ? 'Edit Product' : 'Add Product'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={S.label}>Name</label>
                <input type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="FC26 Jersey"
                  style={S.inp}
                  onFocus={e => e.target.style.border = '1px solid #0d9488'}
                  onBlur={e => e.target.style.border = '1px solid #e8e4dc'}
                />
              </div>
              <div>
                <label style={S.label}>Price (KSH)</label>
                <input type="number" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="500"
                  style={S.inp}
                  onFocus={e => e.target.style.border = '1px solid #0d9488'}
                  onBlur={e => e.target.style.border = '1px solid #e8e4dc'}
                />
              </div>
              <div>
                <label style={S.label}>Stock (optional)</label>
                <input type="number" value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="Leave blank if unlimited"
                  style={S.inp}
                  onFocus={e => e.target.style.border = '1px solid #0d9488'}
                  onBlur={e => e.target.style.border = '1px solid #e8e4dc'}
                />
              </div>
              {error && (
                <p style={{ color: '#c0392b', fontSize: '13px', margin: 0 }}>{error}</p>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button onClick={() => setShowForm(false)} style={S.ghost}>
                  Cancel
                </button>
                <button onClick={save} disabled={saving}
                  style={{ ...S.btn, flex: 1, opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : editId ? 'Save changes' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}