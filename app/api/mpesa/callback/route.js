import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/mpesa/callback
// Safaricom calls this automatically after the customer approves/cancels
// the STK push on their phone. This must be publicly reachable (Vercel URL).
export async function POST(request) {
  try {
    const body = await request.json();
    const callback = body?.Body?.stkCallback;

    if (!callback) {
      return NextResponse.json({ error: 'Invalid callback payload' }, { status: 400 });
    }

    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callback;

    // ResultCode 0 = success. Anything else = cancelled/failed/timeout.
    const isSuccess = ResultCode === 0;

    let mpesaReceiptNumber = null;
    let amountPaid = null;

    if (isSuccess && CallbackMetadata?.Item) {
      const items = CallbackMetadata.Item;
      mpesaReceiptNumber = items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value;
      amountPaid = items.find((i) => i.Name === 'Amount')?.Value;
    }

    // Fetch the pending transaction we logged when initiating STK push
    const { data: transaction, error: fetchError } = await supabase
      .from('mpesa_transactions')
      .select('*')
      .eq('checkout_request_id', CheckoutRequestID)
      .single();

    if (fetchError || !transaction) {
      console.error('M-Pesa callback: transaction not found', CheckoutRequestID);
      // Still return 200 — Safaricom retries on non-200, we don't want that
      return NextResponse.json({ success: true });
    }

    // Update the tracking record
    await supabase
      .from('mpesa_transactions')
      .update({
        status: isSuccess ? 'success' : 'failed',
        mpesa_receipt_number: mpesaReceiptNumber,
        result_desc: ResultDesc,
        updated_at: new Date().toISOString(),
      })
      .eq('checkout_request_id', CheckoutRequestID);

    // If payment succeeded, apply it to the correct source (session or debt)
    if (isSuccess) {
      if (transaction.source === 'debt') {
        const { data: debt } = await supabase
          .from('debts')
          .select('amount, amount_paid')
          .eq('id', transaction.source_id)
          .single();

        if (debt) {
          const newAmountPaid = Number(debt.amount_paid) + Number(amountPaid || transaction.amount);
          const newStatus = newAmountPaid >= Number(debt.amount) ? 'cleared' : 'partial';

          await supabase
            .from('debts')
            .update({
              amount_paid: newAmountPaid,
              status: newStatus,
              last_payment_method: 'mpesa',
              mpesa_ref: mpesaReceiptNumber,
            })
            .eq('id', transaction.source_id);
        }
      } else if (transaction.source === 'session') {
        await supabase
          .from('game_sessions')
          .update({
            payment_method: 'mpesa',
            mpesa_ref: mpesaReceiptNumber,
          })
          .eq('id', transaction.source_id);
      }
    }

    // Safaricom expects a 200 with this exact shape to stop retrying
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Callback processed successfully',
    });
  } catch (error) {
    console.error('POST /api/mpesa/callback error:', error);
    // Still return 200-shaped response so Safaricom doesn't retry indefinitely
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Callback received',
    });
  }
}