'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard, CalendarDays, Users, Handshake,
  CreditCard, BarChart3, Settings, PanelLeft, LogOut,
  UserCheck, Truck,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/reservations', icon: CalendarDays,    label: 'Reservations' },
  { href: '/clients',      icon: Users,           label: 'Clients' },
  { href: '/partners',     icon: Handshake,       label: 'Partners' },
  { href: '/guides',       icon: UserCheck,       label: 'Guides' },
  { href: '/fleet',        icon: Truck,           label: 'Fleet' },
  { href: '/finance',      icon: CreditCard,      label: 'Finance' },
  { href: '/reports',      icon: BarChart3,       label: 'Reports' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const W = collapsed ? 52 : 220;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside style={{
      width: W, minWidth: W,
      background: '#0C0C0C',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'fixed', top: 0, left: 0,
      zIndex: 50, overflow: 'hidden',
      transition: 'width 0.2s ease, min-width 0.2s ease',
    }}>

      {/* Logo */}
      <div style={{
        height: 52,
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '0 14px' : '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image
              src="/images/logo.png"
              alt="Samsara"
              width={110}
              height={40}
              style={{ objectFit: 'contain', objectPosition: 'left center' }}
              priority
            />
            <span style={{
              color: 'rgba(255,255,255,0.18)', fontSize: 9,
              fontWeight: 500, letterSpacing: '0.14em',
              textTransform: 'uppercase', paddingLeft: 6,
              borderLeft: '1px solid rgba(255,255,255,0.1)',
            }}>RMS</span>
          </div>
        )}
        {collapsed && (
          <Image
            src="/images/logo.png"
            alt="S"
            width={22}
            height={22}
            style={{ objectFit: 'contain' }}
            priority
          />
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)',
            display: 'flex', padding: 2, borderRadius: 4, transition: 'color 0.12s',
          }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.2)')}
          >
            <PanelLeft size={14} />
          </button>
        )}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)',
            display: 'none', padding: 2,
          }} />
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} title={collapsed ? label : undefined} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: collapsed ? '9px 0' : '9px 16px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: active ? '#E8E3DB' : 'rgba(232,227,219,0.38)',
              background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
              borderRight: active ? '2px solid #C9A84C' : '2px solid transparent',
              fontSize: 13, fontWeight: active ? 500 : 400,
              transition: 'color 0.12s, background 0.12s',
              whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(232,227,219,0.75)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(232,227,219,0.38)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.75} />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '6px 0' }}>
        <Link href="/settings" title={collapsed ? 'Settings' : undefined} style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: collapsed ? '9px 0' : '9px 16px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          color: 'rgba(232,227,219,0.3)', fontSize: 13,
          transition: 'color 0.12s',
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(232,227,219,0.65)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(232,227,219,0.3)')}
        >
          <Settings size={15} strokeWidth={1.75} />
          {!collapsed && 'Settings'}
        </Link>
        <button onClick={handleSignOut} title={collapsed ? 'Sign Out' : undefined} style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: collapsed ? '9px 0' : '9px 16px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          width: '100%', background: 'none', border: 'none',
          color: 'rgba(232,227,219,0.3)', fontSize: 13,
          transition: 'color 0.12s',
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(232,227,219,0.65)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(232,227,219,0.3)')}
        >
          <LogOut size={15} strokeWidth={1.75} />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
