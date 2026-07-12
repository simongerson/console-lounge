import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('billing_settings')
      .select('price_per_minute')
      .eq('id', 1)
      .single()

    if (error) throw error

    return NextResponse.json({ pricePerMinute: Number(data?.price_per_minute) || 0 })
  } catch (err) {
    console.error('GET /api/billing-settings error:', err)
    return NextResponse.json({ pricePerMinute: 0 })
  }
}

export async function PATCH(request) {
  try {
    const { pricePerMinute } = await request.json()

    if (pricePerMinute === undefined || Number(pricePerMinute) < 0) {
      return NextResponse.json({ error: 'A valid price per minute is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('billing_settings')
      .update({
        price_per_minute: Number(pricePerMinute),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/billing-settings error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
