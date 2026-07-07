import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    const from   = searchParams.get('from')
    const to     = searchParams.get('to')

    const now = new Date()
    let startDate = new Date(now)

    if (period === 'custom' && from && to) {
      startDate = new Date(from)
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 29)
    } else if (period === '90d') {
      startDate.setDate(startDate.getDate() - 89)
    } else {
      startDate.setDate(startDate.getDate() - 6)
    }

    const startStr = (period === 'custom' && from) ? from : startDate.toISOString().split('T')[0]
    const endStr   = (period === 'custom' && to)   ? to   : now.toISOString().split('T')[0]

    const { data: sessions } = await supabase
      .from('game_sessions')
      .select('*, session_rates(name), staff(name), consoles(name)')
      .gte('started_at', `${startStr}T00:00:00`)
      .lte('started_at', `${endStr}T23:59:59`)
      .eq('status', 'completed')

    const all = sessions || []
    const total   = all.reduce((s, x) => s + Number(x.amount), 0)
    const cash    = all.filter(s => s.payment_method === 'cash').reduce((s, x) => s + Number(x.amount), 0)
    const mpesa   = all.filter(s => s.payment_method === 'mpesa').reduce((s, x) => s + Number(x.amount), 0)

    // Chart — group by day
    const dayMap = {}
    all.forEach(s => {
      const day = s.started_at.split('T')[0]
      if (!dayMap[day]) dayMap[day] = { total: 0, sessions: 0 }
      dayMap[day].total    += Number(s.amount)
      dayMap[day].sessions += 1
    })

    const chartData = []
    const start = new Date(startStr)
    const end   = new Date(endStr)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key     = d.toISOString().split('T')[0]
      const isToday = key === endStr
      chartData.push({
        day:      key,
        label:    isToday ? 'TODAY' : d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }).toUpperCase(),
        total:    dayMap[key]?.total    || 0,
        sessions: dayMap[key]?.sessions || 0,
        isToday,
      })
    }

    // By game
    const gameMap = {}
    all.forEach(s => {
      const name = s.session_rates?.name || 'Unknown'
      if (!gameMap[name]) gameMap[name] = { game: name, sessions: 0, revenue: 0 }
      gameMap[name].sessions += 1
      gameMap[name].revenue  += Number(s.amount)
    })
    const byGame = Object.values(gameMap).sort((a, b) => b.revenue - a.revenue)

    // Peak hours
    const hourMap = {}
    all.forEach(s => {
      const h = new Date(s.started_at).getHours()
      hourMap[h] = (hourMap[h] || 0) + 1
    })
    const peakData = Array.from({ length: 24 }, (_, i) => ({
      hour:     i,
      label:    i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i-12}pm`,
      sessions: hourMap[i] || 0,
    })).filter(h => h.sessions > 0 || (h.hour >= 8 && h.hour <= 23))

    // By staff
    const staffMap = {}
    all.forEach(s => {
      const name = s.staff?.name || 'Unknown'
      if (!staffMap[name]) staffMap[name] = { staff: name, sessions: 0, revenue: 0 }
      staffMap[name].sessions += 1
      staffMap[name].revenue  += Number(s.amount)
    })
    const byStaff = Object.values(staffMap).sort((a, b) => b.revenue - a.revenue)

    // By console
    const consoleMap = {}
    all.forEach(s => {
      const name = s.consoles?.name || 'Unknown'
      if (!consoleMap[name]) consoleMap[name] = { console: name, sessions: 0, revenue: 0 }
      consoleMap[name].sessions += 1
      consoleMap[name].revenue  += Number(s.amount)
    })
    const byConsole = Object.values(consoleMap).sort((a, b) => b.revenue - a.revenue)

    const days      = chartData.length || 1
    const avgPerDay = Math.round(total / days)

    return NextResponse.json({
      period, startDate: startStr, endDate: endStr,
      summary: {
        total, cash, mpesa,
        sessions:      all.length,
        avgPerSession: all.length ? Math.round(total / all.length) : 0,
        cashPct:  total > 0 ? Math.round((cash  / total) * 100) : 0,
        mpesaPct: total > 0 ? Math.round((mpesa / total) * 100) : 0,
        avgPerDay,
      },
      chartData, byGame, peakData, byStaff, byConsole,
    })

  } catch (err) {
    console.error('Reports error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}