'use client';

import { useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { mockReservations } from '@/lib/mock-data';
import { formatCurrency, formatDate, STATUS_CONFIG, PAYMENT_CONFIG, tripDuration } from '@/lib/utils';
import type { ReservationStatus } from '@/types';
import { Filter, ArrowUpRight } from 'lucide-react';

const STATUS_FILTERS: { value: ReservationStatus | 'all'; label: string }[] = [
  { value: 'all',          label: 'All' },
  { value: 'enquiry',      label: 'Enquiry' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'confirmed',    label: 'Confirmed' },
  { value: 'invoice_sent', label: 'Invoice Sent' },
  { value: 'paid',         label: 'Paid' },
  { value: 'trip_active',  label: 'Trip Active' },
  { value: 'completed',    label: 'Completed' },
];

export default function ReservationsPage() {
  const [activeFilter, setActiveFilter] = useState<ReservationStatus | 'all'>('all');

  const filtered = activeFilter === 'all'
    ? mockReservations
    : mockReservations.filter(r => r.status === activeFilter);

  return (
    <div>
      <TopBar
        title="Reservations"
        subtitle={`${mockReservations.length} total reservations`}
        action={{ label: 'New Reservation', href: '/reservations/new' }}
      />

      <div style={{ padding: '1.5rem 2rem' }}>

        {/* Filters */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          marginBottom: '1.5rem', flexWrap: 'wrap',
        }}>
          <Filter size={14} color="rgba(255,255,255,0.3)" />
          {STATUS_FILTERS.map(f => {
            const active = activeFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                style={{
                  padding: '0.4rem 1rem', borderRadius: 20,
                  fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.04em',
                  cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                  background: active ? '#C9A84C' : 'rgba(255,255,255,0.06)',
                  color: active ? '#080808' : 'rgba(255,255,255,0.5)',
                }}
              >
                {f.label}
                {f.value !== 'all' && (
                  <span style={{ marginLeft: 6, opacity: 0.7 }}>
                    {mockReservations.filter(r => r.status === f.value).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div style={{
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Reference', 'Client', 'Destinations', 'Travel Dates', 'Pax', 'Status', 'Payment', 'Total', ''].map(h => (
                  <th key={h} style={{
                    padding: '0.85rem 1.25rem', textAlign: 'left',
                    color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem',
                    letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const status = STATUS_CONFIG[r.status];
                const payment = PAYMENT_CONFIG[r.payment_status];
                const nights = tripDuration(r.arrival_date, r.departure_date);
                return (
                  <tr key={r.id} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    transition: 'background 0.15s', cursor: 'pointer',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {r.is_vip && (
                          <span style={{
                            background: 'rgba(201,168,76,0.15)', color: '#C9A84C',
                            fontSize: '0.55rem', padding: '0.15rem 0.4rem',
                            borderRadius: 4, fontWeight: 600, letterSpacing: '0.1em',
                          }}>VIP</span>
                        )}
                        <span style={{ color: '#C9A84C', fontSize: '0.8rem', fontWeight: 500 }}>
                          {r.reference}
                        </span>
                      </div>
                      {r.partner && (
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', marginTop: 2 }}>
                          via {r.partner.company_name}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <p style={{ color: '#fff', fontSize: '0.82rem' }}>{r.client?.full_name}</p>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem', marginTop: 2 }}>
                        {r.client?.nationality}
                      </p>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>
                      {r.destinations.join(' · ')}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>
                      <p style={{ color: '#fff', fontSize: '0.78rem' }}>
                        {formatDate(r.arrival_date)}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem', marginTop: 2 }}>
                        {nights} nights
                      </p>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', textAlign: 'center' }}>
                      {r.num_adults + r.num_children}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{
                        background: status.bg, color: status.color,
                        fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em',
                        padding: '0.25rem 0.65rem', borderRadius: 20,
                      }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ color: payment.color, fontSize: '0.75rem', fontWeight: 500 }}>
                        {payment.label}
                      </span>
                      {r.payment_status === 'partial' && r.total_cost > 0 && (
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', marginTop: 2 }}>
                          {Math.round((r.total_paid / r.total_cost) * 100)}% paid
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#fff', fontSize: '0.82rem', fontWeight: 500 }}>
                      {r.total_cost > 0 ? formatCurrency(r.total_cost, r.currency) : '—'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <a href={`/reservations/${r.id}`} style={{
                        color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center',
                        transition: 'color 0.2s',
                      }}>
                        <ArrowUpRight size={15} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
