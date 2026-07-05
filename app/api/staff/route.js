import { query } from '@/lib/db'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

// GET — list all staff
export async function GET() {
  try {
    const staff = await query(
      `SELECT id, name, role, is_active, pin_attempts,
              locked_until, created_at
       FROM staff ORDER BY created_at ASC`
    )
    return NextResponse.json({ staff })
  } catch (err) {
    return NextResponse.json({ staff: [] })
  }
}

// POST — add new staff
export async function POST(request) {
  try {
    const { name, pin, role } = await request.json()
    if (!name || !pin || pin.length !== 4) {
      return NextResponse.json(
        { error: 'Name and 4-digit PIN required' }, { status: 400 }
      )
    }
    const hashed = await bcrypt.hash(pin, 10)
    const id     = randomUUID()
    await query(
      `INSERT INTO staff (id, name, pin, role) VALUES (?, ?, ?, ?)`,
      [id, name.trim(), hashed, role || 'staff']
    )
    return NextResponse.json({ success: true, id })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}