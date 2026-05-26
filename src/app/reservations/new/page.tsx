'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Currency, TravelPurpose, Client, Partner } from '@/types';
import { X, Paperclip, ChevronLeft, Save, MapPin } from 'lucide-react';

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  pageBg:     '#F1F5F9',
  cardBg:     '#FFFFFF',
  cardBorder: '#E2E8F0',
  sectionBg:  '#F8FAFC',
  inputBg:    '#FEFCE8',
  labelText:  '#64748B',
  bodyText:   '#1E293B',
  mutedText:  '#94A3B8',
  primary:    '#1E40AF',
  primaryBg:  '#EFF6FF',
  divider:    '#F1F5F9',
  required:   '#DC2626',
  shadow:     '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
};

// ── Shared cell styles for the form table ─────────────────────────────────────

const labelCell: React.CSSProperties = {
  padding: '9px 14px',
  fontSize: 13,
  color: C.labelText,
  fontWeight: 500,
  background: C.cardBg,
  borderBottom: `1px solid ${C.divider}`,
  borderRight: `1px solid ${C.divider}`,
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
  width: '22%',
};

const inputCell: React.CSSProperties = {
  padding: '7px 10px',
  background: C.inputBg,
  borderBottom: `1px solid ${C.divider}`,
  borderRight: `1px solid ${C.divider}`,
  verticalAlign: 'middle',
  width: '28%',
};

const fieldInput: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  outline: 'none',
  fontSize: 13,
  color: C.bodyText,
  width: '100%',
  fontFamily: 'inherit',
};

const secHeader: React.CSSProperties = {
  background: C.sectionBg,
  borderBottom: `1px solid ${C.cardBorder}`,
  padding: '8px 16px',
  fontSize: 11,
  fontWeight: 700,
  color: '#475569',
  letterSpacing: '0.07em',
  textTransform: 'uppercase' as const,
};

// ── Pipeline stages ───────────────────────────────────────────────────────────

const STAGES = ['Enquiry','Under Review','Confirmed','Invoiced','Paid','Active','Completed'];

// ── Document types ────────────────────────────────────────────────────────────

