import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function PATCH(request, { params }) {
  try {
    const body = await request.json()
    const updates = {}

    if (body.is_active !== undefined) {
      updates.is_active = body.is_active
    } else {
      if (body.name)              updates.name                = body.name
      if (body.pricingType)       updates.pricing_type        = body.pricingType
      if (body.price !== undefined) updates.price             = Number(body.price) || 0
      if (body.pricePerGame !== undefined) updates.price_per_game = Number(body.pricePerGame) || 0
      if (body.freeAfterGames !== undefined) updates.free_after_games = Number(body.freeAfterGames) || 0
      if (body.avgMinutesPerGame !== undefined) updates.avg_minutes_per_game = Number(body.avgMinutesPerGame) || 20
      if (body.durationMinutes !== undefined) updates.duration_minutes = body.durationMinutes ? Number(body.durationMinutes) : null
    }

    const { error } = await supabase
      .from('session_rates').update(updates).eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await supabase.from('session_rates').delete().eq('id', params.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}