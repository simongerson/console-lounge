'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PosDebtsPage() {
  const [debts, setDebts]     = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [staffId, setStaffId] = useState('')
  const [shiftId, setShiftId] = useState('')
  const [staffName, setStaffName] = useState('')
  const [selectedDebt, setSelectedDebt] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [stkPhone, setStkPhone] = useState('')
  const [stkStatus, setStkStatus] = useState('idle')
  const [stkCheckoutId, setStkCheckoutId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const sId = localStorage.getItem('cl_staff_id')
    const shId = localStorage.getItem('cl_shift_id')
    const name = localStorage.getItem('cl_staff_name')
    if (!sId || !shId) { router.push('/pos'); return }
    setStaffId(sId); setShiftId(shId); setStaffName(name || 'Staff')
    loadDebts(sId, shId)
  }, [])

  async function loadDebts(sId, shId) {
    try {
      const res  = await fetch(`/api/debts/mine?staffId=${sId}&shiftId=${shId}`)
      const data = await res.json()
      setDebts(data.debts || [])
      setSummary(data.summary || null)
    } catch {}
    setLoading(false)
  }

  function openPayment(debt) {
    setSelectedDebt(debt)
    setPaymentAmount(String(debt.amount - debt.amount_paid))
    setPaymentMethod('cash')
    setStkPhone(debt.customer_phone || '')
    setStkStatus('idle')
    setStkCheckoutId(null)
    setError('')
  }

  function closeModal() {
    setSelectedDebt(null)
    setStkStatus('idle')
    setStkCheckoutId(null)
  }

  async function submitCashPayment() {
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) { setError('Enter a valid amount'); return }
    setSubmitting(true); setError('')
    try {
      const res = await fetch(`/api/debts/${selectedDebt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountPaid: amount, paymentMethod: 'cash', mpesaRef: null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setSubmitting(false); return }
      closeModal()
      loadDebts(staffId, shiftId)
    } catch { setError('Connection error') }
    setSubmitting(false)
  }

  async function triggerSTKPush() {
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) { setError('Enter a valid amount'); return }
    if (!stkPhone || stkPhone.trim().length < 9) { setError('Enter a valid phone number'); return }

    setError('')
    setStkStatus('sending')
    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: stkPhone, amount,
          accountReference: selectedDebt.customer_name || 'Debt Payment',
          transactionDesc: `Debt payment - ${selectedDebt.customer_name || 'customer'}`,
          source: 'debt', sourceId: selectedDebt.id,
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
          setTimeout(() => { closeModal(); loadDebts(staffId, shiftId) }, 1500)
        } else if (data.status === 'failed') {
          setStkStatus('failed')
          setError(data.resultDesc || 'Payment not completed')
          clearInterval(interval)
        }
      } catch {}
    }, 3000)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      if (stkStatus === 'pending') {
        setStkStatus('failed')
        setError('Payment timed out')
      }
    }, 120000)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [stkStatus, stkCheckoutId])

  const stkBusy = stkStatus === 'sending' || stkStatus === 'pending'

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0a' }}>
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(13,148,136,0.15)',
        padding: '14px 16px', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: '16px', margin: 0 }}>
              My Debts
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>
              {staffName} — current shift
            </p>
          </div>
          <button onClick={() => router.push('/pos/sessions')} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', padding: '7px 14px',
            color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer',
          }}>
            ← Back
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>
        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px' }}>Loading...</p>
        ) : (
          <>
            {summary && (
              <div style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '14px', padding: '16px', marginBottom: '16px', textAlign: 'center',
              }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px',
                  textTransform: 'uppercase', fontWeight: 600, margin: '0 0 4px' }}>
                  Outstanding
                </p>
                <p style={{ color: '#f87171', fontSize: '26px', fontWeight: 700, margin: 0 }}>
                  KES {Number(summary.totalOutstanding || 0).toLocaleString()}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '4px 0 0' }}>
                  {summary.count} debt{summary.count !== 1 ? 's' : ''} from this shift
                </p>
              </div>
            )}

            {debts.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px' }}>
                No debts from this shift.
              </p>
            ) : (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px', overflow: 'hidden',
              }}>
                {debts.map((d, i) => (
                  <div key={d.id} style={{
                    padding: '14px 16px',
                    borderBottom: i < debts.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <p style={{ color: '#fff', fontWeight: 600, fontSize: '13px', margin: '0 0 2px' }}>
                        {d.customer_name || 'Unknown'}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>
                        {d.status} · KES {Number(d.amount_paid).toLocaleString()} of {Number(d.amount).toLocaleString()} paid
                      </p>
                    </div>
                    {d.status !== 'cleared' && (
                      <button onClick={() => openPayment(d)} style={{
                        background: '#0d9488', border: 'none', borderRadius: '8px',
                        padding: '8px 14px', color: '#fff', fontSize: '12px',
                        fontWeight: 600, cursor: 'pointer',
                      }}>
                        Collect
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selectedDebt && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
          <div style={{
            background: '#141414', border: '1px solid rgba(13,148,136,0.2)',
            borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '360px',
          }}>
            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 4px' }}>
              Collect payment
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 16px' }}>
              {selectedDebt.customer_name} — balance KES {(selectedDebt.amount - selectedDebt.amount_paid).toLocaleString()}
            </p>

            <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px',
              fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Amount
            </label>
            <input type="number" value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              disabled={stkBusy}
              style={{
                width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px',
                color: '#fff', fontSize: '16px', marginBottom: '12px', outline: 'none',
              }}
            />

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {['cash', 'mpesa_stk'].map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)} disabled={stkBusy}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px',
                    border: paymentMethod === m ? '1px solid #0d9488' : '1px solid rgba(255,255,255,0.1)',
                    background: paymentMethod === m ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.04)',
                    color: paymentMethod === m ? '#0d9488' : 'rgba(255,255,255,0.6)',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  }}>
                  {m === 'cash' ? 'Cash' : 'M-Pesa'}
                </button>
              ))}
            </div>

            {paymentMethod === 'mpesa_stk' && (
              <>
                <input type="text" value={stkPhone}
                  onChange={e => setStkPhone(e.target.value)}
                  placeholder="e.g. 0712345678"
                  disabled={stkBusy}
                  style={{
                    width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px',
                    color: '#fff', fontSize: '14px', marginBottom: '12px', outline: 'none',
                  }}
                />
                {stkStatus === 'pending' && (
                  <p style={{ color: '#c9a84c', fontSize: '12px', textAlign: 'center', marginBottom: '12px' }}>
                    Waiting for customer to approve...
                  </p>
                )}
                {stkStatus === 'success' && (
                  <p style={{ color: '#10b981', fontSize: '12px', textAlign: 'center', marginBottom: '12px' }}>
                    ✅ Payment received
                  </p>
                )}
              </>
            )}

            {error && <p style={{ color: '#fca5a5', fontSize: '12px', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={closeModal} disabled={stkBusy}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'none',
                  color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer',
                }}>
                Cancel
              </button>
              <button
                onClick={paymentMethod === 'mpesa_stk' ? triggerSTKPush : submitCashPayment}
                disabled={submitting || stkBusy || stkStatus === 'success'}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                  background: '#0d9488', color: '#fff', fontSize: '13px',
                  fontWeight: 600, cursor: 'pointer',
                }}>
                {paymentMethod === 'mpesa_stk'
                  ? (stkStatus === 'sending' ? 'Sending...' : stkStatus === 'pending' ? 'Waiting...' : 'Send STK Push')
                  : (submitting ? 'Saving...' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
