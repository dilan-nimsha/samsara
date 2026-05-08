'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import TopBar from '@/components/layout/TopBar';
import {
  Search, Plus, Download, RefreshCw, Filter,
  ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown,
  Edit2, Trash2, Copy, MoreHorizontal, CheckCircle, AlertCircle,
  Clock, Tag, CalendarRange, Building2, Percent, FileX,
  CreditCard, ListChecks, Calculator, TrendingUp, Hotel, Car,
  Compass, Utensils, UserCheck,
} from 'lucide-react';

// ── Design tokens ─────────────────────────────────────────────────────────────

const T = {
  bg:       '#F0F0F0',
  surface:  '#FFFFFF',
  border:   '#E0E0E0',
  border2:  '#EEEEEE',
  headBg:   '#F5F5F5',
  text:     '#111111',
  muted:    '#888888',
  label:    '#555555',
  primary:  '#1A6FC4',
  gold:     '#C9A84C',
  danger:   '#C43333',
  success:  '#059669',
  warning:  '#D97706',
};

// ── Shared utilities ──────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc';

function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function Th({ children, width, center, sortKey, sortField, sortDir, onSort }: {
  children?: React.ReactNode; width?: number | string; center?: boolean;
  sortKey?: string; sortField?: string; sortDir?: SortDir;
  onSort?: (k: string) => void;
}) {
  const active = sortKey && sortField === sortKey;
  const Icon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th onClick={sortKey && onSort ? () => onSort(sortKey) : undefined} style={{
      padding: '7px 10px', textAlign: center ? 'center' : 'left',
      fontSize: 11, fontWeight: 600, color: active ? T.text : T.muted,
      background: T.headBg, borderBottom: `1px solid ${T.border}`,
      whiteSpace: 'nowrap', cursor: sortKey ? 'pointer' : 'default',
      userSelect: 'none', width: width ?? undefined,
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        {sortKey && <Icon size={10} style={{ opacity: active ? 1 : 0.4 }} />}
      </span>
    </th>
  );
}

function Td({ children, center, muted }: { children: React.ReactNode; center?: boolean; muted?: boolean }) {
  return (
    <td style={{
      padding: '8px 10px', fontSize: 12.5,
      color: muted ? T.muted : T.text,
      borderBottom: `1px solid ${T.border2}`,
      textAlign: center ? 'center' : 'left',
      verticalAlign: 'middle',
    }}>{children}</td>
  );
}

function Badge({ label, color, bg, border }: { label: string; color: string; bg: string; border?: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 600,
      color, background: bg,
      border: `1px solid ${border ?? color + '33'}`,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

function ActionBtn({ icon, label, primary, danger, onClick }: {
  icon: React.ReactNode; label?: string; primary?: boolean; danger?: boolean; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: label ? '6px 12px' : '6px 8px',
      borderRadius: 5, height: 32, cursor: 'pointer',
      fontSize: 12, fontWeight: 600,
      border: primary ? 'none' : `1px solid ${danger ? T.danger + '55' : T.border}`,
      background: primary ? T.primary : danger ? T.danger + '11' : T.surface,
      color: primary ? '#fff' : danger ? T.danger : T.text,
      transition: 'opacity 0.12s',
    }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      {icon}{label}
    </button>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 5, padding: '0 10px', height: 32, minWidth: 240,
    }}>
      <Search size={13} color={T.muted} />
      <input
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search…'}
        style={{ background: 'none', border: 'none', outline: 'none', fontSize: 12.5, color: T.text, flex: 1, fontFamily: 'inherit' }}
      />
      {value && (
        <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: T.muted, display: 'flex' }}>
          ×
        </button>
      )}
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      height: 32, padding: '0 28px 0 10px', borderRadius: 5, border: `1px solid ${T.border}`,
      background: T.surface, color: T.text, fontSize: 12.5, cursor: 'pointer', outline: 'none',
      fontFamily: 'inherit', appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      padding: '12px 16px', background: T.surface,
      borderBottom: `1px solid ${T.border}`,
    }}>{children}</div>
  );
}

function Spacer() { return <div style={{ flex: 1 }} />; }

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        {children}
      </table>
    </div>
  );
}

function RowMenu({ onEdit, onDuplicate, onDelete }: {
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) {
  const [open,       setOpen]       = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);

  function close() { setOpen(false); setDelConfirm(false); }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => { setOpen(p => !p); setDelConfirm(false); }} style={{
        background: 'none', border: 'none', padding: '3px 6px',
        cursor: 'pointer', borderRadius: 3, color: T.muted, display: 'flex',
      }}>
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', zIndex: 50,
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          minWidth: 150, padding: '4px 0',
        }}>
          <button onClick={() => { close(); onEdit?.(); toast.info('Edit form — coming soon'); }} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '7px 12px', background: 'none',
            border: 'none', cursor: 'pointer', fontSize: 12.5,
            color: T.text, fontFamily: 'inherit',
          }}>
            <Edit2 size={13} /> Edit
          </button>
          <button onClick={() => { close(); onDuplicate?.(); }} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '7px 12px', background: 'none',
            border: 'none', cursor: 'pointer', fontSize: 12.5,
            color: T.text, fontFamily: 'inherit',
          }}>
            <Copy size={13} /> Duplicate
          </button>
          <div style={{ height: 1, background: T.border2, margin: '2px 0' }} />
          {delConfirm ? (
            <div style={{ padding: '8px 12px' }}>
              <p style={{ fontSize: 11, color: T.danger, margin: '0 0 8px', fontWeight: 600 }}>Delete this item?</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => { close(); onDelete?.(); }}
                  style={{ flex: 1, padding: '5px 0', background: T.danger, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}
                >
                  Delete
                </button>
                <button
                  onClick={() => setDelConfirm(false)}
                  style={{ flex: 1, padding: '5px 0', background: 'none', border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', color: T.text }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setDelConfirm(true)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '7px 12px', background: 'none',
              border: 'none', cursor: 'pointer', fontSize: 12.5,
              color: T.danger, fontFamily: 'inherit',
            }}>
              <Trash2 size={13} /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MarginPill({ cost, sell }: { cost: number; sell: number }) {
  const margin = sell > 0 ? Math.round(((sell - cost) / sell) * 100) : 0;
  const color = margin >= 30 ? T.success : margin >= 15 ? T.warning : T.danger;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 7px', borderRadius: 4,
      background: color + '18', color, fontSize: 11, fontWeight: 700,
    }}>
      {margin}%
    </span>
  );
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

type Category = 'accommodation' | 'transport' | 'activity' | 'meals' | 'guide';
type RateStatus = 'active' | 'expired' | 'pending';
type SeasonType = 'peak' | 'shoulder' | 'low';

interface ContractedRate {
  id: string; product: string; category: Category; supplier: string;
  costRate: number; sellRate: number; currency: string;
  validFrom: string; validTo: string; status: RateStatus; season: SeasonType;
}

interface SeasonalRate {
  id: string; name: string; dateFrom: string; dateTo: string;
  multiplier: number; categories: Category[]; status: 'active' | 'upcoming' | 'expired'; notes: string;
}

interface SupplierRateCard {
  id: string; supplierName: string; type: Category; products: number;
  currency: string; lastUpdated: string; contractExpiry: string;
  status: RateStatus; rateCardRef: string;
}

interface MarkupRule {
  id: string; category: string; markupPct: number; commissionPct: number;
  base: 'cost' | 'sell'; appliesTo: string; lastModified: string;
}

interface CancellationPolicy {
  id: string; name: string; category: string;
  tiers: { days: number; penalty: number; type: '%' | 'flat' }[];
  appliesTo: string; status: 'active' | 'draft';
}

interface PaymentTerm {
  id: string; name: string; depositPct: number; depositDueDays: number;
  balanceDueDays: number; appliesTo: string; currency: string; status: 'active' | 'draft';
}

