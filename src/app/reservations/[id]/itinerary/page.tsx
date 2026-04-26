'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { mockReservations } from '@/lib/mock-data';
import { formatDate, tripDuration, formatCurrency } from '@/lib/utils';
import type { Currency } from '@/types';
import {
  Plus, Trash2, Save, FileDown, ChevronLeft,
  Hotel, Car, Compass, Utensils,
  CheckCircle, AlertCircle, XCircle,
  ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ServiceStatus = 'pending' | 'confirmed' | 'cancelled';

interface Activity {
  id:          string;
  time:        string;
  endTime:     string;
  title:       string;
  location:    string;
  description: string;
  supplier:    string;
  guide:       string;
  status:      ServiceStatus;
  costPrice:   number;
  sellPrice:   number;
  expanded:    boolean;
}

interface Transfer {
  id:       string;
  time:     string;
  from:     string;
  to:       string;
  vehicle:  string;
  driver:   string;
  flight:   string;
  notes:    string;
  status:   ServiceStatus;
  expanded: boolean;
}

interface DayHotel {
  name:           string;
  roomType:       string;
  rooms:          number;
  confirmationNo: string;
  checkIn:        string;
  checkOut:       string;
  supplier:       string;
  notes:          string;
  status:         ServiceStatus;
  costPrice:      number;
  sellPrice:      number;
}

interface DayItem {
  id:          string;
  dayNumber:   number;
  date:        string;
  title:       string;
  description: string;
  hotel:       DayHotel;
  transfers:   Transfer[];
  activities:  Activity[];
  meals:       string[];
  guide:       string;
  notes:       string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function uid() { return Math.random().toString(36).slice(2); }

function makeActivity(): Activity {
  return { id: uid(), time: '', endTime: '', title: '', location: '', description: '', supplier: '', guide: '', status: 'pending', costPrice: 0, sellPrice: 0, expanded: true };
}

function makeTransfer(): Transfer {
  return { id: uid(), time: '', from: '', to: '', vehicle: 'Private Car', driver: '', flight: '', notes: '', status: 'pending', expanded: true };
}

function makeDefaultHotel(): DayHotel {
  return { name: '', roomType: 'Deluxe', rooms: 1, confirmationNo: '', checkIn: '14:00', checkOut: '11:00', supplier: '', notes: '', status: 'pending', costPrice: 0, sellPrice: 0 };
}

function makeDay(n: number, date: string, nights: number): DayItem {
  return {
    id: `day-${n}`, dayNumber: n, date,
    title: n === 1 ? 'Arrival & Welcome' : n === nights ? 'Farewell & Departure' : `Day ${n}`,
    description: '', hotel: makeDefaultHotel(),
    transfers: n === 1 ? [{ ...makeTransfer(), from: 'Airport', expanded: true }] : [],
    activities: [], meals: ['Breakfast'], guide: '', notes: '',
  };
}

// ── Design tokens (matches reservation detail page) ───────────────────────────

const T = {
  bg:          '#E8E8E8',
  surface:     '#ffffff',
  border:      '#D4D4D4',
  border2:     '#EEEEEE',
  headBg:      '#F2F2F2',
  headColor:   '#444444',
  label:       '#555555',
  muted:       '#888888',
  text:        '#111111',
  primary:     '#1A6FC4',
  danger:      '#C43333',
  inputBg:     '#FDFDE8',
  inputBorder: '#C8C8C8',
  toolbarBg:   '#F0F0F0',
  toolbarBdr:  '#C8C8C8',
  rowBdr:      '#EEEEEE',
};

const STATUS_CFG: Record<ServiceStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',   color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: <AlertCircle size={10} strokeWidth={2} /> },
  confirmed: { label: 'Confirmed', color: '#059669', bg: '#ECFDF5', border: '#86EFAC', icon: <CheckCircle size={10} strokeWidth={2} /> },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: <XCircle     size={10} strokeWidth={2} /> },
};

// ── Shared sub-components ─────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 3, marginBottom: 5, overflow: 'hidden',
};

const sectionHeadStyle: React.CSSProperties = {
  background: T.headBg, borderBottom: `1px solid ${T.border}`,
  padding: '4px 10px', fontSize: 12, fontWeight: 700, color: T.headColor,
  letterSpacing: '0.01em',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  borderBottom: `1px solid ${T.rowBdr}`, minHeight: 26,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, color: T.label, width: 122, flexShrink: 0,
  padding: '3px 8px 3px 10px', display: 'flex', alignItems: 'center', gap: 3,
  lineHeight: 1.35,
};

const editInp: React.CSSProperties = {
  fontSize: 12, color: T.text, flex: 1,
  padding: '3px 6px', border: `1px solid ${T.inputBorder}`,
  borderRadius: 2, background: T.inputBg, outline: 'none',
  fontFamily: 'inherit', height: 24,
  transition: 'border-color 0.12s',
  minWidth: 0,
};

