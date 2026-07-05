import { query } from '@/lib/mysqldb'
import { NextResponse } from 'next/server'

export async function PATCH(request, { params }) {
  try {
    const { name, console_type, is_active } = await request.json()
    if (name !== undefined) {
      await query('UPDATE consoles SET name = ? WHERE id = ?', [name, params.id])
    }
    if (console_type !== undefined) {
      await query('UPDATE consoles SET console_type = ? WHERE id = ?',
        [console_type, params.id])
    }
    if (is_active !== undefined) {
      await query('UPDATE consoles SET is_active = ? WHERE id = ?',
        [is_active ? 1 : 0, params.id])
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await query('UPDATE consoles SET is_active = 0 WHERE id = ?', [params.id])
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}