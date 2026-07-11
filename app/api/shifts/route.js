import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const date    = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const staffId = searchParams.get('staffId') || null

    let q = supabase
      .from('shifts')
      .select('*, staff:staff(name)')
      .gte('opened_at', `${date}T00:00:00`)
      .lte('opened_at', `${date}T23:59:59`)
      .order('opened_at', { ascending: false })

    if (staffId) q = q.eq('staff_id', staffId)

    const { data: shifts } = await q

    // Enrich each shift with revenue + session counts
    const enriched = await Promise.all((shifts || []).map(async sh => {
      const { data: sessions } = await supabase
        .from('game_sessions')
        .select('amount, payment_method, status')
        .eq('shift_id', sh.id)

      let revenue       = sessions?.filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + Number(s.amount), 0) || 0
      let cash_revenue  = sessions?.filter(s => s.status === 'completed' && s.payment_method === 'cash')
        .reduce((sum, s) => sum + Number(s.amount), 0) || 0
      // Include mpesa_stk alongside mpesa — was undercounting STK-paid
      // sessions, same bug class we fixed on Reports and Shift Close.
      let mpesa_revenue = sessions?.filter(s => s.status === 'completed' && (s.payment_method === 'mpesa' || s.payment_method === 'mpesa_stk'))
        .reduce((sum, s) => sum + Number(s.amount), 0) || 0
      const unpaid_count = sessions?.filter(s => s.status === 'active').length || 0

      // Fold in debt repayments collected during this shift's window,
      // matching the same approach used in /api/shifts/close — keeps
      // this view consistent with what actually gets reconciled at close.
      // Same caveat applies: debts only store a running total with no
      // per-payment log, so this is an approximation by last-updated time.
      const windowEnd = sh.closed_at || new Date().toISOString()
      const { data: debtPayments } = await supabase
        .from('debts')
        .select('amount_paid, last_payment_method, updated_at')
        .gt('amount_paid', 0)
        .gte('updated_at', sh.opened_at)
        .lte('updated_at', windowEnd)

      debtPayments?.forEach(d => {
        revenue += Number(d.amount_paid)
        if (d.last_payment_method === 'cash') {
          cash_revenue += Number(d.amount_paid)
        } else if (d.last_payment_method === 'mpesa' || d.last_payment_method === 'mpesa_stk') {
          mpesa_revenue += Number(d.amount_paid)
        }
      })

      return {
        ...sh,
        staff_name: sh.staff?.name,
        revenue, cash_revenue, mpesa_revenue,
        session_count: sessions?.length || 0,
        unpaid_count,
      }
    }))

    const allShifts = enriched
    const summary = {
      total_shifts:      allShifts.length,
      live_shifts:       allShifts.filter(s => !s.closed_at).length,
      expected_cash:     allShifts.filter(s => s.closed_at).reduce((sum, s) => sum + Number(s.cash_expected || 0), 0),
      cash_counted:      allShifts.filter(s => s.closed_at).reduce((sum, s) => sum + Number(s.cash_declared || 0), 0),
      net_discrepancy:   allShifts.filter(s => s.closed_at).reduce((sum, s) => sum + Number(s.variance || 0), 0),
    }

    const { data: allStaff } = await supabase
      .from('staff')
      .select('id, name')
      .eq('is_active', true)

    const history = {}
    await Promise.all((allStaff || []).map(async st => {
      const { data: rows } = await supabase
        .from('shifts')
        .select('variance')
        .eq('staff_id', st.id)
        .not('closed_at', 'is', null)
        .order('closed_at', { ascending: false })
        .limit(10)
      history[st.id] = {
        name:      st.name,
        variances: (rows || []).map(r => Number(r.variance || 0)),
      }
    }))

    return NextResponse.json({ shifts: enriched, summary, history })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ shifts: [], summary: {}, history: {} })
  }
}
