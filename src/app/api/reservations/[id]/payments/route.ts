import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/supabase/queries';

type PaymentType = 'payment' | 'deposit' | 'refund';
type PayStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'refunded';

function derivePaymentStatus(totalCost: number, totalPaid: number, hadRefund: boolean): PayStatus {
  if (totalPaid <= 0) return hadRefund ? 'refunded' : 'pending';
  if (totalCost > 0 && totalPaid >= totalCost) return 'paid';
  return 'partial';
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json() as {
      amount?: unknown; method?: unknown; reference?: unknown;
      notes?: unknown; type?: unknown; actor?: unknown;
      method_details?: unknown;
    };

    // Already sanitized client-side (CVV dropped, card numbers masked), but we
    // re-validate the shape and ignore anything that isn't a plain string map.
    const methodDetails: Record<string, string> = {};
    if (body.method_details && typeof body.method_details === 'object') {
      for (const [k, v] of Object.entries(body.method_details as Record<string, unknown>)) {
        if (typeof v === 'string' && v.trim()) methodDetails[k] = v.trim();
      }
    }
    const detailsSummary = Object.entries(methodDetails)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');

    const rawAmount = Number(body.amount);
    if (!rawAmount || isNaN(rawAmount) || rawAmount <= 0) {
      return NextResponse.json({ success: false, error: 'A positive amount is required' }, { status: 400 });
    }
    const type   = (body.type as PaymentType) ?? 'payment';
    const method = typeof body.method === 'string' ? body.method : 'bank_transfer';
    const actor  = typeof body.actor === 'string' && body.actor.trim() ? body.actor.trim() : 'System';
    // Refunds reduce the collected total; everything else adds to it.
    const delta  = type === 'refund' ? -Math.abs(rawAmount) : Math.abs(rawAmount);

    const sb = createAdminClient();

    const { data: current, error: loadErr } = await sb
      .from('reservations')
      .select('total_cost, total_paid, currency, reference')
      .eq('id', id)
      .single();
    if (loadErr || !current) {
      return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
    }

    const totalCost = Number(current.total_cost) || 0;
    const newPaid   = Math.max(0, (Number(current.total_paid) || 0) + delta);
    const payStatus = derivePaymentStatus(totalCost, newPaid, type === 'refund');

    // 1. Record the transaction. Method details are appended to the note.
    const memo = typeof body.notes === 'string' ? body.notes.trim() : '';
    const notes = [memo, detailsSummary].filter(Boolean).join(' | ') || null;
    const { error: payErr } = await sb.from('payments').insert({
      reservation_id: id,
      amount:   delta,
      currency: current.currency ?? 'GBP',
      method,
      status:   'paid',
      reference: typeof body.reference === 'string' && body.reference.trim() ? body.reference.trim() : null,
      notes,
      paid_at:  new Date().toISOString(),
    });
    if (payErr) {
      return NextResponse.json({ success: false, error: payErr.message }, { status: 500 });
    }

    // 2. Roll up onto the reservation so lifecycle gates and summaries stay accurate.
    const { error: updErr } = await sb
      .from('reservations')
      .update({ total_paid: newPaid, payment_status: payStatus, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (updErr) {
      return NextResponse.json({ success: false, error: updErr.message }, { status: 500 });
    }

    // 3. Audit trail.
    const verb = type === 'refund' ? 'Refund' : type === 'deposit' ? 'Deposit' : 'Payment';
    await logActivity({
      reservation_id: id,
      actor,
      action: 'payment',
      summary: `${verb} of ${Math.abs(rawAmount).toFixed(2)} ${current.currency ?? 'GBP'} recorded (${method.replace(/_/g, ' ')})`,
      payload: { amount: delta, method, type, total_paid: newPaid, payment_status: payStatus, method_details: methodDetails },
    });

    return NextResponse.json({ success: true, total_paid: newPaid, payment_status: payStatus });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
