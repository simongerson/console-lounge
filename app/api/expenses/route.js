import { query } from '@/lib/db'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const expenses = await query(
      `SELECT e.*, s.name as staff_name
       FROM expenses e
       LEFT JOIN shifts sh ON sh.id = e.shift_id
       LEFT JOIN staff s   ON s.id  = sh.staff_id
       WHERE e.expense_date = ?
       ORDER BY e.created_at DESC`,
      [date]
    )

    const [summary] = await query(
      `SELECT
         COALESCE(SUM(amount), 0) as total,
         COUNT(*) as count
       FROM expenses WHERE expense_date = ?`,
      [date]
    )

    const byCategory = await query(
      `SELECT category,
         COALESCE(SUM(amount), 0) as total,
         COUNT(*) as count
       FROM expenses
       WHERE expense_date = ?
       GROUP BY category
       ORDER BY total DESC`,
      [date]
    )

    return NextResponse.json({ expenses, summary, byCategory })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ expenses: [], summary: {}, byCategory: [] })
  }
}

export async function POST(request) {
  try {
    const { category, description, amount, date, shiftId } = await request.json()

    if (!category || !amount) {
      return NextResponse.json(
        { error: 'Category and amount required' }, { status: 400 }
      )
    }

    const id = randomUUID()
    await query(
      `INSERT INTO expenses
       (id, shift_id, category, description, amount, expense_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        shiftId || null,
        category.trim(),
        description?.trim() || null,
        Number(amount),
        date || new Date().toISOString().split('T')[0],
      ]
    )
    return NextResponse.json({ success: true, id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await query('DELETE FROM expenses WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}