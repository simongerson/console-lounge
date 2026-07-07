import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function PATCH(request, { params }) {
  try {
    const { name, price, stock, is_active } = await request.json()
    const updates = {}
    if (is_active !== undefined) { updates.is_active = is_active }
    else {
      if (name  !== undefined) updates.name  = name
      if (price !== undefined) updates.price = Number(price)
      if (stock !== undefined) updates.stock = stock ? Number(stock) : null
    }
    await supabase.from('products').update(updates).eq('id', params.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}