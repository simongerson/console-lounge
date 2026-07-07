import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function PATCH(request, { params }) {
  try {
    const { name, pin, role, is_active } = await request.json()
    const updates = {}

    if (pin) {
      if (pin.length !== 4) {
        return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 })
      }
      updates.pin          = await bcrypt.hash(pin, 10)
      updates.pin_attempts = 0
      updates.locked_until = null
    }
    if (name      !== undefined) updates.name      = name
    if (role      !== undefined) updates.role      = role
    if (is_active !== undefined) updates.is_active = is_active

    // Always unlock on any update
    updates.pin_attempts = 0
    updates.locked_until = null

    const { error } = await supabase
      .from('staff').update(updates).eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await supabase.from('staff')
      .update({ is_active: false }).eq('id', params.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}