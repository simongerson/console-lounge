import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    if (!staffId) return NextResponse.json({ shift: null })

    const { data } = await supabase
      .from('shifts')
      .select('*')
      .eq('staff_id', staffId)
      .is('closed_at', null)
      .order('opened_at', { ascending: false })
      .limit(1)

    return NextResponse.json({ shift: data?.[0] || null })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ shift: null })
  }
}