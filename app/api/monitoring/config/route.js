import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/monitoring/config
// Header: x-agent-key: <shared secret>
//
// Called by the monitoring agent on startup (and periodically) to fetch
// which consoles to check and how to identify them (MAC and/or IP).
// This means the agent itself ships with almost no configuration —
// everything real gets set up later, in the browser, once you're
// actually on-site with the consoles.
export async function GET(request) {
  try {
    const agentKey = request.headers.get('x-agent-key')
    if (!agentKey || agentKey !== process.env.AGENT_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: consoles, error } = await supabase
      .from('consoles')
      .select('id, name, mac_address, static_ip')
      .eq('is_active', true)
      .or('mac_address.not.is.null,static_ip.not.is.null')

    if (error) throw error

    return NextResponse.json({
      consoles: (consoles || []).map(c => ({
        consoleId: c.id,
        name: c.name,
        mac: c.mac_address,
        ip: c.static_ip,
      })),
    })
  } catch (err) {
    console.error('GET /api/monitoring/config error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/monitoring/config
// Body: { consoleId, macAddress, staticIp }
// Called from the browser (Monitoring Setup UI) to save a console's
// MAC/IP. Owner-only in practice via the page-level proxy guard —
// same caveat as other owner routes flagged in the security review:
// this doesn't independently verify the caller server-side yet.
export async function PATCH(request) {
  try {
    const { consoleId, macAddress, staticIp } = await request.json()

    if (!consoleId) {
      return NextResponse.json({ error: 'consoleId is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('consoles')
      .update({
        mac_address: macAddress?.trim() || null,
        static_ip: staticIp?.trim() || null,
      })
      .eq('id', consoleId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/monitoring/config error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
