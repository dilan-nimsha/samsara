import { NextRequest, NextResponse } from 'next/server';
import { getPartners, createPartner } from '@/lib/supabase/queries';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function GET() {
  try {
    const partners = await getPartners();
    return NextResponse.json({ success: true, partners });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err), partners: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    const company_name   = typeof body.company_name === 'string' ? body.company_name.trim() : '';
    const contact_person = typeof body.contact_person === 'string' ? body.contact_person.trim() : '';
    const email          = typeof body.email === 'string' ? body.email.trim() : '';
    if (!company_name)   return NextResponse.json({ success: false, error: 'Company name is required' }, { status: 400 });
    if (!contact_person) return NextResponse.json({ success: false, error: 'Contact person is required' }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ success: false, error: 'A valid email is required' }, { status: 400 });

    const rate = Number(body.commission_rate);
    const partner = await createPartner({
      company_name,
      contact_person,
      email,
      phone:           typeof body.phone === 'string' ? body.phone.trim() : undefined,
      country:         typeof body.country === 'string' ? body.country.trim() : undefined,
      commission_rate: isNaN(rate) ? 0 : rate,
      is_active:       true,
    });
    return NextResponse.json({ success: true, partner });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
