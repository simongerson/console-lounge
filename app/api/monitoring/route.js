import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// A heartbeat older than this is considered stale — the agent isn't
// reporting anymore (or was never running), so we show "off" rather
// than trusting outdated data.
const HEARTBEAT_STALE_MS = 45000

export async function GET() {
  try {
    const { data: consoles } = await supabase
      .from('consoles')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    const { data: activeSessions } = await supabase
      .from('game_sessions')
      .select('*, session_rates(name)')
      .eq('status', 'active')

    const { data: heartbeats } = await supabase
      .from('console_heartbeats')
      .select('*')

    const now = Date.now()

    const enriched = (consoles || []).map(c => {
      const session   = activeSessions?.find(s => s.console_id === c.id)
      const heartbeat = heartbeats?.find(h => h.console_id === c.id)

      const heartbeatAge = heartbeat
        ? now - new Date(heartbeat.last_heartbeat_at).getTime()
        : null
      const heartbeatFresh = heartbeatAge !== null && heartbeatAge < HEARTBEAT_STALE_MS

      let status = 'off'
      let ghost = false
      let ghostMins = 0

      if (session) {
        status = 'playing'
      } else if (heartbeatFresh && heartbeat.is_on) {
        // Console is genuinely powered on (per real heartbeat data) but
        // no session is logged in our system — this is the actual ghost
        // condition, not a mock.
        const isDismissed = heartbeat.ghost_dismissed_at &&
          new Date(heartbeat.ghost_dismissed_at) >= new Date(heartbeat.last_heartbeat_at)

        if (!isDismissed) {
          status = 'ghost'
          ghost = true
          ghostMins = heartbeat.on_since
            ? Math.floor((now - new Date(heartbeat.on_since).getTime()) / 60000)
            : 0
        } else {
          status = 'idle'
        }
      } else if (heartbeatFresh && !heartbeat.is_on) {
        status = 'idle'
      }

      return {
        id: c.id,
        name: c.name,
        status,
        game: session?.session_rates?.name || heartbeat?.current_game || null,
        ip: heartbeat?.ip_address || null,
        heartbeatAgeSeconds: heartbeatAge !== null ? Math.floor(heartbeatAge / 1000) : null,
        heartbeatFresh,
        ghost,
        ghostMins,
      }
    })

    const freshHeartbeats = (heartbeats || []).filter(h => {
      const age = now - new Date(h.last_heartbeat_at).getTime()
      return age < HEARTBEAT_STALE_MS
    })

    const scriptOnline = freshHeartbeats.length > 0
    const lastHeartbeatSeconds = freshHeartbeats.length
      ? Math.min(...freshHeartbeats.map(h => Math.floor((now - new Date(h.last_heartbeat_at).getTime()) / 1000)))
      : null

    return NextResponse.json({
      consoles: enriched,
      scriptOnline,
      lastHeartbeatSeconds,
    })
  } catch (err) {
    console.error('GET /api/monitoring error:', err)
    return NextResponse.json({ consoles: [], scriptOnline: false, lastHeartbeatSeconds: null })
  }
}
