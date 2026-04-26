'use client';

import { useState, useEffect, useRef } from 'react';
import { getCurrentUser, type StaffUser } from '@/lib/session';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, Bell, LogOut, Settings, X, Mail,
  ChevronDown, CalendarDays, UserPlus, Users, Handshake,
  UserCheck, Truck, Package, CreditCard, BarChart3,
  Plus, FileDown, FileUp,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

// ── Menu structure ─────────────────────────────────────────────────────────────

type MenuItem =
  | { type: 'link';    label: string; href: string; icon?: React.ReactNode }
  | { type: 'divider' }
  | { type: 'header';  label: string };

interface MenuGroup {
  key: string;
  label: string;
  matchPaths: string[];
  items: MenuItem[];
}

const MENUS: MenuGroup[] = [
  {
    key: 'reservations',
    label: 'Reservations',
    matchPaths: ['/reservations'],
    items: [
      { type: 'link', label: 'All Reservations', href: '/reservations',     icon: <CalendarDays size={13} strokeWidth={1.75} /> },
      { type: 'link', label: 'New Reservation',  href: '/reservations/new', icon: <Plus         size={13} strokeWidth={2}    /> },
      { type: 'divider' },
      { type: 'link', label: 'Export CSV',        href: '/reservations',    icon: <FileDown size={13} strokeWidth={1.75} /> },
      { type: 'link', label: 'Import Bookings',   href: '/reservations',    icon: <FileUp   size={13} strokeWidth={1.75} /> },
    ],
  },
  {
    key: 'clients',
    label: 'Clients',
    matchPaths: ['/clients', '/partners'],
    items: [
      { type: 'header', label: 'Clients' },
      { type: 'link', label: 'All Clients', href: '/clients',     icon: <Users    size={13} strokeWidth={1.75} /> },
      { type: 'link', label: 'Add Client',  href: '/clients/new', icon: <UserPlus size={13} strokeWidth={1.75} /> },
      { type: 'divider' },
      { type: 'header', label: 'Partners' },
      { type: 'link', label: 'All Partners', href: '/partners',     icon: <Handshake size={13} strokeWidth={1.75} /> },
      { type: 'link', label: 'Add Partner',  href: '/partners/new', icon: <UserPlus  size={13} strokeWidth={1.75} /> },
    ],
  },
  {
    key: 'operations',
    label: 'Operations',
    matchPaths: ['/guides', '/fleet', '/suppliers'],
    items: [
      { type: 'link', label: 'Guides',    href: '/guides',    icon: <UserCheck size={13} strokeWidth={1.75} /> },
      { type: 'link', label: 'Fleet',     href: '/fleet',     icon: <Truck     size={13} strokeWidth={1.75} /> },
      { type: 'divider' },
      { type: 'link', label: 'Suppliers', href: '/suppliers', icon: <Package   size={13} strokeWidth={1.75} /> },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    matchPaths: ['/finance', '/reports'],
    items: [
      { type: 'link', label: 'Finance Overview', href: '/finance',  icon: <CreditCard size={13} strokeWidth={1.75} /> },
      { type: 'divider' },
      { type: 'link', label: 'Reports',           href: '/reports', icon: <BarChart3  size={13} strokeWidth={1.75} /> },
    ],
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function TopNav() {
  const pathname  = usePathname();
  const router    = useRouter();
  const navRef    = useRef<HTMLElement>(null);

  const [search,      setSearch]      = useState('');
  const [openMenu,    setOpenMenu]    = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);

  useEffect(() => { setCurrentUser(getCurrentUser()); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (openMenu && navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  // Close dropdown on route change
  useEffect(() => { setOpenMenu(null); }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function isGroupActive(group: MenuGroup) {
    return group.matchPaths.some(p => pathname.startsWith(p));
  }

  return (
    <header style={{
      height: 48,
      background: '#111111',
      display: 'flex',
      alignItems: 'stretch',
      padding: '0 16px',
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 100,
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginRight: 20, flexShrink: 0,
        paddingRight: 20,
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Image
          src="/images/logo.png"
          alt="Samsara"
          width={88}
          height={30}
          style={{ objectFit: 'contain', objectPosition: 'left center', filter: 'brightness(0) invert(1)' }}
          priority
        />
        <span style={{
          color: 'rgba(255,255,255,0.28)', fontSize: 9, fontWeight: 600,
          letterSpacing: '0.18em', textTransform: 'uppercase',
        }}>RMS</span>
      </div>

      {/* Nav — Home + grouped dropdown menus */}
      <nav ref={navRef} style={{ display: 'flex', alignItems: 'stretch', flex: 1, position: 'relative' }}>

        {/* Home (standalone) */}
        <Link
          href="/dashboard"
          style={{
            display: 'flex', alignItems: 'center',
            padding: '0 14px', fontSize: 13, fontWeight: pathname === '/dashboard' ? 600 : 400,
            color: pathname === '/dashboard' ? '#ffffff' : 'rgba(255,255,255,0.50)',
            borderBottom: pathname === '/dashboard' ? '2px solid #ffffff' : '2px solid transparent',
            whiteSpace: 'nowrap', textDecoration: 'none', transition: 'color 0.12s',
          }}
          onMouseEnter={e => { if (pathname !== '/dashboard') (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)'; }}
          onMouseLeave={e => { if (pathname !== '/dashboard') (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.50)'; }}
        >
          Home
        </Link>

        {/* Dropdown menu groups */}
        {MENUS.map(group => {
          const active   = isGroupActive(group);
          const isOpen   = openMenu === group.key;

          return (
            <div key={group.key} style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
              <button
                onClick={() => setOpenMenu(isOpen ? null : group.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '0 14px', height: '100%',
                  fontSize: 13, fontWeight: active || isOpen ? 600 : 400,
                  color: active || isOpen ? '#ffffff' : 'rgba(255,255,255,0.50)',
                  borderBottom: active ? '2px solid #ffffff' : isOpen ? '2px solid rgba(255,255,255,0.35)' : '2px solid transparent',
                  background: isOpen ? 'rgba(255,255,255,0.06)' : 'none',
                  border: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                  whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'color 0.12s, background 0.12s',
                }}
                onMouseEnter={e => { if (!active && !isOpen) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)'; }}
                onMouseLeave={e => { if (!active && !isOpen) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.50)'; }}
              >
                {group.label}
                <ChevronDown
                  size={11}
                  strokeWidth={2}
                  style={{ transition: 'transform 0.15s', transform: isOpen ? 'rotate(180deg)' : 'none', opacity: 0.65 }}
                />
              </button>

              {/* Dropdown panel */}
              {isOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 1px)', left: 0,
                  background: '#ffffff',
                  border: '1px solid #E0E0E0',
                  borderRadius: '0 6px 6px 6px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                  minWidth: 210, zIndex: 200,
                  padding: '4px 0', overflow: 'hidden',
                }}>
                  {group.items.map((item, idx) => {
                    if (item.type === 'divider') {
                      return <div key={idx} style={{ height: 1, background: '#F0F0F0', margin: '3px 0' }} />;
                    }
                    if (item.type === 'header') {
                      return (
                        <p key={idx} style={{
                          padding: '7px 12px 3px', margin: 0,
                          fontSize: 10, fontWeight: 700, color: '#AAAAAA',
                          letterSpacing: '0.07em', textTransform: 'uppercase',
                        }}>
                          {item.label}
                        </p>
                      );
                    }
                    const isCurrent = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href !== '/reservations');
                    return (
                      <Link
                        key={idx}
                        href={item.href}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 9,
                          padding: '8px 14px',
                          color: isCurrent ? '#1A6FC4' : '#222222',
                          fontSize: 13, fontWeight: isCurrent ? 600 : 400,
                          textDecoration: 'none', background: isCurrent ? '#EFF6FF' : 'none',
                          transition: 'background 0.08s',
                        }}
                        onMouseEnter={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = '#F5F5F5'; }}
                        onMouseLeave={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'none'; }}
                      >
                        <span style={{ color: isCurrent ? '#1A6FC4' : '#AAAAAA', display: 'flex' }}>{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 4, padding: '4px 10px',
          width: 240,
        }}>
          <Search size={12} color="rgba(255,255,255,0.30)" strokeWidth={2} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reservations, clients…"
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: '#ffffff', fontSize: 12, width: '100%', fontFamily: 'inherit',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', cursor: 'pointer' }}>
              <X size={11} color="rgba(255,255,255,0.35)" />
            </button>
          )}
        </div>

        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />

        <NavIconBtn href="/dashboard" title="Inbox"><Mail size={15} strokeWidth={1.75} /></NavIconBtn>

        {/* Notifications */}
        <button
          title="Notifications"
          style={{
            position: 'relative', background: 'none', border: 'none',
            padding: '5px 7px', borderRadius: 4, display: 'flex', cursor: 'pointer',
            color: 'rgba(255,255,255,0.45)', transition: 'color 0.12s, background 0.12s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; }}
        >
          <Bell size={15} strokeWidth={1.75} />
          <span style={{ position: 'absolute', top: 5, right: 5, width: 5, height: 5, borderRadius: '50%', background: '#C9A84C' }} />
        </button>

        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#ffffff', lineHeight: 1.3, margin: 0 }}>
              {currentUser?.name ?? 'Loading…'}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', lineHeight: 1.3, margin: 0, letterSpacing: '0.05em' }}>
              {currentUser ? (currentUser.station ? currentUser.station.toUpperCase() : 'ALL STATIONS') : ''}
            </p>
          </div>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 11, fontWeight: 600, flexShrink: 0,
          }}>
            {currentUser?.initials ?? '?'}
          </div>
        </div>

        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />

        <NavIconBtn href="/settings" title="Settings"><Settings size={15} strokeWidth={1.75} /></NavIconBtn>

        <button
          onClick={handleSignOut}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 4,
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.45)', fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'color 0.12s, background 0.12s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; }}
        >
          <LogOut size={13} strokeWidth={1.75} />
          Sign Out
        </button>
      </div>
    </header>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function NavIconBtn({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      title={title}
      style={{
        display: 'flex', padding: '5px 7px',
        borderRadius: 4, color: 'rgba(255,255,255,0.45)',
        transition: 'color 0.12s, background 0.12s',
        textDecoration: 'none',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; }}
    >
      {children}
    </Link>
  );
}
