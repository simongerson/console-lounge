'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      router.push('/dashboard')

    } catch (err) {
      setError('Connection error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#0a0a0a' }}>

      {/* Grid background */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(13,148,136,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.08) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 w-full max-w-sm mx-4">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center
            justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}>
            <svg className="w-9 h-9" fill="white" viewBox="0 0 24 24">
              <path d="M7 10h2v2H7v2H5v-2H3v-2h2V8h2v2zm11.5 1a1.5 1.5 0 1 1
                0-3 1.5 1.5 0 0 1 0 3zm-3 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1
                0 3zM17 5H7C4.24 5 2 7.24 2 10v4c0 2.76 2.24 5 5 5h10c2.76 0
                5-2.24 5-5v-4c0-2.76-2.24-5-5-5z"/>
            </svg>
          </div>
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: 0 }}>
            Console Lounge
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>
            Manager Dashboard
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(13,148,136,0.2)',
          borderRadius: '20px',
          padding: '32px 28px',
        }}>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: '0 0 4px' }}>
            Owner Login
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: '0 0 24px' }}>
            Sign in to manage your lounge
          </p>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{
                display: 'block', color: 'rgba(255,255,255,0.45)',
                fontSize: '11px', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '1px',
                marginBottom: '6px',
              }}>Email</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                required placeholder="you@email.com"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', padding: '12px 14px',
                  color: '#fff', fontSize: '14px', outline: 'none',
                }}
                onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
                onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', color: 'rgba(255,255,255,0.45)',
                fontSize: '11px', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '1px',
                marginBottom: '6px',
              }}>Password</label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                required placeholder="••••••••"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', padding: '12px 14px',
                  color: '#fff', fontSize: '14px', outline: 'none',
                }}
                onFocus={e => e.target.style.border = '1px solid rgba(13,148,136,0.7)'}
                onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '8px', padding: '10px 14px',
                marginBottom: '16px',
              }}>
                <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0 }}>
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width: '100%',
              background: loading ? 'rgba(13,148,136,0.4)' : '#0d9488',
              border: 'none', borderRadius: '10px',
              padding: '14px', color: '#fff',
              fontSize: '15px', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(13,148,136,0.3)',
            }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{
                    width: '15px', height: '15px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Staff PIN link */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button onClick={() => router.push('/pos')} style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.3)', fontSize: '13px',
              cursor: 'pointer', textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}>
              Staff — enter PIN
            </button>
          </div>
        </div>

        <p style={{
          textAlign: 'center', color: 'rgba(255,255,255,0.15)',
          fontSize: '11px', marginTop: '20px',
        }}>
          Console Lounge Manager v1.0
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.22); }
      `}</style>
    </div>
  )
}
