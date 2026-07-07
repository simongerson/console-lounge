import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const { data } = await supabase
      .from('session_rates')
      .select('*')
      .order('sort_order', { ascending: true })
    return NextResponse.json({ rates: data || [] })
  } catch (err) {
    return NextResponse.json({ rates: [] })
  }
}

export async function POST(request) {
  try {
    const { name, pricingType, price, pricePerGame,
            freeAfterGames, avgMinutesPerGame, durationMinutes } = await request.json()
    if (!name || !pricingType) {
      return NextResponse.json({ error: 'Name and pricing type required' }, { status: 400 })
    }

    const { data: max } = await supabase
      .from('session_rates')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)

    const { data, error } = await supabase
      .from('session_rates')
      .insert({
        name: name.trim(),
        pricing_type:         pricingType,
        price:                pricingType === 'per_game' ? 0 : (Number(price) || 0),
        price_per_game:       pricingType === 'time' ? 0 : (Number(pricePerGame) || 0),
        free_after_games:     Number(freeAfterGames) || 0,
        avg_minutes_per_game: Number(avgMinutesPerGame) || 20,
        duration_minutes:     durationMinutes ? Number(durationMinutes) : null,
        sort_order:           (max?.[0]?.sort_order || 0) + 1,
      })
      .select().single()

    if (error) throw error
    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}