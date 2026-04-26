'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { mockSuppliers } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import type { SupplierType, SupplierStatus, SupplierPaymentTerms } from '@/types';
import {
  Save, Trash2, RefreshCw, Download, ChevronDown, ChevronLeft,
  Star, Hotel, Car, Compass, UtensilsCrossed, UserCheck,
  Phone, Mail, Globe, AlertCircle, CheckCircle, Clock, MessageSquare,
} from 'lucide-react';

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<SupplierType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  hotel:      { label: 'Hotel',      color: '#1D4ED8', bg: '#DBEAFE', icon: <Hotel           size={11} strokeWidth={2} /> },
  transport:  { label: 'Transport',  color: '#6D28D9', bg: '#EDE9FE', icon: <Car             size={11} strokeWidth={2} /> },
  activity:   { label: 'Activity',   color: '#065F46', bg: '#D1FAE5', icon: <Compass         size={11} strokeWidth={2} /> },
  guide:      { label: 'Guide',      color: '#92400E', bg: '#FEF3C7', icon: <UserCheck       size={11} strokeWidth={2} /> },
  restaurant: { label: 'Restaurant', color: '#9D174D', bg: '#FCE7F3', icon: <UtensilsCrossed size={11} strokeWidth={2} /> },
};

const STATUS_CFG: Record<SupplierStatus, { label: string; color: string; bg: string }> = {
  active:   { label: 'Active',   color: '#065F46', bg: '#D1FAE5' },
  inactive: { label: 'Inactive', color: '#4B5563', bg: '#F3F4F6' },
  on_hold:  { label: 'On Hold',  color: '#92400E', bg: '#FEF3C7' },
};

const PAYMENT_LABELS: Record<SupplierPaymentTerms, string> = {
  prepaid: 'Prepaid (before service)',
  net_7:   'NET 7 days',
  net_15:  'NET 15 days',
  net_30:  'NET 30 days',
  net_45:  'NET 45 days',
};

const UNIT_LABELS: Record<string, string> = {
  per_person:  'Per Person',
  per_group:   'Per Group',
  per_vehicle: 'Per Vehicle',
  per_room:    'Per Room / Night',
  per_night:   'Per Night',
};

type TabKey = 'general' | 'rates' | 'contract' | 'notes';

// ── Styles ────────────────────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  background: '#ffffff', border: '1px solid #D4D4D4',
  borderRadius: 3, marginBottom: 5, overflow: 'hidden',
};

const sectionHeadStyle: React.CSSProperties = {
  background: '#F2F2F2', borderBottom: '1px solid #D4D4D4',
  padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#444444', letterSpacing: '0.01em',
};

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  borderBottom: '1px solid #EEEEEE', minHeight: 26,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, color: '#555555', width: 108, flexShrink: 0,
  padding: '3px 8px 3px 10px', display: 'flex', alignItems: 'center', gap: 3,
};

const valueStyle: React.CSSProperties = {
  fontSize: 12, color: '#111111', flex: 1, padding: '3px 8px',
};

const editInp: React.CSSProperties = {
  fontSize: 12, color: '#111111', padding: '1px 5px',
  border: '1px solid #C8C8C8', borderRadius: 2, background: '#FFFFF0',
  outline: 'none', fontFamily: 'inherit', height: 20,
};

const chargeRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '3px 10px', borderBottom: '1px solid #EEEEEE', minHeight: 24,
};

// ── Contract status helper ────────────────────────────────────────────────────

function contractStatusInfo(end?: string) {
  if (!end) return { label: 'No contract on file', color: '#AAAAAA', icon: <Clock size={11} strokeWidth={2} /> };
  const days = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  if (days < 0)  return { label: 'Contract expired',    color: '#C43333', icon: <AlertCircle  size={11} strokeWidth={2} /> };
  if (days < 90) return { label: `Expires in ${days} days`, color: '#C47C00', icon: <AlertCircle  size={11} strokeWidth={2} /> };
  return           { label: `Valid until ${new Date(end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`, color: '#2A7A3A', icon: <CheckCircle size={11} strokeWidth={2} /> };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={sectionStyle}>
      <div style={sectionHeadStyle}>{title}</div>
      {children}
    </div>
  );
}

