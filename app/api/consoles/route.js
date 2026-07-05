import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const consoles = await query(
      `SELECT c.*,
        gs.id        as session_id,
        gs.started_at,
        gs.amount    as session_amount,
        gs.payment_method,
        gs.customer_name,
        gs.rate_id,
        sr.name      as rate_name,
        sr.duration_minutes
       FROM consoles c
       LEFT JOIN game_sessions gs
         ON gs.console_id = c.id AND gs.status = 'active'
       LEFT JOIN session_rates sr
         ON sr.id = gs.rate_id
       WHERE c.is_active = 1
       ORDER BY c.sort_order ASC`
    )
    return NextResponse.json({ consoles })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ consoles: [] })
  }
}