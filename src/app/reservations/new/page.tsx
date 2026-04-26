'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import { generateReference } from '@/lib/utils';
import { mockClients, mockPartners } from '@/lib/mock-data';
import type { Currency, TravelPurpose } from '@/types';
import { Check, Plus, Trash2, Upload, FileText, X, Star, Heart, Cake, Briefcase } from 'lucide-react';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const INPUT: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.11)',
  borderRadius: 7,
  color: '#fff',
  padding: '0 0.9rem',
  fontSize: '0.84rem',
  width: '100%',
  height: 40,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const TEXTAREA: React.CSSProperties = {
  ...INPUT,
  height: 'auto',
  padding: '0.65rem 0.9rem',
  resize: 'vertical' as const,
  lineHeight: 1.5,
};

const LABEL: React.CSSProperties = {
  color: 'rgba(255,255,255,0.38)',
  fontSize: '0.63rem',
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  marginBottom: '0.3rem',
  display: 'block',
};

const CARD: React.CSSProperties = {
  background: '#161616',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 12,
  padding: '1.5rem',
  marginBottom: '0.875rem',
};

const CARD_TITLE: React.CSSProperties = {
  color: '#fff',
  fontSize: '0.9rem',
  fontWeight: 600,
  margin: '0 0 0.9rem 0',
  paddingBottom: '0.9rem',
  borderBottom: '1px solid rgba(255,255,255,0.07)',
  letterSpacing: '-0.01em',
};

const STEPS = [
  { id: 1, label: 'Client' },
  { id: 2, label: 'Travel' },
  { id: 3, label: 'Accommodation' },
  { id: 4, label: 'Transfers' },
  { id: 5, label: 'Finance' },
  { id: 6, label: 'Review' },
];

// ─── Reusable sub-components ──────────────────────────────────────────────────

function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div style={{ marginBottom: '0.9rem', ...(span ? { gridColumn: '1 / -1' } : {}) }}>
      <label style={LABEL}>{label}</label>
      {children}
    </div>
  );
}

function Grid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0.75rem' }}>
      {children}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '1.4rem 0 1rem' }}>
      <span style={{
        color: '#C9A84C', fontSize: '0.62rem', fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap',
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.12)' }} />
    </div>
  );
}

