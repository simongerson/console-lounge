import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const { data } = await supabase
      .from('staff').select('*').order('created_at', { ascending: true })
    return NextResponse.json({ staff: data || [] })
  } catch (err) {
    return NextResponse.json({ staff: [] })
  }
}

export async function POST(request) {
  try {
    const { name, pin, role } = await request.json()
    if (!name || !pin || pin.length !== 4) {
      return NextResponse.json(
        { error: 'Name and 4-digit PIN required' }, { status: 400 }
      )
    }
    const hashed = await bcrypt.hash(pin, 10)
    const { data, error } = await supabase
      .from('staff')
      .insert({ name: name.trim(), pin: hashed, role: role || 'staff' })
      .select().single()
    if (error) throw error
    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}