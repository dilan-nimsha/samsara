'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { mockSuppliers } from '@/lib/mock-data';
import type { SupplierType, SupplierStatus, SupplierPaymentTerms, Currency } from '@/types';
import {
  Save, ChevronLeft, X,
  Hotel, Car, Compass, UtensilsCrossed, UserCheck,
  Phone, Mail, Globe, AlertCircle,
} from 'lucide-react';

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: SupplierType; label: string; icon: React.ReactNode }[] = [
  { value: 'hotel',      label: 'Hotel',      icon: <Hotel           size={13} strokeWidth={2} /> },
  { value: 'transport',  label: 'Transport',  icon: <Car             size={13} strokeWidth={2} /> },
  { value: 'activity',   label: 'Activity',   icon: <Compass         size={13} strokeWidth={2} /> },
  { value: 'guide',      label: 'Guide',      icon: <UserCheck       size={13} strokeWidth={2} /> },
  { value: 'restaurant', label: 'Restaurant', icon: <UtensilsCrossed size={13} strokeWidth={2} /> },
];

const TYPE_CFG: Record<SupplierType, { color: string; bg: string }> = {
  hotel:      { color: '#1D4ED8', bg: '#DBEAFE' },
  transport:  { color: '#6D28D9', bg: '#EDE9FE' },
  activity:   { color: '#065F46', bg: '#D1FAE5' },
  guide:      { color: '#92400E', bg: '#FEF3C7' },
  restaurant: { color: '#9D174D', bg: '#FCE7F3' },
};

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
  fontSize: 12, color: '#555555', width: 120, flexShrink: 0,
  padding: '3px 8px 3px 10px', display: 'flex', alignItems: 'center', gap: 3,
};

