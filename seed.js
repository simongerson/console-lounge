// scripts/seed.js
//
// Realistic seed data generator for Console Lounge Manager.
//
// HOW IT WORKS (two passes):
//  1. Drives your REAL deployed API routes (login, open shift, start/end
//     sessions, record debt payments, close shift) — this exercises actual
//     business logic and will surface real bugs, not just insert rows.
//  2. Afterward, connects directly to Supabase to rewrite timestamps so
//     the data looks like it happened across the past ~2 weeks instead
//     of all at once "right now" (since the API always uses real time).
//
// SETUP:
//  1. npm install @supabase/supabase-js   (node-fetch not needed on Node 18+)
//  2. Fill in CONFIG below — especially STAFF (real name+PIN pairs) and
//     the Supabase URL/service role key (for the timestamp-rewrite pass).
//  3. Run: node scripts/seed.js
//
// SAFE TO RE-RUN: run clear-data.sql first if you want a totally fresh run.

const { createClient } = require('@supabase/supabase-js')

// ─────────────────────────────────────────────────────────────
// CONFIG — edit these before running
// ─────────────────────────────────────────────────────────────
const BASE_URL = 'https://console-lounge.vercel.app'

const SUPABASE_URL         = 'https://hkswfqwlsnwqlghoybgy.supabase.co' // from your .env.local
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhrc3dmcXdsc253cWxnaG95Ymd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI4MTY5NywiZXhwIjoyMDk4ODU3Njk3fQ.k64ucrr8dRJ4hvNfEouRNitH75vQGJHqqDpMajk_TyY'

// Real staff PINs — the script logs in exactly like a real staff member.
// Add/edit to match your actual staff table.
const STAFF = [
  { name: 'jake', pin: '1976' },
  // { name: 'Mary', pin: '5678' },
]

const DAYS_BACK = 13 // simulate today + 13 days back = 2 weeks
const SESSIONS_PER_STAFF_PER_DAY = { min: 4, max: 10 }

const CUSTOMER_NAMES = [
  'John', 'Mary', 'Peter', 'Grace', 'Kevin', 'Faith', 'Brian', 'Alice',
  null, null, // some walk-ins with no name captured
]

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function pick(arr) { return arr[rand(0, arr.length - 1)] }
function fakeMpesaRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 10 }, () => pick(chars.split(''))).join('')
}

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(`  ✗ ${options.method || 'GET'} ${path} → ${res.status}`, data)
  }
  return { ok: res.ok, data }
}

