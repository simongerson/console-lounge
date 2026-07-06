// lib/db.js
// Supabase PostgreSQL client — works on both local and Vercel
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

// Service role client — bypasses RLS, used by API routes only
const supabase = createClient(supabaseUrl, serviceKey)

export default supabase

// ── query() — drop-in replacement for mysql2 ─────────────────────
// Converts MySQL ? placeholders to PostgreSQL $1, $2...
// Converts MySQL backtick names and syntax to PostgreSQL
export async function query(sql, params = []) {
  // Convert ? to $1, $2...
  let i = 0
  let pgSql = sql.replace(/\?/g, () => `$${++i}`)

  // Convert MySQL-specific syntax to PostgreSQL
  pgSql = pgSql
    // Remove backticks
    .replace(/`/g, '"')
    // NOW() is same in both — keep as is
    // DATE() function — same in both
    // INTERVAL syntax — MySQL: INTERVAL 1 DAY, PG: INTERVAL '1 day'
    .replace(/INTERVAL\s+(\d+)\s+DAY/gi,   "INTERVAL '$1 days'")
    .replace(/INTERVAL\s+(\d+)\s+HOUR/gi,  "INTERVAL '$1 hours'")
    .replace(/INTERVAL\s+(\d+)\s+MINUTE/gi,"INTERVAL '$1 minutes'")
    // DATE_SUB(x, INTERVAL n DAY) → x - INTERVAL 'n days'
    .replace(/DATE_SUB\(([^,]+),\s*INTERVAL\s+'(\d+)\s+days?'\)/gi,
      (_, col, n) => `(${col.trim()} - INTERVAL '${n} days')`)
    .replace(/DATE_SUB\(([^,]+),\s*INTERVAL\s+'(\d+)\s+hours?'\)/gi,
      (_, col, n) => `(${col.trim()} - INTERVAL '${n} hours')`)
    // DATE_FORMAT → TO_CHAR
    .replace(/DATE_FORMAT\(([^,]+),\s*'%e %b'\)/gi,
      (_, col) => `TO_CHAR(${col.trim()}, 'FMDD Mon')`)
    // DAYNAME → TO_CHAR with Day
    .replace(/DAYNAME\(([^)]+)\)/gi,
      (_, col) => `TO_CHAR(${col.trim()}, 'Day')`)
    // CURDATE() → CURRENT_DATE
    .replace(/CURDATE\(\)/gi, 'CURRENT_DATE')
    // UUID() → gen_random_uuid()
    .replace(/\bUUID\(\)/gi, 'gen_random_uuid()')
    // COALESCE same in both
    // TINYINT(1) — not needed in PG but handle if in queries
    // LIMIT same in both
    // CONCAT — same in both
    // IFNULL → COALESCE
    .replace(/IFNULL\(/gi, 'COALESCE(')
    // IF(condition, true, false) → CASE WHEN condition THEN true ELSE false END
    // MySQL backtick table aliases
    .replace(/`([^`]+)`/g, '"$1"')

  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query:  pgSql,
    sql_params: params,
  })

  if (error) {
    // Fallback: try direct table queries for simple cases
    console.error('RPC error:', error.message, '\nSQL:', pgSql)
    throw new Error(error.message)
  }

  return data || []
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params)
  return rows?.[0] || null
}