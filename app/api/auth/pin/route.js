import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const MAX_ATTEMPTS    = 5
const LOCKOUT_MINUTES = 15

export async function POST(request) {
  try {
    const { pin } = await request.json()
    if (!pin || pin.length !== 4) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 400 })
    }

    const { data: staffList } = await supabase
      .from('staff')
      .select('*')
      .eq('is_active', true)

    if (!staffList?.length) {
      return NextResponse.json({ error: 'No staff found' }, { status: 404 })
    }

    // Check lockout
    for (const s of staffList) {
      if (s.locked_until && new Date(s.locked_until) > new Date()) {
        return NextResponse.json({
          error: 'Account locked', locked: true, lockedUntil: s.locked_until,
        }, { status: 403 })
      }
    }

    // Match PIN
    let matched = null
    for (const s of staffList) {
      let valid = false
      if (s.pin.startsWith('$2')) {
        valid = await bcrypt.compare(pin, s.pin)
      } else {
        valid = s.pin === pin
      }
      if (valid) { matched = s; break }
    }

    if (!matched) {
      const newAttempts = (staffList[0].pin_attempts || 0) + 1
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockout = new Date()
        lockout.setMinutes(lockout.getMinutes() + LOCKOUT_MINUTES)
        await supabase.from('staff')
          .update({ pin_attempts: newAttempts, locked_until: lockout.toISOString() })
          .eq('is_active', true)
        return NextResponse.json({
          error: `Locked for ${LOCKOUT_MINUTES} minutes`,
          locked: true, lockedUntil: lockout.toISOString(),
        }, { status: 403 })
      }
      await supabase.from('staff')
        .update({ pin_attempts: newAttempts })
        .eq('is_active', true)
      return NextResponse.json({
        error: 'Wrong PIN', attemptsLeft: MAX_ATTEMPTS - newAttempts,
      }, { status: 401 })
    }

    // Reset attempts
    await supabase.from('staff')
      .update({ pin_attempts: 0, locked_until: null })
      .eq('id', matched.id)

    const token = `${matched.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`

    return NextResponse.json({
      success: true, token,
      staff: { id: matched.id, name: matched.name, role: matched.role },
    })
  } catch (err) {
    console.error('PIN error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}