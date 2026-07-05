import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(request, { params }) {
  try {
    const {
      name, pricingType, price, pricePerGame,
      freeAfterGames, avgMinutesPerGame, durationMinutes, is_active
    } = await request.json()

    if (is_active !== undefined) {
      await query(
        'UPDATE session_rates SET is_active = ? WHERE id = ?',
        [is_active ? 1 : 0, params.id]
      )
      return NextResponse.json({ success: true })
    }

    await query(
      `UPDATE session_rates SET
        name = ?, pricing_type = ?, price = ?,
        price_per_game = ?, free_after_games = ?,
        avg_minutes_per_game = ?, duration_minutes = ?
       WHERE id = ?`,
      [
        name, pricingType,
        pricingType === 'time' || pricingType === 'both' ? (price || 0) : 0,
        pricingType === 'per_game' || pricingType === 'both' ? (pricePerGame || 0) : 0,
        freeAfterGames || 0,
        avgMinutesPerGame || 20,
        durationMinutes || null,
        params.id,
      ]
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await query('DELETE FROM session_rates WHERE id = ?', [params.id])
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}