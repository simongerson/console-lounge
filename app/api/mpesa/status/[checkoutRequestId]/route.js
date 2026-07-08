import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Critical: without this, Next.js may statically cache this route's
// response at build/first-request time and keep serving that same
// stale result forever, ignoring live changes in the database.
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/mpesa/status/[checkoutRequestId]
// Frontend polls this every 2-3s after triggering STK push,
// to know when the customer has approved/cancelled the prompt.
export async function GET(request, { params }) {
  try {
    const { checkoutRequestId } = params;

    const { data, error } = await supabase
      .from('mpesa_transactions')
      .select('status, mpesa_receipt_number, result_desc, amount')
      .eq('checkout_request_id', checkoutRequestId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: data.status, // 'pending' | 'success' | 'failed'
      mpesaReceiptNumber: data.mpesa_receipt_number,
      resultDesc: data.result_desc,
      amount: data.amount,
    });
  } catch (error) {
    console.error('GET /api/mpesa/status error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
