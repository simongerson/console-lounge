import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { sessionId, consoleId, paymentMethod, mpesaRef } = await request.json()

    const { data: session } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const now      = new Date()
    const started  = new Date(session.started_at)
    const diffMins = Math.ceil((now - started) / 60000)
    const isDebt   = paymentMethod === 'debt'

    // Debt sessions are marked 'debt' (not 'completed') so they don't
    // count as collected revenue until actually paid off via the Debts
    // page. Every other payment method marks the session 'completed'.
    const updates = {
      ended_at:         now.toISOString(),
      duration_minutes: diffMins,
      status:           isDebt ? 'debt' : 'completed',
      payment_method:   paymentMethod || session.payment_method,
    }

    if (mpesaRef !== undefined && mpesaRef !== null) {
      updates.mpesa_ref = mpesaRef
    }

    await supabase.from('game_sessions').update(updates).eq('id', sessionId)

    // The console is always freed on end, regardless of payment method —
    // the customer is done playing either way, they just may owe money.
    await supabase.from('consoles')
      .update({ status: 'open' }).eq('id', consoleId)

    // Create the debt record now, since Debt is chosen at end, not start.
    if (isDebt && Number(session.amount) > 0) {
      await supabase.from('debts').insert({
        game_session_id: sessionId,
        customer_name:   session.customer_name || 'Unknown',
        customer_phone:  session.customer_phone || null,
        amount:          session.amount,
        status:          'outstanding',
      })
    }

    return NextResponse.json({
      success: true, duration: diffMins, amount: session.amount,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
