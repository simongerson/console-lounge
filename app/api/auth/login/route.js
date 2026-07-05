// app/api/auth/login/route.js
import { query } from '@/lib/mysqldb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'console_lounge_secret'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    // Find owner by email
    const owners = await query(
      'SELECT * FROM owners WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    )

    if (!owners || owners.length === 0) {
      return NextResponse.json(
        { error: 'Wrong email or password' },
        { status: 401 }
      )
    }

    const owner = owners[0]

    // Verify password
    const valid = await bcrypt.compare(password, owner.password)
    if (!valid) {
      return NextResponse.json(
        { error: 'Wrong email or password' },
        { status: 401 }
      )
    }

    // Create JWT token — expires in 12 hours
    const token = jwt.sign(
      { id: owner.id, email: owner.email, name: owner.name, role: 'owner' },
      JWT_SECRET,
      { expiresIn: '12h' }
    )

    // Set token in httpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set('owner_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12, // 12 hours
      path: '/',
    })

    return NextResponse.json({
      success: true,
      owner: { id: owner.id, name: owner.name, email: owner.email },
    })

  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    )
  }
}
