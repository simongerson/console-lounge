import { query } from '@/lib/mysqldb'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') ||
      new Date().toISOString().split('T')[0]

    // Today's sessions
    const sessions = await query(
      `SELECT gs.*, c.name as console_name, c.console_type,
              s.name as staff_name, sr.name as rate_name
       FROM game_sessions gs
       LEFT JOIN consoles c ON c.id = gs.console_id
       LEFT JOIN staff s    ON s.id = gs.staff_id
       LEFT JOIN session_rates sr ON sr.id = gs.rate_id
       WHERE DATE(gs.started_at) = ?
       ORDER BY gs.started_at DESC`,
      [date]
    )

    // Revenue summary
    const revenue = await query(
      `SELECT
         COUNT(*) as total_sessions,
         SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
         SUM(CASE WHEN status = 'completed' AND payment_method = 'cash'
               THEN amount ELSE 0 END) as cash_revenue,
         SUM(CASE WHEN status = 'completed' AND payment_method = 'mpesa'
               THEN amount ELSE 0 END) as mpesa_revenue,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_sessions
       FROM game_sessions
       WHERE DATE(started_at) = ?`,
      [date]
    )

    // Expenses today
    const expenses = await query(
      `SELECT SUM(amount) as total FROM expenses WHERE expense_date = ?`,
      [date]
    )

    // Console status
    const consoles = await query(
      `SELECT c.*,
         gs.id as session_id, gs.started_at,
         gs.amount as session_amount, gs.customer_name,
         sr.name as rate_name, s.name as staff_name
       FROM consoles c
       LEFT JOIN game_sessions gs
         ON gs.console_id = c.id AND gs.status = 'active'
       LEFT JOIN session_rates sr ON sr.id = gs.rate_id
       LEFT JOIN staff s ON s.id = gs.staff_id
       WHERE c.is_active = 1
       ORDER BY c.sort_order ASC`
    )

    // Active shifts
    const shifts = await query(
      `SELECT sh.*, s.name as staff_name
       FROM shifts sh
       JOIN staff s ON s.id = sh.staff_id
       WHERE sh.closed_at IS NULL
       ORDER BY sh.opened_at DESC`
    )

    // Yesterday revenue for comparison
    const yesterday = await query(
      `SELECT SUM(amount) as total FROM game_sessions
       WHERE DATE(started_at) = DATE_SUB(?, INTERVAL 1 DAY)
       AND status = 'completed'`,
      [date]
    )

    const rev = revenue[0] || {}
    const totalRevenue    = Number(rev.total_revenue   || 0)
    const totalExpenses   = Number(expenses[0]?.total  || 0)
    const yesterdayRev    = Number(yesterday[0]?.total || 0)

    return NextResponse.json({
      date,
      revenue: {
        total:       totalRevenue,
        cash:        Number(rev.cash_revenue  || 0),
        mpesa:       Number(rev.mpesa_revenue || 0),
        profit:      totalRevenue - totalExpenses,
        expenses:    totalExpenses,
        sessions:    Number(rev.total_sessions  || 0),
        activeSessions: Number(rev.active_sessions || 0),
        yesterday:   yesterdayRev,
      },
      consoles,
      shifts,
      sessions: sessions.slice(0, 20),
    })

  } catch (err) {
    console.error('Dashboard error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}