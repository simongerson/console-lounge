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

    // Get completed sessions for this shift
    const { data: sessions } = await supabase
      .from('game_sessions')
      .select('payment_method, amount')
      .eq('shift_id', shiftId)
      .eq('status', 'completed')

    let cashExpected  = 0
    let mpesaExpected = 0
    sessions?.forEach(s => {
      if (s.payment_method === 'cash')  cashExpected  += Number(s.amount)
      if (s.payment_method === 'mpesa') mpesaExpected += Number(s.amount)
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