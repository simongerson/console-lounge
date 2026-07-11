import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request, { params }) {
  try {
    const { data } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', params.id)
      .single()
    return NextResponse.json({ session: data || null })
  } catch (err) {
    console.error('GET /api/sessions/[id] error:', err)
    return NextResponse.json({ session: null })
  }
}
