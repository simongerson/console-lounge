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

    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('opened_at')
      .eq('id', shiftId)
      .single()

    if (shiftError || !shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    // Block closing the shift while any session under it is still active.
    const { data: activeSessions } = await supabase
      .from('game_sessions')
      .select('id, console_id, consoles(name)')
      .eq('shift_id', shiftId)
      .eq('status', 'active')

    if (activeSessions?.length) {
      const bayNames = activeSessions
        .map(s => s.consoles?.name || 'a bay')
        .join(', ')
      return NextResponse.json(
        {
          error: `Can't close shift — ${activeSessions.length} session${activeSessions.length > 1 ? 's are' : ' is'} still active (${bayNames}). End or force-close ${activeSessions.length > 1 ? 'them' : 'it'} first.`,
        },
        { status: 409 }
      )
    }

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
        mpesaExpected += Number(s.amount)
      }
    })

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

    // Approved cash-outs physically left the till for a legitimate
    // reason (change, supplies, etc.) — subtract them from expected
    // cash so staff aren't flagged with a fake shortfall for money
    // that was properly withdrawn and approved. Pending/rejected
    // cash-outs don't count — only approved ones actually happened.
    const { data: approvedCashouts } = await supabase
      .from('cash_outs')
      .select('amount')
      .eq('shift_id', shiftId)
      .eq('status', 'approved')

    const totalCashouts = (approvedCashouts || [])
      .reduce((sum, c) => sum + Number(c.amount), 0)

    cashExpected -= totalCashouts

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
        cashoutsDeducted: totalCashouts,
      }
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
