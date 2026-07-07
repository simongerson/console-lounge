import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const { data: consoles } = await supabase
      .from('consoles')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    // Get active sessions for each console
    const { data: activeSessions } = await supabase
      .from('game_sessions')
      .select('*, session_rates(name, duration_minutes)')
      .eq('status', 'active')

    const enriched = (consoles || []).map(c => {
      const session = activeSessions?.find(s => s.console_id === c.id)
      return {
        ...c,
        session_id:     session?.id || null,
        started_at:     session?.started_at || null,
        session_amount: session?.amount || null,
        customer_name:  session?.customer_name || null,
        rate_name:      session?.session_rates?.name || null,
      }
    })

    return NextResponse.json({ consoles: enriched })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ consoles: [] })
  }
}