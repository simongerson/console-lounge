'use client';

import { useState, useEffect } from 'react';

const STATUS_COLORS = {
  outstanding: { bg: '#fdecea', text: '#c0392b' },
  partial: { bg: '#fbf3e0', text: '#c9a84c' },
  cleared: { bg: '#e8f5f0', text: '#0d9488' },
};

export default function DebtsPage() {
  const [debts, setDebts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [mpesaRef, setMpesaRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // STK push specific state
  const [stkPhone, setStkPhone] = useState('');
  const [stkStatus, setStkStatus] = useState('idle'); // idle | sending | pending | success | failed
  const [stkCheckoutId, setStkCheckoutId] = useState(null);

  useEffect(() => {
    fetchDebts();
  }, [statusFilter]);

  async function fetchDebts() {
    setLoading(true);
    try {
      const url =
        statusFilter === 'all'
          ? '/api/debts'
          : `/api/debts?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setDebts(data.debts || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Failed to fetch debts:', err);
    } finally {
      setLoading(false);
    }
  }

  function openPaymentModal(debt) {
    setSelectedDebt(debt);
    setPaymentAmount(String(debt.balance));
    setPaymentMethod('cash');
    setMpesaRef('');
    setStkPhone(debt.customer_phone || '');
    setStkStatus('idle');
    setStkCheckoutId(null);
    setError('');
  }

  function closeModal() {
    setSelectedDebt(null);
    setPaymentAmount('');
    setMpesaRef('');
    setStkPhone('');
    setStkStatus('idle');
    setStkCheckoutId(null);
    setError('');
  }

  async function submitPayment() {
    setError('');

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setError('Enter a valid payment amount');
      return;
    }
    if (amount > Number(selectedDebt.balance)) {
      setError('Amount cannot exceed the outstanding balance');
      return;
    }
    if (paymentMethod === 'mpesa' && mpesaRef.trim().length !== 10) {
      setError('M-Pesa reference must be 10 characters');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/debts/${selectedDebt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPaid: amount,
          paymentMethod,
          mpesaRef: paymentMethod === 'mpesa' ? mpesaRef : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');

      closeModal();
      fetchDebts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function triggerSTKPush() {
    setError('');

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setError('Enter a valid payment amount');
      return;
    }
    if (amount > Number(selectedDebt.balance)) {
      setError('Amount cannot exceed the outstanding balance');
      return;
    }
    if (!stkPhone || stkPhone.trim().length < 9) {
      setError('Enter a valid phone number');
      return;
    }

    setStkStatus('sending');
    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: stkPhone,
          amount,
          accountReference: selectedDebt.customer_name || 'Debt Payment',
          transactionDesc: `Debt payment - ${selectedDebt.customer_name || 'customer'}`,
          source: 'debt',
          sourceId: selectedDebt.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send STK push');

      setStkCheckoutId(data.checkoutRequestId);
      setStkStatus('pending');
    } catch (err) {
      setError(err.message);
      setStkStatus('idle');
    }
  }

  // Poll every 3 seconds while an STK push is pending
  useEffect(() => {
    if (stkStatus !== 'pending' || !stkCheckoutId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/mpesa/status/${stkCheckoutId}`);
        const data = await res.json();

        if (data.status === 'success') {
          setStkStatus('success');
          clearInterval(interval);
          fetchDebts();
          setTimeout(() => closeModal(), 1500);
        } else if (data.status === 'failed') {
          setStkStatus('failed');
          setError(data.resultDesc || 'Payment was not completed');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Status poll error:', err);
      }
    }, 3000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (stkStatus === 'pending') {
        setStkStatus('failed');
        setError('Payment timed out — customer did not respond in time');
      }
    }, 120000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [stkStatus, stkCheckoutId]);

  async function deleteDebt(debt) {
    if (
      !confirm(
        `Write off this debt for ${debt.customer_name || 'customer'}? This cannot be undone.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/debts/${debt.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete debt');
      fetchDebts();
    } catch (err) {
      alert(err.message);
    }
  }

  const sectionLabel = {
    fontSize: '11px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: '#8a8780',
  };

  const cardStyle = {
    background: '#fff',
    border: '1px solid #e8e4dc',
    borderRadius: '12px',
    padding: '20px 24px',
  };

  return (
    <div style={{ padding: '32px', background: '#f4f1eb', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', marginBottom: '24px' }}>
        Debts
      </h1>

      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={cardStyle}>
            <div style={sectionLabel}>Total Outstanding</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#c0392b', marginTop: '6px' }}>
              KES {summary.totalOutstanding.toLocaleString()}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={sectionLabel}>Outstanding</div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '6px' }}>
              {summary.countOutstanding}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={sectionLabel}>Partial</div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '6px', color: '#c9a84c' }}>
              {summary.countPartial}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={sectionLabel}>Cleared</div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '6px', color: '#0d9488' }}>
              {summary.countCleared}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['all', 'outstanding', 'partial', 'cleared'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e8e4dc',
              background: statusFilter === s ? '#1a1a1a' : '#fff',
              color: statusFilter === s ? '#fff' : '#1a1a1a',
              fontSize: '13px',
              fontWeight: 500,
              textTransform: 'capitalize',
              cursor: 'pointer',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a8780' }}>
            Loading debts...
          </div>
        ) : debts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a8780' }}>
            No debts found for this filter.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e8e4dc' }}>
                {['Customer', 'Phone', 'Amount', 'Paid', 'Balance', 'Status', 'Due Date', ''].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        ...sectionLabel,
                        textAlign: 'left',
                        padding: '14px 16px',
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {debts.map((debt) => {
                const colors = STATUS_COLORS[debt.status] || STATUS_COLORS.outstanding;
                return (
                  <tr key={debt.id} style={{ borderBottom: '1px solid #f0ede6' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                      {debt.customer_name || 'Walk-in'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#8a8780' }}>
                      {debt.customer_phone || '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      KES {Number(debt.amount).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#0d9488' }}>
                      KES {Number(debt.amount_paid).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                      KES {Number(debt.balance).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          background: colors.bg,
                          color: colors.text,
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {debt.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#8a8780' }}>
                      {debt.due_date
                        ? new Date(debt.due_date).toLocaleDateString()
                        : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {debt.status !== 'cleared' && (
                        <button
                          onClick={() => openPaymentModal(debt)}
                          style={{
                            background: '#0d9488',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginRight: '8px',
                          }}
                        >
                          Record Payment
                        </button>
                      )}
                      <button
                        onClick={() => deleteDebt(debt)}
                        style={{
                          background: 'transparent',
                          color: '#c0392b',
                          border: '1px solid #f0d5d1',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Write Off
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedDebt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '28px',
              width: '400px',
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
              Record Payment
            </h2>
            <p style={{ fontSize: '13px', color: '#8a8780', marginBottom: '20px' }}>
              {selectedDebt.customer_name || 'Walk-in'} — Balance: KES{' '}
              {Number(selectedDebt.balance).toLocaleString()}
            </p>

            <div style={sectionLabel}>Amount</div>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #e8e4dc',
                fontSize: '16px',
                marginTop: '6px',
                marginBottom: '16px',
              }}
            />

            <div style={sectionLabel}>Payment Method</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', marginBottom: '16px' }}>
              {[
                { key: 'cash', label: 'Cash' },
                { key: 'mpesa', label: 'M-Pesa (Manual)' },
                { key: 'mpesa_stk', label: 'M-Pesa (STK Push)' },
              ].map((method) => (
                <button
                  key={method.key}
                  onClick={() => setPaymentMethod(method.key)}
                  style={{
                    flex: 1,
                    padding: '10px 6px',
                    borderRadius: '8px',
                    border:
                      paymentMethod === method.key
                        ? '2px solid #0d9488'
                        : '1px solid #e8e4dc',
                    background: paymentMethod === method.key ? '#e8f5f0' : '#fff',
                    fontWeight: 600,
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  {method.label}
                </button>
              ))}
            </div>

            {paymentMethod === 'mpesa' && (
              <>
                <div style={sectionLabel}>M-Pesa Reference</div>
                <input
                  type="text"
                  maxLength={10}
                  value={mpesaRef}
                  onChange={(e) => setMpesaRef(e.target.value.toUpperCase())}
                  placeholder="e.g. QJI4XXXXXX"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e8e4dc',
                    fontSize: '15px',
                    marginTop: '6px',
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                  }}
                />
              </>
            )}

            {paymentMethod === 'mpesa_stk' && (
              <>
                <div style={sectionLabel}>Customer Phone</div>
                <input
                  type="text"
                  value={stkPhone}
                  onChange={(e) => setStkPhone(e.target.value)}
                  placeholder="e.g. 0712345678"
                  disabled={stkStatus === 'pending' || stkStatus === 'sending'}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e8e4dc',
                    fontSize: '15px',
                    marginTop: '6px',
                    marginBottom: '16px',
                  }}
                />

                {stkStatus === 'pending' && (
                  <div
                    style={{
                      background: '#fbf3e0',
                      color: '#c9a84c',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      textAlign: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    Waiting for customer to approve on their phone...
                  </div>
                )}

                {stkStatus === 'success' && (
                  <div
                    style={{
                      background: '#e8f5f0',
                      color: '#0d9488',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      textAlign: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    ✅ Payment received — updating debt...
                  </div>
                )}
              </>
            )}

            {error && (
              <div style={{ color: '#c0392b', fontSize: '13px', marginBottom: '12px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={closeModal}
                disabled={stkStatus === 'sending' || stkStatus === 'pending'}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e8e4dc',
                  background: '#fff',
                  fontWeight: 600,
                  cursor:
                    stkStatus === 'sending' || stkStatus === 'pending'
                      ? 'not-allowed'
                      : 'pointer',
                  opacity: stkStatus === 'sending' || stkStatus === 'pending' ? 0.5 : 1,
                }}
              >
                Cancel
              </button>

              {paymentMethod === 'mpesa_stk' ? (
                <button
                  onClick={triggerSTKPush}
                  disabled={stkStatus === 'sending' || stkStatus === 'pending' || stkStatus === 'success'}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background:
                      stkStatus === 'sending' || stkStatus === 'pending'
                        ? '#9dcfc8'
                        : '#0d9488',
                    color: '#fff',
                    fontWeight: 600,
                    cursor:
                      stkStatus === 'sending' || stkStatus === 'pending'
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  {stkStatus === 'sending'
                    ? 'Sending...'
                    : stkStatus === 'pending'
                    ? 'Waiting...'
                    : stkStatus === 'success'
                    ? 'Done'
                    : 'Send STK Push'}
                </button>
              ) : (
                <button
                  onClick={submitPayment}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: submitting ? '#9dcfc8' : '#0d9488',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Saving...' : 'Confirm Payment'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}