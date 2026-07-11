'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function EndSessionContent() {
  const [loading, setSaving]    = useState(false)
  const [payment, setPayment]   = useState('cash')
  const [error, setError]       = useState('')
  const [session, setSession]   = useState(null)
  const [amountCharged, setAmountCharged] = useState('')
  const router       = useRouter()
  const searchParams = useSearchParams()

  const sessionId   = searchParams.get('sessionId')
  const consoleId   = searchParams.get('consoleId')
  const consoleName = searchParams.get('consoleName') || 'Bay'

  const [stkPhone, setStkPhone]           = useState('')
  const [stkStatus, setStkStatus]         = useState('idle')
  const [stkCheckoutId, setStkCheckoutId] = useState(null)

  useEffect(() => {
    if (!sessionId) { router.push('/pos/sessions'); return }
    loadSession()
  }, [sessionId])

async function loadSession() {
  try {
    const res  = await fetch(`/api/sessions/${sessionId}`)
    const data = await res.json()
    if (data.session) {
      setSession(data.session)

      // Use stored amount first, fall back to rate price if 0
      const amount = Number(data.session.amount) > 0
        ? data.session.amount
        : Number(data.session.rate_price) > 0
          ? data.session.rate_price
          : 0

      setAmountCharged(String(amount))
      if (data.session.customer_phone) setStkPhone(data.session.customer_phone)
    }
  } catch {}
}

  function timeElapsed(startedAt) {
    if (!startedAt) return '0m'
    const diff = Math.floor((Date.now() - new Date(startedAt)) / 60000)
    if (diff < 60) return `${diff} min`
    return `${Math.floor(diff / 60)}h ${diff % 60}m`
  }

  function getAmount() {
    return Number(amountCharged) || 0
  }

  async function endSession(paymentMethodOverride, mpesaRefOverride) {
    const method = paymentMethodOverride || payment
    const amount = getAmount()

    if (!amount || amount <= 0) {
      setError('This session has no price set and amount can no longer be edited here. Contact a manager to fix it in the system before ending this session.')
      return
    }

    setSaving(true); setError('')
    try {
      const res  = await fetch('/api/sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId, consoleId,
          paymentMethod: method,
          amount,
          mpesaRef: mpesaRefOverride,
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

  async function endSessionWithSTK() {
    const amount = getAmount()
    if (!amount || amount <= 0) {
      setError('This session has no price set and amount can no longer be edited here. Contact a manager to fix it in the system before ending this session.')
      return
    }
    if (!stkPhone || stkPhone.trim().length < 9) {
      setError("Enter the customer's phone number for the STK push"); return
    }

    setError('')
    setStkStatus('sending')
    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: stkPhone,
          amount,
          accountReference: session?.customer_name || consoleName,
          transactionDesc: `${consoleName} session payment`,
          source: 'session',
          sourceId: sessionId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send STK push')

      setStkCheckoutId(data.checkoutRequestId)
      setStkStatus('pending')
    } catch (err) {
      setError(err.message)
      setStkStatus('idle')
    }
  }

  useEffect(() => {
    if (stkStatus !== 'pending' || !stkCheckoutId) return

    const interval = setInterval(async () => {
      try {
        const res  = await fetch(`/api/mpesa/status/${stkCheckoutId}`)
        const data = await res.json()

        if (data.status === 'success') {
          setStkStatus('success')
          clearInterval(interval)
          await endSession('mpesa_stk', undefined)
        } else if (data.status === 'failed') {
          setStkStatus('failed')
          setError(data.resultDesc || 'Customer did not complete payment')
          clearInterval(interval)
        }
      } catch (err) {
        console.error('Status poll error:', err)
      }
    }, 3000)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      if (stkStatus === 'pending') {
        setStkStatus('failed')
        setError('Payment timed out — customer did not respond in time')
      }
    }, 120000)

    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [stkStatus, stkCheckoutId])

  const stkBusy = stkStatus === 'sending' || stkStatus === 'pending'

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0a0a0a' }}>
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(13,148,136,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.06) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 w-full max-w-sm">

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>
            End Session
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>
            {consoleName}
          </p>
        </div>

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
            </>
          )}
        </div>

        {/* Amount is always locked here now — staff must set the real
            price at session start (enforced there), so there's no
            legitimate case left where it needs editing at checkout.
            This closes the loophole where a zero-priced rate could be
            used to dodge the lock and under-report at end. */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px',
            fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
            Amount to charge (KES)
            <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400,
              textTransform: 'none', marginLeft: '6px' }}>
              — set at session start
            </span>
          </label>

