'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { mockReservations, mockSupplierBookings, mockCostLines } from '@/lib/mock-data';
import { formatCurrency, formatDate, STATUS_CONFIG, PAYMENT_CONFIG, tripDuration } from '@/lib/utils';
import type { ReservationStatus, Currency, SupplierBookingConfStatus, SupplierBookingPayStatus, CostCategory } from '@/types';
import {
  Save, Plus, Trash2, RefreshCw, Printer, History,
  Share2, ChevronDown, HelpCircle, Send, FileText, MessageCircle,
  MapPin, Star, ChevronLeft,
  Upload, Paperclip, X, Download, Eye, FileImage, FileSpreadsheet, File,
  Lock, Send as SendIcon,
  BookOpen, FileCheck, Ticket, ClipboardList, ReceiptText,
  XCircle, UserCheck, Map, FileMinus, Calculator, Percent, Mail, Flag, Copy, PlusCircle,
  PenLine, CheckCircle, Clock, AlertCircle,
  CreditCard, Banknote, ArrowDownLeft, ArrowUpRight,
  Printer as PrinterIcon, TrendingUp,
} from 'lucide-react';

// ── Pipeline stages ───────────────────────────────────────────────────────────

const STAGES: { key: ReservationStatus; label: string }[] = [
  { key: 'enquiry',        label: 'Enquiry' },
  { key: 'under_review',   label: 'Under Review' },
  { key: 'confirmed',      label: 'Confirmed' },
  { key: 'invoice_sent',   label: 'Invoiced' },
  { key: 'paid',           label: 'Paid' },
  { key: 'trip_active',    label: 'Active' },
  { key: 'completed',      label: 'Completed' },
];
const STAGE_ORDER = STAGES.map(s => s.key);

// ── Styles ────────────────────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #CCCCCC',
  borderRadius: 2,
  marginBottom: 5,
  overflow: 'hidden',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
};

const sectionHeadStyle: React.CSSProperties = {
  background: '#EBEBEB',
  borderBottom: '1px solid #CCCCCC',
  padding: '5px 10px',
  fontSize: 11,
  fontWeight: 700,
  color: '#444444',
  letterSpacing: '0.015em',
  textTransform: 'uppercase' as const,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  borderBottom: '1px solid #F0F0F0',
  minHeight: 25,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#666666',
  width: 112,
  flexShrink: 0,
  padding: '3px 8px 3px 10px',
  display: 'flex',
  alignItems: 'center',
  gap: 3,
};

const valueStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#111111',
  flex: 1,
  padding: '3px 8px',
};

const inputStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#111111',
  flex: 1,
  padding: '1px 5px',
  border: '1px solid #BBBBBB',
  borderRadius: 2,
  background: '#FFFDE7',
  outline: 'none',
  fontFamily: 'inherit',
  height: 20,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const chargeRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '3px 10px',
  borderBottom: '1px solid #F0F0F0',
  minHeight: 23,
};

// ── Internal Notes Panel ──────────────────────────────────────────────────────

const CURRENT_STAFF = { name: 'Nimsha', initials: 'N', role: 'Admin' };

interface InternalNote {
  id: string;
  author: string;
  initials: string;
  role: string;
  text: string;
  at: string;
}

const SEED_INTERNAL_NOTES: InternalNote[] = [
  {
    id: 'in1', author: 'Nimsha', initials: 'N', role: 'Admin',
    text: 'Honeymoon couple — arrange rose petals & champagne on arrival. Coordinate with Galle Fort Hotel team.',
    at: '10 Feb 2026, 10:30',
  },
  {
    id: 'in2', author: 'Sarah', initials: 'S', role: 'Ops',
    text: 'Galle confirmed. Still awaiting Mirissa property — follow up with supplier by EOW.',
    at: '15 Mar 2026, 14:15',
  },
];

