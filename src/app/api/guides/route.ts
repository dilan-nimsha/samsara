import { NextRequest, NextResponse } from 'next/server';
import { getGuides, createGuide } from '@/lib/supabase/queries';

export async function GET() {
  try {
    const guides = await getGuides();
    return NextResponse.json({ success: true, guides });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err), guides: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const full_name = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    const phone     = typeof body.phone === 'string' ? body.phone.trim() : '';
    if (!full_name) return NextResponse.json({ success: false, error: 'Guide name is required' }, { status: 400 });
    if (!phone)     return NextResponse.json({ success: false, error: 'Phone is required' }, { status: 400 });

    const toArr = (v: unknown) =>
      Array.isArray(v) ? v as string[]
      : typeof v === 'string' && v.trim() ? v.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const guide = await createGuide({
      full_name,
      phone,
      languages:       toArr(body.languages),
      specializations: toArr(body.specializations),
      base_location:   typeof body.base_location === 'string' ? body.base_location.trim() : undefined,
      daily_rate:      Number(body.daily_rate) || 0,
      currency:        (typeof body.currency === 'string' ? body.currency : 'GBP') as never,
      is_available:    true,
    });
    return NextResponse.json({ success: true, guide });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
