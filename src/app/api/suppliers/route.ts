import { NextRequest, NextResponse } from 'next/server';
import { getSuppliers, createSupplier } from '@/lib/supabase/queries';

export async function GET() {
  try {
    const suppliers = await getSuppliers();
    return NextResponse.json({ success: true, suppliers });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err), suppliers: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) return NextResponse.json({ success: false, error: 'Supplier name is required' }, { status: 400 });

    const supplier = await createSupplier({
      name,
      type:           (typeof body.type === 'string' ? body.type : 'hotel') as never,
      status:         'active' as never,
      contact_person: typeof body.contact_person === 'string' ? body.contact_person.trim() : undefined,
      email:          typeof body.email === 'string' ? body.email.trim() : undefined,
      phone:          typeof body.phone === 'string' ? body.phone.trim() : undefined,
      country:        typeof body.country === 'string' ? body.country.trim() : undefined,
      destinations:   Array.isArray(body.destinations) ? body.destinations as string[] : [],
      currency:       (typeof body.currency === 'string' ? body.currency : 'GBP') as never,
      payment_terms:  (typeof body.payment_terms === 'string' ? body.payment_terms : 'net_30') as never,
    });
    return NextResponse.json({ success: true, supplier });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
