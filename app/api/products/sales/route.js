import { query } from '@/lib/db'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const sales = await query(
      `SELECT ps.*, p.name as product_name, s.name as staff_name
       FROM product_sales ps
       JOIN products p ON p.id = ps.product_id
       LEFT JOIN staff s ON s.id = ps.staff_id
       ORDER BY ps.created_at DESC LIMIT 100`
    )
    return NextResponse.json({ sales })
  } catch (err) {
    return NextResponse.json({ sales: [] })
  }
}

export async function POST(request) {
  try {
    const { productId, shiftId, staffId, quantity, amount, paymentMethod } =
      await request.json()
    const id = randomUUID()
    await query(
      `INSERT INTO product_sales
       (id, product_id, shift_id, staff_id, quantity, amount, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, productId, shiftId || null, staffId || null,
       quantity || 1, amount, paymentMethod || 'cash']
    )
    // Deduct stock if tracked
    await query(
      `UPDATE products SET stock = stock - ?
       WHERE id = ? AND stock IS NOT NULL`,
      [quantity || 1, productId]
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}