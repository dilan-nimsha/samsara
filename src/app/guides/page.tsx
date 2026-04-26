'use client';

import { useState, useMemo } from 'react';
import { mockGuides, mockGuideAssignments } from '@/lib/mock-data';
import {
  RefreshCw, Plus, SlidersHorizontal,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronRight,
  ChevronLeft, LayoutList, CalendarDays, Star,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode  = 'list' | 'calendar';
type TabKey    = 'all' | 'available' | 'on_leave';
type SortField = 'name' | 'location' | 'rate' | 'rating';
type SortDir   = 'asc' | 'desc';

// ── Config ────────────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',       label: 'All Guides' },
  { key: 'available', label: 'Available' },
  { key: 'on_leave',  label: 'On Leave' },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const SPEC_CFG: Record<string, { color: string; bg: string }> = {
  'Wildlife':     { color: '#065F46', bg: '#D1FAE5' },
  'Cultural':     { color: '#1D4ED8', bg: '#DBEAFE' },
  'Heritage':     { color: '#6D28D9', bg: '#EDE9FE' },
  'Adventure':    { color: '#92400E', bg: '#FEF3C7' },
  'Nature':       { color: '#065F46', bg: '#D1FAE5' },
  'Trekking':     { color: '#92400E', bg: '#FEF3C7' },
  'Birdwatching': { color: '#065F46', bg: '#D1FAE5' },
  'Surfing':      { color: '#0E7490', bg: '#CFFAFE' },
  'Whale Watching':{ color: '#0E7490', bg: '#CFFAFE' },
  'Cuisine':      { color: '#9D174D', bg: '#FCE7F3' },
  'Culinary':     { color: '#9D174D', bg: '#FCE7F3' },
  'Wellness':     { color: '#7C3AED', bg: '#EDE9FE' },
  'Ayurveda':     { color: '#7C3AED', bg: '#EDE9FE' },
};

function specStyle(s: string) {
  return SPEC_CFG[s] ?? { color: '#555555', bg: '#F3F4F6' };
}

// ── Shared components ─────────────────────────────────────────────────────────

function Th({ children, sort, current, dir, onSort, center }: {
  children: React.ReactNode;
  sort?: SortField; current?: SortField; dir?: SortDir;
  onSort?: (f: SortField) => void;
  center?: boolean;
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

function TBtn({ icon, label, primary, active: isActive, onClick }: {
  icon?: React.ReactNode; label: string; primary?: boolean; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '3px 9px', borderRadius: 3, height: 26,
        border: primary ? '1px solid #111111' : '1px solid #BBBBBB',
        background: primary ? '#111111' : isActive ? '#DDDDDD' : '#EBEBEB',
        color: primary ? '#ffffff' : '#333333',
        fontSize: 12, fontWeight: primary ? 600 : 500,
        cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!primary) (e.currentTarget as HTMLElement).style.background = '#DEDEDE'; }}
      onMouseLeave={e => { if (!primary) (e.currentTarget as HTMLElement).style.background = isActive ? '#DDDDDD' : '#EBEBEB'; }}
    >
      {icon}{label}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 20, background: '#C0C0C0', margin: '0 4px' }} />;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <Star size={11} strokeWidth={0} fill="#F59E0B" />
      <span style={{ fontSize: 12, fontWeight: 600, color: '#111111' }}>{rating.toFixed(1)}</span>
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GuidesPage() {
  const [view,       setView]       = useState<ViewMode>('list');
  const [tab,        setTab]        = useState<TabKey>('all');
  const [filter,     setFilter]     = useState('');
  const [sort,       setSort]       = useState<SortField>('name');
  const [dir,        setDir]        = useState<SortDir>('asc');
  const [refreshing, setRefreshing] = useState(false);
  const [calYear,    setCalYear]    = useState(2026);
  const [calMonth,   setCalMonth]   = useState(4);

  function toggleSort(f: SortField) {
    if (sort === f) setDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(f); setDir('asc'); }
  }

  function tabCount(key: TabKey) {
    if (key === 'available') return mockGuides.filter(g => g.is_available).length;
    if (key === 'on_leave')  return mockGuides.filter(g => !g.is_available).length;
    return mockGuides.length;
  }

  const rows = useMemo(() => {
    let list = [...mockGuides];
    if (tab === 'available') list = list.filter(g => g.is_available);
    if (tab === 'on_leave')  list = list.filter(g => !g.is_available);
    if (filter.trim()) {
      const q = filter.toLowerCase();
      list = list.filter(g =>
        g.full_name.toLowerCase().includes(q) ||
        g.base_location.toLowerCase().includes(q) ||
        g.languages.some(l => l.toLowerCase().includes(q)) ||
        g.specializations.some(s => s.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      if (sort === 'name')     return dir === 'asc' ? a.full_name.localeCompare(b.full_name)         : b.full_name.localeCompare(a.full_name);
      if (sort === 'location') return dir === 'asc' ? a.base_location.localeCompare(b.base_location) : b.base_location.localeCompare(a.base_location);
      const av = sort === 'rate' ? a.daily_rate : a.rating;
      const bv = sort === 'rate' ? b.daily_rate : b.rating;
      return dir === 'asc' ? av - bv : bv - av;
    });
    return list;
  }, [tab, filter, sort, dir]);

  function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }

  // ── Calendar helpers ───────────────────────────────────────────────────────

  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const calDays     = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const today       = new Date();

  function getAssignment(guideId: string, day: number) {
    const date = new Date(calYear, calMonth - 1, day);
    return mockGuideAssignments.find(a => {
      if (a.guide_id !== guideId) return false;
      const from = new Date(a.date_from);
      const to   = new Date(a.date_to);
      return date >= from && date <= to;
    });
  }

  function prevMonth() {
    if (calMonth === 1) { setCalMonth(12); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 12) { setCalMonth(1); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  const calGuides = mockGuides; // show all guides in calendar (no tab filter)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', background: '#F0F0F0' }}>

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

        <Divider />

        {/* View toggle */}
        <TBtn
          icon={<LayoutList size={12} strokeWidth={2} />}
          label="List"
          active={view === 'list'}
          onClick={() => setView('list')}
        />
        <TBtn
          icon={<CalendarDays size={12} strokeWidth={2} />}
          label="Availability"
          active={view === 'calendar'}
          onClick={() => setView('calendar')}
        />

        <Divider />

        <div style={{ flex: 1 }} />

        {view === 'list' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            border: '1px solid #D5D5D5', borderRadius: 4,
            padding: '4px 8px', background: '#FAFAFA',
          }}>
            <SlidersHorizontal size={12} color="#AAAAAA" strokeWidth={2} />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter by name, language, specialization…"
              style={{
                background: 'none', border: 'none', outline: 'none',
                fontSize: 12, color: '#333333', width: 240, fontFamily: 'inherit',
              }}
            />
          </div>
        )}

        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 12px', borderRadius: 3, height: 26,
            background: '#111111', color: '#ffffff',
            fontSize: 12, fontWeight: 600, border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
        >
          <Plus size={12} strokeWidth={2.5} />
          Add Guide
        </button>
      </div>

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <>
          {/* Tab bar */}
          <div style={{
            background: '#ffffff', borderBottom: '1px solid #E5E5E5',
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
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#333333'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.02)'; } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#777777'; (e.currentTarget as HTMLElement).style.background = 'none'; } }}
                >
                  {label}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                    background: active ? '#111111' : '#EBEBEB',
                    color: active ? '#ffffff' : '#777777',
                  }}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', fontSize: 12, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 36 }} />
                <col style={{ width: 190 }} />
                <col style={{ width: 160 }} />
                <col style={{ width: 230 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 90 }} />
                <col style={{ width: 36 }} />
              </colgroup>
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ padding: '6px 10px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>#</th>
                  <Th sort="name" current={sort} dir={dir} onSort={toggleSort}>Name</Th>
                  <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Languages</th>
                  <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Specializations</th>
                  <Th sort="location" current={sort} dir={dir} onSort={toggleSort}>Base</Th>
                  <Th sort="rate" current={sort} dir={dir} onSort={toggleSort} center>Daily Rate</Th>
                  <Th sort="rating" current={sort} dir={dir} onSort={toggleSort} center>Rating</Th>
                  <th style={{ padding: '6px 10px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Status</th>
                  <th style={{ padding: '6px 10px', background: '#F5F5F5', borderBottom: '1px solid #E5E5E5' }} />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#AAAAAA', fontSize: 13 }}>
                      No guides match your filters.
                    </td>
                  </tr>
                )}
                {rows.map((g, i) => (
                  <tr
                    key={g.id}
                    style={{ borderBottom: '1px solid #F0F0F0', cursor: 'pointer', transition: 'background 0.08s' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F7F9FF')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#CCCCCC', fontSize: 11 }}>{i + 1}</td>

                    <td style={{ padding: '8px 10px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.full_name}
                      </p>
                      <p style={{ fontSize: 11, color: '#AAAAAA', marginTop: 1 }}>{g.base_location}</p>
                    </td>

                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {g.languages.map(l => (
                          <span key={l} style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3, background: '#F3F4F6', color: '#374151' }}>
                            {l}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {g.specializations.slice(0, 3).map(s => {
                          const cfg = specStyle(s);
                          return (
                            <span key={s} style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3, background: cfg.bg, color: cfg.color }}>
                              {s}
                            </span>
                          );
                        })}
                        {g.specializations.length > 3 && (
                          <span style={{ fontSize: 10, color: '#AAAAAA', padding: '2px 4px' }}>+{g.specializations.length - 3}</span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '8px 10px', fontSize: 12, color: '#555555' }}>{g.base_location}</td>

                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#111111' }}>
                        {g.currency === 'USD' ? '$' : g.currency === 'GBP' ? '£' : '€'}{g.daily_rate}
                      </span>
                      <span style={{ fontSize: 10, color: '#AAAAAA' }}>/day</span>
                    </td>

                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <RatingStars rating={g.rating} />
                    </td>

                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      {g.is_available ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: '#D1FAE5', color: '#065F46' }}>Available</span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: '#FEE2E2', color: '#991B1B' }}>On Leave</span>
                      )}
                    </td>

                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <ChevronRight size={13} color="#CCCCCC" strokeWidth={2} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {rows.length > 0 && (
              <div style={{
                background: '#F9F9F9', borderTop: '1px solid #EEEEEE',
                padding: '6px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 11, color: '#AAAAAA' }}>
                  {rows.length} of {mockGuides.length} guides
                </span>
                <span style={{ fontSize: 11, color: '#AAAAAA' }}>
                  {rows.filter(g => g.is_available).length} available · {rows.filter(g => !g.is_available).length} on leave
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── CALENDAR VIEW ── */}
      {view === 'calendar' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Month navigator */}
          <div style={{
            background: '#ffffff', borderBottom: '1px solid #E5E5E5',
            padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          }}>
            <button
              onClick={prevMonth}
              style={{ background: 'none', border: '1px solid #E0E0E0', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F5F5F5')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
            >
              <ChevronLeft size={14} strokeWidth={2} color="#555555" />
            </button>

            <span style={{ fontSize: 13, fontWeight: 600, color: '#111111', minWidth: 140, textAlign: 'center' }}>
              {MONTH_NAMES[calMonth - 1]} {calYear}
            </span>

            <button
              onClick={nextMonth}
              style={{ background: 'none', border: '1px solid #E0E0E0', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F5F5F5')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
            >
              <ChevronLeft size={14} strokeWidth={2} color="#555555" style={{ transform: 'rotate(180deg)' }} />
            </button>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#777777' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: '#DBEAFE', display: 'inline-block' }} />
                Confirmed
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: '#FEF3C7', display: 'inline-block' }} />
                Pending
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: '#F3F4F6', border: '1px dashed #D1D5DB', display: 'inline-block' }} />
                On Leave
              </span>
            </div>
          </div>

          {/* Grid */}
          <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', background: '#ffffff', fontSize: 11 }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  {/* Guide name column header */}
                  <th style={{
                    padding: '6px 12px', textAlign: 'left',
                    fontSize: 11, fontWeight: 600, color: '#888888',
                    borderBottom: '1px solid #E5E5E5', borderRight: '1px solid #E5E5E5',
                    background: '#F5F5F5', whiteSpace: 'nowrap', minWidth: 168,
                    position: 'sticky', left: 0, zIndex: 20,
                  }}>
                    Guide
                  </th>
                  {/* Day columns */}
                  {calDays.map(day => {
                    const d = new Date(calYear, calMonth - 1, day);
                    const isToday = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
                    const dow = d.getDay();
                    const isWeekend = dow === 0 || dow === 6;
                    return (
                      <th
                        key={day}
                        style={{
                          padding: '5px 0', textAlign: 'center', width: 30, minWidth: 30,
                          fontSize: 10, fontWeight: isToday ? 700 : 600,
                          color: isToday ? '#1A6FC4' : isWeekend ? '#AAAAAA' : '#888888',
                          borderBottom: `2px solid ${isToday ? '#1A6FC4' : '#E5E5E5'}`,
                          background: isToday ? '#EFF6FF' : '#F5F5F5',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div>{day}</div>
                        <div style={{ fontSize: 9, fontWeight: 400, color: isToday ? '#1A6FC4' : '#BBBBBB' }}>
                          {['Su','Mo','Tu','We','Th','Fr','Sa'][dow]}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {calGuides.map((g, gi) => (
                  <tr key={g.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                    {/* Guide name — sticky left */}
                    <td style={{
                      padding: '0 12px', height: 40, whiteSpace: 'nowrap',
                      borderRight: '1px solid #E5E5E5',
                      background: gi % 2 === 0 ? '#FAFAFA' : '#ffffff',
                      position: 'sticky', left: 0, zIndex: 5,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: g.is_available ? '#D1FAE5' : '#F3F4F6',
                          color: g.is_available ? '#065F46' : '#9CA3AF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, flexShrink: 0,
                        }}>
                          {g.full_name.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#111111' }}>{g.full_name}</p>
                          <p style={{ fontSize: 10, color: '#AAAAAA' }}>{g.languages.slice(0,2).join(' · ')}</p>
                        </div>
                      </div>
                    </td>

                    {/* Day cells */}
                    {calDays.map(day => {
                      const assignment = getAssignment(g.id, day);
                      const isOnLeave  = !g.is_available;
                      const d = new Date(calYear, calMonth - 1, day);
                      const isToday = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();

                      let bg = gi % 2 === 0 ? '#FAFAFA' : '#ffffff';
                      let title = `${g.full_name} — ${day} ${MONTH_NAMES[calMonth-1]}: Available`;

                      if (isOnLeave) {
                        bg = '#F3F4F6';
                        title = `${g.full_name} — On Leave`;
                      } else if (assignment) {
                        bg = assignment.confirmed ? '#DBEAFE' : '#FEF3C7';
                        title = `${g.full_name} — ${assignment.confirmed ? 'Confirmed' : 'Pending'} · Ref: ${assignment.reservation_id.toUpperCase()} · $${assignment.fee_agreed} fee`;
                      }

                      if (isToday) bg = assignment ? bg : (gi % 2 === 0 ? '#EFF6FF' : '#EFF6FF');

                      return (
                        <td
                          key={day}
                          title={title}
                          style={{
                            width: 30, minWidth: 30, height: 40,
                            background: bg,
                            borderRight: '1px solid #F0F0F0',
                            borderLeft: isToday ? '1px solid #BFDBFE' : undefined,
                            cursor: 'default',
                            transition: 'background 0.08s',
                          }}
                          onMouseEnter={e => {
                            if (!isOnLeave && !assignment) (e.currentTarget as HTMLElement).style.background = '#E0E7FF';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = bg;
                          }}
                        >
                          {isOnLeave && (
                            <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 6px)' }} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calendar legend / footer */}
          <div style={{
            background: '#F9F9F9', borderTop: '1px solid #EEEEEE',
            padding: '6px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: '#AAAAAA' }}>
              {calGuides.length} guides · {mockGuideAssignments.filter(a => {
                const from = new Date(a.date_from);
                const to   = new Date(a.date_to);
                const monthStart = new Date(calYear, calMonth - 1, 1);
                const monthEnd   = new Date(calYear, calMonth, 0);
                return from <= monthEnd && to >= monthStart;
              }).length} assignments this month
            </span>
            <span style={{ fontSize: 11, color: '#AAAAAA' }}>
              Hover a cell to see assignment details
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
