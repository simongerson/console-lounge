import { query } from '@/lib/db'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(request) {
  try {
    const { staffId, floatAmount } = await request.json()
    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID required' }, { status: 400 })
    }

    // Check no open shift already
    const existing = await query(
      'SELECT id FROM shifts WHERE staff_id = ? AND closed_at IS NULL LIMIT 1',
      [staffId]
    )
    if (existing.length > 0) {
      return NextResponse.json({ shiftId: existing[0].id, alreadyOpen: true })
    }

    const id = randomUUID()
    await query(
      `INSERT INTO shifts (id, staff_id, float_amount, opened_at)
       VALUES (?, ?, ?, NOW())`,
      [id, staffId, floatAmount || 0]
    )
    return NextResponse.json({ shiftId: id, success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}