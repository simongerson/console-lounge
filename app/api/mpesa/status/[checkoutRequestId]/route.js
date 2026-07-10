import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    const raw = params.checkoutRequestId;
    const checkoutRequestId = decodeURIComponent(raw).trim();

    // Diagnostic logging — comparing raw vs trimmed length catches
    // invisible whitespace/encoding issues that look identical when
    // eyeballed but fail an exact string match in Postgres.
    console.log('[mpesa/status] raw param:', JSON.stringify(raw), 'length:', raw.length)
    console.log('[mpesa/status] trimmed:', JSON.stringify(checkoutRequestId), 'length:', checkoutRequestId.length)

    // Use maybeSingle (returns null instead of throwing) + a broader
    // fallback query so we can see exactly what's going on if the
    // exact match still fails.
    const { data, error } = await supabase
      .from('mpesa_transactions')
      .select('status, mpesa_receipt_number, result_desc, amount, checkout_request_id')
      .eq('checkout_request_id', checkoutRequestId)
      .maybeSingle();

    if (error) {
      console.log('[mpesa/status] query error:', error.message)
    }

    if (!data) {
      // Fallback: fuzzy search to see if a near-match exists (reveals
      // whitespace/truncation issues in the logs even though we still
      // return 404 to the client here).
      const { data: fuzzy } = await supabase
        .from('mpesa_transactions')
        .select('checkout_request_id')
        .ilike('checkout_request_id', `%${checkoutRequestId.slice(-15)}%`)
        .limit(3)

      console.log('[mpesa/status] no exact match. Fuzzy candidates:', JSON.stringify(fuzzy))

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
