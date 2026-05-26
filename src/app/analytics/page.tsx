'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Reservation, Supplier } from '@/types';
import { TrendingUp, TrendingDown, Minus, BarChart3, Users, Globe, Truck } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'revenue' | 'clients' | 'operations';

// ── Representative analytics dataset ─────────────────────────────────────────
// Computed from mock data and augmented with realistic historical figures.

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const MONTHLY = [
  { m: 'Jan', bookings: 14, revenue: 85400,  paid: 72000  },
  { m: 'Feb', bookings: 18, revenue: 112000, paid: 98000  },
  { m: 'Mar', bookings: 22, revenue: 148000, paid: 130000 },
  { m: 'Apr', bookings: 31, revenue: 198000, paid: 161000 },
  { m: 'May', bookings: 28, revenue: 175000, paid: 148000 },
  { m: 'Jun', bookings: 19, revenue: 122000, paid: 104000 },
  { m: 'Jul', bookings: 16, revenue:  98000, paid:  88000 },
  { m: 'Aug', bookings: 21, revenue: 134000, paid: 116000 },
  { m: 'Sep', bookings: 17, revenue: 108000, paid:  94000 },
  { m: 'Oct', bookings: 24, revenue: 158000, paid: 138000 },
  { m: 'Nov', bookings: 29, revenue: 186000, paid: 162000 },
  { m: 'Dec', bookings: 35, revenue: 225000, paid: 198000 },
];

const NATIONALITIES = [
  { country: 'United Kingdom', count: 42, flag: '🇬🇧' },
  { country: 'Germany',        count: 31, flag: '🇩🇪' },
  { country: 'France',         count: 24, flag: '🇫🇷' },
  { country: 'Australia',      count: 18, flag: '🇦🇺' },
  { country: 'China',          count: 15, flag: '🇨🇳' },
  { country: 'United States',  count: 12, flag: '🇺🇸' },
  { country: 'Netherlands',    count:  8, flag: '🇳🇱' },
  { country: 'Other',          count: 11, flag: '🌐' },
];

const DESTINATIONS = [
  { name: 'Galle & Fort',        visits: 89, color: '#1A6FC4' },
  { name: 'Sigiriya',            visits: 74, color: '#7C3AED' },
  { name: 'Kandy',               visits: 68, color: '#065F46' },
  { name: 'Ella',                visits: 61, color: '#92400E' },
  { name: 'Yala National Park',  visits: 52, color: '#9D174D' },
  { name: 'Mirissa',             visits: 47, color: '#0E7490' },
  { name: 'Nuwara Eliya',        visits: 38, color: '#1D4ED8' },
  { name: 'Tangalle',            visits: 31, color: '#6D28D9' },
];

const ACTIVITIES = [
  { name: 'Whale Watching',       bookings: 64, color: '#1A6FC4' },
  { name: 'Sigiriya Rock Climb',  bookings: 58, color: '#7C3AED' },
  { name: 'Safari / Game Drive',  bookings: 52, color: '#065F46' },
  { name: 'Hiking & Trekking',    bookings: 44, color: '#92400E' },
  { name: 'Snorkelling',          bookings: 38, color: '#0E7490' },
  { name: 'Tea Plantation Tour',  bookings: 33, color: '#9D174D' },
  { name: 'Galle Fort Walk',      bookings: 29, color: '#B45309' },
];

const VEHICLES = [
  { type: 'Luxury Sedan',   count: 124, color: '#1A6FC4' },
  { type: 'KDH Van',        count:  88, color: '#7C3AED' },
  { type: 'Minibus (14 pax)', count: 55, color: '#065F46' },
  { type: 'Luxury SUV',     count:  42, color: '#92400E' },
  { type: 'Coach (30+ pax)', count: 16, color: '#9D174D' },
];

const TRAVEL_PURPOSE = [
  { label: 'Leisure',     value: 38, color: '#1A6FC4' },
  { label: 'Honeymoon',   value: 24, color: '#9D174D' },
  { label: 'Group Tour',  value: 18, color: '#065F46' },
  { label: 'Corporate',   value: 12, color: '#92400E' },
  { label: 'Anniversary', value:  8, color: '#7C3AED' },
];

