'use client';

import { Bell, Search, Plus } from 'lucide-react';
import Link from 'next/link';

interface TopBarProps {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
}

export default function TopBar({ title, subtitle, action }: TopBarProps) {
  return (
    <header style={{
      height: 72,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      background: '#0D0D0D',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div>
        <h1 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 500, letterSpacing: '0.02em' }}>{title}</h1>
        {subtitle && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', marginTop: 2 }}>{subtitle}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          padding: '0.5rem 1rem', borderRadius: 6, minWidth: 220,
        }}>
          <Search size={14} color="rgba(255,255,255,0.3)" />
          <input
            placeholder="Search reservations, clients..."
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: '#fff', fontSize: '0.78rem', width: '100%',
            }}
          />
        </div>

        {/* Notifications */}
        <button style={{
          position: 'relative', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
          padding: '0.5rem', cursor: 'pointer', display: 'flex',
        }}>
          <Bell size={16} color="rgba(255,255,255,0.6)" />
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 7, height: 7, borderRadius: '50%',
            background: '#C9A84C',
          }} />
        </button>

        {/* Action button */}
        {action && (
          <Link href={action.href} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: '#C9A84C', color: '#080808',
            padding: '0.55rem 1.2rem', borderRadius: 6,
            fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em',
            textDecoration: 'none', textTransform: 'uppercase',
            transition: 'background 0.2s',
          }}>
            <Plus size={14} />
            {action.label}
          </Link>
        )}

        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg, #C9A84C, #8B6914)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
        }}>
          N
        </div>
      </div>
    </header>
  );
}
