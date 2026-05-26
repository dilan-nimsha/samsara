import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function GET() {
  try {
    const sb = createAdminClient();
    const { data, error } = await sb
      .from('email_recipients')
      .select('*')
      .eq('is_active', true)
      .order('type')
      .order('created_at');

    if (error) {
      return NextResponse.json({ success: false, error: error.message, recipients: [] });
    }
    return NextResponse.json({ success: true, recipients: data ?? [] });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err), recipients: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, type } = await req.json();

    if (!name?.trim() || !email?.trim() || !['personal', 'department'].includes(type)) {
      return NextResponse.json({ success: false, error: 'name, email, and type (personal|department) are required' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 });
    }

    const sb = createAdminClient();
    const { data, error } = await sb
      .from('email_recipients')
      .insert({ name: name.trim(), email: email.trim().toLowerCase(), type })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, recipient: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    const sb = createAdminClient();
    const { error } = await sb.from('email_recipients').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
