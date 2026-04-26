'use client';

import { Bell, Search, Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface TopBarProps {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
  breadcrumbs?: { label: string; href?: string }[];
}

export default function TopBar({ title, subtitle, action, breadcrumbs }: TopBarProps) {
  return (
    <header style={{
      height: 52,
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      background: '#0C0C0C',
      position: 'sticky', top: 0, zIndex: 40,
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
        <button style={{
          position: 'relative',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 5, padding: '5px 6px',
          display: 'flex', transition: 'background 0.12s',
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')}
        >
          <Bell size={14} color="rgba(255,255,255,0.45)" />
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 5, height: 5, borderRadius: '50%',
            background: '#C9A84C',
          }} />
        </button>

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
