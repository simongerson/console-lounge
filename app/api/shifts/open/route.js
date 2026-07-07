import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { staffId, floatAmount } = await request.json()
    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID required' }, { status: 400 })
    }

    // Check no open shift already
    const { data: existing } = await supabase
      .from('shifts')
      .select('id')
      .eq('staff_id', staffId)
      .is('closed_at', null)
      .limit(1)

    if (existing?.length) {
      return NextResponse.json({ shiftId: existing[0].id, alreadyOpen: true })
    }

    const { data, error } = await supabase
      .from('shifts')
      .insert({ staff_id: staffId, float_amount: floatAmount || 0 })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ shiftId: data.id, success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}