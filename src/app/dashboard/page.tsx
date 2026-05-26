'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/lib/toast';
import {
  Inbox, Send, FileText, Star, AlertOctagon,
  Trash2, Archive, Tag, RefreshCw, Pencil,
  Paperclip, ChevronDown, X, Mail, ChevronRight, Clock,
} from 'lucide-react';

// ── Extra types ────────────────────────────────────────────────────────────────

type WebBooking = {
  id: string; reference: string; status: string;
  arrival_date: string; total_cost: number; created_at: string;
  client?: { full_name: string; email: string; phone: string };
  internal_notes?: string;
};

type GmailMsg = {
  uid: number; subject: string; from: string; fromEmail: string;
  date: string; preview: string; unread: boolean;
};

function parseNotes(raw?: string) {
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function fmtDate(d: string) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}
function statusColor(s: string) {
  if (s === 'enquiry') return '#2563EB';
  if (s === 'confirmed' || s === 'paid') return '#16A34A';
  if (s === 'cancelled') return '#DC2626';
  return '#D97706';
}
function statusLabel(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function nameInitials(name: string) { return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '??'; }

// ── Types ──────────────────────────────────────────────────────────────────────

type Email = {
  id: number;
  from: string;
  initials: string;
  email: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  tag?: string;
  tagColor?: string;
  hasAttachment?: boolean;
  body: string;
};

// ── Mock data per folder ───────────────────────────────────────────────────────

const FOLDER_DATA: Record<string, Email[]> = {
  inbox: [
    {
      id: 1,
      from: 'Rajiv Mehta',
      initials: 'RM',
      email: 'rajiv.mehta@gmail.com',
      subject: 'Reservation Inquiry — Maldives, June 2026',
      preview: 'Dear team, I am interested in a luxury travel package to the Maldives for two adults departing Colombo in June...',
      time: '10:42 AM',
      unread: true,
      tag: 'Enquiry',
      tagColor: '#2563EB',
      body: `Dear Samsara Team,

I am writing to inquire about a luxury travel package to the Maldives for two adults, departing from Colombo in early June 2026.

We are looking for a private overwater villa experience with full-board dining, snorkelling excursions, and airport transfers. Our budget is approximately USD 8,000–12,000 for the full package.

Could you please send me a detailed itinerary and pricing at your earliest convenience?

Looking forward to hearing from you.

Warm regards,
Rajiv Mehta`,
    },
    {
      id: 2,
      from: 'Anoma Perera',
      initials: 'AP',
      email: 'anoma.p@outlook.com',
      subject: 'Re: Italy & Switzerland Itinerary — Confirmation',
      preview: 'Thank you so much for the updated itinerary. Everything looks perfect. We are happy to confirm the booking...',
      time: '9:15 AM',
      unread: true,
      tag: 'Confirmed',
      tagColor: '#16A34A',
      body: `Dear Samsara Team,

Thank you so much for the updated itinerary for our Italy and Switzerland trip. Everything looks absolutely perfect — the hotel selections, the private transfers, and the guided tours are exactly what we had in mind.

We are happy to confirm the booking and will proceed with the 50% deposit payment today. Please send the invoice to this email address.

Best regards,
Anoma Perera`,
    },
    {
      id: 3,
      from: 'Six Senses Laamu',
      initials: 'SS',
      email: 'reservations@sixsenses.com',
      subject: 'Booking Confirmation #SS-2026-04821',
      preview: 'We are pleased to confirm your reservation at Six Senses Laamu for the dates 12–18 June 2026...',
      time: 'Yesterday',
      unread: false,
      tag: 'Partner',
      tagColor: '#7C3AED',
      body: `Dear Samsara Travel Team,

We are pleased to confirm your reservation at Six Senses Laamu.

Booking Reference: SS-2026-04821
Dates: 12–18 June 2026 (6 nights)
Villa: Ocean Retreat with Pool × 2
Meal Plan: Full Board
Special Requests: Sunset dinner on the sandbank (18 June)

A formal voucher will be issued 30 days prior to arrival. Please ensure guest details are submitted by 30 May 2026.

Warm regards,
Six Senses Laamu — Reservations`,
    },
    {
      id: 4,
      from: 'Kasun Fernando',
      initials: 'KF',
      email: 'kasun.f@yahoo.com',
      subject: 'Payment Receipt — Reservation SAM-2026-1042',
      preview: 'Hi, I have completed the wire transfer for the balance payment of USD 6,400. Please find the receipt attached...',
      time: 'Yesterday',
      unread: false,
      tag: 'Finance',
      tagColor: '#D97706',
      hasAttachment: true,
      body: `Hi Samsara Team,

I have completed the wire transfer for the balance payment of USD 6,400 for Reservation SAM-2026-1042 (Kenya Safari, August 2026).

The transfer reference is HSBC-TRF-2026-991827. Please find the bank receipt attached to this email.

Kindly confirm receipt and send the final travel documents at your earliest convenience.

Thanks,
Kasun Fernando`,
    },
    {
      id: 5,
      from: 'Nishadi Jayawardena',
      initials: 'NJ',
      email: 'nishadi.j@gmail.com',
      subject: 'Change Request — Departure Date Update',
      preview: 'I hope this finds you well. I wanted to request a change to our departure date. We would need to move it forward by two days...',
      time: 'Mon',
      unread: false,
      tag: 'Action',
      tagColor: '#DC2626',
      body: `Dear Team,

I hope this message finds you well. I am writing to request a change to our departure date for the upcoming Japan trip (Reservation SAM-2026-0988).

We need to move the departure forward by two days, from 15 September to 13 September 2026. Please let me know if this is possible and if there are any additional costs involved.

Thank you for your assistance.

Kind regards,
Nishadi Jayawardena`,
    },
    {
      id: 6,
      from: 'Amari Koh Samui',
      initials: 'AK',
      email: 'groups@amari.com',
      subject: 'Group Rate Proposal — August 2026',
      preview: 'Following our recent conversation, please find attached the group rate proposal for 12 rooms from 3–10 August 2026...',
      time: 'Mon',
      unread: false,
      tag: 'Partner',
      tagColor: '#7C3AED',
      hasAttachment: true,
      body: `Dear Samsara Travel,

Following our recent conversation, please find attached the group rate proposal for 12 Superior Sea View rooms at Amari Koh Samui.

Dates: 3–10 August 2026 (7 nights)
Rate: THB 4,200 per room per night (net, non-commissionable)
Inclusions: Breakfast, airport transfers, welcome drinks
Validity: 30 April 2026

Please revert at your earliest convenience to hold these rooms on a tentative basis.

Best regards,
Amari Koh Samui — Groups & Events`,
    },
    {
      id: 7,
      from: 'Dileepa Bandara',
      initials: 'DB',
      email: 'dileepa.b@gmail.com',
      subject: 'Trip Feedback — Paris & Barcelona',
      preview: 'We just returned from the most wonderful trip. Everything was seamlessly organised — the hotels, guides, restaurants...',
      time: 'Sun',
      unread: false,
      tag: 'Feedback',
      tagColor: '#059669',
      body: `Dear Samsara Team,

We just returned from the most wonderful two-week trip to Paris and Barcelona, and I wanted to write to express our heartfelt gratitude.

Everything was seamlessly organised — the hotels were exceptional, the private guides were knowledgeable and personable, and the restaurant recommendations were spot-on. This was truly a trip of a lifetime.

We will certainly be coming back to Samsara for our next adventure!

With many thanks,
Dileepa & Priya Bandara`,
    },
  ],

  sent: [
    {
      id: 101,
      from: 'You → Rajiv Mehta',
      initials: 'ME',
      email: 'rajiv.mehta@gmail.com',
      subject: 'Re: Reservation Inquiry — Maldives, June 2026',
      preview: 'Dear Rajiv, Thank you for reaching out to Samsara Travel. We would be delighted to assist you with a luxury Maldives package...',
      time: '11:05 AM',
      unread: false,
      body: `Dear Rajiv,

Thank you for reaching out to Samsara Travel. We would be delighted to assist you in planning your luxury Maldives getaway.

Based on your requirements, I am pleased to propose the following options:

Option A — Six Senses Laamu (6 nights)
Overwater Villa with Pool | Full board | Private snorkelling guide
Estimated cost: USD 9,800 per couple

Option B — Soneva Jani (5 nights)
Water Retreat Villa | Half board | Arrival by seaplane
Estimated cost: USD 11,200 per couple

Both options include return transfers and a welcome amenity from us.

Please let me know which option interests you, and I will prepare a detailed proposal.

Warm regards,
Samsara Travel Team`,
    },
    {
      id: 102,
      from: 'You → Amari Koh Samui',
      initials: 'ME',
      email: 'groups@amari.com',
      subject: 'Re: Group Rate Proposal — August 2026',
      preview: 'Dear team, Thank you for the proposal. We are tentatively interested in 10 rooms rather than 12. Could you confirm availability...',
      time: 'Mon, 2:30 PM',
      unread: false,
      hasAttachment: true,
      body: `Dear Amari Koh Samui Team,

Thank you for the group rate proposal. We are very interested and would like to move forward on a tentative basis.

However, we would require 10 rooms rather than 12. Could you please confirm availability for the same dates (3–10 August 2026) and advise if the rate remains the same?

Additionally, please confirm whether early check-in on 3 August is possible for the group.

Attached is a copy of our signed agent agreement for your reference.

Best regards,
Samsara Travel — Groups Desk`,
    },
    {
      id: 103,
      from: 'You → Kasun Fernando',
      initials: 'ME',
      email: 'kasun.f@yahoo.com',
      subject: 'Payment Confirmed — Reservation SAM-2026-1042',
      preview: 'Dear Kasun, We are pleased to confirm receipt of your balance payment of USD 6,400. Your final travel documents are attached...',
      time: 'Yesterday, 4:10 PM',
      unread: false,
      hasAttachment: true,
      body: `Dear Kasun,

We are pleased to confirm receipt of your balance payment of USD 6,400 for Reservation SAM-2026-1042 (Kenya Safari, August 2026).

Please find attached your final travel documents:
• E-tickets (Colombo → Nairobi → Colombo)
• Hotel vouchers (Giraffe Manor, Angama Mara)
• Safari itinerary and lodge confirmations
• Emergency contact sheet

Your trip is fully confirmed. Should you have any questions before departure, please do not hesitate to reach out.

We wish you an extraordinary safari experience!

Warm regards,
Samsara Travel Team`,
    },
  ],

  drafts: [
    {
      id: 201,
      from: 'Draft',
      initials: 'DR',
      email: 'nishadi.j@gmail.com',
      subject: 'Re: Change Request — Departure Date Update',
      preview: 'Dear Nishadi, Thank you for getting in touch. I have checked availability with our airline partner and...',
      time: 'Today',
      unread: false,
      tag: 'Draft',
      tagColor: '#6B7280',
      body: `Dear Nishadi,

Thank you for getting in touch. I have checked availability with our airline partner and

[DRAFT — not yet sent]`,
    },
    {
      id: 202,
      from: 'Draft',
      initials: 'DR',
      email: 'pr@fourseasons.com',
      subject: 'Partnership Inquiry — Four Seasons Bali',
      preview: 'Dear Four Seasons Bali Team, I am writing on behalf of Samsara Travel to inquire about establishing a preferred partner...',
      time: 'Yesterday',
      unread: false,
      tag: 'Draft',
      tagColor: '#6B7280',
      body: `Dear Four Seasons Bali Team,

I am writing on behalf of Samsara Travel, a luxury travel consultancy based in Colombo, Sri Lanka, to inquire about establishing a preferred partner arrangement.

We specialise in high-end experiential travel for South Asian clientele and regularly arrange stays at leading luxury properties across Asia.

[DRAFT — not yet sent]`,
    },
  ],

  starred: [
    {
      id: 2,
      from: 'Anoma Perera',
      initials: 'AP',
      email: 'anoma.p@outlook.com',
      subject: 'Re: Italy & Switzerland Itinerary — Confirmation',
      preview: 'Thank you so much for the updated itinerary. Everything looks perfect. We are happy to confirm the booking...',
      time: '9:15 AM',
      unread: true,
      tag: 'Confirmed',
      tagColor: '#16A34A',
      body: `Dear Samsara Team,

Thank you so much for the updated itinerary for our Italy and Switzerland trip. Everything looks absolutely perfect.

We are happy to confirm the booking and will proceed with the 50% deposit payment today.

Best regards,
Anoma Perera`,
    },
    {
      id: 6,
      from: 'Amari Koh Samui',
      initials: 'AK',
      email: 'groups@amari.com',
      subject: 'Group Rate Proposal — August 2026',
      preview: 'Following our recent conversation, please find attached the group rate proposal for 12 rooms...',
      time: 'Mon',
      unread: false,
      tag: 'Partner',
      tagColor: '#7C3AED',
      hasAttachment: true,
      body: `Dear Samsara Travel,

Following our recent conversation, please find attached the group rate proposal for 12 Superior Sea View rooms at Amari Koh Samui.

Dates: 3–10 August 2026 (7 nights)
Rate: THB 4,200 per room per night

Best regards,
Amari Koh Samui — Groups & Events`,
    },
  ],

  spam: [
    {
      id: 301,
      from: 'travel-deals@promo99.net',
      initials: '??',
      email: 'travel-deals@promo99.net',
      subject: 'URGENT: Exclusive Travel Deals — Act Now!!!',
      preview: 'Congratulations! You have been selected for our exclusive travel rewards programme. Click here to claim...',
      time: '8:02 AM',
      unread: true,
      tag: 'Spam',
      tagColor: '#DC2626',
      body: `CONGRATULATIONS!!!

You have been selected for our EXCLUSIVE travel rewards programme!

Click the link below to claim your FREE holiday voucher worth $5,000!!!

[This message has been marked as spam]`,
    },
    {
      id: 302,
      from: 'noreply@bulk-mailer.io',
      initials: '??',
      email: 'noreply@bulk-mailer.io',
      subject: 'Your account requires immediate verification',
      preview: 'We noticed unusual activity on your account. Please verify your identity within 24 hours to avoid suspension...',
      time: 'Yesterday',
      unread: false,
      tag: 'Spam',
      tagColor: '#DC2626',
      body: `Dear user,

We noticed unusual activity on your account. Please verify your identity within 24 hours to avoid account suspension.

Click here: [suspicious link removed]

[This message has been marked as spam]`,
    },
  ],

  trash: [
    {
      id: 401,
      from: 'Old Booking System',
      initials: 'SYS',
      email: 'noreply@oldsystem.internal',
      subject: 'System Migration Notice — Action No Longer Required',
      preview: 'This is an automated notice from the previous booking system. All data has been successfully migrated...',
      time: '12 Apr',
      unread: false,
      body: `This is an automated notice from the previous booking system.

All data has been successfully migrated to the new Samsara RMS platform. No further action is required.

This message has been moved to Trash.`,
    },
    {
      id: 402,
      from: 'Promo Newsletter',
      initials: 'NL',
      email: 'newsletter@travelweekly.com',
      subject: 'Travel Weekly — April Edition',
      preview: 'This week in luxury travel: Sustainable luxury takes centre stage as leading hotel groups announce new eco initiatives...',
      time: '10 Apr',
      unread: false,
      body: `Travel Weekly — April 2026 Edition

This week in luxury travel: Sustainable luxury takes centre stage as leading hotel groups announce new eco initiatives across Asia-Pacific.

[Message moved to Trash]`,
    },
  ],

  archive: [
    {
      id: 501,
      from: 'Aman Resorts',
      initials: 'AR',
      email: 'trade@aman.com',
      subject: 'Aman Trade Partner Rate Sheet 2025',
      preview: 'Please find enclosed the Aman Resorts trade partner rate sheet for the 2025 season, valid from January through December...',
      time: '3 Jan',
      unread: false,
      tag: 'Partner',
      tagColor: '#7C3AED',
      hasAttachment: true,
      body: `Dear Samsara Travel Team,

Please find enclosed the Aman Resorts trade partner rate sheet for the 2025 season (January–December 2025).

All rates are NET and strictly confidential. Please do not distribute outside your organisation.

For reservations, please contact your dedicated Aman trade desk representative.

Best regards,
Aman Resorts — Trade Partnerships`,
    },
  ],
};

// ── Folder config ──────────────────────────────────────────────────────────────

const FOLDERS = [
  { key: 'inbox',   label: 'Inbox',       icon: Inbox,        badge: FOLDER_DATA.inbox.filter(e => e.unread).length },
  { key: 'starred', label: 'Starred',     icon: Star,         badge: 0 },
  { key: 'sent',    label: 'Sent',        icon: Send,         badge: 0 },
  { key: 'drafts',  label: 'Drafts',      icon: FileText,     badge: FOLDER_DATA.drafts.length },
  { key: 'archive', label: 'Archive',     icon: Archive,      badge: 0 },
  { key: 'spam',    label: 'Spam',        icon: AlertOctagon, badge: FOLDER_DATA.spam.filter(e => e.unread).length },
  { key: 'trash',   label: 'Trash',       icon: Trash2,       badge: 0 },
];

const LABELS = [
  { key: 'enquiry',  label: 'Enquiries', color: '#2563EB' },
  { key: 'partner',  label: 'Partners',  color: '#7C3AED' },
  { key: 'finance',  label: 'Finance',   color: '#D97706' },
  { key: 'action',   label: 'Action',    color: '#DC2626' },
  { key: 'feedback', label: 'Feedback',  color: '#059669' },
];

// ── Page component ─────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [folder,         setFolder]         = useState('inbox');
  const [selected,       setSelected]       = useState<Email | null>(FOLDER_DATA.inbox[0]);
  const [labelsOpen,     setLabelsOpen]     = useState(true);
  const [activeLabel,    setActiveLabel]    = useState<string | null>(null);
  const [refreshing,     setRefreshing]     = useState(false);
  const [replyText,      setReplyText]      = useState('');
  const [showCompose,    setShowCompose]    = useState(false);
  const [compose,        setCompose]        = useState({ to: '', subject: '', body: '' });
  const [sentEmails,     setSentEmails]     = useState<Email[]>(FOLDER_DATA.sent ?? []);
  const [bookings,       setBookings]       = useState<WebBooking[]>([]);
  const [selBooking,     setSelBooking]     = useState<WebBooking | null>(null);
  const [loadingRes,     setLoadingRes]     = useState(false);
  const [gmailMsgs,      setGmailMsgs]     = useState<GmailMsg[]>([]);
  const [selGmail,       setSelGmail]       = useState<GmailMsg | null>(null);
  const [loadingGmail,   setLoadingGmail]   = useState(false);

  const loadBookings = useCallback(async () => {
    setLoadingRes(true);
    try {
      const res  = await fetch('/api/bookings');
      const data = await res.json();
      if (data.success && data.reservations) {
        const sorted = [...data.reservations].sort((a: WebBooking, b: WebBooking) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setBookings(sorted);
        setSelBooking(prev => prev ?? sorted[0] ?? null);
      }
    } catch { /* ignore */ } finally { setLoadingRes(false); }
  }, []);

  const loadGmail = useCallback(async () => {
    setLoadingGmail(true);
    try {
      const res  = await fetch('/api/gmail');
      const data = await res.json();
      if (data.success) {
        setGmailMsgs(data.emails ?? []);
        setSelGmail(prev => prev ?? data.emails?.[0] ?? null);
      } else {
        toast.error('Could not load Gmail — check IMAP is enabled');
      }
    } catch { toast.error('Gmail connection failed'); }
    finally { setLoadingGmail(false); }
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const rawEmails = folder === 'sent' ? sentEmails : (FOLDER_DATA[folder] ?? []);
  const emails = activeLabel
    ? rawEmails.filter(e => e.tag?.toLowerCase() === activeLabel)
    : rawEmails;

  function openFolder(key: string) {
    setFolder(key);
    setActiveLabel(null);
    if (key === 'reservations') { setSelBooking(bookings[0] ?? null); return; }
    if (key === 'gmail') { if (gmailMsgs.length === 0) loadGmail(); setSelGmail(gmailMsgs[0] ?? null); return; }
    setSelected((key === 'sent' ? sentEmails : FOLDER_DATA[key])?.[0] ?? null);
  }

  function handleLabelClick(key: string) {
    const label = LABELS.find(l => l.key === key);
    if (activeLabel === key) {
      setActiveLabel(null);
      toast.info('Label filter cleared');
    } else {
      setActiveLabel(key);
      toast.info(`Showing "${label?.label}" emails`);
    }
    setSelected(null);
  }

  async function handleRefresh() {
    setRefreshing(true);
    if (folder === 'reservations') { await loadBookings(); }
    else if (folder === 'gmail') { await loadGmail(); }
    else { await new Promise(r => setTimeout(r, 600)); }
    setRefreshing(false);
    toast.success('Refreshed');
  }

  function handleSendReply() {
    if (!replyText.trim()) { toast.error('Reply cannot be empty'); return; }
    if (!selected) return;
    const sent: Email = {
      id: Date.now(), from: 'You', initials: 'N', email: 'nimsha@samsara.travel',
      subject: `Re: ${selected.subject}`, preview: replyText.slice(0, 80),
      time: 'Just now', unread: false,
      body: `To: ${selected.email}\n\n${replyText}`,
    };
    setSentEmails(prev => [sent, ...prev]);
    setReplyText('');
    toast.success('Reply sent successfully');
  }

  function handleComposeSend() {
    if (!compose.to.trim())      { toast.error('Recipient is required'); return; }
    if (!compose.subject.trim()) { toast.error('Subject is required'); return; }
    if (!compose.body.trim())    { toast.error('Message body is required'); return; }
    const sent: Email = {
      id: Date.now(), from: 'You', initials: 'N', email: 'nimsha@samsara.travel',
      subject: compose.subject, preview: compose.body.slice(0, 80),
      time: 'Just now', unread: false, body: `To: ${compose.to}\n\n${compose.body}`,
    };
    setSentEmails(prev => [sent, ...prev]);
    setCompose({ to: '', subject: '', body: '' });
    setShowCompose(false);
    toast.success(`Email sent to ${compose.to}`);
  }

  const unreadCount = (rawEmails).filter(e => e.unread).length;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)', background: '#F7F7F7' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Col 1: Folder panel ── */}
      <div style={{
        width: 200, flexShrink: 0,
        background: '#ffffff',
        borderRight: '1px solid #EBEBEB',
        display: 'flex', flexDirection: 'column',
        padding: '12px 0',
        overflowY: 'auto',
      }}>

        {/* Compose */}
        <div style={{ padding: '0 12px 12px' }}>
          <button onClick={() => setShowCompose(true)} style={{
            width: '100%', padding: '7px 12px',
            background: '#111111', color: '#ffffff',
            border: 'none', borderRadius: 6,
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'opacity 0.12s',
          }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          >
            <Pencil size={12} strokeWidth={2.5} />
            Compose
          </button>
        </div>

        {/* Folders */}
        <div style={{ padding: '0 6px' }}>
          {FOLDERS.map(({ key, label, icon: Icon, badge }) => {
            const active = folder === key;
            return (
              <button
                key={key}
                onClick={() => openFolder(key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 9, padding: '7px 10px', borderRadius: 5,
                  border: 'none', background: active ? '#F0F0F0' : 'none',
                  color: active ? '#111111' : '#555555',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'left', transition: 'background 0.1s, color 0.1s',
                  marginBottom: 1,
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = '#F7F7F7';
                    (e.currentTarget as HTMLElement).style.color = '#111111';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'none';
                    (e.currentTarget as HTMLElement).style.color = '#555555';
                  }
                }}
              >
                <Icon size={14} strokeWidth={active ? 2.25 : 1.75} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {badge > 0 && (
                  <span style={{
                    background: active ? '#111111' : '#E5E5E5',
                    color: active ? '#ffffff' : '#555555',
                    fontSize: 10, fontWeight: 700,
                    padding: '1px 6px', borderRadius: 10,
                    minWidth: 18, textAlign: 'center',
                  }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#F0F0F0', margin: '10px 12px' }} />

        {/* Reservations section */}
        <div style={{ padding: '0 6px' }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#BBBBBB', margin: '0 0 4px', padding: '0 10px' }}>
            Reservations
          </p>
          {[
            { key: 'reservations', label: 'Samsara Bookings', icon: Inbox,  badge: bookings.filter(b => b.status === 'enquiry').length },
            { key: 'gmail',        label: 'Gmail Inbox',      icon: Mail,   badge: gmailMsgs.filter(m => m.unread).length },
          ].map(({ key, label, icon: Icon, badge }) => {
            const active = folder === key;
            return (
              <button key={key} onClick={() => openFolder(key)} style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: 9, padding: '7px 10px', borderRadius: 5, border: 'none',
                background: active ? '#F0F0F0' : 'none',
                color: active ? '#111111' : '#555555',
                fontSize: 13, fontWeight: active ? 600 : 400,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                marginBottom: 1,
              }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = '#F7F7F7'; (e.currentTarget as HTMLElement).style.color = '#111'; } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#555'; } }}
              >
                <Icon size={14} strokeWidth={active ? 2.25 : 1.75} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {badge > 0 && (
                  <span style={{ background: active ? '#111' : '#E5E5E5', color: active ? '#fff' : '#555', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center' }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ height: 1, background: '#F0F0F0', margin: '10px 12px' }} />

        {/* Labels */}
        <div style={{ padding: '0 6px' }}>
          <button
            onClick={() => setLabelsOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '4px 10px 6px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#AAAAAA' }}>
              Labels
            </span>
            <ChevronDown
              size={12}
              color="#AAAAAA"
              style={{ transform: labelsOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}
            />
          </button>

          {labelsOpen && LABELS.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => handleLabelClick(key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: 9, padding: '6px 10px', borderRadius: 5,
                border: 'none',
                background: activeLabel === key ? `${color}18` : 'none',
                color: activeLabel === key ? color : '#555555',
                fontSize: 12, fontWeight: activeLabel === key ? 600 : 400,
                cursor: 'pointer', fontFamily: 'inherit',
                textAlign: 'left', transition: 'background 0.1s',
                marginBottom: 1,
              }}
              onMouseEnter={e => { if (activeLabel !== key) (e.currentTarget as HTMLElement).style.background = '#F7F7F7'; }}
              onMouseLeave={e => { if (activeLabel !== key) (e.currentTarget as HTMLElement).style.background = 'none'; }}
            >
              <Tag size={12} strokeWidth={1.75} color={color} style={{ flexShrink: 0 }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Col 2: Email list ── */}
      <div style={{
        width: 340, flexShrink: 0,
        background: '#FAFAFA',
        borderRight: '1px solid #EBEBEB',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* List header */}
        <div style={{
          padding: '13px 14px 10px',
          borderBottom: '1px solid #EBEBEB',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111111', textTransform: 'capitalize' }}>
              {folder === 'reservations' ? 'Samsara Bookings' : folder === 'gmail' ? 'Gmail Inbox' : (FOLDERS.find(f => f.key === folder)?.label ?? folder)}
            </span>
            {(folder === 'reservations' ? bookings.filter(b => b.status === 'enquiry').length
              : folder === 'gmail' ? gmailMsgs.filter(m => m.unread).length
              : unreadCount) > 0 && (
              <span style={{ background: '#111111', color: '#ffffff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                {folder === 'reservations' ? bookings.filter(b => b.status === 'enquiry').length
                  : folder === 'gmail' ? gmailMsgs.filter(m => m.unread).length
                  : unreadCount}
              </span>
            )}
          </div>
          <button
            title="Refresh"
            onClick={handleRefresh}
            style={{
              background: 'none', border: 'none', padding: '4px 6px',
              borderRadius: 4, display: 'flex', cursor: 'pointer',
              color: '#AAAAAA', transition: 'color 0.1s, background 0.1s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = '#111111';
              (e.currentTarget as HTMLElement).style.background = '#EBEBEB';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = '#AAAAAA';
              (e.currentTarget as HTMLElement).style.background = 'none';
            }}
          >
            <RefreshCw size={13} strokeWidth={2} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ── Reservations list ── */}
          {folder === 'reservations' && (loadingRes ? (
            <p style={{ padding: 24, color: '#BBBBBB', fontSize: 13, textAlign: 'center' }}>Loading…</p>
          ) : bookings.length === 0 ? (
            <p style={{ padding: 24, color: '#BBBBBB', fontSize: 13, textAlign: 'center' }}>No web bookings yet</p>
          ) : bookings.map(b => {
            const isSelected = selBooking?.id === b.id;
            const notes = parseNotes(b.internal_notes);
            const exp = notes?.experience ?? 'Travel Enquiry';
            const isUnread = b.status === 'enquiry';
            return (
              <div key={b.id} onClick={() => setSelBooking(b)} style={{ padding: '11px 14px', borderBottom: '1px solid #F0F0F0', borderLeft: isSelected ? '3px solid #111' : '3px solid transparent', background: isSelected ? '#fff' : 'transparent', cursor: 'pointer' }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#F3F3F3'; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isUnread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#111', flexShrink: 0 }} />}
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#111', color: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, flexShrink: 0 }}>
                      {nameInitials(b.client?.full_name ?? 'WB')}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: isUnread ? 700 : 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                      {b.client?.full_name ?? 'Web Booking'}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: '#AAAAAA' }}>{fmtDate(b.created_at)}</span>
                </div>
                <p style={{ fontSize: 12, fontWeight: isUnread ? 600 : 400, color: '#333', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.reference} — {exp}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 11, color: '#AAAAAA', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{b.client?.email ?? '—'} · ${b.total_cost?.toLocaleString()}</p>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: `${statusColor(b.status)}15`, color: statusColor(b.status) }}>{statusLabel(b.status)}</span>
                </div>
              </div>
            );
          }))}

          {/* ── Gmail list ── */}
          {folder === 'gmail' && (loadingGmail ? (
            <p style={{ padding: 24, color: '#BBBBBB', fontSize: 13, textAlign: 'center' }}>Connecting to Gmail…</p>
          ) : gmailMsgs.length === 0 ? (
            <p style={{ padding: 24, color: '#BBBBBB', fontSize: 13, textAlign: 'center' }}>No emails found</p>
          ) : gmailMsgs.map(msg => {
            const isSelected = selGmail?.uid === msg.uid;
            return (
              <div key={msg.uid} onClick={() => setSelGmail(msg)} style={{ padding: '11px 14px', borderBottom: '1px solid #F0F0F0', borderLeft: isSelected ? '3px solid #111' : '3px solid transparent', background: isSelected ? '#fff' : 'transparent', cursor: 'pointer' }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#F3F3F3'; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {msg.unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#111', flexShrink: 0 }} />}
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#555', flexShrink: 0 }}>
                      {nameInitials(msg.from)}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: msg.unread ? 700 : 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{msg.from}</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#AAAAAA' }}>{fmtDate(msg.date)}</span>
                </div>
                <p style={{ fontSize: 12, fontWeight: msg.unread ? 600 : 400, color: '#333', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.subject}</p>
                <p style={{ fontSize: 11, color: '#AAAAAA', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.preview}</p>
              </div>
            );
          }))}

          {/* ── Standard email list ── */}
          {folder !== 'reservations' && folder !== 'gmail' && emails.length === 0 && (
            <p style={{ padding: 24, color: '#BBBBBB', fontSize: 13, textAlign: 'center' }}>No messages</p>
          )}
          {folder !== 'reservations' && folder !== 'gmail' && emails.map(email => {
            const isSelected = selected?.id === email.id;
            return (
              <div
                key={email.id}
                onClick={() => setSelected(email)}
                style={{
                  padding: '11px 14px',
                  borderBottom: '1px solid #F0F0F0',
                  borderLeft: isSelected ? '3px solid #111111' : '3px solid transparent',
                  background: isSelected ? '#FFFFFF' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#F3F3F3';
                }}
                onMouseLeave={e => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {/* Row 1: sender + time */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {email.unread && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#111111', flexShrink: 0 }} />
                    )}
                    <span style={{
                      fontSize: 12, fontWeight: email.unread ? 700 : 500,
                      color: '#111111',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      maxWidth: 170,
                    }}>
                      {email.from}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: '#AAAAAA', flexShrink: 0 }}>{email.time}</span>
                </div>

                {/* Row 2: subject */}
                <p style={{
                  fontSize: 12, fontWeight: email.unread ? 600 : 400,
                  color: '#333333', margin: '0 0 3px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {email.subject}
                </p>

                {/* Row 3: preview + icons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{
                    fontSize: 11, color: '#AAAAAA', margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: 240,
                  }}>
                    {email.preview}
                  </p>
                  {email.hasAttachment && (
                    <Paperclip size={11} color="#CCCCCC" style={{ flexShrink: 0 }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Compose modal ── */}
      {showCompose && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
          padding: '0 24px 24px', zIndex: 1000,
        }} onClick={e => { if (e.target === e.currentTarget) setShowCompose(false); }}>
          <div style={{
            background: '#ffffff', borderRadius: 10,
            boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
            width: 480, display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '12px 16px', background: '#111111',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>New Message</span>
              <button
                onClick={() => setShowCompose(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#aaaaaa' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#ffffff')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#aaaaaa')}
              >
                <X size={15} />
              </button>
            </div>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* To */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #F0F0F0', padding: '0 16px' }}>
                <label style={{ fontSize: 12, color: '#AAAAAA', width: 52, flexShrink: 0 }}>To</label>
                <input
                  value={compose.to}
                  onChange={e => setCompose(p => ({ ...p, to: e.target.value }))}
                  placeholder="recipient@example.com"
                  style={{
                    flex: 1, padding: '10px 0', fontSize: 13, color: '#111111',
                    border: 'none', outline: 'none', background: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>
              {/* Subject */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #F0F0F0', padding: '0 16px' }}>
                <label style={{ fontSize: 12, color: '#AAAAAA', width: 52, flexShrink: 0 }}>Subject</label>
                <input
                  value={compose.subject}
                  onChange={e => setCompose(p => ({ ...p, subject: e.target.value }))}
                  placeholder="Email subject"
                  style={{
                    flex: 1, padding: '10px 0', fontSize: 13, color: '#111111',
                    border: 'none', outline: 'none', background: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>
              {/* Body */}
              <textarea
                value={compose.body}
                onChange={e => setCompose(p => ({ ...p, body: e.target.value }))}
                placeholder="Write your message…"
                rows={8}
                style={{
                  padding: '14px 16px', fontSize: 13, color: '#111111',
                  border: 'none', outline: 'none', resize: 'none',
                  fontFamily: 'inherit', lineHeight: 1.7,
                }}
              />
            </div>

            {/* Footer */}
            <div style={{
              padding: '10px 16px', borderTop: '1px solid #F0F0F0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <button
                onClick={() => setShowCompose(false)}
                style={{
                  background: 'none', border: '1px solid #E5E5E5', borderRadius: 6,
                  padding: '7px 14px', fontSize: 12, fontWeight: 500, color: '#555555',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Discard
              </button>
              <button
                onClick={handleComposeSend}
                style={{
                  background: '#111111', color: '#ffffff', border: 'none',
                  borderRadius: 6, padding: '7px 20px', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.12s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Col 3: Email detail ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff', minWidth: 0 }}>

        {/* ── Reservation detail ── */}
        {folder === 'reservations' && selBooking && (() => {
          const notes = parseNotes(selBooking.internal_notes);
          const exp = notes?.experience ?? 'Travel Enquiry';
          const src = notes?.source === 'experiences' ? 'Experiences Page' : notes?.source === 'feeling-engine' ? 'Feeling Engine' : 'Website';
          const addOns: string[] = notes?.add_ons ?? [];
          const rows = [['Reference', selBooking.reference], ['Source', src], ['Experience', exp], ...(notes?.pickup ? [['Pickup', notes.pickup]] : []), ...(addOns.length > 0 ? [['Add-ons', addOns.join(', ')]] : [])];
          return (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid #F0F0F0', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111', margin: 0 }}>{selBooking.reference} — {exp}</h2>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 12, background: `${statusColor(selBooking.status)}18`, color: statusColor(selBooking.status), border: `1px solid ${statusColor(selBooking.status)}28`, textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0, marginLeft: 12 }}>{statusLabel(selBooking.status)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#111', color: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{nameInitials(selBooking.client?.full_name ?? 'WB')}</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0 }}>{selBooking.client?.full_name ?? 'Web Booking'}</p>
                    <p style={{ fontSize: 12, color: '#999', margin: 0 }}>{selBooking.client?.email ?? '—'}{selBooking.client?.phone && ` · ${selBooking.client.phone}`}</p>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#BBBBBB' }}>{fmtDate(selBooking.created_at)}</span>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: '#FAFAFA', border: '1px solid #EBEBEB', borderRadius: 6, padding: '12px 16px' }}>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#AAAAAA', margin: '0 0 5px' }}>Travel Date</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={13} color="#C9A84C" />{fmtDate(selBooking.arrival_date)}</p>
                  </div>
                  <div style={{ background: '#FAFAFA', border: '1px solid #EBEBEB', borderRadius: 6, padding: '12px 16px' }}>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#AAAAAA', margin: '0 0 5px' }}>Total Value</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>${selBooking.total_cost?.toLocaleString() ?? 0} USD</p>
                  </div>
                </div>
                <div style={{ background: '#FAFAFA', border: '1px solid #EBEBEB', borderRadius: 6, marginBottom: 12 }}>
                  <div style={{ padding: '9px 16px', borderBottom: '1px solid #F0F0F0' }}><p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A84C', margin: 0 }}>Booking Details</p></div>
                  {rows.map(([k, v]) => (<div key={k} style={{ display: 'flex', padding: '8px 16px', borderBottom: '1px solid #F5F5F5' }}><span style={{ fontSize: 11, color: '#999', width: 120, flexShrink: 0 }}>{k}</span><span style={{ fontSize: 12, color: '#333' }}>{v}</span></div>))}
                </div>
                <a href={`/reservations/${selBooking.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: '#111', color: '#fff', textDecoration: 'none', borderRadius: 5, fontSize: 12, fontWeight: 600 }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.8')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                >Open in Reservations <ChevronRight size={12} /></a>
              </div>
              <div style={{ padding: '10px 28px', borderTop: '1px solid #F0F0F0', flexShrink: 0 }}>
                <a href={`mailto:${selBooking.client?.email ?? ''}?subject=Re: ${selBooking.reference}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#F5F5F5', border: '1px solid #E5E5E5', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#333', textDecoration: 'none' }}>
                  <Mail size={12} /> Reply via Email
                </a>
              </div>
            </div>
          );
        })()}
        {folder === 'reservations' && !selBooking && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#CCCCCC' }}>
            <Inbox size={40} strokeWidth={1} /><p style={{ marginTop: 12, fontSize: 14 }}>Select a booking to view</p>
          </div>
        )}

        {/* ── Gmail detail ── */}
        {folder === 'gmail' && selGmail && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid #F0F0F0', flexShrink: 0 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111', margin: '0 0 14px' }}>{selGmail.subject}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#555', flexShrink: 0 }}>{nameInitials(selGmail.from)}</div>
                <div><p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0 }}>{selGmail.from}</p><p style={{ fontSize: 12, color: '#999', margin: 0 }}>{selGmail.fromEmail}</p></div>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#BBBBBB' }}>{fmtDate(selGmail.date)}</span>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
              <div style={{ background: '#FAFAFA', border: '1px solid #EBEBEB', borderRadius: 6, padding: '20px 24px', marginBottom: 12 }}>
                <pre style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#333', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {selGmail.preview || '(No preview — open in Gmail for full message)'}
                </pre>
              </div>
              <p style={{ fontSize: 11, color: '#CCCCCC', margin: 0 }}>Preview only. Open Gmail to read the full message.</p>
            </div>
            <div style={{ padding: '10px 28px', borderTop: '1px solid #F0F0F0', flexShrink: 0, display: 'flex', gap: 8 }}>
              <a href={`mailto:${selGmail.fromEmail}?subject=Re: ${selGmail.subject}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#F5F5F5', border: '1px solid #E5E5E5', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#333', textDecoration: 'none' }}><Mail size={12} /> Reply</a>
              <a href="https://mail.google.com" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#F5F5F5', border: '1px solid #E5E5E5', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#333', textDecoration: 'none' }}>Open Gmail →</a>
            </div>
          </div>
        )}
        {folder === 'gmail' && !selGmail && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#CCCCCC' }}>
            <Mail size={40} strokeWidth={1} /><p style={{ marginTop: 12, fontSize: 14 }}>Select an email to read</p>
          </div>
        )}

        {/* ── Standard email detail ── */}
        {folder !== 'reservations' && folder !== 'gmail' && (selected ? (
          <>
            {/* Header */}
            <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid #F0F0F0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: 17, fontWeight: 600, color: '#111111', margin: 0, lineHeight: 1.35 }}>
                  {selected.subject}
                </h2>
                {selected.tag && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 12,
                    background: `${selected.tagColor}18`, color: selected.tagColor,
                    border: `1px solid ${selected.tagColor}28`,
                    flexShrink: 0, marginLeft: 16,
                  }}>
                    {selected.tag}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#EBEBEB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#555555', flexShrink: 0,
                }}>
                  {selected.initials}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111111', margin: 0 }}>{selected.from}</p>
                  <p style={{ fontSize: 12, color: '#999999', margin: 0 }}>{selected.email}</p>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#BBBBBB' }}>{selected.time}</span>
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
              <pre style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 13, color: '#333333',
                lineHeight: 1.85, margin: 0,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {selected.body}
              </pre>
            </div>

            {/* Reply — hidden for sent/trash/spam */}
            {folder !== 'sent' && folder !== 'trash' && folder !== 'spam' && (
              <div style={{ padding: '12px 28px', borderTop: '1px solid #F0F0F0', display: 'flex', gap: 8 }}>
                <input
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                  placeholder="Reply… (Enter to send)"
                  style={{
                    flex: 1, padding: '8px 12px',
                    background: '#F7F7F7', border: '1px solid #E5E5E5',
                    borderRadius: 6, fontSize: 13, color: '#111111',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                />
                <button onClick={handleSendReply} style={{
                  padding: '8px 18px',
                  background: '#111111', color: '#ffffff',
                  border: 'none', borderRadius: 6,
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'opacity 0.12s',
                }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.8')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                >
                  Send
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: '#CCCCCC',
          }}>
            <Inbox size={40} strokeWidth={1} />
            <p style={{ marginTop: 12, fontSize: 14, margin: '12px 0 0' }}>Select a message to read</p>
          </div>
        ))}
      </div>

    </div>
  );
}
