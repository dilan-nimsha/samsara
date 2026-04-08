'use client';
import TopBar from '@/components/layout/TopBar';
import { mockClients } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { ArrowUpRight, Star } from 'lucide-react';

export default function ClientsPage() {
  return (
    <div>
      <TopBar title="Clients" subtitle={`${mockClients.length} clients`} action={{ label: 'Add Client', href: '/clients/new' }} />
      <div style={{ padding: '1.5rem 2rem' }}>
        <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Client', 'Contact', 'Nationality', 'Flags', 'Since', ''].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockClients.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <p style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 500 }}>{c.full_name}</p>
                    {c.company_name && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', marginTop: 2 }}>{c.company_name}</p>}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem' }}>{c.email}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', marginTop: 2 }}>{c.phone}</p>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>{c.nationality}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {c.is_vip && <span style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C', fontSize: '0.6rem', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 600 }}>VIP</span>}
                      {c.is_repeat_client && <span style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', fontSize: '0.6rem', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 600 }}>Repeat</span>}
                      {c.special_occasions?.map(o => <span key={o} style={{ background: 'rgba(236,72,153,0.12)', color: '#EC4899', fontSize: '0.6rem', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 600 }}>{o}</span>)}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>{formatDate(c.created_at)}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <a href={`/clients/${c.id}`} style={{ color: 'rgba(255,255,255,0.3)' }}><ArrowUpRight size={15} /></a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
