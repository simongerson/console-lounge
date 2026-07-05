'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ShiftOpenPage() {
  const [staffName, setStaffName] = useState('')
  const [staffId, setStaffId]     = useState('')
  const [float, setFloat]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const router = useRouter()

  useEffect(() => {
    const id   = localStorage.getItem('cl_staff_id')
    const name = localStorage.getItem('cl_staff_name')
    if (!id) { router.push('/pos'); return }
    setStaffId(id)
    setStaffName(name || 'Staff')
  }, [])

  async function openShift() {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/shifts/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, floatAmount: Number(float) || 0 }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setLoading(false); return }
      localStorage.setItem('cl_shift_id', data.shiftId)
      router.push('/pos/sessions')
    } catch {
      setError('Connection error. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0a0a0a' }}>
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(13,148,136,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.06) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24"
              stroke="white" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>
            Open Shift
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>
            Hi {staffName} — declare your opening float
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(13,148,136,0.2)',
          borderRadius: '20px', padding: '28px 24px',
        }}>
          <label style={{
            display: 'block', color: 'rgba(255,255,255,0.45)',
            fontSize: '11px', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '1px',
            marginBottom: '8px',
          }}>
            Opening float (KES)
          </label>

          <input
            type="number" value={float}
            onChange={e => setFloat(e.target.value)}
            placeholder="0"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '16px',
              color: '#fff', fontSize: '28px',
              fontWeight: 700, textAlign: 'center',
              outline: 'none', marginBottom: '8px',
            }}
            onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
            onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
          />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px',
            textAlign: 'center', marginBottom: '24px' }}>
            Enter 0 if no cash in till
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
            }}>
              <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0 }}>{error}</p>
            </div>
          )}

          <button onClick={openShift} disabled={loading} style={{
            width: '100%', background: loading ? 'rgba(13,148,136,0.4)' : '#0d9488',
            border: 'none', borderRadius: '12px', padding: '16px',
            color: '#fff', fontSize: '16px', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 20px rgba(13,148,136,0.3)',
          }}>
            {loading ? 'Opening shift...' : '🕐 Start shift'}
          </button>
        </div>

        {/* Today's date */}
        <p style={{
          textAlign: 'center', color: 'rgba(255,255,255,0.2)',
          fontSize: '12px', marginTop: '16px',
        }}>
          {new Date().toLocaleDateString('en-KE', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
          })}
        </p>
      </div>
    </div>
  )
}