interface ServiceInclusion {
  id: string; product: string; category: Category;
  included: string[]; excluded: string[]; notes: string;
}

interface TaxSetting {
  id: string; name: string; rate: number;
  type: 'VAT' | 'Service Charge' | 'Levy' | 'Other';
  appliesTo: Category[]; status: 'active' | 'inactive'; notes: string;
}

const CONTRACTED_RATES_INIT: ContractedRate[] = [
  { id: 'r1',  product: 'Heritance Kandalama — Deluxe Room',      category: 'accommodation', supplier: 'Heritance Hotels',        costRate: 185,  sellRate: 420,  currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',  season: 'peak' },
  { id: 'r2',  product: 'Amanwella — Ocean Suite',                 category: 'accommodation', supplier: 'Aman Resorts',            costRate: 480,  sellRate: 950,  currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',  season: 'peak' },
  { id: 'r3',  product: 'Cinnamon Grand — Superior Room',          category: 'accommodation', supplier: 'Cinnamon Hotels',         costRate: 125,  sellRate: 280,  currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',  season: 'shoulder' },
  { id: 'r4',  product: 'Fortress Resort & Spa — Beach Villa',     category: 'accommodation', supplier: 'Fortress Resort',         costRate: 350,  sellRate: 780,  currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',  season: 'peak' },
  { id: 'r5',  product: 'Wild Coast Tented Lodge — Suite',         category: 'accommodation', supplier: 'Wild Coast Lodge',        costRate: 410,  sellRate: 870,  currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',  season: 'peak' },
  { id: 'r6',  product: '98 Acres Resort — Hill View Room',        category: 'accommodation', supplier: '98 Acres Resort',         costRate: 145,  sellRate: 310,  currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',  season: 'shoulder' },
  { id: 'r7',  product: 'Airport CMB → Colombo — Sedan',           category: 'transport',     supplier: 'Island Transfers Ltd',   costRate: 28,   sellRate: 65,   currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',  season: 'peak' },
  { id: 'r8',  product: 'Colombo → Sigiriya — KDH Van',            category: 'transport',     supplier: 'Island Transfers Ltd',   costRate: 85,   sellRate: 180,  currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',  season: 'peak' },
  { id: 'r9',  product: 'Sigiriya → Kandy — Sedan',                category: 'transport',     supplier: 'Lanka Road Travels',     costRate: 45,   sellRate: 95,   currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',  season: 'peak' },
  { id: 'r10', product: 'Galle Fort → Mirissa — Tuk-tuk',          category: 'transport',     supplier: 'Southern Tuk Tours',     costRate: 12,   sellRate: 35,   currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',  season: 'shoulder' },
  { id: 'r11', product: 'Kandy → Nuwara Eliya — Mini Coach',        category: 'transport',     supplier: 'Hill Country Coach Co.', costRate: 160,  sellRate: 340,  currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',  season: 'peak' },
  { id: 'r12', product: 'Sigiriya Rock Fortress — Entry & Guide',   category: 'activity',      supplier: 'Sigiriya Site Auth.',    costRate: 32,   sellRate: 85,   currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',  season: 'peak' },
  { id: 'r13', product: 'Yala National Park — Half-day Safari',     category: 'activity',      supplier: 'Yala Safari Operators',  costRate: 55,   sellRate: 145,  currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',  season: 'peak' },
  { id: 'r14', product: 'Whale Watching Mirissa — Shared Boat',     category: 'activity',      supplier: 'Mirissa Water Sports',   costRate: 42,   sellRate: 110,  currency: 'USD', validFrom: '2026-01-01', validTo: '2026-04-30', status: 'active',  season: 'peak' },
  { id: 'r15', product: 'Cooking Class — Colombo Heritage Kitchen', category: 'activity',      supplier: 'Urban Table Ltd',        costRate: 35,   sellRate: 90,   currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',  season: 'shoulder' },
  { id: 'r16', product: 'Hot Air Balloon — Sigiriya Sunrise',       category: 'activity',      supplier: 'Balloon Adventures SL',  costRate: 180,  sellRate: 380,  currency: 'USD', validFrom: '2026-01-01', validTo: '2026-04-30', status: 'active',  season: 'peak' },
  { id: 'r17', product: 'English-Speaking Guide — Per Day',          category: 'guide',         supplier: 'Samsara Guide Network',  costRate: 65,   sellRate: 150,  currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',  season: 'peak' },
  { id: 'r18', product: 'Specialist Wildlife Guide — Per Day',       category: 'guide',         supplier: 'Samsara Guide Network',  costRate: 95,   sellRate: 220,  currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',  season: 'peak' },
  { id: 'r19', product: 'Set Dinner — Beach Restaurant Mirissa',    category: 'meals',         supplier: 'Coconut Grove Restaurant', costRate: 28, sellRate: 72,   currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',  season: 'peak' },
  { id: 'r20', product: 'Tea Plucking Experience — Nuwara Eliya',   category: 'activity',      supplier: 'Pedro Tea Estate',       costRate: 22,   sellRate: 58,   currency: 'USD', validFrom: '2025-01-01', validTo: '2025-12-31', status: 'expired', season: 'shoulder' },
];

const SEASONAL_RATES_INIT: SeasonalRate[] = [
  { id: 's1', name: 'Peak South Season',  dateFrom: '2026-12-01', dateTo: '2027-03-31', multiplier: 1.35, categories: ['accommodation', 'activity', 'transport'], status: 'upcoming', notes: 'High demand — south coast and cultural triangle' },
  { id: 's2', name: 'South Peak 2026',    dateFrom: '2026-01-01', dateTo: '2026-04-30', multiplier: 1.35, categories: ['accommodation', 'activity', 'transport'], status: 'active',   notes: 'Jan–Apr south coast peak; whale watching season' },
  { id: 's3', name: 'East Coast Peak',    dateFrom: '2026-06-01', dateTo: '2026-09-30', multiplier: 1.20, categories: ['accommodation', 'activity'],               status: 'upcoming', notes: 'Trincomalee and Arugam Bay peak season' },
  { id: 's4', name: 'Shoulder Q2 2026',   dateFrom: '2026-04-15', dateTo: '2026-05-31', multiplier: 1.00, categories: ['accommodation', 'transport'],               status: 'upcoming', notes: 'Transition period — standard rates apply' },
  { id: 's5', name: 'Low Season Monsoon', dateFrom: '2026-09-01', dateTo: '2026-10-15', multiplier: 0.80, categories: ['accommodation'],                            status: 'upcoming', notes: 'Monsoon period — discounted accommodation only' },
  { id: 's6', name: 'Christmas & New Year', dateFrom: '2025-12-20', dateTo: '2026-01-05', multiplier: 1.50, categories: ['accommodation', 'activity', 'meals', 'transport'], status: 'expired', notes: 'Festive surcharge across all categories' },
];

const SUPPLIER_RATES_INIT: SupplierRateCard[] = [
  { id: 'sr1',  supplierName: 'Heritance Hotels',         type: 'accommodation', products: 8,  currency: 'USD', lastUpdated: '2026-01-10', contractExpiry: '2026-12-31', status: 'active',  rateCardRef: 'RC-HH-2026' },
  { id: 'sr2',  supplierName: 'Aman Resorts',             type: 'accommodation', products: 3,  currency: 'USD', lastUpdated: '2026-01-05', contractExpiry: '2026-12-31', status: 'active',  rateCardRef: 'RC-AR-2026' },
  { id: 'sr3',  supplierName: 'Cinnamon Hotels',          type: 'accommodation', products: 12, currency: 'USD', lastUpdated: '2026-01-08', contractExpiry: '2026-12-31', status: 'active',  rateCardRef: 'RC-CH-2026' },
  { id: 'sr4',  supplierName: 'Wild Coast Lodge',         type: 'accommodation', products: 4,  currency: 'USD', lastUpdated: '2026-01-12', contractExpiry: '2026-12-31', status: 'active',  rateCardRef: 'RC-WC-2026' },
  { id: 'sr5',  supplierName: 'Island Transfers Ltd',     type: 'transport',     products: 24, currency: 'USD', lastUpdated: '2026-01-03', contractExpiry: '2026-12-31', status: 'active',  rateCardRef: 'RC-IT-2026' },
  { id: 'sr6',  supplierName: 'Lanka Road Travels',       type: 'transport',     products: 18, currency: 'USD', lastUpdated: '2026-01-03', contractExpiry: '2026-06-30', status: 'active',  rateCardRef: 'RC-LR-2026' },
  { id: 'sr7',  supplierName: 'Hill Country Coach Co.',   type: 'transport',     products: 9,  currency: 'USD', lastUpdated: '2025-12-20', contractExpiry: '2026-03-31', status: 'active',  rateCardRef: 'RC-HC-2026' },
  { id: 'sr8',  supplierName: 'Yala Safari Operators',    type: 'activity',      products: 6,  currency: 'USD', lastUpdated: '2026-01-15', contractExpiry: '2026-12-31', status: 'active',  rateCardRef: 'RC-YS-2026' },
  { id: 'sr9',  supplierName: 'Mirissa Water Sports',     type: 'activity',      products: 5,  currency: 'USD', lastUpdated: '2025-10-01', contractExpiry: '2026-04-30', status: 'active',  rateCardRef: 'RC-MW-2025' },
  { id: 'sr10', supplierName: 'Balloon Adventures SL',  type: 'activity',      products: 2,  currency: 'USD', lastUpdated: '2025-09-01', contractExpiry: '2026-04-30', status: 'active',  rateCardRef: 'RC-BA-2025' },
  { id: 'sr11', supplierName: 'Samsara Guide Network',  type: 'guide',         products: 14, currency: 'USD', lastUpdated: '2026-01-01', contractExpiry: '2026-12-31', status: 'active',  rateCardRef: 'RC-SG-2026' },
  { id: 'sr12', supplierName: 'Pedro Tea Estate',        type: 'activity',      products: 3,  currency: 'USD', lastUpdated: '2024-11-15', contractExpiry: '2025-12-31', status: 'expired', rateCardRef: 'RC-PT-2024' },
];

const MARKUP_RULES_INIT: MarkupRule[] = [
  { id: 'm1',  category: 'Accommodation — Luxury (5★)',     markupPct: 35, commissionPct: 10, base: 'cost', appliesTo: 'All 5-star properties',      lastModified: '2026-01-10' },
  { id: 'm2',  category: 'Accommodation — Premium (4★)',    markupPct: 40, commissionPct: 10, base: 'cost', appliesTo: 'All 4-star properties',      lastModified: '2026-01-10' },
  { id: 'm3',  category: 'Accommodation — Standard (3★)',   markupPct: 45, commissionPct: 12, base: 'cost', appliesTo: 'All 3-star properties',      lastModified: '2026-01-10' },
  { id: 'm4',  category: 'Transport — Private Sedan/SUV',   markupPct: 55, commissionPct: 8,  base: 'cost', appliesTo: 'All private transfers',       lastModified: '2026-01-08' },
  { id: 'm5',  category: 'Transport — Group Van/Coach',     markupPct: 50, commissionPct: 8,  base: 'cost', appliesTo: 'Van, mini-coach, coach',      lastModified: '2026-01-08' },
  { id: 'm6',  category: 'Activities — Wildlife & Safari',  markupPct: 60, commissionPct: 12, base: 'cost', appliesTo: 'Yala, Udawalawe, Minneriya', lastModified: '2026-01-05' },
  { id: 'm7',  category: 'Activities — Cultural & Heritage',markupPct: 62, commissionPct: 12, base: 'cost', appliesTo: 'Sigiriya, temples, forts',    lastModified: '2026-01-05' },
  { id: 'm8',  category: 'Activities — Water Sports',       markupPct: 58, commissionPct: 10, base: 'cost', appliesTo: 'Surfing, diving, snorkeling', lastModified: '2026-01-05' },
  { id: 'm9',  category: 'Guide Services',                   markupPct: 55, commissionPct: 0,  base: 'cost', appliesTo: 'All licensed guides',         lastModified: '2026-01-01' },
  { id: 'm10', category: 'Meals & Dining',                  markupPct: 60, commissionPct: 10, base: 'cost', appliesTo: 'All included meals',          lastModified: '2026-01-01' },
  { id: 'm11', category: 'Partner Agency Commission',        markupPct: 0,  commissionPct: 12, base: 'sell', appliesTo: 'All B2B partner bookings',   lastModified: '2026-01-15' },
];

const CANCELLATION_POLICIES_INIT: CancellationPolicy[] = [
  { id: 'cp1', name: 'Standard Leisure Policy',    category: 'All',           tiers: [{ days: 60, penalty: 0, type: '%' }, { days: 45, penalty: 25, type: '%' }, { days: 30, penalty: 50, type: '%' }, { days: 14, penalty: 75, type: '%' }, { days: 0, penalty: 100, type: '%' }], appliesTo: 'All standard leisure bookings', status: 'active' },
  { id: 'cp2', name: 'Luxury Property Policy',     category: 'Accommodation', tiers: [{ days: 90, penalty: 0, type: '%' }, { days: 60, penalty: 30, type: '%' }, { days: 30, penalty: 60, type: '%' }, { days: 0, penalty: 100, type: '%' }], appliesTo: 'All 5-star & luxury lodge bookings', status: 'active' },
  { id: 'cp3', name: 'Festive Period Policy',      category: 'All',           tiers: [{ days: 90, penalty: 25, type: '%' }, { days: 60, penalty: 50, type: '%' }, { days: 30, penalty: 100, type: '%' }], appliesTo: 'Dec 20 – Jan 10 arrivals only', status: 'active' },
  { id: 'cp4', name: 'Activity & Transfer Policy', category: 'Activity',      tiers: [{ days: 14, penalty: 0, type: '%' }, { days: 7, penalty: 50, type: '%' }, { days: 0, penalty: 100, type: '%' }], appliesTo: 'Safaris, balloon, whale watching', status: 'active' },
  { id: 'cp5', name: 'Corporate & MICE Policy',    category: 'All',           tiers: [{ days: 30, penalty: 0, type: '%' }, { days: 14, penalty: 25, type: '%' }, { days: 7, penalty: 50, type: '%' }, { days: 0, penalty: 75, type: '%' }], appliesTo: 'All corporate and incentive groups', status: 'active' },
  { id: 'cp6', name: 'Group 10+ Policy (Draft)',   category: 'All',           tiers: [{ days: 60, penalty: 10, type: '%' }, { days: 30, penalty: 40, type: '%' }, { days: 0, penalty: 100, type: '%' }], appliesTo: 'Groups of 10 or more pax', status: 'draft' },
];

const PAYMENT_TERMS_INIT: PaymentTerm[] = [
  { id: 'pt1', name: 'Standard 30/70',          depositPct: 30,  depositDueDays: 3,  balanceDueDays: 45,  appliesTo: 'All leisure bookings', currency: 'USD', status: 'active' },
  { id: 'pt2', name: 'Luxury 50/50',            depositPct: 50,  depositDueDays: 2,  balanceDueDays: 60,  appliesTo: 'Luxury & 5-star properties', currency: 'USD', status: 'active' },
  { id: 'pt3', name: 'Festive Full Prepayment', depositPct: 100, depositDueDays: 1,  balanceDueDays: 0,   appliesTo: 'Dec 20 – Jan 10 arrivals', currency: 'USD', status: 'active' },
  { id: 'pt4', name: 'Partner Agency NET 30',   depositPct: 0,   depositDueDays: 0,  balanceDueDays: -30, appliesTo: 'All B2B agency bookings', currency: 'USD', status: 'active' },
  { id: 'pt5', name: 'Corporate NET 45',        depositPct: 0,   depositDueDays: 0,  balanceDueDays: -45, appliesTo: 'Corporate & MICE bookings', currency: 'USD', status: 'active' },
  { id: 'pt6', name: 'Last-Minute Full Pay',    depositPct: 100, depositDueDays: 1,  balanceDueDays: 0,   appliesTo: 'Bookings within 14 days of arrival', currency: 'USD', status: 'active' },
];

const SERVICE_INCLUSIONS_INIT: ServiceInclusion[] = [
  { id: 'si1', product: 'Standard Tour Package',          category: 'activity',      included: ['English-speaking guide', 'Entrance fees', 'All transfers', 'Bottled water', 'First aid kit'], excluded: ['Meals (unless stated)', 'Personal expenses', 'Gratuities', 'Travel insurance'], notes: 'Applies to all day-tour products' },
  { id: 'si2', product: 'Accommodation — All properties', category: 'accommodation', included: ['Room as specified', 'Breakfast (BB plan)', 'Wi-Fi', 'Welcome fruit basket'], excluded: ['Mini-bar', 'Spa treatments', 'Laundry', 'Room service', 'Alcohol'], notes: 'HB and FB plans include additional meals' },
  { id: 'si3', product: 'Private Transfers',              category: 'transport',     included: ['A/C vehicle', 'English-speaking driver', 'Fuel', 'Road tolls'], excluded: ['Entrance fees at destinations', 'Meals', 'Overnight stops'], notes: 'All private hire rates include driver accommodation' },
  { id: 'si4', product: 'Safari — Yala National Park',   category: 'activity',      included: ['Park entrance fee', 'Jeep hire', 'Tracker', 'Binoculars'], excluded: ['Personal guide supplement', 'Photography fees', 'Meals', 'Tips'], notes: 'Early morning & afternoon sessions available' },
  { id: 'si5', product: 'Whale Watching Mirissa',         category: 'activity',      included: ['Boat charter (shared)', 'Life jackets', 'On-board snacks & water'], excluded: ['Transfers to harbour', 'Seasickness medication', 'GoPro hire'], notes: 'Seasonal — Nov to Apr only. No-sighting refund policy applies.' },
  { id: 'si6', product: 'Guide Services — Licensed',      category: 'guide',         included: ['Guiding services', 'Knowledge & expertise', 'Entrance accompaniment'], excluded: ['Entrance fees (client pays)', 'Transport', 'Meals'], notes: 'All guides hold SLTDA certification' },
];

const TAX_SETTINGS_INIT: TaxSetting[] = [
  { id: 'tx1', name: 'Sri Lanka VAT',              rate: 18, type: 'VAT',            appliesTo: ['accommodation', 'meals', 'activity'], status: 'active',   notes: 'Standard VAT rate as of 2024 budget revision' },
  { id: 'tx2', name: 'Service Charge',             rate: 10, type: 'Service Charge', appliesTo: ['accommodation', 'meals'],              status: 'active',   notes: 'Applied on top of VAT at most 4★ and 5★ properties' },
  { id: 'tx3', name: 'Tourism Development Levy',   rate: 1,  type: 'Levy',           appliesTo: ['accommodation'],                       status: 'active',   notes: 'Per-room per-night levy; applies to all graded hotels' },
  { id: 'tx4', name: 'Airport Departure Tax',      rate: 0,  type: 'Other',          appliesTo: ['transport'],                           status: 'active',   notes: 'Flat USD 15 per person — not percentage-based. Included in flight cost.' },
  { id: 'tx5', name: 'Wildlife Conservation Fee',  rate: 0,  type: 'Levy',           appliesTo: ['activity'],                            status: 'active',   notes: 'Per-vehicle per-entry fee at national parks. Not a percentage.' },
  { id: 'tx6', name: 'UK VAT (Outbound)',          rate: 20, type: 'VAT',            appliesTo: ['accommodation', 'activity', 'transport', 'meals'], status: 'inactive', notes: 'Applies only if Samsara invoices UK-based agents directly' },
];

// ── Tab configuration ─────────────────────────────────────────────────────────

type TabKey = 'contracted' | 'seasonal' | 'supplier' | 'markups' | 'cancellation' | 'payment' | 'inclusions' | 'tax';

const TABS: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
  { key: 'contracted',   label: 'Contracted Rates',          icon: <Tag         size={13} /> },
  { key: 'seasonal',     label: 'Seasonal Pricing',          icon: <CalendarRange size={13} /> },
  { key: 'supplier',     label: 'Supplier Rates',            icon: <Building2   size={13} /> },
  { key: 'markups',      label: 'Markups & Commissions',     icon: <Percent     size={13} /> },
  { key: 'cancellation', label: 'Cancellation Policies',     icon: <FileX       size={13} /> },
  { key: 'payment',      label: 'Payment Terms',             icon: <CreditCard  size={13} /> },
  { key: 'inclusions',   label: 'Inclusions / Exclusions',   icon: <ListChecks  size={13} /> },
  { key: 'tax',          label: 'Tax Settings',              icon: <Calculator  size={13} /> },
];

// ── Category config ───────────────────────────────────────────────────────────

const CAT_CFG: Record<Category, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  accommodation: { label: 'Accommodation', color: '#1D4ED8', bg: '#DBEAFE', icon: <Hotel      size={11} /> },
  transport:     { label: 'Transport',     color: '#6D28D9', bg: '#EDE9FE', icon: <Car        size={11} /> },
  activity:      { label: 'Activity',      color: '#065F46', bg: '#D1FAE5', icon: <Compass    size={11} /> },
  meals:         { label: 'Meals',         color: '#9D174D', bg: '#FCE7F3', icon: <Utensils   size={11} /> },
  guide:         { label: 'Guide',         color: '#92400E', bg: '#FEF3C7', icon: <UserCheck  size={11} /> },
};

const STATUS_CFG: Record<RateStatus, { label: string; color: string; bg: string }> = {
  active:  { label: 'Active',  color: '#065F46', bg: '#D1FAE5' },
  expired: { label: 'Expired', color: '#6B7280', bg: '#F3F4F6' },
  pending: { label: 'Pending', color: '#D97706', bg: '#FEF3C7' },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

// ── Tab content components ────────────────────────────────────────────────────

function ContractedRatesTab() {
  const [data,         setData]         = useState(CONTRACTED_RATES_INIT);
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [seasonFilter, setSeasonFilter] = useState('all');
  const [sortField,    setSortField]    = useState('product');
  const [sortDir,      setSortDir]      = useState<SortDir>('asc');

  function toggleSort(f: string) {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('asc'); }
  }

  const rows = useMemo(() => {
    let r = data;
    if (search) r = r.filter(x => x.product.toLowerCase().includes(search.toLowerCase()) || x.supplier.toLowerCase().includes(search.toLowerCase()));
    if (catFilter !== 'all') r = r.filter(x => x.category === catFilter);
    if (statusFilter !== 'all') r = r.filter(x => x.status === statusFilter);
    if (seasonFilter !== 'all') r = r.filter(x => x.season === seasonFilter);
    return [...r].sort((a, b) => {
      const av = sortField === 'sellRate' ? a.sellRate : sortField === 'costRate' ? a.costRate : (a as any)[sortField] ?? '';
      const bv = sortField === 'sellRate' ? b.sellRate : sortField === 'costRate' ? b.costRate : (b as any)[sortField] ?? '';
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, search, catFilter, statusFilter, seasonFilter, sortField, sortDir]);

  function handleExport() {
    exportCSV('contracted-rates.csv',
      ['Product', 'Category', 'Supplier', 'Cost Rate', 'Sell Rate', 'Currency', 'Valid From', 'Valid To', 'Season', 'Status'],
      data.map(r => [r.product, r.category, r.supplier, String(r.costRate), String(r.sellRate), r.currency, r.validFrom, r.validTo, r.season, r.status])
    );
    toast.success('Exported contracted-rates.csv');
  }

  return (
    <div>
      <Toolbar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search product or supplier…" />
        <Select value={catFilter} onChange={setCatFilter} options={[{ value: 'all', label: 'All Categories' }, ...Object.entries(CAT_CFG).map(([k, v]) => ({ value: k, label: v.label }))]} />
        <Select value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: 'All Status' }, { value: 'active', label: 'Active' }, { value: 'expired', label: 'Expired' }, { value: 'pending', label: 'Pending' }]} />
        <Select value={seasonFilter} onChange={setSeasonFilter} options={[{ value: 'all', label: 'All Seasons' }, { value: 'peak', label: 'Peak' }, { value: 'shoulder', label: 'Shoulder' }, { value: 'low', label: 'Low' }]} />
        <Spacer />
        <ActionBtn icon={<Download size={13} />} label="Export" onClick={handleExport} />
        <ActionBtn icon={<Plus size={13} />} label="Add Rate" primary onClick={() => toast.info('Add Rate — form coming soon')} />
      </Toolbar>
      <Table>
        <thead>
          <tr>
            <Th sortKey="product"   sortField={sortField} sortDir={sortDir} onSort={toggleSort}>Product / Service</Th>
            <Th width={120}>Category</Th>
            <Th sortKey="supplier"  sortField={sortField} sortDir={sortDir} onSort={toggleSort}>Supplier</Th>
            <Th sortKey="costRate"  sortField={sortField} sortDir={sortDir} onSort={toggleSort} center width={90}>Cost Rate</Th>
            <Th sortKey="sellRate"  sortField={sortField} sortDir={sortDir} onSort={toggleSort} center width={90}>Sell Rate</Th>
            <Th center width={80}>Margin</Th>
            <Th width={90}>Valid From</Th>
            <Th width={90}>Valid To</Th>
            <Th width={80}>Season</Th>
            <Th center width={80}>Status</Th>
            <Th center width={40}></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const cat = CAT_CFG[r.category];
            const st  = STATUS_CFG[r.status];
            return (
              <tr key={r.id} style={{ background: T.surface }} onMouseEnter={e => (e.currentTarget.style.background = '#F8F8F8')} onMouseLeave={e => (e.currentTarget.style.background = T.surface)}>
                <Td><span style={{ fontWeight: 500 }}>{r.product}</span></Td>
                <Td><Badge label={cat.label} color={cat.color} bg={cat.bg} /></Td>
                <Td muted>{r.supplier}</Td>
                <Td center><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.currency} {r.costRate.toLocaleString()}</span></Td>
                <Td center><span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{r.currency} {r.sellRate.toLocaleString()}</span></Td>
                <Td center><MarginPill cost={r.costRate} sell={r.sellRate} /></Td>
                <Td muted>{fmtDate(r.validFrom)}</Td>
                <Td muted>{fmtDate(r.validTo)}</Td>
                <Td>
                  <span style={{ fontSize: 11, fontWeight: 600, color: r.season === 'peak' ? '#1D4ED8' : r.season === 'shoulder' ? T.warning : T.muted, textTransform: 'capitalize' }}>
                    {r.season}
                  </span>
                </Td>
                <Td center><Badge label={st.label} color={st.color} bg={st.bg} /></Td>
                <Td center>
                  <RowMenu
                    onDuplicate={() => { setData(p => [...p, { ...r, id: r.id + '_c', product: r.product + ' (copy)' }]); toast.success('Rate duplicated'); }}
                    onDelete={() => { setData(p => p.filter(x => x.id !== r.id)); toast.success('Rate deleted'); }}
                  />
                </Td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr><td colSpan={11} style={{ padding: '32px', textAlign: 'center', color: T.muted, fontSize: 13 }}>No rates match your filters.</td></tr>
          )}
        </tbody>
      </Table>
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, background: T.headBg, fontSize: 12, color: T.muted }}>
        {rows.length} of {data.length} rates shown
      </div>
    </div>
  );
}

function SeasonalPricingTab() {
  const [data,         setData]         = useState(SEASONAL_RATES_INIT);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const rows = useMemo(() => {
    let r = data;
    if (search) r = r.filter(x => x.name.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'all') r = r.filter(x => x.status === statusFilter);
    return r;
  }, [data, search, statusFilter]);

  const statusCfg = {
    active:   { label: 'Active',   color: T.success, bg: '#D1FAE5' },
    upcoming: { label: 'Upcoming', color: '#1D4ED8', bg: '#DBEAFE' },
    expired:  { label: 'Expired',  color: T.muted,   bg: '#F3F4F6' },
  };

  function handleExport() {
    exportCSV('seasonal-pricing.csv',
      ['Name', 'Date From', 'Date To', 'Multiplier', 'Categories', 'Status', 'Notes'],
      data.map(r => [r.name, r.dateFrom, r.dateTo, String(r.multiplier), r.categories.join(', '), r.status, r.notes])
    );
    toast.success('Exported seasonal-pricing.csv');
  }

  return (
    <div>
      <Toolbar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search season name…" />
        <Select value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: 'All Status' }, { value: 'active', label: 'Active' }, { value: 'upcoming', label: 'Upcoming' }, { value: 'expired', label: 'Expired' }]} />
        <Spacer />
        <ActionBtn icon={<Download size={13} />} label="Export" onClick={handleExport} />
        <ActionBtn icon={<Plus size={13} />} label="Add Season" primary onClick={() => toast.info('Add Season — form coming soon')} />
      </Toolbar>
      <Table>
        <thead>
          <tr>
            <Th>Season Name</Th>
            <Th width={110}>Date From</Th>
            <Th width={110}>Date To</Th>
            <Th center width={100}>Multiplier</Th>
            <Th>Categories Applied</Th>
            <Th center width={90}>Status</Th>
            <Th>Notes</Th>
            <Th center width={40}></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const st = statusCfg[r.status];
            return (
              <tr key={r.id} style={{ background: T.surface }} onMouseEnter={e => (e.currentTarget.style.background = '#F8F8F8')} onMouseLeave={e => (e.currentTarget.style.background = T.surface)}>
                <Td><span style={{ fontWeight: 500 }}>{r.name}</span></Td>
                <Td muted>{fmtDate(r.dateFrom)}</Td>
                <Td muted>{fmtDate(r.dateTo)}</Td>
                <Td center>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                    fontWeight: 700, fontSize: 12, fontFamily: 'monospace',
                    color: r.multiplier >= 1.3 ? '#991B1B' : r.multiplier >= 1 ? '#065F46' : '#1D4ED8',
                    background: r.multiplier >= 1.3 ? '#FEE2E2' : r.multiplier >= 1 ? '#D1FAE5' : '#DBEAFE',
                  }}>
                    ×{r.multiplier.toFixed(2)}
                  </span>
                </Td>
                <Td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {r.categories.map(c => {
                      const cfg = CAT_CFG[c];
                      return <Badge key={c} label={cfg.label} color={cfg.color} bg={cfg.bg} />;
                    })}
                  </div>
                </Td>
                <Td center><Badge label={st.label} color={st.color} bg={st.bg} /></Td>
                <Td muted><span style={{ fontSize: 12 }}>{r.notes}</span></Td>
                <Td center>
                  <RowMenu
                    onDuplicate={() => { setData(p => [...p, { ...r, id: r.id + '_c', name: r.name + ' (copy)' }]); toast.success('Season duplicated'); }}
                    onDelete={() => { setData(p => p.filter(x => x.id !== r.id)); toast.success('Season deleted'); }}
                  />
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, background: T.headBg, fontSize: 12, color: T.muted }}>
        {rows.length} season rules
      </div>
    </div>
  );
}

function SupplierRatesTab() {
  const [data,       setData]       = useState(SUPPLIER_RATES_INIT);
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const rows = useMemo(() => {
    let r = data;
    if (search) r = r.filter(x => x.supplierName.toLowerCase().includes(search.toLowerCase()));
    if (typeFilter !== 'all') r = r.filter(x => x.type === typeFilter);
    return r;
  }, [data, search, typeFilter]);

  function daysToExpiry(d: string) {
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  }

  function handleExport() {
    exportCSV('supplier-rates.csv',
      ['Supplier', 'Type', 'Products', 'Currency', 'Last Updated', 'Contract Expiry', 'Rate Card Ref', 'Status'],
      data.map(r => [r.supplierName, r.type, String(r.products), r.currency, r.lastUpdated, r.contractExpiry, r.rateCardRef, r.status])
    );
    toast.success('Exported supplier-rates.csv');
  }

  return (
    <div>
      <Toolbar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search supplier…" />
        <Select value={typeFilter} onChange={setTypeFilter} options={[{ value: 'all', label: 'All Types' }, ...Object.entries(CAT_CFG).map(([k, v]) => ({ value: k, label: v.label }))]} />
        <Spacer />
        <ActionBtn icon={<Download size={13} />} label="Export" onClick={handleExport} />
        <ActionBtn icon={<Plus size={13} />} label="Add Supplier" primary onClick={() => toast.info('Add Supplier — form coming soon')} />
      </Toolbar>
      <Table>
        <thead>
          <tr>
            <Th>Supplier Name</Th>
            <Th width={130}>Type</Th>
            <Th center width={80}>Products</Th>
            <Th width={80}>Currency</Th>
            <Th width={100}>Last Updated</Th>
            <Th width={130}>Contract Expiry</Th>
            <Th width={110}>Rate Card Ref</Th>
            <Th center width={90}>Status</Th>
            <Th center width={40}></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const cat  = CAT_CFG[r.type];
            const st   = STATUS_CFG[r.status];
            const days = daysToExpiry(r.contractExpiry);
            const expiryColor = days < 0 ? T.danger : days < 60 ? T.warning : T.success;
            return (
              <tr key={r.id} style={{ background: T.surface }} onMouseEnter={e => (e.currentTarget.style.background = '#F8F8F8')} onMouseLeave={e => (e.currentTarget.style.background = T.surface)}>
                <Td><span style={{ fontWeight: 500 }}>{r.supplierName}</span></Td>
                <Td><Badge label={cat.label} color={cat.color} bg={cat.bg} /></Td>
                <Td center><span style={{ fontWeight: 600 }}>{r.products}</span></Td>
                <Td muted>{r.currency}</Td>
                <Td muted>{fmtDate(r.lastUpdated)}</Td>
                <Td>
                  <span style={{ color: expiryColor, fontWeight: 500, fontSize: 12 }}>
                    {fmtDate(r.contractExpiry)}
                    {days >= 0 && days < 60 && <span style={{ color: T.warning, fontSize: 11, marginLeft: 5 }}>({days}d left)</span>}
                    {days < 0 && <span style={{ color: T.danger, fontSize: 11, marginLeft: 5 }}>(Expired)</span>}
                  </span>
                </Td>
                <Td muted><span style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.rateCardRef}</span></Td>
                <Td center><Badge label={st.label} color={st.color} bg={st.bg} /></Td>
                <Td center>
                  <RowMenu
                    onDuplicate={() => { setData(p => [...p, { ...r, id: r.id + '_c', supplierName: r.supplierName + ' (copy)' }]); toast.success('Supplier duplicated'); }}
                    onDelete={() => { setData(p => p.filter(x => x.id !== r.id)); toast.success('Supplier deleted'); }}
                  />
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, background: T.headBg, fontSize: 12, color: T.muted }}>
        {rows.length} supplier rate cards
      </div>
    </div>
  );
}

function MarkupsTab() {
  const [data,   setData]   = useState(MARKUP_RULES_INIT);
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    if (!search) return data;
    return data.filter(x => x.category.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  function handleExport() {
    exportCSV('markup-rules.csv',
      ['Category', 'Markup %', 'Commission %', 'Base', 'Applies To', 'Last Modified'],
      data.map(r => [r.category, String(r.markupPct), String(r.commissionPct), r.base, r.appliesTo, r.lastModified])
    );
    toast.success('Exported markup-rules.csv');
  }

  return (
    <div>
      <Toolbar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search category…" />
        <Spacer />
        <ActionBtn icon={<Download size={13} />} label="Export" onClick={handleExport} />
        <ActionBtn icon={<Plus size={13} />} label="Add Rule" primary onClick={() => toast.info('Add Rule — form coming soon')} />
      </Toolbar>
      <Table>
        <thead>
          <tr>
            <Th>Category / Product Line</Th>
            <Th center width={110}>Markup %</Th>
            <Th center width={120}>Commission %</Th>
            <Th center width={90}>Base</Th>
            <Th>Applies To</Th>
            <Th width={110}>Last Modified</Th>
            <Th center width={40}></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ background: T.surface }} onMouseEnter={e => (e.currentTarget.style.background = '#F8F8F8')} onMouseLeave={e => (e.currentTarget.style.background = T.surface)}>
              <Td><span style={{ fontWeight: 500 }}>{r.category}</span></Td>
              <Td center>
                {r.markupPct > 0 ? (
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 12, color: '#065F46', background: '#D1FAE5' }}>
                    +{r.markupPct}%
                  </span>
                ) : <span style={{ color: T.muted }}>—</span>}
              </Td>
              <Td center>
                {r.commissionPct > 0 ? (
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 12, color: '#1D4ED8', background: '#DBEAFE' }}>
                    {r.commissionPct}%
                  </span>
                ) : <span style={{ color: T.muted }}>—</span>}
              </Td>
              <Td center>
                <Badge label={r.base === 'cost' ? 'Cost Price' : 'Sell Price'} color={r.base === 'cost' ? '#6D28D9' : '#065F46'} bg={r.base === 'cost' ? '#EDE9FE' : '#D1FAE5'} />
              </Td>
              <Td muted><span style={{ fontSize: 12 }}>{r.appliesTo}</span></Td>
              <Td muted>{fmtDate(r.lastModified)}</Td>
              <Td center>
                <RowMenu
                  onDuplicate={() => { setData(p => [...p, { ...r, id: r.id + '_c', category: r.category + ' (copy)' }]); toast.success('Rule duplicated'); }}
                  onDelete={() => { setData(p => p.filter(x => x.id !== r.id)); toast.success('Markup rule deleted'); }}
                />
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, background: T.headBg, fontSize: 12, color: T.muted }}>
        {rows.length} markup rules active
      </div>
    </div>
  );
}

