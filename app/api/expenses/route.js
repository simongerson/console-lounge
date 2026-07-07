import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const { data: expenses } = await supabase
      .from('expenses')
      .select('*, shifts(staff(name))')
      .eq('expense_date', date)
      .order('created_at', { ascending: false })

    const enriched = (expenses || []).map(e => ({
      ...e, staff_name: e.shifts?.staff?.name || null,
    }))

    const total = enriched.reduce((s, e) => s + Number(e.amount), 0)
    const byCategory = Object.values(
      enriched.reduce((acc, e) => {
        if (!acc[e.category]) acc[e.category] = { category: e.category, total: 0, count: 0 }
        acc[e.category].total += Number(e.amount)
        acc[e.category].count += 1
        return acc
      }, {})
    ).sort((a, b) => b.total - a.total)

    return NextResponse.json({
      expenses: enriched,
      summary:  { total, count: enriched.length },
      byCategory,
    })
  } catch (err) {
    return NextResponse.json({ expenses: [], summary: {}, byCategory: [] })
  }
}

export async function POST(request) {
  try {
    const { category, description, amount, date, shiftId } = await request.json()
    if (!category || !amount) {
      return NextResponse.json({ error: 'Category and amount required' }, { status: 400 })
    }
    const { error } = await supabase.from('expenses').insert({
      shift_id:     shiftId || null,
      category:     category.trim(),
      description:  description?.trim() || null,
      amount:       Number(amount),
      expense_date: date || new Date().toISOString().split('T')[0],
    })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await supabase.from('expenses').delete().eq('id', id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}