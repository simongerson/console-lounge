import { query } from '@/lib/mysqldb'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const date    = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const staffId = searchParams.get('staffId') || null

    let where = 'WHERE DATE(sh.opened_at) = ?'
    const params = [date]
    if (staffId) { where += ' AND sh.staff_id = ?'; params.push(staffId) }

    const shifts = await query(
      `SELECT sh.*, s.name as staff_name,
         COALESCE((SELECT SUM(g.amount) FROM game_sessions g
           WHERE g.shift_id = sh.id AND g.status = 'completed'), 0) as revenue,
         COALESCE((SELECT SUM(g.amount) FROM game_sessions g
           WHERE g.shift_id = sh.id AND g.status = 'completed'
           AND g.payment_method = 'cash'), 0) as cash_revenue,
         COALESCE((SELECT SUM(g.amount) FROM game_sessions g
           WHERE g.shift_id = sh.id AND g.status = 'completed'
           AND g.payment_method = 'mpesa'), 0) as mpesa_revenue,
         (SELECT COUNT(*) FROM game_sessions g
           WHERE g.shift_id = sh.id) as session_count,
         (SELECT COUNT(*) FROM game_sessions g
           WHERE g.shift_id = sh.id AND g.status = 'active') as unpaid_count,
         COALESCE((SELECT SUM(co.amount) FROM cash_outs co
           WHERE co.shift_id = sh.id), 0) as cashouts
       FROM shifts sh
       JOIN staff s ON s.id = sh.staff_id
       ${where}
       ORDER BY sh.opened_at DESC`,
      params
    )

    // Summary stats
    const [summary] = await query(
      `SELECT
         COUNT(*) as total_shifts,
         SUM(CASE WHEN closed_at IS NULL THEN 1 ELSE 0 END) as live_shifts,
         SUM(CASE WHEN closed_at IS NOT NULL THEN cash_expected ELSE 0 END) as expected_cash,
         SUM(CASE WHEN closed_at IS NOT NULL THEN cash_declared ELSE 0 END) as cash_counted,
         SUM(CASE WHEN closed_at IS NOT NULL THEN variance ELSE 0 END) as net_discrepancy
       FROM shifts sh WHERE DATE(opened_at) = ?`,
      [date]
    )

    // Last 10 shifts per staff for discrepancy history
    const allStaff = await query(
      `SELECT DISTINCT s.id, s.name FROM staff s
       JOIN shifts sh ON sh.staff_id = s.id
       WHERE is_active = 1 ORDER BY s.name`
    )

    const history = {}
    for (const st of allStaff) {
      const rows = await query(
        `SELECT variance FROM shifts
         WHERE staff_id = ? AND closed_at IS NOT NULL
         ORDER BY closed_at DESC LIMIT 10`,
        [st.id]
      )
      history[st.id] = { name: st.name, variances: rows.map(r => Number(r.variance || 0)) }
    }

    return NextResponse.json({ shifts, summary, history })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ shifts: [], summary: {}, history: {} })
  }
}