function CancellationTab() {
  const [data,         setData]         = useState(CANCELLATION_POLICIES_INIT);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const rows = useMemo(() => {
    let r = data;
    if (search) r = r.filter(x => x.name.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'all') r = r.filter(x => x.status === statusFilter);
    return r;
  }, [data, search, statusFilter]);

  return (
    <div>
      <Toolbar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search policy…" />
        <Select value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'draft', label: 'Draft' }]} />
        <Spacer />
        <ActionBtn icon={<Plus size={13} />} label="New Policy" primary onClick={() => toast.info('New Policy — form coming soon')} />
      </Toolbar>
      <Table>
        <thead>
          <tr>
            <Th width={200}>Policy Name</Th>
            <Th width={120}>Category</Th>
            <Th>Penalty Tiers (Days Before Departure → Penalty)</Th>
            <Th>Applies To</Th>
            <Th center width={80}>Status</Th>
            <Th center width={40}></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ background: T.surface }} onMouseEnter={e => (e.currentTarget.style.background = '#F8F8F8')} onMouseLeave={e => (e.currentTarget.style.background = T.surface)}>
              <Td><span style={{ fontWeight: 500 }}>{r.name}</span></Td>
              <Td muted>{r.category}</Td>
              <Td>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {r.tiers.map((t, i) => (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      background: t.penalty === 0 ? '#D1FAE5' : t.penalty === 100 ? '#FEE2E2' : '#FEF3C7',
                      color: t.penalty === 0 ? '#065F46' : t.penalty === 100 ? '#991B1B' : '#92400E',
                    }}>
                      {t.days}d → {t.penalty}{t.type}
                    </span>
                  ))}
                </div>
              </Td>
              <Td muted><span style={{ fontSize: 12 }}>{r.appliesTo}</span></Td>
              <Td center>
                <Badge
                  label={r.status === 'active' ? 'Active' : 'Draft'}
                  color={r.status === 'active' ? T.success : T.warning}
                  bg={r.status === 'active' ? '#D1FAE5' : '#FEF3C7'}
                />
              </Td>
              <Td center>
                <RowMenu
                  onDuplicate={() => { setData(p => [...p, { ...r, id: r.id + '_c', name: r.name + ' (copy)', status: 'draft' }]); toast.success('Policy duplicated as draft'); }}
                  onDelete={() => { setData(p => p.filter(x => x.id !== r.id)); toast.success('Policy deleted'); }}
                />
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, background: T.headBg, fontSize: 12, color: T.muted }}>
        {rows.length} policies
      </div>
    </div>
  );
}

