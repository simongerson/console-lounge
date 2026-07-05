import { query } from '@/lib/db'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(request) {
  try {
    const { consoleId, staffId, shiftId, rateId, rateName,
            duration, amount, paymentMethod, customerName,
            customerPhone, notes } = await request.json()

    if (!consoleId || !staffId || !shiftId) {
      return NextResponse.json(
        { error: 'Missing required fields' }, { status: 400 }
      )
    }

    // Check console is not already active
    const active = await query(
      `SELECT id FROM game_sessions 
       WHERE console_id = ? AND status = 'active' LIMIT 1`,
      [consoleId]
    )
    if (active.length > 0) {
      return NextResponse.json(
        { error: 'Console already has an active session' }, { status: 400 }
      )
    }

    const id = randomUUID()
    const isDebt = paymentMethod === 'debt'

    await query(
      `INSERT INTO game_sessions 
       (id, console_id, shift_id, staff_id, rate_id,
        customer_name, customer_phone, amount,
        payment_method, status, notes, started_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id, consoleId, shiftId, staffId, rateId || null,
        customerName || null, customerPhone || null,
        amount || 0,
        paymentMethod || 'cash',
        isDebt ? 'debt' : 'active',
        notes || null,
      ]
    )

    // Mark console as active
    await query(
      `UPDATE consoles SET status = 'active' WHERE id = ?`,
      [consoleId]
    )

    // If debt — create debt record
    if (isDebt && amount > 0) {
      await query(
        `INSERT INTO debts 
         (id, game_session_id, customer_name, customer_phone, amount, status)
         VALUES (?, ?, ?, ?, ?, 'outstanding')`,
        [
          randomUUID(), id,
          customerName || 'Unknown',
          customerPhone || null,
          amount,
        ]
      )
    }

    return NextResponse.json({ success: true, sessionId: id })

  } catch (err) {
    console.error('Start session error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}