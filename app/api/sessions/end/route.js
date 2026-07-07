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

    await supabase.from('game_sessions').update({
      ended_at:         now.toISOString(),
      duration_minutes: diffMins,
      status:           'completed',
      payment_method:   paymentMethod || session.payment_method,
      mpesa_ref:        mpesaRef || null,
    }).eq('id', sessionId)

    await supabase.from('consoles')
      .update({ status: 'open' }).eq('id', consoleId)

    return NextResponse.json({
      success: true, duration: diffMins, amount: session.amount,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}