function PaymentTermsTab() {
  const [data,   setData]   = useState(PAYMENT_TERMS_INIT);
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    if (!search) return data;
    return data.filter(x => x.name.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  return (
    <div>
      <Toolbar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search payment template…" />
        <Spacer />
        <ActionBtn icon={<Plus size={13} />} label="New Template" primary onClick={() => toast.info('New Template — form coming soon')} />
      </Toolbar>
      <Table>
        <thead>
          <tr>
            <Th>Template Name</Th>
            <Th center width={100}>Deposit</Th>
            <Th width={150}>Deposit Due</Th>
            <Th width={160}>Balance Due</Th>
            <Th>Applies To</Th>
            <Th center width={80}>Status</Th>
            <Th center width={40}></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ background: T.surface }} onMouseEnter={e => (e.currentTarget.style.background = '#F8F8F8')} onMouseLeave={e => (e.currentTarget.style.background = T.surface)}>
              <Td><span style={{ fontWeight: 500 }}>{r.name}</span></Td>
              <Td center>
                <span style={{ fontWeight: 700, fontSize: 13, color: r.depositPct === 0 ? T.muted : T.primary }}>
                  {r.depositPct === 0 ? '—' : `${r.depositPct}%`}
                </span>
              </Td>
              <Td muted>
                {r.depositDueDays === 0 ? '—' : `Within ${r.depositDueDays} day${r.depositDueDays > 1 ? 's' : ''} of booking`}
              </Td>
              <Td muted>
                {r.balanceDueDays === 0
                  ? 'Fully prepaid'
                  : r.balanceDueDays < 0
                    ? `${Math.abs(r.balanceDueDays)} days after travel`
                    : `${r.balanceDueDays} days before departure`}
              </Td>
              <Td muted><span style={{ fontSize: 12 }}>{r.appliesTo}</span></Td>
              <Td center>
                <Badge
                  label={r.status === 'active' ? 'Active' : 'Draft'}
                  color={r.status === 'active' ? T.success : T.warning}
                  bg={r.status === 'active' ? '#D1FAE5' : '#FEF3C7'}
                />
              </Td>
              <Td center>
                <RowMenu
                  onDuplicate={() => { setData(p => [...p, { ...r, id: r.id + '_c', name: r.name + ' (copy)', status: 'draft' }]); toast.success('Template duplicated'); }}
                  onDelete={() => { setData(p => p.filter(x => x.id !== r.id)); toast.success('Payment term deleted'); }}
                />
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, background: T.headBg, fontSize: 12, color: T.muted }}>
        {rows.length} payment templates
      </div>
    </div>
  );
}