// ─────────────────────────────────────────────────────────────
// Main seeding logic
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`Seeding against ${BASE_URL}\n`)

  // Fetch consoles + rates once (shared across all simulated days)
  const { data: consolesData } = await api('/api/consoles')
  const { data: ratesData }    = await api('/api/rates')
  const consoles = consolesData.consoles || []
  const rates    = ratesData.rates || []

  if (!consoles.length || !rates.length) {
    console.error('No consoles or rates found — make sure your config data (consoles, rates) still exists before seeding.')
    process.exit(1)
  }

  // Track everything created, grouped by simulated day offset,
  // so we can backdate timestamps in the second pass.
  const dayBuckets = {} // { [dayOffset]: { shiftIds: [], sessionIds: [], debtIds: [] } }

  for (let dayOffset = DAYS_BACK; dayOffset >= 0; dayOffset--) {
    dayBuckets[dayOffset] = { shiftIds: [], sessionIds: [], debtIds: [] }
    console.log(`\n── Day -${dayOffset} ──`)

    for (const staffMember of STAFF) {
      // Login
      const { ok: loginOk, data: loginData } = await api('/api/auth/pin', {
        method: 'POST',
        body: JSON.stringify({ pin: staffMember.pin }),
      })
      if (!loginOk) {
        console.error(`  Skipping ${staffMember.name} — login failed (check PIN in CONFIG)`)
        continue
      }
      const staffId = loginData.staff.id

      // Open shift (skip if one's already open — shouldn't happen if you
      // clear-data.sql'd first, but handled gracefully either way)
      const floatAmount = pick([500, 1000, 1500, 2000])
      const { data: shiftData } = await api('/api/shifts/open', {
        method: 'POST',
        body: JSON.stringify({ staffId, floatAmount }),
      })
      const shiftId = shiftData.shiftId
      if (!shiftId) { console.error(`  Could not open shift for ${staffMember.name}`); continue }
      dayBuckets[dayOffset].shiftIds.push(shiftId)

      console.log(`  ${staffMember.name}: shift ${shiftId}`)

      let cashTotal = 0, mpesaTotal = 0
      const sessionCount = rand(SESSIONS_PER_STAFF_PER_DAY.min, SESSIONS_PER_STAFF_PER_DAY.max)

      for (let i = 0; i < sessionCount; i++) {
        const console_ = pick(consoles)
        const rate     = pick(rates)
        const customerName = pick(CUSTOMER_NAMES)

        // Payment method distribution: mostly cash, some mpesa, some debt,
        // occasional zero-amount edge case (tests the "flagged sessions" logic)
        const roll = Math.random()
        let paymentMethod = roll < 0.55 ? 'cash'
          : roll < 0.80 ? 'mpesa'
          : roll < 0.95 ? 'debt'
          : 'cash' // will be forced to amount 0 below — flagged session edge case

        const isZeroEdgeCase = roll >= 0.95
        const amount = isZeroEdgeCase ? 0 : Number(rate.price) || 100

        const { data: startData } = await api('/api/sessions/start', {
          method: 'POST',
          body: JSON.stringify({
            consoleId: console_.id, staffId, shiftId,
            rateId: rate.id, rateName: rate.name,
            amount, paymentMethod, customerName,
            customerPhone: customerName ? '07' + rand(10000000, 99999999) : null,
          }),
        })
        const sessionId = startData.sessionId
        if (!sessionId) continue
        dayBuckets[dayOffset].sessionIds.push(sessionId)

        if (paymentMethod === 'debt') {
          // Debt created automatically by the start route. Track it via
          // a lookup after the loop (start route doesn't return debt id directly).
          continue
        }

        // End the session immediately (we'll backdate the gap in pass 2)
        await api('/api/sessions/end', {
          method: 'POST',
          body: JSON.stringify({
            sessionId, consoleId: console_.id,
            paymentMethod,
            mpesaRef: paymentMethod === 'mpesa' ? fakeMpesaRef() : undefined,
          }),
        })

        if (paymentMethod === 'cash') cashTotal += amount
        if (paymentMethod === 'mpesa') mpesaTotal += amount
      }

      // Close shift with a small realistic variance (mostly accurate,
      // occasionally short/over by a small amount — tests variance display)
      const varianceRoll = Math.random()
      const cashVariance  = varianceRoll < 0.7 ? 0 : rand(-200, 200)
      const mpesaVariance = varianceRoll < 0.8 ? 0 : rand(-100, 100)

      await api('/api/shifts/close', {
        method: 'POST',
        body: JSON.stringify({
          shiftId,
          cashDeclared:  Math.max(0, cashTotal + floatAmount + cashVariance),
          mpesaDeclared: Math.max(0, mpesaTotal + mpesaVariance),
        }),
      })

      console.log(`    ${sessionCount} sessions · cash ~${cashTotal} · mpesa ~${mpesaTotal}`)
    }
  }

  // Grab all debts created (their IDs weren't returned by /sessions/start,
  // so fetch them fresh and pay some off for a realistic mix of statuses)
  console.log('\n── Simulating debt repayments ──')
  const { data: debtsData } = await api('/api/debts?status=outstanding')
  const debts = debtsData.debts || []
  for (const debt of debts) {
    if (Math.random() < 0.5) continue // leave ~half untouched (still outstanding)

    const payFull = Math.random() < 0.6
    const payAmount = payFull ? debt.balance : Math.round(debt.balance * rand(30, 70) / 100)
    const method = Math.random() < 0.6 ? 'cash' : 'mpesa'

    await api(`/api/debts/${debt.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        amountPaid: payAmount,
        paymentMethod: method,
        mpesaRef: method === 'mpesa' ? fakeMpesaRef() : null,
      }),
    })
  }
  console.log(`  Processed ${debts.length} debts`)

  // ── PASS 2: backdate timestamps directly via Supabase ──
  console.log('\n── Backdating timestamps for realistic history ──')
  for (const [dayOffsetStr, ids] of Object.entries(dayBuckets)) {
    const dayOffset = Number(dayOffsetStr)
    const baseDate = new Date()
    baseDate.setDate(baseDate.getDate() - dayOffset)

    for (const shiftId of ids.shiftIds) {
      const openHour = rand(9, 12)
      const closeHour = rand(19, 22)
      const opened = new Date(baseDate); opened.setHours(openHour, rand(0, 59), 0, 0)
      const closed = new Date(baseDate); closed.setHours(closeHour, rand(0, 59), 0, 0)
      await supabase.from('shifts').update({
        opened_at: opened.toISOString(),
        closed_at: closed.toISOString(),
      }).eq('id', shiftId)
    }

    for (const sessionId of ids.sessionIds) {
      const startHour = rand(9, 21)
      const started = new Date(baseDate); started.setHours(startHour, rand(0, 59), 0, 0)
      const durationMins = rand(20, 90)
      const ended = new Date(started.getTime() + durationMins * 60000)
      await supabase.from('game_sessions').update({
        started_at: started.toISOString(),
        ended_at: ended.toISOString(),
        duration_minutes: durationMins,
        created_at: started.toISOString(),
      }).eq('id', sessionId)
    }
  }
  console.log('  Done.')

  console.log('\n✅ Seeding complete.')
}

main().catch(err => {
  console.error('Seed script failed:', err)
  process.exit(1)
})
