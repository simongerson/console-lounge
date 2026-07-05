import { query } from '@/lib/mysqldb'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { shiftId, cashDeclared, mpesaDeclared } = await request.json()
    if (!shiftId) {
      return NextResponse.json({ error: 'Shift ID required' }, { status: 400 })
    }

    // Get all completed sessions for this shift
    const sessions = await query(
      `SELECT payment_method, SUM(amount) as total
       FROM game_sessions
       WHERE shift_id = ? AND status = 'completed'
       GROUP BY payment_method`,
      [shiftId]
    )

    let cashExpected  = 0
    let mpesaExpected = 0
    sessions.forEach(s => {
      if (s.payment_method === 'cash')  cashExpected  = Number(s.total)
      if (s.payment_method === 'mpesa') mpesaExpected = Number(s.total)
    })

    // Get expenses for this shift
    const expenses = await query(
      'SELECT SUM(amount) as total FROM expenses WHERE shift_id = ?',
      [shiftId]
    )
    const totalExpenses = Number(expenses[0]?.total || 0)

    const cashDec  = Number(cashDeclared  || 0)
    const mpesaDec = Number(mpesaDeclared || 0)
    const variance = (cashDec + mpesaDec) - (cashExpected + mpesaExpected)

    await query(
      `UPDATE shifts SET
        closed_at       = NOW(),
        cash_declared   = ?,
        mpesa_declared  = ?,
        cash_expected   = ?,
        mpesa_expected  = ?,
        variance        = ?
       WHERE id = ?`,
      [cashDec, mpesaDec, cashExpected, mpesaExpected, variance, shiftId]
    )

    return NextResponse.json({
      success: true,
      summary: {
        cashExpected, mpesaExpected,
        cashDeclared: cashDec, mpesaDeclared: mpesaDec,
        totalExpenses, variance,
        total: cashExpected + mpesaExpected,
      }
    })

  } catch (err) {
    console.error('Close shift error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}