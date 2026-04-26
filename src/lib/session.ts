export type UserRole = 'admin' | 'staff';

export interface StaffUser {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
  station: string | null; // null = unrestricted (admin)
}

export const MOCK_USERS: StaffUser[] = [
  { id: 'u1', name: 'Dilan Nimsha', initials: 'D', role: 'admin', station: null        },
  { id: 'u2', name: 'Nimsha',       initials: 'N', role: 'staff', station: 'Sri Lanka' },
  { id: 'u3', name: 'Sarah Mills',  initials: 'S', role: 'staff', station: 'Maldives'  },
  { id: 'u4', name: 'Raj Kumar',    initials: 'R', role: 'staff', station: 'India'     },
];

const LS_KEY = 'samsara_current_user';

export function getCurrentUser(): StaffUser {
  if (typeof window === 'undefined') return MOCK_USERS[0];
  const id = localStorage.getItem(LS_KEY) ?? 'u1';
  return MOCK_USERS.find(u => u.id === id) ?? MOCK_USERS[0];
}

export function setCurrentUser(id: string): void {
  localStorage.setItem(LS_KEY, id);
}
