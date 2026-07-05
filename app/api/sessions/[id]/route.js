import { query } from '@/lib/mysqldb'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const rows = await query(
      'SELECT * FROM game_sessions WHERE id = ? LIMIT 1',
      [params.id]
    )
    return NextResponse.json({ session: rows[0] || null })
  } catch (err) {
    return NextResponse.json({ session: null })
  }
}