'use client';
import TopBar from '@/components/layout/TopBar';
import { mockStats, mockReservations } from '@/lib/mock-data';
import { formatCurrency, formatDate, STATUS_CONFIG, PAYMENT_CONFIG } from '@/lib/utils';
import {
  TrendingUp, CalendarCheck, Clock, AlertCircle,
  Plane, Users, ArrowUpRight,
} from 'lucide-react';

const STAT_CARDS = [
  {
    label: 'Revenue This Month',
    value: formatCurrency(mockStats.revenue_this_month, mockStats.revenue_currency),
    icon: TrendingUp,
    color: '#C9A84C',
    sub: '+12% vs last month',
  },
  {
    label: 'Active Trips',
    value: mockStats.active_trips,
    icon: Plane,
    color: '#0891B2',
    sub: 'Currently travelling',
  },
  {
    label: 'Pending Enquiries',
    value: mockStats.pending_enquiries,
    icon: Clock,
    color: '#D97706',
    sub: `${mockStats.new_enquiries_today} new today`,
  },
  {
    label: 'Upcoming Arrivals',
    value: mockStats.upcoming_arrivals,
    icon: CalendarCheck,
    color: '#059669',
    sub: 'Next 14 days',
  },
  {
    label: 'Total Reservations',
    value: mockStats.total_reservations,
    icon: Users,
    color: '#7C3AED',
    sub: 'All time',
  },
  {
    label: 'Overdue Payments',
    value: mockStats.overdue_payments,
    icon: AlertCircle,
    color: '#DC2626',
    sub: 'Requires attention',
  },
];

export default function DashboardPage() {
  const recent = mockReservations.slice(0, 5);

  return (
    <div>
      <TopBar
        title="Dashboard"
        subtitle={`Good morning, Nimsha — ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`}
        action={{ label: 'New Reservation', href: '/reservations/new' }}
      />

      <div style={{ padding: '2rem' }}>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} style={{
                background: '#141414',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                    {card.label}
                  </p>
                  <p style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 600, lineHeight: 1, marginBottom: '0.4rem' }}>
                    {card.value}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>{card.sub}</p>
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${card.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={card.color} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Reservations */}
        <div style={{
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h2 style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 500 }}>Recent Reservations</h2>
            <a href="/reservations" style={{
              color: '#C9A84C', fontSize: '0.72rem', letterSpacing: '0.08em',
              textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              View All <ArrowUpRight size={12} />
            </a>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['Reference', 'Client', 'Destination', 'Dates', 'Status', 'Payment', 'Value'].map((h) => (
                  <th key={h} style={{
                    padding: '0.75rem 1.5rem', textAlign: 'left',
                    color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem',
                    letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => {
                const status = STATUS_CONFIG[r.status];
                const payment = PAYMENT_CONFIG[r.payment_status];
                return (
                  <tr key={r.id} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <a href={`/reservations/${r.id}`} style={{ color: '#C9A84C', fontSize: '0.8rem', fontWeight: 500 }}>
                        {r.reference}
                      </a>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <p style={{ color: '#fff', fontSize: '0.82rem' }}>{r.client?.full_name}</p>
                      {r.is_vip && <span style={{ fontSize: '0.6rem', color: '#C9A84C', letterSpacing: '0.1em' }}>VIP</span>}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>
                      {r.destinations.join(', ')}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {formatDate(r.arrival_date)} → {formatDate(r.departure_date)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{
                        background: status.bg, color: status.color,
                        fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.05em',
                        padding: '0.25rem 0.65rem', borderRadius: 20,
                      }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ color: payment.color, fontSize: '0.75rem', fontWeight: 500 }}>
                        {payment.label}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: '#fff', fontSize: '0.82rem', fontWeight: 500 }}>
                      {formatCurrency(r.total_cost, r.currency)}
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