function InclusionsTab() {
  const [data,      setData]      = useState(SERVICE_INCLUSIONS_INIT);
  const [search,    setSearch]    = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [expanded,  setExpanded]  = useState<string | null>(null);

  const rows = useMemo(() => {
    let r = data;
    if (search) r = r.filter(x => x.product.toLowerCase().includes(search.toLowerCase()));
    if (catFilter !== 'all') r = r.filter(x => x.category === catFilter);
    return r;
  }, [data, search, catFilter]);

  return (
    <div>
      <Toolbar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search product…" />
        <Select value={catFilter} onChange={setCatFilter} options={[{ value: 'all', label: 'All Categories' }, ...Object.entries(CAT_CFG).map(([k, v]) => ({ value: k, label: v.label }))]} />
        <Spacer />
        <ActionBtn icon={<Plus size={13} />} label="Add Entry" primary onClick={() => toast.info('Add Entry — form coming soon')} />
      </Toolbar>
      <Table>
        <thead>
          <tr>
            <Th width={30}></Th>
            <Th>Product / Service</Th>
            <Th width={130}>Category</Th>
            <Th>Included Items</Th>
            <Th>Excluded Items</Th>
            <Th center width={40}></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const cat  = CAT_CFG[r.category];
            const open = expanded === r.id;
            return (
              <>
                <tr key={r.id} style={{ background: T.surface }} onMouseEnter={e => (e.currentTarget.style.background = '#F8F8F8')} onMouseLeave={e => (e.currentTarget.style.background = T.surface)}>
                  <td style={{ padding: '8px 6px 8px 10px', borderBottom: `1px solid ${T.border2}` }}>
                    <button onClick={() => setExpanded(open ? null : r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex' }}>
                      {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </td>
                  <Td><span style={{ fontWeight: 500 }}>{r.product}</span></Td>
                  <Td><Badge label={cat.label} color={cat.color} bg={cat.bg} /></Td>
                  <Td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {r.included.slice(0, 3).map((inc, i) => (
                        <span key={i} style={{ padding: '2px 7px', borderRadius: 4, fontSize: 11, background: '#D1FAE5', color: '#065F46', fontWeight: 500 }}>✓ {inc}</span>
                      ))}
                      {r.included.length > 3 && <span style={{ fontSize: 11, color: T.muted }}>+{r.included.length - 3} more</span>}
                    </div>
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {r.excluded.slice(0, 3).map((exc, i) => (
                        <span key={i} style={{ padding: '2px 7px', borderRadius: 4, fontSize: 11, background: '#FEE2E2', color: '#991B1B', fontWeight: 500 }}>✗ {exc}</span>
                      ))}
                      {r.excluded.length > 3 && <span style={{ fontSize: 11, color: T.muted }}>+{r.excluded.length - 3} more</span>}
                    </div>
                  </Td>
                  <Td center>
                    <RowMenu
                      onDuplicate={() => { setData(p => [...p, { ...r, id: r.id + '_c', product: r.product + ' (copy)' }]); toast.success('Entry duplicated'); }}
                      onDelete={() => { setData(p => p.filter(x => x.id !== r.id)); toast.success('Entry deleted'); }}
                    />
                  </Td>
                </tr>
                {open && (
                  <tr key={`${r.id}-exp`}>
                    <td colSpan={6} style={{ padding: '12px 16px 16px 48px', background: '#FAFAFA', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: T.success, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 8px' }}>Included</p>
                          {r.included.map((inc, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 12.5, color: T.text }}>
                              <CheckCircle size={12} color={T.success} />
                              {inc}
                            </div>
                          ))}
                        </div>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: T.danger, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 8px' }}>Excluded</p>
                          {r.excluded.map((exc, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 12.5, color: T.text }}>
                              <AlertCircle size={12} color={T.danger} />
                              {exc}
                            </div>
                          ))}
                        </div>
                      </div>
                      {r.notes && <p style={{ fontSize: 12, color: T.muted, marginTop: 12, padding: '8px 12px', background: '#F0F0F0', borderRadius: 4, borderLeft: `3px solid ${T.gold}` }}>Note: {r.notes}</p>}
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </Table>
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, background: T.headBg, fontSize: 12, color: T.muted }}>
        {rows.length} products configured
      </div>
    </div>
  );
}

function TaxSettingsTab() {
  const [data,   setData]   = useState(TAX_SETTINGS_INIT);
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    if (!search) return data;
    return data.filter(x => x.name.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  return (
    <div>
      <Toolbar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search tax…" />
        <Spacer />
        <ActionBtn icon={<Plus size={13} />} label="Add Tax" primary onClick={() => toast.info('Add Tax — form coming soon')} />
      </Toolbar>
      <Table>
        <thead>
          <tr>
            <Th>Tax Name</Th>
            <Th center width={90}>Rate</Th>
            <Th width={140}>Type</Th>
            <Th>Applies To</Th>
            <Th>Notes</Th>
            <Th center width={90}>Status</Th>
            <Th center width={40}></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ background: T.surface }} onMouseEnter={e => (e.currentTarget.style.background = '#F8F8F8')} onMouseLeave={e => (e.currentTarget.style.background = T.surface)}>
              <Td><span style={{ fontWeight: 500 }}>{r.name}</span></Td>
              <Td center>
                <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 13, color: r.rate > 0 ? T.danger : T.muted }}>
                  {r.rate > 0 ? `${r.rate}%` : 'Flat fee'}
                </span>
              </Td>
              <Td>
                <Badge
                  label={r.type}
                  color={r.type === 'VAT' ? '#991B1B' : r.type === 'Service Charge' ? '#1D4ED8' : r.type === 'Levy' ? '#6D28D9' : T.muted}
                  bg={r.type === 'VAT' ? '#FEE2E2' : r.type === 'Service Charge' ? '#DBEAFE' : r.type === 'Levy' ? '#EDE9FE' : '#F3F4F6'}
                />
              </Td>
              <Td>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {r.appliesTo.map(c => {
                    const cfg = CAT_CFG[c];
                    return <Badge key={c} label={cfg.label} color={cfg.color} bg={cfg.bg} />;
                  })}
                </div>
              </Td>
              <Td muted><span style={{ fontSize: 12 }}>{r.notes}</span></Td>
              <Td center>
                <Badge
                  label={r.status === 'active' ? 'Active' : 'Inactive'}
                  color={r.status === 'active' ? T.success : T.muted}
                  bg={r.status === 'active' ? '#D1FAE5' : '#F3F4F6'}
                />
              </Td>
              <Td center>
                <RowMenu
                  onDuplicate={() => { setData(p => [...p, { ...r, id: r.id + '_c', name: r.name + ' (copy)', status: 'inactive' }]); toast.success('Tax setting duplicated'); }}
                  onDelete={() => { setData(p => p.filter(x => x.id !== r.id)); toast.success('Tax setting deleted'); }}
                />
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, background: T.headBg, fontSize: 12, color: T.muted }}>
        {rows.length} tax configurations
      </div>
    </div>
  );
}

