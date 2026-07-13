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
      return NextResponse.json({ error: 'Missing cashout id' }, { status: 400 })
    }

    const { status } = await request.json()
    const { error } = await supabase.from('cash_outs').update({ status }).eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/cashouts/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    if (!id) {
      return NextResponse.json({ error: 'Missing cashout id' }, { status: 400 })
    }

    const { error } = await supabase.from('cash_outs')
      .delete().eq('id', id).eq('status', 'pending')
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/cashouts/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
