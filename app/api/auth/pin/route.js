import { query } from '@/lib/mysqldb'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

const MAX_ATTEMPTS    = 5
const LOCKOUT_MINUTES = 15

export async function POST(request) {
  try {
    const { pin } = await request.json()
    if (!pin || pin.length !== 4) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 400 })
    }

    const staffList = await query('SELECT * FROM staff WHERE is_active = 1')
    if (!staffList || staffList.length === 0) {
      return NextResponse.json({ error: 'No staff found' }, { status: 404 })
    }

    for (const s of staffList) {
      if (s.locked_until && new Date(s.locked_until) > new Date()) {
        return NextResponse.json({
          error: 'Account locked', locked: true, lockedUntil: s.locked_until,
        }, { status: 403 })
      }
    }

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
        const lockoutStr = lockout.toISOString().slice(0, 19).replace('T', ' ')
        await query(
          'UPDATE staff SET pin_attempts = ?, locked_until = ? WHERE is_active = 1',
          [newAttempts, lockoutStr]
        )
        return NextResponse.json({
          error: `Locked for ${LOCKOUT_MINUTES} minutes`,
          locked: true, lockedUntil: lockoutStr,
        }, { status: 403 })
      }
      await query(
        'UPDATE staff SET pin_attempts = ? WHERE is_active = 1',
        [newAttempts]
      )
      return NextResponse.json({
        error: 'Wrong PIN', attemptsLeft: MAX_ATTEMPTS - newAttempts,
      }, { status: 401 })
    }

    await query(
      'UPDATE staff SET pin_attempts = 0, locked_until = NULL WHERE id = ?',
      [matched.id]
    )

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