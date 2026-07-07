import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const { data } = await supabase
      .from('product_sales')
      .select('*, products(name), staff(name)')
      .order('created_at', { ascending: false })
      .limit(100)

    const sales = (data || []).map(s => ({
      ...s,
      product_name: s.products?.name,
      staff_name:   s.staff?.name,
    }))
    return NextResponse.json({ sales })
  } catch (err) {
    return NextResponse.json({ sales: [] })
  }
}

export async function POST(request) {
  try {
    const { productId, shiftId, staffId, quantity, amount, paymentMethod } =
      await request.json()

    const { error } = await supabase.from('product_sales').insert({
      product_id:     productId,
      shift_id:       shiftId  || null,
      staff_id:       staffId  || null,
      quantity:       quantity || 1,
      amount,
      payment_method: paymentMethod || 'cash',
    })
    if (error) throw error

    // Deduct stock
    const { data: product } = await supabase
      .from('products').select('stock').eq('id', productId).single()
    if (product?.stock !== null) {
      await supabase.from('products')
        .update({ stock: product.stock - (quantity || 1) })
        .eq('id', productId)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}