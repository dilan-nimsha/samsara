'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Client } from '@/types';
import { formatDate } from '@/lib/utils';
import { toast } from '@/lib/toast';
import {
  RefreshCw, Plus, SlidersHorizontal,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, X,
} from 'lucide-react';

type TabKey    = 'all' | 'vip' | 'repeat' | 'corporate';
type SortField = 'name' | 'nationality' | 'since';
type SortDir   = 'asc' | 'desc';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',       label: 'All Clients' },
  { key: 'vip',       label: 'VIP' },
  { key: 'repeat',    label: 'Repeat' },
  { key: 'corporate', label: 'Corporate' },
];

function Th({
  children, sort, current, dir, onSort, center, width,
}: {
  children: React.ReactNode;
  sort?: SortField; current?: SortField; dir?: SortDir;
  onSort?: (f: SortField) => void;
  center?: boolean; width?: number;
}) {
  const active = sort && current === sort;
  return (
    <th
      onClick={sort && onSort ? () => onSort(sort!) : undefined}
      style={{
        padding: '6px 10px',
        textAlign: center ? 'center' : 'left',
        fontSize: 11, fontWeight: 600,
        color: active ? '#111111' : '#888888',
        borderBottom: '1px solid #E5E5E5',
        background: '#F5F5F5',
        whiteSpace: 'nowrap',
        cursor: sort ? 'pointer' : 'default',
        userSelect: 'none',
        width: width ?? undefined,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        {children}
        {sort && (
          active
            ? dir === 'asc'
              ? <ArrowUp size={10} strokeWidth={2.5} />
              : <ArrowDown size={10} strokeWidth={2.5} />
            : <ArrowUpDown size={10} strokeWidth={2} style={{ opacity: 0.35 }} />
        )}
      </span>
    </th>
  );
}

function TBtn({ icon, label, primary, onClick }: {
  icon?: React.ReactNode; label: string; primary?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '3px 9px', borderRadius: 3, height: 26,
        border: primary ? '1px solid #111111' : '1px solid #BBBBBB',
        background: primary ? '#111111' : '#EBEBEB',
        color: primary ? '#ffffff' : '#333333',
        fontSize: 12, fontWeight: primary ? 600 : 500,
        cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!primary) (e.currentTarget as HTMLElement).style.background = '#DEDEDE'; }}
      onMouseLeave={e => { if (!primary) (e.currentTarget as HTMLElement).style.background = '#EBEBEB'; }}
    >
      {icon}{label}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 20, background: '#C0C0C0', margin: '0 4px' }} />;
}

