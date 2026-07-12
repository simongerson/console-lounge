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
    // Round UP to the next full minute, as decided — e.g. 20 min 10 sec
    // charges for 21 minutes.
    const diffMins = Math.ceil((now - started) / 60000)
    const isDebt   = paymentMethod === 'debt'

    // Determine the final charge. Two paths:
    //   1. Time-based rate + a global per-minute price is set → charge
    //      is computed live, right now, from real elapsed minutes.
    //      This is NEVER trusted from the client — it's calculated
    //      here using the database's own started_at vs. the server's
    //      own clock, so it can't be manipulated by staff.
    //   2. Everything else (Per-Game/Both rates, or no per-minute price
    //      configured) → falls back to the flat amount locked in at
    //      session start, same as before.
    let finalAmount = Number(session.amount)

    if (session.rate_id) {
      const { data: rate } = await supabase
        .from('session_rates')
        .select('pricing_type')
        .eq('id', session.rate_id)
        .single()

      if (rate?.pricing_type === 'time') {
        const { data: billing } = await supabase
          .from('billing_settings')
          .select('price_per_minute')
          .eq('id', 1)
          .single()

        const pricePerMinute = Number(billing?.price_per_minute) || 0
        if (pricePerMinute > 0) {
          finalAmount = diffMins * pricePerMinute
        }
      }
    }

    if (!finalAmount || finalAmount <= 0) {
      return NextResponse.json(
        { error: 'This session has no valid price on record. A manager needs to fix it directly in the database before it can be ended.' },
        { status: 409 }
      )
    }

    const updates = {
      ended_at:         now.toISOString(),
      duration_minutes: diffMins,
      status:           isDebt ? 'debt' : 'completed',
      payment_method:   paymentMethod || session.payment_method,
      amount:           finalAmount,
    }

    if (mpesaRef !== undefined && mpesaRef !== null) {
      updates.mpesa_ref = mpesaRef
    }

    await supabase.from('game_sessions').update(updates).eq('id', sessionId)

    await supabase.from('consoles')
      .update({ status: 'open' }).eq('id', consoleId)

    if (isDebt) {
      await supabase.from('debts').insert({
        game_session_id: sessionId,
        customer_name:   session.customer_name || 'Unknown',
        customer_phone:  session.customer_phone || null,
        amount:          finalAmount,
        status:          'outstanding',
      })
    }

    return NextResponse.json({
      success: true, duration: diffMins, amount: finalAmount,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
