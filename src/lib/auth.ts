import { createClient } from '@/lib/supabase/server';

export type Role = 'admin' | 'ops' | 'finance' | 'agent' | 'partner';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  initials: string;
  role: Role;
  station: string | null;
  partner_id: string | null;
}

interface ProfileRow {
  full_name?: string | null;
  initials?: string | null;
  role?: string | null;
  station?: string | null;
  partner_id?: string | null;
}

// Resolves the current authenticated user + their profile (role/station/partner).
// Returns null when there is no session. Falls back to sensible defaults if the
// profile row is missing (e.g. profiles migration not yet run).
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let row: ProfileRow | null = null;
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    row = data as ProfileRow | null;
  } catch { /* table may not exist yet — fall through to defaults */ }

  const fullName = row?.full_name || user.email?.split('@')[0] || 'User';
  return {
    id:         user.id,
    email:      user.email ?? '',
    full_name:  fullName,
    initials:   row?.initials || fullName.slice(0, 1).toUpperCase(),
    role:       (row?.role as Role) || 'ops',
    station:    row?.station ?? null,
    partner_id: row?.partner_id ?? null,
  };
}
