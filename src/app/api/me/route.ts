import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth';

export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ success: false, profile: null }, { status: 401 });
  }
  return NextResponse.json({ success: true, profile });
}
