import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST /api/monitoring/heartbeat
// Body: { consoleId, ipAddress, isOn, currentGame }
//
// This is what a future monitoring agent (Windows app scanning your
// local network) would call every ~15 seconds per console. Nothing
// currently calls this in production — it's built and ready, but the
// actual agent software is a separate deliverable.
export async function POST(request) {
  try {
    const { consoleId, ipAddress, isOn, currentGame } = await request.json()

    if (!consoleId) {
      return NextResponse.json({ error: 'consoleId is required' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('console_heartbeats')
      .select('is_on, on_since')
      .eq('console_id', consoleId)
      .maybeSingle()

    // Track when this console turned on, so ghost duration can be shown.
    // Resets whenever it transitions off, so the "on_since" always
    // reflects the current power-on streak, not the console's whole history.
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