// ── KPI summary bar ───────────────────────────────────────────────────────────

function KpiBar() {
  const activeRates = CONTRACTED_RATES_INIT.filter(r => r.status === 'active').length;
  const expiredRates = CONTRACTED_RATES_INIT.filter(r => r.status === 'expired').length;
  const avgMargin = Math.round(
    CONTRACTED_RATES_INIT.filter(r => r.sellRate > 0)
      .reduce((s, r) => s + ((r.sellRate - r.costRate) / r.sellRate) * 100, 0) /
    CONTRACTED_RATES_INIT.filter(r => r.sellRate > 0).length
  );
  const expiringContracts = SUPPLIER_RATES_INIT.filter(r => {
    const d = Math.ceil((new Date(r.contractExpiry).getTime() - Date.now()) / 86400000);
    return d >= 0 && d < 60;
  }).length;

  const stats = [
    { label: 'Active Rate Cards',  value: String(activeRates),   sub: `${expiredRates} expired`,   color: T.success },
    { label: 'Avg Sell Margin',    value: `${avgMargin}%`,        sub: 'Across all categories',     color: T.primary },
    { label: 'Supplier Contracts', value: String(SUPPLIER_RATES_INIT.filter(r => r.status === 'active').length), sub: `${expiringContracts} expiring <60d`, color: expiringContracts > 0 ? T.warning : T.success },
    { label: 'Season Rules',       value: String(SEASONAL_RATES_INIT.filter(r => r.status !== 'expired').length), sub: 'Active & upcoming',  color: T.gold },
    { label: 'Markup Rules',       value: String(MARKUP_RULES_INIT.length), sub: 'Product categories', color: '#6D28D9' },
    { label: 'Tax Configurations', value: String(TAX_SETTINGS_INIT.filter(r => r.status === 'active').length), sub: 'Active tax rules', color: '#9D174D' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 1, background: T.border, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ background: T.surface, padding: '14px 16px', borderTop: `3px solid ${s.color}` }}>
          <p style={{ fontSize: 11, color: T.muted, margin: '0 0 4px', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: '0 0 2px', lineHeight: 1 }}>{s.value}</p>
          <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RatesPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const activeTab = (searchParams.get('tab') as TabKey) ?? 'contracted';

  function setTab(tab: TabKey) {
    router.push(`/rates?tab=${tab}`);
  }

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); toast.success('Rates data refreshed'); }, 700);
  }

  const tabActions: Record<TabKey, { label: string; sub: string }> = {
    contracted:   { label: 'Contracted Rates',        sub: 'Manage agreed cost and sell rates per product' },
    seasonal:     { label: 'Seasonal Pricing',        sub: 'Define peak, shoulder, and low season multipliers' },
    supplier:     { label: 'Supplier Rate Cards',     sub: 'Track contracted rate cards per supplier' },
    markups:      { label: 'Markups & Commissions',   sub: 'Configure markup percentages and agency commissions' },
    cancellation: { label: 'Cancellation Policies',   sub: 'Define penalty tiers by days before departure' },
    payment:      { label: 'Payment Terms',           sub: 'Manage deposit schedules and balance due rules' },
    inclusions:   { label: 'Service Inclusions',      sub: 'Define what is included and excluded per product' },
    tax:          { label: 'Tax Settings',            sub: 'Configure applicable taxes and levies' },
  };

  const current = tabActions[activeTab];

  return (
    <div style={{ background: T.bg, minHeight: '100vh' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <TopBar
        title="Rates & Policies"
        subtitle="Contracted rates, seasonal pricing, markups, and policy management"
        breadcrumbs={[{ label: 'Rates & Policies', href: '/rates' }, { label: current.label }]}
      />

      <div style={{ padding: '16px 20px 32px' }}>

        {/* KPI bar */}
        <KpiBar />

        {/* Tab card */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, background: T.headBg, overflowX: 'auto' }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 16px', whiteSpace: 'nowrap',
                    fontSize: 12.5, fontWeight: isActive ? 600 : 400,
                    color: isActive ? T.primary : T.muted,
                    background: isActive ? T.surface : 'none',
                    border: 'none', borderBottom: isActive ? `2px solid ${T.primary}` : '2px solid transparent',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'color 0.12s',
                    marginBottom: -1,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = T.text; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = T.muted; }}
                >
                  <span style={{ color: isActive ? T.primary : T.muted, display: 'flex' }}>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Section header */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>{current.label}</h2>
              <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>{current.sub}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ActionBtn
                icon={<RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />}
                onClick={handleRefresh}
              />
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'contracted'   && <ContractedRatesTab />}
          {activeTab === 'seasonal'     && <SeasonalPricingTab />}
          {activeTab === 'supplier'     && <SupplierRatesTab />}
          {activeTab === 'markups'      && <MarkupsTab />}
          {activeTab === 'cancellation' && <CancellationTab />}
          {activeTab === 'payment'      && <PaymentTermsTab />}
          {activeTab === 'inclusions'   && <InclusionsTab />}
          {activeTab === 'tax'          && <TaxSettingsTab />}
        </div>
      </div>
    </div>
  );
}