const editInp: React.CSSProperties = {
  fontSize: 12, color: '#111111', padding: '1px 5px',
  border: '1px solid #C8C8C8', borderRadius: 2, background: '#FFFFF0',
  outline: 'none', fontFamily: 'inherit', height: 20,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={sectionStyle}>
      <div style={sectionHeadStyle}>{title}</div>
      {children}
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

function TBtn({
  icon, label, primary, danger, onClick, type = 'button',
}: {
  icon?: React.ReactNode; label: string; primary?: boolean; danger?: boolean;
  onClick?: () => void; type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '3px 9px', borderRadius: 3,
        border: primary ? '1px solid #1A6FC4' : danger ? '1px solid #C43333' : '1px solid #BBBBBB',
        background: primary ? '#1A6FC4' : danger ? '#C43333' : '#EBEBEB',
        color: primary || danger ? '#ffffff' : '#333333',
        fontSize: 12, fontWeight: 500,
        cursor: 'pointer', fontFamily: 'inherit', height: 26, whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        if (!primary && !danger) (e.currentTarget as HTMLElement).style.background = '#DEDEDE';
      }}
      onMouseLeave={e => {
        if (!primary && !danger) (e.currentTarget as HTMLElement).style.background = '#EBEBEB';
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Destination tag input ─────────────────────────────────────────────────────

function DestinationInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  function add() {
    const trimmed = draft.trim();
    if (!trimmed || value.includes(trimmed)) { setDraft(''); return; }
    onChange([...value, trimmed]);
    setDraft('');
  }

  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: value.length ? 4 : 0 }}>
        {value.map(d => (
          <span key={d} style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 11, color: '#1D4ED8', background: '#EFF6FF',
            border: '1px solid #BFDBFE', borderRadius: 3, padding: '1px 6px',
          }}>
            {d}
            <button
              type="button"
              onClick={() => onChange(value.filter(x => x !== d))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#93C5FD' }}
            >
              <X size={9} strokeWidth={2.5} />
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Type & press Enter…"
          style={{ ...editInp, flex: 1 }}
          onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
          onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
        />
        <button
          type="button"
          onClick={add}
          style={{
            padding: '1px 8px', height: 20, borderRadius: 2, border: '1px solid #BBBBBB',
            background: '#F0F0F0', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', color: '#444',
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewSupplierPage() {
  const router = useRouter();

  const [name,         setName]         = useState('');
  const [type,         setType]         = useState<SupplierType>('hotel');
  const [status,       setStatus]       = useState<SupplierStatus>('active');
  const [country,      setCountry]      = useState('Sri Lanka');
  const [currency,     setCurrency]     = useState<Currency>('USD');
  const [paymentTerms, setPaymentTerms] = useState<SupplierPaymentTerms>('net_30');
  const [contactPerson,setContactPerson]= useState('');
  const [email,        setEmail]        = useState('');
  const [phone,        setPhone]        = useState('');
  const [whatsapp,     setWhatsapp]     = useState('');
  const [website,      setWebsite]      = useState('');
  const [address,      setAddress]      = useState('');
  const [destinations, setDestinations] = useState<string[]>([]);
  const [bankName,     setBankName]     = useState('');
  const [bankAccount,  setBankAccount]  = useState('');
  const [swiftCode,    setSwiftCode]    = useState('');
  const [cancelPolicy, setCancelPolicy] = useState('');
  const [notes,        setNotes]        = useState('');
  const [errors,       setErrors]       = useState<Record<string, string>>({});

  const typeCfg = TYPE_CFG[type];

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim())          e.name          = 'Supplier name is required.';
    if (!contactPerson.trim()) e.contactPerson  = 'Contact person is required.';
    if (!email.trim())         e.email          = 'Email is required.';
    if (destinations.length === 0) e.destinations = 'At least one destination is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleCreate() {
    if (!validate()) return;

    const newId = `s${Date.now()}`;
    mockSuppliers.push({
      id:                   newId,
      name:                 name.trim(),
      type,
      status,
      contact_person:       contactPerson.trim(),
      email:                email.trim(),
      phone:                phone.trim(),
      whatsapp:             whatsapp.trim() || undefined,
      website:              website.trim() || undefined,
      destinations,
      address:              address.trim() || undefined,
      country:              country.trim(),
      currency,
      payment_terms:        paymentTerms,
      cancellation_policy:  cancelPolicy.trim() || undefined,
      rating:               5.0,
      total_bookings:       0,
      notes:                notes.trim() || undefined,
      rates:                [],
      bank_name:            bankName.trim()    || undefined,
      bank_account:         bankAccount.trim() || undefined,
      swift_code:           swiftCode.trim()   || undefined,
      created_at:           new Date().toISOString(),
    });

    router.push(`/suppliers/${newId}`);
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', background: '#E8E8E8', overflow: 'hidden' }}>

      {/* ── Toolbar ── */}
      <div style={{
        background: '#F0F0F0', borderBottom: '1px solid #C8C8C8',
        padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
      }}>
        <TBtn
          icon={<Save size={12} strokeWidth={2} />}
          label="Create Supplier"
          primary
          onClick={handleCreate}
        />
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
          Cancel
        </Link>
        {hasErrors && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#C43333', marginLeft: 6, fontWeight: 500 }}>
            <AlertCircle size={12} strokeWidth={2} />
            Please fill in the required fields
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#888888' }}>Fields marked <span style={{ color: '#CC3333' }}>*</span> are required</span>
      </div>

      {/* ── Sub-header strip ── */}
      <div style={{
        background: '#F8F8F8', borderBottom: '1px solid #C8C8C8',
        display: 'flex', alignItems: 'center',
        height: 36, padding: '0 12px', flexShrink: 0, gap: 10,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#111111' }}>
          {name.trim() || 'New Supplier'}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
          color: typeCfg.color, background: typeCfg.bg,
          borderRadius: 3, padding: '2px 7px',
        }}>
          {TYPE_OPTIONS.find(t => t.value === type)?.icon}
          {TYPE_OPTIONS.find(t => t.value === type)?.label}
        </span>
        <span style={{ fontSize: 11, color: '#888888' }}>Adding new supplier</span>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>

          {/* ── Left column ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            <FormSection title="Supplier Identity">
              <InlineRow label="Name" required>
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
                  placeholder="e.g. Amangalla Hotel"
                  style={{ ...editInp, flex: 1, borderColor: errors.name ? '#C43333' : '#C8C8C8' }}
                  onFocus={e => (e.currentTarget.style.borderColor = errors.name ? '#C43333' : '#1A6FC4')}
                  onBlur={e  => (e.currentTarget.style.borderColor = errors.name ? '#C43333' : '#C8C8C8')}
                />
                {errors.name && <span style={{ fontSize: 11, color: '#C43333', whiteSpace: 'nowrap' }}>{errors.name}</span>}
              </InlineRow>

              <InlineRow label="Type" required>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setType(opt.value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '2px 9px', borderRadius: 3, height: 22,
                        border: `1px solid ${type === opt.value ? TYPE_CFG[opt.value].color : '#CCCCCC'}`,
                        background: type === opt.value ? TYPE_CFG[opt.value].bg : '#F8F8F8',
                        color: type === opt.value ? TYPE_CFG[opt.value].color : '#555555',
                        fontSize: 11, fontWeight: type === opt.value ? 700 : 400,
                        cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                        transition: 'all 0.1s',
                      }}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
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

              <InlineRow label="Country" required>
                <input
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  placeholder="e.g. Sri Lanka"
                  style={{ ...editInp, flex: 1 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                  onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                />
              </InlineRow>

              <InlineRow label="Currency">
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value as Currency)}
                  style={{ ...editInp, cursor: 'pointer', width: 120 }}
                >
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="EUR">EUR</option>
                  <option value="LKR">LKR</option>
                  <option value="CNY">CNY</option>
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

              <InlineRow label="Destinations" required>
                <DestinationInput
                  value={destinations}
                  onChange={v => { setDestinations(v); setErrors(p => ({ ...p, destinations: '' })); }}
                />
              </InlineRow>
              {errors.destinations && (
                <div style={{ padding: '2px 10px 4px', fontSize: 11, color: '#C43333', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={11} strokeWidth={2} /> {errors.destinations}
                </div>
              )}
            </FormSection>

            <FormSection title="Contact Information">
              <InlineRow label="Contact Person" required>
                <input
                  value={contactPerson}
                  onChange={e => { setContactPerson(e.target.value); setErrors(p => ({ ...p, contactPerson: '' })); }}
                  placeholder="Full name"
                  style={{ ...editInp, flex: 1, borderColor: errors.contactPerson ? '#C43333' : '#C8C8C8' }}
                  onFocus={e => (e.currentTarget.style.borderColor = errors.contactPerson ? '#C43333' : '#1A6FC4')}
                  onBlur={e  => (e.currentTarget.style.borderColor = errors.contactPerson ? '#C43333' : '#C8C8C8')}
                />
                {errors.contactPerson && <span style={{ fontSize: 11, color: '#C43333', whiteSpace: 'nowrap' }}>{errors.contactPerson}</span>}
              </InlineRow>

              <InlineRow label="Email" required>
                <input
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                  placeholder="contact@supplier.com"
                  type="email"
                  style={{ ...editInp, flex: 1, borderColor: errors.email ? '#C43333' : '#C8C8C8' }}
                  onFocus={e => (e.currentTarget.style.borderColor = errors.email ? '#C43333' : '#1A6FC4')}
                  onBlur={e  => (e.currentTarget.style.borderColor = errors.email ? '#C43333' : '#C8C8C8')}
                />
                {email && <Mail size={13} strokeWidth={1.75} color="#1A6FC4" style={{ flexShrink: 0 }} />}
                {errors.email && <span style={{ fontSize: 11, color: '#C43333', whiteSpace: 'nowrap' }}>{errors.email}</span>}
              </InlineRow>

              <InlineRow label="Phone">
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+94 11 123 4567"
                  style={{ ...editInp, flex: 1 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                  onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                />
              </InlineRow>

              <InlineRow label="WhatsApp">
                <input
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="+94 77 123 4567"
                  style={{ ...editInp, flex: 1 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                  onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                />
                {whatsapp && (
                  <Phone size={13} strokeWidth={1.75} color="#25D366" style={{ flexShrink: 0 }} />
                )}
              </InlineRow>

              <InlineRow label="Website">
                <input
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://supplier.com"
                  style={{ ...editInp, flex: 1 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                  onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                />
                {website && (
                  <Globe size={13} strokeWidth={1.75} color="#1A6FC4" style={{ flexShrink: 0 }} />
                )}
              </InlineRow>

              <InlineRow label="Address">
                <input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street, City"
                  style={{ ...editInp, flex: 1 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                  onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                />
              </InlineRow>
            </FormSection>

            <FormSection title="Bank Details">
              <InlineRow label="Bank Name">
                <input
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  placeholder="e.g. Sampath Bank"
                  style={{ ...editInp, flex: 1 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                  onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                />
              </InlineRow>
              <InlineRow label="Account No.">
                <input
                  value={bankAccount}
                  onChange={e => setBankAccount(e.target.value)}
                  placeholder="Account number"
                  style={{ ...editInp, flex: 1, fontFamily: 'monospace' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                  onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                />
              </InlineRow>
              <InlineRow label="SWIFT / BIC">
                <input
                  value={swiftCode}
                  onChange={e => setSwiftCode(e.target.value)}
                  placeholder="e.g. SAMPLKKX"
                  style={{ ...editInp, flex: 1, fontFamily: 'monospace' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                  onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                />
              </InlineRow>
            </FormSection>

            <FormSection title="Cancellation Policy">
              <div style={{ padding: '6px 8px' }}>
                <textarea
                  value={cancelPolicy}
                  onChange={e => setCancelPolicy(e.target.value)}
                  placeholder="Enter cancellation terms and conditions…"
                  style={{
                    width: '100%', minHeight: 72, resize: 'vertical',
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

            <FormSection title="Internal Notes">
              <div style={{ padding: '6px 8px' }}>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Operational notes, tips, or internal guidance for this supplier…"
                  style={{
                    width: '100%', minHeight: 72, resize: 'vertical',
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

          {/* ── Right column (220px) ── */}
          <div style={{ width: 220, flexShrink: 0 }}>

            {/* Summary card */}
            <div style={sectionStyle}>
              <div style={sectionHeadStyle}>Summary</div>
              <div style={{ padding: '8px 10px', fontSize: 12 }}>
                <p style={{ color: '#555555', marginBottom: 6 }}>
                  Creating a new <strong style={{ color: typeCfg.color }}>
                    {TYPE_OPTIONS.find(t => t.value === type)?.label}
                  </strong> supplier.
                </p>
                <p style={{ color: '#888888', fontSize: 11, lineHeight: 1.6 }}>
                  After creation, you can add service rates, contract details, and performance data from the supplier detail page.
                </p>
              </div>
            </div>

            {/* Required fields checklist */}
            <div style={sectionStyle}>
              <div style={sectionHeadStyle}>Required Fields</div>
              <div style={{ padding: '6px 10px' }}>
                {[
                  { label: 'Supplier name',   done: !!name.trim() },
                  { label: 'Contact person',  done: !!contactPerson.trim() },
                  { label: 'Email address',   done: !!email.trim() },
                  { label: 'Country',         done: !!country.trim() },
                  { label: 'Destination(s)',  done: destinations.length > 0 },
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '3px 0', borderBottom: '1px solid #F0F0F0', fontSize: 11,
                  }}>
                    <span style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                      background: item.done ? '#D1FAE5' : '#F3F4F6',
                      border: `1px solid ${item.done ? '#6EE7B7' : '#D1D5DB'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700,
                      color: item.done ? '#065F46' : '#9CA3AF',
                    }}>
                      {item.done ? '✓' : '·'}
                    </span>
                    <span style={{ color: item.done ? '#111111' : '#9CA3AF' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Destinations preview */}
            {destinations.length > 0 && (
              <div style={sectionStyle}>
                <div style={sectionHeadStyle}>Destinations Added</div>
                <div style={{ padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {destinations.map(d => (
                    <span key={d} style={{
                      fontSize: 11, color: '#1D4ED8', background: '#EFF6FF',
                      border: '1px solid #BFDBFE', borderRadius: 3, padding: '2px 7px',
                    }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action button */}
            <button
              type="button"
              onClick={handleCreate}
              style={{
                width: '100%', padding: '7px 0', borderRadius: 3,
                border: '1px solid #1A6FC4', background: '#1A6FC4',
                color: '#ffffff', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.88')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            >
              <Save size={12} strokeWidth={2} />
              Create Supplier
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
