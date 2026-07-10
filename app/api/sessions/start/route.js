import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST /api/sessions/start
// Payment is no longer collected at start — every session starts the
// same way (active, no payment_method yet) and payment (cash, manual
// M-Pesa, M-Pesa STK Push, or Debt) is decided at End Session instead.
export async function POST(request) {
  try {
    const { consoleId, staffId, shiftId, rateId, amount,
            customerName, customerPhone, notes } = await request.json()

    if (!consoleId || !staffId || !shiftId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check not already active
    const { data: active } = await supabase
      .from('game_sessions')
      .select('id')
      .eq('console_id', consoleId)
      .eq('status', 'active')
      .limit(1)

    if (active?.length) {
      return NextResponse.json(
        { error: 'Console already has an active session' }, { status: 400 }
      )
    }

    const { data: session, error } = await supabase
      .from('game_sessions')
      .insert({
        console_id:     consoleId,
        shift_id:       shiftId,
        staff_id:       staffId,
        rate_id:        rateId || null,
        customer_name:  customerName || null,
        customer_phone: customerPhone || null,
        amount:         amount || 0,
        payment_method: null, // decided at end, not at start
        status:         'active',
        notes:          notes || null,
      })
      .select()
      .single()

    if (error) throw error

    // Every session now ties up the console, since payment (including
    // Debt) is only ever decided at the end.
    await supabase.from('consoles')
      .update({ status: 'active' }).eq('id', consoleId)

    return NextResponse.json({ success: true, sessionId: session.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
