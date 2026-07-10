import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST /api/sessions/start
// Payment is no longer collected at start — every session starts the
// same way (active, payment TBD) and payment (cash, manual M-Pesa,
// M-Pesa STK Push, or Debt) is decided at End Session instead.
export async function POST(request) {
  try {
    const { consoleId, staffId, shiftId, rateId, amount,
            customerName, customerPhone, notes } = await request.json()

    if (!consoleId || !staffId || !shiftId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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
        // Using 'pending' instead of null — the payment_method column
        // likely has a NOT NULL constraint from its original design
        // (when payment was always chosen at start). 'pending' is a
        // clear placeholder that gets overwritten at End Session.
        payment_method: 'pending',
        status:         'active',
        notes:          notes || null,
      })
      .select()
      .single()

    if (error) throw error

    await supabase.from('consoles')
      .update({ status: 'active' }).eq('id', consoleId)

    return NextResponse.json({ success: true, sessionId: session.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