function ToggleCard({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        background: checked ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${checked ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 8, padding: '0.7rem 1rem', cursor: 'pointer', textAlign: 'left', width: '100%',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
        background: checked ? '#C9A84C' : 'rgba(255,255,255,0.06)',
        border: `2px solid ${checked ? '#C9A84C' : 'rgba(255,255,255,0.15)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <Check size={10} color="#080808" strokeWidth={3} />}
      </div>
      <span style={{ color: checked ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)', fontSize: '0.83rem', fontWeight: checked ? 500 : 400 }}>{label}</span>
    </button>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TravellerEntry {
  id: string;
  full_name: string;
  type: 'adult' | 'child' | 'infant';
  nationality: string;
  passport_number: string;
  passport_expiry: string;
  date_of_birth: string;
}

interface DocEntry {
  id: string;
  doc_type: 'passport' | 'visa' | 'insurance' | 'flight_ticket' | 'other';
  file_name: string;
  assigned_to: string;
  uploaded_at: string;
}

const DOC_TYPE_LABELS: Record<DocEntry['doc_type'], string> = {
  passport: 'Passport', visa: 'Visa', insurance: 'Insurance',
  flight_ticket: 'Flight Ticket', other: 'Other',
};

const DOC_TYPE_COLORS: Record<DocEntry['doc_type'], string> = {
  passport: '#3B82F6', visa: '#8B5CF6', insurance: '#10B981',
  flight_ticket: '#F59E0B', other: '#6B7280',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewReservationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    client_id: '',
    full_name: '', company_name: '', email: '', phone: '', whatsapp: '',
    nationality: '', passport_number: '', passport_expiry: '', date_of_birth: '',
    dietary_restrictions: '', medical_notes: '',
    is_vip: false, special_occasions: [] as string[],
    arrival_date: '', departure_date: '',
    num_adults: 1, num_children: 0, num_infants: 0,
    destinations: '', travel_purpose: 'leisure' as TravelPurpose,
    flight_arrival: '', airport_arrival: '', flight_departure: '', airport_departure: '',
    partner_id: '', partner_reference: '', internal_notes: '',
    hotel_name: '', hotel_category: '5_star', check_in: '', check_out: '',
    room_type: 'double', num_rooms: 1, meal_plan: 'BB', special_requests: '',
    has_second_property: false,
    hotel2_name: '', hotel2_category: '5_star', hotel2_check_in: '', hotel2_check_out: '',
    hotel2_room_type: 'double', hotel2_num_rooms: 1, hotel2_meal_plan: 'BB',
    transfer_pickup: '', transfer_dropoff: '', transfer_date: '',
    transfer_flight_number: '', vehicle_type: 'van', num_vehicles: 1, is_chauffeur: true,
    has_departure_transfer: false,
    dep_transfer_pickup: '', dep_transfer_dropoff: '', dep_transfer_date: '',
    dep_transfer_flight_number: '', dep_vehicle_type: 'van', dep_num_vehicles: 1,
    currency: 'GBP' as Currency, total_cost: '', budget_range: '',
    deposit_amount: '', deposit_due_date: '', balance_due_date: '',
    payment_method: 'bank_transfer', assigned_staff: 'Nimsha',
  });

  const [travellers, setTravellers] = useState<TravellerEntry[]>([]);
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [newDoc, setNewDoc] = useState<{ doc_type: DocEntry['doc_type']; file_name: string; assigned_to: string }>({
    doc_type: 'passport', file_name: '', assigned_to: '',
  });

  const set = (field: string, value: unknown) => setForm(prev => ({ ...prev, [field]: value }));

  const addTraveller = () => setTravellers(prev => [...prev, {
    id: `t_${Date.now()}`, full_name: '', type: 'adult', nationality: '',
    passport_number: '', passport_expiry: '', date_of_birth: '',
  }]);

  const updateTraveller = (id: string, field: keyof TravellerEntry, value: string) =>
    setTravellers(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));

  const removeTraveller = (id: string) => setTravellers(prev => prev.filter(t => t.id !== id));

  const addDoc = () => {
    if (!newDoc.file_name.trim()) return;
    setDocs(prev => [...prev, { id: `d_${Date.now()}`, ...newDoc, uploaded_at: new Date().toISOString() }]);
    setNewDoc({ doc_type: 'passport', file_name: '', assigned_to: '' });
  };

  const removeDoc = (id: string) => setDocs(prev => prev.filter(d => d.id !== id));
  const selectedClient = mockClients.find(c => c.id === form.client_id);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      generateReference();
      await new Promise(r => setTimeout(r, 800));
      router.push('/reservations');
    } finally { setSaving(false); }
  };

  const OCCASION_CHIPS = [
    { key: 'honeymoon', label: 'Honeymoon', icon: <Heart size={12} strokeWidth={2} /> },
    { key: 'anniversary', label: 'Anniversary', icon: <Heart size={12} strokeWidth={2} /> },
    { key: 'birthday', label: 'Birthday', icon: <Cake size={12} strokeWidth={2} /> },
    { key: 'corporate', label: 'Corporate', icon: <Briefcase size={12} strokeWidth={2} /> },
  ];

  return (
    <div style={{ background: '#0F0F0F', minHeight: '100vh' }}>
      <TopBar title="New Reservation" subtitle="Complete all steps to create a reservation" />

      <div style={{ padding: '1.5rem 2rem 3rem' }}>

        {/* ── Step Indicator ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: '#161616', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '1.1rem 2rem', marginBottom: '1.25rem',
        }}>
          {STEPS.map((s, idx) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, cursor: step > s.id ? 'pointer' : 'default' }}
                onClick={() => step > s.id && setStep(s.id)}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', marginBottom: 5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  background: step > s.id ? 'rgba(201,168,76,0.15)' : step === s.id ? '#C9A84C' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${step === s.id ? '#C9A84C' : step > s.id ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.1)'}`,
                }}>
                  {step > s.id
                    ? <Check size={12} color="#C9A84C" strokeWidth={2.5} />
                    : <span style={{ fontSize: '0.7rem', color: step === s.id ? '#111' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{s.id}</span>
                  }
                </div>
                <span style={{
                  fontSize: '0.63rem', letterSpacing: '0.05em', transition: 'color 0.2s',
                  color: step === s.id ? '#C9A84C' : step > s.id ? 'rgba(201,168,76,0.55)' : 'rgba(255,255,255,0.2)',
                  fontWeight: step === s.id ? 600 : 400,
                }}>{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div style={{
                  height: 1, flex: 1, marginBottom: 18, transition: 'background 0.3s',
                  background: step > s.id ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.05)',
                }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 288px', gap: '0.875rem', alignItems: 'start' }}>
          <div>

            {/* ══════════════════════════════════════════
                STEP 1 — CLIENT
            ══════════════════════════════════════════ */}
            {step === 1 && (
              <div>
                {/* Lead client card */}
                <div style={CARD}>
                  <h3 style={CARD_TITLE}>Lead Client</h3>

                  <Field label="Search existing client">
                    <select style={INPUT} value={form.client_id} onChange={e => set('client_id', e.target.value)}>
                      <option value="">— Create new client —</option>
                      {mockClients.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name} · {c.nationality}</option>
                      ))}
                    </select>
                  </Field>

                  {selectedClient ? (
                    <div style={{
                      background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.18)',
                      borderRadius: 9, padding: '1rem 1.1rem', marginTop: '0.25rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', background: 'rgba(201,168,76,0.15)',
                          border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0,
                        }}>
                          <span style={{ color: '#C9A84C', fontSize: '0.78rem', fontWeight: 700 }}>
                            {selectedClient.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </span>
                        </div>
                        <div>
                          <div style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600 }}>{selectedClient.full_name}</div>
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{selectedClient.nationality} · {selectedClient.email}</div>
                        </div>
                        {selectedClient.is_vip && (
                          <span style={{ marginLeft: 'auto', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 20, padding: '2px 9px', color: '#C9A84C', fontSize: '0.68rem', fontWeight: 600 }}>VIP</span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 2rem' }}>
                        {[
                          ['Phone', selectedClient.phone],
                          ['Passport', selectedClient.passport_number || '—'],
                          ['WhatsApp', selectedClient.whatsapp || '—'],
                          ['Dietary', selectedClient.dietary_restrictions || 'None'],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.73rem' }}>{k}</span>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.76rem' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <SectionHeader label="Personal details" />
                      <Grid cols={2}>
                        <Field label="Full Name *"><input style={INPUT} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="James & Sophie Whitfield" /></Field>
                        <Field label="Company / Organisation"><input style={INPUT} value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Optional" /></Field>
                        <Field label="Email Address *"><input style={INPUT} type="email" value={form.email} onChange={e => set('email', e.target.value)} /></Field>
                        <Field label="Phone Number *"><input style={INPUT} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+44 7700 900000" /></Field>
                        <Field label="WhatsApp"><input style={INPUT} value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} /></Field>
                        <Field label="Nationality"><input style={INPUT} value={form.nationality} onChange={e => set('nationality', e.target.value)} /></Field>
                        <Field label="Date of Birth"><input style={INPUT} type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></Field>
                        <Field label="Dietary Restrictions"><input style={INPUT} value={form.dietary_restrictions} onChange={e => set('dietary_restrictions', e.target.value)} placeholder="Vegetarian, halal, nut allergy..." /></Field>
                      </Grid>

                      <SectionHeader label="Passport & travel documents" />
                      <Grid cols={2}>
                        <Field label="Passport Number"><input style={INPUT} value={form.passport_number} onChange={e => set('passport_number', e.target.value)} placeholder="AB1234567" /></Field>
                        <Field label="Passport Expiry Date"><input style={INPUT} type="date" value={form.passport_expiry} onChange={e => set('passport_expiry', e.target.value)} /></Field>
                      </Grid>
                      <Field label="Medical Notes / Accessibility Requirements">
                        <textarea style={{ ...TEXTAREA, minHeight: 60 }} value={form.medical_notes} onChange={e => set('medical_notes', e.target.value)} placeholder="Wheelchair access, medication, mobility requirements..." />
                      </Field>
                    </>
                  )}
                </div>

                {/* Tags & Occasions */}
                <div style={CARD}>
                  <h3 style={CARD_TITLE}>Tags &amp; Occasions</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>

                    {/* VIP chip */}
                    <button
                      type="button"
                      onClick={() => set('is_vip', !form.is_vip)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                        background: form.is_vip ? 'rgba(201,168,76,0.14)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${form.is_vip ? 'rgba(201,168,76,0.45)' : 'rgba(255,255,255,0.1)'}`,
                        color: form.is_vip ? '#C9A84C' : 'rgba(255,255,255,0.4)',
                        fontSize: '0.78rem', fontWeight: 500,
                      }}
                    >
                      <Star size={12} strokeWidth={2} fill={form.is_vip ? '#C9A84C' : 'none'} />
                      VIP Client
                    </button>

                    {/* Occasion chips */}
                    {OCCASION_CHIPS.map(({ key, label, icon }) => {
                      const active = form.special_occasions.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => set('special_occasions', active
                            ? form.special_occasions.filter(o => o !== key)
                            : [...form.special_occasions, key])}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                            background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}`,
                            color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                            fontSize: '0.78rem', fontWeight: active ? 500 : 400,
                          }}
                        >
                          {icon}
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Travellers */}
                <div style={CARD}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem', paddingBottom: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div>
                      <h3 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Additional Travellers</h3>
                      {travellers.length > 0 && (
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.73rem' }}>{travellers.length} traveller{travellers.length > 1 ? 's' : ''} added</span>
                      )}
                    </div>
                    <button onClick={addTraveller} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: 'rgba(201,168,76,0.09)', border: '1px solid rgba(201,168,76,0.22)',
                      borderRadius: 6, color: '#C9A84C', fontSize: '0.75rem', fontWeight: 500,
                      padding: '5px 11px', cursor: 'pointer', flexShrink: 0,
                    }}>
                      <Plus size={12} strokeWidth={2.5} /> Add Traveller
                    </button>
                  </div>

                  {travellers.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: '1.25rem 0', color: 'rgba(255,255,255,0.2)',
                      fontSize: '0.8rem', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 8,
                    }}>
                      No additional travellers. Use &ldquo;Add Traveller&rdquo; to capture passenger details.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {travellers.map((t, idx) => (
                        <div key={t.id} style={{
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: 9, padding: '0.85rem 1rem',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Traveller {idx + 1}</span>
                            <button onClick={() => removeTraveller(t.id)} style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: 3,
                              color: 'rgba(255,255,255,0.2)', display: 'flex',
                            }}>
                              <X size={13} strokeWidth={2} />
                            </button>
                          </div>
                          <Grid cols={3}>
                            <div style={{ gridColumn: '1 / 2' }}>
                              <label style={LABEL}>Full Name</label>
                              <input style={INPUT} placeholder="Full name" value={t.full_name} onChange={e => updateTraveller(t.id, 'full_name', e.target.value)} />
                            </div>
                            <div>
                              <label style={LABEL}>Type</label>
                              <select style={INPUT} value={t.type} onChange={e => updateTraveller(t.id, 'type', e.target.value)}>
                                <option value="adult">Adult</option>
                                <option value="child">Child</option>
                                <option value="infant">Infant</option>
                              </select>
                            </div>
                            <div>
                              <label style={LABEL}>Nationality</label>
                              <input style={INPUT} placeholder="UK" value={t.nationality} onChange={e => updateTraveller(t.id, 'nationality', e.target.value)} />
                            </div>
                          </Grid>
                          <Grid cols={3}>
                            <div>
                              <label style={LABEL}>Passport No.</label>
                              <input style={INPUT} placeholder="AB123456" value={t.passport_number} onChange={e => updateTraveller(t.id, 'passport_number', e.target.value)} />
                            </div>
                            <div>
                              <label style={LABEL}>Passport Expiry</label>
                              <input style={INPUT} type="date" value={t.passport_expiry} onChange={e => updateTraveller(t.id, 'passport_expiry', e.target.value)} />
                            </div>
                            <div>
                              <label style={LABEL}>Date of Birth</label>
                              <input style={INPUT} type="date" value={t.date_of_birth} onChange={e => updateTraveller(t.id, 'date_of_birth', e.target.value)} />
                            </div>
                          </Grid>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Documents */}
                <div style={CARD}>
                  <h3 style={CARD_TITLE}>Documents</h3>

                  <div style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 9, padding: '0.85rem 1rem', marginBottom: '0.875rem',
                  }}>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.65rem' }}>Attach document</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
                      <div>
                        <label style={LABEL}>Type</label>
                        <select style={INPUT} value={newDoc.doc_type} onChange={e => setNewDoc(d => ({ ...d, doc_type: e.target.value as DocEntry['doc_type'] }))}>
                          {(Object.keys(DOC_TYPE_LABELS) as DocEntry['doc_type'][]).map(k => (
                            <option key={k} value={k}>{DOC_TYPE_LABELS[k]}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={LABEL}>File Name / Reference</label>
                        <input style={INPUT} placeholder="passport_james.pdf" value={newDoc.file_name} onChange={e => setNewDoc(d => ({ ...d, file_name: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && addDoc()} />
                      </div>
                      <div>
                        <label style={LABEL}>Assigned To</label>
                        <input style={INPUT} placeholder="James Whitfield" value={newDoc.assigned_to} onChange={e => setNewDoc(d => ({ ...d, assigned_to: e.target.value }))} />
                      </div>
                    </div>
                    <button onClick={addDoc} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6, color: 'rgba(255,255,255,0.6)', fontSize: '0.76rem',
                      padding: '6px 12px', cursor: 'pointer',
                    }}>
                      <Upload size={12} strokeWidth={2} /> Attach
                    </button>
                  </div>

                  {docs.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {docs.map(doc => (
                        <div key={doc.id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.65rem',
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 7, padding: '0.5rem 0.85rem',
                        }}>
                          <FileText size={13} strokeWidth={1.75} color={DOC_TYPE_COLORS[doc.doc_type]} />
                          <span style={{
                            background: DOC_TYPE_COLORS[doc.doc_type] + '1A', color: DOC_TYPE_COLORS[doc.doc_type],
                            borderRadius: 4, padding: '1px 7px', fontSize: '0.67rem', fontWeight: 600, whiteSpace: 'nowrap',
                          }}>{DOC_TYPE_LABELS[doc.doc_type]}</span>
                          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.79rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</span>
                          {doc.assigned_to && (
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.73rem', whiteSpace: 'nowrap' }}>{doc.assigned_to}</span>
                          )}
                          <button onClick={() => removeDoc(doc.id)} style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                            color: 'rgba(255,255,255,0.2)', display: 'flex',
                          }}>
                            <X size={12} strokeWidth={2} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.77rem', textAlign: 'center', padding: '0.6rem 0', margin: 0 }}>
                      No documents attached yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                STEP 2 — TRAVEL
            ══════════════════════════════════════════ */}
            {step === 2 && (
              <div>
                <div style={CARD}>
                  <h3 style={CARD_TITLE}>Trip Details</h3>
                  <Grid cols={3}>
                    <Field label="Arrival Date *"><input style={INPUT} type="date" value={form.arrival_date} onChange={e => set('arrival_date', e.target.value)} /></Field>
                    <Field label="Departure Date *"><input style={INPUT} type="date" value={form.departure_date} onChange={e => set('departure_date', e.target.value)} /></Field>
                    <Field label="Purpose of Travel">
                      <select style={INPUT} value={form.travel_purpose} onChange={e => set('travel_purpose', e.target.value)}>
                        {['leisure','honeymoon','business','anniversary','birthday','group_tour','corporate','other'].map(p => (
                          <option key={p} value={p}>{p.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                        ))}
                      </select>
                    </Field>
                  </Grid>
                  <Grid cols={3}>
                    <Field label="Adults *"><input style={INPUT} type="number" min={1} value={form.num_adults} onChange={e => set('num_adults', parseInt(e.target.value))} /></Field>
                    <Field label="Children"><input style={INPUT} type="number" min={0} value={form.num_children} onChange={e => set('num_children', parseInt(e.target.value))} /></Field>
                    <Field label="Infants"><input style={INPUT} type="number" min={0} value={form.num_infants} onChange={e => set('num_infants', parseInt(e.target.value))} /></Field>
                  </Grid>
                  <Field label="Destinations">
                    <input style={INPUT} value={form.destinations} onChange={e => set('destinations', e.target.value)} placeholder="Colombo, Galle, Mirissa, Tangalle, Yala" />
                  </Field>

                  <SectionHeader label="Arrival flight" />
                  <Grid cols={2}>
                    <Field label="Flight Number"><input style={INPUT} value={form.flight_arrival} onChange={e => set('flight_arrival', e.target.value)} placeholder="EK651" /></Field>
                    <Field label="Airport (IATA)"><input style={INPUT} value={form.airport_arrival} onChange={e => set('airport_arrival', e.target.value)} placeholder="CMB" /></Field>
                  </Grid>

                  <SectionHeader label="Departure flight" />
                  <Grid cols={2}>
                    <Field label="Flight Number"><input style={INPUT} value={form.flight_departure} onChange={e => set('flight_departure', e.target.value)} placeholder="EK652" /></Field>
                    <Field label="Airport (IATA)"><input style={INPUT} value={form.airport_departure} onChange={e => set('airport_departure', e.target.value)} placeholder="CMB" /></Field>
                  </Grid>
                </div>

                <div style={CARD}>
                  <h3 style={CARD_TITLE}>Partner / Trade Source</h3>
                  <Grid cols={2}>
                    <Field label="Partner Agency">
                      <select style={INPUT} value={form.partner_id} onChange={e => set('partner_id', e.target.value)}>
                        <option value="">— Direct Booking —</option>
                        {mockPartners.map(p => (
                          <option key={p.id} value={p.id}>{p.company_name} ({p.commission_rate}%)</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Partner Booking Reference"><input style={INPUT} value={form.partner_reference} onChange={e => set('partner_reference', e.target.value)} placeholder="TUI-2026-XXXX" /></Field>
                  </Grid>
                  <Field label="Internal Notes">
                    <textarea style={{ ...TEXTAREA, minHeight: 76 }} value={form.internal_notes} onChange={e => set('internal_notes', e.target.value)} placeholder="VIP arrangements, special flags, staff notes..." />
                  </Field>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                STEP 3 — ACCOMMODATION
            ══════════════════════════════════════════ */}
            {step === 3 && (
              <div>
                <div style={CARD}>
                  <h3 style={CARD_TITLE}>Property 1</h3>
                  <Grid cols={2}>
                    <Field label="Hotel / Property Name"><input style={INPUT} value={form.hotel_name} onChange={e => set('hotel_name', e.target.value)} placeholder="Amangalla" /></Field>
                    <Field label="Category">
                      <select style={INPUT} value={form.hotel_category} onChange={e => set('hotel_category', e.target.value)}>
                        {['3_star','4_star','5_star','luxury','villa','boutique'].map(c => (
                          <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase())}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Check-In Date"><input style={INPUT} type="date" value={form.check_in} onChange={e => set('check_in', e.target.value)} /></Field>
                    <Field label="Check-Out Date"><input style={INPUT} type="date" value={form.check_out} onChange={e => set('check_out', e.target.value)} /></Field>
                    <Field label="Room Type">
                      <select style={INPUT} value={form.room_type} onChange={e => set('room_type', e.target.value)}>
                        {['single','double','twin','triple','suite','villa'].map(r => (
                          <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Number of Rooms"><input style={INPUT} type="number" min={1} value={form.num_rooms} onChange={e => set('num_rooms', parseInt(e.target.value))} /></Field>
                    <Field label="Meal Plan">
                      <select style={INPUT} value={form.meal_plan} onChange={e => set('meal_plan', e.target.value)}>
                        {[['RO','Room Only'],['BB','Bed & Breakfast'],['HB','Half Board'],['FB','Full Board'],['AI','All Inclusive']].map(([v, l]) => (
                          <option key={v} value={v}>{v} — {l}</option>
                        ))}
                      </select>
                    </Field>
                  </Grid>
                  <Field label="Special Requests">
                    <textarea style={{ ...TEXTAREA, minHeight: 68 }} value={form.special_requests} onChange={e => set('special_requests', e.target.value)} placeholder="Early check-in, late check-out, sea-view room, connecting rooms..." />
                  </Field>
                </div>

                <div style={CARD}>
                  <ToggleCard
                    checked={form.has_second_property}
                    onChange={v => set('has_second_property', v)}
                    label="Add a second property to this itinerary"
                  />
                  {form.has_second_property && (
                    <>
                      <SectionHeader label="Property 2" />
                      <Grid cols={2}>
                        <Field label="Hotel / Property Name"><input style={INPUT} value={form.hotel2_name} onChange={e => set('hotel2_name', e.target.value)} placeholder="Cape Weligama" /></Field>
                        <Field label="Category">
                          <select style={INPUT} value={form.hotel2_category} onChange={e => set('hotel2_category', e.target.value)}>
                            {['3_star','4_star','5_star','luxury','villa','boutique'].map(c => (
                              <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase())}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Check-In Date"><input style={INPUT} type="date" value={form.hotel2_check_in} onChange={e => set('hotel2_check_in', e.target.value)} /></Field>
                        <Field label="Check-Out Date"><input style={INPUT} type="date" value={form.hotel2_check_out} onChange={e => set('hotel2_check_out', e.target.value)} /></Field>
                        <Field label="Room Type">
                          <select style={INPUT} value={form.hotel2_room_type} onChange={e => set('hotel2_room_type', e.target.value)}>
                            {['single','double','twin','triple','suite','villa'].map(r => (
                              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Number of Rooms"><input style={INPUT} type="number" min={1} value={form.hotel2_num_rooms} onChange={e => set('hotel2_num_rooms', parseInt(e.target.value))} /></Field>
                        <Field label="Meal Plan">
                          <select style={INPUT} value={form.hotel2_meal_plan} onChange={e => set('hotel2_meal_plan', e.target.value)}>
                            {[['RO','Room Only'],['BB','Bed & Breakfast'],['HB','Half Board'],['FB','Full Board'],['AI','All Inclusive']].map(([v, l]) => (
                              <option key={v} value={v}>{v} — {l}</option>
                            ))}
                          </select>
                        </Field>
                      </Grid>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                STEP 4 — TRANSFERS
            ══════════════════════════════════════════ */}
            {step === 4 && (
              <div>
                <div style={CARD}>
                  <h3 style={CARD_TITLE}>Arrival Transfer</h3>
                  <Grid cols={2}>
                    <Field label="Pickup Location"><input style={INPUT} value={form.transfer_pickup} onChange={e => set('transfer_pickup', e.target.value)} placeholder="Bandaranaike International Airport" /></Field>
                    <Field label="Drop-off Location"><input style={INPUT} value={form.transfer_dropoff} onChange={e => set('transfer_dropoff', e.target.value)} placeholder="Amangalla, Galle Fort" /></Field>
                    <Field label="Transfer Date"><input style={INPUT} type="date" value={form.transfer_date} onChange={e => set('transfer_date', e.target.value)} /></Field>
                    <Field label="Arrival Flight Number"><input style={INPUT} value={form.transfer_flight_number} onChange={e => set('transfer_flight_number', e.target.value)} placeholder="EK651" /></Field>
                    <Field label="Vehicle Type">
                      <select style={INPUT} value={form.vehicle_type} onChange={e => set('vehicle_type', e.target.value)}>
                        {['car','van','minibus','coach','tuk_tuk'].map(v => (
                          <option key={v} value={v}>{v.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Number of Vehicles"><input style={INPUT} type="number" min={1} value={form.num_vehicles} onChange={e => set('num_vehicles', parseInt(e.target.value))} /></Field>
                  </Grid>
                  <ToggleCard checked={form.is_chauffeur} onChange={v => set('is_chauffeur', v)} label="Chauffeur-driven service" />
                </div>

                <div style={CARD}>
                  <ToggleCard
                    checked={form.has_departure_transfer}
                    onChange={v => set('has_departure_transfer', v)}
                    label="Include a departure / return transfer"
                  />
                  {form.has_departure_transfer && (
                    <>
                      <SectionHeader label="Departure transfer" />
                      <Grid cols={2}>
                        <Field label="Pickup Location"><input style={INPUT} value={form.dep_transfer_pickup} onChange={e => set('dep_transfer_pickup', e.target.value)} placeholder="Galle Fort" /></Field>
                        <Field label="Drop-off Location"><input style={INPUT} value={form.dep_transfer_dropoff} onChange={e => set('dep_transfer_dropoff', e.target.value)} placeholder="Bandaranaike International Airport" /></Field>
                        <Field label="Transfer Date"><input style={INPUT} type="date" value={form.dep_transfer_date} onChange={e => set('dep_transfer_date', e.target.value)} /></Field>
                        <Field label="Departure Flight Number"><input style={INPUT} value={form.dep_transfer_flight_number} onChange={e => set('dep_transfer_flight_number', e.target.value)} placeholder="EK652" /></Field>
                        <Field label="Vehicle Type">
                          <select style={INPUT} value={form.dep_vehicle_type} onChange={e => set('dep_vehicle_type', e.target.value)}>
                            {['car','van','minibus','coach','tuk_tuk'].map(v => (
                              <option key={v} value={v}>{v.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Number of Vehicles"><input style={INPUT} type="number" min={1} value={form.dep_num_vehicles} onChange={e => set('dep_num_vehicles', parseInt(e.target.value))} /></Field>
                      </Grid>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                STEP 5 — FINANCE
            ══════════════════════════════════════════ */}
            {step === 5 && (
              <div>
                <div style={CARD}>
                  <h3 style={CARD_TITLE}>Pricing</h3>
                  <Grid cols={3}>
                    <Field label="Currency">
                      <select style={INPUT} value={form.currency} onChange={e => set('currency', e.target.value)}>
                        {['GBP','USD','EUR','LKR','CNY'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Total Package Price"><input style={INPUT} type="number" value={form.total_cost} onChange={e => set('total_cost', e.target.value)} placeholder="0.00" /></Field>
                    <Field label="Client&apos;s Budget"><input style={INPUT} value={form.budget_range} onChange={e => set('budget_range', e.target.value)} placeholder="£5,000 – £7,000" /></Field>
                  </Grid>

                  <SectionHeader label="Payment schedule" />
                  <Grid cols={3}>
                    <Field label="Deposit Amount"><input style={INPUT} type="number" value={form.deposit_amount} onChange={e => set('deposit_amount', e.target.value)} placeholder="0.00" /></Field>
                    <Field label="Deposit Due Date"><input style={INPUT} type="date" value={form.deposit_due_date} onChange={e => set('deposit_due_date', e.target.value)} /></Field>
                    <Field label="Balance Due Date"><input style={INPUT} type="date" value={form.balance_due_date} onChange={e => set('balance_due_date', e.target.value)} /></Field>
                  </Grid>

                  <SectionHeader label="Administration" />
                  <Grid cols={2}>
                    <Field label="Preferred Payment Method">
                      <select style={INPUT} value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                        {['bank_transfer','card','stripe','cash','paypal'].map(m => (
                          <option key={m} value={m}>{m.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Assigned Staff">
                      <select style={INPUT} value={form.assigned_staff} onChange={e => set('assigned_staff', e.target.value)}>
                        {['Nimsha','Dilhan','Kavindi','Sachini'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                  </Grid>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                STEP 6 — REVIEW
            ══════════════════════════════════════════ */}
            {step === 6 && (
              <div>
                {[
                  { label: 'Client', items: [
                    ['Name', selectedClient ? selectedClient.full_name : form.full_name],
                    ['Email', selectedClient ? selectedClient.email : form.email],
                    ['Phone', selectedClient ? selectedClient.phone : form.phone],
                    ['Passport', selectedClient ? selectedClient.passport_number : form.passport_number],
                    ['VIP', form.is_vip ? 'Yes' : '—'],
                    ['Occasions', form.special_occasions.map(o => o.charAt(0).toUpperCase() + o.slice(1)).join(', ') || '—'],
                  ]},
                  { label: `Travellers (${travellers.length})`, items: travellers.length
                    ? travellers.map(t => [t.full_name || '(unnamed)', `${t.type}${t.nationality ? ` · ${t.nationality}` : ''}${t.passport_number ? ` · ${t.passport_number}` : ''}`])
                    : [['Additional travellers', 'None added']]
                  },
                  { label: `Documents (${docs.length})`, items: docs.length
                    ? docs.map(d => [DOC_TYPE_LABELS[d.doc_type], d.file_name + (d.assigned_to ? ` (${d.assigned_to})` : '')])
                    : [['Attached documents', 'None']]
                  },
                  { label: 'Travel', items: [
                    ['Arrival', form.arrival_date],
                    ['Departure', form.departure_date],
                    ['Pax', `${form.num_adults} adults${form.num_children ? `, ${form.num_children} children` : ''}${form.num_infants ? `, ${form.num_infants} infants` : ''}`],
                    ['Destinations', form.destinations],
                    ['Purpose', form.travel_purpose],
                    ['Arrival Flight', form.flight_arrival],
                    ['Departure Flight', form.flight_departure],
                    ...(form.partner_id ? [['Partner', mockPartners.find(p => p.id === form.partner_id)?.company_name ?? '—']] : []),
                  ]},
                  { label: 'Accommodation', items: [
                    ['Property 1', form.hotel_name],
                    ['Check-In', form.check_in], ['Check-Out', form.check_out],
                    ['Room', `${form.num_rooms}× ${form.room_type} · ${form.meal_plan}`],
                    ...(form.has_second_property && form.hotel2_name ? [
                      ['Property 2', form.hotel2_name],
                      ['Check-In 2', form.hotel2_check_in], ['Check-Out 2', form.hotel2_check_out],
                    ] : []),
                  ]},
                  { label: 'Transfers', items: [
                    ['Arrival From', form.transfer_pickup], ['Arrival To', form.transfer_dropoff],
                    ['Arrival Flight', form.transfer_flight_number],
                    ...(form.has_departure_transfer ? [
                      ['Departure From', form.dep_transfer_pickup], ['Departure To', form.dep_transfer_dropoff],
                      ['Departure Flight', form.dep_transfer_flight_number],
                    ] : []),
                  ]},
                  { label: 'Finance', items: [
                    ['Currency', form.currency],
                    ['Total Price', form.total_cost ? `${form.currency} ${Number(form.total_cost).toLocaleString()}` : '—'],
                    ['Deposit', form.deposit_amount ? `${form.currency} ${Number(form.deposit_amount).toLocaleString()} · due ${form.deposit_due_date || '—'}` : '—'],
                    ['Balance Due', form.balance_due_date || '—'],
                    ['Payment', form.payment_method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())],
                    ['Staff', form.assigned_staff],
                  ]},
                ].map(section => (
                  <div key={section.label} style={{ ...CARD, marginBottom: '0.65rem' }}>
                    <h4 style={{ color: '#C9A84C', fontSize: '0.65rem', letterSpacing: '0.11em', textTransform: 'uppercase', margin: '0 0 0.85rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>{section.label}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 1.5rem' }}>
                      {(section.items as [string, string | undefined][]).map(([k, v]) => v && v !== '—' ? (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>{k}</span>
                          <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.79rem', fontWeight: 500, textAlign: 'right' }}>{String(v)}</span>
                        </div>
                      ) : null)}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* ── Summary Sidebar ── */}
          <div>
            <div style={{ ...CARD, position: 'sticky', top: 64, marginBottom: 0 }}>

              {/* Step progress */}
              <div style={{ marginBottom: '1.1rem', paddingBottom: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Progress</div>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  {STEPS.map(s => (
                    <div
                      key={s.id}
                      onClick={() => step > s.id && setStep(s.id)}
                      style={{
                        flex: 1, height: 3, borderRadius: 2, cursor: step > s.id ? 'pointer' : 'default',
                        background: step > s.id ? '#C9A84C' : step === s.id ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.07)',
                        transition: 'background 0.3s',
                      }}
                    />
                  ))}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.71rem', marginTop: '0.4rem' }}>
                  Step {step} of {STEPS.length} — {STEPS[step - 1].label}
                </div>
              </div>

              {/* Summary values */}
              <div style={{ marginBottom: '1.1rem' }}>
                {[
                  ['Client', selectedClient?.full_name || form.full_name || '—'],
                  ['Arrival', form.arrival_date || '—'],
                  ['Departure', form.departure_date || '—'],
                  ['Guests', form.num_adults ? `${form.num_adults + form.num_children + form.num_infants} pax` : '—'],
                  ['Destinations', form.destinations || '—'],
                  ['Hotel', form.hotel_name || '—'],
                  ['Total', form.total_cost ? `${form.currency} ${Number(form.total_cost).toLocaleString()}` : '—'],
                  ['Deposit', form.deposit_amount ? `${form.currency} ${Number(form.deposit_amount).toLocaleString()}` : '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.45rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.71rem' }}>{k}</span>
                    <span style={{
                      color: v === '—' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)',
                      fontSize: '0.74rem', maxWidth: '58%', textAlign: 'right',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Traveller / doc counts */}
              {(travellers.length > 0 || docs.length > 0) && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.7rem', marginBottom: '1rem' }}>
                  {travellers.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.71rem' }}>Travellers</span>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.74rem' }}>{travellers.length}</span>
                    </div>
                  )}
                  {docs.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.71rem' }}>Documents</span>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.74rem' }}>{docs.length}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {step < 6 && (
                  <button onClick={() => setStep(s => s + 1)} style={{
                    background: '#C9A84C', color: '#0D0D0D', border: 'none',
                    padding: '0.72rem', borderRadius: 8, fontSize: '0.8rem',
                    fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                    cursor: 'pointer', width: '100%',
                  }}>
                    Continue →
                  </button>
                )}
                {step === 6 && (
                  <button onClick={handleSubmit} disabled={saving} style={{
                    background: saving ? 'rgba(201,168,76,0.45)' : '#C9A84C',
                    color: '#0D0D0D', border: 'none',
                    padding: '0.72rem', borderRadius: 8, fontSize: '0.8rem',
                    fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                    cursor: saving ? 'not-allowed' : 'pointer', width: '100%',
                  }}>
                    {saving ? 'Creating…' : 'Create Reservation'}
                  </button>
                )}
                {step > 1 && (
                  <button onClick={() => setStep(s => s - 1)} style={{
                    background: 'none', color: 'rgba(255,255,255,0.35)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    padding: '0.62rem', borderRadius: 8, fontSize: '0.77rem',
                    cursor: 'pointer', width: '100%',
                  }}>
                    ← Back
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
