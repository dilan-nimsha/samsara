'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, Plus, ChevronRight, CheckCircle, CreditCard, AlertCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface TopBarProps {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
  breadcrumbs?: { label: string; href?: string }[];
}

const NOTIFS = [
  { id: 1, icon: MessageSquare, color: '#2563EB', title: 'New booking inquiry', body: 'Rajiv Mehta — Maldives, June 2026', time: '10 min ago', read: false },
  { id: 2, icon: CreditCard,    color: '#16A34A', title: 'Payment received',    body: 'USD 6,400 — Reservation SAM-2026-1042', time: '1 hr ago',  read: false },
  { id: 3, icon: AlertCircle,   color: '#D97706', title: 'Change request',       body: 'Nishadi Jayawardena — Departure date update', time: '2 hr ago',  read: true  },
  { id: 4, icon: CheckCircle,   color: '#7C3AED', title: 'Partner rate updated', body: 'Six Senses Laamu — 2026 rate sheet ready', time: 'Yesterday', read: true  },
];

export default function TopBar({ title, subtitle, action, breadcrumbs }: TopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds,   setReadIds]   = useState<number[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

  const unread = NOTIFS.filter(n => !n.read && !readIds.includes(n.id)).length;

  function markAllRead() { setReadIds(NOTIFS.map(n => n.id)); }

  return (
    <header style={{
      height: 52,
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      background: '#0C0C0C',
      position: 'sticky', top: 48, zIndex: 40,
    }}>

      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
            {breadcrumbs.map((b, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {i > 0 && <ChevronRight size={9} color="rgba(255,255,255,0.2)" />}
                {b.href
                  ? <Link href={b.href} style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{b.label}</Link>
                  : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{b.label}</span>
                }
              </span>
            ))}
          </div>
        )}
        <h1 style={{ fontSize: 14, fontWeight: 600, color: '#E8E3DB', letterSpacing: '-0.01em', lineHeight: 1 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, marginTop: 2 }}>{subtitle}</p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          padding: '5px 10px', borderRadius: 5, minWidth: 220,
        }}>
          <Search size={12} color="rgba(255,255,255,0.22)" />
          <input
            placeholder="Search..."
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: '#E8E3DB', fontSize: 12, width: '100%',
            }}
          />
        </div>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.07)' }} />

        {/* Notifications */}
        <div ref={panelRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            style={{
              position: 'relative',
              background: notifOpen ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 5, padding: '5px 6px',
              display: 'flex', cursor: 'pointer', transition: 'background 0.12s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = notifOpen ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)')}
          >
            <Bell size={14} color="rgba(255,255,255,0.45)" />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 3, right: 3,
                width: 5, height: 5, borderRadius: '50%',
                background: '#C9A84C',
              }} />
            )}
          </button>

          {notifOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 320, background: '#1A1A1A',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              zIndex: 200, overflow: 'hidden',
            }}>
              {/* Panel header */}
              <div style={{
                padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#E8E3DB' }}>
                  Notifications {unread > 0 && <span style={{ color: '#C9A84C' }}>({unread})</span>}
                </span>
                <button
                  onClick={markAllRead}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'inherit',
                    padding: 0, transition: 'color 0.1s',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#C9A84C')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)')}
                >
                  Mark all read
                </button>
              </div>

              {/* Notification items */}
              {NOTIFS.map(n => {
                const isRead = n.read || readIds.includes(n.id);
                const Icon = n.icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => setReadIds(p => p.includes(n.id) ? p : [...p, n.id])}
                    style={{
                      padding: '11px 14px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex', gap: 10, cursor: 'pointer',
                      background: isRead ? 'transparent' : 'rgba(201,168,76,0.04)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = isRead ? 'transparent' : 'rgba(201,168,76,0.04)')}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: `${n.color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={13} color={n.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: isRead ? 400 : 600, color: '#E8E3DB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.title}
                        </span>
                        {!isRead && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C9A84C', flexShrink: 0 }} />}
                      </div>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', margin: '3px 0 0' }}>{n.time}</p>
                    </div>
                  </div>
                );
              })}

              {/* Footer */}
              <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  onClick={() => setNotifOpen(false)}
                  style={{
                    width: '100%', background: 'none', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 5, padding: '6px 0', fontSize: 11,
                    color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'border-color 0.1s, color 0.1s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = '#E8E3DB';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  }}
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {action && (
          <Link href={action.href} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#C9A84C', color: '#080808',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', padding: '6px 12px', borderRadius: 5,
            transition: 'opacity 0.12s',
          }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          >
            <Plus size={12} />
            {action.label}
          </Link>
        )}

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.07)' }} />

        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(201,168,76,0.15)',
          border: '1px solid rgba(201,168,76,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#C9A84C', fontSize: 11, fontWeight: 600, cursor: 'pointer',
        }}>N</div>
      </div>
    </header>
  );
}
