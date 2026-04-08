import type { ReservationStatus, PaymentStatus, Currency } from '@/types';

export function formatCurrency(amount: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    GBP: '£', USD: '$', EUR: '€', LKR: 'Rs', CNY: '¥',
  };
  return `${symbols[currency]}${amount.toLocaleString()}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
  });
}

export function tripDuration(arrival: string, departure: string): number {
  const a = new Date(arrival);
  const d = new Date(departure);
  return Math.ceil((d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function generateReference(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `SAM-${year}-${num}`;
}

export const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  enquiry:          { label: 'Enquiry',        color: '#6B7280', bg: '#F3F4F6' },
  under_review:     { label: 'Under Review',   color: '#D97706', bg: '#FEF3C7' },
  confirmed:        { label: 'Confirmed',      color: '#059669', bg: '#D1FAE5' },
  invoice_sent:     { label: 'Invoice Sent',   color: '#2563EB', bg: '#DBEAFE' },
  paid:             { label: 'Paid',           color: '#7C3AED', bg: '#EDE9FE' },
  trip_active:      { label: 'Trip Active',    color: '#0891B2', bg: '#CFFAFE' },
  completed:        { label: 'Completed',      color: '#374151', bg: '#E5E7EB' },
  cancelled:        { label: 'Cancelled',      color: '#DC2626', bg: '#FEE2E2' },
  feedback_pending: { label: 'Feedback',       color: '#B45309', bg: '#FEF3C7' },
};

export const PAYMENT_CONFIG: Record<PaymentStatus, { label: string; color: string }> = {
  pending:  { label: 'Pending',  color: '#6B7280' },
  partial:  { label: 'Partial',  color: '#D97706' },
  paid:     { label: 'Paid',     color: '#059669' },
  overdue:  { label: 'Overdue',  color: '#DC2626' },
  refunded: { label: 'Refunded', color: '#7C3AED' },
};

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
