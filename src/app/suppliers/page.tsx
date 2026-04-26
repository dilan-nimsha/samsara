'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { mockSuppliers } from '@/lib/mock-data';
import type { SupplierType, SupplierStatus } from '@/types';
import {
  RefreshCw, Plus, SlidersHorizontal,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronRight,
  Hotel, Car, Compass, UtensilsCrossed, UserCheck, Star,
  CheckCircle, AlertCircle, Clock,
} from 'lucide-react';

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<SupplierType, { label: string; color: string; bg: string }> = {
  hotel:      { label: 'Hotel',      color: '#1D4ED8', bg: '#DBEAFE' },
  transport:  { label: 'Transport',  color: '#6D28D9', bg: '#EDE9FE' },
  activity:   { label: 'Activity',   color: '#065F46', bg: '#D1FAE5' },
  guide:      { label: 'Guide',      color: '#92400E', bg: '#FEF3C7' },
  restaurant: { label: 'Restaurant', color: '#9D174D', bg: '#FCE7F3' },
};

const STATUS_CFG: Record<SupplierStatus, { label: string; color: string; bg: string }> = {
  active:   { label: 'Active',   color: '#065F46', bg: '#D1FAE5' },
  inactive: { label: 'Inactive', color: '#4B5563', bg: '#F3F4F6' },
  on_hold:  { label: 'On Hold',  color: '#92400E', bg: '#FEF3C7' },
};

const PAYMENT_SHORT: Record<string, string> = {
  prepaid: 'Prepaid', net_7: 'NET 7', net_15: 'NET 15', net_30: 'NET 30', net_45: 'NET 45',
};

type TabKey = 'all' | SupplierType;
type SortField = 'name' | 'type' | 'rating' | 'total_bookings';
type SortDir   = 'asc' | 'desc';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',        label: 'All Suppliers' },
  { key: 'hotel',      label: 'Hotels' },
  { key: 'transport',  label: 'Transport' },
  { key: 'activity',   label: 'Activities' },
  { key: 'guide',      label: 'Guides' },
  { key: 'restaurant', label: 'Restaurants' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function contractBadge(end?: string): { label: string; color: string; icon: React.ReactNode } {
  if (!end) return { label: 'No Contract',    color: '#BBBBBB', icon: <Clock size={10} strokeWidth={2} /> };
  const days = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  if (days < 0)  return { label: 'Expired',         color: '#CC3333', icon: <AlertCircle size={10} strokeWidth={2} /> };
  if (days < 90) return { label: `Exp. in ${days}d`, color: '#D97706', icon: <AlertCircle size={10} strokeWidth={2} /> };
  return { label: new Date(end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }), color: '#059669', icon: <CheckCircle size={10} strokeWidth={2} /> };
}

