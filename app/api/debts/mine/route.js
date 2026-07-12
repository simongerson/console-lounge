import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/debts/mine?staffId=...&shiftId=...
// Only debts created from sessions THIS staff member started, within
// their CURRENT shift. Debts don't have staff_id/shift_id directly —
// scoped via their originating game_session.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    const shiftId = searchParams.get('shiftId')

    if (!staffId || !shiftId) {
      return NextResponse.json({ error: 'staffId and shiftId are required' }, { status: 400 })
    }

    // First find this staff/shift's own debt-sessions
    const { data: sessions } = await supabase
      .from('game_sessions')
      .select('id')
      .eq('staff_id', staffId)
      .eq('shift_id', shiftId)
      .eq('status', 'debt')

    const sessionIds = (sessions || []).map(s => s.id)
    if (!sessionIds.length) {
      return NextResponse.json({ debts: [], summary: { totalOutstanding: 0, count: 0 } })
    }

    const { data: debts, error } = await supabase
      .from('debts')
      .select('*')
      .in('game_session_id', sessionIds)
      .order('created_at', { ascending: false })

    if (error) throw error

    const summary = {
      totalOutstanding: (debts || [])
        .filter(d => d.status !== 'cleared')
        .reduce((sum, d) => sum + Number(d.balance || (d.amount - d.amount_paid) || 0), 0),
      count: (debts || []).filter(d => d.status !== 'cleared').length,
    }

    return NextResponse.json({ debts: debts || [], summary })
  } catch (err) {
    console.error('GET /api/debts/mine error:', err)
    return NextResponse.json({ debts: [], summary: {} })
  }
}
