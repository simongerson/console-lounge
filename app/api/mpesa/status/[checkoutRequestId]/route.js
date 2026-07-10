import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Belt-and-suspenders against Next.js caching layers:
// - dynamic: force-dynamic  → don't statically render/cache this route
// - fetchCache: force-no-store → don't let Next cache the underlying
//   fetch() calls Supabase's client makes internally (a SEPARATE
//   caching layer from route rendering — this is likely what was
//   still biting us even with 'dynamic' already set).
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/mpesa/status/[checkoutRequestId]
export async function GET(request, { params }) {
  try {
    const { checkoutRequestId } = params;

    // Temporary debug logging — check Vercel function logs if this
    // still 404s, to confirm the exact string received matches what's
    // actually in the database (rules out subtle encoding mismatches).
    console.log('[mpesa/status] looking up:', JSON.stringify(checkoutRequestId));

    const { data, error } = await supabase
      .from('mpesa_transactions')
      .select('status, mpesa_receipt_number, result_desc, amount')
      .eq('checkout_request_id', checkoutRequestId)
      .single();

    if (error || !data) {
      console.log('[mpesa/status] not found. Supabase error:', error?.message);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    console.log('[mpesa/status] found, status:', data.status);

    return NextResponse.json({
      status: data.status,
      mpesaReceiptNumber: data.mpesa_receipt_number,
      resultDesc: data.result_desc,
      amount: data.amount,
    });
  } catch (error) {
    console.error('GET /api/mpesa/status error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
