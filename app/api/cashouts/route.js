import { query } from '@/lib/db'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const cashouts = await query(
      `SELECT co.*, s.name as staff_name
       FROM cash_outs co
       LEFT JOIN staff s ON s.id = co.staff_id
       WHERE DATE(co.created_at) = ?
       ORDER BY co.created_at DESC`,
      [date]
    )

    const [summary] = await query(
      `SELECT
         COALESCE(SUM(amount), 0) as total,
         SUM(CASE WHEN status='pending'  THEN 1 ELSE 0 END) as pending,
         SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) as approved,
         SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) as rejected
       FROM cash_outs WHERE DATE(created_at) = ?`,
      [date]
    )

    return NextResponse.json({ cashouts, summary })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ cashouts: [], summary: {} })
  }
}

export async function POST(request) {
  try {
    const { staffId, shiftId, amount, reason } = await request.json()
    if (!amount) {
      return NextResponse.json(
        { error: 'Amount required' }, { status: 400 }
      )
    }
    const id = randomUUID()
    await query(
      `INSERT INTO cash_outs (id, staff_id, shift_id, amount, reason, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [id, staffId || null, shiftId || null,
       Number(amount), reason?.trim() || null]
    )
    return NextResponse.json({ success: true, id })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}