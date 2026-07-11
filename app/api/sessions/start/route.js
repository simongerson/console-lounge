import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST /api/sessions/start
// Payment method is decided at End Session, but the AMOUNT is locked
// in right here at start and can never be edited later — this is the
// anti-fraud control. That means amount must be enforced server-side,
// not just in the UI, or someone could bypass it (frontend bug, a
// direct API call, a race during deploy, etc.) and create a session
// that can never be charged correctly.
export async function POST(request) {
  try {
    const { consoleId, staffId, shiftId, rateId, amount,
            customerName, customerPhone, notes } = await request.json()

    if (!consoleId || !staffId || !shiftId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) {
      return NextResponse.json(
        { error: 'A valid amount greater than 0 is required to start a session' },
        { status: 400 }
      )
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
        amount:         numericAmount,
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
