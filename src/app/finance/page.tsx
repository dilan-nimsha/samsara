import TopBar from '@/components/layout/TopBar';
import { mockReservations } from '@/lib/mock-data';
import { formatCurrency, formatDate, PAYMENT_CONFIG } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';

const totalRevenue = mockReservations.reduce((s, r) => s + r.total_paid, 0);
const totalOutstanding = mockReservations.reduce((s, r) => s + (r.total_cost - r.total_paid), 0);
const totalCommission = mockReservations.reduce((s, r) => s + r.commission_amount, 0);

export default function FinancePage() {
  return (
    <div>
      <TopBar title="Finance" subtitle="Revenue, payments & commissions" />
      <div style={{ padding: '1.5rem 2rem' }}>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Revenue Collected', value: formatCurrency(totalRevenue, 'GBP'), icon: TrendingUp, color: '#059669' },
            { label: 'Outstanding Balance', value: formatCurrency(totalOutstanding, 'GBP'), icon: TrendingDown, color: '#D97706' },
            { label: 'Partner Commissions', value: formatCurrency(totalCommission, 'GBP'), icon: DollarSign, color: '#C9A84C' },
            { label: 'Overdue Invoices', value: '1', icon: AlertTriangle, color: '#DC2626' },
          ].map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{card.label}</p>
                  <Icon size={16} color={card.color} />
                </div>
                <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 600 }}>{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Payment Ledger */}
        <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 500 }}>Payment Ledger</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Reference', 'Client', 'Total', 'Paid', 'Balance', 'Commission', 'Status'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1.5rem', textAlign: 'left', color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockReservations.map(r => {
                const payment = PAYMENT_CONFIG[r.payment_status];
                const balance = r.total_cost - r.total_paid;
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '0.9rem 1.5rem', color: '#C9A84C', fontSize: '0.8rem', fontWeight: 500 }}>{r.reference}</td>
                    <td style={{ padding: '0.9rem 1.5rem', color: '#fff', fontSize: '0.8rem' }}>{r.client?.full_name}</td>
                    <td style={{ padding: '0.9rem 1.5rem', color: '#fff', fontSize: '0.8rem', fontWeight: 500 }}>{r.total_cost > 0 ? formatCurrency(r.total_cost, r.currency) : '—'}</td>
                    <td style={{ padding: '0.9rem 1.5rem', color: '#059669', fontSize: '0.8rem' }}>{formatCurrency(r.total_paid, r.currency)}</td>
                    <td style={{ padding: '0.9rem 1.5rem', color: balance > 0 ? '#D97706' : 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
                      {balance > 0 ? formatCurrency(balance, r.currency) : '—'}
                    </td>
                    <td style={{ padding: '0.9rem 1.5rem', color: '#C9A84C', fontSize: '0.8rem' }}>
                      {r.commission_amount > 0 ? formatCurrency(r.commission_amount, r.currency) : '—'}
                    </td>
                    <td style={{ padding: '0.9rem 1.5rem' }}>
                      <span style={{ color: payment.color, fontSize: '0.72rem', fontWeight: 500 }}>{payment.label}</span>
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
