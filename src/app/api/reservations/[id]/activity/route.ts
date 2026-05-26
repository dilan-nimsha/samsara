import { NextRequest, NextResponse } from 'next/server';
import { getActivityLog } from '@/lib/supabase/queries';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const entries = await getActivityLog(id);
    return NextResponse.json({ success: true, entries });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err), entries: [] }, { status: 500 });
  }
}
