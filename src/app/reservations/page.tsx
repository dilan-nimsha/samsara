'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { mockReservations } from '@/lib/mock-data';
import { formatCurrency, formatDate, STATUS_CONFIG, PAYMENT_CONFIG, tripDuration } from '@/lib/utils';
import type { ReservationStatus } from '@/types';
import {
  RefreshCw, Printer, Download,
  ArrowUpDown, ArrowUp, ArrowDown, Plus, SlidersHorizontal,
  ChevronLeft, ChevronRight, Calendar, X, MapPin, ChevronDown,
  Settings, Trash2, Check, Lock,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/session';

const DEFAULT_STATIONS = ['Sri Lanka', 'Maldives', 'India'];
const LS_KEY = 'samsara_stations';

function loadStations(): string[] {
  if (typeof window === 'undefined') return DEFAULT_STATIONS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_STATIONS;
  } catch { return DEFAULT_STATIONS; }
}

function saveStations(list: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

// ── Date helpers ───────────────────────────────────────────────────────────────

const DAYS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function fmtLabel(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Tab config ─────────────────────────────────────────────────────────────────

type TabKey = 'all' | ReservationStatus | 'overdue' | 'bookings';

// Statuses that constitute a confirmed booking (past enquiry / review stage)
const BOOKING_STATUSES: ReservationStatus[] = [
  'confirmed', 'invoice_sent', 'paid', 'trip_active', 'completed',
];

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',            label: 'Overview' },
  { key: 'enquiry',        label: 'Enquiries' },
  { key: 'under_review',   label: 'Under Review' },
  { key: 'confirmed',      label: 'Confirmed' },
  { key: 'invoice_sent',   label: 'Invoiced' },
  { key: 'paid',           label: 'Paid' },
  { key: 'trip_active',    label: 'Active' },
  { key: 'completed',      label: 'Completed' },
  { key: 'cancelled',      label: 'Cancelled' },
  { key: 'overdue',        label: 'Overdue' },
  { key: 'bookings',       label: 'All Bookings' },
];

type SortField = 'reference' | 'client' | 'arrival_date' | 'total_cost' | 'status';
type SortDir   = 'asc' | 'desc';


// ── Page ───────────────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const currentUser = getCurrentUser();
  const isAdmin     = currentUser.role === 'admin';

  const [tab,         setTab]         = useState<TabKey>('all');
  const [filter,      setFilter]      = useState('');
  const [sort,        setSort]        = useState<SortField>('arrival_date');
  const [dir,         setDir]         = useState<SortDir>('asc');
  const [pendingOnly, setPendingOnly] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date>(() => startOfDay(new Date()));
  // Non-admin users are locked to their assigned station
  const [location,    setLocation]    = useState(() => currentUser.station ?? 'All Stations');
  const [locOpen,     setLocOpen]     = useState(false);
  const [managing,    setManaging]    = useState(false);
  const [stations,    setStations]    = useState<string[]>(loadStations);
  const [newStation,  setNewStation]  = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const printRef      = useRef<HTMLDivElement>(null);
  const locRef        = useRef<HTMLDivElement>(null);
  const newStationRef = useRef<HTMLInputElement>(null);


  // Refresh — simulates data reload with spinner
  function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }

  // Export — builds CSV from current filtered rows and triggers download
  function exportCSV() {
    const headers = ['Ref #','Status','Client','Nationality','Destinations','Arrival','Departure','Nights','Pax','Payment','Value','Currency','Agent'];
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csvRows = [
      headers.join(','),
      ...rows.map(r => [
        r.reference,
        STATUS_CONFIG[r.status].label,
        r.client?.full_name ?? '',
        r.client?.nationality ?? '',
        r.destinations.join(' | '),
        r.arrival_date,
        r.departure_date,
        tripDuration(r.arrival_date, r.departure_date),
        r.num_adults + r.num_children + r.num_infants,
        PAYMENT_CONFIG[r.payment_status].label,
        r.total_cost,
        r.currency,
        r.assigned_staff ?? '',
      ].map(esc).join(',')),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `samsara-reservations-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Print — opens a clean print window containing only the currently filtered rows
  function handlePrint() {
    const dateLabel = fmtLabel(bookingDate);
    const tabLabel  = TABS.find(t => t.key === tab)?.label ?? tab;

    const tableRows = rows.map((r, i) => {
      const status  = STATUS_CONFIG[r.status];
      const payment = PAYMENT_CONFIG[r.payment_status];
      const nights  = tripDuration(r.arrival_date, r.departure_date);
      return `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${r.reference}</strong>${r.partner_reference ? `<br/><small>${r.partner_reference}</small>` : ''}</td>
          <td style="color:${status.color}">${status.label}</td>
          <td>${r.client?.full_name ?? '—'}${r.partner ? `<br/><small>via ${r.partner.company_name}</small>` : ''}</td>
          <td>${r.client?.nationality ?? '—'}</td>
          <td>${r.destinations.join(' · ')}</td>
          <td>${formatDate(r.arrival_date)}</td>
          <td>${formatDate(r.departure_date)}</td>
          <td style="text-align:center">${nights}</td>
          <td style="text-align:center">${r.num_adults + r.num_children}</td>
          <td style="color:${payment.color}">${payment.label}</td>
          <td>${r.total_cost > 0 ? formatCurrency(r.total_cost, r.currency) : '—'}</td>
          <td>${r.assigned_staff ?? '—'}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Samsara — Reservations</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', Arial, sans-serif; font-size: 11px; color: #111; padding: 24px 28px; }
    h1 { font-size: 16px; font-weight: 700; margin-bottom: 2px; }
    .meta { font-size: 11px; color: #777; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 700;
         letter-spacing: 0.05em; text-transform: uppercase; color: #888;
         border-bottom: 1.5px solid #333; white-space: nowrap; }
    td { padding: 7px 8px; border-bottom: 1px solid #E8E8E8; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    small { color: #999; font-size: 10px; }
    .footer { margin-top: 18px; font-size: 10px; color: #AAAAAA; border-top: 1px solid #E8E8E8; padding-top: 8px; display: flex; justify-content: space-between; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Samsara RMS — Reservations</h1>
  <p class="meta">${tabLabel} · ${dateLabel} · ${rows.length} reservation${rows.length !== 1 ? 's' : ''}</p>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Ref #</th><th>Status</th><th>Client</th>
        <th>Nationality</th><th>Destinations</th><th>Arrival</th>
        <th>Departure</th><th>Nights</th><th>Pax</th>
        <th>Payment</th><th>Value</th><th>Agent</th>
      </tr>
    </thead>
    <tbody>${tableRows.length ? tableRows : '<tr><td colspan="13" style="text-align:center;padding:24px;color:#AAAAAA">No reservations for this date.</td></tr>'}</tbody>
  </table>
  <div class="footer">
    <span>Samsara RMS</span>
    <span>Printed ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
  </div>
  <script>window.onload = () => { window.print(); };<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }

  useEffect(() => {
    if (!locOpen) { setManaging(false); setNewStation(''); return; }
    const handler = (e: MouseEvent) => {
      if (locRef.current && !locRef.current.contains(e.target as Node)) setLocOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [locOpen]);

  function addStation() {
    const name = newStation.trim();
    if (!name || stations.includes(name)) return;
    const updated = [...stations, name];
    setStations(updated);
    saveStations(updated);
    setNewStation('');
    newStationRef.current?.focus();
  }

  function removeStation(name: string) {
    const updated = stations.filter(s => s !== name);
    setStations(updated);
    saveStations(updated);
    if (location === name) setLocation('All Stations');
  }

  function toggleSort(field: SortField) {
    if (sort === field) setDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(field); setDir('asc'); }
  }

  const tabCount = (key: TabKey) => {
    if (key === 'all')      return mockReservations.length;
    if (key === 'overdue')  return mockReservations.filter(r => r.payment_status === 'overdue').length;
    if (key === 'bookings') return mockReservations.filter(r => BOOKING_STATUSES.includes(r.status)).length;
    return mockReservations.filter(r => r.status === key).length;
  };

  const rows = useMemo(() => {
    let list = [...mockReservations];

    // Tab filter
    if (tab === 'overdue')       list = list.filter(r => r.payment_status === 'overdue');
    else if (tab === 'bookings') list = list.filter(r => BOOKING_STATUSES.includes(r.status));
    else if (tab !== 'all')      list = list.filter(r => r.status === tab);

    // Date filter — not applied on All Bookings (shows everything)
    if (tab !== 'bookings') {
      const ymd = toYMD(bookingDate);
      list = list.filter(r => r.arrival_date === ymd);
    }

    // Pending only
    if (pendingOnly) list = list.filter(r =>
      r.payment_status === 'pending' || r.payment_status === 'partial'
    );

    // Location filter — staff are always restricted to their assigned station
    const effectiveStation = !isAdmin && currentUser.station ? currentUser.station : location;
    if (effectiveStation !== 'All Stations') {
      list = list.filter(r => r.destinations.some(d => d === effectiveStation));
    }

    // Text filter
    if (filter.trim()) {
      const q = filter.toLowerCase();
      list = list.filter(r =>
        r.reference.toLowerCase().includes(q) ||
        r.client?.full_name.toLowerCase().includes(q) ||
        r.destinations.some(d => d.toLowerCase().includes(q)) ||
        r.client?.nationality?.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      if (sort === 'reference')    { va = a.reference;               vb = b.reference; }
      if (sort === 'client')       { va = a.client?.full_name ?? '';  vb = b.client?.full_name ?? ''; }
      if (sort === 'arrival_date') { va = a.arrival_date;             vb = b.arrival_date; }
      if (sort === 'total_cost')   { va = a.total_cost;               vb = b.total_cost; }
      if (sort === 'status')       { va = a.status;                   vb = b.status; }
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ?  1 : -1;
      return 0;
    });

    return list;
  }, [tab, filter, pendingOnly, sort, dir, bookingDate, location, stations, isAdmin, currentUser.station]);

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', background: '#F7F7F7' }}>

      {/* ── Toolbar ── */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #E5E5E5',
        padding: '0 16px',
        display: 'flex', alignItems: 'center', gap: 6,
        height: 44, flexShrink: 0, position: 'relative', zIndex: 50,
      }}>
        {/* Refresh */}
        <ToolBtn
          icon={<RefreshCw size={13} strokeWidth={2} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />}
          label={refreshing ? 'Refreshing…' : 'Refresh'}
          onClick={handleRefresh}
        />

        {/* Print */}
        <ToolBtn
          icon={<Printer size={13} strokeWidth={2} />}
          label="Print"
          onClick={handlePrint}
        />

        {/* Export CSV */}
        <ToolBtn icon={<Download size={13} strokeWidth={2} />} label="Export" primary onClick={exportCSV} />

        <DatePicker value={bookingDate} onChange={setBookingDate} />

        {/* Location selector */}
        <div ref={locRef} style={{ position: 'relative' }}>
          <button
            onClick={() => isAdmin && setLocOpen(o => !o)}
            title={!isAdmin ? `Restricted to ${currentUser.station}` : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 8px', borderRadius: 4,
              border: `1px solid ${location !== 'All Stations' ? '#111111' : '#D5D5D5'}`,
              background: location !== 'All Stations' ? '#111111' : '#FAFAFA',
              color: location !== 'All Stations' ? '#ffffff' : '#333333',
              fontSize: 12, cursor: isAdmin ? 'pointer' : 'default',
              fontFamily: 'inherit', height: 28, whiteSpace: 'nowrap',
              transition: 'all 0.12s',
              opacity: isAdmin ? 1 : 0.85,
            }}
          >
            {isAdmin
              ? <MapPin size={12} strokeWidth={2} />
              : <Lock size={11} strokeWidth={2} />
            }
            {location === 'All Stations' ? 'Station' : location}
            {isAdmin && location !== 'All Stations' && (
              <span
                onClick={e => { e.stopPropagation(); setLocation('All Stations'); setLocOpen(false); }}
                style={{ marginLeft: 2, opacity: 0.7, lineHeight: 1, display: 'flex' }}
              >
                <X size={11} strokeWidth={2.5} />
              </span>
            )}
            {isAdmin && location === 'All Stations' && (
              <ChevronDown size={11} strokeWidth={2} color="#888888" />
            )}
          </button>

          {locOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0,
              background: '#ffffff', border: '1px solid #E0E0E0',
              borderRadius: 6, boxShadow: '0 6px 20px rgba(0,0,0,0.10)',
              zIndex: 200, minWidth: 180, overflow: 'hidden',
            }}>

              {/* Station list */}
              <div style={{ padding: '4px 0' }}>
                {/* All Stations */}
                {(() => {
                  const active = location === 'All Stations';
                  return (
                    <button
                      onClick={() => { setLocation('All Stations'); setLocOpen(false); }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '6px 12px',
                        border: 'none', background: active ? '#F5F5F5' : 'none',
                        color: active ? '#111111' : '#777777',
                        fontSize: 12, fontWeight: active ? 600 : 400,
                        cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F8F8F8'; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'none'; }}
                    >
                      All Stations
                      {active && <Check size={11} strokeWidth={2.5} style={{ marginLeft: 'auto' }} />}
                    </button>
                  );
                })()}

                {stations.length > 0 && <div style={{ height: 1, background: '#F0F0F0', margin: '2px 0' }} />}

                {stations.map(name => {
                  const active = location === name;
                  return (
                    <div
                      key={name}
                      style={{
                        display: 'flex', alignItems: 'center',
                        background: active ? '#F5F5F5' : 'none',
                        transition: 'background 0.08s',
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F8F8F8'; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'none'; }}
                    >
                      <button
                        onClick={() => { setLocation(name); setLocOpen(false); }}
                        style={{
                          flex: 1, textAlign: 'left', padding: '6px 12px',
                          border: 'none', background: 'none',
                          color: active ? '#111111' : '#333333',
                          fontSize: 12, fontWeight: active ? 600 : 400,
                          cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <MapPin size={10} strokeWidth={2} color={active ? '#111111' : '#BBBBBB'} />
                        {name}
                        {active && <Check size={11} strokeWidth={2.5} style={{ marginLeft: 'auto' }} />}
                      </button>
                      {managing && (
                        <button
                          onClick={() => removeStation(name)}
                          title="Remove station"
                          style={{
                            padding: '4px 8px', border: 'none', background: 'none',
                            cursor: 'pointer', color: '#CCCCCC', display: 'flex', flexShrink: 0,
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#DC2626'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#CCCCCC'}
                        >
                          <Trash2 size={11} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  );
                })}

                {stations.length === 0 && (
                  <p style={{ padding: '8px 12px', fontSize: 11, color: '#CCCCCC', fontStyle: 'italic' }}>
                    No stations defined.
                  </p>
                )}
              </div>

              {/* Admin footer */}
              <div style={{ borderTop: '1px solid #F0F0F0', background: '#FAFAFA' }}>
                {managing ? (
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
                      <input
                        ref={newStationRef}
                        value={newStation}
                        onChange={e => setNewStation(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addStation(); if (e.key === 'Escape') setManaging(false); }}
                        placeholder="New station name…"
                        autoFocus
                        style={{
                          flex: 1, fontSize: 12, padding: '4px 7px',
                          border: '1px solid #D5D5D5', borderRadius: 3,
                          outline: 'none', fontFamily: 'inherit',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#111111')}
                        onBlur={e  => (e.currentTarget.style.borderColor = '#D5D5D5')}
                      />
                      <button
                        onClick={addStation}
                        disabled={!newStation.trim()}
                        style={{
                          padding: '4px 10px', border: 'none', borderRadius: 3,
                          background: newStation.trim() ? '#111111' : '#E5E5E5',
                          color: '#ffffff', fontSize: 12, fontWeight: 600,
                          cursor: newStation.trim() ? 'pointer' : 'default',
                          fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        <Plus size={11} strokeWidth={2.5} />
                        Add
                      </button>
                    </div>
                    <button
                      onClick={() => setManaging(false)}
                      style={{
                        width: '100%', padding: '4px 0', border: '1px solid #E5E5E5',
                        borderRadius: 3, background: 'none', fontSize: 11,
                        color: '#888888', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setManaging(true)}
                    style={{
                      width: '100%', padding: '7px 12px', border: 'none',
                      background: 'none', fontSize: 11, color: '#888888',
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 5,
                      transition: 'background 0.08s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F0F0F0'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                  >
                    <Settings size={11} strokeWidth={2} />
                    Manage Stations
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* Agent */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          border: '1px solid #D5D5D5', borderRadius: 4,
          padding: '4px 8px', background: '#FAFAFA',
        }}>
          <span style={{ fontSize: 12, color: '#555555' }}>Agent:</span>
          <select style={{
            background: 'none', border: 'none', outline: 'none',
            fontSize: 12, color: '#333333', cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            <option>All Agents</option>
            <option>Nimsha</option>
          </select>
        </div>

        <Divider />

        {/* Pending only */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, color: '#555555' }}>
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={e => setPendingOnly(e.target.checked)}
            style={{ cursor: 'pointer', accentColor: '#111111' }}
          />
          Pending only
        </label>

        <div style={{ flex: 1 }} />

        {/* Text filter */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          border: '1px solid #D5D5D5', borderRadius: 4,
          padding: '4px 8px', background: '#FAFAFA',
        }}>
          <SlidersHorizontal size={12} color="#AAAAAA" strokeWidth={2} />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter..."
            style={{
              background: 'none', border: 'none', outline: 'none',
              fontSize: 12, color: '#333333', width: 160,
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* New Reservation */}
        <Link
          href="/reservations/new"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 4,
            background: '#111111', color: '#ffffff',
            fontSize: 12, fontWeight: 600,
            textDecoration: 'none', flexShrink: 0,
            transition: 'opacity 0.12s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
        >
          <Plus size={12} strokeWidth={2.5} />
          New Reservation
        </Link>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #E5E5E5',
        display: 'flex', alignItems: 'stretch',
        padding: '0 16px',
        overflowX: 'auto', flexShrink: 0,
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
                padding: '0 14px', height: 38,
                border: 'none',
                borderBottom: active ? '2px solid #111111' : '2px solid transparent',
                background: active ? 'rgba(0,0,0,0.03)' : 'none',
                color: active ? '#111111' : '#777777',
                fontSize: 12, fontWeight: active ? 600 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: 'inherit',
                transition: 'color 0.12s, background 0.12s',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = '#333333';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.02)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = '#777777';
                  (e.currentTarget as HTMLElement).style.background = 'none';
                }
              }}
            >
              {label}
              {count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 10,
                  background: active ? '#111111' : '#EBEBEB',
                  color: active ? '#ffffff' : '#777777',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{
          width: '100%', borderCollapse: 'collapse',
          background: '#ffffff', fontSize: 12,
          tableLayout: 'fixed',
        }}>
          <colgroup>
            <col style={{ width: 36 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 155 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 180 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 52 }} />
            <col style={{ width: 44 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 96 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 36 }} />
          </colgroup>

          <thead>
            <tr style={{ background: '#F5F5F5', borderBottom: '1px solid #E5E5E5', position: 'sticky', top: 0, zIndex: 10 }}>
              <Th center>#</Th>
              <Th sort="reference"    current={sort} dir={dir} onSort={toggleSort}>Ref #</Th>
              <Th sort="status"       current={sort} dir={dir} onSort={toggleSort}>Status</Th>
              <Th sort="client"       current={sort} dir={dir} onSort={toggleSort}>Client</Th>
              <Th>Nationality</Th>
              <Th>Destinations</Th>
              <Th sort="arrival_date" current={sort} dir={dir} onSort={toggleSort}>Arrival</Th>
              <Th>Departure</Th>
              <Th center>Nights</Th>
              <Th center>Pax</Th>
              <Th>Payment</Th>
              <Th sort="total_cost"   current={sort} dir={dir} onSort={toggleSort}>Value</Th>
              <Th>Agent</Th>
              <Th>{''}</Th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={14} style={{ padding: '48px', textAlign: 'center', color: '#BBBBBB', fontSize: 13 }}>
                  No reservations match your filters.
                </td>
              </tr>
            )}

            {rows.map((r, i) => {
              const status  = STATUS_CONFIG[r.status];
              const payment = PAYMENT_CONFIG[r.payment_status];
              const nights  = tripDuration(r.arrival_date, r.departure_date);
              return (
                <tr
                  key={r.id}
                  style={{ borderBottom: '1px solid #F0F0F0', transition: 'background 0.08s', cursor: 'pointer' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#FAFAFA')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  onClick={() => window.location.href = `/reservations/${r.id}`}
                >
                  <td style={{ padding: '9px 0', textAlign: 'center', color: '#BBBBBB', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                    {i + 1}
                  </td>
                  <td style={{ padding: '9px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#111111', fontFamily: 'monospace' }}>
                        {r.reference}
                      </span>
                    </div>
                    {r.partner_reference && (
                      <p style={{ fontSize: 10, color: '#AAAAAA', margin: '2px 0 0', fontFamily: 'monospace' }}>
                        {r.partner_reference}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '9px 8px' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: status.color, whiteSpace: 'nowrap' }}>
                      {status.label}
                    </span>
                  </td>
                  <td style={{ padding: '9px 8px' }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#111111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.client?.full_name}
                    </p>
                    {r.partner && (
                      <p style={{ fontSize: 10, color: '#AAAAAA', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        via {r.partner.company_name}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '9px 8px', color: '#777777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.client?.nationality ?? '—'}
                  </td>
                  <td style={{ padding: '9px 8px', color: '#555555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.destinations.join(' · ')}
                  </td>
                  <td style={{ padding: '9px 8px', color: '#333333', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {formatDate(r.arrival_date)}
                  </td>
                  <td style={{ padding: '9px 8px', color: '#555555', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {formatDate(r.departure_date)}
                  </td>
                  <td style={{ padding: '9px 4px', textAlign: 'center', color: '#555555', fontVariantNumeric: 'tabular-nums' }}>
                    {nights}
                  </td>
                  <td style={{ padding: '9px 4px', textAlign: 'center', color: '#555555', fontVariantNumeric: 'tabular-nums' }}>
                    {r.num_adults + r.num_children}
                  </td>
                  <td style={{ padding: '9px 8px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: payment.color }}>
                      {payment.label}
                    </span>
                    {r.payment_status === 'partial' && r.total_cost > 0 && (
                      <p style={{ fontSize: 10, color: '#AAAAAA', margin: '2px 0 0', fontVariantNumeric: 'tabular-nums' }}>
                        {Math.round((r.total_paid / r.total_cost) * 100)}% paid
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '9px 8px', fontWeight: 600, color: '#111111', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {r.total_cost > 0 ? formatCurrency(r.total_cost, r.currency) : <span style={{ color: '#CCCCCC' }}>—</span>}
                  </td>
                  <td style={{ padding: '9px 8px', color: '#777777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.assigned_staff ?? '—'}
                  </td>
                  <td style={{ padding: '9px 4px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    <Link
                      href={`/reservations/${r.id}`}
                      style={{ color: '#CCCCCC', display: 'flex', justifyContent: 'center', transition: 'color 0.12s' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#111111')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#CCCCCC')}
                    >
                      ↗
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Status bar ── */}
      <div style={{
        background: '#ffffff', borderTop: '1px solid #EBEBEB',
        padding: '6px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: '#AAAAAA' }}>
          {rows.length} of {mockReservations.length} reservations
        </span>
        <span style={{ fontSize: 11, color: '#AAAAAA' }}>
          Samsara RMS · {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </span>
      </div>
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────



function Divider() {
  return <div style={{ width: 1, height: 20, background: '#E5E5E5', margin: '0 2px', flexShrink: 0 }} />;
}

function ToolBtn({ icon, label, primary, onClick, chevron }: {
  icon: React.ReactNode; label: string; primary?: boolean; onClick?: () => void; chevron?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 4,
        border: primary ? 'none' : '1px solid #D5D5D5',
        background: primary ? '#111111' : '#FAFAFA',
        color: primary ? '#ffffff' : '#444444',
        fontSize: 12, fontWeight: primary ? 600 : 400,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'opacity 0.12s',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.8')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
    >
      {icon}
      {label}
      {chevron && <ChevronDown size={10} strokeWidth={2} style={{ marginLeft: 2 }} />}
    </button>
  );
}

// ── DatePicker ─────────────────────────────────────────────────────────────────

function DatePicker({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const [open,   setOpen]   = useState(false);
  const [cursor, setCursor] = useState<Date>(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCursor(new Date(value.getFullYear(), value.getMonth(), 1));
  }, [value]);

  const handleOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (open) document.addEventListener('mousedown', handleOutside);
    else       document.removeEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, handleOutside]);

  const today = startOfDay(new Date());

  const prevMonth = () => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const nextMonth = () => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1));

  const firstDay = cursor.getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const arrowBtn: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 24, height: 24, borderRadius: 4, color: '#555555', padding: 0,
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 4,
          border: '1px solid #D5D5D5', background: '#ffffff',
          fontSize: 12, color: '#333333', cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <Calendar size={13} color="#888888" strokeWidth={1.8} />
        <span style={{ fontWeight: 500 }}>{fmtLabel(value)}</span>
        {!isSameDay(value, today) && (
          <span
            onClick={e => { e.stopPropagation(); onChange(today); }}
            style={{ marginLeft: 2, display: 'flex', alignItems: 'center', color: '#AAAAAA' }}
          >
            <X size={12} strokeWidth={2} />
          </span>
        )}
      </button>

      {/* Calendar popup */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          background: '#ffffff', border: '1px solid #E0E0E0',
          borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: 14, zIndex: 200, width: 234,
        }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button style={arrowBtn} onClick={prevMonth}><ChevronLeft  size={14} strokeWidth={2} /></button>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#111111' }}>
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </span>
            <button style={arrowBtn} onClick={nextMonth}><ChevronRight size={14} strokeWidth={2} /></button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#AAAAAA', padding: '2px 0', letterSpacing: '0.04em' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const cellDate   = new Date(cursor.getFullYear(), cursor.getMonth(), day);
              const isSelected = isSameDay(cellDate, value);
              const isToday    = isSameDay(cellDate, today);
              return (
                <button
                  key={idx}
                  onClick={() => { onChange(startOfDay(cellDate)); setOpen(false); }}
                  style={{
                    width: '100%', aspectRatio: '1',
                    border: isToday && !isSelected ? '1.5px solid #111111' : 'none',
                    borderRadius: 4,
                    background: isSelected ? '#111111' : 'none',
                    color: isSelected ? '#ffffff' : '#333333',
                    fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                    fontWeight: isSelected || isToday ? 700 : 400,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Jump to today */}
          {!isSameDay(value, today) && (
            <button
              onClick={() => { onChange(today); setOpen(false); }}
              style={{
                marginTop: 10, width: '100%', padding: '6px 0',
                border: '1px solid #E0E0E0', borderRadius: 4,
                background: 'none', fontSize: 11, color: '#555555',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Today
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Th({
  children, sort, current, dir, onSort, center,
}: {
  children: React.ReactNode;
  sort?: SortField;
  current?: SortField;
  dir?: SortDir;
  onSort?: (f: SortField) => void;
  center?: boolean;
}) {
  const isActive = sort && current === sort;
  return (
    <th
      onClick={sort && onSort ? () => onSort(sort) : undefined}
      style={{
        padding: '8px 8px',
        textAlign: center ? 'center' : 'left',
        fontSize: 11, fontWeight: 600,
        color: isActive ? '#111111' : '#888888',
        letterSpacing: '0.04em', textTransform: 'uppercase',
        borderBottom: '1px solid #E5E5E5',
        whiteSpace: 'nowrap',
        cursor: sort ? 'pointer' : 'default',
        userSelect: 'none',
        background: '#F5F5F5',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        {sort && (
          isActive
            ? dir === 'asc'
              ? <ArrowUp   size={10} strokeWidth={2.5} />
              : <ArrowDown size={10} strokeWidth={2.5} />
            : <ArrowUpDown size={10} strokeWidth={2} color="#CCCCCC" />
        )}
      </span>
    </th>
  );
}