function now(): string {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    + ', ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function InternalNotesPanel() {
  const [notes,   setNotes]   = useState<InternalNote[]>(SEED_INTERNAL_NOTES);
  const [draft,   setDraft]   = useState('');
  const [posting, setPosting] = useState(false);
  const endRef   = useRef<HTMLDivElement>(null);
  const textRef  = useRef<HTMLTextAreaElement>(null);

  function post() {
    const text = draft.trim();
    if (!text) return;
    setNotes(n => [...n, {
      id:       Math.random().toString(36).slice(2),
      author:   CURRENT_STAFF.name,
      initials: CURRENT_STAFF.initials,
      role:     CURRENT_STAFF.role,
      text,
      at:       now(),
    }]);
    setDraft('');
    setPosting(false);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); post(); }
  }

  const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
    Admin: { bg: '#FDE68A', color: '#92680A' },
    Ops:   { bg: '#DBEAFE', color: '#1D4ED8' },
    Sales: { bg: '#D1FAE5', color: '#065F46' },
  };

  return (
    <div style={{
      background: '#FFFDF5',
      border: '1px solid #E8D48A',
      borderRadius: 3,
      marginBottom: 8,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(180,140,0,0.08)',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(to right, #FEF3C7, #FFF9E6)',
        borderBottom: '1px solid #E8D48A',
        padding: '6px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#78490A' }}>
          <Lock size={11} strokeWidth={2.5} color="#B45309" />
          Internal Notes
        </span>
        <span style={{ fontSize: 10, color: '#C8A44A' }}>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Notes thread */}
      <div style={{ maxHeight: 220, overflowY: 'auto', padding: '4px 0' }}>
        {notes.length === 0 && (
          <p style={{ padding: '16px 12px', fontSize: 12, color: '#CCBBAA', textAlign: 'center' }}>
            No internal notes yet.
          </p>
        )}
        {notes.map((note, i) => {
          const rc = ROLE_COLORS[note.role] ?? { bg: '#F3F4F6', color: '#555' };
          const isMe = note.author === CURRENT_STAFF.name;
          return (
            <div
              key={note.id}
              style={{
                padding: '8px 10px',
                borderBottom: i < notes.length - 1 ? '1px solid #FDE68A' : 'none',
                background: isMe ? '#FFFBEE' : '#FFFFFF',
              }}
            >
              {/* Author row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: isMe ? '#B45309' : '#6B7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: '#ffffff',
                }}>
                  {note.initials}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#333333' }}>{note.author}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
                  padding: '1px 5px', borderRadius: 3,
                  background: rc.bg, color: rc.color,
                }}>
                  {note.role}
                </span>
                {isMe && (
                  <span style={{ fontSize: 10, color: '#C8A44A', fontStyle: 'italic' }}>you</span>
                )}
                <span style={{ fontSize: 10, color: '#C8C8C8', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                  {note.at}
                </span>
              </div>
              {/* Text */}
              <p style={{
                fontSize: 12, color: '#444444', lineHeight: 1.55,
                paddingLeft: 27, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {note.text}
              </p>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Compose */}
      <div style={{
        borderTop: '1px solid #E8D48A',
        background: '#FFF9E6',
        padding: '7px 10px',
      }}>
        {!posting ? (
          <button
            onClick={() => { setPosting(true); setTimeout(() => textRef.current?.focus(), 50); }}
            style={{
              width: '100%', padding: '6px 10px', textAlign: 'left',
              border: '1px dashed #D4B44A', borderRadius: 3,
              background: 'none', fontSize: 12, color: '#C8A44A',
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'border-color 0.12s, color 0.12s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '#B45309';
              (e.currentTarget as HTMLElement).style.color = '#B45309';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '#D4B44A';
              (e.currentTarget as HTMLElement).style.color = '#C8A44A';
            }}
          >
            + Add internal note…
          </button>
        ) : (
          <>
            <textarea
              ref={textRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Write an internal note for staff…"
              rows={3}
              style={{
                width: '100%', resize: 'none',
                border: '1px solid #D4B44A', borderRadius: 3,
                fontSize: 12, color: '#333333', lineHeight: 1.55,
                padding: '6px 8px', fontFamily: 'inherit',
                background: '#FFFDF5', outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e  => (e.currentTarget.style.borderColor = '#B45309')}
              onBlur={e   => (e.currentTarget.style.borderColor = '#D4B44A')}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 10, color: '#C8C8C8' }}>
                ⌘ Enter to post · Esc to cancel
              </span>
              <div style={{ display: 'flex', gap: 5 }}>
                <button
                  onClick={() => { setPosting(false); setDraft(''); }}
                  style={{
                    padding: '3px 9px', border: '1px solid #D4B44A',
                    borderRadius: 2, background: 'none',
                    fontSize: 11, color: '#B45309', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={post}
                  disabled={!draft.trim()}
                  style={{
                    padding: '3px 10px', border: 'none', borderRadius: 2,
                    background: draft.trim() ? '#B45309' : '#E8D48A',
                    color: '#ffffff', fontSize: 11, fontWeight: 600,
                    cursor: draft.trim() ? 'pointer' : 'default',
                    fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <SendIcon size={10} strokeWidth={2} />
                  Post
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Document types config ─────────────────────────────────────────────────────

const DOC_TYPES = [
  { key: 'passport',     label: 'Passport',             color: '#1A6FC4', bg: '#EEF4FF' },
  { key: 'visa',         label: 'Visa',                 color: '#7C3AED', bg: '#F5F0FF' },
  { key: 'flight',       label: 'Flight Ticket',        color: '#0891B2', bg: '#F0FBFF' },
  { key: 'hotel',        label: 'Hotel Voucher',        color: '#059669', bg: '#ECFDF5' },
  { key: 'insurance',    label: 'Travel Insurance',     color: '#D97706', bg: '#FFFBEB' },
  { key: 'confirmation', label: 'Booking Confirmation', color: '#374151', bg: '#F3F4F6' },
  { key: 'other',        label: 'Other',                color: '#6B7280', bg: '#F9FAFB' },
] as const;

type DocTypeKey = (typeof DOC_TYPES)[number]['key'];

interface AttachedDoc {
  id: string;
  name: string;
  size: string;
  type: DocTypeKey;
  addedAt: string;
  ext: string;
}

function getFileIcon(ext: string) {
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return FileImage;
  if (['xls','xlsx','csv'].includes(ext))              return FileSpreadsheet;
  return File;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Mock pre-attached docs to show populated state
const SEED_DOCS: AttachedDoc[] = [
  { id: 'd1', name: 'passport_james_whitfield.pdf',   size: '1.2 MB', type: 'passport',     addedAt: '10 Feb 2026', ext: 'pdf'  },
  { id: 'd2', name: 'booking_confirmation_LE88432.pdf', size: '340 KB', type: 'confirmation', addedAt: '15 Mar 2026', ext: 'pdf'  },
  { id: 'd3', name: 'travel_insurance_policy.pdf',    size: '820 KB', type: 'insurance',    addedAt: '15 Mar 2026', ext: 'pdf'  },
];

function DocumentsSection() {
  const [docs,     setDocs]     = useState<AttachedDoc[]>(SEED_DOCS);
  const [dragOver, setDragOver] = useState(false);
  const [selType,  setSelType]  = useState<DocTypeKey>('other');
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList, type: DocTypeKey) => {
    const next: AttachedDoc[] = Array.from(files).map(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() ?? 'file';
      return {
        id:      Math.random().toString(36).slice(2),
        name:    f.name,
        size:    formatBytes(f.size),
        type,
        addedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        ext,
      };
    });
    setDocs(d => [...d, ...next]);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files, selType);
  }, [addFiles, selType]);

  const docTypeMap = Object.fromEntries(DOC_TYPES.map(d => [d.key, d])) as Record<DocTypeKey, typeof DOC_TYPES[number]>;

  return (
    <div style={sectionStyle}>
      <div style={{
        ...sectionHeadStyle,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Paperclip size={12} strokeWidth={2} color="#555" />
          Attach Documents
        </span>
        <span style={{ fontSize: 11, fontWeight: 400, color: '#888888' }}>
          {docs.length} file{docs.length !== 1 ? 's' : ''} attached
        </span>
      </div>

      <div style={{ padding: '10px' }}>

        {/* Document type selector */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          {DOC_TYPES.map(dt => (
            <button
              key={dt.key}
              onClick={() => setSelType(dt.key)}
              style={{
                padding: '3px 9px', borderRadius: 3, fontSize: 11,
                border: `1px solid ${selType === dt.key ? dt.color : '#D4D4D4'}`,
                background: selType === dt.key ? dt.bg : '#FAFAFA',
                color: selType === dt.key ? dt.color : '#666666',
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: selType === dt.key ? 600 : 400,
                transition: 'all 0.1s',
              }}
            >
              {dt.label}
            </button>
          ))}
        </div>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragOver ? '#1A6FC4' : '#CCCCCC'}`,
            borderRadius: 4,
            background: dragOver ? '#EEF4FF' : '#FAFAFA',
            padding: '18px 10px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
            marginBottom: docs.length > 0 ? 10 : 0,
          }}
        >
          <Upload size={20} color={dragOver ? '#1A6FC4' : '#CCCCCC'} strokeWidth={1.5} style={{ margin: '0 auto 6px' }} />
          <p style={{ fontSize: 12, color: dragOver ? '#1A6FC4' : '#666666', marginBottom: 3 }}>
            Drag &amp; drop files here, or <span style={{ color: '#1A6FC4', fontWeight: 600 }}>browse</span>
          </p>
          <p style={{ fontSize: 11, color: '#AAAAAA' }}>
            PDF, JPG, PNG, DOCX — max 20 MB each
          </p>
          <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
            Uploading as: <strong style={{ color: docTypeMap[selType].color }}>{docTypeMap[selType].label}</strong>
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files?.length) { addFiles(e.target.files, selType); e.target.value = ''; }}}
        />

        {/* Attached files list */}
        {docs.length > 0 && (
          <div style={{ border: '1px solid #E8E8E8', borderRadius: 3, overflow: 'hidden' }}>
            {/* List header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '24px 1fr 80px 90px 56px',
              padding: '4px 8px',
              background: '#F5F5F5',
              borderBottom: '1px solid #E8E8E8',
              gap: 6,
            }}>
              {['', 'File Name', 'Type', 'Added', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 600, color: '#888888', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>

            {docs.map((doc, i) => {
              const dt = docTypeMap[doc.type];
              const Icon = getFileIcon(doc.ext);
              return (
                <div
                  key={doc.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 1fr 80px 90px 56px',
                    padding: '6px 8px',
                    borderBottom: i < docs.length - 1 ? '1px solid #F0F0F0' : 'none',
                    alignItems: 'center',
                    gap: 6,
                    background: i % 2 === 0 ? '#ffffff' : '#FAFAFA',
                    transition: 'background 0.08s',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F0F6FF')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#ffffff' : '#FAFAFA')}
                >
                  {/* Icon */}
                  <Icon size={14} color="#888888" strokeWidth={1.5} />

                  {/* Name + size */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {doc.name}
                    </p>
                    <p style={{ fontSize: 10, color: '#AAAAAA', marginTop: 1 }}>{doc.size}</p>
                  </div>

                  {/* Type badge */}
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 7px',
                    borderRadius: 3,
                    background: dt.bg,
                    color: dt.color,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {dt.label}
                  </span>

                  {/* Date */}
                  <span style={{ fontSize: 11, color: '#888888', whiteSpace: 'nowrap' }}>{doc.addedAt}</span>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    <button
                      title="Preview"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#AAAAAA', display: 'flex' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#1A6FC4')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#AAAAAA')}
                    >
                      <Eye size={13} strokeWidth={1.8} />
                    </button>
                    <button
                      title="Download"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#AAAAAA', display: 'flex' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#059669')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#AAAAAA')}
                    >
                      <Download size={13} strokeWidth={1.8} />
                    </button>
                    <button
                      title="Remove"
                      onClick={() => setDocs(d => d.filter(x => x.id !== doc.id))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#AAAAAA', display: 'flex' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#DC2626')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#AAAAAA')}
                    >
                      <X size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={sectionStyle}>
      <div style={sectionHeadStyle}>{title}</div>
      {children}
    </div>
  );
}

function FR({
  label, value, required, highlight, mono, tag,
}: {
  label: string;
  value?: string | number | null;
  required?: boolean;
  highlight?: boolean;
  mono?: boolean;
  tag?: string;
}) {
  return (
    <div style={rowStyle}>
      <div style={labelStyle}>
        {required && <span style={{ color: '#CC3333', marginRight: 2, fontSize: 13 }}>*</span>}
        {label}
        {tag && <span style={{ fontSize: 10, color: '#999', marginLeft: 4, fontStyle: 'italic' }}>{tag}</span>}
      </div>
      <div style={{
        ...valueStyle,
        background: highlight ? '#FFFFCC' : undefined,
        fontVariantNumeric: mono ? 'tabular-nums' : undefined,
      }}>
        {value ?? <span style={{ color: '#CCCCCC' }}>—</span>}
      </div>
    </div>
  );
}

function FRSplit({
  left, right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid #EEEEEE' }}>
      <div style={{ flex: 1, borderRight: '1px solid #EEEEEE' }}>{left}</div>
      <div style={{ flex: 1 }}>{right}</div>
    </div>
  );
}

function InlineRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={rowStyle}>
      <div style={labelStyle}>
        {required && <span style={{ color: '#CC3333', marginRight: 2, fontSize: 13 }}>*</span>}
        {label}
      </div>
      <div style={{ flex: 1, padding: '3px 8px 3px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
        {children}
      </div>
    </div>
  );
}

function ChargeRow({ label, value, bold, large, color, sub }: {
  label: string; value: string; bold?: boolean; large?: boolean; color?: string; sub?: string;
}) {
  return (
    <div style={{ ...chargeRowStyle, background: bold ? '#F8F8F8' : undefined }}>
      <span style={{ fontSize: 12, color: '#555555', flex: 1 }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{
          fontSize: large ? 13 : 12,
          fontWeight: bold ? 700 : 500,
          color: color ?? '#111111',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {value}
        </span>
        {sub && <p style={{ fontSize: 10, color: '#AAAAAA', marginTop: 1 }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Messaging platforms ───────────────────────────────────────────────────────

const PLATFORMS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    color: '#ffffff',
    bg: '#25D366',
    border: '#1EB858',
    description: 'Send via WhatsApp',
    buildUrl: (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.532 5.856L.057 23.25a.75.75 0 0 0 .916.964l5.674-1.484A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.853 0-3.601-.5-5.112-1.374l-.366-.214-3.797.993.997-3.7-.233-.374A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
    ),
  },
  {
    id: 'telegram',
    name: 'Telegram',
    color: '#ffffff',
    bg: '#2CA5E0',
    border: '#1A94CF',
    description: 'Send via Telegram',
    buildUrl: (phone: string) => `https://t.me/${phone.replace(/\D/g, '')}`,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.01 9.471c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.873.75z"/>
      </svg>
    ),
  },
  {
    id: 'wechat',
    name: 'WeChat',
    color: '#ffffff',
    bg: '#07C160',
    border: '#06AD56',
    description: 'Send via WeChat',
    buildUrl: () => 'weixin://',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.113a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-3.99-6.348-7.597-6.348zm-2.66 3.268c.52 0 .943.424.943.945a.944.944 0 0 1-.943.944.944.944 0 0 1-.943-.944c0-.521.422-.945.943-.945zm5.32 0c.52 0 .942.424.942.945a.943.943 0 0 1-.942.944.944.944 0 0 1-.943-.944c0-.521.422-.945.943-.945zM15.27 9.6c-4.15 0-7.52 2.86-7.52 6.39 0 3.53 3.37 6.39 7.52 6.39.87 0 1.7-.12 2.48-.34a.74.74 0 0 1 .62.085l1.66.97a.28.28 0 0 0 .146.047.255.255 0 0 0 .254-.258c0-.063-.025-.118-.042-.186l-.34-1.293a.515.515 0 0 1 .186-.581A6.07 6.07 0 0 0 22.79 15.99c0-3.53-3.37-6.39-7.52-6.39zm-2.32 2.85c.455 0 .824.37.824.824a.824.824 0 0 1-.824.824.824.824 0 0 1-.825-.824c0-.455.37-.824.825-.824zm4.64 0c.455 0 .824.37.824.824a.824.824 0 0 1-.824.824.824.824 0 0 1-.824-.824c0-.455.37-.824.824-.824z"/>
      </svg>
    ),
  },
  {
    id: 'viber',
    name: 'Viber',
    color: '#ffffff',
    bg: '#7360F2',
    border: '#6250E0',
    description: 'Send via Viber',
    buildUrl: (phone: string) => `viber://chat?number=${phone.replace(/\D/g, '')}`,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.4 0C7.174.028 2.89 1.61.957 5.39-.107 7.515-.303 9.99.244 12.26c.547 2.291 1.912 4.372 3.746 5.934l.002 3.802a.803.803 0 0 0 1.37.569l2.656-2.765c1.085.3 2.21.459 3.336.459h.07c5.59 0 10.62-3.766 11.323-9.288.774-6.024-3.487-10.834-9.347-10.97zm.08 21.26h-.057c-1.094 0-2.185-.176-3.217-.522l-.307-.1-2.1 2.186-.002-3.056-.28-.232C3.79 18.13 2.52 16.265 2.01 14.161c-.51-2.1-.34-4.25.583-6.115C4.263 4.63 7.823 2.104 11.44 2.07h.055c4.898.116 8.563 4.163 7.932 8.86-.594 4.637-4.76 7.942-9.947 8.33z"/>
        <path d="M15.9 14.16c-.335-.194-.672-.393-1.01-.585a.842.842 0 0 0-.992.098l-.568.547c-.176.17-.44.198-.645.069-1.078-.67-2.01-1.55-2.752-2.593a.497.497 0 0 1 .057-.658l.555-.577a.838.838 0 0 0 .094-.998c-.196-.343-.397-.684-.595-1.026a.86.86 0 0 0-1.23-.277c-.502.358-.97.75-1.21 1.342-.33.82-.01 1.71.393 2.44 1.09 2.003 2.693 3.588 4.71 4.64.74.383 1.636.7 2.462.37.592-.237.984-.712 1.34-1.217a.862.862 0 0 0-.609-1.575z"/>
      </svg>
    ),
  },
  {
    id: 'signal',
    name: 'Signal',
    color: '#ffffff',
    bg: '#3A76F0',
    border: '#2966E0',
    description: 'Send via Signal',
    buildUrl: (phone: string) => `https://signal.me/#p/${phone.replace(/\D/g, '')}`,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0a12 12 0 1 0 0 24A12 12 0 0 0 12 0zm-.012 4.635c.55-.003 1.098.065 1.629.201l.485-1.808a.44.44 0 0 1 .543-.312l1.175.315a.44.44 0 0 1 .312.543l-.49 1.826a7.696 7.696 0 0 1 2.674 2.674l1.826-.49a.44.44 0 0 1 .543.312l.315 1.175a.44.44 0 0 1-.312.543l-1.808.485a7.72 7.72 0 0 1 0 3.262l1.808.485a.44.44 0 0 1 .312.543l-.315 1.175a.44.44 0 0 1-.543.312l-1.826-.49a7.696 7.696 0 0 1-2.674 2.674l.49 1.826a.44.44 0 0 1-.312.543l-1.175.315a.44.44 0 0 1-.543-.312l-.485-1.808a7.72 7.72 0 0 1-3.262 0l-.485 1.808a.44.44 0 0 1-.543.312l-1.175-.315a.44.44 0 0 1-.312-.543l.49-1.826A7.696 7.696 0 0 1 4.635 14.3l-1.826.49a.44.44 0 0 1-.543-.312L1.95 13.3a.44.44 0 0 1 .312-.543l1.808-.485a7.72 7.72 0 0 1 0-3.262L2.263 8.525a.44.44 0 0 1-.312-.543L2.266 6.807a.44.44 0 0 1 .543-.312l1.826.49A7.696 7.696 0 0 1 7.309 4.31L6.819 2.484a.44.44 0 0 1 .312-.543l1.175-.315a.44.44 0 0 1 .543.312l.485 1.808c.546-.074 1.1-.112 1.654-.111zm.024 3.73a3.636 3.636 0 1 0 0 7.271 3.636 3.636 0 0 0 0-7.272z"/>
      </svg>
    ),
  },
  {
    id: 'sms',
    name: 'SMS',
    color: '#ffffff',
    bg: '#555555',
    border: '#444444',
    description: 'Send an SMS',
    buildUrl: (phone: string) => `sms:${phone}`,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
] as const;

function MessageDropdown({ phone, onClose }: { phone: string; onClose: () => void }) {
  const cleanPhone = phone.replace(/\D/g, '');
  const hasPhone   = cleanPhone.length > 0;

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 4px)', left: 0,
      background: '#ffffff', border: '1px solid #D8D8D8',
      borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.13)',
      zIndex: 400, width: 240, overflow: 'hidden', padding: '6px 0',
    }}>
      <p style={{
        padding: '3px 12px 6px',
        fontSize: 10, fontWeight: 700, color: '#AAAAAA',
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        Message Customer
      </p>

      {!hasPhone && (
        <div style={{
          margin: '0 10px 6px',
          padding: '7px 10px',
          background: '#FFFBEB', border: '1px solid #FDE68A',
          borderRadius: 4, fontSize: 11, color: '#92400E',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <AlertCircle size={11} strokeWidth={2} style={{ flexShrink: 0 }} />
          No phone number on file
        </div>
      )}

      {PLATFORMS.map(platform => (
        <button
          key={platform.id}
          onClick={() => {
            const url = platform.buildUrl(phone);
            window.open(url, '_blank');
            onClose();
          }}
          style={{
            width: '100%', textAlign: 'left',
            padding: '7px 12px', border: 'none', background: 'none',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 10,
            transition: 'background 0.08s',
            opacity: !hasPhone && platform.id !== 'wechat' ? 0.45 : 1,
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F5F5F5'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
        >
          {/* Platform icon badge */}
          <div style={{
            width: 26, height: 26, borderRadius: 6, flexShrink: 0,
            background: platform.bg,
            border: `1px solid ${platform.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: platform.color,
          }}>
            {platform.icon}
          </div>

          {/* Label + description */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#111111', margin: 0 }}>{platform.name}</p>
            <p style={{ fontSize: 10, color: '#999999', margin: 0 }}>{platform.description}</p>
          </div>

          {/* Phone chip */}
          {hasPhone && (
            <span style={{
              fontSize: 10, color: '#999999',
              fontFamily: 'monospace', whiteSpace: 'nowrap',
            }}>
              {phone.length > 12 ? phone.slice(0, 12) + '…' : phone}
            </span>
          )}
        </button>
      ))}

      <div style={{ height: 1, background: '#F0F0F0', margin: '4px 0' }} />
      <button
        onClick={onClose}
        style={{
          width: '100%', textAlign: 'left', padding: '6px 12px',
          border: 'none', background: 'none',
          color: '#AAAAAA', fontSize: 11,
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 8,
          transition: 'background 0.08s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F5F5F5'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
      >
        <X size={11} strokeWidth={2} />
        Dismiss
      </button>
    </div>
  );
}

// ── Payments Tab ─────────────────────────────────────────────────────────────

type PaymentMethod = 'bank_transfer' | 'credit_card' | 'cash' | 'cheque' | 'online' | 'agent_settlement';
type TxType        = 'payment' | 'refund' | 'pre_auth' | 'deposit';
type TxStatus      = 'confirmed' | 'pending' | 'failed' | 'voided';

interface Transaction {
  id:       string;
  type:     TxType;
  date:     string;
  method:   PaymentMethod;
  reference:string;
  amount:   number;
  currency: string;
  status:   TxStatus;
  user:     string;
  memo:     string;
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer:    'Bank Transfer',
  credit_card:      'Credit Card',
  cash:             'Cash',
  cheque:           'Cheque',
  online:           'Online',
  agent_settlement: 'Agent Settlement',
};

const TX_TYPE_CONFIG: Record<TxType, { label: string; color: string; bg: string }> = {
  payment:  { label: 'Payment',       color: '#059669', bg: '#ECFDF5' },
  refund:   { label: 'Refund',        color: '#DC2626', bg: '#FEF2F2' },
  pre_auth: { label: 'Pre-Auth',      color: '#7C3AED', bg: '#F5F3FF' },
  deposit:  { label: 'Deposit',       color: '#1A6FC4', bg: '#EFF6FF' },
};

const TX_STATUS_CONFIG: Record<TxStatus, { label: string; color: string }> = {
  confirmed: { label: 'Confirmed', color: '#059669' },
  pending:   { label: 'Pending',   color: '#D97706' },
  failed:    { label: 'Failed',    color: '#DC2626' },
  voided:    { label: 'Voided',    color: '#9CA3AF' },
};

const SERVICE_LINES = [
  { key: 'accommodation', label: 'Accommodation',     pct: 0.55 },
  { key: 'transport',     label: 'Transportation',    pct: 0.20 },
  { key: 'activities',    label: 'Activities & Tours', pct: 0.15 },
  { key: 'guide',         label: 'Guide Fees',         pct: 0.00 },
  { key: 'misc',          label: 'Miscellaneous',      pct: 0.10 },
];

function buildSeedTransactions(total: number, paid: number, currency: string, ref: string): Transaction[] {
  if (paid === 0) return [];
  const txns: Transaction[] = [];
  if (paid >= total && total > 0) {
    txns.push({
      id: 'tx1', type: 'deposit', date: '2026-02-12', method: 'bank_transfer',
      reference: `${ref}-DEP-001`, amount: Math.round(total * 0.3),
      currency, status: 'confirmed', user: 'Nimsha', memo: 'Deposit — 30%',
    });
    txns.push({
      id: 'tx2', type: 'payment', date: '2026-03-20', method: 'bank_transfer',
      reference: `${ref}-PAY-002`, amount: total - Math.round(total * 0.3),
      currency, status: 'confirmed', user: 'Nimsha', memo: 'Balance payment',
    });
  } else if (paid > 0) {
    txns.push({
      id: 'tx1', type: 'deposit', date: '2026-02-14', method: 'bank_transfer',
      reference: `${ref}-DEP-001`, amount: paid,
      currency, status: 'confirmed', user: 'Nimsha', memo: 'Deposit received',
    });
  }
  return txns;
}

// ── Receipt Attachments ───────────────────────────────────────────────────────

interface Receipt {
  id:      string;
  name:    string;
  size:    string;
  ext:     string;
  addedAt: string;
  txRef:   string;
}

function ReceiptAttachments({ currency }: { currency: string }) {
  const [receipts,  setReceipts]  = useState<Receipt[]>([]);
  const [dragOver,  setDragOver]  = useState(false);
  const [txRef,     setTxRef]     = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList, ref: string) => {
    const next: Receipt[] = Array.from(files).map(f => ({
      id:      Math.random().toString(36).slice(2),
      name:    f.name,
      size:    formatBytes(f.size),
      ext:     f.name.split('.').pop()?.toLowerCase() ?? 'file',
      addedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      txRef:   ref.trim() || 'Unlinked',
    }));
    setReceipts(prev => [...prev, ...next]);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files, txRef);
  }, [addFiles, txRef]);

  return (
    <div style={{ background: '#ffffff', border: '1px solid #E0E0E0', borderRadius: 5, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        ...sectionHeadStyle,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Paperclip size={12} strokeWidth={2} color="#555" />
          Payment Receipts
        </span>
        <span style={{ fontSize: 11, fontWeight: 400, color: '#888888' }}>
          {receipts.length} file{receipts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ padding: '10px' }}>

        {/* Transaction reference input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: '#666666', whiteSpace: 'nowrap' }}>Link to Tx Ref:</label>
          <input
            type="text"
            value={txRef}
            onChange={e => setTxRef(e.target.value)}
            placeholder="e.g. SAM-2026-0041-PAY-001"
            style={{
              flex: 1, fontSize: 11, padding: '4px 7px',
              border: '1px solid #CCCCCC', borderRadius: 2,
              background: '#FAFAFA', outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.12s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
            onBlur={e  => (e.currentTarget.style.borderColor = '#CCCCCC')}
          />
        </div>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragOver ? '#1A6FC4' : '#CCCCCC'}`,
            borderRadius: 4,
            background: dragOver ? '#EEF4FF' : '#FAFAFA',
            padding: '14px 10px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
            marginBottom: receipts.length > 0 ? 10 : 0,
          }}
        >
          <Upload size={18} color={dragOver ? '#1A6FC4' : '#CCCCCC'} strokeWidth={1.5} style={{ margin: '0 auto 5px', display: 'block' }} />
          <p style={{ fontSize: 11, color: dragOver ? '#1A6FC4' : '#666666', margin: '0 0 2px' }}>
            Drag &amp; drop receipts, or <span style={{ color: '#1A6FC4', fontWeight: 600 }}>browse</span>
          </p>
          <p style={{ fontSize: 10, color: '#AAAAAA', margin: 0 }}>PDF, JPG, PNG — bank slips, wire confirmations, card receipts</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files?.length) { addFiles(e.target.files, txRef); e.target.value = ''; } }}
        />

        {/* Receipts list */}
        {receipts.length > 0 && (
          <div style={{ border: '1px solid #EEEEEE', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '20px 1fr 72px 76px 52px',
              padding: '4px 8px', background: '#F5F5F5',
              borderBottom: '1px solid #EEEEEE', gap: 6,
            }}>
              {['', 'File', 'Tx Ref', 'Added', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 600, color: '#888888', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>

            {receipts.map((rec, i) => {
              const Icon = getFileIcon(rec.ext);
              return (
                <div
                  key={rec.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '20px 1fr 72px 76px 52px',
                    padding: '6px 8px', gap: 6,
                    borderBottom: i < receipts.length - 1 ? '1px solid #F5F5F5' : 'none',
                    alignItems: 'center',
                    background: i % 2 === 0 ? '#ffffff' : '#FAFAFA',
                    transition: 'background 0.08s',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F0F6FF')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#ffffff' : '#FAFAFA')}
                >
                  <Icon size={13} color="#888888" strokeWidth={1.5} />

                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 500, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                      {rec.name}
                    </p>
                    <p style={{ fontSize: 10, color: '#AAAAAA', margin: 0 }}>{rec.size}</p>
                  </div>

                  <span style={{
                    fontSize: 10, color: '#1A6FC4', fontFamily: 'monospace',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {rec.txRef}
                  </span>

                  <span style={{ fontSize: 10, color: '#888888', whiteSpace: 'nowrap' }}>{rec.addedAt}</span>

                  <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end' }}>
                    <button
                      title="Download"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#CCCCCC', display: 'flex' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#059669')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#CCCCCC')}
                    >
                      <Download size={12} strokeWidth={1.8} />
                    </button>
                    <button
                      title="Remove"
                      onClick={() => setReceipts(prev => prev.filter(x => x.id !== rec.id))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#CCCCCC', display: 'flex' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#DC2626')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#CCCCCC')}
                    >
                      <X size={12} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Supplier Bookings Tab ─────────────────────────────────────────────────────

const CONF_CFG: Record<SupplierBookingConfStatus, { label: string; color: string; bg: string }> = {
  on_request: { label: 'On Request', color: '#92400E', bg: '#FEF3C7' },
  confirmed:  { label: 'Confirmed',  color: '#065F46', bg: '#D1FAE5' },
  cancelled:  { label: 'Cancelled',  color: '#991B1B', bg: '#FEE2E2' },
};

const PAY_CFG: Record<SupplierBookingPayStatus, { label: string; color: string; bg: string }> = {
  unpaid:       { label: 'Unpaid',        color: '#991B1B', bg: '#FEE2E2' },
  deposit_paid: { label: 'Deposit Paid',  color: '#92400E', bg: '#FEF3C7' },
  fully_paid:   { label: 'Fully Paid',    color: '#065F46', bg: '#D1FAE5' },
};

const SVC_LABEL: Record<string, string> = {
  room: 'Room', transfer: 'Transfer', activity: 'Activity', meal: 'Meal', guide: 'Guide',
};

function SupplierBookingsTab({ reservationId, currency }: { reservationId: string; currency: string }) {
  const bookings = mockSupplierBookings.filter(b => b.reservation_id === reservationId);
  const fmt = (n: number) => formatCurrency(n, currency as Currency);

  const confirmed   = bookings.filter(b => b.confirmation_status === 'confirmed').length;
  const onRequest   = bookings.filter(b => b.confirmation_status === 'on_request').length;
  const unpaidTotal = bookings.filter(b => b.payment_status === 'unpaid').reduce((s, b) => s + b.supplier_cost, 0);
  const totalCost   = bookings.reduce((s, b) => s + b.supplier_cost, 0);

  if (bookings.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: '#AAAAAA', fontSize: 13 }}>
        No supplier bookings recorded for this reservation.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total Bookings',  value: String(bookings.length), sub: 'service items',     color: '#1A6FC4', bg: '#EFF6FF' },
          { label: 'Confirmed',       value: String(confirmed),       sub: `${onRequest} on request`, color: '#065F46', bg: '#F0FDF4' },
          { label: 'Total Cost',      value: fmt(totalCost),          sub: 'supplier cost',     color: '#6D28D9', bg: '#F5F3FF' },
          { label: 'Outstanding',     value: fmt(unpaidTotal),        sub: 'unpaid to suppliers', color: unpaidTotal > 0 ? '#991B1B' : '#065F46', bg: unpaidTotal > 0 ? '#FFF1F2' : '#F0FDF4' },
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} style={{ background: '#ffffff', border: '1px solid #E8E8E8', borderRadius: 6, padding: '12px 14px', borderLeft: `3px solid ${color}` }}>
            <p style={{ fontSize: 11, color: '#888888', marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 11, color: '#AAAAAA', marginTop: 4 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#ffffff', border: '1px solid #E8E8E8', borderRadius: 6, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['#', 'Supplier', 'Type', 'Date', 'Description', 'Pax', 'Conf. Status', 'Ref', 'Cost', 'Payment', 'Due Date'].map((h, i) => (
                <th key={h} style={{
                  padding: '7px 10px', textAlign: i === 0 || i === 5 ? 'center' : 'left',
                  fontSize: 11, fontWeight: 600, color: '#888888',
                  borderBottom: '1px solid #E5E5E5', background: '#F5F5F5', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map((b, i) => {
              const conf = CONF_CFG[b.confirmation_status];
              const pay  = PAY_CFG[b.payment_status];
              return (
                <tr key={b.id} style={{ borderBottom: '1px solid #F3F3F3' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#FAFBFF')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#CCCCCC', fontSize: 11 }}>{i + 1}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <p style={{ fontWeight: 600, color: '#111111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{b.supplier_name}</p>
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: '#F3F4F6', color: '#374151' }}>
                      {SVC_LABEL[b.service_type]}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', color: '#555555', whiteSpace: 'nowrap', fontSize: 11 }}>
                    {formatDate(b.service_date)}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#555555', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.service_description}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#555555' }}>{b.pax_adults}</td>
                  <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: conf.bg, color: conf.color }}>
                      {conf.label}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11, color: b.confirmation_ref ? '#555555' : '#CCCCCC' }}>
                    {b.confirmation_ref ?? '—'}
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: '#111111', whiteSpace: 'nowrap' }}>
                    {fmt(b.supplier_cost)}
                  </td>
                  <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: pay.bg, color: pay.color }}>
                      {pay.label}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', fontSize: 11, color: b.payment_due_date ? '#555555' : '#CCCCCC', whiteSpace: 'nowrap' }}>
                    {b.payment_due_date ? formatDate(b.payment_due_date) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #E5E5E5' }}>
              <td colSpan={8} style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#555555' }}>Total Supplier Cost</td>
              <td style={{ padding: '8px 10px', fontWeight: 700, color: '#111111', whiteSpace: 'nowrap' }}>{fmt(totalCost)}</td>
              <td colSpan={2} style={{ padding: '8px 10px', fontSize: 11, color: '#AAAAAA' }}>
                {bookings.filter(b => b.payment_status === 'unpaid').length} items unpaid
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Cost & Margin Tab ─────────────────────────────────────────────────────────

const COST_CATEGORY_CFG: Record<CostCategory, { label: string; color: string; bg: string }> = {
  accommodation: { label: 'Accommodation', color: '#1D4ED8', bg: '#DBEAFE' },
  transport:     { label: 'Transport',     color: '#6D28D9', bg: '#EDE9FE' },
  guide:         { label: 'Guide',         color: '#92400E', bg: '#FEF3C7' },
  activity:      { label: 'Activity',      color: '#065F46', bg: '#D1FAE5' },
  meal:          { label: 'Meal',          color: '#9D174D', bg: '#FCE7F3' },
  visa:          { label: 'Visa',          color: '#0E7490', bg: '#CFFAFE' },
  insurance:     { label: 'Insurance',     color: '#374151', bg: '#F3F4F6' },
  misc:          { label: 'Misc',          color: '#6B7280', bg: '#F9FAFB' },
};

const CATEGORY_ORDER: CostCategory[] = ['accommodation', 'transport', 'activity', 'meal', 'guide', 'visa', 'insurance', 'misc'];

function CostingTab({ reservationId, totalCost, commission, currency }: {
  reservationId: string; totalCost: number; commission: number; currency: string;
}) {
  const lines  = mockCostLines.filter(l => l.reservation_id === reservationId);
  const cur    = currency as Currency;
  const fmt    = (n: number) => formatCurrency(n, cur);

  const supplierCost  = lines.reduce((s, l) => s + l.unit_cost * l.quantity, 0);
  const sellTotal     = lines.reduce((s, l) => s + l.unit_sell * l.quantity, 0);
  const grossProfit   = sellTotal - supplierCost;
  const grossMargin   = sellTotal > 0 ? (grossProfit / sellTotal) * 100 : 0;
  const netMargin     = grossProfit - commission;
  const netMarginPct  = sellTotal > 0 ? (netMargin / sellTotal) * 100 : 0;

  if (lines.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: '#AAAAAA', fontSize: 13 }}>
        No cost lines recorded for this reservation.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Supplier Cost',  value: fmt(supplierCost), sub: `${lines.length} line items`,        color: '#991B1B', bg: '#FFF1F2' },
          { label: 'Sell Price',     value: fmt(sellTotal),    sub: `Quoted: ${fmt(totalCost)}`,          color: '#065F46', bg: '#F0FDF4' },
          { label: 'Gross Profit',   value: fmt(grossProfit),  sub: `${grossMargin.toFixed(1)}% margin`,  color: '#1A6FC4', bg: '#EFF6FF' },
          { label: 'Net Margin',     value: fmt(netMargin),    sub: `After ${fmt(commission)} commission`, color: netMargin >= 0 ? '#6D28D9' : '#991B1B', bg: netMargin >= 0 ? '#F5F3FF' : '#FFF1F2' },
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} style={{ background: '#ffffff', border: '1px solid #E8E8E8', borderRadius: 6, padding: '12px 14px', borderLeft: `3px solid ${color}` }}>
            <p style={{ fontSize: 11, color: '#888888', marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 11, color: '#AAAAAA', marginTop: 4 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Cost lines grouped by category */}
      <div style={{ background: '#ffffff', border: '1px solid #E8E8E8', borderRadius: 6, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['Category', 'Description', 'Supplier', 'Date', 'Pax', 'Unit Cost', 'Unit Sell', 'Qty', 'Markup', 'Total Cost', 'Total Sell'].map((h, i) => (
                <th key={h} style={{
                  padding: '7px 10px',
                  textAlign: ['Pax', 'Qty', 'Markup', 'Unit Cost', 'Unit Sell', 'Total Cost', 'Total Sell'].includes(h) ? 'right' : 'left',
                  fontSize: 11, fontWeight: 600, color: '#888888',
                  borderBottom: '1px solid #E5E5E5', background: '#F5F5F5', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORY_ORDER.map(cat => {
              const catLines = lines.filter(l => l.category === cat);
              if (catLines.length === 0) return null;
              const cfg = COST_CATEGORY_CFG[cat];
              const catCost = catLines.reduce((s, l) => s + l.unit_cost * l.quantity, 0);
              const catSell = catLines.reduce((s, l) => s + l.unit_sell * l.quantity, 0);
              return (
                <>
                  {/* Category sub-header */}
                  <tr key={`${cat}-header`} style={{ background: '#FAFAFA' }}>
                    <td colSpan={11} style={{ padding: '5px 10px', borderBottom: '1px solid #F0F0F0', borderTop: '1px solid #E8E8E8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: cfg.color }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
                          {cfg.label.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 11, color: '#888888' }}>
                          Cost {fmt(catCost)} · Sell {catSell > 0 ? fmt(catSell) : '(incl.)'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {/* Lines */}
                  {catLines.map(l => {
                    const lineCost   = l.unit_cost * l.quantity;
                    const lineSell   = l.unit_sell * l.quantity;
                    const markup     = l.unit_cost > 0 && l.unit_sell > 0 ? ((l.unit_sell - l.unit_cost) / l.unit_cost) * 100 : null;
                    return (
                      <tr key={l.id} style={{ borderBottom: '1px solid #F5F5F5' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#FAFBFF')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                      >
                        <td style={{ padding: '7px 10px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                        </td>
                        <td style={{ padding: '7px 10px', color: '#111111', fontWeight: 500 }}>
                          {l.description}
                          {l.included_in_package && (
                            <span style={{ marginLeft: 6, fontSize: 10, color: '#6D28D9', fontWeight: 600 }}>(incl.)</span>
                          )}
                        </td>
                        <td style={{ padding: '7px 10px', color: '#777777', fontSize: 11, whiteSpace: 'nowrap' }}>{l.supplier_name}</td>
                        <td style={{ padding: '7px 10px', color: '#777777', fontSize: 11, whiteSpace: 'nowrap' }}>{l.date ? formatDate(l.date) : '—'}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#555555' }}>{l.pax}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#555555', fontFamily: 'monospace', fontSize: 11 }}>
                          {l.unit_cost > 0 ? fmt(l.unit_cost) : '—'}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#555555', fontFamily: 'monospace', fontSize: 11 }}>
                          {l.included_in_package ? <span style={{ color: '#AAAAAA' }}>incl.</span> : l.unit_sell > 0 ? fmt(l.unit_sell) : '—'}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#555555' }}>{l.quantity}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                          {markup !== null ? (
                            <span style={{ fontSize: 11, fontWeight: 600, color: markup >= 30 ? '#059669' : markup >= 15 ? '#D97706' : '#DC2626' }}>
                              {markup.toFixed(0)}%
                            </span>
                          ) : <span style={{ color: '#CCCCCC' }}>—</span>}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#111111', fontFamily: 'monospace', fontSize: 11 }}>
                          {lineCost > 0 ? fmt(lineCost) : '—'}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: l.included_in_package ? '#AAAAAA' : '#059669', fontFamily: 'monospace', fontSize: 11 }}>
                          {l.included_in_package ? <span style={{ color: '#AAAAAA' }}>incl.</span> : lineSell > 0 ? fmt(lineSell) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #E0E0E0', background: '#F9F9F9' }}>
              <td colSpan={9} style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#555555', fontSize: 12 }}>Subtotal</td>
              <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#991B1B', fontFamily: 'monospace', fontSize: 12 }}>{fmt(supplierCost)}</td>
              <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#059669', fontFamily: 'monospace', fontSize: 12 }}>{fmt(sellTotal)}</td>
            </tr>
            <tr style={{ background: '#F9F9F9' }}>
              <td colSpan={9} style={{ padding: '6px 10px', textAlign: 'right', fontSize: 11, color: '#888888' }}>
                Partner Commission Payable
              </td>
              <td colSpan={2} style={{ padding: '6px 10px', textAlign: 'right', fontSize: 11, color: '#888888', fontFamily: 'monospace' }}>
                ({fmt(commission)})
              </td>
            </tr>
            <tr style={{ borderTop: '1px solid #E0E0E0', background: '#F0F0F0' }}>
              <td colSpan={9} style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#111111', fontSize: 12 }}>
                Net Margin
              </td>
              <td colSpan={2} style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, fontSize: 13, fontFamily: 'monospace', color: netMargin >= 0 ? '#6D28D9' : '#DC2626' }}>
                {fmt(netMargin)} <span style={{ fontSize: 10, fontWeight: 600 }}>({netMarginPct.toFixed(1)}%)</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function PaymentsTab({ r }: { r: { reference: string; total_cost: number; total_paid: number; currency: string; commission_amount: number; payment_status: string; client?: { full_name?: string; email?: string } | null; partner?: { company_name: string; commission_rate: number } | null; payments?: Array<{ id: string; paid_at?: string; method: string; reference?: string; amount: number; currency: string; status: string; notes?: string }> | null } }) {
  const total   = r.total_cost;
  const paid    = r.total_paid;
  const balance = total - paid;
  const pct     = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const cur     = r.currency as Currency;

  const statusCfg =
    balance <= 0 && total > 0 ? { label: 'Fully Paid',     color: '#059669', bg: '#DCFCE7', border: '#86EFAC' } :
    paid > 0                  ? { label: 'Partially Paid',  color: '#D97706', bg: '#FEF9C3', border: '#FDE68A' } :
                                { label: 'Unpaid',          color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' };

  const [txns,       setTxns]       = useState<Transaction[]>(() => buildSeedTransactions(total, paid, cur, r.reference));
  const [showForm,   setShowForm]   = useState(false);
  const [formType,   setFormType]   = useState<TxType>('payment');
  const [formMethod, setFormMethod] = useState<PaymentMethod>('bank_transfer');
  const [formAmount, setFormAmount] = useState('');
  const [formRef,    setFormRef]    = useState('');
  const [formMemo,   setFormMemo]   = useState('');
  const [formDate,   setFormDate]   = useState(new Date().toISOString().slice(0, 10));
  const [memo,       setMemo]       = useState('');

  const totalTxPaid = txns.filter(t => t.status === 'confirmed' && (t.type === 'payment' || t.type === 'deposit')).reduce((s, t) => s + t.amount, 0);
  const totalRefund = txns.filter(t => t.status === 'confirmed' && t.type === 'refund').reduce((s, t) => s + t.amount, 0);

  function saveTransaction() {
    const amt = parseFloat(formAmount);
    if (!amt || isNaN(amt)) return;
    const next: Transaction = {
      id:        Math.random().toString(36).slice(2),
      type:      formType,
      date:      formDate,
      method:    formMethod,
      reference: formRef || `${r.reference}-TX-${String(txns.length + 1).padStart(3, '0')}`,
      amount:    amt,
      currency:  cur,
      status:    'confirmed',
      user:      'Nimsha',
      memo:      formMemo,
    };
    setTxns(prev => [...prev, next]);
    setShowForm(false);
    setFormAmount(''); setFormRef(''); setFormMemo('');
    setFormDate(new Date().toISOString().slice(0, 10));
  }

  function removeTransaction(id: string) {
    setTxns(prev => prev.map(t => t.id === id ? { ...t, status: 'voided' as TxStatus } : t));
  }

  const fmt = (v: number) => formatCurrency(v, cur);

  return (
    <div style={{ maxWidth: 1020, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { label: 'Total Cost',   value: fmt(total),   color: '#111111', icon: <TrendingUp size={15} strokeWidth={1.8} color="#6B7280" /> },
          { label: 'Total Paid',   value: fmt(paid),    color: '#059669', icon: <CheckCircle size={15} strokeWidth={1.8} color="#059669" /> },
          { label: 'Balance Due',  value: fmt(balance < 0 ? 0 : balance), color: balance > 0 ? '#D97706' : '#059669', icon: <Clock size={15} strokeWidth={1.8} color={balance > 0 ? '#D97706' : '#059669'} /> },
          { label: 'Commission',   value: fmt(r.commission_amount), color: '#7C3AED', icon: <Percent size={15} strokeWidth={1.8} color="#7C3AED" /> },
        ].map(card => (
          <div key={card.label} style={{
            background: '#ffffff', border: '1px solid #E0E0E0', borderRadius: 5,
            padding: '10px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#888888', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{card.label}</span>
              {card.icon}
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: card.color, fontVariantNumeric: 'tabular-nums', margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Status + progress bar ── */}
      <div style={{
        background: '#ffffff', border: '1px solid #E0E0E0', borderRadius: 5, padding: '10px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 3,
              background: statusCfg.bg, color: statusCfg.color,
              border: `1px solid ${statusCfg.border}`,
            }}>
              {statusCfg.label}
            </span>
            <span style={{ fontSize: 11, color: '#888888' }}>
              {pct}% of {fmt(total)} collected
            </span>
          </div>
          <span style={{ fontSize: 11, color: '#888888', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(paid)} paid · {fmt(balance > 0 ? balance : 0)} due
          </span>
        </div>
        <div style={{ height: 7, background: '#E8E8E8', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4,
            width: `${pct}%`,
            background: pct >= 100 ? '#059669' : pct >= 50 ? '#1A6FC4' : '#D97706',
            transition: 'width 0.4s',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>

        {/* ── Left: service billing + transactions ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Service billing breakdown */}
          <div style={{ background: '#ffffff', border: '1px solid #E0E0E0', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ ...sectionHeadStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Service Billing Breakdown</span>
              <span style={{ fontSize: 11, fontWeight: 400, color: '#888888' }}>{cur}</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F8F8F8', borderBottom: '1px solid #EEEEEE' }}>
                  {['Service', 'Description', 'Amount', '%'].map(h => (
                    <th key={h} style={{ padding: '6px 12px', textAlign: h === 'Amount' || h === '%' ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: '#888888', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SERVICE_LINES.map((s, i) => {
                  const amt = total > 0 ? Math.round(total * s.pct) : 0;
                  const last = i === SERVICE_LINES.length - 1;
                  return (
                    <tr key={s.key} style={{ borderBottom: last ? 'none' : '1px solid #F5F5F5' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500, color: '#222222' }}>
                        {s.label}
                      </td>
                      <td style={{ padding: '8px 12px', color: '#888888', fontSize: 11 }}>Standard DMC package</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: amt > 0 ? '#111111' : '#CCCCCC' }}>
                        {amt > 0 ? fmt(amt) : '—'}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#888888', fontSize: 11 }}>
                        {s.pct > 0 ? `${s.pct * 100}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr style={{ borderTop: '2px solid #E0E0E0', background: '#F8F8F8' }}>
                  <td colSpan={2} style={{ padding: '8px 12px', fontWeight: 700, color: '#111111', fontSize: 12 }}>Total</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#111111', fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#111111' }}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Transaction toolbar */}
          <div style={{
            background: '#ffffff', border: '1px solid #E0E0E0', borderRadius: 5, overflow: 'hidden',
          }}>
            <div style={{
              ...sectionHeadStyle,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>Payment Transactions</span>
              <div style={{ display: 'flex', gap: 5 }}>
                {/* Invoice download */}
                <button
                  style={{ ...txBtnStyle }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F0F0F0'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                >
                  <Download size={11} strokeWidth={2} /> Invoice
                </button>
                <button
                  style={{ ...txBtnStyle }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F0F0F0'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                >
                  <PrinterIcon size={11} strokeWidth={2} /> Print
                </button>
              </div>
            </div>

            {/* Action row */}
            <div style={{
              padding: '7px 10px', borderBottom: '1px solid #EEEEEE',
              display: 'flex', alignItems: 'center', gap: 5, background: '#FAFAFA',
            }}>
              <button
                onClick={() => { setFormType('payment'); setShowForm(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 3, border: '1px solid #1A6FC4',
                  background: '#1A6FC4', color: '#ffffff',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <Plus size={11} strokeWidth={2.5} /> Record Payment
              </button>
              <button
                onClick={() => { setFormType('deposit'); setShowForm(true); }}
                style={{ ...txBtnStyle, border: '1px solid #D5D5D5' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F0F0F0'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
              >
                <ArrowDownLeft size={11} strokeWidth={2} /> Deposit
              </button>
              <button
                onClick={() => { setFormType('refund'); setShowForm(true); }}
                style={{ ...txBtnStyle, border: '1px solid #D5D5D5' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FFF5F5'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
              >
                <ArrowUpRight size={11} strokeWidth={2} /> Refund
              </button>
              <button
                onClick={() => { setFormType('pre_auth'); setShowForm(true); }}
                style={{ ...txBtnStyle, border: '1px solid #D5D5D5' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F0F0F0'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
              >
                <CreditCard size={11} strokeWidth={2} /> Pre-Auth
              </button>
            </div>

            {/* Record payment inline form */}
            {showForm && (
              <div style={{
                padding: '12px', borderBottom: '1px solid #EEEEEE',
                background: '#F0F6FF',
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#1A6FC4', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {TX_TYPE_CONFIG[formType].label} — {cur}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <label style={formLbl}>Date</label>
                    <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} style={formInp}
                      onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                      onBlur={e  => (e.currentTarget.style.borderColor = '#CCCCCC')} />
                  </div>
                  <div>
                    <label style={formLbl}>Amount ({cur}) *</label>
                    <input type="number" min="0" step="0.01" value={formAmount} onChange={e => setFormAmount(e.target.value)}
                      placeholder="0.00" style={formInp}
                      onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                      onBlur={e  => (e.currentTarget.style.borderColor = '#CCCCCC')} />
                  </div>
                  <div>
                    <label style={formLbl}>Payment Method</label>
                    <select value={formMethod} onChange={e => setFormMethod(e.target.value as PaymentMethod)} style={formInp}
                      onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                      onBlur={e  => (e.currentTarget.style.borderColor = '#CCCCCC')}>
                      {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map(m => (
                        <option key={m} value={m}>{METHOD_LABELS[m]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <label style={formLbl}>Reference No.</label>
                    <input type="text" value={formRef} onChange={e => setFormRef(e.target.value)}
                      placeholder="e.g. TT-20260412" style={formInp}
                      onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                      onBlur={e  => (e.currentTarget.style.borderColor = '#CCCCCC')} />
                  </div>
                  <div>
                    <label style={formLbl}>Memo / Notes</label>
                    <input type="text" value={formMemo} onChange={e => setFormMemo(e.target.value)}
                      placeholder="Optional note" style={formInp}
                      onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                      onBlur={e  => (e.currentTarget.style.borderColor = '#CCCCCC')} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={saveTransaction}
                    disabled={!formAmount}
                    style={{
                      padding: '5px 14px', border: 'none', borderRadius: 3,
                      background: formAmount ? '#1A6FC4' : '#C8D8E8',
                      color: '#ffffff', fontSize: 11, fontWeight: 600,
                      cursor: formAmount ? 'pointer' : 'default', fontFamily: 'inherit',
                    }}
                  >
                    Save {TX_TYPE_CONFIG[formType].label}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    style={{
                      padding: '5px 12px', border: '1px solid #CCCCCC', borderRadius: 3,
                      background: 'none', color: '#555555', fontSize: 11,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Transaction table */}
            {txns.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F5F5F5', borderBottom: '1px solid #E8E8E8' }}>
                    {['#', 'Type', 'Date', 'Method', 'Reference', 'Amount', 'Status', 'User', ''].map((h, i) => (
                      <th key={i} style={{
                        padding: '6px 10px', textAlign: h === 'Amount' ? 'right' : 'left',
                        fontSize: 10, fontWeight: 700, color: '#888888',
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txns.map((tx, i) => {
                    const typeCfg   = TX_TYPE_CONFIG[tx.type];
                    const statusCfg = TX_STATUS_CONFIG[tx.status];
                    const isVoided  = tx.status === 'voided';
                    return (
                      <tr
                        key={tx.id}
                        style={{
                          borderBottom: '1px solid #F0F0F0',
                          background: isVoided ? '#FAFAFA' : i % 2 === 0 ? '#ffffff' : '#FCFCFC',
                          opacity: isVoided ? 0.5 : 1,
                        }}
                      >
                        <td style={{ padding: '8px 10px', color: '#BBBBBB', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3,
                            background: typeCfg.bg, color: typeCfg.color,
                          }}>
                            {typeCfg.label}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#444444', whiteSpace: 'nowrap' }}>{tx.date}</td>
                        <td style={{ padding: '8px 10px', color: '#555555', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {tx.method === 'bank_transfer' || tx.method === 'online' ? <Banknote size={12} color="#888" strokeWidth={1.8} /> : <CreditCard size={12} color="#888" strokeWidth={1.8} />}
                            {METHOD_LABELS[tx.method]}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#333333', fontSize: 11 }}>{tx.reference}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: tx.type === 'refund' ? '#DC2626' : '#111111' }}>
                          {tx.type === 'refund' ? '−' : ''}{fmt(tx.amount)}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: statusCfg.color }}>{statusCfg.label}</span>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#777777', fontSize: 11 }}>{tx.user}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                          {!isVoided && (
                            <button
                              onClick={() => removeTransaction(tx.id)}
                              title="Void transaction"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CCCCCC', display: 'flex', padding: 2 }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#DC2626'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#CCCCCC'}
                            >
                              <X size={12} strokeWidth={2} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals footer */}
                <tfoot>
                  <tr style={{ borderTop: '2px solid #E0E0E0', background: '#F8F8F8' }}>
                    <td colSpan={5} style={{ padding: '8px 10px', fontSize: 11, color: '#666666', fontWeight: 600 }}>
                      {txns.filter(t => t.status !== 'voided').length} transaction{txns.filter(t => t.status !== 'voided').length !== 1 ? 's' : ''}
                      {totalRefund > 0 && <span style={{ marginLeft: 8, color: '#DC2626' }}>· Refunds: {fmt(totalRefund)}</span>}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(totalTxPaid)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#CCCCCC', fontSize: 12 }}>
                <Banknote size={32} strokeWidth={1} color="#E0E0E0" style={{ margin: '0 auto 10px', display: 'block' }} />
                No payment transactions recorded yet.
              </div>
            )}
          </div>

          {/* Memo */}
          <div style={{ background: '#ffffff', border: '1px solid #E0E0E0', borderRadius: 5, overflow: 'hidden' }}>
            <div style={sectionHeadStyle}>Payment Memo</div>
            <div style={{ padding: '8px 10px' }}>
              <textarea
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="Add a memo or payment instruction visible to finance team…"
                rows={3}
                style={{
                  width: '100%', resize: 'vertical',
                  border: '1px solid #CCCCCC', borderRadius: 2,
                  fontSize: 12, color: '#333333', lineHeight: 1.7,
                  padding: '6px 8px', fontFamily: 'inherit',
                  background: '#FFFFF8', outline: 'none',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                onBlur={e  => (e.currentTarget.style.borderColor = '#CCCCCC')}
              />
            </div>
          </div>

          {/* Receipt attachments */}
          <ReceiptAttachments currency={cur} />
        </div>

        {/* ── Right: billing panel ── */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Payment schedule */}
          <div style={{ background: '#ffffff', border: '1px solid #E0E0E0', borderRadius: 5, overflow: 'hidden' }}>
            <div style={sectionHeadStyle}>Payment Schedule</div>
            {[
              { label: 'Deposit (30%)',     amt: Math.round(total * 0.30), due: 'On Booking',  done: paid >= Math.round(total * 0.30) },
              { label: 'Mid-trip (40%)',    amt: Math.round(total * 0.40), due: '30 days prior', done: paid >= Math.round(total * 0.70) },
              { label: 'Balance (30%)',     amt: Math.round(total * 0.30), due: '7 days prior',  done: paid >= total },
            ].map((row, i) => (
              <div key={i} style={{
                padding: '8px 10px', borderBottom: i < 2 ? '1px solid #F0F0F0' : 'none',
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                  background: row.done ? '#059669' : '#E8E8E8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {row.done && <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#222222', margin: 0 }}>{row.label}</p>
                  <p style={{ fontSize: 10, color: '#AAAAAA', margin: 0 }}>{row.due}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: row.done ? '#059669' : '#888888', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(row.amt)}
                </span>
              </div>
            ))}
          </div>

          {/* Agent commission */}
          {r.partner && (
            <div style={{ background: '#ffffff', border: '1px solid #E0E0E0', borderRadius: 5, overflow: 'hidden' }}>
              <div style={sectionHeadStyle}>Agent Commission</div>
              <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#666666' }}>Agent</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#111111' }}>{r.partner.company_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#666666' }}>Rate</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#111111' }}>{r.partner.commission_rate}%</span>
                </div>
                <div style={{ height: 1, background: '#F0F0F0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#666666' }}>Commission</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.commission_amount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick invoice actions */}
          <div style={{ background: '#ffffff', border: '1px solid #E0E0E0', borderRadius: 5, overflow: 'hidden' }}>
            <div style={sectionHeadStyle}>Invoice &amp; Documents</div>
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { label: 'Download Invoice',      icon: <Download size={11} strokeWidth={2} /> },
                { label: 'Download Receipt',      icon: <Download size={11} strokeWidth={2} /> },
                { label: 'Print Invoice',         icon: <PrinterIcon size={11} strokeWidth={2} /> },
                { label: 'Send Invoice by Email', icon: <Send size={11} strokeWidth={2} /> },
                { label: 'Send Receipt',          icon: <Send size={11} strokeWidth={2} /> },
              ].map(({ label, icon }) => (
                <button
                  key={label}
                  style={{
                    textAlign: 'left', padding: '5px 8px',
                    background: 'none', border: '1px solid #E0E0E0',
                    borderRadius: 3, fontSize: 11, color: '#1A6FC4',
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#EEF4FF'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                >
                  <span style={{ color: '#888888' }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const txBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4,
  padding: '3px 8px', borderRadius: 3,
  border: 'none', background: 'none',
  color: '#444444', fontSize: 11, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'inherit',
  transition: 'background 0.08s',
};

const formLbl: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 600,
  color: '#555555', marginBottom: 3, letterSpacing: '0.03em',
};

const formInp: React.CSSProperties = {
  width: '100%', fontSize: 12, color: '#111111',
  padding: '4px 7px', border: '1px solid #CCCCCC',
  borderRadius: 2, background: '#ffffff',
  outline: 'none', fontFamily: 'inherit', height: 28,
  transition: 'border-color 0.12s',
};

// ── Remote Sign Modal ─────────────────────────────────────────────────────────

type SignStatus = 'idle' | 'sending' | 'sent' | 'error';

function RemoteSignModal({
  reservation,
  onClose,
}: {
  reservation: { reference: string; client?: { full_name?: string; email?: string } | null };
  onClose: () => void;
}) {
  const defaultEmail   = reservation.client?.email ?? '';
  const defaultSubject = `Agreement for Signing — Reservation ${reservation.reference}`;
  const defaultBody    = `Dear ${reservation.client?.full_name ?? 'Valued Guest'},

Please review and sign the travel agreement for your upcoming trip (Reservation Ref: ${reservation.reference}).

Click the secure link below to read the full agreement and sign electronically. The link will expire in 7 days.

[SIGN AGREEMENT →]

If you have any questions, please don't hesitate to contact us.

Warm regards,
Samsara DMC`;

  const [toEmail,   setToEmail]   = useState(defaultEmail);
  const [ccEmail,   setCcEmail]   = useState('');
  const [subject,   setSubject]   = useState(defaultSubject);
  const [body,      setBody]      = useState(defaultBody);
  const [expiry,    setExpiry]    = useState('7');
  const [status,    setStatus]    = useState<SignStatus>('idle');

  function handleSend() {
    if (!toEmail.trim()) return;
    setStatus('sending');
    // Simulate async email send
    setTimeout(() => setStatus('sent'), 1600);
  }

  const isSent    = status === 'sent';
  const isSending = status === 'sending';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: 6,
        boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
        width: 520,
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          background: '#1A1A2E',
          borderBottom: '1px solid #0F0F1E',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PenLine size={14} strokeWidth={2} color="#ffffff" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', margin: 0 }}>Remote Sign Agreement</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                Send a secure signing link to the customer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.5)', display: 'flex' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ffffff'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {isSent ? (
          /* ── Success state ── */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={26} color="#16A34A" strokeWidth={2} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111111', margin: 0 }}>Signing request sent!</p>
            <p style={{ fontSize: 12, color: '#666666', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
              A secure signing link has been sent to <strong>{toEmail}</strong>.<br />
              The link will expire in <strong>{expiry} days</strong>.
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#FEF9E7', border: '1px solid #F5D78A',
              borderRadius: 4, padding: '7px 12px', marginTop: 4,
            }}>
              <Clock size={12} color="#B45309" strokeWidth={2} />
              <span style={{ fontSize: 11, color: '#B45309' }}>
                Awaiting signature — expires in {expiry} days
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: 8, padding: '7px 20px',
                background: '#1A1A2E', border: 'none', borderRadius: 4,
                color: '#ffffff', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Close
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Info strip */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              background: '#EFF6FF', border: '1px solid #BFDBFE',
              borderRadius: 4, padding: '8px 10px',
            }}>
              <AlertCircle size={13} color="#2563EB" strokeWidth={2} style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: '#1E40AF', lineHeight: 1.6, margin: 0 }}>
                The customer will receive an email with a secure, one-time signing link.
                Once signed, the agreement will be attached to this reservation automatically.
              </p>
            </div>

            {/* To */}
            <ModalField label="To (email)" required>
              <input
                type="email"
                value={toEmail}
                onChange={e => setToEmail(e.target.value)}
                placeholder="customer@email.com"
                style={modalInp}
                onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                onBlur={e  => (e.currentTarget.style.borderColor = '#CCCCCC')}
              />
            </ModalField>

            {/* CC */}
            <ModalField label="CC (optional)">
              <input
                type="email"
                value={ccEmail}
                onChange={e => setCcEmail(e.target.value)}
                placeholder="agent@example.com"
                style={modalInp}
                onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                onBlur={e  => (e.currentTarget.style.borderColor = '#CCCCCC')}
              />
            </ModalField>

            {/* Subject */}
            <ModalField label="Subject" required>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                style={modalInp}
                onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                onBlur={e  => (e.currentTarget.style.borderColor = '#CCCCCC')}
              />
            </ModalField>

            {/* Expiry */}
            <ModalField label="Link expires in">
              <select
                value={expiry}
                onChange={e => setExpiry(e.target.value)}
                style={{ ...modalInp, width: 130, cursor: 'pointer' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                onBlur={e  => (e.currentTarget.style.borderColor = '#CCCCCC')}
              >
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </ModalField>

            {/* Message body */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#555555', display: 'block', marginBottom: 4, letterSpacing: '0.03em' }}>
                Message
              </label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={10}
                style={{
                  ...modalInp,
                  height: 'auto', resize: 'vertical',
                  lineHeight: 1.7, padding: '8px 10px',
                  fontFamily: 'monospace', fontSize: 11,
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                onBlur={e  => (e.currentTarget.style.borderColor = '#CCCCCC')}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        {!isSent && (
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid #EEEEEE',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#FAFAFA',
          }}>
            <p style={{ fontSize: 10, color: '#AAAAAA', margin: 0 }}>
              Ref: <strong style={{ fontFamily: 'monospace' }}>{reservation.reference}</strong>
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={onClose}
                style={{
                  padding: '5px 14px', border: '1px solid #D0D0D0',
                  borderRadius: 3, background: 'none',
                  fontSize: 12, color: '#555555',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F0F0F0'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!toEmail.trim() || isSending}
                style={{
                  padding: '5px 16px', border: 'none', borderRadius: 3,
                  background: toEmail.trim() && !isSending ? '#1A1A2E' : '#CCCCCC',
                  color: '#ffffff', fontSize: 12, fontWeight: 600,
                  cursor: toEmail.trim() && !isSending ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'opacity 0.12s',
                }}
                onMouseEnter={e => { if (toEmail.trim() && !isSending) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
              >
                {isSending ? (
                  <>
                    <RefreshCw size={12} strokeWidth={2} style={{ animation: 'spin 0.7s linear infinite' }} />
                    Sending…
                  </>
                ) : (
                  <>
                    <PenLine size={12} strokeWidth={2} />
                    Send for Signature
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const modalInp: React.CSSProperties = {
  width: '100%', fontSize: 12, color: '#111111',
  padding: '5px 8px',
  border: '1px solid #CCCCCC', borderRadius: 3,
  background: '#FFFFFF', outline: 'none',
  fontFamily: 'inherit', height: 30,
  transition: 'border-color 0.12s',
};

function ModalField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#555555', display: 'block', marginBottom: 4, letterSpacing: '0.03em' }}>
        {required && <span style={{ color: '#CC3333', marginRight: 3 }}>*</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

function ActionItem({
  label, icon, danger, highlight, onClick,
}: {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}) {
  const color = danger ? '#C43333' : highlight ? '#1A6FC4' : '#222222';
  const hoverBg = danger ? '#FFF5F5' : highlight ? '#EEF4FF' : '#F5F5F5';
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '6px 12px',
        border: 'none', background: highlight ? '#F5FAFF' : 'none',
        color, fontSize: 12,
        cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 9,
        transition: 'background 0.08s',
        fontWeight: highlight ? 600 : 400,
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = hoverBg}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = highlight ? '#F5FAFF' : 'none'}
    >
      <span style={{ color, flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  );
}

function TBtn({
  icon, label, primary, danger, active, chevron,
  onClick,
}: {
  icon?: React.ReactNode; label: string; primary?: boolean; danger?: boolean; active?: boolean; chevron?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '3px 9px', borderRadius: 3,
        border: primary ? '1px solid #1565B0' : danger ? '1px solid #AA2020' : '1px solid #C0C0C0',
        background: primary ? '#1A6FC4' : danger ? '#CC3333' : active ? '#D8D8D8' : '#E8E8E8',
        color: primary || danger ? '#ffffff' : '#222222',
        fontSize: 12, fontWeight: primary || danger ? 600 : 500,
        cursor: 'pointer', fontFamily: 'inherit',
        height: 25,
        whiteSpace: 'nowrap',
        boxShadow: primary || danger ? '0 1px 2px rgba(0,0,0,0.15)' : '0 1px 1px rgba(0,0,0,0.07)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        if (primary) el.style.background = '#1460A8';
        else if (danger) el.style.background = '#B82828';
        else el.style.background = '#DCDCDC';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        if (primary) el.style.background = '#1A6FC4';
        else if (danger) el.style.background = '#CC3333';
        else el.style.background = active ? '#D8D8D8' : '#E8E8E8';
      }}
    >
      {icon}
      {label}
      {chevron && <ChevronDown size={10} strokeWidth={2} style={{ marginLeft: 1 }} />}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type TabKey = 'general' | 'payments' | 'supplier_bookings' | 'costing' | 'documents';

function fmtTime(val: string): string {
  const d = val.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

function calcNights(a: string, d: string): number {
  if (!a || !d) return 0;
  return Math.max(0, Math.ceil((new Date(d).getTime() - new Date(a).getTime()) / 86400000));
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const editInp: React.CSSProperties = {
  fontSize: 12, color: '#111111',
  padding: '1px 5px',
  border: '1px solid #BBBBBB',
  borderRadius: 2,
  background: '#FFFDE7',
  outline: 'none',
  fontFamily: 'inherit',
  height: 20,
};

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab,          setTab]        = useState<TabKey>('general');
  const [notesOpen,    setNotesOpen]  = useState(false);
  const [refreshing,   setRefreshing] = useState(false);
  const [printOpen,    setPrintOpen]  = useState(false);
  const [actionsOpen,  setActionsOpen]  = useState(false);
  const [signOpen,     setSignOpen]     = useState(false);
  const [messageOpen,  setMessageOpen]  = useState(false);
  const printRef   = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!printOpen) return;
    const h = (e: MouseEvent) => {
      if (printRef.current && !printRef.current.contains(e.target as Node)) setPrintOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [printOpen]);

  useEffect(() => {
    if (!actionsOpen) return;
    const h = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) setActionsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [actionsOpen]);

  useEffect(() => {
    if (!messageOpen) return;
    const h = (e: MouseEvent) => {
      if (messageRef.current && !messageRef.current.contains(e.target as Node)) setMessageOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [messageOpen]);

  const r = mockReservations.find(x => x.id === id);

  // ── Editable field state ───────────────────────────────────────────────────
  const [clientName,     setClientName]     = useState('');
  const [arrivalDate,    setArrivalDate]    = useState('');
  const [arrivalTime,    setArrivalTime]    = useState('');
  const [departureDate,  setDepartureDate]  = useState('');
  const [departureTime,  setDepartureTime]  = useState('');
  const [adults,         setAdults]         = useState(0);
  const [children,       setChildren]       = useState(0);
  const [infants,        setInfants]        = useState(0);
  const [nights,         setNights]         = useState(0);
  const [notes,          setNotes]          = useState('');
  const [dirty,          setDirty]          = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [initialized,    setInitialized]    = useState(false);

  // Seed state once reservation loads
  if (r && !initialized) {
    setClientName(r.client?.full_name ?? '');
    setArrivalDate(r.arrival_date);
    setArrivalTime('');
    setDepartureDate(r.departure_date);
    setDepartureTime('');
    setNights(calcNights(r.arrival_date, r.departure_date));
    setAdults(r.num_adults);
    setChildren(r.num_children);
    setInfants(r.num_infants);
    setNotes(r.internal_notes ?? '');
    setInitialized(true);
  }

  function markDirty() { setDirty(true); }

  function handleSave() {
    if (!r) return;
    if (r.client) r.client.full_name = clientName;
    r.arrival_date   = arrivalDate;
    r.departure_date = departureDate;
    r.num_adults     = adults;
    r.num_children   = children;
    r.num_infants    = infants;
    r.internal_notes = notes;
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleDelete() {
    if (!r) return;
    const ok = window.confirm(
      `Delete reservation ${r.reference} for ${r.client?.full_name ?? 'this client'}?\n\nThis cannot be undone.`
    );
    if (!ok) return;
    const idx = mockReservations.findIndex(x => x.id === id);
    if (idx !== -1) mockReservations.splice(idx, 1);
    router.push('/reservations');
  }

  function handleRefresh() {
    if (refreshing || !r) return;
    setRefreshing(true);
    setClientName(r.client?.full_name ?? '');
    setArrivalDate(r.arrival_date);
    setArrivalTime('');
    setDepartureDate(r.departure_date);
    setDepartureTime('');
    setNights(calcNights(r.arrival_date, r.departure_date));
    setAdults(r.num_adults);
    setChildren(r.num_children);
    setInfants(r.num_infants);
    setNotes(r.internal_notes ?? '');
    setDirty(false);
    setTimeout(() => setRefreshing(false), 600);
  }

  function handlePrint(docType: string) {
    setPrintOpen(false);
    const prev = document.title;
    document.title = `Samsara — ${docType} · ${r?.reference ?? ''}`;
    window.print();
    document.title = prev;
  }

  function exportCSV() {
    if (!r) return;
    const rows = [
      ['Field', 'Value'],
      ['Reference',      r.reference],
      ['Status',         STATUS_CONFIG[r.status].label],
      ['Client',         r.client?.full_name ?? ''],
      ['Nationality',    r.client?.nationality ?? ''],
      ['Email',          r.client?.email ?? ''],
      ['Phone',          r.client?.phone ?? ''],
      ['Travel Purpose', r.travel_purpose],
      ['Arrival',        r.arrival_date],
      ['Departure',      r.departure_date],
      ['Nights',         tripDuration(r.arrival_date, r.departure_date)],
      ['Adults',         r.num_adults],
      ['Children',       r.num_children],
      ['Destinations',   r.destinations.join(' | ')],
      ['Flight Arrival', r.flight_arrival ?? ''],
      ['Currency',       r.currency],
      ['Total Cost',     r.total_cost],
      ['Total Paid',     r.total_paid],
      ['Balance',        r.total_cost - r.total_paid],
      ['Payment Status', PAYMENT_CONFIG[r.payment_status].label],
      ['Partner',        r.partner?.company_name ?? ''],
      ['Partner Ref',    r.partner_reference ?? ''],
      ['Agent',          r.assigned_staff ?? ''],
    ];
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = rows.map(row => row.map(esc).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${r.reference}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Three-way sync handlers — also write-through to the mock so the
  // itinerary builder reads the updated dates on its next mount.
  function handleArrivalDate(val: string) {
    setArrivalDate(val);
    if (r) r.arrival_date = val;
    if (val && nights > 0) {
      const dep = addDays(val, nights);
      setDepartureDate(dep);
      if (r) r.departure_date = dep;
    }
    markDirty();
  }

  function handleDepartureDate(val: string) {
    setDepartureDate(val);
    if (r) r.departure_date = val;
    if (val && arrivalDate) setNights(calcNights(arrivalDate, val));
    markDirty();
  }

  function handleNights(val: number) {
    const n = Math.max(1, val);
    setNights(n);
    if (arrivalDate) {
      const dep = addDays(arrivalDate, n);
      setDepartureDate(dep);
      if (r) r.departure_date = dep;
    }
    markDirty();
  }

  if (!r) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#AAAAAA', fontSize: 13 }}>
      Reservation not found.
    </div>
  );

  const status   = STATUS_CONFIG[r.status];
  const payment  = PAYMENT_CONFIG[r.payment_status];
  const balance  = r.total_cost - r.total_paid;
  const pct      = r.total_cost > 0 ? Math.round((r.total_paid / r.total_cost) * 100) : 0;
  const stageIdx = STAGE_ORDER.indexOf(r.status);

  const totalPax = adults + children + infants;

  // Estimated cost breakdown (mock proportions for display)
  const accomCost   = r.total_cost > 0 ? Math.round(r.total_cost * 0.55) : 0;
  const transptCost = r.total_cost > 0 ? Math.round(r.total_cost * 0.20) : 0;
  const activCost   = r.total_cost > 0 ? Math.round(r.total_cost * 0.15) : 0;
  const miscCost    = r.total_cost > 0 ? Math.round(r.total_cost * 0.10) : 0;

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', background: '#E4E4E4' }}>

      {/* ── Toolbar ── */}
      <div style={{
        background: '#F2F2F2',
        borderBottom: '1px solid #BBBBBB',
        padding: '4px 10px',
        display: 'flex', alignItems: 'center', gap: 3,
        flexShrink: 0, flexWrap: 'wrap',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <TBtn
          icon={<Save size={12} strokeWidth={2} />}
          label={saved ? 'Saved!' : 'Save'}
          primary
          onClick={handleSave}
        />
        {dirty && !saved && (
          <span style={{ fontSize: 11, color: '#D97706', fontWeight: 500, marginLeft: 4 }}>
            ● Unsaved changes
          </span>
        )}
        <TBtn icon={<Plus size={12} strokeWidth={2.5} />} label="New" />
        <TBtn icon={<Trash2 size={12} strokeWidth={2} />} label="Delete" danger onClick={handleDelete} />

        {/* Refresh */}
        <TBtn
          icon={<RefreshCw size={12} strokeWidth={2} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />}
          label={refreshing ? 'Refreshing…' : 'Refresh'}
          onClick={handleRefresh}
        />

        {/* Print dropdown */}
        <div ref={printRef} style={{ position: 'relative' }}>
          <TBtn
            icon={<Printer size={12} strokeWidth={2} />}
            label="Print"
            chevron
            onClick={() => setPrintOpen(o => !o)}
          />
          {printOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0,
              background: '#ffffff', border: '1px solid #E0E0E0',
              borderRadius: 6, boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
              zIndex: 400, minWidth: 210, overflow: 'hidden', padding: '4px 0',
            }}>
              <p style={{ padding: '5px 12px 4px', fontSize: 10, fontWeight: 700, color: '#AAAAAA', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Print Document
              </p>
              {[
                { label: 'Invoice',              icon: <ReceiptText   size={13} strokeWidth={1.8} /> },
                { label: 'Itinerary',            icon: <BookOpen      size={13} strokeWidth={1.8} /> },
                { label: 'Booking Confirmation', icon: <FileCheck     size={13} strokeWidth={1.8} /> },
                { label: 'Travel Voucher',       icon: <Ticket        size={13} strokeWidth={1.8} /> },
                { label: 'Service Details',      icon: <ClipboardList size={13} strokeWidth={1.8} /> },
                { label: 'Agreement',            icon: <FileText      size={13} strokeWidth={1.8} /> },
              ].map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => handlePrint(label)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '7px 12px',
                    border: 'none', background: 'none',
                    color: '#333333', fontSize: 12,
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'background 0.08s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F5F5F5'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                >
                  <span style={{ color: '#888888' }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export CSV */}
        <TBtn icon={<Download size={12} strokeWidth={2} />} label="Export" onClick={exportCSV} />
        <TBtn icon={<History size={12} strokeWidth={2} />} label="Change Log" />
        <TBtn icon={<Share2 size={12} strokeWidth={2} />} label="Share" />

        <div style={{ width: 1, height: 20, background: '#C0C0C0', margin: '0 4px' }} />

        <Link
          href={`/reservations/${id}/itinerary`}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 9px', borderRadius: 3, height: 26,
            border: '1px solid #BBBBBB', background: '#EBEBEB',
            color: '#333333', fontSize: 12, fontWeight: 500,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#DEDEDE')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#EBEBEB')}
        >
          <BookOpen size={12} strokeWidth={2} />
          Itinerary
        </Link>

        <div style={{ width: 1, height: 20, background: '#C0C0C0', margin: '0 4px' }} />

        {/* Actions dropdown */}
        <div ref={actionsRef} style={{ position: 'relative' }}>
          <TBtn
            icon={<ChevronDown size={11} strokeWidth={2} />}
            label="Actions"
            chevron={false}
            onClick={() => setActionsOpen(o => !o)}
            active={actionsOpen}
          />
          {actionsOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0,
              background: '#ffffff', border: '1px solid #D8D8D8',
              borderRadius: 5, boxShadow: '0 8px 24px rgba(0,0,0,0.13)',
              zIndex: 400, width: 230, overflow: 'hidden', padding: '4px 0',
            }}>
              {/* Operations */}
              <p style={{ padding: '5px 12px 3px', fontSize: 10, fontWeight: 700, color: '#AAAAAA', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Operations</p>
              {[
                { label: 'Add / Update Services',  icon: <PlusCircle size={13} strokeWidth={1.8} />, danger: false },
                { label: 'Assign Guide / Driver',  icon: <UserCheck  size={13} strokeWidth={1.8} />, danger: false },
                { label: 'Modify Itinerary',       icon: <Map        size={13} strokeWidth={1.8} />, danger: false },
                { label: 'Cancel Reservation',     icon: <XCircle    size={13} strokeWidth={1.8} />, danger: true  },
              ].map(({ label, icon, danger }) => (
                <ActionItem key={label} label={label} icon={icon} danger={danger} onClick={() => setActionsOpen(false)} />
              ))}

              <div style={{ height: 1, background: '#F0F0F0', margin: '3px 0' }} />

              {/* Financials */}
              <p style={{ padding: '5px 12px 3px', fontSize: 10, fontWeight: 700, color: '#AAAAAA', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Financials</p>
              {[
                { label: 'Issue Invoice',        icon: <ReceiptText size={13} strokeWidth={1.8} />, danger: false },
                { label: 'Issue Credit Note',    icon: <FileMinus   size={13} strokeWidth={1.8} />, danger: false },
                { label: 'Recalculate Rates',    icon: <Calculator  size={13} strokeWidth={1.8} />, danger: false },
                { label: 'Manage Commissions',   icon: <Percent     size={13} strokeWidth={1.8} />, danger: false },
              ].map(({ label, icon, danger }) => (
                <ActionItem key={label} label={label} icon={icon} danger={danger} onClick={() => setActionsOpen(false)} />
              ))}

              <div style={{ height: 1, background: '#F0F0F0', margin: '3px 0' }} />

              {/* Communications */}
              <p style={{ padding: '5px 12px 3px', fontSize: 10, fontWeight: 700, color: '#AAAAAA', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Communications</p>
              {[
                { label: 'Send Booking Confirmation', icon: <Mail     size={13} strokeWidth={1.8} />, danger: false },
                { label: 'Send Itinerary to Client',  icon: <Send     size={13} strokeWidth={1.8} />, danger: false },
                { label: 'Send Voucher to Supplier',  icon: <Ticket   size={13} strokeWidth={1.8} />, danger: false },
              ].map(({ label, icon, danger }) => (
                <ActionItem key={label} label={label} icon={icon} danger={danger} onClick={() => setActionsOpen(false)} />
              ))}
              <ActionItem
                label="Remote Sign Agreement"
                icon={<PenLine size={13} strokeWidth={1.8} />}
                highlight
                onClick={() => { setActionsOpen(false); setSignOpen(true); }}
              />

              <div style={{ height: 1, background: '#F0F0F0', margin: '3px 0' }} />

              {/* Admin */}
              <p style={{ padding: '5px 12px 3px', fontSize: 10, fontWeight: 700, color: '#AAAAAA', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Admin</p>
              {[
                { label: 'Booking Snapshot',       icon: <History  size={13} strokeWidth={1.8} />, danger: false },
                { label: 'Duplicate Reservation',  icon: <Copy     size={13} strokeWidth={1.8} />, danger: false },
                { label: 'Create Claim',           icon: <Flag     size={13} strokeWidth={1.8} />, danger: true  },
              ].map(({ label, icon, danger }) => (
                <ActionItem key={label} label={label} icon={icon} danger={danger} onClick={() => setActionsOpen(false)} />
              ))}
            </div>
          )}
        </div>

        <TBtn icon={<HelpCircle size={12} strokeWidth={2} />} label="Help" />

        <div style={{ width: 1, height: 20, background: '#C0C0C0', margin: '0 4px' }} />

        <TBtn icon={<Send size={12} strokeWidth={2} />} label="Send Invoice" active />
        <Link
          href={`/reservations/${id}/itinerary`}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 9px', borderRadius: 3,
            border: '1px solid #BBBBBB', background: '#EBEBEB',
            color: '#333333', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit', height: 26,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#DEDEDE')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#EBEBEB')}
        >
          <FileText size={12} strokeWidth={2} />
          Itinerary
        </Link>
        {/* Message dropdown */}
        <div ref={messageRef} style={{ position: 'relative' }}>
          <TBtn
            icon={<MessageCircle size={12} strokeWidth={2} />}
            label="Message"
            chevron
            active={messageOpen}
            onClick={() => setMessageOpen(o => !o)}
          />
          {messageOpen && (
            <MessageDropdown
              phone={r.client?.phone ?? r.client?.whatsapp ?? ''}
              onClose={() => setMessageOpen(false)}
            />
          )}
        </div>
        <TBtn icon={<PenLine size={12} strokeWidth={2} />} label="Remote Sign" primary onClick={() => setSignOpen(true)} />

        <div style={{ flex: 1 }} />

        <Link href="/reservations" style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 12, color: '#555555', textDecoration: 'none',
        }}>
          <ChevronLeft size={13} strokeWidth={2} />
          Back to Reservations
        </Link>
      </div>

      {/* ── Tab bar + Reference ── */}
      <div style={{
        background: '#F5F5F5',
        borderBottom: '1px solid #BBBBBB',
        display: 'flex', alignItems: 'stretch',
        justifyContent: 'space-between',
        padding: '0 10px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          {(['general', 'payments', 'supplier_bookings', 'costing', 'documents'] as TabKey[]).map(t => {
            const labels: Record<TabKey, string> = { general: 'General', payments: 'Payments', supplier_bookings: 'Supplier Bookings', costing: 'Cost & Margin', documents: 'Documents' };
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '0 16px', height: 34, border: 'none',
                  borderBottom: active ? '2px solid #1A6FC4' : '2px solid transparent',
                  borderTop: active ? '2px solid transparent' : '2px solid transparent',
                  background: active ? '#ffffff' : 'transparent',
                  color: active ? '#1A6FC4' : '#555555',
                  fontSize: 12, fontWeight: active ? 700 : 400,
                  cursor: 'pointer', fontFamily: 'inherit',
                  borderRadius: 0,
                  letterSpacing: '0.01em',
                  transition: 'color 0.1s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#333333'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#555555'; }}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>

        {/* Reference + Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' }}>
          {r.is_vip && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#B8860B', fontWeight: 700 }}>
              <Star size={11} fill="#B8860B" strokeWidth={0} /> VIP
            </span>
          )}
          <span style={{ fontSize: 12, color: '#444444' }}>
            Ref: <strong style={{ color: '#111111', fontFamily: 'monospace', letterSpacing: '0.02em' }}>{r.reference}</strong>
          </span>
          {r.partner_reference && (
            <span style={{ fontSize: 11, color: '#999999', fontFamily: 'monospace' }}>
              · {r.partner_reference}
            </span>
          )}
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 9px',
            borderRadius: 3,
            background: status.bg,
            color: status.color,
            border: `1px solid ${status.border ?? status.color}`,
          }}>
            {status.label}
          </span>
        </div>
      </div>

      {/* ── Status pipeline ── */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #DDDDDD',
        padding: '5px 16px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', maxWidth: 700 }}>
          {STAGES.map((stage, i) => {
            const done   = i < stageIdx;
            const active = i === stageIdx;
            return (
              <div key={stage.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: 17, height: 17, borderRadius: '50%', marginBottom: 3,
                    background: active ? '#1A6FC4' : done ? '#1A6FC4' : '#DDDDDD',
                    border: `2px solid ${active ? '#1A6FC4' : done ? '#1A6FC4' : '#CCCCCC'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: done ? 0.5 : 1,
                  }}>
                    {(done || active) && (
                      <span style={{ color: '#ffffff', fontSize: 8, fontWeight: 700, lineHeight: 1 }}>
                        {done ? '✓' : '●'}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: 10, whiteSpace: 'nowrap',
                    color: active ? '#1A6FC4' : done ? '#888888' : '#BBBBBB',
                    fontWeight: active ? 700 : 400,
                  }}>{stage.label}</span>
                </div>
                {i < STAGES.length - 1 && (
                  <div style={{
                    flex: 1, height: 1, marginBottom: 15,
                    background: done ? '#1A6FC4' : '#DDDDDD',
                    opacity: done ? 0.4 : 1,
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {tab === 'general' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', maxWidth: 1020, margin: '0 auto' }}>

            {/* ── Left main column ── */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* General Information */}
              <FormSection title="General Information">
                <FRSplit
                  left={<FR label="Res. #"     value={r.reference}              required highlight />}
                  right={<FR label="Res. Date"  value={formatDate(r.created_at)}               />}
                />
                <FRSplit
                  left={<FR label="Source"      value={r.partner ? 'Agent / Partner' : 'Direct'} />}
                  right={<FR label="Res. By"    value={r.assigned_staff ?? 'Unassigned'}        />}
                />
                <FRSplit
                  left={<FR label="Travel Type" value={r.travel_purpose.replace(/_/g, ' ')}    />}
                  right={<FR label="Budget"     value={r.budget_range ?? '—'}                  />}
                />
              </FormSection>

              {/* Customer Information */}
              <FormSection title="Customer Information">
                <InlineRow label="Name" required>
                  <input
                    type="text"
                    value={clientName}
                    onChange={e => { setClientName(e.target.value); markDirty(); }}
                    style={{ ...editInp, flex: 1 }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                    onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                  />
                </InlineRow>
                {r.client?.company_name && (
                  <FR label="Company" value={r.client.company_name} />
                )}
                <FRSplit
                  left={<FR label="Nationality"  value={r.client?.nationality}         />}
                  right={<FR label="Passport No" value={r.client?.passport_number}     />}
                />
                <FRSplit
                  left={<FR label="Email"        value={r.client?.email}               />}
                  right={<FR label="Phone"       value={r.client?.phone}               />}
                />
                {r.client?.whatsapp && (
                  <FR label="WhatsApp" value={r.client.whatsapp} />
                )}
                {r.client?.dietary_restrictions && (
                  <FR label="Dietary / Notes" value={r.client.dietary_restrictions} />
                )}
                {r.special_occasions && r.special_occasions.length > 0 && (
                  <FR label="Occasion" value={r.special_occasions.map(o => o.charAt(0).toUpperCase() + o.slice(1)).join(', ')} />
                )}
              </FormSection>

              {/* Agent Information */}
              {r.partner && (
                <FormSection title="Agent / Partner Information">
                  <InlineRow label="Agent" required>
                    <div style={{ ...inputStyle, background: '#FFFFCC', flex: 1, display: 'flex', alignItems: 'center' }}>
                      {r.partner.company_name}
                    </div>
                  </InlineRow>
                  <FRSplit
                    left={<FR label="Contact"    value={r.partner.contact_person}      />}
                    right={<FR label="Sub-acct"  value={r.partner.email}               />}
                  />
                  <FRSplit
                    left={
                      <InlineRow label="Program">
                        <select style={{ ...selectStyle, width: 120 }}>
                          <option>Pre-paid</option>
                          <option>Post-paid</option>
                          <option>Credit</option>
                        </select>
                      </InlineRow>
                    }
                    right={<FR label="Conf #"   value={r.partner_reference} highlight />}
                  />
                  <FRSplit
                    left={<FR label="Commission" value={`${r.partner.commission_rate}%`} />}
                    right={<FR label="Comm. Amt" value={formatCurrency(r.commission_amount, r.currency)} mono />}
                  />
                  {r.partner.contract_reference && (
                    <FR label="Contract Ref" value={r.partner.contract_reference} />
                  )}
                </FormSection>
              )}

              {/* Arrival & Departure — side by side */}
              <div style={{ display: 'flex', gap: 5 }}>
                <div style={{ flex: 1 }}>
                  <FormSection title="Arrival Information">
                    <InlineRow label="Date / Time" required>
                      <input
                        type="date"
                        value={arrivalDate}
                        onChange={e => handleArrivalDate(e.target.value)}
                        style={{ ...editInp, width: 120 }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                        onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                      />
                      <input
                        type="text"
                        value={arrivalTime}
                        onChange={e => { setArrivalTime(fmtTime(e.target.value)); markDirty(); }}
                        placeholder="HH:MM"
                        style={{ ...editInp, width: 74 }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                        onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                      />
                    </InlineRow>
                    <InlineRow label="Airport" required>
                      <div style={{ ...inputStyle, flex: 1 }}>{r.airport_arrival ?? '—'}</div>
                    </InlineRow>
                    <FR label="Flight #"   value={r.flight_arrival}    highlight />
                    <FR label="Memo"       value={'—'}                            />
                  </FormSection>
                </div>
                <div style={{ flex: 1 }}>
                  <FormSection title="Departure Information">
                    <InlineRow label="Date / Time" required>
                      <input
                        type="date"
                        value={departureDate}
                        onChange={e => handleDepartureDate(e.target.value)}
                        style={{ ...editInp, width: 120 }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                        onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                      />
                      <input
                        type="text"
                        value={departureTime}
                        onChange={e => { setDepartureTime(fmtTime(e.target.value)); markDirty(); }}
                        placeholder="HH:MM"
                        style={{ ...editInp, width: 74 }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                        onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                      />
                    </InlineRow>
                    <InlineRow label="Airport" required>
                      <div style={{ ...inputStyle, flex: 1 }}>{r.airport_departure ?? '—'}</div>
                    </InlineRow>
                    <FR label="Flight #"   value={r.flight_departure}  highlight />
                    <FR label="Memo"       value={'—'}                            />
                  </FormSection>
                </div>
              </div>

              {/* Pax & Group */}
              <FormSection title="Pax &amp; Group Details">
                <FRSplit
                  left={
                    <InlineRow label="Adults" required>
                      <input
                        type="number" min={1} max={99}
                        value={adults}
                        onChange={e => { setAdults(Math.max(1, Number(e.target.value))); markDirty(); }}
                        style={{ ...editInp, width: 52, textAlign: 'center' }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                        onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                      />
                    </InlineRow>
                  }
                  right={
                    <InlineRow label="Children">
                      <input
                        type="number" min={0} max={99}
                        value={children}
                        onChange={e => { setChildren(Math.max(0, Number(e.target.value))); markDirty(); }}
                        style={{ ...editInp, width: 52, textAlign: 'center' }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                        onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                      />
                    </InlineRow>
                  }
                />
                <FRSplit
                  left={
                    <InlineRow label="Infants">
                      <input
                        type="number" min={0} max={99}
                        value={infants}
                        onChange={e => { setInfants(Math.max(0, Number(e.target.value))); markDirty(); }}
                        style={{ ...editInp, width: 52, textAlign: 'center' }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                        onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                      />
                    </InlineRow>
                  }
                  right={
                    <FR label="Total Pax" value={`${totalPax} pax`} highlight />
                  }
                />
              </FormSection>

              {/* Trip Duration & Destinations */}
              <FormSection title="Trip Duration &amp; Destinations">
                <FRSplit
                  left={
                    <InlineRow label="Duration" required>
                      <input
                        type="number" min={1} max={365}
                        value={nights}
                        onChange={e => handleNights(Number(e.target.value))}
                        style={{ ...editInp, width: 52, textAlign: 'center', fontWeight: 600 }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                        onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                      />
                      <span style={{ fontSize: 12, color: '#666', marginLeft: 2 }}>nights</span>
                    </InlineRow>
                  }
                  right={<FR label="Ext. Rate" value={'—'} />}
                />
                <div style={rowStyle}>
                  <div style={labelStyle}>Destinations</div>
                  <div style={{ flex: 1, padding: '3px 8px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {r.destinations.map((d, i) => (
                      <span key={i} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        background: '#EEF4FF', border: '1px solid #C0D4F0',
                        color: '#2255AA', fontSize: 11,
                        padding: '2px 8px', borderRadius: 3,
                      }}>
                        <MapPin size={9} strokeWidth={2} />
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </FormSection>

              {/* Internal Notes */}
              <FormSection title="Internal Notes / Memo">
                <div style={{ padding: '5px 10px' }}>
                  <textarea
                    value={notes}
                    onChange={e => { setNotes(e.target.value); markDirty(); }}
                    placeholder="Add internal notes, special requests, or team instructions…"
                    style={{
                      width: '100%', minHeight: 56, resize: 'vertical',
                      border: '1px solid #C8C8C8', borderRadius: 2,
                      fontSize: 12, color: '#333333', lineHeight: 1.65,
                      padding: '6px 8px', fontFamily: 'inherit',
                      background: '#FFFFF0', outline: 'none',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#1A6FC4')}
                    onBlur={e  => (e.currentTarget.style.borderColor = '#C8C8C8')}
                  />
                  <p style={{ fontSize: 10, color: '#BBBBBB', marginTop: 3, textAlign: 'right' }}>
                    {notes.length} characters
                  </p>
                </div>
              </FormSection>

              {/* Documents */}
              <DocumentsSection />

              {/* Purchased Services */}
              <div style={{ padding: '4px 0', fontSize: 11, color: '#888888' }}>
                <span style={{ fontWeight: 600, color: '#444' }}>Purchased services: </span>
                {[
                  r.accommodations?.length ? 'Accommodation' : null,
                  r.transfers?.length      ? 'Transfers'     : null,
                  r.activities?.length     ? 'Activities'    : null,
                  r.is_vip                 ? 'VIP Services'  : null,
                ].filter(Boolean).join(' · ') || 'Standard DMC Package'}
              </div>
            </div>

            {/* ── Right column ── */}
            <div style={{ width: 220, flexShrink: 0 }}>
              <div style={{ ...sectionStyle, position: 'sticky', top: 0 }}>

                {/* Charges header */}
                <div style={{
                  ...sectionHeadStyle,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span>Charges Summary</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: payment.color,
                  }}>
                    {payment.label}
                  </span>
                </div>

                {/* Rate Code row */}
                <div style={{ padding: '5px 10px', borderBottom: '1px solid #EEEEEE' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#555', flexShrink: 0 }}>
                      <span style={{ color: '#CC3333' }}>*</span> Rate code
                    </span>
                    <select style={{ ...selectStyle, width: 120 }}>
                      <option>{r.travel_purpose.replace(/_/g, ' ')}</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#555', flexShrink: 0 }}>
                      <span style={{ color: '#CC3333' }}>*</span> Currency
                    </span>
                    <select style={{ ...selectStyle, width: 70 }}>
                      <option>{r.currency}</option>
                    </select>
                  </div>
                </div>

                {/* Cost lines */}
                <ChargeRow label="Accommodation"  value={accomCost   > 0 ? formatCurrency(accomCost,   r.currency) : '—'} />
                <ChargeRow label="Transport"      value={transptCost > 0 ? formatCurrency(transptCost, r.currency) : '—'} />
                <ChargeRow label="Activities"     value={activCost   > 0 ? formatCurrency(activCost,   r.currency) : '—'} />
                <ChargeRow label="Guide Fees"     value={'—'} />
                <ChargeRow label="Miscellaneous"  value={miscCost    > 0 ? formatCurrency(miscCost,    r.currency) : '—'} />

                {/* Discount row */}
                <div style={{ ...chargeRowStyle }}>
                  <span style={{ fontSize: 12, color: '#555555' }}>Discount</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <select style={{ ...selectStyle, width: 50, height: 20, padding: '1px 4px' }}>
                      <option>0%</option><option>5%</option><option>10%</option>
                    </select>
                    <span style={{ fontSize: 12, color: '#111', fontVariantNumeric: 'tabular-nums' }}>0.00</span>
                  </div>
                </div>

                <ChargeRow label="Surcharges" value="0.00" />

                {/* Net total */}
                <ChargeRow
                  label="Net total"
                  value={r.total_cost > 0 ? formatCurrency(r.total_cost, r.currency) : '—'}
                  bold large
                />

                {/* VAT */}
                <div style={{ ...chargeRowStyle }}>
                  <span style={{ fontSize: 12, color: '#555555' }}>VAT</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#888', fontVariantNumeric: 'tabular-nums' }}>0.00 %</span>
                    <span style={{ fontSize: 12, color: '#111', fontVariantNumeric: 'tabular-nums' }}>0.00</span>
                  </div>
                </div>

                {/* Total */}
                <div style={{
                  ...chargeRowStyle,
                  background: '#F0F0F0',
                  borderTop: '1px solid #CCCCCC',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#111111' }}>Total</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111111', fontVariantNumeric: 'tabular-nums' }}>
                    {r.total_cost > 0 ? formatCurrency(r.total_cost, r.currency) : '—'}
                  </span>
                </div>

                <ChargeRow label="Commission"   value={r.commission_amount > 0 ? formatCurrency(r.commission_amount, r.currency) : '0.00'} color="#7B7B7B" />

                {/* Paid / Balance */}
                <div style={{ ...chargeRowStyle }}>
                  <span style={{ fontSize: 12, color: '#555555' }}>Paid / Balance</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                      {r.total_paid > 0 ? formatCurrency(r.total_paid, r.currency) : '0.00'}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: balance > 0 ? '#D97706' : '#059669', fontVariantNumeric: 'tabular-nums' }}>
                      {balance > 0 ? formatCurrency(balance, r.currency) : '0.00'}
                    </span>
                  </div>
                </div>

                {/* Payment progress bar */}
                {r.total_cost > 0 && (
                  <div style={{ padding: '7px 10px', borderTop: '1px solid #EEEEEE' }}>
                    <div style={{ height: 5, background: '#E8E8E8', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        width: `${Math.min(pct, 100)}%`,
                        background: pct >= 100 ? '#059669' : pct >= 50 ? '#1A6FC4' : '#D97706',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <p style={{ fontSize: 10, color: '#AAAAAA', textAlign: 'right', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                      {pct}% paid
                    </p>
                  </div>
                )}

                {/* Quick actions */}
                <div style={{
                  borderTop: '1px solid #DDDDDD',
                  background: '#F8F8F8',
                  padding: '5px 7px',
                  display: 'flex', flexDirection: 'column', gap: 3,
                }}>
                  {[
                    { label: 'Record Payment',       href: '#' },
                    { label: 'Send Invoice',         href: '#' },
                    { label: 'Build Itinerary',      href: `/reservations/${r.id}/itinerary` },
                    { label: 'Send Itinerary PDF',   href: '#' },
                    { label: 'Send WhatsApp Update', href: '#' },
                  ].map(({ label, href }) => (
                    <button
                      key={label}
                      onClick={() => href !== '#' && (window.location.href = href)}
                      style={{
                        textAlign: 'left', padding: '4px 6px',
                        background: 'none', border: '1px solid #D4D4D4',
                        borderRadius: 3, fontSize: 11,
                        color: href === '#' ? '#AAAAAA' : '#1A6FC4',
                        cursor: href === '#' ? 'default' : 'pointer',
                        fontFamily: 'inherit',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => {
                        if (href !== '#') (e.currentTarget as HTMLElement).style.background = '#EEF4FF';
                      }}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Payments tab ── */}
        {tab === 'payments' && <PaymentsTab r={r} />}

        {/* ── Supplier Bookings tab ── */}
        {tab === 'supplier_bookings' && <SupplierBookingsTab reservationId={id} currency={r.currency} />}

        {/* ── Cost & Margin tab ── */}
        {tab === 'costing' && <CostingTab reservationId={id} totalCost={r.total_cost} commission={r.commission_amount} currency={r.currency} />}

        {/* ── Documents tab ── */}
        {tab === 'documents' && (
          <div style={{ maxWidth: 760 }}>
            <DocumentsSection />
          </div>
        )}
      </div>

      {/* ── Remote Sign Modal ── */}
      {signOpen && (
        <RemoteSignModal
          reservation={r}
          onClose={() => setSignOpen(false)}
        />
      )}

      {/* ── Internal Notes — fixed top-right corner ── */}
      <div style={{
        position: 'fixed',
        top: '50%',
        transform: 'translateY(-50%)',
        right: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Toggle tab */}
        <button
          onClick={() => setNotesOpen(o => !o)}
          title="Internal Notes"
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            padding: '10px 6px',
            background: notesOpen ? '#B45309' : '#FEF3C7',
            border: '1px solid #E8D48A',
            borderRight: notesOpen ? 'none' : '1px solid #E8D48A',
            borderRadius: notesOpen ? '0 0 0 4px' : '4px 0 0 4px',
            color: notesOpen ? '#ffffff' : '#B45309',
            fontSize: 11, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 5,
            boxShadow: notesOpen ? 'none' : '-2px 2px 6px rgba(0,0,0,0.08)',
            transition: 'background 0.15s, color 0.15s',
            letterSpacing: '0.04em',
          }}
        >
          <Lock size={10} strokeWidth={2.5} style={{ transform: 'rotate(180deg)' }} />
          INTERNAL NOTES
        </button>

        {/* Panel */}
        {notesOpen && (
          <div style={{
            width: 288,
            maxHeight: 'calc(100vh - 48px)',
            display: 'flex',
            flexDirection: 'column',
            background: '#FFFDF5',
            border: '1px solid #E8D48A',
            borderTop: 'none',
            boxShadow: '-4px 4px 20px rgba(0,0,0,0.12)',
          }}>
            <InternalNotesPanel />
          </div>
        )}
      </div>
    </div>
  );
}
