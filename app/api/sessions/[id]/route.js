import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'


import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const rows = await query(
      `SELECT gs.*,
         sr.price       as rate_price,
         sr.name        as rate_name,
         sr.pricing_type
       FROM game_sessions gs
       LEFT JOIN session_rates sr ON sr.id = gs.rate_id
       WHERE gs.id = ? LIMIT 1`,
      [params.id]
    )
    return NextResponse.json({ session: rows[0] || null })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ session: null })
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

