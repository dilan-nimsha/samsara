import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const tables: Record<string, string> = {};

  try {
    const sb = createAdminClient();

    const [clientsRes, reservationsRes] = await Promise.all([
      sb.from('clients').select('id').limit(1),
      sb.from('reservations').select('id').limit(1),
    ]);

    tables.clients      = clientsRes.error      ? `MISSING — ${clientsRes.error.message}`      : 'OK';
    tables.reservations = reservationsRes.error  ? `MISSING — ${reservationsRes.error.message}` : 'OK';

    const healthy = Object.values(tables).every(v => v === 'OK');

    return NextResponse.json({
      status:          healthy ? 'healthy' : 'schema_missing',
      supabase_url:    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(not set)',
      has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      tables,
      fix:             healthy ? null : 'Run supabase/schema.sql in your Supabase SQL Editor',
    });
  } catch (err) {
    return NextResponse.json({
      status:          'error',
      error:           String(err),
      supabase_url:    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(not set)',
      has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      tables,
    }, { status: 500 });
  }
}
