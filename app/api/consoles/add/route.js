import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { name, console_type } = await request.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }

    const { data: max } = await supabase
      .from('consoles')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = (max?.[0]?.sort_order || 0) + 1

    const { data, error } = await supabase
      .from('consoles')
      .insert({ name: name.trim(), console_type: console_type || 'PS5', sort_order: nextOrder })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}