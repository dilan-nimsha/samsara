'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, Users, Handshake,
  CreditCard, FileText, Settings, ChevronLeft, Bell, LogOut,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/reservations',  icon: CalendarDays,    label: 'Reservations' },
  { href: '/clients',       icon: Users,           label: 'Clients' },
  { href: '/partners',      icon: Handshake,       label: 'Partners' },
  { href: '/finance',       icon: CreditCard,      label: 'Finance' },
  { href: '/reports',       icon: FileText,        label: 'Reports' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? 72 : 240,
        transition: 'width 0.25s ease',
        background: '#0A0A0A',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: collapsed ? '1.5rem 0' : '1.5rem 1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: 72,
      }}>
        {!collapsed && (
          <div>
            <p style={{ color: '#C9A84C', fontSize: '0.6rem', letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 2 }}>Samsara</p>
            <p style={{ color: '#ffffff', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.1em' }}>RMS</p>
          </div>
        )}
        {collapsed && <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: '1rem' }}>S</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)', padding: 4, display: 'flex',
          }}
        >
          <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: collapsed ? '0.75rem 0' : '0.75rem 1.5rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: active ? '#C9A84C' : 'rgba(255,255,255,0.5)',
                background: active ? 'rgba(201,168,76,0.08)' : 'transparent',
                borderRight: active ? '2px solid #C9A84C' : '2px solid transparent',
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: active ? 500 : 400,
                letterSpacing: '0.03em',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={18} />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1rem 0' }}>
        <Link href="/settings" style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: collapsed ? '0.75rem 0' : '0.75rem 1.5rem',
          justifyContent: collapsed ? 'center' : 'flex-start',
          color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
          fontSize: '0.82rem',
        }}>
          <Settings size={18} />
          {!collapsed && 'Settings'}
        </Link>
        <button style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: collapsed ? '0.75rem 0' : '0.75rem 1.5rem',
          justifyContent: collapsed ? 'center' : 'flex-start',
          color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none',
          cursor: 'pointer', fontSize: '0.82rem', width: '100%',
        }}>
          <LogOut size={18} />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
