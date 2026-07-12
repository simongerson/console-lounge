import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST /api/monitoring/dismiss-ghost
// Body: { consoleId }
// Dismissal holds until the NEXT heartbeat still reports the same ghost
// condition — so a genuinely resolved issue stays dismissed, but an
// ongoing one will reappear rather than being silenced forever.
export async function POST(request) {
  try {
    const { consoleId } = await request.json()
    if (!consoleId) {
      return NextResponse.json({ error: 'consoleId is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('console_heartbeats')
      .update({ ghost_dismissed_at: new Date().toISOString() })
      .eq('console_id', consoleId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/monitoring/dismiss-ghost error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
