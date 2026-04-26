'use client';

import { useState, useMemo } from 'react';
import { mockVehicles, mockDrivers } from '@/lib/mock-data';
import type { FleetVehicleType } from '@/types';
import {
  RefreshCw, Plus, SlidersHorizontal,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronRight,
  Car, Truck, Bus, Wind, Star, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type TabKey      = 'vehicles' | 'drivers';
type VehicleSort = 'type' | 'registration' | 'capacity' | 'year' | 'insurance';
type DriverSort  = 'name' | 'rate' | 'rating';
type SortDir     = 'asc' | 'desc';

// ── Config ────────────────────────────────────────────────────────────────────

const VEHICLE_TYPE_CFG: Record<FleetVehicleType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  car:     { label: 'Car',     color: '#1D4ED8', bg: '#DBEAFE', icon: <Car     size={11} strokeWidth={2} /> },
  van:     { label: 'Van',     color: '#6D28D9', bg: '#EDE9FE', icon: <Truck   size={11} strokeWidth={2} /> },
  minibus: { label: 'Minibus', color: '#065F46', bg: '#D1FAE5', icon: <Bus     size={11} strokeWidth={2} /> },
  coach:   { label: 'Coach',   color: '#92400E', bg: '#FEF3C7', icon: <Bus     size={11} strokeWidth={2} /> },
  tuk_tuk: { label: 'Tuk Tuk', color: '#9D174D', bg: '#FCE7F3', icon: <Car     size={11} strokeWidth={2} /> },
  boat:    { label: 'Boat',    color: '#0E7490', bg: '#CFFAFE', icon: <Truck   size={11} strokeWidth={2} /> },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function insuranceBadge(expiry: string): { label: string; color: string; bg: string; icon: React.ReactNode } {
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (days < 0)   return { label: 'Expired',          color: '#991B1B', bg: '#FEE2E2', icon: <AlertCircle size={10} strokeWidth={2} /> };
  if (days < 90)  return { label: `Exp. in ${days}d`, color: '#92400E', bg: '#FEF3C7', icon: <AlertCircle size={10} strokeWidth={2} /> };
  return {
    label: new Date(expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
    color: '#065F46', bg: '#D1FAE5', icon: <CheckCircle size={10} strokeWidth={2} />,
  };
}

function licenceBadge(expiry: string): { label: string; color: string; bg: string } {
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (days < 0)  return { label: 'Expired',          color: '#991B1B', bg: '#FEE2E2' };
  if (days < 90) return { label: `Exp. in ${days}d`, color: '#92400E', bg: '#FEF3C7' };
  return {
    label: new Date(expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
    color: '#065F46', bg: '#D1FAE5',
  };
}

// ── Shared components ─────────────────────────────────────────────────────────

function Th<T extends string>({ children, sort, current, dir, onSort, center }: {
  children: React.ReactNode;
  sort?: T; current?: T; dir?: SortDir;
  onSort?: (f: T) => void;
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FleetPage() {
  const [tab,          setTab]          = useState<TabKey>('vehicles');
  const [vFilter,      setVFilter]      = useState('');
  const [dFilter,      setDFilter]      = useState('');
  const [vSort,        setVSort]        = useState<VehicleSort>('type');
  const [dSort,        setDSort]        = useState<DriverSort>('name');
  const [vDir,         setVDir]         = useState<SortDir>('asc');
  const [dDir,         setDDir]         = useState<SortDir>('asc');
  const [refreshing,   setRefreshing]   = useState(false);

  function toggleVSort(f: VehicleSort) {
    if (vSort === f) setVDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setVSort(f); setVDir('asc'); }
  }
  function toggleDSort(f: DriverSort) {
    if (dSort === f) setDDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setDSort(f); setDDir('asc'); }
  }

  const vehicles = useMemo(() => {
    let list = [...mockVehicles];
    if (vFilter.trim()) {
      const q = vFilter.toLowerCase();
      list = list.filter(v =>
        v.registration.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (vSort === 'type')         return vDir === 'asc' ? a.type.localeCompare(b.type)                 : b.type.localeCompare(a.type);
      if (vSort === 'registration') return vDir === 'asc' ? a.registration.localeCompare(b.registration) : b.registration.localeCompare(a.registration);
      const av = vSort === 'capacity' ? a.capacity_adults : vSort === 'year' ? a.year : new Date(a.insurance_expiry).getTime();
      const bv = vSort === 'capacity' ? b.capacity_adults : vSort === 'year' ? b.year : new Date(b.insurance_expiry).getTime();
      return vDir === 'asc' ? av - bv : bv - av;
    });
    return list;
  }, [vFilter, vSort, vDir]);

  const drivers = useMemo(() => {
    let list = [...mockDrivers];
    if (dFilter.trim()) {
      const q = dFilter.toLowerCase();
      list = list.filter(d =>
        d.full_name.toLowerCase().includes(q) ||
        d.license_number.toLowerCase().includes(q) ||
        d.languages.some(l => l.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      if (dSort === 'name') return dDir === 'asc' ? a.full_name.localeCompare(b.full_name) : b.full_name.localeCompare(a.full_name);
      const av = dSort === 'rate' ? a.daily_rate : a.rating;
      const bv = dSort === 'rate' ? b.daily_rate : b.rating;
      return dDir === 'asc' ? av - bv : bv - av;
    });
    return list;
  }, [dFilter, dSort, dDir]);

  function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }

  const TAB_DATA = [
    { key: 'vehicles' as TabKey, label: 'Vehicles', count: mockVehicles.length },
    { key: 'drivers'  as TabKey, label: 'Drivers',  count: mockDrivers.length  },
  ];

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

        <div style={{ flex: 1 }} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          border: '1px solid #D5D5D5', borderRadius: 4,
          padding: '4px 8px', background: '#FAFAFA',
        }}>
          <SlidersHorizontal size={12} color="#AAAAAA" strokeWidth={2} />
          <input
            value={tab === 'vehicles' ? vFilter : dFilter}
            onChange={e => tab === 'vehicles' ? setVFilter(e.target.value) : setDFilter(e.target.value)}
            placeholder={tab === 'vehicles' ? 'Filter vehicles…' : 'Filter drivers…'}
            style={{
              background: 'none', border: 'none', outline: 'none',
              fontSize: 12, color: '#333333', width: 200, fontFamily: 'inherit',
            }}
          />
        </div>

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
          {tab === 'vehicles' ? 'Add Vehicle' : 'Add Driver'}
        </button>
      </div>

      {/* Tab bar */}
      <div style={{
        background: '#ffffff', borderBottom: '1px solid #E5E5E5',
        display: 'flex', alignItems: 'stretch',
        padding: '0 16px', flexShrink: 0,
      }}>
        {TAB_DATA.map(({ key, label, count }) => {
          const active = tab === key;
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

      {/* ── VEHICLES TABLE ── */}
      {tab === 'vehicles' && (
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', fontSize: 12, tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 200 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 55 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 36 }} />
            </colgroup>
            <thead>
              <tr style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '6px 10px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>#</th>
                <Th sort="type" current={vSort} dir={vDir} onSort={toggleVSort}>Type</Th>
                <Th sort="registration" current={vSort} dir={vDir} onSort={toggleVSort}>Registration</Th>
                <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Make / Model</th>
                <Th sort="capacity" current={vSort} dir={vDir} onSort={toggleVSort} center>Cap.</Th>
                <th style={{ padding: '6px 10px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>A/C</th>
                <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Owner</th>
                <Th sort="insurance" current={vSort} dir={vDir} onSort={toggleVSort}>Insurance</Th>
                <th style={{ padding: '6px 10px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Status</th>
                <th style={{ padding: '6px 10px', background: '#F5F5F5', borderBottom: '1px solid #E5E5E5' }} />
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: '32px', textAlign: 'center', color: '#AAAAAA', fontSize: 13 }}>
                    No vehicles match your filters.
                  </td>
                </tr>
              )}
              {vehicles.map((v, i) => {
                const typeCfg  = VEHICLE_TYPE_CFG[v.type];
                const insBadge = insuranceBadge(v.insurance_expiry);
                return (
                  <tr
                    key={v.id}
                    style={{ borderBottom: '1px solid #F0F0F0', cursor: 'pointer', transition: 'background 0.08s' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F7F9FF')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#CCCCCC', fontSize: 11 }}>{i + 1}</td>

                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3,
                        background: typeCfg.bg, color: typeCfg.color,
                      }}>
                        {typeCfg.icon}
                        {typeCfg.label}
                      </span>
                    </td>

                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#111111' }}>
                        {v.registration}
                      </span>
                    </td>

                    <td style={{ padding: '8px 10px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111111' }}>{v.make} {v.model}</p>
                      <p style={{ fontSize: 11, color: '#AAAAAA', marginTop: 1 }}>{v.year}</p>
                    </td>

                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111111' }}>{v.capacity_adults}</span>
                      <span style={{ fontSize: 10, color: '#AAAAAA' }}> pax</span>
                    </td>

                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      {v.air_conditioned
                        ? <span title="Air-conditioned"><Wind size={14} strokeWidth={2} color="#1D4ED8" /></span>
                        : <span style={{ fontSize: 10, color: '#CCCCCC' }}>—</span>
                      }
                    </td>

                    <td style={{ padding: '8px 10px', fontSize: 12, color: '#555555' }}>
                      {v.owner === 'own_fleet'
                        ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: '#EDE9FE', color: '#6D28D9' }}>Own Fleet</span>
                        : <span style={{ fontSize: 11, color: '#888888' }}>Subcontracted</span>
                      }
                    </td>

                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 3,
                        background: insBadge.bg, color: insBadge.color,
                      }}>
                        {insBadge.icon}
                        {insBadge.label}
                      </span>
                    </td>

                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      {v.is_available
                        ? <CheckCircle size={14} strokeWidth={2} color="#059669" />
                        : <XCircle    size={14} strokeWidth={2} color="#DC2626" />
                      }
                    </td>

                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <ChevronRight size={13} color="#CCCCCC" strokeWidth={2} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {vehicles.length > 0 && (
            <div style={{
              background: '#F9F9F9', borderTop: '1px solid #EEEEEE',
              padding: '6px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 11, color: '#AAAAAA' }}>
                {vehicles.length} of {mockVehicles.length} vehicles
              </span>
              <span style={{ fontSize: 11, color: '#AAAAAA' }}>
                {mockVehicles.filter(v => v.is_available).length} available · {mockVehicles.filter(v => v.owner === 'own_fleet').length} own fleet
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── DRIVERS TABLE ── */}
      {tab === 'drivers' && (
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', fontSize: 12, tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ width: 180 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 180 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 70 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 36 }} />
            </colgroup>
            <thead>
              <tr style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '6px 10px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>#</th>
                <Th sort="name" current={dSort} dir={dDir} onSort={toggleDSort}>Driver</Th>
                <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>License</th>
                <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Languages</th>
                <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Assigned Vehicle</th>
                <Th sort="rate" current={dSort} dir={dDir} onSort={toggleDSort} center>Daily Rate</Th>
                <Th sort="rating" current={dSort} dir={dDir} onSort={toggleDSort} center>Rating</Th>
                <th style={{ padding: '6px 10px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Status</th>
                <th style={{ padding: '6px 10px', background: '#F5F5F5', borderBottom: '1px solid #E5E5E5' }} />
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#AAAAAA', fontSize: 13 }}>
                    No drivers match your filters.
                  </td>
                </tr>
              )}
              {drivers.map((d, i) => {
                const vehicle  = d.vehicle_id ? mockVehicles.find(v => v.id === d.vehicle_id) : null;
                const licBadge = licenceBadge(d.license_expiry);
                return (
                  <tr
                    key={d.id}
                    style={{ borderBottom: '1px solid #F0F0F0', cursor: 'pointer', transition: 'background 0.08s' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F7F9FF')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#CCCCCC', fontSize: 11 }}>{i + 1}</td>

                    <td style={{ padding: '8px 10px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.full_name}
                      </p>
                      <p style={{ fontSize: 11, color: '#AAAAAA', marginTop: 1 }}>{d.phone}</p>
                    </td>

                    <td style={{ padding: '8px 10px' }}>
                      <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#555555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.license_number}
                      </p>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 2,
                        fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
                        background: licBadge.bg, color: licBadge.color,
                      }}>
                        {licBadge.label}
                      </span>
                    </td>

                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {d.languages.map(l => (
                          <span key={l} style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3, background: '#F3F4F6', color: '#374151' }}>
                            {l}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td style={{ padding: '8px 10px' }}>
                      {vehicle ? (
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {vehicle.make} {vehicle.model}
                          </p>
                          <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#AAAAAA', marginTop: 1 }}>
                            {vehicle.registration}
                          </p>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: '#CCCCCC' }}>Unassigned</span>
                      )}
                    </td>

                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#111111' }}>
                        {d.currency === 'USD' ? '$' : d.currency === 'GBP' ? '£' : '€'}{d.daily_rate}
                      </span>
                      <span style={{ fontSize: 10, color: '#AAAAAA' }}>/day</span>
                    </td>

                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                        <Star size={11} strokeWidth={0} fill="#F59E0B" />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#111111' }}>{d.rating.toFixed(1)}</span>
                      </span>
                    </td>

                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      {d.is_available
                        ? <CheckCircle size={14} strokeWidth={2} color="#059669" />
                        : <XCircle    size={14} strokeWidth={2} color="#DC2626" />
                      }
                    </td>

                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <ChevronRight size={13} color="#CCCCCC" strokeWidth={2} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {drivers.length > 0 && (
            <div style={{
              background: '#F9F9F9', borderTop: '1px solid #EEEEEE',
              padding: '6px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 11, color: '#AAAAAA' }}>
                {drivers.length} of {mockDrivers.length} drivers
              </span>
              <span style={{ fontSize: 11, color: '#AAAAAA' }}>
                {mockDrivers.filter(d => d.is_available).length} available · avg ${ (mockDrivers.reduce((s, d) => s + d.daily_rate, 0) / mockDrivers.length).toFixed(0) }/day
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
