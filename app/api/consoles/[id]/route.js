import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    if (!id) {
      return NextResponse.json({ error: 'Missing console id' }, { status: 400 })
    }

    const body = await request.json()
    const updates = {}
    if (body.name        !== undefined) updates.name         = body.name
    if (body.console_type!== undefined) updates.console_type = body.console_type
    if (body.is_active   !== undefined) updates.is_active    = body.is_active
    if (body.status      !== undefined) updates.status       = body.status

    const { error } = await supabase
      .from('consoles').update(updates).eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/consoles/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    if (!id) {
      return NextResponse.json({ error: 'Missing console id' }, { status: 400 })
    }

    const { error } = await supabase.from('consoles')
      .update({ is_active: false }).eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/consoles/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
