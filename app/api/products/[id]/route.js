import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(request, { params }) {
  try {
    const { name, price, stock, is_active } = await request.json()
    if (is_active !== undefined) {
      await query('UPDATE products SET is_active = ? WHERE id = ?',
        [is_active ? 1 : 0, params.id])
      return NextResponse.json({ success: true })
    }
    await query(
      'UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?',
      [name, Number(price), stock ? Number(stock) : null, params.id]
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}