<div style={{
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px', padding: '14px',
  color: 'rgba(13,148,136,0.7)', fontSize: '28px',
  fontWeight: 700, textAlign: 'center',
}}>
  {Number(amountCharged || 0).toLocaleString()}
</div>
{session?.rate_name && (
  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px',
    textAlign: 'center', margin: '6px 0 0' }}>
    {session.rate_name}
  </p>
)}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px',
            fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
            Payment received via
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
            {[
              { key: 'cash',      label: '💵 Cash' },
              { key: 'mpesa_stk', label: '📱 M-Pesa' },
              { key: 'debt',      label: '📋 Debt' },
            ].map(m => (
              <button key={m.key}
                onClick={() => { setPayment(m.key); setError('') }}
                disabled={stkBusy}
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

        {payment === 'mpesa_stk' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px',
              fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
              Customer phone
            </label>
            <input type="text" value={stkPhone}
              onChange={e => setStkPhone(e.target.value)}
              placeholder="e.g. 0712345678"
              disabled={stkBusy}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '12px 14px',
                color: '#fff', fontSize: '15px', outline: 'none',
              }}
              onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
              onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
            />

            {stkStatus === 'pending' && (
              <div style={{
                marginTop: '10px',
                background: 'rgba(201,168,76,0.12)',
                border: '1px solid rgba(201,168,76,0.3)',
                borderRadius: '10px', padding: '10px 12px',
                color: '#c9a84c', fontSize: '13px', fontWeight: 600,
                textAlign: 'center',
              }}>
                Waiting for customer to approve on their phone...
              </div>
            )}

            {stkStatus === 'success' && (
              <div style={{
                marginTop: '10px',
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '10px', padding: '10px 12px',
                color: '#10b981', fontSize: '13px', fontWeight: 600,
                textAlign: 'center',
              }}>
                ✅ Payment received — closing session...
              </div>
            )}
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

        {payment === 'mpesa_stk' ? (
          <button onClick={endSessionWithSTK}
            disabled={stkBusy || stkStatus === 'success'}
            style={{
              width: '100%',
              background: stkBusy ? 'rgba(13,148,136,0.4)' : '#0d9488',
              border: 'none', borderRadius: '12px', padding: '16px',
              color: '#fff', fontSize: '16px', fontWeight: 600,
              cursor: stkBusy ? 'not-allowed' : 'pointer',
              marginBottom: '10px',
              boxShadow: '0 4px 20px rgba(13,148,136,0.25)',
            }}>
            {stkStatus === 'sending' ? 'Sending prompt...'
              : stkStatus === 'pending' ? 'Waiting for customer...'
              : stkStatus === 'success' ? 'Done'
              : '📲 Send STK Push'}
          </button>
        ) : (
          <button onClick={() => endSession()} disabled={loading} style={{
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
        )}

        <button onClick={() => router.push('/pos/sessions')}
          disabled={stkBusy}
          style={{
            width: '100%', background: 'none',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: '14px',
            color: 'rgba(255,255,255,0.4)', fontSize: '14px',
            cursor: stkBusy ? 'not-allowed' : 'pointer',
            opacity: stkBusy ? 0.5 : 1,
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
