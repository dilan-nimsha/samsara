import TopBar from '@/components/layout/TopBar';
import { mockPartners } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpRight, TrendingUp } from 'lucide-react';

export default function PartnersPage() {
  return (
    <div>
      <TopBar title="Partners" subtitle={`${mockPartners.length} active partners`} action={{ label: 'Add Partner', href: '/partners/new' }} />
      <div style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {mockPartners.map(p => (
            <div key={p.id} style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <p style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500, marginBottom: 4 }}>{p.company_name}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>{p.country}</p>
                </div>
                <span style={{ background: p.is_active ? 'rgba(5,150,105,0.12)' : 'rgba(220,38,38,0.12)', color: p.is_active ? '#059669' : '#DC2626', fontSize: '0.6rem', padding: '0.2rem 0.5rem', borderRadius: 20, fontWeight: 600 }}>
                  {p.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Commission</p>
                  <p style={{ color: '#C9A84C', fontSize: '1.1rem', fontWeight: 600 }}>{p.commission_rate}%</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Bookings</p>
                  <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>{p.total_bookings}</p>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Total Commission Earned</p>
                  <p style={{ color: '#059669', fontSize: '0.95rem', fontWeight: 600 }}>{formatCurrency(p.total_commission_earned, 'GBP')}</p>
                </div>
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>{p.contact_person} · {p.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
