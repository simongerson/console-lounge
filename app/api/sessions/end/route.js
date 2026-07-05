import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { sessionId, consoleId, paymentMethod, mpesaRef } = await request.json()

    if (!sessionId || !consoleId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Get session
    const rows = await query(
      'SELECT * FROM game_sessions WHERE id = ? LIMIT 1',
      [sessionId]
    )
    if (!rows.length) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const session  = rows[0]
    const now      = new Date()
    const started  = new Date(session.started_at)
    const diffMins = Math.ceil((now - started) / 60000)

    // End the session
    await query(
      `UPDATE game_sessions
       SET ended_at = NOW(),
           duration_minutes = ?,
           status = 'completed',
           payment_method = COALESCE(?, payment_method),
           mpesa_ref = ?
       WHERE id = ?`,
      [diffMins, paymentMethod || null, mpesaRef || null, sessionId]
    )

    // Free the console
    await query(
      `UPDATE consoles SET status = 'open' WHERE id = ?`,
      [consoleId]
    )

    return NextResponse.json({
      success: true,
      duration: diffMins,
      amount: session.amount,
    })

  } catch (err) {
    console.error('End session error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}