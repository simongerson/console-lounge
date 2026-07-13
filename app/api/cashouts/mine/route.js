import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/cashouts/mine?staffId=...&shiftId=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    const shiftId = searchParams.get('shiftId')

    if (!staffId || !shiftId) {
      return NextResponse.json({ error: 'staffId and shiftId are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('cash_outs')
      .select('*')
      .eq('staff_id', staffId)
      .eq('shift_id', shiftId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ cashouts: data || [] })
  } catch (err) {
    console.error('GET /api/cashouts/mine error:', err)
    return NextResponse.json({ cashouts: [] })
  }
}
