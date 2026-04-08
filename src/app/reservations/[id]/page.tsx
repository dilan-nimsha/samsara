'use client';

import { useParams } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import { mockReservations } from '@/lib/mock-data';
import { formatCurrency, formatDate, STATUS_CONFIG, PAYMENT_CONFIG, tripDuration } from '@/lib/utils';
import type { ReservationStatus } from '@/types';
import {
  User, MapPin, Calendar, Plane, CreditCard,
  Building2, Car, Compass, FileText, ChevronRight,
} from 'lucide-react';

const STAGES: { key: ReservationStatus; label: string }[] = [
  { key: 'enquiry',          label: 'Enquiry' },
  { key: 'under_review',     label: 'Review' },
  { key: 'confirmed',        label: 'Confirmed' },
  { key: 'invoice_sent',     label: 'Invoiced' },
  { key: 'paid',             label: 'Paid' },
  { key: 'trip_active',      label: 'Active' },
  { key: 'completed',        label: 'Completed' },
];

const STAGE_ORDER = STAGES.map(s => s.key);

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#141414', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12, overflow: 'hidden', marginBottom: '1rem',
    }}>
      <div style={{
        padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: '0.6rem',
      }}>
        <Icon size={15} color="#C9A84C" />
        <h3 style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 500 }}>{title}</h3>
      </div>
      <div style={{ padding: '1.25rem 1.5rem' }}>{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</p>
      <p style={{ color: '#fff', fontSize: '0.85rem' }}>{value}</p>
    </div>
  );
}

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const r = mockReservations.find(x => x.id === id);

  if (!r) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
      Reservation not found.
    </div>
  );

  const status = STATUS_CONFIG[r.status];
  const payment = PAYMENT_CONFIG[r.payment_status];
  const nights = tripDuration(r.arrival_date, r.departure_date);
  const currentStageIdx = STAGE_ORDER.indexOf(r.status);
  const balance = r.total_cost - r.total_paid;

  return (
    <div>
      <TopBar title={r.reference} subtitle={`${r.client?.full_name} · ${nights} nights`} />

      <div style={{ padding: '1.5rem 2rem' }}>

        {/* Status Pipeline */}
        <div style={{
          background: '#141414', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: 0,
        }}>
          {STAGES.map((stage, idx) => {
            const done = idx < currentStageIdx;
            const active = idx === currentStageIdx;
            return (
              <div key={stage.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: active ? '#C9A84C' : done ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.06)',
                    border: active ? '2px solid #C9A84C' : done ? '2px solid rgba(201,168,76,0.4)' : '2px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 6,
                  }}>
                    {done && <span style={{ color: '#C9A84C', fontSize: '0.7rem' }}>✓</span>}
                    {active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#080808', display: 'block' }} />}
                  </div>
                  <span style={{
                    fontSize: '0.62rem', letterSpacing: '0.06em',
                    color: active ? '#C9A84C' : done ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.2)',
                    fontWeight: active ? 600 : 400,
                  }}>
                    {stage.label}
                  </span>
                </div>
                {idx < STAGES.length - 1 && (
                  <div style={{
                    flex: 1, height: 1, marginBottom: 20,
                    background: done ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)',
                  }} />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem' }}>

          {/* Left Column */}
          <div>
            {/* Client */}
            <Section title="Client Information" icon={User}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <Field label="Full Name" value={r.client?.full_name} />
                <Field label="Nationality" value={r.client?.nationality} />
                <Field label="Email" value={r.client?.email} />
                <Field label="Phone" value={r.client?.phone} />
                <Field label="WhatsApp" value={r.client?.whatsapp} />
                <Field label="Passport" value={r.client?.passport_number} />
                {r.client?.dietary_restrictions && <Field label="Dietary" value={r.client.dietary_restrictions} />}
              </div>
              {r.client?.is_vip && (
                <span style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C', fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: 4, fontWeight: 600, letterSpacing: '0.1em' }}>
                  ★ VIP CLIENT
                </span>
              )}
            </Section>

            {/* Travel Details */}
            <Section title="Travel Details" icon={Calendar}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <Field label="Arrival" value={formatDate(r.arrival_date)} />
                <Field label="Departure" value={formatDate(r.departure_date)} />
                <Field label="Duration" value={`${nights} nights`} />
                <Field label="Adults" value={r.num_adults} />
                <Field label="Children" value={r.num_children || undefined} />
                <Field label="Purpose" value={r.travel_purpose.replace('_', ' ')} />
                <Field label="Arrival Flight" value={r.flight_arrival} />
                <Field label="Arrival Airport" value={r.airport_arrival} />
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Destinations</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {r.destinations.map((d, i) => (
                    <span key={i} style={{
                      background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: 20,
                    }}>{d}</span>
                  ))}
                </div>
              </div>
            </Section>

            {/* Partner */}
            {r.partner && (
              <Section title="Partner Information" icon={Building2}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <Field label="Company" value={r.partner.company_name} />
                  <Field label="Contact" value={r.partner.contact_person} />
                  <Field label="Commission Rate" value={`${r.partner.commission_rate}%`} />
                  <Field label="Commission Amount" value={formatCurrency(r.commission_amount, r.currency)} />
                  <Field label="Partner Ref" value={r.partner_reference} />
                  <Field label="Contract" value={r.partner.contract_reference} />
                </div>
              </Section>
            )}

            {/* Internal Notes */}
            {r.internal_notes && (
              <Section title="Internal Notes" icon={FileText}>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', lineHeight: 1.7 }}>
                  {r.internal_notes}
                </p>
              </Section>
            )}
          </div>

          {/* Right Column */}
          <div>
            {/* Financial Summary */}
            <div style={{
              background: '#141414', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '1.5rem', marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <CreditCard size={15} color="#C9A84C" />
                <h3 style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 500 }}>Financial Summary</h3>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Total Value</span>
                  <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
                    {formatCurrency(r.total_cost, r.currency)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Paid</span>
                  <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: 500 }}>
                    {formatCurrency(r.total_paid, r.currency)}
                  </span>
                </div>
                {balance > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Balance Due</span>
                    <span style={{ color: '#D97706', fontSize: '0.85rem', fontWeight: 500 }}>
                      {formatCurrency(balance, r.currency)}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {r.total_cost > 0 && (
                <div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, marginBottom: 6 }}>
                    <div style={{
                      width: `${Math.min((r.total_paid / r.total_cost) * 100, 100)}%`,
                      height: '100%', borderRadius: 4,
                      background: 'linear-gradient(to right, #C9A84C, #E2C97E)',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', textAlign: 'right' }}>
                    {Math.round((r.total_paid / r.total_cost) * 100)}% paid
                  </p>
                </div>
              )}

              <span style={{
                display: 'inline-block', marginTop: '1rem',
                background: payment.color + '18', color: payment.color,
                fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em',
                padding: '0.25rem 0.65rem', borderRadius: 20,
              }}>
                {payment.label}
              </span>
            </div>

            {/* Status */}
            <div style={{
              background: '#141414', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '1.25rem', marginBottom: '1rem',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Current Status</p>
              <span style={{
                background: status.bg, color: status.color,
                fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em',
                padding: '0.35rem 0.85rem', borderRadius: 20,
              }}>
                {status.label}
              </span>
            </div>

            {/* Quick Actions */}
            <div style={{
              background: '#141414', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, overflow: 'hidden',
            }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Quick Actions</p>
              </div>
              {[
                'Send Invoice',
                'Record Payment',
                'Send Itinerary PDF',
                'Send WhatsApp Update',
                'Edit Reservation',
              ].map((action) => (
                <button key={action} style={{
                  width: '100%', padding: '0.85rem 1.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  {action}
                  <ChevronRight size={13} color="rgba(255,255,255,0.2)" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
