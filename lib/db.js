// lib/db.js — Supabase PostgreSQL version
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase

// Helper — mirrors mysql2 query() interface
export async function query(sql, params = []) {
  // Replace ? with $1, $2 etc for PostgreSQL
  let i = 0
  const pgSql = sql.replace(/\?/g, () => `$${++i}`)
  const { data, error } = await supabase.rpc('run_query', {
    query_text: pgSql,
    query_params: params
  })
  if (error) throw new Error(error.message)
  return data
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params)
  return rows?.[0] || null
}