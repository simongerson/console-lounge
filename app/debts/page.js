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
    setError('');
  }

  function closeModal() {
    setSelectedDebt(null);
    setPaymentAmount('');
    setMpesaRef('');
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

      {/* Summary cards */}
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

      {/* Filter tabs */}
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

      {/* Debts table */}
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

      {/* Payment modal */}
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
              {['cash', 'mpesa'].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border:
                      paymentMethod === method
                        ? '2px solid #0d9488'
                        : '1px solid #e8e4dc',
                    background: paymentMethod === method ? '#e8f5f0' : '#fff',
                    fontWeight: 600,
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {method === 'mpesa' ? 'M-Pesa' : 'Cash'}
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

            {error && (
              <div style={{ color: '#c0392b', fontSize: '13px', marginBottom: '12px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={closeModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e8e4dc',
                  background: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}