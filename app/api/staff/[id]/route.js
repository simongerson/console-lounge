import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    if (!id) {
      return NextResponse.json({ error: 'Missing staff id' }, { status: 400 })
    }

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

    updates.pin_attempts = 0
    updates.locked_until = null

    const { error } = await supabase
      .from('staff').update(updates).eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/staff/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    if (!id) {
      return NextResponse.json({ error: 'Missing staff id' }, { status: 400 })
    }

    const { error } = await supabase.from('staff')
      .update({ is_active: false }).eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/staff/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