const DOC_TYPES = ['Passport','Visa','Flight Ticket','Hotel Voucher','Travel Insurance','Booking Confirmation','Other'];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewReservationPage() {
  const router = useRouter();
  const [saving, setSaving]         = useState(false);
  const [activeTab, setActiveTab]   = useState('General');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    client_id:        '',
    full_name:        '', nationality: '', passport_number: '', email: '', phone: '',
    arrival_date:     '', arrival_time: '', airport_arrival: '', flight_arrival: '', arrival_memo: '',
    departure_date:   '', departure_time: '', airport_departure: '', flight_departure: '', departure_memo: '',
    num_adults:       1, num_children: 0, num_infants: 0,
    destinations:     [] as string[],
    destInput:        '',
    travel_purpose:   'leisure' as TravelPurpose,
    source:           'Direct',
    budget_range:     '',
    assigned_staff:   'Unassigned',
    internal_notes:   '',
    currency:         'USD' as Currency,
    rate_code:        'leisure',
    discount_pct:     0,
    vat_pct:          0,
    commission:       0,
    partner_id:       '',
    partner_reference:'',
  });

  const [attachedDocs, setAttachedDocs] = useState<{ name: string; type: string }[]>([]);

  // Real clients + partners for the selectors.
  const [clients,  setClients]  = useState<Client[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    fetch('/api/clients').then(r => r.json())
      .then((d: { success: boolean; clients?: Client[] }) => { if (d.success) setClients(d.clients ?? []); })
      .catch(() => {});
    fetch('/api/partners').then(r => r.json())
      .then((d: { success: boolean; partners?: Partner[] }) => { if (d.success) setPartners(d.partners ?? []); })
      .catch(() => {});
  }, []);

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const nights = (() => {
    if (!form.arrival_date || !form.departure_date) return null;
    const diff = (new Date(form.departure_date).getTime() - new Date(form.arrival_date).getTime()) / 86400000;
    return diff > 0 ? diff : null;
  })();

  const totalPax = form.num_adults + form.num_children + form.num_infants;

  function addDest(e: React.KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ',') && form.destInput.trim()) {
      e.preventDefault();
      set('destinations', [...form.destinations, form.destInput.trim()]);
      set('destInput', '');
    }
  }
  function removeDest(d: string) { set('destinations', form.destinations.filter(x => x !== d)); }

  function handleFileChange(type: string) {
    const name = `${type.toLowerCase().replace(/ /g, '_')}_${Date.now()}.pdf`;
    setAttachedDocs(p => [...p, { name, type }]);
  }

  async function handleSubmit() {
    if (saving) return;
    if (!form.arrival_date || !form.departure_date) { alert('Arrival and departure dates are required.'); return; }
    if (!form.client_id && (!form.full_name.trim() || !form.email.trim())) {
      alert('Select a client, or enter the client name and email.'); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { success: boolean; reservation?: { id: string }; error?: string };
      if (!data.success) throw new Error(data.error ?? 'Failed to create reservation');
      router.push(data.reservation ? `/reservations/${data.reservation.id}` : '/reservations');
    } catch (err) {
      alert(`Failed to create reservation: ${err instanceof Error ? err.message : String(err)}`);
      setSaving(false);
    }
  }

  const TABS = ['General','Payments','Supplier Bookings','Cost & Margin','Documents'];

  return (
    <div style={{ background: C.pageBg, minHeight: '100vh', paddingTop: 48 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .field-input:focus { box-shadow: 0 0 0 2px ${C.primary}22; }
        .tab-btn:hover:not(.active) { color: ${C.bodyText} !important; background: ${C.sectionBg} !important; }
        .chip-dest { display: inline-flex; align-items: center; gap: 4px; background: ${C.primaryBg}; color: ${C.primary}; border: 1px solid #BFDBFE; border-radius: 20px; padding: 3px 10px; font-size: 12px; font-weight: 500; }
        .action-link { background: none; border: none; padding: 0; color: ${C.primary}; font-size: 12px; cursor: pointer; font-family: inherit; text-align: left; text-decoration: none; opacity: 0.85; }
        .action-link:hover { opacity: 1; text-decoration: underline; }
        .doc-btn { padding: 5px 12px; border: 1px solid ${C.cardBorder}; border-radius: 6px; background: ${C.cardBg}; cursor: pointer; font-size: 12px; color: #475569; font-family: inherit; transition: all 0.1s; }
        .doc-btn:hover { background: ${C.primaryBg}; border-color: #BFDBFE; color: ${C.primary}; }
      `}</style>

      {/* ── Sticky top block (tab bar + pipeline) ── */}
      <div style={{ position: 'sticky', top: 48, zIndex: 40, background: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}>

        {/* Tab bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex' }}>
            {TABS.map(t => {
              const active = activeTab === t;
              return (
                <button key={t} onClick={() => setActiveTab(t)} className={`tab-btn${active ? ' active' : ''}`} style={{
                  padding: '0 18px', height: 42, border: 'none', background: active ? '#F0F9FF' : 'none',
                  fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
                  color: active ? C.primary : '#64748B',
                  fontWeight: active ? 600 : 400,
                  borderBottom: active ? `2px solid ${C.primary}` : '2px solid transparent',
                  transition: 'color 0.12s, background 0.12s',
                }}>{t}</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <Link href="/reservations" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', textDecoration: 'none', fontSize: 12 }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = C.primary)}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#64748B')}
            >
              <ChevronLeft size={14} strokeWidth={2} />
              Back
            </Link>
            <div style={{ width: 1, height: 16, background: C.cardBorder }} />
            <span style={{ color: '#94A3B8', fontSize: 12 }}>Ref:</span>
            <span style={{ fontWeight: 600, color: C.bodyText, fontSize: 12 }}>(New)</span>
            <span style={{ background: '#EFF6FF', color: C.primary, border: '1px solid #BFDBFE', borderRadius: 20, fontSize: 11, fontWeight: 600, padding: '2px 10px' }}>
              Enquiry
            </span>
          </div>
        </div>

        {/* Status pipeline */}
        <div style={{ background: C.sectionBg, borderTop: `1px solid ${C.cardBorder}`, padding: '8px 24px', maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {STAGES.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: `2px solid ${i === 0 ? C.primary : i === 1 ? C.primary : '#CBD5E1'}`,
                    background: i === 0 ? C.primary : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: i <= 1 ? `0 0 0 3px ${C.primaryBg}` : 'none',
                  }}>
                    {i === 0 && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                    {i === 1 && <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.primary }} />}
                  </div>
                  <span style={{
                    fontSize: 10, marginTop: 4, whiteSpace: 'nowrap',
                    color: i === 0 ? C.primary : i === 1 ? '#334155' : '#94A3B8',
                    fontWeight: i <= 1 ? 600 : 400,
                  }}>{s}</span>
                </div>
                {i < STAGES.length - 1 && (
                  <div style={{ flex: 1, height: 2, borderRadius: 1, background: i < 1 ? C.primary : '#E2E8F0', margin: '0 0 18px' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px 48px' }}>

        {/* Page title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Link href="/reservations" style={{ fontSize: 12, color: C.mutedText, textDecoration: 'none' }}>Reservations</Link>
              <span style={{ fontSize: 12, color: C.mutedText }}>/</span>
              <span style={{ fontSize: 12, color: C.bodyText, fontWeight: 500 }}>New Reservation</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.bodyText, margin: 0 }}>Create New Reservation</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 20px', borderRadius: 8, border: 'none',
              background: saving ? '#94A3B8' : C.primary,
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 1px 3px rgba(30,64,175,0.3)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.background = '#1E3A8A'; }}
            onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLElement).style.background = C.primary; }}
          >
            <Save size={14} strokeWidth={2} />
            {saving ? 'Creating…' : 'Create Reservation'}
          </button>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 272px', gap: 16, alignItems: 'start' }}>

          {/* ── Left: form cards ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Card helper */}
            {([
              // [0] General Information
              {
                title: 'General Information',
                content: (
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '22%' }} /><col style={{ width: '28%' }} />
                      <col style={{ width: '22%' }} /><col style={{ width: '28%' }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td style={labelCell}><span style={{ color: C.required }}>* </span>Res. #</td>
                        <td style={{ ...inputCell, background: '#F8FAFC', fontStyle: 'italic', color: C.mutedText, fontSize: 12 }}>
                          Auto-generated
                        </td>
                        <td style={labelCell}>Res. Date</td>
                        <td style={{ ...inputCell, borderRight: 'none' }}>
                          <input type="date" style={fieldInput} />
                        </td>
                      </tr>
                      <tr>
                        <td style={labelCell}>Source</td>
                        <td style={inputCell}>
                          <select style={{ ...fieldInput, cursor: 'pointer' }} value={form.source} onChange={e => set('source', e.target.value)}>
                            {['Direct','Walk-in','Partner','Referral','Online','Other'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td style={labelCell}>Res. By</td>
                        <td style={{ ...inputCell, borderRight: 'none' }}>
                          <select style={{ ...fieldInput, cursor: 'pointer' }} value={form.assigned_staff} onChange={e => set('assigned_staff', e.target.value)}>
                            {['Unassigned','Nimsha','Dilhan','Kavindi','Sachini'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ ...labelCell, borderBottom: 'none' }}>Travel Type</td>
                        <td style={inputCell}>
                          <select style={{ ...fieldInput, cursor: 'pointer' }} value={form.travel_purpose} onChange={e => set('travel_purpose', e.target.value as TravelPurpose)}>
                            {['leisure','honeymoon','business','anniversary','birthday','corporate','group_tour','other'].map(p => (
                              <option key={p} value={p}>{p.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ ...labelCell, borderBottom: 'none' }}>Budget</td>
                        <td style={{ ...inputCell, borderRight: 'none', borderBottom: 'none' }}>
                          <input style={fieldInput} value={form.budget_range} onChange={e => set('budget_range', e.target.value)} placeholder="e.g. $3,000 – $5,000" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ),
              },
              // [1] Customer Information
              {
                title: 'Customer Information',
                content: (
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '22%' }} /><col style={{ width: '28%' }} />
                      <col style={{ width: '22%' }} /><col style={{ width: '28%' }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td style={labelCell}><span style={{ color: C.required }}>* </span>Name</td>
                        <td colSpan={3} style={{ ...inputCell, borderRight: 'none' }}>
                          <select style={{ ...fieldInput, marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${C.cardBorder}`, cursor: 'pointer' }}
                            value={form.client_id} onChange={e => {
                              const c = clients.find(c => c.id === e.target.value);
                              set('client_id', e.target.value);
                              if (c) { set('full_name', c.full_name); set('nationality', c.nationality ?? ''); set('email', c.email ?? ''); set('phone', c.phone ?? ''); set('passport_number', c.passport_number ?? ''); }
                            }}>
                            <option value="">— Create new client —</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                          </select>
                          <input style={{ ...fieldInput, paddingTop: 2 }} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Full name" />
                        </td>
                      </tr>
                      <tr>
                        <td style={labelCell}>Nationality</td>
                        <td style={inputCell}>
                          <input style={fieldInput} value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="e.g. British" />
                        </td>
                        <td style={labelCell}>Passport No</td>
                        <td style={{ ...inputCell, borderRight: 'none' }}>
                          <input style={fieldInput} value={form.passport_number} onChange={e => set('passport_number', e.target.value)} placeholder="AB1234567" />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ ...labelCell, borderBottom: 'none' }}>Email</td>
                        <td style={inputCell}>
                          <input type="email" style={fieldInput} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
                        </td>
                        <td style={{ ...labelCell, borderBottom: 'none' }}>Phone</td>
                        <td style={{ ...inputCell, borderRight: 'none', borderBottom: 'none' }}>
                          <input style={fieldInput} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+44 7700 900000" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ),
              },
            ] as { title: string; content: React.ReactNode }[]).map(({ title, content }) => (
              <div key={title} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, overflow: 'hidden', boxShadow: C.shadow }}>
                <div style={secHeader}>{title}</div>
                {content}
              </div>
            ))}

            {/* Arrival + Departure side-by-side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                {
                  title: 'Arrival Information',
                  rows: [
                    { label: '* Date / Time', node: (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input type="date" style={{ ...fieldInput, flex: 2 }} value={form.arrival_date} onChange={e => set('arrival_date', e.target.value)} />
                        <input type="time" style={{ ...fieldInput, flex: 1 }} value={form.arrival_time} onChange={e => set('arrival_time', e.target.value)} />
                      </div>
                    )},
                    { label: '* Airport', node: <input style={fieldInput} value={form.airport_arrival} onChange={e => set('airport_arrival', e.target.value)} placeholder="CMB — Bandaranaike Intl" /> },
                    { label: 'Flight #', node: <input style={fieldInput} value={form.flight_arrival} onChange={e => set('flight_arrival', e.target.value)} placeholder="EK651" /> },
                    { label: 'Memo', node: <input style={fieldInput} value={form.arrival_memo} onChange={e => set('arrival_memo', e.target.value)} placeholder="Meet & greet notes…" />, last: true },
                  ],
                },
                {
                  title: 'Departure Information',
                  rows: [
                    { label: '* Date / Time', node: (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input type="date" style={{ ...fieldInput, flex: 2 }} value={form.departure_date} onChange={e => set('departure_date', e.target.value)} />
                        <input type="time" style={{ ...fieldInput, flex: 1 }} value={form.departure_time} onChange={e => set('departure_time', e.target.value)} />
                      </div>
                    )},
                    { label: '* Airport', node: <input style={fieldInput} value={form.airport_departure} onChange={e => set('airport_departure', e.target.value)} placeholder="CMB — Bandaranaike Intl" /> },
                    { label: 'Flight #', node: <input style={fieldInput} value={form.flight_departure} onChange={e => set('flight_departure', e.target.value)} placeholder="EK652" /> },
                    { label: 'Memo', node: <input style={fieldInput} value={form.departure_memo} onChange={e => set('departure_memo', e.target.value)} placeholder="Drop-off notes…" />, last: true },
                  ],
                },
              ].map(({ title, rows }) => (
                <div key={title} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, overflow: 'hidden', boxShadow: C.shadow }}>
                  <div style={secHeader}>{title}</div>
                  {rows.map(({ label, node, last }) => (
                    <div key={label} style={{ display: 'flex', borderBottom: last ? 'none' : `1px solid ${C.divider}` }}>
                      <div style={{ padding: '9px 14px', fontSize: 12, color: C.labelText, fontWeight: 500, background: C.cardBg, width: '40%', flexShrink: 0, display: 'flex', alignItems: 'center', borderRight: `1px solid ${C.divider}` }}>
                        {label.startsWith('*') ? <><span style={{ color: C.required, marginRight: 3 }}>*</span>{label.slice(2)}</> : label}
                      </div>
                      <div style={{ flex: 1, padding: '7px 10px', background: C.inputBg, display: 'flex', alignItems: 'center' }}>
                        {node}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Pax & Trip Duration side-by-side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              {/* Pax */}
              <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, overflow: 'hidden', boxShadow: C.shadow }}>
                <div style={secHeader}>Pax &amp; Group Details</div>
                {[
                  { label: '* Adults', value: form.num_adults, key: 'num_adults', min: 1 },
                  { label: 'Children', value: form.num_children, key: 'num_children', min: 0 },
                  { label: 'Infants',  value: form.num_infants,  key: 'num_infants',  min: 0 },
                ].map(({ label, value, key, min }, i, arr) => (
                  <div key={label} style={{ display: 'flex', borderBottom: i < arr.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
                    <div style={{ padding: '9px 14px', fontSize: 12, color: C.labelText, fontWeight: 500, background: C.cardBg, width: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', borderRight: `1px solid ${C.divider}` }}>
                      {label.startsWith('*') ? <><span style={{ color: C.required, marginRight: 3 }}>*</span>{label.slice(2)}</> : label}
                    </div>
                    <div style={{ flex: 1, padding: '7px 10px', background: C.inputBg, display: 'flex', alignItems: 'center' }}>
                      <input type="number" min={min} style={{ ...fieldInput, width: 64, textAlign: 'center' }}
                        value={value} onChange={e => set(key, Math.max(min, parseInt(e.target.value) || 0))} />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', borderTop: `1px solid ${C.divider}` }}>
                  <div style={{ padding: '9px 14px', fontSize: 12, color: C.labelText, fontWeight: 500, background: C.cardBg, width: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', borderRight: `1px solid ${C.divider}` }}>
                    Total Pax
                  </div>
                  <div style={{ flex: 1, padding: '9px 14px', background: C.sectionBg, fontSize: 13, fontWeight: 700, color: C.bodyText }}>
                    {totalPax} pax
                  </div>
                </div>
              </div>

              {/* Trip Duration */}
              <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, overflow: 'hidden', boxShadow: C.shadow }}>
                <div style={secHeader}>Trip Duration &amp; Destinations</div>
                <div style={{ display: 'flex', borderBottom: `1px solid ${C.divider}` }}>
                  <div style={{ padding: '9px 14px', fontSize: 12, color: C.labelText, fontWeight: 500, background: C.cardBg, width: '40%', flexShrink: 0, display: 'flex', alignItems: 'center', borderRight: `1px solid ${C.divider}` }}>
                    Duration
                  </div>
                  <div style={{ flex: 1, padding: '9px 14px', background: C.sectionBg, fontSize: 13, fontWeight: 700, color: nights ? C.bodyText : C.mutedText }}>
                    {nights ? `${nights} nights` : '—'}
                  </div>
                </div>
                <div style={{ padding: '10px 14px' }}>
                  <p style={{ fontSize: 11, color: C.mutedText, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Destinations</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {form.destinations.map(d => (
                      <span key={d} className="chip-dest">
                        <MapPin size={10} strokeWidth={2.5} />
                        {d}
                        <button onClick={() => removeDest(d)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', lineHeight: 1 }}>
                          <X size={10} color={C.primary} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    style={{ ...fieldInput, border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: '7px 10px', background: C.inputBg, fontSize: 12 }}
                    value={form.destInput}
                    onChange={e => set('destInput', e.target.value)}
                    onKeyDown={addDest}
                    placeholder="Type destination + Enter"
                  />
                </div>
              </div>
            </div>

            {/* Partner / Trade Source */}
            <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, overflow: 'hidden', boxShadow: C.shadow }}>
              <div style={secHeader}>Partner / Trade Source</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '22%' }} /><col style={{ width: '28%' }} />
                  <col style={{ width: '22%' }} /><col style={{ width: '28%' }} />
                </colgroup>
                <tbody>
                  <tr>
                    <td style={{ ...labelCell, borderBottom: 'none' }}>Partner Agency</td>
                    <td style={inputCell}>
                      <select style={{ ...fieldInput, cursor: 'pointer' }} value={form.partner_id} onChange={e => set('partner_id', e.target.value)}>
                        <option value="">— Direct Booking —</option>
                        {partners.map(p => <option key={p.id} value={p.id}>{p.company_name}</option>)}
                      </select>
                    </td>
                    <td style={{ ...labelCell, borderBottom: 'none' }}>Partner Ref</td>
                    <td style={{ ...inputCell, borderRight: 'none', borderBottom: 'none' }}>
                      <input style={fieldInput} value={form.partner_reference} onChange={e => set('partner_reference', e.target.value)} placeholder="TUI-2026-XXXX" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Internal Notes */}
            <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, overflow: 'hidden', boxShadow: C.shadow }}>
              <div style={secHeader}>Internal Notes / Memo</div>
              <div style={{ padding: 14 }}>
                <textarea
                  style={{ ...fieldInput, border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: '10px 12px', background: C.inputBg, minHeight: 88, resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
                  value={form.internal_notes}
                  onChange={e => set('internal_notes', e.target.value)}
                  placeholder="Add internal notes, special requests, or team instructions…"
                />
                <p style={{ fontSize: 11, color: C.mutedText, marginTop: 4, textAlign: 'right' }}>{form.internal_notes.length} characters</p>
              </div>
            </div>

            {/* Attach Documents */}
            <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, overflow: 'hidden', boxShadow: C.shadow }}>
              <div style={{ ...secHeader, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Paperclip size={12} strokeWidth={2} />Attach Documents</span>
                {attachedDocs.length > 0 && (
                  <span style={{ fontSize: 11, color: C.primary, fontWeight: 600, letterSpacing: 0, textTransform: 'none' }}>
                    {attachedDocs.length} file{attachedDocs.length > 1 ? 's' : ''} attached
                  </span>
                )}
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: attachedDocs.length ? 12 : 0 }}>
                  {DOC_TYPES.map(type => (
                    <button key={type} className="doc-btn" onClick={() => handleFileChange(type)}>{type}</button>
                  ))}
                </div>
                {attachedDocs.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 10, borderTop: `1px solid ${C.divider}` }}>
                    {attachedDocs.map((d, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: C.primaryBg, color: C.primary, border: '1px solid #BFDBFE', borderRadius: 6, padding: '4px 10px', fontSize: 12 }}>
                        {d.type}: {d.name}
                        <button onClick={() => setAttachedDocs(p => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
                          <X size={10} color={C.primary} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>{/* end left column */}

          {/* ── Right sidebar: Charges Summary ── */}
          <div style={{ position: 'sticky', top: 180 }}>
            <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, overflow: 'hidden', boxShadow: C.shadow }}>

              {/* Header */}
              <div style={{ ...secHeader, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
                <span>Charges Summary</span>
                <span style={{ fontSize: 10, fontWeight: 700, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', borderRadius: 20, padding: '2px 8px', textTransform: 'none', letterSpacing: 0 }}>
                  PENDING
                </span>
              </div>

              {/* Rate + Currency */}
              <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.divider}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: '* Rate code', el: (
                    <select style={{ ...fieldInput, border: `1px solid ${C.cardBorder}`, borderRadius: 5, padding: '5px 8px', background: C.inputBg, fontSize: 12, cursor: 'pointer' }} value={form.rate_code} onChange={e => set('rate_code', e.target.value)}>
                      {['leisure','corporate','group','vip','honeymoon'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  )},
                  { label: '* Currency', el: (
                    <select style={{ ...fieldInput, border: `1px solid ${C.cardBorder}`, borderRadius: 5, padding: '5px 8px', background: C.inputBg, fontSize: 12, cursor: 'pointer' }} value={form.currency} onChange={e => set('currency', e.target.value as Currency)}>
                      {['USD','GBP','EUR','LKR'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  )},
                ].map(({ label, el }) => (
                  <div key={label}>
                    <label style={{ fontSize: 11, color: C.labelText, fontWeight: 500, display: 'block', marginBottom: 4 }}>{label}</label>
                    {el}
                  </div>
                ))}
              </div>

              {/* Cost lines */}
              <div style={{ padding: '8px 0' }}>
                {[
                  ['Accommodation','—'],
                  ['Transport','—'],
                  ['Activities','—'],
                  ['Guide Fees','—'],
                  ['Miscellaneous','—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 16px', fontSize: 13 }}>
                    <span style={{ color: C.labelText }}>{k}</span>
                    <span style={{ color: C.mutedText, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ height: 1, background: C.divider, margin: '0 16px' }} />

              {/* Discount */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 16px', fontSize: 13 }}>
                <span style={{ color: C.labelText }}>Discount</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <select style={{ fontSize: 12, border: `1px solid ${C.cardBorder}`, borderRadius: 4, padding: '2px 4px', fontFamily: 'inherit', background: C.inputBg }} value={form.discount_pct} onChange={e => set('discount_pct', parseInt(e.target.value))}>
                    {[0,5,10,15,20].map(p => <option key={p} value={p}>{p}%</option>)}
                  </select>
                  <span style={{ color: C.mutedText, fontVariantNumeric: 'tabular-nums' }}>0.00</span>
                </div>
              </div>

              {/* Surcharges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 16px', fontSize: 13 }}>
                <span style={{ color: C.labelText }}>Surcharges</span>
                <span style={{ color: C.bodyText, fontVariantNumeric: 'tabular-nums' }}>0.00</span>
              </div>

              <div style={{ height: 1, background: C.cardBorder, margin: '4px 0' }} />

              {/* Net total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 16px', fontSize: 13 }}>
                <span style={{ color: C.labelText }}>Net total</span>
                <span style={{ color: C.mutedText }}>—</span>
              </div>

              {/* VAT */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 16px', fontSize: 13 }}>
                <span style={{ color: C.labelText }}>VAT</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <select style={{ fontSize: 12, border: `1px solid ${C.cardBorder}`, borderRadius: 4, padding: '2px 4px', fontFamily: 'inherit', background: C.inputBg }} value={form.vat_pct} onChange={e => set('vat_pct', parseInt(e.target.value))}>
                    {[0,5,8,10,15].map(p => <option key={p} value={p}>{p}%</option>)}
                  </select>
                  <span style={{ color: C.bodyText, fontVariantNumeric: 'tabular-nums' }}>0.00</span>
                </div>
              </div>

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: C.sectionBg, borderTop: `1px solid ${C.cardBorder}`, borderBottom: `1px solid ${C.cardBorder}` }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.bodyText }}>Total</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.mutedText, fontVariantNumeric: 'tabular-nums' }}>—</span>
              </div>

              {/* Commission */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 16px', fontSize: 13 }}>
                <span style={{ color: C.labelText }}>Commission</span>
                <span style={{ color: C.bodyText, fontVariantNumeric: 'tabular-nums' }}>0.00</span>
              </div>

              {/* Paid / Balance */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 16px', fontSize: 13 }}>
                <span style={{ color: C.labelText }}>Paid / Balance</span>
                <span style={{ color: C.primary, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>0.00 / 0.00</span>
              </div>

              <div style={{ height: 1, background: C.divider }} />

              {/* Action links */}
              <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {['Record Payment','Send Invoice','Build Itinerary','Send Itinerary PDF','Send WhatsApp Update'].map(action => (
                  <button key={action} className="action-link" style={{ color: C.primary }}>{action}</button>
                ))}
              </div>

              {/* Create button */}
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.divider}` }}>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  style={{
                    width: '100%', background: saving ? '#94A3B8' : C.primary,
                    color: '#fff', border: 'none', borderRadius: 8,
                    padding: '10px 0', fontSize: 13, fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', letterSpacing: '0.02em',
                    transition: 'background 0.12s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  }}
                  onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.background = '#1E3A8A'; }}
                  onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLElement).style.background = C.primary; }}
                >
                  <Save size={14} strokeWidth={2} />
                  {saving ? 'Creating…' : 'Create Reservation'}
                </button>
              </div>

            </div>
          </div>{/* end sidebar */}

        </div>{/* end grid */}
      </div>{/* end page content */}

      <input ref={fileRef} type="file" style={{ display: 'none' }} />
    </div>
  );
}
