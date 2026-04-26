'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { mockReservations } from '@/lib/mock-data';
import { formatCurrency, PAYMENT_CONFIG } from '@/lib/utils';
import {
  RefreshCw, Download, SlidersHorizontal,
  ArrowUpDown, ArrowUp, ArrowDown,
  TrendingUp, AlertCircle, Banknote, Clock,
} from 'lucide-react';

type TabKey    = 'all' | 'outstanding' | 'commissions' | 'overdue';
type SortField = 'reference' | 'client' | 'total' | 'paid' | 'balance' | 'commission';
type SortDir   = 'asc' | 'desc';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',          label: 'All Reservations' },
  { key: 'outstanding',  label: 'Outstanding' },
  { key: 'commissions',  label: 'Commissions' },
  { key: 'overdue',      label: 'Overdue' },
];

const totalRevenue     = mockReservations.reduce((s, r) => s + r.total_paid, 0);
const totalOutstanding = mockReservations.reduce((s, r) => s + Math.max(0, r.total_cost - r.total_paid), 0);
const totalCommission  = mockReservations.reduce((s, r) => s + r.commission_amount, 0);
const overdueCount     = mockReservations.filter(r => r.payment_status === 'overdue').length;

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
      onClick={sort && onSort ? () => onSort(sort!) : undefined}
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
            ? dir === 'asc'
              ? <ArrowUp size={10} strokeWidth={2.5} />
              : <ArrowDown size={10} strokeWidth={2.5} />
            : <ArrowUpDown size={10} strokeWidth={2} style={{ opacity: 0.35 }} />
        )}
      </span>
    </th>
  );
}

