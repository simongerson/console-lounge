import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/mpesa/status/[checkoutRequestId]
// Next.js 16 requires params to be awaited before accessing its
// properties — accessing params.x synchronously silently returns
// undefined, which was the actual root cause of everything we were
// debugging (not caching, not the database).
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const checkoutRequestId = resolvedParams.checkoutRequestId;

    if (!checkoutRequestId) {
      console.error('[mpesa/status] checkoutRequestId missing from params:', resolvedParams);
      return NextResponse.json({ error: 'Missing checkout request id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('mpesa_transactions')
      .select('status, mpesa_receipt_number, result_desc, amount')
      .eq('checkout_request_id', checkoutRequestId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

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
