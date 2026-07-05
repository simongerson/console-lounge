import { query } from '@/lib/mysqldb'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// PATCH — update staff (reset PIN, toggle active)
export async function PATCH(request, { params }) {
  try {
    const { name, pin, role, is_active } = await request.json()
    const { id } = params

    if (pin) {
      if (pin.length !== 4) {
        return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 })
      }
      const hashed = await bcrypt.hash(pin, 10)
      await query(
        `UPDATE staff SET pin = ?, pin_attempts = 0,
         locked_until = NULL WHERE id = ?`,
        [hashed, id]
      )
    }

    if (name !== undefined) {
      await query('UPDATE staff SET name = ? WHERE id = ?', [name, id])
    }
    if (role !== undefined) {
      await query('UPDATE staff SET role = ? WHERE id = ?', [role, id])
    }
    if (is_active !== undefined) {
      await query('UPDATE staff SET is_active = ? WHERE id = ?',
        [is_active ? 1 : 0, id])
    }

    // Unlock if locked
    await query(
      `UPDATE staff SET pin_attempts = 0, locked_until = NULL WHERE id = ?`,
      [id]
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE — remove staff
export async function DELETE(request, { params }) {
  try {
    await query('UPDATE staff SET is_active = 0 WHERE id = ?', [params.id])
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}