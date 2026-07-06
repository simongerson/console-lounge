import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Create timestamp bounds for PostgreSQL (Start and End of the target date)
    const startOfDay = `${date} 00:00:00`
    const endOfDay = `${date} 23:59:59`

    // Get Yesterday's bounds
    const yesterdayDate = new Date(date)
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0]
    const yesterdayStart = `${yesterdayStr} 00:00:00`
    const yesterdayEnd = `${yesterdayStr} 23:59:59`

    // 1. Fetch Today's Sessions (with joined table data)
    const { data: rawSessions, error: sessionsError } = await supabase
      .from('game_sessions')
      .select(`
        *,
        consoles (name, console_type),
        staff (name),
        session_rates (name)
      `)
      .gte('started_at', startOfDay)
      .lte('started_at', endOfDay)
      .order('started_at', { ascending: false })

    if (sessionsError) throw sessionsError;

    // 2. Calculate Revenue Summary in JavaScript (replaces complex SQL SUM cases)
    let totalRevenue = 0, cashRevenue = 0, mpesaRevenue = 0, activeSessions = 0
    const sessions = (rawSessions || []).map(s => {
      // Tally up revenue while formatting
      if (s.status === 'completed') {
        const amt = Number(s.amount || 0)
        totalRevenue += amt
        if (s.payment_method === 'cash') cashRevenue += amt
        if (s.payment_method === 'mpesa') mpesaRevenue += amt
      }
      if (s.status === 'active') activeSessions++

      // Format to match the old MySQL flat structure expected by the frontend
      return {
        ...s,
        console_name: s.consoles?.name,
        console_type: s.consoles?.console_type,
        staff_name: s.staff?.name,
        rate_name: s.session_rates?.name
      }
    })

    // 3. Fetch Today's Expenses
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('expense_date', date)
    
    const totalExpenses = (expensesData || []).reduce((sum, exp) => sum + Number(exp.amount || 0), 0)

    // 4. Fetch Active Consoles and any currently active sessions
    const { data: consolesData } = await supabase
      .from('consoles')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    const { data: allActiveSessions } = await supabase
      .from('game_sessions')
      .select(`
        id, started_at, amount, customer_name, console_id,
        session_rates (name), staff (name)
      `)
      .eq('status', 'active')

    // Attach active sessions to their respective consoles
    const consoles = (consolesData || []).map(c => {
      const activeSess = (allActiveSessions || []).find(s => s.console_id === c.id)
      return {
        ...c,
        session_id: activeSess?.id || null,
        started_at: activeSess?.started_at || null,
        session_amount: activeSess?.amount || null,
        customer_name: activeSess?.customer_name || null,
        rate_name: activeSess?.session_rates?.name || null,
        staff_name: activeSess?.staff?.name || null
      }
    })

    // 5. Fetch Active Shifts
    const { data: rawShifts } = await supabase
      .from('shifts')
      .select('*, staff (name)')
      .is('closed_at', null)
      .order('opened_at', { ascending: false })

    const shifts = (rawShifts || []).map(sh => ({
      ...sh,
      staff_name: sh.staff?.name
    }))

    // 6. Fetch Yesterday's Revenue
    const { data: yesterdayData } = await supabase
      .from('game_sessions')
      .select('amount')
      .eq('status', 'completed')
      .gte('started_at', yesterdayStart)
      .lte('started_at', yesterdayEnd)

    const yesterdayRev = (yesterdayData || []).reduce((sum, sess) => sum + Number(sess.amount || 0), 0)

    // Return the exact same JSON structure the frontend expects
    return NextResponse.json({
      date,
      revenue: {
        total: totalRevenue,
        cash: cashRevenue,
        mpesa: mpesaRevenue,
        profit: totalRevenue - totalExpenses,
        expenses: totalExpenses,
        sessions: sessions.length,
        activeSessions,
        yesterday: yesterdayRev,
      },
      consoles,
      shifts,
      sessions: sessions.slice(0, 20), // Send only 20 most recent sessions for the dashboard view
    })

  } catch (err) {
    console.error('Dashboard error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}