export default function ClientsPage() {
  const [tab,           setTab]           = useState<TabKey>('all');
  const [filter,        setFilter]        = useState('');
  const [sort,          setSort]          = useState<SortField>('name');
  const [dir,           setDir]           = useState<SortDir>('asc');
  const [refreshing,    setRefreshing]    = useState(false);
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [addForm,       setAddForm]       = useState({ full_name: '', email: '', phone: '', nationality: '', company_name: '' });

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    try {
      const res  = await fetch('/api/clients');
      const data = await res.json() as { success: boolean; clients?: Client[]; error?: string };
      if (data.success) setClients(data.clients ?? []);
      else toast.error(data.error ?? 'Failed to load clients');
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void fetchClients(); }, [fetchClients]);

  async function handleAddClient() {
    if (!addForm.full_name.trim()) { toast.error('Full name is required'); return; }
    if (!addForm.email.trim())     { toast.error('Email is required'); return; }
    if (!addForm.nationality.trim()) { toast.error('Nationality is required'); return; }
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (!data.success) throw new Error(data.error ?? 'Failed to add client');
      const name = addForm.full_name;
      setShowAddModal(false);
      setAddForm({ full_name: '', email: '', phone: '', nationality: '', company_name: '' });
      toast.success(`Client "${name}" added successfully`);
      await fetchClients();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add client');
    } finally {
      setSaving(false);
    }
  }

  function toggleSort(f: SortField) {
    if (sort === f) setDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(f); setDir('asc'); }
  }

  const tabCounts = useMemo<Record<TabKey, number>>(() => ({
    all:       clients.length,
    vip:       clients.filter(c => c.is_vip).length,
    repeat:    clients.filter(c => c.is_repeat_client).length,
    corporate: clients.filter(c => !!c.company_name).length,
  }), [clients]);

  const rows = useMemo(() => {
    let list = [...clients];
    if (tab === 'vip')       list = list.filter(c => c.is_vip);
    if (tab === 'repeat')    list = list.filter(c => c.is_repeat_client);
    if (tab === 'corporate') list = list.filter(c => !!c.company_name);
    if (filter.trim()) {
      const q = filter.toLowerCase();
      list = list.filter(c =>
        c.full_name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.nationality?.toLowerCase().includes(q) ||
        c.company_name?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let av = '', bv = '';
      if (sort === 'name')        { av = a.full_name;          bv = b.full_name; }
      if (sort === 'nationality') { av = a.nationality ?? '';   bv = b.nationality ?? ''; }
      if (sort === 'since')       { av = a.created_at;         bv = b.created_at; }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [clients, tab, filter, sort, dir]);

  function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    void fetchClients();
  }

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', background: '#F0F0F0' }}>

      {/* Toolbar */}
      <div style={{
        background: '#F0F0F0', borderBottom: '1px solid #C8C8C8',
        padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
      }}>
        <TBtn
          icon={<RefreshCw size={12} strokeWidth={2} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />}
          label={refreshing ? 'Refreshing…' : 'Refresh'}
          onClick={handleRefresh}
        />

        <Divider />

        <div style={{ flex: 1 }} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          border: '1px solid #D5D5D5', borderRadius: 4,
          padding: '4px 8px', background: '#FAFAFA',
        }}>
          <SlidersHorizontal size={12} color="#AAAAAA" strokeWidth={2} />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter clients…"
            style={{
              background: 'none', border: 'none', outline: 'none',
              fontSize: 12, color: '#333333', width: 180, fontFamily: 'inherit',
            }}
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 12px', borderRadius: 3, height: 26,
            background: '#111111', color: '#ffffff',
            fontSize: 12, fontWeight: 600, border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            transition: 'opacity 0.12s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
        >
          <Plus size={12} strokeWidth={2.5} />
          Add Client
        </button>
      </div>

      {/* Tab bar */}
      <div style={{
        background: '#ffffff', borderBottom: '1px solid #E5E5E5',
        display: 'flex', alignItems: 'stretch',
        padding: '0 16px', flexShrink: 0,
      }}>
        {TABS.map(({ key, label }) => {
          const active = tab === key;
          const count  = tabCounts[key];
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0 14px', height: 38, border: 'none',
                borderBottom: active ? '2px solid #111111' : '2px solid transparent',
                background: active ? 'rgba(0,0,0,0.03)' : 'none',
                color: active ? '#111111' : '#777777',
                fontSize: 12, fontWeight: active ? 600 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                transition: 'color 0.12s, background 0.12s',
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#333333'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.02)'; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#777777'; (e.currentTarget as HTMLElement).style.background = 'none'; } }}
            >
              {label}
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                background: active ? '#111111' : '#EBEBEB',
                color: active ? '#ffffff' : '#777777',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', fontSize: 12, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 36 }} />
            <col style={{ width: 200 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 190 }} />
            <col style={{ width: 145 }} />
            <col style={{ width: 190 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 36 }} />
          </colgroup>

          <thead>
            <tr style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <th style={{ padding: '6px 10px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>#</th>
              <Th sort="name" current={sort} dir={dir} onSort={toggleSort}>Name</Th>
              <Th sort="nationality" current={sort} dir={dir} onSort={toggleSort}>Nationality</Th>
              <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Email</th>
              <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Phone</th>
              <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#888888', borderBottom: '1px solid #E5E5E5', background: '#F5F5F5' }}>Tags</th>
              <Th sort="since" current={sort} dir={dir} onSort={toggleSort}>Since</Th>
              <th style={{ padding: '6px 10px', background: '#F5F5F5', borderBottom: '1px solid #E5E5E5' }} />
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#AAAAAA', fontSize: 13 }}>
                  {loading ? 'Loading clients…' : clients.length === 0 ? 'No clients yet. Click "Add Client" to create one.' : 'No clients match your filters.'}
                </td>
              </tr>
            )}
            {rows.map((c, i) => (
              <tr
                key={c.id}
                style={{ borderBottom: '1px solid #F0F0F0', cursor: 'pointer', transition: 'background 0.08s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F7F9FF')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                onClick={() => { window.location.href = `/clients/${c.id}`; }}
              >
                <td style={{ padding: '8px 10px', textAlign: 'center', color: '#CCCCCC', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                  {i + 1}
                </td>

                <td style={{ padding: '8px 10px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.full_name}
                  </p>
                  {c.company_name && (
                    <p style={{ fontSize: 11, color: '#999999', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.company_name}
                    </p>
                  )}
                </td>

                <td style={{ padding: '8px 10px', fontSize: 12, color: '#555555' }}>{c.nationality}</td>

                <td style={{ padding: '8px 10px', overflow: 'hidden' }}>
                  <span style={{ fontSize: 11, color: '#777777', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {c.email}
                  </span>
                </td>

                <td style={{ padding: '8px 10px', fontSize: 12, color: '#555555', whiteSpace: 'nowrap' }}>{c.phone}</td>

                <td style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {c.is_vip && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: '#FEF3C7', color: '#92400E' }}>VIP</span>
                    )}
                    {c.is_repeat_client && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: '#EDE9FE', color: '#6D28D9' }}>Repeat</span>
                    )}
                    {c.special_occasions?.map(o => (
                      <span key={o} style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3, background: '#FCE7F3', color: '#9D174D', textTransform: 'capitalize' }}>
                        {o}
                      </span>
                    ))}
                    {c.dietary_restrictions && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3, background: '#D1FAE5', color: '#065F46' }}>
                        {c.dietary_restrictions}
                      </span>
                    )}
                  </div>
                </td>

                <td style={{ padding: '8px 10px', fontSize: 11, color: '#AAAAAA', whiteSpace: 'nowrap' }}>
                  {formatDate(c.created_at)}
                </td>

                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                  <ChevronRight size={13} color="#CCCCCC" strokeWidth={2} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length > 0 && (
          <div style={{
            background: '#F9F9F9', borderTop: '1px solid #EEEEEE',
            padding: '6px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, color: '#AAAAAA' }}>
              {rows.length} of {clients.length} clients
            </span>
            <span style={{ fontSize: 11, color: '#AAAAAA' }}>
              {rows.filter(c => c.is_vip).length} VIP · {rows.filter(c => c.is_repeat_client).length} repeat
            </span>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div style={{ background: '#ffffff', borderRadius: 10, width: 440, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111111' }}>Add New Client</span>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#AAAAAA' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Full Name *', key: 'full_name', placeholder: 'e.g. Amara Perera' },
                { label: 'Email *',     key: 'email',     placeholder: 'email@example.com' },
                { label: 'Phone',       key: 'phone',     placeholder: '+94 77 000 0000' },
                { label: 'Nationality *', key: 'nationality', placeholder: 'e.g. Sri Lankan' },
                { label: 'Company (optional)', key: 'company_name', placeholder: 'e.g. Acme Corp' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#555555', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input
                    value={addForm[key as keyof typeof addForm]}
                    onChange={e => setAddForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 5,
                      border: '1px solid #E0E0E0', fontSize: 13, color: '#111111',
                      outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 18px', borderTop: '1px solid #F0F0F0', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddModal(false)} style={{ padding: '7px 16px', border: '1px solid #E0E0E0', borderRadius: 5, background: 'none', fontSize: 12, fontWeight: 500, color: '#555555', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={handleAddClient} disabled={saving} style={{ padding: '7px 20px', border: 'none', borderRadius: 5, background: saving ? '#888888' : '#111111', fontSize: 12, fontWeight: 600, color: '#ffffff', cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Saving…' : 'Add Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
