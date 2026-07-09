'use client'
import { useState, useEffect, useCallback } from 'react'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
function daysAgoStr(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const PRESETS = [
  { key: 'today',   label: 'Today',      from: () => todayStr(),      to: () => todayStr() },
  { key: '7days',   label: 'Last 7 Days', from: () => daysAgoStr(6),  to: () => todayStr() },
  { key: '30days',  label: 'Last 30 Days', from: () => daysAgoStr(29), to: () => todayStr() },
  { key: 'custom',  label: 'Custom' },
]

const METHOD_LABELS = {
  cash: 'Cash',
  mpesa: 'M-Pesa (Manual)',
  mpesa_stk: 'M-Pesa (STK Push)',
  unknown: 'Unknown',
}

export default function IncomePage() {
  const [preset, setPreset]   = useState('7days')
  const [from, setFrom]       = useState(daysAgoStr(6))
  const [to, setTo]           = useState(todayStr())
  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const loadIncome = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/income?from=${from}&to=${to}`)
      const data = await res.json()
      setSummary(data.summary || null)
      setTransactions(data.transactions || [])
    } catch {}
    setLoading(false)
  }, [from, to])

  useEffect(() => { loadIncome() }, [loadIncome])

  function applyPreset(p) {
    setPreset(p.key)
    if (p.key !== 'custom') {
      setFrom(p.from())
      setTo(p.to())
    }
  }

  const sectionLabel = {
    fontSize: '11px', fontWeight: 500, textTransform: 'uppercase',
    letterSpacing: '0.8px', color: '#8a8780',
  }
  const cardStyle = {
    background: '#fff', border: '1px solid #e8e4dc',
    borderRadius: '12px', padding: '20px 24px',
  }

  return (
    <div style={{ padding: '32px', background: '#f4f1eb', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>
        Income
      </h1>
      <p style={{ fontSize: '13px', color: '#8a8780', marginBottom: '24px' }}>
        Combined income from sessions and debt repayments
      </p>

      {/* Date range controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => applyPreset(p)}
            style={{
              padding: '8px 16px', borderRadius: '8px',
              border: '1px solid #e8e4dc',
              background: preset === p.key ? '#1a1a1a' : '#fff',
              color: preset === p.key ? '#fff' : '#1a1a1a',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}

        {preset === 'custom' && (
          <>
            <input type="date" value={from}
              onChange={e => setFrom(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #e8e4dc', fontSize: '13px' }}
            />
            <span style={{ color: '#8a8780', fontSize: '13px' }}>to</span>
            <input type="date" value={to}
              onChange={e => setTo(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #e8e4dc', fontSize: '13px' }}
            />
          </>
        )}
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={cardStyle}>
            <div style={sectionLabel}>Total Income</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', marginTop: '6px' }}>
              KES {summary.total.toLocaleString()}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={sectionLabel}>Cash</div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '6px', color: '#2d7a4f' }}>
              KES {summary.cash.toLocaleString()}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={sectionLabel}>M-Pesa</div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '6px', color: '#0d9488' }}>
              KES {summary.mpesa.toLocaleString()}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={sectionLabel}>Debt Recovered</div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '6px', color: '#c9a84c' }}>
              KES {summary.debtRecovered.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a8780' }}>Loading...</div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a8780' }}>
            No income recorded for this period.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e8e4dc' }}>
                {['Date', 'Type', 'Details', 'Method', 'Amount'].map(h => (
                  <th key={h} style={{ ...sectionLabel, textAlign: 'left', padding: '14px 16px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={`${t.type}-${t.id}`} style={{ borderBottom: '1px solid #f0ede6' }}>
                  <td style={{ padding: '14px 16px', color: '#8a8780', fontSize: '13px' }}>
                    {new Date(t.timestamp).toLocaleString('en-KE', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, padding: '3px 9px',
                      borderRadius: '999px',
                      background: t.type === 'session' ? '#e8f5f0' : '#fbf3e0',
                      color: t.type === 'session' ? '#0d9488' : '#c9a84c',
                    }}>
                      {t.type === 'session' ? 'Session' : 'Debt Payment'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                    {t.label}
                    {t.customerName && (
                      <span style={{ color: '#8a8780', fontWeight: 400 }}> — {t.customerName}</span>
                    )}
                    {t.staffName && (
                      <div style={{ fontSize: '11px', color: '#8a8780', fontWeight: 400 }}>
                        by {t.staffName}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#8a8780', fontSize: '13px' }}>
                    {METHOD_LABELS[t.paymentMethod] || t.paymentMethod}
                    {t.mpesaRef && (
                      <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#b0ada8' }}>
                        {t.mpesaRef}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                    KES {t.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ fontSize: '11px', color: '#a0a098', marginTop: '14px' }}>
        Note: debt payments show the amount recovered as of the last update to each debt,
        not a full per-payment history. For debts with multiple partial payments,
        the timing shown reflects the most recent payment only.
      </p>
    </div>
  )
}
