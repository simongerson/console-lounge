import { query } from '@/lib/db'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const products = await query(
      'SELECT * FROM products ORDER BY name ASC'
    )
    return NextResponse.json({ products })
  } catch (err) {
    return NextResponse.json({ products: [] })
  }
}

export async function POST(request) {
  try {
    const { name, price, stock } = await request.json()
    if (!name?.trim() || !price) {
      return NextResponse.json(
        { error: 'Name and price required' }, { status: 400 }
      )
    }
    const id = randomUUID()
    await query(
      `INSERT INTO products (id, name, price, stock)
       VALUES (?, ?, ?, ?)`,
      [id, name.trim(), Number(price), stock ? Number(stock) : null]
    )
    return NextResponse.json({ success: true, id })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}