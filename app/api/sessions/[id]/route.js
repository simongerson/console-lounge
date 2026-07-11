import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// Next.js 16 requires params to be awaited before accessing its
// properties — the same issue we found and fixed on the M-Pesa status
// route. Accessing params.id synchronously here would silently return
// undefined, making .eq('id', undefined) match nothing, and every
// caller of this route (End Session page, etc.) would see session=null.
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    if (!id) {
      console.error('[sessions/id] missing id in params:', resolvedParams)
      return NextResponse.json({ session: null, error: 'Missing session id' })
    }

    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('[sessions/id] query error:', error.message)
    }

    return NextResponse.json({ session: data || null })
  } catch (err) {
    console.error('GET /api/sessions/[id] error:', err)
    return NextResponse.json({ session: null })
  }
}
