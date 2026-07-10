import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { sessionId, consoleId, paymentMethod, mpesaRef, amount } = await request.json()

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

    // Staff can now adjust the final amount at end (fixes Manual/Open
    // rate sessions that started at 0). Falls back to the session's
    // existing amount if none was sent, for backward compatibility.
    const finalAmount = amount !== undefined && amount !== null
      ? Number(amount)
      : Number(session.amount)

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

    if (isDebt && finalAmount > 0) {
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