function FR({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <div style={rowStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={{ ...valueStyle, fontVariantNumeric: mono ? 'tabular-nums' : undefined }}>
        {value ?? <span style={{ color: '#CCCCCC' }}>—</span>}
      </div>
    </div>
  );
}

function InlineRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={rowStyle}>
      <div style={labelStyle}>
        {required && <span style={{ color: '#CC3333', marginRight: 2, fontSize: 13 }}>*</span>}
        {label}
      </div>
      <div style={{ flex: 1, padding: '3px 8px 3px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
        {children}
      </div>
    </div>
  );
}

function ChargeRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={chargeRowStyle}>
      <span style={{ fontSize: 12, color: '#555555', flex: 1 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: '#111111', fontVariantNumeric: mono ? 'tabular-nums' : undefined }}>
        {value}
      </span>
    </div>
  );
}

function TBtn({
  icon, label, primary, danger, active, chevron, onClick,
}: {
  icon?: React.ReactNode; label: string; primary?: boolean; danger?: boolean;
  active?: boolean; chevron?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '3px 9px', borderRadius: 3,
        border: primary ? '1px solid #1A6FC4' : danger ? '1px solid #C43333' : '1px solid #BBBBBB',
        background: primary ? '#1A6FC4' : danger ? '#C43333' : active ? '#DDDDDD' : '#EBEBEB',
        color: primary || danger ? '#ffffff' : '#333333',
        fontSize: 12, fontWeight: 500,
        cursor: 'pointer', fontFamily: 'inherit', height: 26, whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        if (!primary && !danger) (e.currentTarget as HTMLElement).style.background = '#DEDEDE';
      }}
      onMouseLeave={e => {
        if (!primary && !danger) (e.currentTarget as HTMLElement).style.background = active ? '#DDDDDD' : '#EBEBEB';
      }}
    >
      {icon}
      {label}
      {chevron && <ChevronDown size={10} strokeWidth={2} style={{ marginLeft: 1 }} />}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const s = mockSuppliers.find(x => x.id === id);

  const [tab,          setTab]         = useState<TabKey>('general');
  const [saved,        setSaved]       = useState(false);

  const [name,         setName]         = useState(s?.name ?? '');
  const [contactPerson,setContactPerson]= useState(s?.contact_person ?? '');
  const [email,        setEmail]        = useState(s?.email ?? '');
  const [phone,        setPhone]        = useState(s?.phone ?? '');
  const [whatsapp,     setWhatsapp]     = useState(s?.whatsapp ?? '');
  const [website,      setWebsite]      = useState(s?.website ?? '');
  const [address,      setAddress]      = useState(s?.address ?? '');
  const [bankName,     setBankName]     = useState(s?.bank_name ?? '');
  const [bankAccount,  setBankAccount]  = useState(s?.bank_account ?? '');
  const [swiftCode,    setSwiftCode]    = useState(s?.swift_code ?? '');
  const [paymentTerms, setPaymentTerms] = useState<SupplierPaymentTerms>(s?.payment_terms ?? 'net_30');
  const [status,       setStatus]       = useState<SupplierStatus>(s?.status ?? 'active');
  const [notes,        setNotes]        = useState(s?.notes ?? '');
  const [cancelPolicy, setCancelPolicy] = useState(s?.cancellation_policy ?? '');

  if (!s) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 'calc(100vh - 48px)', background: '#E8E8E8', color: '#999999', fontSize: 13,
      }}>
        Supplier not found.
      </div>
    );
  }

  const typeCfg   = TYPE_CFG[s.type];
  const statusCfg = STATUS_CFG[status];
  const contract  = contractStatusInfo(s.contract_end);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'general',  label: 'General' },
    { key: 'rates',    label: 'Rates & Pricing' },
    { key: 'contract', label: 'Contract' },
    { key: 'notes',    label: 'Notes' },
  ];

  function handleSave() {
    if (!s) return;
    s.name                = name;
    s.contact_person      = contactPerson;
    s.email               = email;
    s.phone               = phone;
    s.whatsapp            = whatsapp;
    s.website             = website;
    s.address             = address;
    s.bank_name           = bankName;
    s.bank_account        = bankAccount;
    s.swift_code          = swiftCode;
    s.payment_terms       = paymentTerms;
    s.status              = status;
    s.notes               = notes;
    s.cancellation_policy = cancelPolicy;
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleDelete() {
    if (!s) return;
    const ok = window.confirm(
      `Delete supplier "${s.name}"?\n\nThis cannot be undone.`
    );
    if (!ok) return;
    const idx = mockSuppliers.findIndex(x => x.id === id);
    if (idx !== -1) mockSuppliers.splice(idx, 1);
    router.push('/suppliers');
  }

  function handleRefresh() {
    if (!s) return;
    setName(s.name);
    setContactPerson(s.contact_person);
    setEmail(s.email);
    setPhone(s.phone);
    setWhatsapp(s.whatsapp ?? '');
    setWebsite(s.website ?? '');
    setAddress(s.address ?? '');
    setBankName(s.bank_name ?? '');
    setBankAccount(s.bank_account ?? '');
    setSwiftCode(s.swift_code ?? '');
    setPaymentTerms(s.payment_terms);
    setStatus(s.status);
    setNotes(s.notes ?? '');
    setCancelPolicy(s.cancellation_policy ?? '');
  }

  function exportCSV() {
    if (!s) return;
    const rows: (string | number)[][] = [
      ['Field', 'Value'],
      ['ID',                s.id],
      ['Name',              s.name],
      ['Type',              s.type],
      ['Status',            s.status],
      ['Country',           s.country],
      ['Currency',          s.currency],
      ['Contact Person',    s.contact_person],
      ['Email',             s.email],
      ['Phone',             s.phone],
      ['WhatsApp',          s.whatsapp ?? ''],
      ['Website',           s.website ?? ''],
      ['Address',           s.address ?? ''],
      ['Destinations',      s.destinations.join(' | ')],
      ['Payment Terms',     s.payment_terms],
      ['Contract Ref',      s.contract_reference ?? ''],
      ['Contract Start',    s.contract_start ?? ''],
      ['Contract End',      s.contract_end ?? ''],
      ['Rating',            s.rating],
      ['Total Bookings',    s.total_bookings],
      ['Bank Name',         s.bank_name ?? ''],
      ['Bank Account',      s.bank_account ?? ''],
      ['SWIFT / BIC',       s.swift_code ?? ''],
      ['Cancellation Policy', s.cancellation_policy ?? ''],
      ['Notes',             s.notes ?? ''],
      ['Created At',        s.created_at],
    ];
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv  = rows.map(row => row.map(esc).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `supplier-${s.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', background: '#E8E8E8', overflow: 'hidden' }}>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#F0F0F0', borderBottom: '1px solid #C8C8C8',
        padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
      }}>
        <TBtn icon={<Save size={12} strokeWidth={2} />} label={saved ? 'Saved!' : 'Save'} primary onClick={handleSave} />
        <TBtn icon={<Trash2 size={12} strokeWidth={2} />} label="Delete" danger onClick={handleDelete} />
        <div style={{ width: 1, height: 18, background: '#C8C8C8', margin: '0 2px' }} />
        <TBtn icon={<RefreshCw size={12} strokeWidth={1.8} />} label="Refresh" onClick={handleRefresh} />
        <TBtn icon={<Download size={12} strokeWidth={1.8} />} label="Export" onClick={exportCSV} />
        <div style={{ flex: 1 }} />
        <TBtn label="Actions" chevron />
        <div style={{ width: 1, height: 18, background: '#C8C8C8', margin: '0 2px' }} />
        <Link
          href="/suppliers"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, color: '#333333', textDecoration: 'none',
            padding: '3px 9px', borderRadius: 3,
            border: '1px solid #BBBBBB', background: '#EBEBEB',
            height: 26, boxSizing: 'border-box', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#DEDEDE')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#EBEBEB')}
        >
          <ChevronLeft size={12} strokeWidth={2} />
          Suppliers
        </Link>
      </div>

      {/* ── Sub-header: tabs + identity strip ──────────────────────────────── */}
      <div style={{
        background: '#F8F8F8', borderBottom: '1px solid #C8C8C8',
        display: 'flex', alignItems: 'stretch', height: 36, flexShrink: 0,
      }}>
        {/* Tab buttons */}
        <div style={{ display: 'flex', alignItems: 'stretch', flex: 1 }}>
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '0 14px', border: 'none', background: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#1A6FC4' : '#555555',
                  borderBottom: `2px solid ${active ? '#1A6FC4' : 'transparent'}`,
                  whiteSpace: 'nowrap', transition: 'color 0.1s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#111111'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#555555'; }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Right: supplier identity */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 12px', borderLeft: '1px solid #E0E0E0', flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#111111', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name || s.name}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
            color: typeCfg.color, background: typeCfg.bg,
            borderRadius: 3, padding: '2px 7px',
          }}>
            {typeCfg.icon}
            {typeCfg.label}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
            color: statusCfg.color, background: statusCfg.bg,
            borderRadius: 3, padding: '2px 7px',
          }}>
            {statusCfg.label}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: contract.color }}>
            {contract.icon}
            {contract.label}
          </span>
        </div>
      </div>

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* GENERAL TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'general' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>

            {/* Left column */}
            <div style={{ flex: 1, minWidth: 0 }}>

              <FormSection title="Supplier Identity">
                <InlineRow label="Name" required>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{ ...editInp, flex: 1 }}
                  />
                </InlineRow>
                <InlineRow label="Status">
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as SupplierStatus)}
                    style={{ ...editInp, cursor: 'pointer', width: 160 }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </InlineRow>
                <InlineRow label="Payment Terms">
                  <select
                    value={paymentTerms}
                    onChange={e => setPaymentTerms(e.target.value as SupplierPaymentTerms)}
                    style={{ ...editInp, cursor: 'pointer', width: 220 }}
                  >
                    <option value="prepaid">Prepaid (before service)</option>
                    <option value="net_7">NET 7 days</option>
                    <option value="net_15">NET 15 days</option>
                    <option value="net_30">NET 30 days</option>
                    <option value="net_45">NET 45 days</option>
                  </select>
                </InlineRow>
                <FR label="Type" value={typeCfg.label} />
                <FR label="Country" value={s.country} />
                <FR label="Currency" value={s.currency} />
                <FR label="Contract Ref" value={s.contract_reference} mono />
              </FormSection>

              <FormSection title="Contact Information">
                <InlineRow label="Contact Person" required>
                  <input value={contactPerson} onChange={e => setContactPerson(e.target.value)} style={{ ...editInp, flex: 1 }} />
                </InlineRow>
                <InlineRow label="Email">
                  <input value={email} onChange={e => setEmail(e.target.value)} style={{ ...editInp, flex: 1 }} />
                  {email && (
                    <a href={`mailto:${email}`} title="Send email" style={{ color: '#1A6FC4', display: 'flex', flexShrink: 0 }}>
                      <Mail size={13} strokeWidth={1.75} />
                    </a>
                  )}
                </InlineRow>
                <InlineRow label="Phone">
                  <input value={phone} onChange={e => setPhone(e.target.value)} style={{ ...editInp, flex: 1 }} />
                </InlineRow>
                <InlineRow label="WhatsApp">
                  <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} style={{ ...editInp, flex: 1 }} />
                  {whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      title="WhatsApp"
                      style={{ color: '#25D366', display: 'flex', flexShrink: 0 }}
                    >
                      <Phone size={13} strokeWidth={1.75} />
                    </a>
                  )}
                </InlineRow>
                <InlineRow label="Website">
                  <input value={website} onChange={e => setWebsite(e.target.value)} style={{ ...editInp, flex: 1 }} />
                  {website && (
                    <a href={website} target="_blank" rel="noopener noreferrer" title="Visit website" style={{ color: '#1A6FC4', display: 'flex', flexShrink: 0 }}>
                      <Globe size={13} strokeWidth={1.75} />
                    </a>
                  )}
                </InlineRow>
                <InlineRow label="Address">
                  <input value={address} onChange={e => setAddress(e.target.value)} style={{ ...editInp, flex: 1 }} />
                </InlineRow>
              </FormSection>

              <FormSection title="Bank Details">
                <InlineRow label="Bank Name">
                  <input value={bankName} onChange={e => setBankName(e.target.value)} style={{ ...editInp, flex: 1 }} />
                </InlineRow>
                <InlineRow label="Account No.">
                  <input value={bankAccount} onChange={e => setBankAccount(e.target.value)} style={{ ...editInp, flex: 1, fontFamily: 'monospace' }} />
                </InlineRow>
                <InlineRow label="SWIFT / BIC">
                  <input value={swiftCode} onChange={e => setSwiftCode(e.target.value)} style={{ ...editInp, flex: 1, fontFamily: 'monospace' }} />
                </InlineRow>
                <FR label="Currency" value={s.currency} />
              </FormSection>

            </div>

            {/* Right column — 220 px */}
            <div style={{ width: 220, flexShrink: 0 }}>

              {/* Performance */}
              <div style={sectionStyle}>
                <div style={sectionHeadStyle}>Performance</div>
                <div style={{ padding: '7px 10px', borderBottom: '1px solid #EEEEEE' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#B8860B', fontVariantNumeric: 'tabular-nums' }}>
                      {s.rating.toFixed(1)}
                    </span>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} size={13} strokeWidth={0} fill={i <= Math.round(s.rating) ? '#C9A84C' : '#E0E0E0'} />
                      ))}
                    </div>
                  </div>
                  <div style={{ height: 3, background: '#EEEEEE', borderRadius: 2 }}>
                    <div style={{ height: '100%', borderRadius: 2, width: `${(s.rating / 5) * 100}%`, background: '#C9A84C' }} />
                  </div>
                </div>
                <ChargeRow label="Total Bookings" value={String(s.total_bookings)} />
                <ChargeRow label="Supplier Since" value={new Date(s.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} />
                <ChargeRow label="Type" value={typeCfg.label} />
                <ChargeRow label="Currency" value={s.currency} />
              </div>

              {/* Destinations */}
              <div style={sectionStyle}>
                <div style={sectionHeadStyle}>Destinations Covered</div>
                <div style={{ padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {s.destinations.map(d => (
                    <span key={d} style={{
                      fontSize: 11, color: '#1D4ED8', background: '#EFF6FF',
                      border: '1px solid #BFDBFE', borderRadius: 3, padding: '2px 7px',
                    }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div style={sectionStyle}>
                <div style={sectionHeadStyle}>Quick Actions</div>
                <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <a
                    href={`mailto:${email}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 8px', borderRadius: 3, fontSize: 12, color: '#333333',
                      background: '#F5F5F5', border: '1px solid #D4D4D4',
                      textDecoration: 'none', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#EBF0FF')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#F5F5F5')}
                  >
                    <Mail size={12} strokeWidth={1.75} color="#1A6FC4" />
                    Send Email
                  </a>
                  {whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '5px 8px', borderRadius: 3, fontSize: 12, color: '#333333',
                        background: '#F5F5F5', border: '1px solid #D4D4D4',
                        textDecoration: 'none', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#EDFBF3')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#F5F5F5')}
                    >
                      <Phone size={12} strokeWidth={1.75} color="#25D366" />
                      WhatsApp
                    </a>
                  )}
                  {website && (
                    <a
                      href={website} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '5px 8px', borderRadius: 3, fontSize: 12, color: '#333333',
                        background: '#F5F5F5', border: '1px solid #D4D4D4',
                        textDecoration: 'none', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F0F6FF')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#F5F5F5')}
                    >
                      <Globe size={12} strokeWidth={1.75} color="#1A6FC4" />
                      Visit Website
                    </a>
                  )}
                </div>
              </div>

              {/* Contract mini-card */}
              <div style={{ ...sectionStyle, border: `1px solid ${contract.color}44` }}>
                <div style={{ ...sectionHeadStyle, color: contract.color }}>Contract Status</div>
                <div style={{ padding: '6px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <span style={{ color: contract.color }}>{contract.icon}</span>
                    <span style={{ fontSize: 11, color: contract.color, fontWeight: 600 }}>{contract.label}</span>
                  </div>
                  {s.contract_reference && (
                    <p style={{ fontSize: 11, color: '#666666' }}>
                      Ref: <span style={{ fontFamily: 'monospace', color: '#333333' }}>{s.contract_reference}</span>
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* RATES & PRICING TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'rates' && (
          <div>
            <div style={{ ...sectionStyle, marginBottom: 5 }}>
              <div style={{
                ...sectionHeadStyle,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>Service Rates — {s.currency}</span>
                <span style={{ fontSize: 11, fontWeight: 400, color: '#888888' }}>
                  {s.rates.length} service{s.rates.length !== 1 ? 's' : ''} · {PAYMENT_LABELS[paymentTerms]}
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '26%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '16%' }} />
                </colgroup>
                <thead>
                  <tr style={{ background: '#F5F5F5', borderBottom: '1px solid #D4D4D4' }}>
                    {['Service', 'Pricing Basis', 'Rate', 'Season', 'Validity', 'Notes'].map(h => (
                      <th key={h} style={{
                        padding: '5px 10px', textAlign: 'left',
                        fontSize: 11, fontWeight: 600, color: '#666666', letterSpacing: '0.03em',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.rates.map((rate, i) => {
                    const sc = rate.season === 'peak'
                      ? { label: 'Peak',       color: '#92400E', bg: '#FEF3C7' }
                      : rate.season === 'off_peak'
                        ? { label: 'Off-Peak',  color: '#065F46', bg: '#D1FAE5' }
                        : { label: 'Year-round', color: '#4B5563', bg: '#F3F4F6' };
                    return (
                      <tr
                        key={rate.id}
                        style={{ borderBottom: i < s.rates.length - 1 ? '1px solid #F0F0F0' : 'none', transition: 'background 0.08s' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F7F9FF')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                      >
                        <td style={{ padding: '6px 10px', color: '#111111', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rate.service}
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ fontSize: 11, color: '#555555', background: '#F0F0F0', borderRadius: 3, padding: '1px 6px' }}>
                            {UNIT_LABELS[rate.unit]}
                          </span>
                        </td>
                        <td style={{ padding: '6px 10px', fontWeight: 700, color: '#1A6FC4', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(rate.cost, rate.currency)}
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: sc.color, background: sc.bg, borderRadius: 3, padding: '1px 6px', letterSpacing: '0.03em' }}>
                            {sc.label}
                          </span>
                        </td>
                        <td style={{ padding: '6px 10px', fontSize: 11, color: '#888888' }}>
                          {rate.valid_from && rate.valid_to
                            ? `${new Date(rate.valid_from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(rate.valid_to).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}`
                            : '—'
                          }
                        </td>
                        <td style={{ padding: '6px 10px', fontSize: 11, color: '#888888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rate.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{
                borderTop: '1px solid #EEEEEE', padding: '4px 10px',
                display: 'flex', justifyContent: 'space-between',
                background: '#FAFAFA',
              }}>
                <span style={{ fontSize: 11, color: '#888888' }}>Net rates · taxes may apply</span>
                <span style={{ fontSize: 11, color: '#888888' }}>Last updated: {new Date(s.created_at).getFullYear()}</span>
              </div>
            </div>

            <div style={{
              padding: '7px 10px', background: '#FFFBEB',
              border: '1px solid #FDE68A', borderRadius: 3,
              display: 'flex', gap: 7, alignItems: 'flex-start',
            }}>
              <AlertCircle size={12} color="#C47C00" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: '#78350F', lineHeight: 1.6 }}>
                Rates shown are contracted net rates excluding applicable taxes. Always confirm current pricing directly with the supplier before quoting clients. Peak season surcharges may apply.
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CONTRACT TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'contract' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>

            {/* Left */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <FormSection title="Contract Details">
                <FR label="Reference" value={s.contract_reference} mono />
                <FR label="Contract Start" value={s.contract_start
                  ? new Date(s.contract_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : null} />
                <FR label="Contract End" value={s.contract_end
                  ? new Date(s.contract_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : null} />
                <FR label="Payment Terms" value={PAYMENT_LABELS[paymentTerms]} />
                <FR label="Currency" value={s.currency} />
              </FormSection>

              <FormSection title="Cancellation Policy">
                <div style={{ padding: '6px 8px' }}>
                  <textarea
                    value={cancelPolicy}
                    onChange={e => setCancelPolicy(e.target.value)}
                    placeholder="Enter cancellation policy details…"
                    style={{
                      width: '100%', minHeight: 80, resize: 'vertical',
                      border: '1px solid #C8C8C8', borderRadius: 2,
                      fontSize: 12, color: '#111111', lineHeight: 1.55,
                      padding: '5px 7px', fontFamily: 'inherit',
                      background: '#FFFFF0', outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e  => (e.currentTarget.style.borderColor = '#1A6FC4')}
                    onBlur={e   => (e.currentTarget.style.borderColor = '#C8C8C8')}
                  />
                </div>
              </FormSection>
            </div>

            {/* Right (220px) */}
            <div style={{ width: 220, flexShrink: 0 }}>
              {/* Contract status card */}
              <div style={{ ...sectionStyle, border: `1px solid ${contract.color}55` }}>
                <div style={{ ...sectionHeadStyle, color: contract.color }}>Contract Status</div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                    <span style={{ color: contract.color }}>{contract.icon}</span>
                    <span style={{ fontSize: 12, color: contract.color, fontWeight: 600 }}>{contract.label}</span>
                  </div>
                  {s.contract_end && (
                    <p style={{ fontSize: 11, color: '#666666' }}>
                      {Math.ceil((new Date(s.contract_end).getTime() - Date.now()) / 86400000) > 0
                        ? `${Math.ceil((new Date(s.contract_end).getTime() - Date.now()) / 86400000)} days remaining`
                        : 'Contract has expired'
                      }
                    </p>
                  )}
                </div>
              </div>

              {/* Bank summary */}
              {(bankName || bankAccount) && (
                <div style={sectionStyle}>
                  <div style={sectionHeadStyle}>Payment Details</div>
                  <ChargeRow label="Bank" value={bankName || '—'} />
                  <div style={chargeRowStyle}>
                    <span style={{ fontSize: 12, color: '#555555' }}>Account</span>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#333333' }}>{bankAccount || '—'}</span>
                  </div>
                  {swiftCode && (
                    <div style={chargeRowStyle}>
                      <span style={{ fontSize: 12, color: '#555555' }}>SWIFT</span>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#333333' }}>{swiftCode}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Supplier summary */}
              <div style={sectionStyle}>
                <div style={sectionHeadStyle}>Supplier Summary</div>
                <ChargeRow label="Rating" value={`${s.rating.toFixed(1)} / 5.0`} />
                <ChargeRow label="Total Bookings" value={String(s.total_bookings)} />
                <ChargeRow label="Type" value={typeCfg.label} />
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* NOTES TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'notes' && (
          <div>
            <FormSection title="Internal Notes">
              <div style={{ padding: '7px 10px' }}>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add operational notes, tips, special considerations, or internal guidance for this supplier…"
                  style={{
                    width: '100%', minHeight: 180, resize: 'vertical',
                    border: '1px solid #C8C8C8', borderRadius: 2,
                    fontSize: 12, color: '#111111', lineHeight: 1.6,
                    padding: '7px 8px', fontFamily: 'inherit',
                    background: '#FFFFF0', outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.15s',
                  }}
                  onFocus={e  => (e.currentTarget.style.borderColor = '#1A6FC4')}
                  onBlur={e   => (e.currentTarget.style.borderColor = '#C8C8C8')}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: '#AAAAAA' }}>{notes.length} characters</span>
                  <TBtn label={saved ? 'Saved!' : 'Save Notes'} primary onClick={handleSave} />
                </div>
              </div>
            </FormSection>

            <div style={{
              padding: '7px 10px', background: '#F8F8F8',
              border: '1px solid #E0E0E0', borderRadius: 3,
              display: 'flex', gap: 7, alignItems: 'flex-start',
            }}>
              <MessageSquare size={12} color="#AAAAAA" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: '#888888', lineHeight: 1.6 }}>
                Internal notes are only visible to Samsara staff. Use this space to record tips for ops teams, quirks about the supplier, special request protocols, or any historical context useful when booking.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
