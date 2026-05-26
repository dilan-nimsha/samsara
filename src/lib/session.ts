'use client';

import { useState, useEffect } from 'react';

export type UserRole = 'admin' | 'ops' | 'finance' | 'agent' | 'partner';

export interface StaffUser {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
  station: string | null; // null = unrestricted (admin / HQ)
}

interface MeResponse {
  success: boolean;
  profile?: {
    id: string;
    full_name: string;
    initials: string;
    role: UserRole;
    station: string | null;
  };
}

// Reads the real authenticated user + profile from /api/me. Replaces the old
// hardcoded MOCK_USERS. `user` is null until loaded (or if unauthenticated).
export function useCurrentUser(): { user: StaffUser | null; loading: boolean } {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/me')
      .then(r => r.json())
      .then((d: MeResponse) => {
        if (!active) return;
        if (d.success && d.profile) {
          setUser({
            id:       d.profile.id,
            name:     d.profile.full_name,
            initials: d.profile.initials,
            role:     d.profile.role,
            station:  d.profile.station,
          });
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { user, loading };
}

export const isStaffRole = (r?: UserRole): boolean =>
  r === 'admin' || r === 'ops' || r === 'finance';
