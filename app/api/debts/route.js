import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/debts?status=outstanding
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('debts')
      .select(`
        id,
        game_session_id,
        customer_name,
        customer_phone,
        amount,
        amount_paid,
        balance,
        status,
        due_date,
        created_at,
        last_payment_method,
        mpesa_ref
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Summary counts for the page header
    const summary = {
      totalOutstanding: data
        .filter((d) => d.status !== 'cleared')
        .reduce((sum, d) => sum + Number(d.balance), 0),
      countOutstanding: data.filter((d) => d.status === 'outstanding').length,
      countPartial: data.filter((d) => d.status === 'partial').length,
      countCleared: data.filter((d) => d.status === 'cleared').length,
    };

    return NextResponse.json({ debts: data, summary });
  } catch (error) {
    console.error('GET /api/debts error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch debts' },
      { status: 500 }
    );
  }
}