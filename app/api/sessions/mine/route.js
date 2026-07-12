import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/sessions/mine?staffId=...&shiftId=...
// Only sessions THIS staff member personally started, within their
// CURRENT shift — not all-time, not other staff's sessions.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    const shiftId = searchParams.get('shiftId')

    if (!staffId || !shiftId) {
      return NextResponse.json({ error: 'staffId and shiftId are required' }, { status: 400 })
    }

    const { data: sessions, error } = await supabase
      .from('game_sessions')
      .select('id, console_id, amount, payment_method, status, customer_name, started_at, ended_at, mpesa_ref')
      .eq('staff_id', staffId)
      .eq('shift_id', shiftId)
      .in('status', ['completed', 'debt', 'cancelled'])
      .order('ended_at', { ascending: false })

    if (error) throw error

    const consoleIds = [...new Set((sessions || []).map(s => s.console_id).filter(Boolean))]
    let consoleMap = {}
    if (consoleIds.length) {
      const { data: consoles } = await supabase
        .from('consoles')
        .select('id, name')
        .in('id', consoleIds)
      consoleMap = Object.fromEntries((consoles || []).map(c => [c.id, c.name]))
    }

    const enriched = (sessions || []).map(s => ({
      ...s,
      console_name: consoleMap[s.console_id] || 'Unknown',
    }))

    const completed = enriched.filter(s => s.status === 'completed')
    const summary = {
      total:     completed.reduce((sum, s) => sum + Number(s.amount || 0), 0),
      cash:      completed.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + Number(s.amount || 0), 0),
      mpesa:     completed.filter(s => s.payment_method === 'mpesa' || s.payment_method === 'mpesa_stk').reduce((sum, s) => sum + Number(s.amount || 0), 0),
      sessionCount: enriched.length,
      debtCount: enriched.filter(s => s.status === 'debt').length,
    }

    return NextResponse.json({ sessions: enriched, summary })
  } catch (err) {
    console.error('GET /api/sessions/mine error:', err)
    return NextResponse.json({ sessions: [], summary: {} })
  }
}
