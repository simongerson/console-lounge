import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// PATCH /api/debts/[id]
// Body: { amountPaid, paymentMethod, mpesaRef }
export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    if (!id) {
      return NextResponse.json({ error: 'Missing debt id' }, { status: 400 });
    }

    const { amountPaid, paymentMethod, mpesaRef } = await request.json();

    if (!amountPaid || Number(amountPaid) <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (!paymentMethod || !['cash', 'mpesa_stk', 'mpesa'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Payment method must be cash or mpesa_stk' },
        { status: 400 }
      );
    }

    const { data: debt, error: fetchError } = await supabase
      .from('debts')
      .select('amount, amount_paid')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!debt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
    }

    const newAmountPaid = Number(debt.amount_paid) + Number(amountPaid);
    const newStatus =
      newAmountPaid >= Number(debt.amount) ? 'cleared' : 'partial';

    const { data: updated, error: updateError } = await supabase
      .from('debts')
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
        last_payment_method: paymentMethod,
        mpesa_ref: paymentMethod === 'mpesa_stk' && mpesaRef ? mpesaRef.toUpperCase() : null,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ debt: updated });
  } catch (error) {
    console.error('PATCH /api/debts/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update debt' },
      { status: 500 }
    );
  }
}

// DELETE /api/debts/[id]
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    if (!id) {
      return NextResponse.json({ error: 'Missing debt id' }, { status: 400 });
    }

    const { error } = await supabase.from('debts').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/debts/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete debt' },
      { status: 500 }
    );
  }
}
