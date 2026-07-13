import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('cash_outs')
      .select('*, staff(name)')
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`)
      .order('created_at', { ascending: false })

    const cashouts = (data || []).map(c => ({ ...c, staff_name: c.staff?.name }))
    const total    = cashouts.reduce((s, c) => s + Number(c.amount), 0)
    const summary  = {
      total,
      pending:  cashouts.filter(c => c.status === 'pending').length,
      approved: cashouts.filter(c => c.status === 'approved').length,
      rejected: cashouts.filter(c => c.status === 'rejected').length,
    }

    return NextResponse.json({ cashouts, summary })
  } catch (err) {
    return NextResponse.json({ cashouts: [], summary: {} })
  }
}

export async function POST(request) {
  try {
    const { staffId, shiftId, amount, reason } = await request.json()
    if (!amount) {
      return NextResponse.json({ error: 'Amount required' }, { status: 400 })
    }
    const { error } = await supabase.from('cash_outs').insert({
      staff_id: staffId || null,
      shift_id: shiftId || null,
      amount:   Number(amount),
      reason:   reason?.trim() || null,
      status:   'pending',
    })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
