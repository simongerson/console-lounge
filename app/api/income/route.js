import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /api/income?from=2026-07-01&to=2026-07-09
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to   = searchParams.get('to')

    if (!from || !to) {
      return NextResponse.json({ error: 'from and to dates are required' }, { status: 400 })
    }

    const fromTs = `${from}T00:00:00.000Z`
    const toTs   = `${to}T23:59:59.999Z`

    // Completed sessions with a payment recorded in range.
    // No embedded joins here — fetched plain, then manually matched
    // to console/staff names below, to avoid depending on Supabase's
    // foreign-key relationship detection (which errored out).
    const { data: sessions, error: sessionsError } = await supabase
      .from('game_sessions')
      .select('id, console_id, staff_id, amount, payment_method, customer_name, mpesa_ref, ended_at, started_at')
      .eq('status', 'completed')
      .gte('ended_at', fromTs)
      .lte('ended_at', toTs)
      .order('ended_at', { ascending: false })

    if (sessionsError) throw sessionsError

    // Debts touched (paid against) within range
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('id, customer_name, amount, amount_paid, status, last_payment_method, mpesa_ref, updated_at, created_at')
      .gt('amount_paid', 0)
      .gte('updated_at', fromTs)
      .lte('updated_at', toTs)
      .order('updated_at', { ascending: false })

    if (debtsError) throw debtsError

    // Look up console + staff names separately, only for the IDs we need
    const consoleIds = [...new Set((sessions || []).map(s => s.console_id).filter(Boolean))]
    const staffIds   = [...new Set((sessions || []).map(s => s.staff_id).filter(Boolean))]

    let consoleMap = {}
    if (consoleIds.length) {
      const { data: consoles } = await supabase
        .from('consoles')
        .select('id, name')
        .in('id', consoleIds)
      consoleMap = Object.fromEntries((consoles || []).map(c => [c.id, c.name]))
    }

    let staffMap = {}
    if (staffIds.length) {
      const { data: staff } = await supabase
        .from('staff')
        .select('id, name')
        .in('id', staffIds)
      staffMap = Object.fromEntries((staff || []).map(s => [s.id, s.name]))
    }

    const transactions = [
      ...(sessions || []).map(s => ({
        type: 'session',
        id: s.id,
        label: consoleMap[s.console_id] || 'Session',
        staffName: staffMap[s.staff_id] || null,
        customerName: s.customer_name,
        amount: Number(s.amount || 0),
        paymentMethod: s.payment_method,
        mpesaRef: s.mpesa_ref,
        timestamp: s.ended_at,
      })),
      ...(debts || []).map(d => ({
        type: 'debt_payment',
        id: d.id,
        label: `Debt payment — ${d.customer_name || 'Unknown'}`,
        staffName: null,
        customerName: d.customer_name,
        amount: Number(d.amount_paid || 0),
        paymentMethod: d.last_payment_method || 'unknown',
        mpesaRef: d.mpesa_ref,
        timestamp: d.updated_at,
        debtStatus: d.status,
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    const summary = transactions.reduce(
      (acc, t) => {
        acc.total += t.amount
        if (t.paymentMethod === 'cash') acc.cash += t.amount
        else if (t.paymentMethod === 'mpesa' || t.paymentMethod === 'mpesa_stk') acc.mpesa += t.amount
        else if (t.type === 'debt_payment') acc.debtRecovered += t.amount
        return acc
      },
      { total: 0, cash: 0, mpesa: 0, debtRecovered: 0 }
    )

    return NextResponse.json({ summary, transactions })
  } catch (err) {
    console.error('GET /api/income error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
