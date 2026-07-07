import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const { data } = await supabase
      .from('products').select('*').order('name', { ascending: true })
    return NextResponse.json({ products: data || [] })
  } catch (err) {
    return NextResponse.json({ products: [] })
  }
}

export async function POST(request) {
  try {
    const { name, price, stock } = await request.json()
    if (!name?.trim() || !price) {
      return NextResponse.json({ error: 'Name and price required' }, { status: 400 })
    }
    const { error } = await supabase.from('products').insert({
      name: name.trim(), price: Number(price),
      stock: stock ? Number(stock) : null,
    })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}