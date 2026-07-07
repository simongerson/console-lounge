import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today'

    const now  = new Date()
    let start, end

    if (period === 'yesterday') {
      const d = new Date(now); d.setDate(d.getDate() - 1)
      start = `${d.toISOString().split('T')[0]}T00:00:00`
      end   = `${d.toISOString().split('T')[0]}T23:59:59`
    } else if (period === 'week') {
      const d = new Date(now); d.setDate(d.getDate() - 6)
      start = `${d.toISOString().split('T')[0]}T00:00:00`
      end   = now.toISOString()
    } else {
      start = `${now.toISOString().split('T')[0]}T00:00:00`
      end   = `${now.toISOString().split('T')[0]}T23:59:59`
    }

    // Sessions for period
    const { data: sessions } = await supabase
      .from('game_sessions')
      .select('*, consoles(name, console_type), staff(name), session_rates(name)')
      .gte('started_at', start)
      .lte('started_at', end)
      .order('started_at', { ascending: false })

    const completed = (sessions || []).filter(s => s.status === 'completed')
    const total     = completed.reduce((s, x) => s + Number(x.amount), 0)
    const cash      = completed.filter(s => s.payment_method === 'cash').reduce((s, x) => s + Number(x.amount), 0)
    const mpesa     = completed.filter(s => s.payment_method === 'mpesa').reduce((s, x) => s + Number(x.amount), 0)

    // Expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .gte('expense_date', start.split('T')[0])
      .lte('expense_date', end.split('T')[0])
    const totalExpenses = (expenses || []).reduce((s, e) => s + Number(e.amount), 0)

    // Cash outs
    const { data: cashouts } = await supabase
      .from('cash_outs')
      .select('amount, status')
      .gte('created_at', start)
      .lte('created_at', end)
    const totalCashouts   = (cashouts || []).reduce((s, c) => s + Number(c.amount), 0)
    const pendingCashouts = (cashouts || []).filter(c => c.status === 'pending').length

    // Debts
    const { data: debts } = await supabase
      .from('debts').select('balance').neq('status', 'cleared')
    const totalDebts = (debts || []).reduce((s, d) => s + Number(d.balance || 0), 0)

    // Yesterday
    const yest = new Date(now); yest.setDate(yest.getDate() - 1)
    const { data: yesterdaySessions } = await supabase
      .from('game_sessions').select('amount')
      .gte('started_at', `${yest.toISOString().split('T')[0]}T00:00:00`)
      .lte('started_at', `${yest.toISOString().split('T')[0]}T23:59:59`)
      .eq('status', 'completed')
    const yesterday = (yesterdaySessions || []).reduce((s, x) => s + Number(x.amount), 0)

    // Consoles with active sessions
    const { data: consoles } = await supabase
      .from('consoles').select('*').eq('is_active', true).order('sort_order')
    const { data: activeSessions } = await supabase
      .from('game_sessions').select('*, session_rates(name)')
      .eq('status', 'active')

    const enrichedConsoles = (consoles || []).map(c => {
      const s = (activeSessions || []).find(x => x.console_id === c.id)
      return {
        ...c,
        session_id:     s?.id || null,
        started_at:     s?.started_at || null,
        session_amount: s?.amount || null,
        customer_name:  s?.customer_name || null,
        rate_name:      s?.session_rates?.name || null,
      }
    })

    // Active shifts
    const { data: shifts } = await supabase
      .from('shifts').select('*, staff(name)').is('closed_at', null)
    const enrichedShifts = await Promise.all((shifts || []).map(async sh => {
      const { data: shSessions } = await supabase
        .from('game_sessions').select('amount, status').eq('shift_id', sh.id)
      const revenue = (shSessions || []).filter(s => s.status === 'completed')
        .reduce((s, x) => s + Number(x.amount), 0)
      return {
        ...sh,
        staff_name:    sh.staff?.name,
        revenue,
        session_count: shSessions?.length || 0,
      }
    }))

    // 7-day chart
    const chartData = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const day = d.toISOString().split('T')[0]
      const { data: daySessions } = await supabase
        .from('game_sessions').select('amount')
        .gte('started_at', `${day}T00:00:00`)
        .lte('started_at', `${day}T23:59:59`)
        .eq('status', 'completed')
      chartData.push({
        day,
        label:    i === 0 ? 'Today' : d.toLocaleDateString('en-KE', { weekday: 'short' }),
        total:    (daySessions || []).reduce((s, x) => s + Number(x.amount), 0),
        isToday:  i === 0,
      })
    }

    const avg7day = Math.round(chartData.reduce((s, d) => s + d.total, 0) / 7)

    return NextResponse.json({
      revenue: {
        total, cash, mpesa,
        profit:         total - totalExpenses,
        expenses:       totalExpenses,
        cashouts:       totalCashouts,
        pendingCashouts,
        debts:          totalDebts,
        sessions:       (sessions || []).length,
        activeSessions: (activeSessions || []).length,
        yesterday,
        avg7day,
        projected:      Math.round((total / Math.max(1, new Date().getHours() - 7)) * 12),
      },
      consoles:  enrichedConsoles,
      shifts:    enrichedShifts,
      sessions:  (sessions || []).slice(0, 20).map(s => ({
        ...s,
        console_name: s.consoles?.name,
        staff_name:   s.staff?.name,
        rate_name:    s.session_rates?.name,
      })),
      chart: chartData,
    })

  } catch (err) {
    console.error('Dashboard error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}