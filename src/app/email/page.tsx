'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail, Plus, Inbox, RefreshCw, X, ChevronRight,
  User, Building2, Settings, Clock, CheckCircle2,
} from 'lucide-react';
import { toast } from '@/lib/toast';

// ── Types ──────────────────────────────────────────────────────────────────────

type EmailRecipient = {
  id: string;
  name: string;
  email: string;
  type: 'personal' | 'department';
  is_active: boolean;
  created_at: string;
};

type WebBooking = {
  id: string;
  reference: string;
  status: string;
  arrival_date: string;
  total_cost: number;
  created_at: string;
  client?: { full_name: string; email: string; phone: string };
  internal_notes?: string;
};

type GmailMessage = {
  uid: number;
  subject: string;
  from: string;
  fromEmail: string;
  date: string;
  preview: string;
  unread: boolean;
  hasAttachment: boolean;
};

type SelectedAccount =
  | { type: 'reservations' }
  | { type: 'gmail' }
  | { type: 'personal' | 'department'; id: string; name: string; email: string };

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusColor(s: string) {
  if (s === 'enquiry') return '#2563EB';
  if (s === 'confirmed' || s === 'paid') return '#16A34A';
  if (s === 'cancelled') return '#DC2626';
  return '#D97706';
}

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function fmtDate(d: string) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function fmtAge(d: string) {
  if (!d) return '';
  try {
    const diffH = (Date.now() - new Date(d).getTime()) / 3600000;
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${Math.floor(diffH)}h ago`;
    if (diffH < 48) return 'Yesterday';
    return fmtDate(d);
  } catch { return ''; }
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || 'WB';
}

function parseNotes(raw?: string) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ── AccountItem ────────────────────────────────────────────────────────────────

function AccountItem({
  icon, label, sublabel, badge, active, onClick, onRemove,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  badge?: number;
  active: boolean;
  onClick: () => void;
  onRemove?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px', borderRadius: 5, cursor: 'pointer',
        background: active ? '#F0F0F0' : 'none',
        color: active ? '#111' : '#555',
        fontSize: 12, fontWeight: active ? 600 : 400,
        marginBottom: 1, transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F7F7F7'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'none'; }}
    >
      <span style={{ flexShrink: 0, color: active ? '#111' : '#AAAAAA' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</p>
        {sublabel && (
          <p style={{ margin: 0, fontSize: 10, color: '#AAAAAA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sublabel}
          </p>
        )}
      </div>
      {badge !== undefined && badge > 0 && (
        <span style={{
          background: active ? '#111' : '#E5E5E5', color: active ? '#fff' : '#555',
          fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 8, flexShrink: 0,
        }}>
          {badge}
        </span>
      )}
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          title="Remove"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px 3px', borderRadius: 3, color: '#CC4444', display: 'flex', flexShrink: 0 }}
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

// ── InfoCard ───────────────────────────────────────────────────────────────────

function InfoCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: '#FAFAFA', border: '1px solid #EBEBEB', borderRadius: 6, padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        {icon}
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#AAAAAA' }}>{label}</span>
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: '#111', margin: 0 }}>{value}</p>
    </div>
  );
}

// ── ReservationDetail ──────────────────────────────────────────────────────────

function ReservationDetail({ booking }: { booking: WebBooking }) {
  const notes = parseNotes(booking.internal_notes);
  const experience = notes?.experience ?? 'Travel Enquiry';
  const source = notes?.source === 'experiences' ? 'Experiences Page'
    : notes?.source === 'feeling-engine' ? 'Feeling Engine' : 'Website';
  const addOns: string[] = notes?.add_ons ?? [];
  const [copied, setCopied] = useState(false);

  function copyEmail() {
    if (!booking.client?.email) return;
    navigator.clipboard.writeText(booking.client.email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const rows = [
    ['Reference', booking.reference],
    ['Source', source],
    ['Experience', experience],
    ...(notes?.pickup ? [['Pickup', notes.pickup]] : []),
    ...(notes?.budget ? [['Budget', notes.budget]] : []),
    ...(addOns.length > 0 ? [['Add-ons', addOns.join(', ')]] : []),
  ];

  const clientRows: [string, string, boolean][] = [
    ['Full Name', booking.client?.full_name ?? '—', false],
    ['Email',     booking.client?.email    ?? '—', true],
    ['Phone',     booking.client?.phone    ?? '—', false],
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid #F0F0F0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111', margin: 0, lineHeight: 1.35 }}>
            {booking.reference} — {experience}
          </h2>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 12,
            background: `${statusColor(booking.status)}18`, color: statusColor(booking.status),
            border: `1px solid ${statusColor(booking.status)}28`,
            flexShrink: 0, marginLeft: 16, textTransform: 'uppercase', letterSpacing: 1,
          }}>
            {statusLabel(booking.status)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#111', color: '#C9A84C',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {initials(booking.client?.full_name ?? 'Web Booking')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0 }}>
              {booking.client?.full_name ?? 'Web Booking'}
            </p>
            <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
              {booking.client?.email ?? '—'}
              {booking.client?.phone && ` · ${booking.client.phone}`}
            </p>
          </div>
          <span style={{ fontSize: 11, color: '#BBBBBB', flexShrink: 0 }}>
            {fmtAge(notes?.submitted_at ?? booking.created_at)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <InfoCard label="Travel Date" value={fmtDate(booking.arrival_date)} icon={<Clock size={13} color="#C9A84C" />} />
          <InfoCard label="Total Value" value={`$${booking.total_cost?.toLocaleString() ?? 0} USD`} icon={<CheckCircle2 size={13} color="#C9A84C" />} />
        </div>

        {/* Booking details */}
        <div style={{ background: '#FAFAFA', border: '1px solid #EBEBEB', borderRadius: 6, marginBottom: 14 }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #F0F0F0' }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A84C', margin: 0 }}>
              Booking Details
            </p>
          </div>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', padding: '9px 16px', borderBottom: '1px solid #F5F5F5' }}>
              <span style={{ fontSize: 11, color: '#999', width: 130, flexShrink: 0 }}>{k}</span>
              <span style={{ fontSize: 12, color: '#333' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Client contact */}
        <div style={{ background: '#FAFAFA', border: '1px solid #EBEBEB', borderRadius: 6, marginBottom: 20 }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #F0F0F0' }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A84C', margin: 0 }}>
              Client Contact
            </p>
          </div>
          {clientRows.map(([k, v, isEmail]) => (
            <div key={k} style={{ display: 'flex', padding: '9px 16px', borderBottom: '1px solid #F5F5F5', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#999', width: 130, flexShrink: 0 }}>{k}</span>
              <span style={{ fontSize: 12, color: '#333', flex: 1 }}>{v}</span>
              {isEmail && booking.client?.email && (
                <button
                  onClick={copyEmail}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: copied ? '#16A34A' : '#C9A84C', padding: 0, fontFamily: 'inherit' }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
          ))}
        </div>

        <a
          href={`/reservations/${booking.id}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 20px', background: '#111', color: '#fff',
            textDecoration: 'none', borderRadius: 5, fontSize: 12, fontWeight: 600,
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.8')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
        >
          Open in Reservations <ChevronRight size={12} />
        </a>
      </div>

      {/* Quick reply footer */}
      <div style={{ padding: '12px 28px', borderTop: '1px solid #F0F0F0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <a
          href={`mailto:${booking.client?.email ?? ''}?subject=Re: ${booking.reference} — Your Samsara Travel Enquiry`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: '#F5F5F5', border: '1px solid #E5E5E5',
            borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#333',
            textDecoration: 'none',
          }}
        >
          <Mail size={12} /> Reply via Email Client
        </a>
        <span style={{ fontSize: 11, color: '#CCCCCC' }}>Opens your default email app</span>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function EmailPage() {
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [bookings, setBookings] = useState<WebBooking[]>([]);
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [selectedGmail, setSelectedGmail] = useState<GmailMessage | null>(null);
  const [loadingGmail, setLoadingGmail] = useState(false);
  const [gmailAccount, setGmailAccount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<SelectedAccount>({ type: 'reservations' });
  const [selectedEmail, setSelectedEmail] = useState<WebBooking | null>(null);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'personal' | 'department'>('personal');
  const [addForm, setAddForm] = useState({ name: '', email: '' });
  const [addLoading, setAddLoading] = useState(false);

  const loadGmail = useCallback(async () => {
    setLoadingGmail(true);
    try {
      const res = await fetch('/api/gmail');
      const data = await res.json();
      if (data.success) {
        setGmailMessages(data.emails ?? []);
        setGmailAccount(data.account ?? '');
        setSelectedGmail(prev => prev ?? data.emails?.[0] ?? null);
      } else {
        toast.error(data.error?.includes('IMAP') ? 'Enable IMAP in Gmail settings first' : (data.error ?? 'Failed to load Gmail'));
      }
    } catch { toast.error('Could not connect to Gmail'); }
    finally { setLoadingGmail(false); }
  }, []);

  const loadRecipients = useCallback(async () => {
    try {
      const res = await fetch('/api/email-settings');
      const data = await res.json();
      if (data.success) setRecipients(data.recipients ?? []);
    } catch { /* silently ignore if table not yet created */ }
  }, []);

  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.success && data.reservations) {
        const sorted = [...data.reservations].sort(
          (a: WebBooking, b: WebBooking) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setBookings(sorted);
        setSelectedEmail(prev => prev ?? sorted[0] ?? null);
      }
    } catch { /* ignore */ } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    loadRecipients();
    loadBookings();
  }, [loadRecipients, loadBookings]);

  async function handleRefresh() {
    setRefreshing(true);
    if (selectedAccount.type === 'gmail') {
      await loadGmail();
    } else {
      await loadBookings();
    }
    setRefreshing(false);
    toast.success('Refreshed');
  }

  async function handleAddRecipient() {
    if (!addForm.name.trim() || !addForm.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch('/api/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addForm.name, email: addForm.email, type: addType }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${addForm.name} added`);
        setAddForm({ name: '', email: '' });
        setShowAddModal(false);
        await loadRecipients();
      } else {
        toast.error(data.error ?? 'Failed to add');
      }
    } catch { toast.error('Network error'); }
    finally { setAddLoading(false); }
  }

  async function handleRemove(id: string, name: string) {
    try {
      const res = await fetch(`/api/email-settings?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success(`${name} removed`);
        await loadRecipients();
      } else {
        toast.error(data.error ?? 'Failed to remove');
      }
    } catch { toast.error('Network error'); }
  }

  const personalEmails   = recipients.filter(r => r.type === 'personal');
  const departmentEmails = recipients.filter(r => r.type === 'department');
  const unreadCount      = bookings.filter(b => b.status === 'enquiry').length;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)', background: '#F7F7F7' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #DDDDDD; border-radius: 2px; }
      `}</style>

      {/* ── Col 1: Accounts panel ── */}
      <div style={{
        width: 220, flexShrink: 0, background: '#ffffff',
        borderRight: '1px solid #EBEBEB',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Email</span>
          <div style={{ display: 'flex', gap: 2 }}>
            <IconBtn
              icon={<Settings size={13} />}
              active={showSettings}
              title="Manage accounts"
              onClick={() => setShowSettings(s => !s)}
            />
            <IconBtn
              icon={<Plus size={13} />}
              title="Add email account"
              onClick={() => { setAddType('personal'); setShowAddModal(true); }}
            />
          </div>
        </div>

        {/* Reservations section */}
        <div style={{ padding: '12px 8px 4px' }}>
          <SectionLabel>Reservations</SectionLabel>
          <AccountItem
            icon={<Inbox size={13} />}
            label="Samsara Reservations"
            badge={unreadCount}
            active={selectedAccount.type === 'reservations'}
            onClick={() => { setSelectedAccount({ type: 'reservations' }); }}
          />
          <AccountItem
            icon={<Mail size={13} />}
            label={gmailAccount || (process.env.NEXT_PUBLIC_GMAIL_LABEL ?? 'Reservations Inbox')}
            sublabel="rentalcarssrilanka@gmail.com"
            badge={gmailMessages.filter(m => m.unread).length || undefined}
            active={selectedAccount.type === 'gmail'}
            onClick={() => {
              setSelectedAccount({ type: 'gmail' });
              if (gmailMessages.length === 0) loadGmail();
            }}
          />
          {departmentEmails.map(r => (
            <AccountItem
              key={r.id}
              icon={<Building2 size={13} />}
              label={r.name}
              sublabel={r.email}
              active={selectedAccount.type === 'department' && (selectedAccount as { id: string }).id === r.id}
              onClick={() => setSelectedAccount({ type: 'department', id: r.id, name: r.name, email: r.email })}
              onRemove={showSettings ? () => handleRemove(r.id, r.name) : undefined}
            />
          ))}
          {showSettings && (
            <AddInlineBtn label="Add department email" onClick={() => { setAddType('department'); setShowAddModal(true); }} />
          )}
        </div>

        <div style={{ height: 1, background: '#F0F0F0', margin: '6px 12px' }} />

        {/* Personal section */}
        <div style={{ padding: '0 8px 12px' }}>
          <SectionLabel>Personal</SectionLabel>
          {personalEmails.length === 0 && !showSettings && (
            <p style={{ fontSize: 11, color: '#CCCCCC', padding: '4px 10px', margin: 0 }}>No personal emails added</p>
          )}
          {personalEmails.map(r => (
            <AccountItem
              key={r.id}
              icon={<User size={13} />}
              label={r.name}
              sublabel={r.email}
              active={selectedAccount.type === 'personal' && (selectedAccount as { id: string }).id === r.id}
              onClick={() => setSelectedAccount({ type: 'personal', id: r.id, name: r.name, email: r.email })}
              onRemove={showSettings ? () => handleRemove(r.id, r.name) : undefined}
            />
          ))}
          {showSettings && (
            <AddInlineBtn label="Add personal email" onClick={() => { setAddType('personal'); setShowAddModal(true); }} />
          )}
        </div>
      </div>

      {/* ── Col 2: Email list ── */}
      <div style={{
        width: 340, flexShrink: 0, background: '#FAFAFA',
        borderRight: '1px solid #EBEBEB',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '13px 14px 10px', borderBottom: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
              {selectedAccount.type === 'reservations' ? 'Samsara Reservations'
                : selectedAccount.type === 'gmail' ? 'Gmail Inbox'
                : (selectedAccount as { name: string }).name}
            </span>
            {selectedAccount.type === 'reservations' && unreadCount > 0 && (
              <span style={{ background: '#111', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                {unreadCount}
              </span>
            )}
          </div>
          <IconBtn icon={<RefreshCw size={13} strokeWidth={2} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />} onClick={handleRefresh} title="Refresh" />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {selectedAccount.type === 'gmail' ? (
            loadingGmail ? (
              <p style={{ padding: 24, color: '#BBBBBB', fontSize: 13, textAlign: 'center' }}>Connecting to Gmail…</p>
            ) : gmailMessages.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <Mail size={36} color="#DDDDDD" strokeWidth={1} style={{ marginBottom: 12 }} />
                <p style={{ color: '#BBBBBB', fontSize: 13, margin: '0 0 4px' }}>No emails found</p>
                <p style={{ color: '#CCCCCC', fontSize: 11, margin: 0 }}>Make sure IMAP is enabled in Gmail settings</p>
              </div>
            ) : (
              gmailMessages.map(msg => {
                const isSelected = selectedGmail?.uid === msg.uid;
                return (
                  <div
                    key={msg.uid}
                    onClick={() => setSelectedGmail(msg)}
                    style={{
                      padding: '12px 14px', borderBottom: '1px solid #F0F0F0',
                      borderLeft: isSelected ? '3px solid #111' : '3px solid transparent',
                      background: isSelected ? '#FFFFFF' : 'transparent', cursor: 'pointer',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#F3F3F3'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        {msg.unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#111', flexShrink: 0 }} />}
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#111', color: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                          {initials(msg.from)}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: msg.unread ? 700 : 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                          {msg.from}
                        </span>
                      </div>
                      <span style={{ fontSize: 10, color: '#AAAAAA', flexShrink: 0 }}>{fmtAge(msg.date)}</span>
                    </div>
                    <p style={{ fontSize: 12, fontWeight: msg.unread ? 600 : 400, color: '#333', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {msg.subject}
                    </p>
                    <p style={{ fontSize: 11, color: '#AAAAAA', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                      {msg.preview}
                    </p>
                  </div>
                );
              })
            )
          ) : selectedAccount.type === 'reservations' ? (
            loadingBookings ? (
              <p style={{ padding: 24, color: '#BBBBBB', fontSize: 13, textAlign: 'center' }}>Loading…</p>
            ) : bookings.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <Inbox size={36} color="#DDDDDD" strokeWidth={1} style={{ marginBottom: 12 }} />
                <p style={{ color: '#BBBBBB', fontSize: 13, margin: '0 0 4px' }}>No reservation emails yet</p>
                <p style={{ color: '#CCCCCC', fontSize: 11, margin: 0 }}>Bookings from your website will appear here</p>
              </div>
            ) : (
              bookings.map(b => {
                const isSelected = selectedEmail?.id === b.id;
                const isUnread   = b.status === 'enquiry';
                const notes      = parseNotes(b.internal_notes);
                const experience = notes?.experience ?? 'Travel Enquiry';
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedEmail(b)}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid #F0F0F0',
                      borderLeft: isSelected ? '3px solid #111' : '3px solid transparent',
                      background: isSelected ? '#FFFFFF' : 'transparent',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#F3F3F3'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        {isUnread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#111', flexShrink: 0 }} />}
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: '#111', color: '#C9A84C',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 700, flexShrink: 0,
                        }}>
                          {initials(b.client?.full_name ?? 'WB')}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: isUnread ? 700 : 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                          {b.client?.full_name ?? 'Web Booking'}
                        </span>
                      </div>
                      <span style={{ fontSize: 10, color: '#AAAAAA', flexShrink: 0 }}>{fmtAge(b.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 12, fontWeight: isUnread ? 600 : 400, color: '#333', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.reference} — {experience}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: 11, color: '#AAAAAA', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                        {b.client?.email ?? '—'} · ${b.total_cost?.toLocaleString() ?? 0}
                      </p>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 8, flexShrink: 0,
                        background: `${statusColor(b.status)}15`, color: statusColor(b.status),
                      }}>
                        {statusLabel(b.status)}
                      </span>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Mail size={36} color="#DDDDDD" strokeWidth={1} style={{ marginBottom: 12 }} />
              <p style={{ color: '#BBBBBB', fontSize: 13, margin: '0 0 4px' }}>Personal inbox</p>
              <p style={{ color: '#CCCCCC', fontSize: 11, margin: 0 }}>
                Connect {(selectedAccount as { email?: string }).email ?? 'your email'} via your provider to see messages
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Col 3: Detail panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff', minWidth: 0 }}>
        {selectedAccount.type === 'gmail' && selectedGmail ? (
          <GmailDetail message={selectedGmail} />
        ) : selectedAccount.type === 'gmail' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#CCCCCC' }}>
            <Mail size={40} strokeWidth={1} />
            <p style={{ marginTop: 12, fontSize: 14 }}>Select an email to read</p>
          </div>
        ) : selectedAccount.type === 'reservations' && selectedEmail ? (
          <ReservationDetail booking={selectedEmail} />
        ) : selectedAccount.type === 'reservations' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#CCCCCC' }}>
            <Inbox size={40} strokeWidth={1} />
            <p style={{ marginTop: 12, fontSize: 14 }}>Select a reservation to view details</p>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#CCCCCC' }}>
            <Mail size={40} strokeWidth={1} />
            <p style={{ marginTop: 12, fontSize: 14, color: '#BBBBBB' }}>
              {(selectedAccount as { name?: string }).name ?? 'This account'} is not yet connected
            </p>
            <p style={{ fontSize: 12, margin: '4px 0 0' }}>
              Add the email address to receive notifications when bookings arrive
            </p>
          </div>
        )}
      </div>

      {/* ── Add email modal ── */}
      {showAddModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div style={{ background: '#ffffff', borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.22)', width: 400, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Add Email Account</span>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex' }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['personal', 'department'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setAddType(t)}
                    style={{
                      flex: 1, padding: '8px 0', border: '1px solid',
                      borderColor: addType === t ? '#111' : '#E5E5E5',
                      borderRadius: 6, background: addType === t ? '#111' : 'none',
                      color: addType === t ? '#fff' : '#555',
                      fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {t === 'personal' ? 'Personal' : 'Department'}
                  </button>
                ))}
              </div>
              <input
                placeholder="Display name"
                value={addForm.name}
                onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                style={{ padding: '10px 12px', border: '1px solid #E5E5E5', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#111' }}
              />
              <input
                type="email"
                placeholder="email@example.com"
                value={addForm.email}
                onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') handleAddRecipient(); }}
                style={{ padding: '10px 12px', border: '1px solid #E5E5E5', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#111' }}
              />
              <p style={{ fontSize: 11, color: '#BBBBBB', margin: 0, lineHeight: 1.6 }}>
                {addType === 'department'
                  ? 'Department emails receive staff notification emails whenever a new booking is submitted from the website.'
                  : 'Personal emails are listed for reference. Add your email so the team knows how to reach you.'}
              </p>
            </div>
            <div style={{ padding: '12px 18px', borderTop: '1px solid #F0F0F0', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ padding: '8px 16px', border: '1px solid #E5E5E5', borderRadius: 6, background: 'none', fontSize: 12, fontWeight: 500, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddRecipient}
                disabled={addLoading}
                style={{ padding: '8px 20px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: addLoading ? 0.6 : 1 }}
              >
                {addLoading ? 'Adding…' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── GmailDetail ───────────────────────────────────────────────────────────────

function GmailDetail({ message }: { message: GmailMessage }) {
  const [copied, setCopied] = useState(false);

  function copyEmail() {
    navigator.clipboard.writeText(message.fromEmail).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid #F0F0F0', flexShrink: 0 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111', margin: '0 0 14px', lineHeight: 1.35 }}>
          {message.subject}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#111', color: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {initials(message.from)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0 }}>{message.from}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <p style={{ fontSize: 12, color: '#999', margin: 0 }}>{message.fromEmail}</p>
              {message.fromEmail && (
                <button onClick={copyEmail} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: copied ? '#16A34A' : '#C9A84C', padding: 0, fontFamily: 'inherit' }}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
          </div>
          <span style={{ fontSize: 11, color: '#BBBBBB', flexShrink: 0 }}>{fmtAge(message.date)}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        <div style={{ background: '#FAFAFA', border: '1px solid #EBEBEB', borderRadius: 6, padding: '20px 24px' }}>
          <pre style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#333', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.preview || '(No preview available — open in Gmail to read full message)'}
          </pre>
        </div>
        <p style={{ fontSize: 11, color: '#CCCCCC', margin: '12px 0 0' }}>
          Showing preview only. Open in Gmail for the full message.
        </p>
      </div>

      {/* Reply footer */}
      <div style={{ padding: '12px 28px', borderTop: '1px solid #F0F0F0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <a
          href={`mailto:${message.fromEmail}?subject=Re: ${message.subject}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#F5F5F5', border: '1px solid #E5E5E5', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#333', textDecoration: 'none' }}
        >
          <Mail size={12} /> Reply
        </a>
        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#F5F5F5', border: '1px solid #E5E5E5', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#333', textDecoration: 'none' }}
        >
          Open Gmail →
        </a>
      </div>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#BBBBBB', margin: '0 0 6px', padding: '0 6px' }}>
      {children}
    </p>
  );
}

function AddInlineBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', padding: '6px 10px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#C9A84C', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
    >
      <Plus size={11} /> {label}
    </button>
  );
}

function IconBtn({ icon, onClick, title, active }: { icon: React.ReactNode; onClick: () => void; title?: string; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{ background: active ? '#F0F0F0' : 'none', border: 'none', cursor: 'pointer', padding: '4px 5px', borderRadius: 4, color: active ? '#333' : '#999', display: 'flex', transition: 'color 0.1s, background 0.1s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#333'; (e.currentTarget as HTMLElement).style.background = '#F0F0F0'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = active ? '#333' : '#999'; (e.currentTarget as HTMLElement).style.background = active ? '#F0F0F0' : 'none'; }}
    >
      {icon}
    </button>
  );
}
