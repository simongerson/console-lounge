'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const MAX_ATTEMPTS = 5

export default function StaffPinPage() {
  const [pin, setPin]           = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState(null)
  const [lockoutEnd, setLockoutEnd]     = useState(null)
  const router = useRouter()

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cl_staff_session')
      if (!raw) return
      const s = JSON.parse(raw)
      if (new Date(s.expiresAt) > new Date()) {
        checkShift(s.staffId)
      } else {
        localStorage.removeItem('cl_staff_session')
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!lockoutEnd) return
    const interval = setInterval(() => {
      const remaining = Math.ceil((new Date(lockoutEnd) - new Date()) / 1000)
      if (remaining <= 0) {
        setLockoutEnd(null); setError(''); clearInterval(interval)
      } else {
        const m = Math.floor(remaining / 60)
        const s = remaining % 60
        setError(`Locked. Try again in ${m}:${s.toString().padStart(2,'0')}`)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [lockoutEnd])

  async function checkShift(staffId) {
    try {
      const res  = await fetch(`/api/shifts/active?staffId=${staffId}`)
      const data = await res.json()
      if (data.shift) {
        localStorage.setItem('cl_shift_id', data.shift.id)
        router.push('/pos/sessions')
      } else {
        router.push('/pos/shift-open')
      }
    } catch { router.push('/pos/shift-open') }
  }

  async function verifyPin(enteredPin) {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: enteredPin }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.locked) {
          setLockoutEnd(data.lockedUntil)
        } else {
          setAttemptsLeft(data.attemptsLeft ?? MAX_ATTEMPTS - 1)
          setError(`Wrong PIN. ${data.attemptsLeft ?? MAX_ATTEMPTS - 1} attempt${data.attemptsLeft !== 1 ? 's' : ''} left.`)
        }
        setPin(''); setLoading(false); return
      }

      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 12)
      localStorage.setItem('cl_staff_session', JSON.stringify({
        staffId: data.staff.id, staffName: data.staff.name,
        role: data.staff.role, token: data.token,
        expiresAt: expiresAt.toISOString(),
      }))
      localStorage.setItem('cl_staff_id',   data.staff.id)
      localStorage.setItem('cl_staff_name', data.staff.name)
      await checkShift(data.staff.id)

    } catch {
      setError('Connection error. Try again.')
      setPin(''); setLoading(false)
    }
  }

  function pressKey(val) {
    if (loading || lockoutEnd) return
    if (val === 'del') { setPin(p => p.slice(0, -1)); return }
    if (pin.length >= 4) return
    const next = pin + val
    setPin(next)
    if (next.length === 4) verifyPin(next)
  }

  const keys = ['1','2','3','4','5','6','7','8','9','','0','del']

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#0a0a0a' }}>
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(13,148,136,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.06) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="relative z-10 w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}>
            <svg className="w-7 h-7" fill="white" viewBox="0 0 24 24">
              <path d="M7 10h2v2H7v2H5v-2H3v-2h2V8h2v2zm11.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-3 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM17 5H7C4.24 5 2 7.24 2 10v4c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5v-4c0-2.76-2.24-5-5-5z"/>
            </svg>
          </div>
          <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Staff Login</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>Enter your 4-digit PIN</p>
        </div>

        <div className="flex justify-center gap-4 mb-6">
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: '14px', height: '14px', borderRadius: '50%',
              background: pin.length > i ? '#0d9488' : 'rgba(255,255,255,0.15)',
              transform: pin.length > i ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.15s',
            }} />
          ))}
        </div>

        {error && (
          <div style={{
            background: lockoutEnd ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
            border: `1px solid ${lockoutEnd ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
            borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', textAlign: 'center',
          }}>
            <p style={{ color: lockoutEnd ? '#fca5a5' : '#fcd34d', fontSize: '13px', margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {keys.map((k, i) => (
            <button key={i} onClick={() => k !== '' && pressKey(k)}
              disabled={loading || !!lockoutEnd || k === ''}
              style={{
                height: '64px', borderRadius: '14px',
                fontSize: k === 'del' ? '14px' : '22px', fontWeight: 600,
                cursor: k === '' ? 'default' : (loading || lockoutEnd) ? 'not-allowed' : 'pointer',
                opacity: k === '' ? 0 : (loading || lockoutEnd) ? 0.4 : 1,
                background: k === 'del' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.05)',
                border: k === 'del' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(13,148,136,0.15)',
                color: k === 'del' ? 'rgba(255,255,255,0.5)' : '#fff',
              }}>
              {k === 'del' ? '⌫' : k}
            </button>
          ))}
        </div>

        <button onClick={() => router.push('/login')} style={{
          display: 'block', width: '100%', marginTop: '24px',
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.25)', fontSize: '12px',
          cursor: 'pointer', textAlign: 'center',
          textDecoration: 'underline',
        }}>
          Owner? Sign in here
        </button>
      </div>
    </div>
  )
}