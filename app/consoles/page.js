'use client'
import { useState, useEffect } from 'react'

const TYPES = ['PS5', 'PS4', 'Xbox', 'PC']

export default function ConsolesPage() {
  const [consoles, setConsoles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [newName, setNewName]   = useState('')
  const [newType, setNewType]   = useState('PS5')
  const [editId, setEditId]     = useState(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving]     = useState(false)

  useEffect(() => { loadConsoles() }, [])

  async function loadConsoles() {
    try {
      const res  = await fetch('/api/consoles')
      const data = await res.json()
      setConsoles(data.consoles || [])
    } catch {}
    setLoading(false)
  }

  async function addConsole() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await fetch('/api/consoles/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, console_type: newType }),
      })
      setNewName('')
      setNewType('PS5')
      setShowAdd(false)
      await loadConsoles()
    } catch {}
    setSaving(false)
  }

  async function saveEdit(id) {
    if (!editName.trim()) return
    setSaving(true)
    try {
      await fetch(`/api/consoles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      })
      setEditId(null)
      await loadConsoles()
    } catch {}
    setSaving(false)
  }

  async function toggleActive(c) {
    await fetch(`/api/consoles/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !c.is_active }),
    })
    await loadConsoles()
  }

  const active = consoles.filter(c => c.is_active).length

  const S = {
    page:  { minHeight: '100vh', background: '#f4f1eb', padding: '28px 32px' },
    inp:   { border: '1px solid #e8e4dc', borderRadius: '8px',
             padding: '8px 14px', fontSize: '14px', color: '#1a1a1a',
             background: '#fff', outline: 'none', width: '100%',
             boxSizing: 'border-box' },
    btn:   { background: '#4a6741', border: 'none', borderRadius: '8px',
             padding: '8px 18px', color: '#fff', fontSize: '14px',
             fontWeight: 500, cursor: 'pointer' },
    ghost: { background: 'none', border: '1px solid #e8e4dc',
             borderRadius: '8px', padding: '8px 18px',
             color: '#1a1a1a', fontSize: '14px', cursor: 'pointer' },
  }

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700,
          color: '#1a1a1a', margin: '0 0 2px' }}>Consoles</h1>
        <p style={{ fontSize: '13px', color: '#8a8780', margin: '0 0 2px' }}>
          {active} active · {consoles.length} total
        </p>
        <p style={{ fontSize: '13px', color: '#8a8780', margin: 0 }}>
          New here?{' '}
          <span style={{ color: '#0d9488', cursor: 'pointer',
            textDecoration: 'underline' }}>
            Read the setup guide →
          </span>
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#8a8780' }}>Loading...</p>
      ) : (
        <div style={{
          background: '#fff', border: '1px solid #e8e4dc',
          borderRadius: '12px', overflow: 'hidden',
          maxWidth: '540px',
        }}>
          {/* Console list */}
          {consoles.map((c, i) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: i < consoles.length - 1 || showAdd
                ? '1px solid #f0ede6' : 'none',
              opacity: c.is_active ? 1 : 0.5,
            }}>
              {editId === c.id ? (
                /* Inline edit */
                <div style={{ display: 'flex', gap: '8px', flex: 1, marginRight: '12px' }}>
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEdit(c.id)
                      if (e.key === 'Escape') setEditId(null)
                    }}
                    style={{ ...S.inp, padding: '5px 10px', fontSize: '13px' }}
                  />
                  <button onClick={() => saveEdit(c.id)} disabled={saving}
                    style={{ ...S.btn, padding: '5px 14px', fontSize: '13px' }}>
                    Save
                  </button>
                  <button onClick={() => setEditId(null)}
                    style={{ ...S.ghost, padding: '5px 14px', fontSize: '13px' }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600,
                      color: '#1a1a1a', margin: '0 0 2px' }}>
                      {c.name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#c9a84c', margin: 0 }}>
                      Monitoring not set up
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 600,
                      color: c.is_active ? '#2d7a4f' : '#8a8780',
                      letterSpacing: '0.5px',
                    }}>
                      {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <button
                      onClick={() => { setEditId(c.id); setEditName(c.name) }}
                      style={{ background: 'none', border: 'none',
                        color: '#0d9488', fontSize: '12px',
                        cursor: 'pointer', padding: '2px 6px' }}>
                      Edit
                    </button>
                    <button onClick={() => toggleActive(c)}
                      style={{ background: 'none', border: 'none',
                        color: c.is_active ? '#c0392b' : '#2d7a4f',
                        fontSize: '12px', cursor: 'pointer', padding: '2px 6px' }}>
                      {c.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add console row */}
          {showAdd ? (
            <div style={{ padding: '14px 20px',
              display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addConsole() }}
                placeholder="Bay name, e.g. Bay 5"
                style={{ ...S.inp, flex: 1 }}
              />
              <select value={newType} onChange={e => setNewType(e.target.value)}
                style={{ ...S.inp, width: 'auto', paddingRight: '28px' }}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <button onClick={addConsole} disabled={saving || !newName.trim()}
                style={{ ...S.btn, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Adding...' : 'Add'}
              </button>
              <button onClick={() => { setShowAdd(false); setNewName('') }}
                style={S.ghost}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ padding: '14px 20px' }}>
              <button onClick={() => setShowAdd(true)} style={{
                background: 'none', border: 'none',
                color: '#0d9488', fontSize: '13px',
                cursor: 'pointer', fontWeight: 500, padding: 0,
              }}>
                + Add console
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer note */}
      <p style={{ fontSize: '12px', color: '#a0a098', marginTop: '16px', maxWidth: '540px' }}>
        Console monitoring is set up from the{' '}
        <span style={{ color: '#0d9488', cursor: 'pointer',
          textDecoration: 'underline' }}>Monitoring</span>{' '}
        page after installing a monitor agent on your lounge PC.
      </p>
    </div>
  )
}