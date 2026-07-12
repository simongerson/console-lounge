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
    // Round UP to the next full minute — 2:00 stays 2 min, 2:05 becomes 3 min.
    const diffMins = Math.ceil((now - started) / 60000)
    const isDebt   = paymentMethod === 'debt'

    // Billing model: the flat rate locked in at session start is always
    // the GUARANTEED MINIMUM charge — no discount for leaving early.
    // Per-minute billing only ever ADDS extra charge for time played
    // past the rate's stated duration (overtime). This is computed
    // entirely server-side from real timestamps — never trusted from
    // the client — so the anti-fraud lock from session start stays intact.
    let finalAmount = Number(session.amount)

    if (session.rate_id) {
      const { data: rate } = await supabase
        .from('session_rates')
        .select('pricing_type, duration_minutes')
        .eq('id', session.rate_id)
        .single()

      if (rate?.pricing_type === 'time' && Number(rate.duration_minutes) > 0) {
        const { data: billing } = await supabase
          .from('billing_settings')
          .select('price_per_minute')
          .eq('id', 1)
          .single()

        const pricePerMinute = Number(billing?.price_per_minute) || 0
        const overtimeMins   = diffMins - Number(rate.duration_minutes)

        if (pricePerMinute > 0 && overtimeMins > 0) {
          finalAmount = Number(session.amount) + (overtimeMins * pricePerMinute)
        }
        // If they played within the rate's duration (or exactly at it),
        // finalAmount stays as the flat session.amount — no discount,
        // no change from what was locked in at start.
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