const SERVICE_REVENUE = [
  { label: 'Accommodation', value: 55, color: '#1A6FC4' },
  { label: 'Transport',     value: 20, color: '#7C3AED' },
  { label: 'Activities',    value: 15, color: '#065F46' },
  { label: 'Guide Fees',    value:  6, color: '#92400E' },
  { label: 'Misc',          value:  4, color: '#AAAAAA' },
];

const CANCELLATION_REASONS = [
  { reason: 'Schedule Change',   count: 12, pct: 40 },
  { reason: 'Budget Revision',   count:  9, pct: 30 },
  { reason: 'Visa Issue',        count:  5, pct: 17 },
  { reason: 'Health / Medical',  count:  2, pct:  7 },
  { reason: 'Other',             count:  2, pct:  6 },
];

// ── Computed from mock data ───────────────────────────────────────────────────

function computeKPIs(reservations: Reservation[]) {
  const totalRevenue  = reservations.reduce((s, r) => s + (r.total_cost ?? 0),  0);
  const totalPaid     = reservations.reduce((s, r) => s + (r.total_paid ?? 0),  0);
  const totalComm     = reservations.reduce((s, r) => s + (r.commission_amount ?? 0), 0);
  const totalBookings = reservations.length;
  const avgValue      = totalBookings ? totalRevenue / totalBookings : 0;
  const activeTrips   = reservations.filter(r => r.status === 'trip_active').length;
  const confirmed     = reservations.filter(r => ['confirmed','invoice_sent','paid','trip_active','completed'].includes(r.status)).length;
  const conversionPct = totalBookings ? Math.round((confirmed / totalBookings) * 100) : 0;
  return { totalRevenue, totalPaid, totalComm, totalBookings, avgValue, activeTrips, conversionPct };
}

// ── Design System ─────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #E0E0E0',
  borderRadius: 4,
  overflow: 'hidden',
};

const HEAD: React.CSSProperties = {
  background: '#F4F4F4',
  borderBottom: '1px solid #E0E0E0',
  padding: '6px 12px',
  fontSize: 11,
  fontWeight: 700,
  color: '#444444',
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
};

const BODY: React.CSSProperties = { padding: '12px 14px' };

// ── SVG Chart Components ──────────────────────────────────────────────────────

