import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(request, { params }) {
  try {
    const { status } = await request.json()
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    await query(
      'UPDATE cash_outs SET status = ? WHERE id = ?',
      [status, params.id]
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await query('DELETE FROM cash_outs WHERE id = ? AND status = "pending"',
      [params.id])
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}