const selectStyle: React.CSSProperties = {
  ...editInp, cursor: 'pointer',
};

function SHead({ icon, label, action }: { icon: React.ReactNode; label: string; action?: React.ReactNode }) {
  return (
    <div style={sectionHeadStyle}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ color: T.muted }}>{icon}</span>
        {label}
      </span>
      {action}
    </div>
  );
}

function IRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={rowStyle}>
      <div style={labelStyle}>
        {required && <span style={{ color: T.danger }}>*</span>}
        {label}
      </div>
      <div style={{ flex: 1, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}


function Inp({ value, onChange, placeholder, type = 'text', style: s }: {
  value: string | number; onChange: (v: string) => void;
  placeholder?: string; type?: string; style?: React.CSSProperties;
}) {
  const base = s?.width !== undefined ? { ...editInp, flex: 'none' as const } : editInp;
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...base, ...s }}
      onFocus={e => (e.currentTarget.style.borderColor = T.primary)}
      onBlur={e  => (e.currentTarget.style.borderColor = T.inputBorder)}
    />
  );
}

function StatusPill({ status, onChange }: { status: ServiceStatus; onChange: (s: ServiceStatus) => void }) {
  const cfg = STATUS_CFG[status];
  return (
    <select
      value={status}
      onChange={e => onChange(e.target.value as ServiceStatus)}
      style={{
        fontSize: 11, fontWeight: 600, padding: '2px 8px', height: 22,
        borderRadius: 3, border: `1px solid ${cfg.border}`,
        background: cfg.bg, color: cfg.color,
        cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
      }}
    >
      <option value="pending">Pending</option>
      <option value="confirmed">Confirmed</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );
}

function TBtn({ icon, label, primary, danger, onClick, disabled }: {
  icon?: React.ReactNode; label: string; primary?: boolean; danger?: boolean;
  onClick?: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 3, height: 26,
        border: primary ? `1px solid ${T.primary}` : danger ? `1px solid ${T.danger}` : '1px solid #BBBBBB',
        background: primary ? T.primary : danger ? T.danger : '#EBEBEB',
        color: primary || danger ? '#ffffff' : '#333333',
        fontSize: 12, fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', whiteSpace: 'nowrap',
        opacity: disabled ? 0.55 : 1,
      }}
      onMouseEnter={e => { if (!primary && !danger && !disabled) (e.currentTarget as HTMLElement).style.background = '#DEDEDE'; }}
      onMouseLeave={e => { if (!primary && !danger && !disabled) (e.currentTarget as HTMLElement).style.background = '#EBEBEB'; }}
    >
      {icon}{label}
    </button>
  );
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 2, height: 22,
        border: `1px solid #BBBBBB`, background: '#FAFAFA',
        color: '#444444', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#EFEFEF'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#FAFAFA'}
    >
      <Plus size={10} strokeWidth={2.5} />{label}
    </button>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CCCCCC', display: 'flex', padding: 2, flexShrink: 0 }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.danger}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#CCCCCC'}
    >
      <Trash2 size={12} strokeWidth={2} />
    </button>
  );
}

function CollapseBtn({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', padding: 2, flexShrink: 0 }}
    >
      {expanded ? <ChevronUp size={12} strokeWidth={2} /> : <ChevronDown size={12} strokeWidth={2} />}
    </button>
  );
}

function SubGroup({ label }: { label: string }) {
  return (
    <div style={{
      padding: '3px 10px',
      fontSize: 10, fontWeight: 700, color: '#999999',
      letterSpacing: '0.07em', textTransform: 'uppercase',
      background: '#F8F8F8', borderBottom: `1px solid ${T.border2}`,
      borderTop: `1px solid ${T.border2}`,
    }}>
      {label}
    </div>
  );
}

// ── Margin helper ─────────────────────────────────────────────────────────────

