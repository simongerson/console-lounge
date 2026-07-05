'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function EndSessionContent() {
  const [loading, setSaving]    = useState(false)
  const [payment, setPayment]   = useState('cash')
  const [mpesaRef, setMpesaRef] = useState('')
  const [error, setError]       = useState('')
  const [session, setSession]   = useState(null)
  const router       = useRouter()
  const searchParams = useSearchParams()

  const sessionId   = searchParams.get('sessionId')
  const consoleId   = searchParams.get('consoleId')
  const consoleName = searchParams.get('consoleName') || 'Bay'

  useEffect(() => {
    if (!sessionId) { router.push('/pos/sessions'); return }
    loadSession()
  }, [sessionId])

  async function loadSession() {
    try {
      const res  = await fetch(`/api/sessions/${sessionId}`)
      const data = await res.json()
      if (data.session) setSession(data.session)
    } catch {}
  }

  function timeElapsed(startedAt) {
    if (!startedAt) return '0m'
    const diff = Math.floor((Date.now() - new Date(startedAt)) / 60000)
    if (diff < 60) return `${diff} min`
    return `${Math.floor(diff / 60)}h ${diff % 60}m`
  }

  async function endSession() {
    if (payment === 'mpesa' && mpesaRef.length !== 10) {
      setError('Enter a valid 10-character M-Pesa code'); return
    }
    setSaving(true); setError('')
    try {
      const res  = await fetch('/api/sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId, consoleId,
          paymentMethod: payment,
          mpesaRef: payment === 'mpesa' ? mpesaRef : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setSaving(false); return }
      router.push('/pos/sessions')
    } catch {
      setError('Connection error. Try again.')
      setSaving(false)
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
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>
            End Session
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>
            {consoleName}
          </p>
        </div>

        {/* Session summary card */}
        <div style={{
          background: 'rgba(13,148,136,0.08)',
          border: '1px solid rgba(13,148,136,0.25)',
          borderRadius: '16px', padding: '20px',
          marginBottom: '20px', textAlign: 'center',
        }}>
          {session && (
            <>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 4px' }}>
                Time played
              </p>
              <p style={{ color: '#10b981', fontSize: '32px', fontWeight: 700, margin: '0 0 12px' }}>
                {timeElapsed(session.started_at)}
              </p>
              {session.customer_name && (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 8px' }}>
                  👤 {session.customer_name}
                </p>
              )}
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: '12px', marginTop: '4px',
              }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 4px' }}>
                  Amount charged
                </p>
                <p style={{ color: '#0d9488', fontSize: '28px', fontWeight: 700, margin: 0 }}>
                  KES {Number(session.amount || 0).toLocaleString()}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Payment method */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px',
            fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
            Payment received via
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
            {[
              { key: 'cash',  label: '💵 Cash' },
              { key: 'mpesa', label: '📱 M-Pesa' },
              { key: 'debt',  label: '📋 Debt' },
            ].map(m => (
              <button key={m.key} onClick={() => { setPayment(m.key); setMpesaRef('') }}
                style={{
                  padding: '12px 8px', borderRadius: '10px',
                  border: payment === m.key
                    ? '1px solid #0d9488'
                    : '1px solid rgba(255,255,255,0.1)',
                  background: payment === m.key
                    ? 'rgba(13,148,136,0.15)'
                    : 'rgba(255,255,255,0.04)',
                  color: payment === m.key ? '#0d9488' : 'rgba(255,255,255,0.6)',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* M-Pesa ref */}
        {payment === 'mpesa' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px',
              fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
              M-Pesa confirmation code
            </label>
            <input type="text" value={mpesaRef}
              onChange={e => setMpesaRef(
                e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
              )}
              placeholder="e.g. QHX2K19A3P"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '12px 14px',
                color: '#fff', fontSize: '15px', fontWeight: 600,
                fontFamily: 'monospace', letterSpacing: '2px',
                textAlign: 'center', outline: 'none',
              }}
              onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
              onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
            />
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '8px', padding: '10px 14px', marginBottom: '14px',
          }}>
            <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Buttons */}
        <button onClick={endSession} disabled={loading} style={{
          width: '100%',
          background: loading ? 'rgba(239,68,68,0.4)' : '#dc2626',
          border: 'none', borderRadius: '12px', padding: '16px',
          color: '#fff', fontSize: '16px', fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '10px',
          boxShadow: '0 4px 20px rgba(220,38,38,0.25)',
        }}>
          {loading ? 'Ending session...' : '⏹ End & confirm payment'}
        </button>

        <button onClick={() => router.push('/pos/sessions')} style={{
          width: '100%', background: 'none',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px', padding: '14px',
          color: 'rgba(255,255,255,0.4)', fontSize: '14px',
          cursor: 'pointer',
        }}>
          Cancel — go back
        </button>
      </div>
    </div>
  )
}

export default function EndSessionPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#0a0a0a', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.4)' }}>
        Loading...
      </div>
    }>
      <EndSessionContent />
    </Suspense>
  )
}