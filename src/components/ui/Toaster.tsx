'use client';

import { useState, useEffect } from 'react';
import { subscribe, dismiss, type ToastItem } from '@/lib/toast';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const CFG = {
  success: { icon: CheckCircle,    bg: '#F0FDF4', border: '#86EFAC', text: '#166534', icon_color: '#16A34A' },
  error:   { icon: AlertCircle,    bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', icon_color: '#DC2626' },
  warning: { icon: AlertTriangle,  bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', icon_color: '#D97706' },
  info:    { icon: Info,           bg: '#EFF6FF', border: '#BFDBFE', text: '#1E3A8A', icon_color: '#2563EB' },
};

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const cfg = CFG[item.type];
  const Icon = cfg.icon;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 14px',
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      maxWidth: 340, minWidth: 260,
      animation: 'toast-in 0.2s ease-out',
    }}>
      <Icon size={16} color={cfg.icon_color} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1, fontSize: 13, color: cfg.text, lineHeight: 1.45, fontWeight: 500 }}>
        {item.message}
      </span>
      <button
        onClick={onDismiss}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          color: cfg.text, opacity: 0.5, display: 'flex', flexShrink: 0,
          transition: 'opacity 0.1s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => subscribe(setItems), []);

  if (items.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: 20, right: 20,
        display: 'flex', flexDirection: 'column', gap: 8,
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {items.map(item => (
          <div key={item.id} style={{ pointerEvents: 'auto' }}>
            <Toast item={item} onDismiss={() => dismiss(item.id)} />
          </div>
        ))}
      </div>
    </>
  );
}
