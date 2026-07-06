import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Wraps Supabase to mimic mysql2 pool.query() so your API routes need no changes
const pool = {
  query: async (sql, params = []) => {
    // Parse the SQL to figure out what operation and table
    const cleaned = sql.trim().toUpperCase()

    // Hand off to raw SQL via Supabase's rpc if available,
    // or use the JS client for common patterns
    const { data, error } = await supabase.rpc('run_query', {
      query_text: sql,
      query_params: params
    })

    if (error) throw new Error(error.message)
    return [data || []]
  }
}

export default pool