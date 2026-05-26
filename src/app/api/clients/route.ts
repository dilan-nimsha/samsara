import { NextRequest, NextResponse } from 'next/server';
import { getClients, createClient_ } from '@/lib/supabase/queries';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function GET() {
  try {
    const clients = await getClients();
    return NextResponse.json({ success: true, clients });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err), clients: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    const full_name = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    const email     = typeof body.email === 'string' ? body.email.trim() : '';
    if (!full_name) return NextResponse.json({ success: false, error: 'Full name is required' }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ success: false, error: 'A valid email is required' }, { status: 400 });

    const client = await createClient_({
      full_name,
      email,
      phone:        typeof body.phone === 'string' ? body.phone.trim() : '',
      nationality:  typeof body.nationality === 'string' ? body.nationality.trim() : undefined,
      company_name: typeof body.company_name === 'string' && body.company_name.trim() ? body.company_name.trim() : undefined,
    });
    return NextResponse.json({ success: true, client });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
