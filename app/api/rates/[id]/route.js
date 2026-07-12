import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    if (!id) {
      return NextResponse.json({ error: 'Missing rate id' }, { status: 400 })
    }

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
      .from('session_rates').update(updates).eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/rates/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    if (!id) {
      return NextResponse.json({ error: 'Missing rate id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('session_rates')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === '23503') {
        return NextResponse.json(
          {
            error:
              'This rate has been used in past sessions and can\'t be deleted. Disable it instead to hide it from staff without losing session history.',
          },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/rates/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