function LineChart({ values, color = '#1A6FC4', h = 64 }: { values: number[]; color?: string; h?: number }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const W = 300;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * W,
    h - ((v - min) / range) * (h - 10) - 4,
  ] as [number, number]);
  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${W},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`lg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#lg-${color.replace('#','')})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.2} fill={color} />
      ))}
    </svg>
  );
}

function BarChart({ data, h = 90 }: { data: { label: string; value: number; color?: string }[]; h?: number }) {
  const max = Math.max(...data.map(d => d.value));
  const barW = Math.floor(100 / data.length);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: h, padding: '0 2px' }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            <span style={{ fontSize: 9, color: '#AAAAAA', marginBottom: 2, fontVariantNumeric: 'tabular-nums' }}>{d.value}</span>
            <div style={{ width: '100%', height: `${pct}%`, background: d.color ?? '#1A6FC4', borderRadius: '2px 2px 0 0', minHeight: 2, transition: 'height 0.3s' }} />
            <span style={{ fontSize: 9, color: '#888888', marginTop: 3, textAlign: 'center', lineHeight: 1.2 }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function HBar({ label, value, max, color = '#1A6FC4', suffix = '', note = '' }: {
  label: string; value: number; max: number; color?: string; suffix?: string; note?: string;
}) {
  const pct = (value / max) * 100;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#222222', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#111111', fontVariantNumeric: 'tabular-nums' }}>
          {value}{suffix}
          {note && <span style={{ fontSize: 10, color: '#AAAAAA', fontWeight: 400, marginLeft: 5 }}>{note}</span>}
        </span>
      </div>
      <div style={{ height: 7, background: '#EEEEEE', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

function Donut({ segments, size = 110, label = '', sub = '' }: {
  segments: { value: number; color: string; label: string }[];
  size?: number; label?: string; sub?: string;
}) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 10, ir = r * 0.62;
  let angle = -Math.PI / 2;
  const paths: React.ReactNode[] = [];
  segments.forEach((seg, i) => {
    const sweep = (seg.value / total) * Math.PI * 2;
    const end = angle + sweep;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end);
    const ix1 = cx + ir * Math.cos(angle), iy1 = cy + ir * Math.sin(angle);
    const ix2 = cx + ir * Math.cos(end),   iy2 = cy + ir * Math.sin(end);
    const large = sweep > Math.PI ? 1 : 0;
    paths.push(
      <path key={i}
        d={`M${x1},${y1} A${r},${r},0,${large},1,${x2},${y2} L${ix2},${iy2} A${ir},${ir},0,${large},0,${ix1},${iy1} Z`}
        fill={seg.color}
        stroke="#ffffff" strokeWidth={1.5}
      />
    );
    angle = end;
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={size} height={size}>{paths}</svg>
        {label && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111111', lineHeight: 1 }}>{label}</span>
            {sub && <span style={{ fontSize: 9, color: '#AAAAAA', marginTop: 2 }}>{sub}</span>}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#444444' }}>{s.label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#111111', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round((s.value / segments.reduce((a, b) => a + b.value, 0)) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, trend, color = '#1A6FC4', icon }: {
  label: string; value: string; sub?: string;
  trend?: 'up' | 'down' | 'flat'; color?: string; icon?: React.ReactNode;
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#059669' : trend === 'down' ? '#DC2626' : '#888888';
  return (
    <div style={{ ...CARD, borderTop: `3px solid ${color}`, flex: 1, minWidth: 140 }}>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: '#777777', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
          {icon && <span style={{ color, opacity: 0.7 }}>{icon}</span>}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#111111', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</div>
        {sub && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
            {trend && <TrendIcon size={11} color={trendColor} strokeWidth={2} />}
            <span style={{ fontSize: 11, color: '#888888' }}>{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ ...CARD, ...style }}>
      <div style={HEAD}>{title}</div>
      <div style={BODY}>{children}</div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview',    label: 'Overview',    icon: <BarChart3 size={13} strokeWidth={1.8} /> },
  { key: 'revenue',     label: 'Revenue',     icon: <TrendingUp size={13} strokeWidth={1.8} /> },
  { key: 'clients',     label: 'Clients',     icon: <Users size={13} strokeWidth={1.8} /> },
  { key: 'operations',  label: 'Operations',  icon: <Truck size={13} strokeWidth={1.8} /> },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('overview');

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [suppliers,    setSuppliers]    = useState<Supplier[]>([]);
  const [clientsCount, setClientsCount] = useState(0);

  useEffect(() => {
    fetch('/api/reservations').then(r => r.json())
      .then((d: { success: boolean; reservations?: Reservation[] }) => { if (d.success) setReservations(d.reservations ?? []); })
      .catch(() => {});
    fetch('/api/suppliers').then(r => r.json())
      .then((d: { success: boolean; suppliers?: Supplier[] }) => { if (d.success) setSuppliers(d.suppliers ?? []); })
      .catch(() => {});
    fetch('/api/clients').then(r => r.json())
      .then((d: { success: boolean; clients?: unknown[] }) => { if (d.success) setClientsCount((d.clients ?? []).length); })
      .catch(() => {});
  }, []);

  const kpi = useMemo(() => computeKPIs(reservations), [reservations]);
  const totalBookings = MONTHLY.reduce((s, m) => s + m.bookings, 0);
  const totalRevenue  = MONTHLY.reduce((s, m) => s + m.revenue, 0);
  const totalPaid     = MONTHLY.reduce((s, m) => s + m.paid, 0);
  const outstanding   = totalRevenue - totalPaid;
  const commissionEst = Math.round(totalRevenue * 0.11);
  const avgBookingVal = Math.round(totalRevenue / totalBookings);
  const natTotal      = NATIONALITIES.reduce((s, n) => s + n.count, 0);
  const vehTotal      = VEHICLES.reduce((s, v) => s + v.count, 0);

  return (
    <div style={{ minHeight: 'calc(100vh - 48px)', background: '#F0F0F0', display: 'flex', flexDirection: 'column' }}>

      {/* ── Page header ── */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #CCCCCC', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: '#111111', margin: 0, letterSpacing: '-0.01em' }}>Analytics & Insights</h1>
          <p style={{ fontSize: 11, color: '#888888', margin: '2px 0 0' }}>Year-to-date · January – December 2025 · All Stations</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['2023','2024','2025'] as const).map(y => (
            <button key={y} style={{
              padding: '3px 10px', fontSize: 11, borderRadius: 3, fontFamily: 'inherit', cursor: 'pointer',
              border: y === '2025' ? '1px solid #1A6FC4' : '1px solid #CCCCCC',
              background: y === '2025' ? '#1A6FC4' : '#F5F5F5',
              color: y === '2025' ? '#ffffff' : '#444444',
              fontWeight: y === '2025' ? 600 : 400,
            }}>{y}</button>
          ))}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ background: '#F8F8F8', borderBottom: '1px solid #CCCCCC', display: 'flex', padding: '0 20px', flexShrink: 0 }}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '0 16px', height: 36,
              border: 'none', borderBottom: active ? '2px solid #1A6FC4' : '2px solid transparent',
              background: 'transparent',
              color: active ? '#1A6FC4' : '#555555',
              fontSize: 12, fontWeight: active ? 700 : 400,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.1s',
            }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#222222'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#555555'; }}
            >
              {t.icon}{t.label}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 28px' }}>

        {/* ════════════════ OVERVIEW ════════════════ */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* KPI row */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <KpiCard label="Total Bookings"   value={String(totalBookings)} sub="+18% vs prior year" trend="up"   color="#1A6FC4" icon={<BarChart3 size={14} />} />
              <KpiCard label="Avg Booking Value" value={`£${avgBookingVal.toLocaleString()}`} sub="+7% vs prior year" trend="up" color="#065F46" />
              <KpiCard label="Conversion Rate"  value={`${kpi.conversionPct}%`} sub="Enquiry → Confirmed" trend="flat" color="#7C3AED" />
              <KpiCard label="Active Trips Now"  value={String(kpi.activeTrips)} sub="Currently on tour" color="#0E7490" />
              <KpiCard label="Cancellation Rate" value="6.2%"  sub="-1.4pp vs prior year" trend="down" color="#DC2626" />
            </div>

            {/* Booking trend + Status distribution */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <SectionCard title="Monthly Booking Volume — 2025" style={{ flex: 2, minWidth: 300 }}>
                <BarChart
                  data={MONTHLY.map(m => ({ label: m.m, value: m.bookings, color: '#1A6FC4' }))}
                  h={100}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: '#888888' }}>Peak: December ({MONTHLY.find(m => m.m === 'Dec')!.bookings} bookings)</span>
                  <span style={{ fontSize: 11, color: '#888888' }}>Slow: July ({MONTHLY.find(m => m.m === 'Jul')!.bookings} bookings)</span>
                </div>
              </SectionCard>

              <SectionCard title="Reservation Status Breakdown" style={{ flex: 1, minWidth: 220 }}>
                {[
                  { label: 'Confirmed',     count: 31, color: '#059669' },
                  { label: 'Trip Active',   count: 12, color: '#0891B2' },
                  { label: 'Completed',     count: 48, color: '#374151' },
                  { label: 'Under Review',  count: 18, color: '#D97706' },
                  { label: 'Enquiry',       count: 24, color: '#6B7280' },
                  { label: 'Cancelled',     count: 16, color: '#DC2626' },
                ].map(s => (
                  <HBar key={s.label} label={s.label} value={s.count} max={48} color={s.color} suffix=" bkgs" />
                ))}
              </SectionCard>
            </div>

            {/* Seasonal pattern + Revenue trend */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <SectionCard title="Seasonal Demand Pattern" style={{ flex: 3, minWidth: 300 }}>
                <div style={{ marginBottom: 8 }}>
                  <LineChart values={MONTHLY.map(m => m.bookings)} color="#1A6FC4" h={72} />
                </div>
                <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #EEEEEE', paddingTop: 8, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, textAlign: 'center', padding: '4px 0', borderRight: '1px solid #EEEEEE' }}>
                    <div style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>Peak Season</div>
                    <div style={{ fontSize: 10, color: '#777777', marginTop: 2 }}>Nov – Apr</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '4px 0', borderRight: '1px solid #EEEEEE' }}>
                    <div style={{ fontSize: 11, color: '#D97706', fontWeight: 700 }}>Shoulder</div>
                    <div style={{ fontSize: 10, color: '#777777', marginTop: 2 }}>May · Oct</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '4px 0' }}>
                    <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 700 }}>Off-Peak</div>
                    <div style={{ fontSize: 10, color: '#777777', marginTop: 2 }}>Jun – Sep</div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Travel Purpose Mix" style={{ flex: 2, minWidth: 240 }}>
                <Donut segments={TRAVEL_PURPOSE} label={`${totalBookings}`} sub="total" />
              </SectionCard>
            </div>
          </div>
        )}

        {/* ════════════════ REVENUE ════════════════ */}
        {tab === 'revenue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Revenue KPIs */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <KpiCard label="Total Revenue"    value={`£${(totalRevenue / 1000).toFixed(0)}k`}    sub="All currencies (GBP equiv.)" trend="up"   color="#1A6FC4" />
              <KpiCard label="Collected"        value={`£${(totalPaid / 1000).toFixed(0)}k`}      sub={`${Math.round(totalPaid / totalRevenue * 100)}% collection rate`} trend="up" color="#059669" />
              <KpiCard label="Outstanding"      value={`£${(outstanding / 1000).toFixed(0)}k`}    sub="Awaiting payment" trend="flat" color="#D97706" />
              <KpiCard label="Commission Earned" value={`£${(commissionEst / 1000).toFixed(0)}k`} sub="Avg 11% rate" color="#7C3AED" />
              <KpiCard label="Avg Booking Value" value={`£${avgBookingVal.toLocaleString()}`}     sub="+7% vs 2024" trend="up" color="#0E7490" />
            </div>

            {/* Revenue by service + Monthly revenue */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <SectionCard title="Revenue by Service Type" style={{ flex: 2, minWidth: 280 }}>
                <Donut
                  segments={SERVICE_REVENUE.map(s => ({ ...s, value: s.value }))}
                  label="100%"
                  sub="breakdown"
                  size={120}
                />
                <div style={{ marginTop: 14, borderTop: '1px solid #EEEEEE', paddingTop: 12 }}>
                  {SERVICE_REVENUE.map(s => (
                    <HBar key={s.label} label={s.label} value={s.value} max={55} color={s.color} suffix="%" />
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Monthly Revenue Trend" style={{ flex: 3, minWidth: 280 }}>
                <div style={{ marginBottom: 6 }}>
                  <LineChart values={MONTHLY.map(m => m.revenue)} color="#059669" h={80} />
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: '#F7F7F7' }}>
                        {['Month','Bookings','Revenue','Collected','%'].map(h => (
                          <th key={h} style={{ padding: '4px 8px', textAlign: h === 'Month' ? 'left' : 'right', color: '#888888', fontWeight: 600, borderBottom: '1px solid #EEEEEE' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MONTHLY.map(m => {
                        const pct = Math.round(m.paid / m.revenue * 100);
                        return (
                          <tr key={m.m} style={{ borderBottom: '1px solid #F4F4F4' }}>
                            <td style={{ padding: '4px 8px', fontWeight: 600, color: '#333333' }}>{m.m}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right', color: '#555555' }}>{m.bookings}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#111111' }}>£{m.revenue.toLocaleString()}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#059669' }}>£{m.paid.toLocaleString()}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 2, background: pct >= 90 ? '#D1FAE5' : pct >= 70 ? '#FEF3C7' : '#FEE2E2', color: pct >= 90 ? '#065F46' : pct >= 70 ? '#92400E' : '#991B1B' }}>{pct}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>

            {/* Payment status + Cancellation reasons */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <SectionCard title="Payment Status Distribution" style={{ flex: 1, minWidth: 240 }}>
                {[
                  { label: 'Fully Paid',  pct: 48, color: '#059669', count: 72 },
                  { label: 'Partial',     pct: 31, color: '#D97706', count: 47 },
                  { label: 'Pending',     pct: 15, color: '#6B7280', count: 22 },
                  { label: 'Overdue',     pct:  4, color: '#DC2626', count:  6 },
                  { label: 'Refunded',    pct:  2, color: '#7C3AED', count:  3 },
                ].map(s => (
                  <div key={s.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: '#333333' }}>{s.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111111', fontVariantNumeric: 'tabular-nums' }}>{s.count} <span style={{ color: '#AAAAAA', fontWeight: 400 }}>({s.pct}%)</span></span>
                    </div>
                    <div style={{ height: 7, background: '#EEEEEE', borderRadius: 4 }}>
                      <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </SectionCard>

              <SectionCard title="Cancellation & Modification Trends" style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1, textAlign: 'center', background: '#FEF2F2', borderRadius: 4, padding: '10px 8px' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#DC2626' }}>6.2%</div>
                    <div style={{ fontSize: 10, color: '#888888', marginTop: 3 }}>Cancellation Rate</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', background: '#FEF3C7', borderRadius: 4, padding: '10px 8px' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#92400E' }}>14</div>
                    <div style={{ fontSize: 10, color: '#888888', marginTop: 3 }}>Modifications</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#555555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cancellation Reasons</div>
                {CANCELLATION_REASONS.map(c => (
                  <HBar key={c.reason} label={c.reason} value={c.pct} max={40} color="#DC2626" suffix="%" note={`(${c.count})`} />
                ))}
              </SectionCard>
            </div>
          </div>
        )}

        {/* ════════════════ CLIENTS ════════════════ */}
        {tab === 'clients' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Client KPIs */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <KpiCard label="Total Clients"      value={String(clientsCount)} sub="+22 new this quarter" trend="up" color="#1A6FC4" icon={<Users size={14} />} />
              <KpiCard label="Repeat Clients"      value="34%"   sub="Booked 2+ trips" trend="up" color="#065F46" />
              <KpiCard label="VIP Clients"         value="18"    sub="Active VIP accounts" color="#C9A84C" />
              <KpiCard label="Avg Lifetime Value"  value="£6,840" sub="Per client, all trips" trend="up" color="#7C3AED" />
              <KpiCard label="NPS Score"           value="72"    sub="Q4 2025 survey" trend="up" color="#0E7490" />
            </div>

            {/* Nationality + Segmentation */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <SectionCard title="Source Markets — Traveller Nationality" style={{ flex: 2, minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                  <Globe size={12} color="#AAAAAA" />
                  <span style={{ fontSize: 11, color: '#888888' }}>{natTotal} international travellers · {NATIONALITIES.length} source countries</span>
                </div>
                {NATIONALITIES.map((n, i) => (
                  <HBar
                    key={n.country}
                    label={`${n.flag}  ${n.country}`}
                    value={n.count}
                    max={NATIONALITIES[0].count}
                    color={['#1A6FC4','#7C3AED','#065F46','#92400E','#9D174D','#0E7490','#1D4ED8','#6B7280'][i]}
                    note={`${Math.round(n.count / natTotal * 100)}%`}
                  />
                ))}
              </SectionCard>

              <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <SectionCard title="Client Segmentation">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Solo',       pct: 22, color: '#1A6FC4', bg: '#DBEAFE' },
                      { label: 'Couple',     pct: 38, color: '#9D174D', bg: '#FCE7F3' },
                      { label: 'Family',     pct: 19, color: '#065F46', bg: '#D1FAE5' },
                      { label: 'Group',      pct: 12, color: '#7C3AED', bg: '#EDE9FE' },
                      { label: 'Corporate',  pct:  9, color: '#92400E', bg: '#FEF3C7' },
                    ].map(s => (
                      <div key={s.label} style={{ background: s.bg, borderRadius: 4, padding: '10px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.pct}%</div>
                        <div style={{ fontSize: 10, color: s.color, marginTop: 2, fontWeight: 500 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Travel Purpose">
                  <Donut segments={TRAVEL_PURPOSE} size={100} />
                </SectionCard>
              </div>
            </div>

            {/* Booking value distribution + Top partners */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <SectionCard title="Booking Value Distribution" style={{ flex: 1, minWidth: 220 }}>
                <BarChart
                  data={[
                    { label: '< £2k',    value: 18, color: '#6B7280' },
                    { label: '£2–4k',    value: 34, color: '#1A6FC4' },
                    { label: '£4–7k',    value: 41, color: '#1A6FC4' },
                    { label: '£7–12k',   value: 28, color: '#7C3AED' },
                    { label: '£12–20k',  value: 16, color: '#9D174D' },
                    { label: '> £20k',   value:  9, color: '#C9A84C' },
                  ]}
                  h={90}
                />
                <p style={{ fontSize: 11, color: '#888888', marginTop: 8, textAlign: 'center' }}>Most bookings: £4,000–£7,000 range</p>
              </SectionCard>

              <SectionCard title="Top Agent Partners by Volume" style={{ flex: 2, minWidth: 280 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#F7F7F7' }}>
                      {['Partner','Country','Bookings','Revenue','Comm. Rate'].map(h => (
                        <th key={h} style={{ padding: '5px 8px', textAlign: h === 'Partner' || h === 'Country' ? 'left' : 'right', color: '#888888', fontWeight: 600, borderBottom: '1px solid #EEEEEE', fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Luxury Escapes UK',   country: '🇬🇧 UK',     bookings: 24, revenue: 178420, rate: '12%' },
                      { name: 'Horizon Travel Group', country: '🇨🇳 China',  bookings: 18, revenue: 124600, rate: '10%' },
                      { name: 'Voyages Lumière',      country: '🇫🇷 France', bookings:  9, revenue:  67350, rate: '11%' },
                      { name: 'Direct (Walk-in)',     country: '—',           bookings: 98, revenue: 584000, rate: '0%'  },
                    ].map(p => (
                      <tr key={p.name} style={{ borderBottom: '1px solid #F4F4F4' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: '#222222' }}>{p.name}</td>
                        <td style={{ padding: '6px 8px', color: '#555555' }}>{p.country}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#333333' }}>{p.bookings}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#059669' }}>£{p.revenue.toLocaleString()}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#7C3AED' }}>{p.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SectionCard>
            </div>
          </div>
        )}

        {/* ════════════════ OPERATIONS ════════════════ */}
        {tab === 'operations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Operations KPIs */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <KpiCard label="Total Pax Handled" value="1,842"  sub="+31% vs prior year" trend="up" color="#1A6FC4" />
              <KpiCard label="Avg Trip Duration"  value="8.4d"  sub="Nights on tour"     trend="up" color="#065F46" />
              <KpiCard label="Guide Utilisation"  value="74%"   sub="Of available days"  trend="up" color="#7C3AED" />
              <KpiCard label="Vehicle Deployments" value="325"  sub="Transfer trips"     color="#92400E" icon={<Truck size={14} />} />
              <KpiCard label="Supplier Rating"    value="4.72★" sub="Avg across network" trend="up" color="#C9A84C" />
            </div>

            {/* Destinations + Activities */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <SectionCard title="Most Visited Destinations" style={{ flex: 1, minWidth: 260 }}>
                {DESTINATIONS.map(d => (
                  <HBar key={d.name} label={d.name} value={d.visits} max={DESTINATIONS[0].visits} color={d.color} suffix=" visits" />
                ))}
              </SectionCard>

              <SectionCard title="Most Popular Activities" style={{ flex: 1, minWidth: 260 }}>
                {ACTIVITIES.map(a => (
                  <HBar key={a.name} label={a.name} value={a.bookings} max={ACTIVITIES[0].bookings} color={a.color} suffix=" bkgs" />
                ))}
              </SectionCard>
            </div>

            {/* Vehicle usage + Itineraries */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <SectionCard title="Transfer Vehicle Category Usage" style={{ flex: 1, minWidth: 240 }}>
                <Donut
                  segments={VEHICLES.map(v => ({ value: v.count, color: v.color, label: v.type }))}
                  label={`${vehTotal}`}
                  sub="trips"
                  size={110}
                />
                <div style={{ marginTop: 14, borderTop: '1px solid #EEEEEE', paddingTop: 10 }}>
                  {VEHICLES.map(v => (
                    <HBar key={v.type} label={v.type} value={v.count} max={vehTotal} color={v.color} suffix={` (${Math.round(v.count / vehTotal * 100)}%)`} />
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Most Frequently Booked Itineraries" style={{ flex: 2, minWidth: 280 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#F7F7F7' }}>
                      {['Itinerary Template','Nights','Bookings','Avg Value','Rating'].map(h => (
                        <th key={h} style={{ padding: '5px 8px', textAlign: h === 'Itinerary Template' ? 'left' : 'right', color: '#888888', fontWeight: 600, borderBottom: '1px solid #EEEEEE', fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Classic Sri Lanka Circuit',   nights: 10, bookings: 38, value: '£4,200', rating: '4.9' },
                      { name: 'South Coast Honeymoon',       nights:  8, bookings: 29, value: '£5,800', rating: '4.8' },
                      { name: 'Cultural Triangle Explorer',  nights:  7, bookings: 24, value: '£3,600', rating: '4.7' },
                      { name: 'Wildlife & Beach Combo',      nights: 12, bookings: 19, value: '£6,400', rating: '4.8' },
                      { name: 'Ella Hill Country Retreat',   nights:  5, bookings: 17, value: '£2,900', rating: '4.6' },
                      { name: 'Luxury Aman Properties Tour', nights: 10, bookings: 14, value: '£11,200', rating: '5.0' },
                    ].map(r => (
                      <tr key={r.name} style={{ borderBottom: '1px solid #F4F4F4' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: '#222222' }}>{r.name}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#555555' }}>{r.nights}n</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#1A6FC4', fontWeight: 700 }}>{r.bookings}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#333333' }}>{r.value}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#C9A84C', fontWeight: 700 }}>{r.rating}★</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SectionCard>
            </div>

            {/* Top suppliers */}
            <SectionCard title="Top-Performing Suppliers">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F7F7F7' }}>
                    {['Supplier','Type','Destinations','Bookings','Rating','Status'].map(h => (
                      <th key={h} style={{ padding: '5px 8px', textAlign: h === 'Supplier' || h === 'Type' || h === 'Destinations' ? 'left' : 'right', color: '#888888', fontWeight: 600, borderBottom: '1px solid #EEEEEE', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {suppliers.slice(0, 10).map(s => {
                    const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
                      hotel:      { color: '#1D4ED8', bg: '#DBEAFE' },
                      transport:  { color: '#6D28D9', bg: '#EDE9FE' },
                      activity:   { color: '#065F46', bg: '#D1FAE5' },
                      guide:      { color: '#92400E', bg: '#FEF3C7' },
                      restaurant: { color: '#9D174D', bg: '#FCE7F3' },
                    };
                    const tc = TYPE_COLORS[s.type] ?? { color: '#444', bg: '#F3F4F6' };
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid #F4F4F4' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: '#222222' }}>{s.name}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: tc.bg, color: tc.color, textTransform: 'capitalize' }}>{s.type}</span>
                        </td>
                        <td style={{ padding: '6px 8px', color: '#555555', fontSize: 11 }}>{s.destinations.slice(0, 2).join(', ')}{s.destinations.length > 2 ? ' +' + (s.destinations.length - 2) : ''}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#1A6FC4' }}>{s.total_bookings}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#C9A84C', fontWeight: 700 }}>{s.rating.toFixed(1)}★</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3, background: s.status === 'active' ? '#D1FAE5' : '#FEE2E2', color: s.status === 'active' ? '#065F46' : '#991B1B', textTransform: 'capitalize' }}>{s.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </SectionCard>
          </div>
        )}

      </div>
    </div>
  );
}