function TBtn({ icon, label, primary, onClick }: {
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

export default function FinancePage() {
  const [tab,        setTab]        = useState<TabKey>('all');
  const [filter,     setFilter]     = useState('');
  const [sort,       setSort]       = useState<SortField>('reference');
  const [dir,        setDir]        = useState<SortDir>('asc');
  const [refreshing, setRefreshing] = useState(false);

  function toggleSort(f: SortField) {
    if (sort === f) setDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(f); setDir('asc'); }
  }

  function tabCount(key: TabKey) {
    if (key === 'outstanding')  return mockReservations.filter(r => r.total_cost > r.total_paid).length;
    if (key === 'commissions')  return mockReservations.filter(r => r.commission_amount > 0).length;
    if (key === 'overdue')      return overdueCount;
    return mockReservations.length;
  }

  const rows = useMemo(() => {
    let list = [...mockReservations];
    if (tab === 'outstanding') list = list.filter(r => r.total_cost > r.total_paid);
    if (tab === 'commissions') list = list.filter(r => r.commission_amount > 0);
    if (tab === 'overdue')     list = list.filter(r => r.payment_status === 'overdue');
    if (filter.trim()) {
      const q = filter.toLowerCase();
      list = list.filter(r =>
        r.reference.toLowerCase().includes(q) ||
        (r.client?.full_name ?? '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let av: string | number = '', bv: string | number = '';
      if (sort === 'reference')   { av = a.reference;        bv = b.reference; }
      if (sort === 'client')      { av = a.client?.full_name ?? ''; bv = b.client?.full_name ?? ''; }
      if (sort === 'total')       { av = a.total_cost;       bv = b.total_cost; }
      if (sort === 'paid')        { av = a.total_paid;       bv = b.total_paid; }
      if (sort === 'balance')     { av = Math.max(0, a.total_cost - a.total_paid); bv = Math.max(0, b.total_cost - b.total_paid); }
      if (sort === 'commission')  { av = a.commission_amount; bv = b.commission_amount; }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [tab, filter, sort, dir]);

  function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }

  function exportCSV() {
    const header = ['Reference', 'Client', 'Total Cost', 'Paid', 'Balance', 'Commission', 'Payment Status', 'Currency'];
    const dataRows = rows.map(r => [
      r.reference,
      r.client?.full_name ?? '',
      r.total_cost,
      r.total_paid,
      Math.max(0, r.total_cost - r.total_paid),
      r.commission_amount,
      r.payment_status,
      r.currency,
    ]);
    const csv = [header, ...dataRows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const viewRevenue     = rows.reduce((s, r) => s + r.total_paid, 0);
  const viewOutstanding = rows.reduce((s, r) => s + Math.max(0, r.total_cost - r.total_paid), 0);
  const viewCommission  = rows.reduce((s, r) => s + r.commission_amount, 0);

  const KPI_CARDS = [
    { label: 'Revenue Collected',  value: formatCurrency(totalRevenue, 'GBP'),     color: '#059669', bg: '#D1FAE5', icon: <TrendingUp size={16} strokeWidth={2} /> },
    { label: 'Outstanding Balance', value: formatCurrency(totalOutstanding, 'GBP'), color: '#D97706', bg: '#FEF3C7', icon: <Clock size={16} strokeWidth={2} /> },
    { label: 'Commissions Due',     value: formatCurrency(totalCommission, 'GBP'),  color: '#1A6FC4', bg: '#DBEAFE', icon: <Banknote size={16} strokeWidth={2} /> },
    { label: 'Overdue Invoices',    value: String(overdueCount),                    color: '#DC2626', bg: '#FEE2E2', icon: <AlertCircle size={16} strokeWidth={2} /> },
  ];

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', background: '#E8E8E8' }}>

      {/* Toolbar */}
      <div style={{
        background: '#F0F0F0', borderBottom: '1px solid #C8C8C8',
        padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
      }}>
        <TBtn
          icon={<RefreshCw size={12} strokeWidth={2} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />}
          label={refreshing ? 'Refreshing…' : 'Refresh'}
          onClick={handleRefresh}
        />
        <TBtn icon={<Download size={12} strokeWidth={2} />} label="Export CSV" onClick={exportCSV} />

        <Divider />

        <div style={{ flex: 1 }} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          border: '1px solid #D5D5D5', borderRadius: 4,
          padding: '4px 8px', background: '#FAFAFA',
        }}>
          <SlidersHorizontal size={12} color="#AAAAAA" strokeWidth={2} />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter by reference or client…"
            style={{
              background: 'none', border: 'none', outline: 'none',
              fontSize: 12, color: '#333333', width: 220, fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        padding: '10px 12px', display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, flexShrink: 0,
      }}>
        {KPI_CARDS.map(card => (
          <div key={card.label} style={{
            background: '#ffffff', border: '1px solid #E5E5E5',
            borderRadius: 4, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: card.bg, color: card.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {card.icon}
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#888888', marginBottom: 3 }}>{card.label}</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: card.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{
        background: '#ffffff', borderBottom: '1px solid #E5E5E5',
        borderTop: '1px solid #E5E5E5',
        display: 'flex', alignItems: 'stretch',
        padding: '0 16px', flexShrink: 0,
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

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', fontSize: 12, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 36 }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 170 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 100 }} />
          </colgroup>

          <thead>
            <tr style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <th style={{ padding: '6px 10px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>#</th>
              <Th sort="reference" current={sort} dir={dir} onSort={toggleSort}>Reference</Th>
              <Th sort="client" current={sort} dir={dir} onSort={toggleSort}>Client</Th>
              <Th sort="total" current={sort} dir={dir} onSort={toggleSort} center>Total Value</Th>
              <Th sort="paid" current={sort} dir={dir} onSort={toggleSort} center>Paid</Th>
              <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5', textAlign: 'center' }}>% Paid</th>
              <Th sort="balance" current={sort} dir={dir} onSort={toggleSort} center>Balance</Th>
              <Th sort="commission" current={sort} dir={dir} onSort={toggleSort} center>Commission</Th>
              <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Status</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#AAAAAA', fontSize: 13 }}>
                  No records match your filters.
                </td>
              </tr>
            )}
            {rows.map((r, i) => {
              const payment = PAYMENT_CONFIG[r.payment_status];
              const balance = Math.max(0, r.total_cost - r.total_paid);
              const pct     = r.total_cost > 0 ? Math.round((r.total_paid / r.total_cost) * 100) : 0;
              return (
                <tr
                  key={r.id}
                  style={{ borderBottom: '1px solid #F0F0F0', cursor: 'pointer', transition: 'background 0.08s' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F7F9FF')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  onClick={() => { window.location.href = `/reservations/${r.id}`; }}
                >
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#CCCCCC', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                    {i + 1}
                  </td>

                  <td style={{ padding: '8px 10px' }}>
                    <Link
                      href={`/reservations/${r.id}`}
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: 12, fontWeight: 600, color: '#1A6FC4', textDecoration: 'none', fontFamily: 'monospace' }}
                    >
                      {r.reference}
                    </Link>
                  </td>

                  <td style={{ padding: '8px 10px', fontSize: 12, color: '#333333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.client?.full_name}
                  </td>

                  <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#111111', fontVariantNumeric: 'tabular-nums' }}>
                    {r.total_cost > 0 ? formatCurrency(r.total_cost, r.currency) : '—'}
                  </td>

                  <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                    {r.total_paid > 0 ? formatCurrency(r.total_paid, r.currency) : '—'}
                  </td>

                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                      <div style={{ width: 52, height: 4, background: '#EEEEEE', borderRadius: 2, flexShrink: 0 }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          width: `${pct}%`,
                          background: pct === 100 ? '#059669' : pct > 0 ? '#D97706' : '#DDDDDD',
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#888888', fontVariantNumeric: 'tabular-nums', minWidth: 26 }}>
                        {pct}%
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12, fontWeight: balance > 0 ? 600 : 400, color: balance > 0 ? '#D97706' : '#CCCCCC', fontVariantNumeric: 'tabular-nums' }}>
                    {balance > 0 ? formatCurrency(balance, r.currency) : '—'}
                  </td>

                  <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12, fontWeight: r.commission_amount > 0 ? 600 : 400, color: r.commission_amount > 0 ? '#1A6FC4' : '#CCCCCC', fontVariantNumeric: 'tabular-nums' }}>
                    {r.commission_amount > 0 ? formatCurrency(r.commission_amount, r.currency) : '—'}
                  </td>

                  <td style={{ padding: '8px 10px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: payment.color,
                      background: payment.color + '18',
                      borderRadius: 3, padding: '2px 7px',
                    }}>
                      {payment.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer totals */}
        {rows.length > 0 && (
          <div style={{
            background: '#F9F9F9', borderTop: '1px solid #EEEEEE',
            padding: '8px 16px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, color: '#AAAAAA' }}>
              {rows.length} of {mockReservations.length} reservations
            </span>
            <div style={{ display: 'flex', gap: 28 }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, color: '#AAAAAA', marginBottom: 2 }}>Collected (view)</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(viewRevenue, 'GBP')}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, color: '#AAAAAA', marginBottom: 2 }}>Outstanding (view)</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#D97706', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(viewOutstanding, 'GBP')}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, color: '#AAAAAA', marginBottom: 2 }}>Commission (view)</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1A6FC4', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(viewCommission, 'GBP')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
