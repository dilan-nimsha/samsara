'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCurrentUser } from '@/lib/session';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, Bell, LogOut, Settings, X, Mail,
  ChevronDown, CalendarDays, UserPlus, Users, Handshake,
  UserCheck, Truck, Package, CreditCard, BarChart3,
  Plus, FileDown, FileUp, Clock, ArrowRight,
  Tag, CalendarRange, Building2, Percent, FileX, ListChecks, Calculator,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import type { ReservationStatus } from '@/types';

// ── Search types ───────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  reference: string;
  clientName: string;
  destinations: string[];
  status: ReservationStatus;
  arrivalDate: string;
}

const RECENT_KEY = 'samsara_recent_searches';
const MAX_RECENT  = 6;

function loadRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; }
}
function saveRecent(term: string) {
  const prev = loadRecent().filter(t => t !== term);
  localStorage.setItem(RECENT_KEY, JSON.stringify([term, ...prev].slice(0, MAX_RECENT)));
}
function clearRecent() {
  localStorage.removeItem(RECENT_KEY);
}

const STATUS_LABEL: Record<string, string> = {
  enquiry: 'Enquiry', under_review: 'Under Review', confirmed: 'Confirmed',
  invoice_sent: 'Invoiced', paid: 'Paid', trip_active: 'Active',
  completed: 'Completed', cancelled: 'Cancelled', feedback_pending: 'Feedback',
};
const STATUS_COLOR: Record<string, string> = {
  enquiry: '#6B7280', under_review: '#D97706', confirmed: '#2563EB',
  invoice_sent: '#7C3AED', paid: '#059669', trip_active: '#0891B2',
  completed: '#374151', cancelled: '#DC2626', feedback_pending: '#9333EA',
};

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
    key: 'rates',
    label: 'Rates & Policies',
    matchPaths: ['/rates'],
    items: [
      { type: 'header', label: 'Pricing' },
      { type: 'link', label: 'Contracted Rates',        href: '/rates?tab=contracted',   icon: <Tag          size={13} strokeWidth={1.75} /> },
      { type: 'link', label: 'Seasonal Pricing',        href: '/rates?tab=seasonal',     icon: <CalendarRange size={13} strokeWidth={1.75} /> },
      { type: 'link', label: 'Supplier Rates',          href: '/rates?tab=supplier',     icon: <Building2    size={13} strokeWidth={1.75} /> },
      { type: 'link', label: 'Markups & Commissions',   href: '/rates?tab=markups',      icon: <Percent      size={13} strokeWidth={1.75} /> },
      { type: 'divider' },
      { type: 'header', label: 'Policies' },
      { type: 'link', label: 'Cancellation Policies',   href: '/rates?tab=cancellation', icon: <FileX        size={13} strokeWidth={1.75} /> },
      { type: 'link', label: 'Payment Terms',           href: '/rates?tab=payment',      icon: <CreditCard   size={13} strokeWidth={1.75} /> },
      { type: 'link', label: 'Service Inclusions',      href: '/rates?tab=inclusions',   icon: <ListChecks   size={13} strokeWidth={1.75} /> },
      { type: 'link', label: 'Tax Settings',            href: '/rates?tab=tax',          icon: <Calculator   size={13} strokeWidth={1.75} /> },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    matchPaths: ['/finance', '/reports', '/analytics'],
    items: [
      { type: 'link', label: 'Finance Overview',    href: '/finance',    icon: <CreditCard size={13} strokeWidth={1.75} /> },
      { type: 'link', label: 'Analytics & Insights', href: '/analytics', icon: <BarChart3  size={13} strokeWidth={1.75} /> },
      { type: 'divider' },
      { type: 'link', label: 'Reports',              href: '/reports',   icon: <BarChart3  size={13} strokeWidth={1.75} /> },
    ],
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function TopNav() {
  const pathname  = usePathname();
  const router    = useRouter();
  const navRef    = useRef<HTMLElement>(null);

  const [search,        setSearch]        = useState('');
  const [openMenu,      setOpenMenu]      = useState<string | null>(null);
  const { user: currentUser } = useCurrentUser();

  // ── Search state ──────────────────────────────────────────────────
  const [allResults,    setAllResults]    = useState<SearchResult[]>([]);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [resultsLoaded, setResultsLoaded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Fetch all reservations once for client-side search
  const loadAllReservations = useCallback(async () => {
    if (resultsLoaded) return;
    try {
      const res  = await fetch('/api/reservations');
      const data = await res.json() as {
        success: boolean;
        reservations?: Array<{
          id: string; reference: string; status: string;
          arrival_date: string; destinations: string[];
          client?: { full_name?: string };
        }>;
      };
      if (data.success && data.reservations) {
        setAllResults(data.reservations.map(r => ({
          id:           r.id,
          reference:    r.reference,
          clientName:   r.client?.full_name ?? '—',
          destinations: r.destinations ?? [],
          status:       r.status as ReservationStatus,
          arrivalDate:  r.arrival_date,
        })));
        setResultsLoaded(true);
      }
    } catch { /* silent */ }
  }, [resultsLoaded]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close nav menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (openMenu && navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  // Close both on route change
  useEffect(() => { setOpenMenu(null); setSearchOpen(false); setSearch(''); }, [pathname]);

  // Filtered results based on query
  const q = search.toLowerCase().trim();
  const matchedResults = q.length >= 1
    ? allResults.filter(r =>
        r.reference.toLowerCase().includes(q) ||
        r.clientName.toLowerCase().includes(q) ||
        r.destinations.some(d => d.toLowerCase().includes(q))
      ).slice(0, 8)
    : [];

  function openSearch() {
    setSearchOpen(true);
    setRecentSearches(loadRecent());
    loadAllReservations();
  }

  function handleResultClick(result: SearchResult) {
    saveRecent(result.reference);
    setSearch('');
    setSearchOpen(false);
    router.push(`/reservations/${result.id}`);
  }

  function handleRecentClick(term: string) {
    setSearch(term);
    inputRef.current?.focus();
  }

  function handleClearRecent() {
    clearRecent();
    setRecentSearches([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setSearchOpen(false); setSearch(''); }
    if (e.key === 'Enter' && matchedResults.length > 0) handleResultClick(matchedResults[0]);
  }

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
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                  borderBottom: active ? '2px solid #ffffff' : isOpen ? '2px solid rgba(255,255,255,0.35)' : '2px solid transparent',
                  background: isOpen ? 'rgba(255,255,255,0.06)' : 'none',
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
                    const hrefPath = item.href.split('?')[0];
                    const isCurrent = pathname === hrefPath || (hrefPath !== '/dashboard' && hrefPath !== '/reservations' && pathname.startsWith(hrefPath));
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

        {/* Global Search */}
        <div ref={searchRef} style={{ position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: searchOpen ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.07)',
            border: searchOpen ? '1px solid rgba(201,168,76,0.5)' : '1px solid rgba(255,255,255,0.09)',
            borderRadius: 4, padding: '4px 10px',
            width: 240, transition: 'background 0.12s, border-color 0.12s',
          }}>
            <Search size={12} color={searchOpen ? '#C9A84C' : 'rgba(255,255,255,0.30)'} strokeWidth={2} />
            <input
              ref={inputRef}
              value={search}
              onChange={e => { setSearch(e.target.value); if (!searchOpen) openSearch(); }}
              onFocus={openSearch}
              onKeyDown={handleKeyDown}
              placeholder="Search ref, name, destination…"
              style={{
                background: 'none', border: 'none', outline: 'none',
                color: '#ffffff', fontSize: 12, width: '100%', fontFamily: 'inherit',
              }}
            />
            {search && (
              <button onClick={() => { setSearch(''); inputRef.current?.focus(); }} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', cursor: 'pointer' }}>
                <X size={11} color="rgba(255,255,255,0.35)" />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {searchOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)',
              left: '50%', transform: 'translateX(-50%)',
              width: 360, background: '#1C1C1C',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 6, boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
              zIndex: 300, overflow: 'hidden',
            }}>

              {/* Results */}
              {q.length >= 1 && (
                <>
                  {matchedResults.length === 0 ? (
                    <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                      <Search size={18} color="rgba(255,255,255,0.15)" style={{ marginBottom: 8 }} />
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>No results for <strong style={{ color: 'rgba(255,255,255,0.5)' }}>{search}</strong></p>
                    </div>
                  ) : (
                    <>
                      <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Reservations
                        </span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{matchedResults.length} found</span>
                      </div>
                      {matchedResults.map(r => (
                        <button
                          key={r.id}
                          onClick={() => handleResultClick(r)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px', background: 'none', border: 'none',
                            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            transition: 'background 0.08s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.08)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          {/* Ref badge */}
                          <div style={{
                            flexShrink: 0, background: 'rgba(255,255,255,0.06)',
                            borderRadius: 3, padding: '3px 7px',
                            fontFamily: 'monospace', fontSize: 11, color: '#C9A84C', fontWeight: 600,
                          }}>
                            {r.reference}
                          </div>

                          {/* Details */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#E8E3DB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.clientName}
                            </p>
                            <p style={{ margin: '1px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.destinations.join(' · ')} {r.arrivalDate ? `· ${r.arrivalDate}` : ''}
                            </p>
                          </div>

                          {/* Status chip */}
                          <span style={{
                            flexShrink: 0, fontSize: 10, fontWeight: 600,
                            color: STATUS_COLOR[r.status] ?? '#6B7280',
                            background: `${STATUS_COLOR[r.status] ?? '#6B7280'}18`,
                            borderRadius: 3, padding: '2px 6px',
                          }}>
                            {STATUS_LABEL[r.status] ?? r.status}
                          </span>

                          <ArrowRight size={11} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}

              {/* Recent searches — shown when no query */}
              {q.length === 0 && recentSearches.length > 0 && (
                <>
                  <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Recent Searches
                    </span>
                    <button
                      onClick={handleClearRecent}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'inherit', padding: 0, transition: 'color 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#C9A84C')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map(term => (
                    <button
                      key={term}
                      onClick={() => handleRecentClick(term)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 14px', background: 'none', border: 'none',
                        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        transition: 'background 0.08s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <Clock size={11} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>{term}</span>
                    </button>
                  ))}
                </>
              )}

              {/* Empty state when no query and no recent */}
              {q.length === 0 && recentSearches.length === 0 && (
                <div style={{ padding: '18px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>Type a reference number, name, or destination</p>
                </div>
              )}

              {/* Footer hint */}
              <div style={{ padding: '7px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>↵ open first</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Esc close</span>
              </div>
            </div>
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
