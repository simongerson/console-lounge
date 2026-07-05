import { query } from '@/lib/db'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(request) {
  try {
    const { name, console_type } = await request.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }
    const [max] = await query(
      'SELECT COALESCE(MAX(sort_order),0)+1 as next FROM consoles'
    )
    const id = randomUUID()
    await query(
      `INSERT INTO consoles (id, name, console_type, sort_order)
       VALUES (?, ?, ?, ?)`,
      [id, name.trim(), console_type || 'PS5', max.next]
    )
    return NextResponse.json({ success: true, id })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}