function MarginLine({ cost, sell, cur }: { cost: number; sell: number; cur: Currency }) {
  if (!cost || !sell) return null;
  const margin = sell - cost;
  const pct    = Math.round((margin / sell) * 100);
  return (
    <div style={{
      padding: '4px 10px', background: '#F8FFF8',
      borderTop: `1px solid ${T.rowBdr}`,
      fontSize: 11, color: margin >= 0 ? '#059669' : T.danger,
      fontVariantNumeric: 'tabular-nums',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <span style={{ color: T.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Margin</span>
      <span style={{ fontWeight: 600 }}>{formatCurrency(margin, cur)}</span>
      <span style={{ color: T.muted }}>({pct}%)</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ItineraryBuilderPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const r       = mockReservations.find(x => x.id === id);
  const nights  = r ? tripDuration(r.arrival_date, r.departure_date) : 7;
  const cur: Currency = r?.currency ?? 'USD';

  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [activeDay, setActiveDay] = useState(0);

  const [days, setDays] = useState<DayItem[]>(() =>
    Array.from({ length: nights }, (_, i) =>
      makeDay(i + 1, r ? addDays(r.arrival_date, i) : '', nights)
    )
  );

  // ── Updaters ───────────────────────────────────────────────────────────────

  const updateDay = useCallback(<K extends keyof DayItem>(i: number, k: K, v: DayItem[K]) => {
    setDays(p => p.map((d, j) => j === i ? { ...d, [k]: v } : d));
  }, []);

  const updateHotel = useCallback((i: number, k: keyof DayHotel, v: unknown) => {
    setDays(p => p.map((d, j) => j === i ? { ...d, hotel: { ...d.hotel, [k]: v } } : d));
  }, []);

  const addTransfer    = (i: number) => updateDay(i, 'transfers', [...days[i].transfers, makeTransfer()]);
  const updateTransfer = (di: number, ti: number, k: keyof Transfer, v: unknown) =>
    updateDay(di, 'transfers', days[di].transfers.map((t, j) => j === ti ? { ...t, [k]: v } : t));
  const removeTransfer = (di: number, ti: number) =>
    updateDay(di, 'transfers', days[di].transfers.filter((_, j) => j !== ti));

  const addActivity    = (i: number) => updateDay(i, 'activities', [...days[i].activities, makeActivity()]);
  const updateActivity = (di: number, ai: number, k: keyof Activity, v: unknown) =>
    updateDay(di, 'activities', days[di].activities.map((a, j) => j === ai ? { ...a, [k]: v } : a));
  const removeActivity = (di: number, ai: number) =>
    updateDay(di, 'activities', days[di].activities.filter((_, j) => j !== ai));

  const toggleMeal = (di: number, meal: string) => {
    const m = days[di].meals;
    updateDay(di, 'meals', m.includes(meal) ? m.filter(x => x !== meal) : [...m, meal]);
  };

  // ── Sync itinerary days with reservation dates on every mount ──────────────
  // Handles the case where arrival/departure dates were changed on the
  // reservation detail page before navigating here.
  useEffect(() => {
    if (!r) return;
    const expectedNights = tripDuration(r.arrival_date, r.departure_date);
    if (expectedNights < 1) return;

    setDays(prev => {
      // Recalculate every day's date from the (possibly updated) arrival date
      const rebased = prev.map((d, i) => ({
        ...d,
        dayNumber: i + 1,
        date: addDays(r.arrival_date, i),
      }));

      if (rebased.length === expectedNights) return rebased;

      if (expectedNights > rebased.length) {
        const extra = Array.from(
          { length: expectedNights - rebased.length },
          (_, i) => makeDay(
            rebased.length + i + 1,
            addDays(r.arrival_date, rebased.length + i),
            expectedNights,
          )
        );
        return [...rebased, ...extra];
      }

      return rebased.slice(0, expectedNights);
    });

    setActiveDay(d => Math.min(d, expectedNights - 1));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount — reconciles with any date changes made on the reservation page

  // ── Cost summaries ─────────────────────────────────────────────────────────

  function dayCost(d: DayItem) {
    const cost = d.hotel.costPrice + d.activities.reduce((s, a) => s + a.costPrice, 0);
    const sell = d.hotel.sellPrice + d.activities.reduce((s, a) => s + a.sellPrice, 0);
    return { cost, sell, margin: sell - cost };
  }

  const tripTotals = days.reduce((acc, d) => {
    const c = dayCost(d);
    return { cost: acc.cost + c.cost, sell: acc.sell + c.sell, margin: acc.margin + c.margin };
  }, { cost: 0, sell: 0, margin: 0 });

  function dayStatus(d: DayItem): ServiceStatus {
    const all = [d.hotel.status, ...d.transfers.map(t => t.status), ...d.activities.map(a => a.status)];
    if (all.some(s => s === 'cancelled')) return 'cancelled';
    if (all.every(s => s === 'confirmed')) return 'confirmed';
    return 'pending';
  }

  // ── Save & PDF ─────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    await new Promise(res => setTimeout(res, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handlePDF() {
    const { default: jsPDF } = await import('jspdf');
    const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const gold  = [201, 168, 76]  as [number, number, number];
    const dark  = [20,  20,  20]  as [number, number, number];
    const white = [255, 255, 255] as [number, number, number];
    const muted = [150, 140, 130] as [number, number, number];

    doc.setFillColor(...dark); doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(...gold); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text('SAMSARA TRAVEL', 105, 80, { align: 'center' });
    doc.setTextColor(...white); doc.setFontSize(26); doc.setFont('helvetica', 'bold');
    doc.text(r?.client?.full_name ?? 'Your', 105, 110, { align: 'center' });
    doc.text('Journey Itinerary', 105, 124, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gold);
    doc.text(r ? `${formatDate(r.arrival_date)} — ${formatDate(r.departure_date)}` : '', 105, 142, { align: 'center' });
    doc.setTextColor(...muted); doc.text(r?.reference ?? '', 105, 152, { align: 'center' });

    days.forEach((day, idx) => {
      doc.addPage();
      doc.setFillColor(...dark); doc.rect(0, 0, 210, 297, 'F');
      doc.setFillColor(...gold); doc.rect(0, 0, 8, 297, 'F');
      doc.setTextColor(...gold); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`DAY ${day.dayNumber}`, 20, 30);
      doc.setTextColor(...muted); doc.setFontSize(8);
      doc.text(day.date ? formatDate(day.date) : '', 20, 38);
      doc.setTextColor(...white); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.text(day.title, 20, 54);
      doc.setDrawColor(...gold); doc.setLineWidth(0.3); doc.line(20, 59, 190, 59);
      let y = 70;
      if (day.description) {
        doc.setTextColor(200, 195, 185); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(day.description, 170);
        doc.text(lines, 20, y); y += lines.length * 6 + 10;
      }
      if (day.hotel.name) {
        doc.setTextColor(...gold); doc.setFontSize(8); doc.text('ACCOMMODATION', 20, y); y += 6;
        doc.setTextColor(...white); doc.setFontSize(10);
        doc.text(`${day.hotel.name}  ·  ${day.hotel.roomType}  ·  Check-in ${day.hotel.checkIn}`, 20, y); y += 12;
      }
      if (day.transfers.filter(t => t.from || t.to).length) {
        doc.setTextColor(...gold); doc.setFontSize(8); doc.text('TRANSFERS', 20, y); y += 6;
        day.transfers.filter(t => t.from || t.to).forEach(t => {
          doc.setTextColor(...white); doc.setFontSize(10);
          doc.text(`${t.time ? t.time + '  ' : ''}${t.from} → ${t.to}${t.vehicle ? '  · ' + t.vehicle : ''}`, 20, y); y += 7;
        }); y += 4;
      }
      if (day.activities.filter(a => a.title).length) {
        doc.setTextColor(...gold); doc.setFontSize(8); doc.text('ACTIVITIES', 20, y); y += 6;
        day.activities.filter(a => a.title).forEach(a => {
          doc.setTextColor(...white); doc.setFontSize(10);
          doc.text(`• ${a.time ? a.time + '  ' : ''}${a.title}${a.location ? ' — ' + a.location : ''}`, 20, y); y += 7;
        });
      }
      doc.setTextColor(80, 75, 65); doc.setFontSize(8);
      doc.text(`${idx + 1} / ${days.length}`, 190, 285, { align: 'right' });
    });

    doc.save(`Samsara_Itinerary_${r?.reference ?? 'draft'}.pdf`);
  }

  if (!r) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 48px)', color: '#BBBBBB', fontSize: 13 }}>
      Reservation not found.
    </div>
  );

  const day  = days[activeDay];
  const dayC = dayCost(day);

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', background: T.bg }}>

      {/* ── Toolbar ── */}
      <div style={{
        background: T.toolbarBg, borderBottom: `1px solid ${T.toolbarBdr}`,
        padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6,
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        <TBtn icon={<Save size={12} strokeWidth={2} />} label={saving ? 'Saving…' : saved ? 'Saved!' : 'Save'} primary onClick={handleSave} disabled={saving} />
        {saving && <RefreshCw size={11} strokeWidth={2} color={T.primary} style={{ animation: 'spin 0.7s linear infinite' }} />}
        {saved && !saving && <CheckCircle size={13} strokeWidth={2} color="#059669" />}

        <TBtn icon={<FileDown size={12} strokeWidth={2} />} label="Export PDF" onClick={handlePDF} />

        <div style={{ width: 1, height: 20, background: '#C0C0C0', margin: '0 4px' }} />

        {/* Trip cost summary */}
        {tripTotals.sell > 0 && (
          <>
            {[
              { l: 'Cost',   v: formatCurrency(tripTotals.cost,   cur), c: T.muted },
              { l: 'Sell',   v: formatCurrency(tripTotals.sell,   cur), c: T.text  },
              { l: 'Margin', v: formatCurrency(tripTotals.margin, cur), c: tripTotals.margin >= 0 ? '#059669' : T.danger },
            ].map(x => (
              <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 6px' }}>
                <span style={{ fontSize: 10, color: T.muted }}>{x.l}:</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: x.c, fontVariantNumeric: 'tabular-nums' }}>{x.v}</span>
              </div>
            ))}
            <div style={{ width: 1, height: 20, background: '#C0C0C0', margin: '0 4px' }} />
          </>
        )}

        <div style={{ flex: 1 }} />

        <Link
          href={`/reservations/${id}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, color: T.muted, textDecoration: 'none',
          }}
        >
          <ChevronLeft size={13} strokeWidth={2} />
          Back to Reservation
        </Link>
      </div>

      {/* ── Sub-header: reservation info ── */}
      <div style={{
        background: T.surface, borderBottom: `1px solid ${T.toolbarBdr}`,
        padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text, marginRight: 12 }}>Itinerary Builder</span>
        <span style={{ width: 1, height: 14, background: T.border, marginRight: 12, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: T.muted, marginRight: 10 }}>{r.reference}</span>
        <span style={{ width: 1, height: 12, background: T.border2, marginRight: 10, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: T.muted, marginRight: 10 }}>{days.length} nights</span>
        <span style={{ width: 1, height: 12, background: T.border2, marginRight: 10, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: T.muted, marginRight: 10 }}>{r.destinations.join(', ')}</span>
        {r.client?.full_name && (
          <>
            <span style={{ width: 1, height: 12, background: T.border2, marginRight: 10, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: T.muted, marginRight: 10 }}>{r.client.full_name}</span>
          </>
        )}
        <span style={{ width: 1, height: 12, background: T.border2, marginRight: 10, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: T.muted }}>
          {formatDate(r.arrival_date)} — {formatDate(r.departure_date)}
        </span>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '192px 1fr', overflow: 'hidden' }}>

        {/* ── Day navigator ── */}
        <div style={{
          background: T.surface, borderRight: `1px solid ${T.border}`,
          overflowY: 'auto', flexShrink: 0,
        }}>
          <div style={{
            padding: '4px 10px', fontSize: 10, fontWeight: 700,
            color: T.muted, letterSpacing: '0.07em', textTransform: 'uppercase',
            borderBottom: `1px solid ${T.border}`, background: T.headBg,
          }}>
            Days — {days.length} nights
          </div>

          {days.map((d, idx) => {
            const active = activeDay === idx;
            const ds     = dayStatus(d);
            const dsCfg  = STATUS_CFG[ds];
            return (
              <button
                key={d.id}
                onClick={() => setActiveDay(idx)}
                style={{
                  width: '100%', padding: '6px 10px',
                  border: 'none',
                  borderLeft: active ? `3px solid ${T.primary}` : '3px solid transparent',
                  borderBottom: `1px solid ${T.border2}`,
                  background: active ? '#EEF4FF' : 'none',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.08s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F8F8F8'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 1 }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: active ? T.primary : T.text }}>
                      Day {d.dayNumber}
                    </span>
                    {d.date && (
                      <span style={{ fontSize: 9, color: active ? '#6B9ED2' : '#BBBBBB', fontWeight: 500 }}>
                        {new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </span>
                  <span style={{ color: dsCfg.color, display: 'flex' }}>{dsCfg.icon}</span>
                </div>
                <p style={{ fontSize: 10, color: active ? T.primary : T.muted, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: active ? 0.8 : 1 }}>
                  {d.title || `Day ${d.dayNumber}`}
                </p>
                {/* Mini pills */}
                <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                  {d.hotel.name && (
                    <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 2, background: '#EEF4FF', color: T.primary }}>Hotel</span>
                  )}
                  {d.transfers.filter(t => t.from || t.to).map((_, ti) => (
                    <span key={ti} style={{ fontSize: 8, padding: '1px 4px', borderRadius: 2, background: '#F0FDF4', color: '#059669' }}>Transfer</span>
                  ))}
                  {d.activities.filter(a => a.title).map((_, ai) => (
                    <span key={ai} style={{ fontSize: 8, padding: '1px 4px', borderRadius: 2, background: '#FFFBEB', color: '#D97706' }}>Activity</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Day editor ── */}
        <div style={{ overflowY: 'auto', padding: '8px 10px' }}>

          {/* ── Day header card ── */}
          <div style={sectionStyle}>
            {/* Card header: day badge + date + cost summary */}
            <div style={{ ...sectionHeadStyle, background: '#EEF4FF', minHeight: 36 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: T.primary, color: '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {day.dayNumber}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>
                    {day.date
                      ? new Date(day.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
                      : `Day ${day.dayNumber}`}
                  </span>
                  <span style={{ fontSize: 10, color: T.muted, lineHeight: 1.2 }}>Day {day.dayNumber} of {days.length}</span>
                </span>
              </span>
              {dayC.sell > 0 && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {[
                    { l: 'Cost',   v: formatCurrency(dayC.cost,   cur), c: T.muted },
                    { l: 'Sell',   v: formatCurrency(dayC.sell,   cur), c: T.text  },
                    { l: 'Margin', v: formatCurrency(dayC.margin, cur), c: dayC.margin >= 0 ? '#059669' : T.danger },
                  ].map(x => (
                    <div key={x.l} style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 9, color: '#AAAAAA', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{x.l}</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: x.c, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{x.v}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Day Title */}
            <IRow label="Day Title" required>
              <input
                value={day.title}
                onChange={e => updateDay(activeDay, 'title', e.target.value)}
                placeholder="e.g. Arrival & Transfer to Galle"
                style={{ ...editInp, flex: 1 }}
                onFocus={e => (e.currentTarget.style.borderColor = T.primary)}
                onBlur={e  => (e.currentTarget.style.borderColor = T.inputBorder)}
              />
            </IRow>
            {/* Description */}
            <div style={{ display: 'flex', minHeight: 32, borderBottom: `1px solid ${T.rowBdr}` }}>
              <div style={{ ...labelStyle, alignSelf: 'flex-start', paddingTop: 7 }}>Description</div>
              <div style={{ flex: 1, padding: '5px 8px', minWidth: 0 }}>
                <textarea
                  value={day.description}
                  onChange={e => updateDay(activeDay, 'description', e.target.value)}
                  placeholder="Describe the day experience for the client…"
                  rows={2}
                  style={{
                    width: '100%', resize: 'vertical', minHeight: 46, maxHeight: 120,
                    border: `1px solid ${T.inputBorder}`, borderRadius: 2,
                    fontSize: 12, color: T.text, lineHeight: 1.5,
                    padding: '4px 6px', fontFamily: 'inherit',
                    background: T.inputBg, outline: 'none',
                    transition: 'border-color 0.12s', display: 'block', boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = T.primary)}
                  onBlur={e  => (e.currentTarget.style.borderColor = T.inputBorder)}
                />
              </div>
            </div>
          </div>

          {/* ── Accommodation ── */}
          <div style={sectionStyle}>
            <SHead icon={<Hotel size={12} strokeWidth={2} />} label="Accommodation" />

            {/* Booking details group */}
            <SubGroup label="Property & Booking" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ borderRight: `1px solid ${T.rowBdr}` }}>
                <IRow label="Hotel / Property" required>
                  <Inp value={day.hotel.name} onChange={v => updateHotel(activeDay, 'name', v)} placeholder="Hotel name" />
                </IRow>
              </div>
              <IRow label="Supplier">
                <Inp value={day.hotel.supplier} onChange={v => updateHotel(activeDay, 'supplier', v)} placeholder="Supplier / operator" />
              </IRow>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr' }}>
              <div style={{ borderRight: `1px solid ${T.rowBdr}` }}>
                <IRow label="Room Type">
                  <Inp value={day.hotel.roomType} onChange={v => updateHotel(activeDay, 'roomType', v)} placeholder="e.g. Deluxe Sea View" />
                </IRow>
              </div>
              <div style={{ borderRight: `1px solid ${T.rowBdr}` }}>
                <IRow label="Rooms">
                  <Inp value={day.hotel.rooms} onChange={v => updateHotel(activeDay, 'rooms', Number(v))} type="number" style={{ width: 52 }} />
                </IRow>
              </div>
              <IRow label="Confirmation #">
                <Inp value={day.hotel.confirmationNo} onChange={v => updateHotel(activeDay, 'confirmationNo', v)} placeholder="e.g. HTL-8821" />
              </IRow>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr' }}>
              <div style={{ borderRight: `1px solid ${T.rowBdr}` }}>
                <IRow label="Check-in">
                  <Inp value={day.hotel.checkIn} onChange={v => updateHotel(activeDay, 'checkIn', v)} placeholder="14:00" style={{ width: 64 }} />
                </IRow>
              </div>
              <div style={{ borderRight: `1px solid ${T.rowBdr}` }}>
                <IRow label="Check-out">
                  <Inp value={day.hotel.checkOut} onChange={v => updateHotel(activeDay, 'checkOut', v)} placeholder="11:00" style={{ width: 64 }} />
                </IRow>
              </div>
              <IRow label="Status">
                <StatusPill status={day.hotel.status} onChange={v => updateHotel(activeDay, 'status', v)} />
              </IRow>
            </div>

            {/* Pricing group */}
            <SubGroup label="Pricing" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ borderRight: `1px solid ${T.rowBdr}` }}>
                <IRow label={`Cost (${cur})`}>
                  <Inp value={day.hotel.costPrice} onChange={v => updateHotel(activeDay, 'costPrice', Number(v))} type="number" placeholder="0.00" style={{ width: 100 }} />
                </IRow>
              </div>
              <IRow label={`Sell (${cur})`}>
                <Inp value={day.hotel.sellPrice} onChange={v => updateHotel(activeDay, 'sellPrice', Number(v))} type="number" placeholder="0.00" style={{ width: 100 }} />
              </IRow>
            </div>
            <MarginLine cost={day.hotel.costPrice} sell={day.hotel.sellPrice} cur={cur} />

            {/* Notes */}
            <SubGroup label="Notes" />
            <IRow label="Special Requests">
              <Inp value={day.hotel.notes} onChange={v => updateHotel(activeDay, 'notes', v)} placeholder="Special requests, meal plan, VIP preferences…" />
            </IRow>
          </div>

          {/* ── Transfers ── */}
          <div style={sectionStyle}>
            <SHead
              icon={<Car size={12} strokeWidth={2} />}
              label="Transfers"
              action={<AddBtn onClick={() => addTransfer(activeDay)} label="Add Transfer" />}
            />

            {day.transfers.length === 0 && (
              <div style={{ padding: '12px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Car size={13} strokeWidth={1.5} color="#CCCCCC" />
                <span style={{ fontSize: 12, color: '#BBBBBB', fontStyle: 'italic' }}>No transfers added for this day.</span>
              </div>
            )}

            {day.transfers.map((tx, ti) => (
              <div key={tx.id} style={{ borderBottom: `1px solid ${T.border2}` }}>
                {/* Transfer row header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 10px 5px 0',
                  background: '#F5F5F5',
                  borderLeft: `3px solid #059669`,
                  borderBottom: tx.expanded ? `1px solid ${T.border}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 8 }}>
                    <CollapseBtn expanded={tx.expanded} onClick={() => updateTransfer(activeDay, ti, 'expanded', !tx.expanded)} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>
                      Transfer {ti + 1}
                    </span>
                    {(tx.from || tx.to) && (
                      <span style={{
                        fontSize: 11, color: T.muted,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <span style={{ color: T.border }}>·</span>
                        <span>{tx.from || '—'}</span>
                        <span style={{ color: '#AAAAAA' }}>→</span>
                        <span>{tx.to || '—'}</span>
                      </span>
                    )}
                    {tx.time && (
                      <span style={{ fontSize: 10, color: T.muted, background: T.border2, borderRadius: 3, padding: '1px 5px' }}>
                        {tx.time}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StatusPill status={tx.status} onChange={v => updateTransfer(activeDay, ti, 'status', v)} />
                    <RemoveBtn onClick={() => removeTransfer(activeDay, ti)} />
                  </div>
                </div>

                {tx.expanded && (
                  <>
                    <SubGroup label="Route" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr' }}>
                      <div style={{ borderRight: `1px solid ${T.rowBdr}` }}>
                        <IRow label="Pickup Time">
                          <Inp value={tx.time} onChange={v => updateTransfer(activeDay, ti, 'time', v)} placeholder="09:00" style={{ width: 64 }} />
                        </IRow>
                      </div>
                      <div style={{ borderRight: `1px solid ${T.rowBdr}` }}>
                        <IRow label="From">
                          <Inp value={tx.from} onChange={v => updateTransfer(activeDay, ti, 'from', v)} placeholder="e.g. Airport" />
                        </IRow>
                      </div>
                      <IRow label="To">
                        <Inp value={tx.to} onChange={v => updateTransfer(activeDay, ti, 'to', v)} placeholder="e.g. Galle Fort Hotel" />
                      </IRow>
                    </div>
                    <SubGroup label="Vehicle & Crew" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.5fr' }}>
                      <div style={{ borderRight: `1px solid ${T.rowBdr}` }}>
                        <IRow label="Vehicle">
                          <select
                            value={tx.vehicle}
                            onChange={e => updateTransfer(activeDay, ti, 'vehicle', e.target.value)}
                            style={{ ...selectStyle, flex: 1 }}
                            onFocus={e => (e.currentTarget.style.borderColor = T.primary)}
                            onBlur={e  => (e.currentTarget.style.borderColor = T.inputBorder)}
                          >
                            {['Private Car', 'Van', 'Minibus', 'Coach', 'Tuk Tuk', 'Boat', 'Seaplane'].map(v => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        </IRow>
                      </div>
                      <div style={{ borderRight: `1px solid ${T.rowBdr}` }}>
                        <IRow label="Driver / Operator">
                          <Inp value={tx.driver} onChange={v => updateTransfer(activeDay, ti, 'driver', v)} placeholder="Name or company" />
                        </IRow>
                      </div>
                      <IRow label="Flight / Vessel #">
                        <Inp value={tx.flight} onChange={v => updateTransfer(activeDay, ti, 'flight', v)} placeholder="e.g. UL123" />
                      </IRow>
                    </div>
                    <SubGroup label="Instructions" />
                    <IRow label="Notes">
                      <Inp value={tx.notes} onChange={v => updateTransfer(activeDay, ti, 'notes', v)} placeholder="Meet-and-greet, signboard name, special instructions…" />
                    </IRow>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* ── Activities ── */}
          <div style={sectionStyle}>
            <SHead
              icon={<Compass size={12} strokeWidth={2} />}
              label="Activities"
              action={<AddBtn onClick={() => addActivity(activeDay)} label="Add Activity" />}
            />

            {day.activities.length === 0 && (
              <div style={{ padding: '12px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Compass size={13} strokeWidth={1.5} color="#CCCCCC" />
                <span style={{ fontSize: 12, color: '#BBBBBB', fontStyle: 'italic' }}>No activities added for this day.</span>
              </div>
            )}

            {day.activities.map((act, ai) => (
              <div key={act.id} style={{ borderBottom: `1px solid ${T.border2}` }}>
                {/* Activity row header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 10px 5px 0',
                  background: '#F5F5F5',
                  borderLeft: `3px solid #D97706`,
                  borderBottom: act.expanded ? `1px solid ${T.border}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 8 }}>
                    <CollapseBtn expanded={act.expanded} onClick={() => updateActivity(activeDay, ai, 'expanded', !act.expanded)} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>
                      {act.title || `Activity ${ai + 1}`}
                    </span>
                    {act.time && (
                      <span style={{ fontSize: 10, color: T.muted, background: T.border2, borderRadius: 3, padding: '1px 5px' }}>
                        {act.time}{act.endTime ? ` – ${act.endTime}` : ''}
                      </span>
                    )}
                    {act.location && (
                      <span style={{ fontSize: 11, color: T.muted }}>
                        <span style={{ color: T.border }}>·</span> {act.location}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StatusPill status={act.status} onChange={v => updateActivity(activeDay, ai, 'status', v)} />
                    <RemoveBtn onClick={() => removeActivity(activeDay, ai)} />
                  </div>
                </div>

                {act.expanded && (
                  <>
                    <SubGroup label="Schedule" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr' }}>
                      <div style={{ borderRight: `1px solid ${T.rowBdr}` }}>
                        <IRow label="Start Time">
                          <Inp value={act.time} onChange={v => updateActivity(activeDay, ai, 'time', v)} placeholder="09:00" style={{ width: 64 }} />
                        </IRow>
                      </div>
                      <div style={{ borderRight: `1px solid ${T.rowBdr}` }}>
                        <IRow label="End Time">
                          <Inp value={act.endTime} onChange={v => updateActivity(activeDay, ai, 'endTime', v)} placeholder="11:00" style={{ width: 64 }} />
                        </IRow>
                      </div>
                      <IRow label="Location">
                        <Inp value={act.location} onChange={v => updateActivity(activeDay, ai, 'location', v)} placeholder="e.g. Sigiriya" />
                      </IRow>
                    </div>
                    <SubGroup label="Details" />
                    <IRow label="Activity Title" required>
                      <Inp value={act.title} onChange={v => updateActivity(activeDay, ai, 'title', v)} placeholder="e.g. Sigiriya Rock Fortress Climb" />
                    </IRow>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                      <div style={{ borderRight: `1px solid ${T.rowBdr}` }}>
                        <IRow label="Supplier">
                          <Inp value={act.supplier} onChange={v => updateActivity(activeDay, ai, 'supplier', v)} placeholder="Supplier or operator" />
                        </IRow>
                      </div>
                      <IRow label="Guide Assigned">
                        <Inp value={act.guide} onChange={v => updateActivity(activeDay, ai, 'guide', v)} placeholder="Guide name" />
                      </IRow>
                    </div>
                    <IRow label="Description">
                      <Inp value={act.description} onChange={v => updateActivity(activeDay, ai, 'description', v)} placeholder="What the client will experience…" />
                    </IRow>
                    <SubGroup label="Pricing" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                      <div style={{ borderRight: `1px solid ${T.rowBdr}` }}>
                        <IRow label={`Cost (${cur})`}>
                          <Inp value={act.costPrice} onChange={v => updateActivity(activeDay, ai, 'costPrice', Number(v))} type="number" placeholder="0.00" style={{ width: 100 }} />
                        </IRow>
                      </div>
                      <IRow label={`Sell (${cur})`}>
                        <Inp value={act.sellPrice} onChange={v => updateActivity(activeDay, ai, 'sellPrice', Number(v))} type="number" placeholder="0.00" style={{ width: 100 }} />
                      </IRow>
                    </div>
                    <MarginLine cost={act.costPrice} sell={act.sellPrice} cur={cur} />
                  </>
                )}
              </div>
            ))}
          </div>

          {/* ── Meals & Operations (merged) ── */}
          <div style={sectionStyle}>
            <SHead icon={<Utensils size={12} strokeWidth={2} />} label="Meals &amp; Operations" />

            <SubGroup label="Meals Included" />
            <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 20, borderBottom: `1px solid ${T.rowBdr}` }}>
              {['Breakfast', 'Lunch', 'Dinner'].map(meal => (
                <label key={meal} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: T.label }}>
                  <input
                    type="checkbox"
                    checked={day.meals.includes(meal)}
                    onChange={() => toggleMeal(activeDay, meal)}
                    style={{ accentColor: T.primary, width: 13, height: 13 }}
                  />
                  {meal}
                </label>
              ))}
            </div>

            <SubGroup label="Guide &amp; Internal Notes" />
            <IRow label="Guide Assigned">
              <Inp value={day.guide} onChange={v => updateDay(activeDay, 'guide', v)} placeholder="Guide name" />
            </IRow>
            <IRow label="Ops Notes">
              <Inp value={day.notes} onChange={v => updateDay(activeDay, 'notes', v)} placeholder="Internal operations instructions…" />
            </IRow>
          </div>

          {/* ── Prev / Next ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0 20px' }}>
            <TBtn
              label="← Previous Day"
              onClick={() => setActiveDay(i => i - 1)}
              disabled={activeDay === 0}
            />
            <span style={{ fontSize: 11, color: T.muted }}>
              Day {activeDay + 1} of {days.length}
            </span>
            <TBtn
              label="Next Day →"
              primary
              onClick={() => setActiveDay(i => i + 1)}
              disabled={activeDay === days.length - 1}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
