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

    // IMPORTANT: the amount is NEVER taken from the request body here.
    // It's locked in permanently at session start (server-validated
    // there to be > 0) and the UI no longer offers any way to edit it
    // at end. If this route accepted a client-supplied amount, that
    // whole anti-fraud lock would be pointless — anyone could bypass
    // the UI with a direct API call and charge less than what was
    // actually agreed. Always trust only what's already in the database.
    const finalAmount = Number(session.amount)

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
