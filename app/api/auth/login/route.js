import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const JWT_SECRET = process.env.JWT_SECRET || 'console_lounge_secret'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const { data: owners, error } = await supabase
      .from('owners')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .limit(1)

    if (error || !owners?.length) {
      return NextResponse.json({ error: 'Wrong email or password' }, { status: 401 })
    }

    const owner = owners[0]
    const valid = await bcrypt.compare(password, owner.password)
    if (!valid) {
      return NextResponse.json({ error: 'Wrong email or password' }, { status: 401 })
    }

    const token = jwt.sign(
      { id: owner.id, email: owner.email, name: owner.name, role: 'owner' },
      JWT_SECRET,
      { expiresIn: '12h' }
    )

    const cookieStore = await cookies()
    cookieStore.set('owner_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12,
      path: '/',
    })

    return NextResponse.json({
      success: true,
      owner: { id: owner.id, name: owner.name, email: owner.email },
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}