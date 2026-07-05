import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    const from   = searchParams.get('from')
    const to     = searchParams.get('to')

    // Calculate date range
    let startDate, endDate
    const now = new Date()
    endDate   = now.toISOString().split('T')[0]

    if (period === 'custom' && from && to) {
      startDate = from
      endDate   = to
    } else if (period === '7d') {
      const d = new Date(now)
      d.setDate(d.getDate() - 6)
      startDate = d.toISOString().split('T')[0]
    } else if (period === '30d') {
      const d = new Date(now)
      d.setDate(d.getDate() - 29)
      startDate = d.toISOString().split('T')[0]
    } else if (period === '90d') {
      const d = new Date(now)
      d.setDate(d.getDate() - 89)
      startDate = d.toISOString().split('T')[0]
    }

    // Summary stats
    const [summary] = await query(
      `SELECT
         COALESCE(SUM(amount), 0)                          as total_revenue,
         COUNT(*)                                          as total_sessions,
         COALESCE(AVG(amount), 0)                          as avg_per_session,
         SUM(CASE WHEN payment_method='cash'  THEN amount ELSE 0 END) as cash,
         SUM(CASE WHEN payment_method='mpesa' THEN amount ELSE 0 END) as mpesa
       FROM game_sessions
       WHERE DATE(started_at) BETWEEN ? AND ?
       AND status = 'completed'`,
      [startDate, endDate]
    )

    // Revenue by day for chart
    const dailyRevenue = await query(
      `SELECT
         DATE(started_at)    as day,
         DAYNAME(started_at) as day_name,
         DATE_FORMAT(started_at, '%e %b') as label,
         COALESCE(SUM(CASE WHEN status='completed' THEN amount ELSE 0 END), 0) as total,
         COUNT(*)            as sessions
       FROM game_sessions
       WHERE DATE(started_at) BETWEEN ? AND ?
       GROUP BY DATE(started_at)
       ORDER BY day ASC`,
      [startDate, endDate]
    )

    // Fill missing days
    const dayMap = {}
    dailyRevenue.forEach(d => { dayMap[d.day] = d })
    const chartData = []
    const start = new Date(startDate)
    const end   = new Date(endDate)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key    = d.toISOString().split('T')[0]
      const isToday = key === endDate
      const label  = isToday ? 'TODAY'
        : d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }).toUpperCase()
      chartData.push({
        day:      key,
        label,
        total:    dayMap[key]?.total    || 0,
        sessions: dayMap[key]?.sessions || 0,
        isToday,
      })
    }

    // By game type
    const byGame = await query(
      `SELECT
         COALESCE(sr.name, 'Unknown') as game,
         COUNT(*)                     as sessions,
         COALESCE(SUM(gs.amount), 0)  as revenue
       FROM game_sessions gs
       LEFT JOIN session_rates sr ON sr.id = gs.rate_id
       WHERE DATE(gs.started_at) BETWEEN ? AND ?
       AND gs.status = 'completed'
       GROUP BY sr.id, sr.name
       ORDER BY revenue DESC`,
      [startDate, endDate]
    )

    // Peak hours (0–23)
    const peakHours = await query(
      `SELECT
         HOUR(started_at) as hour,
         COUNT(*)         as sessions
       FROM game_sessions
       WHERE DATE(started_at) BETWEEN ? AND ?
       AND status = 'completed'
       GROUP BY HOUR(started_at)
       ORDER BY hour ASC`,
      [startDate, endDate]
    )

    // Build full 24hr array
    const hourMap = {}
    peakHours.forEach(h => { hourMap[h.hour] = h.sessions })
    const peakData = Array.from({ length: 24 }, (_, i) => ({
      hour:     i,
      label:    i === 0 ? '12am' : i < 12 ? `${i}am`
               : i === 12 ? '12pm' : `${i-12}pm`,
      sessions: hourMap[i] || 0,
    })).filter(h => h.sessions > 0 || (h.hour >= 8 && h.hour <= 23))

    // By staff
    const byStaff = await query(
      `SELECT
         s.name               as staff,
         COUNT(gs.id)         as sessions,
         COALESCE(SUM(gs.amount), 0) as revenue
       FROM game_sessions gs
       JOIN staff s ON s.id = gs.staff_id
       WHERE DATE(gs.started_at) BETWEEN ? AND ?
       AND gs.status = 'completed'
       GROUP BY gs.staff_id, s.name
       ORDER BY revenue DESC`,
      [startDate, endDate]
    )

    // By console
    const byConsole = await query(
      `SELECT
         c.name               as console,
         COUNT(gs.id)         as sessions,
         COALESCE(SUM(gs.amount), 0) as revenue
       FROM game_sessions gs
       JOIN consoles c ON c.id = gs.console_id
       WHERE DATE(gs.started_at) BETWEEN ? AND ?
       AND gs.status = 'completed'
       GROUP BY gs.console_id, c.name
       ORDER BY revenue DESC`,
      [startDate, endDate]
    )

    const total     = Number(summary.total_revenue || 0)
    const cash      = Number(summary.cash  || 0)
    const mpesa     = Number(summary.mpesa || 0)
    const sessions  = Number(summary.total_sessions || 0)
    const days      = Math.max(1, chartData.length)
    const avgPerDay = Math.round(total / days)

    return NextResponse.json({
      period, startDate, endDate,
      summary: {
        total, sessions, cash, mpesa,
        avgPerSession: Math.round(Number(summary.avg_per_session || 0)),
        cashPct:  total > 0 ? Math.round((cash  / total) * 100) : 0,
        mpesaPct: total > 0 ? Math.round((mpesa / total) * 100) : 0,
        avgPerDay,
      },
      chartData,
      byGame,
      peakData,
      byStaff,
      byConsole,
    })

  } catch (err) {
    console.error('Reports error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}