function Th({
  children, sort, current, dir, onSort, center, width,
}: {
  children: React.ReactNode;
  sort?: SortField; current?: SortField; dir?: SortDir;
  onSort?: (f: SortField) => void;
  center?: boolean; width?: number;
}) {
  const active = sort && current === sort;
  return (
    <th
      onClick={sort && onSort ? () => onSort(sort) : undefined}
      style={{
        padding: '6px 10px',
        textAlign: center ? 'center' : 'left',
        fontSize: 11, fontWeight: 600,
        color: active ? '#111111' : '#888888',
        borderBottom: '1px solid #E5E5E5',
        background: '#F5F5F5',
        whiteSpace: 'nowrap',
        cursor: sort ? 'pointer' : 'default',
        userSelect: 'none',
        width: width ?? undefined,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        {children}
        {sort && (
          active
            ? dir === 'asc' ? <ArrowUp size={10} strokeWidth={2.5} /> : <ArrowDown size={10} strokeWidth={2.5} />
            : <ArrowUpDown size={10} strokeWidth={2} style={{ opacity: 0.35 }} />
        )}
      </span>
    </th>
  );
}

function TBtn({
  icon, label, primary, onClick,
}: {
  icon?: React.ReactNode; label: string; primary?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '3px 9px', borderRadius: 3, height: 26,
        border: primary ? '1px solid #111111' : '1px solid #BBBBBB',
        background: primary ? '#111111' : '#EBEBEB',
        color: primary ? '#ffffff' : '#333333',
        fontSize: 12, fontWeight: primary ? 600 : 500,
        cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!primary) (e.currentTarget as HTMLElement).style.background = '#DEDEDE'; }}
      onMouseLeave={e => { if (!primary) (e.currentTarget as HTMLElement).style.background = '#EBEBEB'; }}
    >
      {icon}{label}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 20, background: '#C0C0C0', margin: '0 4px' }} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const [tab,      setTab]      = useState<TabKey>('all');
  const [filter,   setFilter]   = useState('');
  const [status,   setStatus]   = useState<SupplierStatus | 'all'>('all');
  const [sort,     setSort]     = useState<SortField>('name');
  const [dir,      setDir]      = useState<SortDir>('asc');
  const [refreshing, setRefreshing] = useState(false);

  function toggleSort(f: SortField) {
    if (sort === f) setDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(f); setDir('asc'); }
  }

  function tabCount(key: TabKey) {
    return key === 'all' ? mockSuppliers.length : mockSuppliers.filter(s => s.type === key).length;
  }

  const rows = useMemo(() => {
    let list = [...mockSuppliers];
    if (tab !== 'all')      list = list.filter(s => s.type === tab);
    if (status !== 'all')   list = list.filter(s => s.status === status);
    if (filter.trim()) {
      const q = filter.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.contact_person.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.destinations.some(d => d.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      let av: string | number = '', bv: string | number = '';
      if (sort === 'name')          { av = a.name;          bv = b.name; }
      if (sort === 'type')          { av = a.type;          bv = b.type; }
      if (sort === 'rating')        { av = a.rating;        bv = b.rating; }
      if (sort === 'total_bookings') { av = a.total_bookings; bv = b.total_bookings; }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [tab, status, filter, sort, dir]);

  function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', background: '#F0F0F0' }}>

      {/* ── Toolbar ── */}
      <div style={{
        background: '#F0F0F0', borderBottom: '1px solid #C8C8C8',
        padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
      }}>
        <TBtn
          icon={<RefreshCw size={12} strokeWidth={2} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />}
          label={refreshing ? 'Refreshing…' : 'Refresh'}
          onClick={handleRefresh}
        />

        <Divider />

        {/* Status filter */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          border: '1px solid #D5D5D5', borderRadius: 4,
          padding: '3px 8px', background: '#FAFAFA', height: 26,
        }}>
          <span style={{ fontSize: 12, color: '#555555' }}>Status:</span>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as SupplierStatus | 'all')}
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: 12, color: '#333333', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>

        <div style={{ flex: 1 }} />

        {/* Filter input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          border: '1px solid #D5D5D5', borderRadius: 4,
          padding: '4px 8px', background: '#FAFAFA',
        }}>
          <SlidersHorizontal size={12} color="#AAAAAA" strokeWidth={2} />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter suppliers…"
            style={{
              background: 'none', border: 'none', outline: 'none',
              fontSize: 12, color: '#333333', width: 180, fontFamily: 'inherit',
            }}
          />
        </div>

        <Link
          href="/suppliers/new"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 12px', borderRadius: 3, height: 26,
            background: '#111111', color: '#ffffff',
            fontSize: 12, fontWeight: 600,
            textDecoration: 'none', flexShrink: 0,
            transition: 'opacity 0.12s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
        >
          <Plus size={12} strokeWidth={2.5} />
          Add Supplier
        </Link>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        background: '#ffffff', borderBottom: '1px solid #E5E5E5',
        display: 'flex', alignItems: 'stretch',
        padding: '0 16px', overflowX: 'auto', flexShrink: 0,
      }}>
        {TABS.map(({ key, label }) => {
          const active = tab === key;
          const count  = tabCount(key);
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0 14px', height: 38, border: 'none',
                borderBottom: active ? '2px solid #111111' : '2px solid transparent',
                background: active ? 'rgba(0,0,0,0.03)' : 'none',
                color: active ? '#111111' : '#777777',
                fontSize: 12, fontWeight: active ? 600 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                transition: 'color 0.12s, background 0.12s',
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#333333'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.02)'; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#777777'; (e.currentTarget as HTMLElement).style.background = 'none'; } }}
            >
              {label}
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                background: active ? '#111111' : '#EBEBEB',
                color: active ? '#ffffff' : '#777777',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', fontSize: 12, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 36 }} />
            <col style={{ width: 170 }} />
            <col style={{ width: 85 }} />
            <col style={{ width: 165 }} />
            <col style={{ width: 125 }} />
            <col style={{ width: 165 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 115 }} />
            <col style={{ width: 68 }} />
            <col style={{ width: 68 }} />
            <col style={{ width: 82 }} />
            <col style={{ width: 36 }} />
          </colgroup>

          <thead>
            <tr style={{ background: '#F5F5F5', borderBottom: '1px solid #E5E5E5', position: 'sticky', top: 0, zIndex: 10 }}>
              <th style={{ padding: '6px 10px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>#</th>
              <Th sort="name" current={sort} dir={dir} onSort={toggleSort}>Supplier</Th>
              <Th sort="type" current={sort} dir={dir} onSort={toggleSort}>Type</Th>
              <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Destinations</th>
              <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Contact Person</th>
              <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Email</th>
              <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Terms</th>
              <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Contract</th>
              <Th sort="rating" current={sort} dir={dir} onSort={toggleSort} center>Rating</Th>
              <Th sort="total_bookings" current={sort} dir={dir} onSort={toggleSort} center>Bkgs</Th>
              <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Status</th>
              <th style={{ padding: '6px 10px', background: '#F5F5F5', borderBottom: '1px solid #E5E5E5' }} />
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} style={{ padding: '32px', textAlign: 'center', color: '#AAAAAA', fontSize: 13 }}>
                  No suppliers match your filters.
                </td>
              </tr>
            )}
            {rows.map((s, i) => {
              const typeCfg   = TYPE_CFG[s.type];
              const statusCfg = STATUS_CFG[s.status];
              const contract  = contractBadge(s.contract_end);
              return (
                <tr
                  key={s.id}
                  style={{ borderBottom: '1px solid #F0F0F0', cursor: 'pointer', transition: 'background 0.08s' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F7F9FF')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  onClick={() => { window.location.href = `/suppliers/${s.id}`; }}
                >
                  {/* # */}
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#CCCCCC', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                    {i + 1}
                  </td>

                  {/* Supplier name */}
                  <td style={{ padding: '8px 10px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111111', marginBottom: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </p>
                  </td>

                  {/* Type badge */}
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.03em',
                      color: typeCfg.color, background: typeCfg.bg,
                      borderRadius: 3, padding: '2px 7px', whiteSpace: 'nowrap',
                    }}>
                      {typeCfg.label}
                    </span>
                  </td>

                  {/* Destinations */}
                  <td style={{ padding: '8px 10px', overflow: 'hidden' }}>
                    <span style={{ fontSize: 12, color: '#555555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {s.destinations.slice(0, 3).join(', ')}{s.destinations.length > 3 ? ` +${s.destinations.length - 3}` : ''}
                    </span>
                  </td>

                  {/* Contact */}
                  <td style={{ padding: '8px 10px', overflow: 'hidden' }}>
                    <span style={{ fontSize: 12, color: '#333333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {s.contact_person}
                    </span>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '8px 10px', overflow: 'hidden' }}>
                    <span style={{ fontSize: 11, color: '#777777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', fontFamily: 'monospace' }}>
                      {s.email}
                    </span>
                  </td>

                  {/* Payment terms */}
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ fontSize: 11, color: '#555555' }}>{PAYMENT_SHORT[s.payment_terms]}</span>
                  </td>

                  {/* Contract */}
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: contract.color, whiteSpace: 'nowrap' }}>
                      {contract.icon}
                      {contract.label}
                    </span>
                  </td>

                  {/* Rating */}
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontVariantNumeric: 'tabular-nums' }}>
                      <Star size={10} fill="#C9A84C" color="#C9A84C" strokeWidth={0} />
                      <span style={{ fontSize: 12, color: '#444444', fontWeight: 600 }}>{s.rating.toFixed(1)}</span>
                    </span>
                  </td>

                  {/* Bookings */}
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12, color: '#555555', fontVariantNumeric: 'tabular-nums' }}>
                    {s.total_bookings}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: statusCfg.color, background: statusCfg.bg,
                      borderRadius: 3, padding: '2px 7px',
                    }}>
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Arrow */}
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <ChevronRight size={13} color="#CCCCCC" strokeWidth={2} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer row */}
        {rows.length > 0 && (
          <div style={{
            background: '#F9F9F9', borderTop: '1px solid #EEEEEE',
            padding: '6px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, color: '#AAAAAA' }}>
              {rows.length} of {mockSuppliers.length} suppliers
            </span>
            <span style={{ fontSize: 11, color: '#AAAAAA' }}>
              {rows.reduce((s, x) => s + x.total_bookings, 0)} total bookings in view
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
