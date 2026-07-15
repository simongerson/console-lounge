import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST /api/monitoring/heartbeat
// Header: x-agent-key: <shared secret>
// Body: { consoleId, ipAddress, isOn, currentGame }
//
// Now requires the same shared secret as /api/monitoring/config —
// previously this endpoint had no authentication at all, meaning
// anyone could POST fake heartbeats. Fixed as part of the broader
// security review.
export async function POST(request) {
  try {
    const agentKey = request.headers.get('x-agent-key')
    if (!agentKey || agentKey !== process.env.AGENT_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { consoleId, ipAddress, isOn, currentGame } = await request.json()

    if (!consoleId) {
      return NextResponse.json({ error: 'consoleId is required' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('console_heartbeats')
      .select('is_on, on_since')
      .eq('console_id', consoleId)
      .maybeSingle()

    let onSince = existing?.on_since || null
    if (isOn && !existing?.is_on) {
      onSince = new Date().toISOString()
    } else if (!isOn) {
      onSince = null
    }

    const { error } = await supabase
      .from('console_heartbeats')
      .upsert({
        console_id: consoleId,
        ip_address: ipAddress || null,
        is_on: !!isOn,
        current_game: currentGame || null,
        on_since: onSince,
        last_heartbeat_at: new Date().toISOString(),
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/monitoring/heartbeat error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
