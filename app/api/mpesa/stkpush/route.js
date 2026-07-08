import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
const { initiateSTKPush } = require('../../../../lib/mpesa');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/mpesa/stkpush
// Body: { phone, amount, accountReference, transactionDesc, source, sourceId }
//   source: "session" | "debt"  — tells the callback what to update
//   sourceId: the game_session_id or debt id being paid
export async function POST(request) {
  try {
    const {
      phone,
      amount,
      accountReference,
      transactionDesc,
      source,
      sourceId,
    } = await request.json();

    if (!phone || !amount) {
      return NextResponse.json(
        { error: 'Phone and amount are required' },
        { status: 400 }
      );
    }

    if (!['session', 'debt'].includes(source)) {
      return NextResponse.json(
        { error: 'source must be "session" or "debt"' },
        { status: 400 }
      );
    }

    // Callback URL — must be public HTTPS. Uses your deployed domain.
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`;

    const stkResponse = await initiateSTKPush({
      phone,
      amount,
      accountReference,
      transactionDesc,
      callbackUrl,
    });

    // Log this pending transaction so the callback can find it later
    // by CheckoutRequestID, and so the frontend can poll for status.
    const { error: insertError } = await supabase
      .from('mpesa_transactions')
      .insert({
        checkout_request_id: stkResponse.CheckoutRequestID,
        merchant_request_id: stkResponse.MerchantRequestID,
        phone,
        amount,
        source,
        source_id: sourceId,
        status: 'pending',
      });

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      message: 'STK push sent — check your phone',
    });
  } catch (error) {
    console.error('POST /api/mpesa/stkpush error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate STK push' },
      { status: 500 }
    );
  }
}