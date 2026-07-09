

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { shiftId, cashDeclared, mpesaDeclared } = await request.json()
    if (!shiftId) {
      return NextResponse.json({ error: 'Shift ID required' }, { status: 400 })
    }

    // Need the shift's opened_at to know the time window for debt payments
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('opened_at')
      .eq('id', shiftId)
      .single()

    if (shiftError || !shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    // Completed sessions for this shift
    const { data: sessions } = await supabase
      .from('game_sessions')
      .select('payment_method, amount')
      .eq('shift_id', shiftId)
      .eq('status', 'completed')

    let cashExpected  = 0
    let mpesaExpected = 0
    sessions?.forEach(s => {
      if (s.payment_method === 'cash') {
        cashExpected += Number(s.amount)
      } else if (s.payment_method === 'mpesa' || s.payment_method === 'mpesa_stk') {
        // mpesa_stk previously fell through uncounted — now treated
        // the same as manual mpesa for reconciliation purposes.
        mpesaExpected += Number(s.amount)
      }
    })

    // Debt repayments collected during this shift's time window.
    // Note: debts only store a running amount_paid total (no per-payment
    // log or shift linkage), so this is an approximation based on when
    // each debt was last updated — same limitation as the Income page.
    // If a debt received multiple partial payments across different
    // shifts, only the most recent payment's timing is reflected.
    // testing is my git hundles saving ignore this comment
    const { data: debtPayments } = await supabase
      .from('debts')
      .select('amount_paid, last_payment_method, updated_at')
      .gt('amount_paid', 0)
      .gte('updated_at', shift.opened_at)

    debtPayments?.forEach(d => {
      if (d.last_payment_method === 'cash') {
        cashExpected += Number(d.amount_paid)
      } else if (d.last_payment_method === 'mpesa' || d.last_payment_method === 'mpesa_stk') {
        mpesaExpected += Number(d.amount_paid)
      }
    })

    const cashDec  = Number(cashDeclared  || 0)
    const mpesaDec = Number(mpesaDeclared || 0)
    const variance = (cashDec + mpesaDec) - (cashExpected + mpesaExpected)

    const { error } = await supabase
      .from('shifts')
      .update({
        closed_at:      new Date().toISOString(),
        cash_declared:  cashDec,
        mpesa_declared: mpesaDec,
        cash_expected:  cashExpected,
        mpesa_expected: mpesaExpected,
        variance,
      })
      .eq('id', shiftId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      summary: {
        cashExpected, mpesaExpected,
        cashDeclared: cashDec, mpesaDeclared: mpesaDec,
        variance, total: cashExpected + mpesaExpected,
      }
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}




