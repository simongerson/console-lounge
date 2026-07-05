import { query } from '@/lib/mysqldb'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const rates = await query(
      `SELECT * FROM session_rates ORDER BY sort_order ASC, created_at ASC`
    )
    return NextResponse.json({ rates })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ rates: [] })
  }
}

export async function POST(request) {
  try {
    const {
      name, pricingType, price, pricePerGame,
      freeAfterGames, avgMinutesPerGame, durationMinutes
    } = await request.json()

    if (!name || !pricingType) {
      return NextResponse.json(
        { error: 'Name and pricing type required' }, { status: 400 }
      )
    }

    const id = randomUUID()
    await query(
      `INSERT INTO session_rates
       (id, name, pricing_type, price, price_per_game,
        free_after_games, avg_minutes_per_game, duration_minutes, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 
         (SELECT COALESCE(MAX(s2.sort_order),0)+1 FROM session_rates s2))`,
      [
        id, name.trim(), pricingType,
        pricingType === 'time' || pricingType === 'both' ? (price || 0) : 0,
        pricingType === 'per_game' || pricingType === 'both' ? (pricePerGame || 0) : 0,
        freeAfterGames || 0,
        avgMinutesPerGame || 20,
        durationMinutes || null,
      ]
    )
    return NextResponse.json({ success: true, id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}