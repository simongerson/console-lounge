import { query } from '@/lib/mysqldb'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    if (!staffId) {
      return NextResponse.json({ shift: null })
    }
    const rows = await query(
      `SELECT * FROM shifts 
       WHERE staff_id = ? AND closed_at IS NULL 
       ORDER BY opened_at DESC LIMIT 1`,
      [staffId]
    )
    return NextResponse.json({ shift: rows[0] || null })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ shift: null })
  }
}