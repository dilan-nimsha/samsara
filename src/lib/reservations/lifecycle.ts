// ─── RESERVATION LIFECYCLE STATE MACHINE ───────────────────────────────────────
// Single source of truth for which status changes are allowed and what must be
// true before a reservation may advance. Used by both the API (enforcement) and
// the UI (showing the next step + why it is blocked).

import type { ReservationStatus } from '@/types';

// ── Ordered pipeline (the "happy path") ────────────────────────────────────────
export const STAGES: { key: ReservationStatus; label: string }[] = [
  { key: 'enquiry',      label: 'Enquiry' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'confirmed',    label: 'Confirmed' },
  { key: 'invoice_sent', label: 'Invoiced' },
  { key: 'paid',         label: 'Paid' },
  { key: 'trip_active',  label: 'Active' },
  { key: 'completed',    label: 'Completed' },
];

export const STAGE_ORDER: ReservationStatus[] = STAGES.map(s => s.key);

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  enquiry:          'Enquiry',
  under_review:     'Under Review',
  confirmed:        'Confirmed',
  invoice_sent:     'Invoiced',
  paid:             'Paid',
  trip_active:      'Active',
  completed:        'Completed',
  cancelled:        'Cancelled',
  feedback_pending: 'Feedback Pending',
};

// ── Allowed transitions ─────────────────────────────────────────────────────────
// A status may move forward one step, step back one step (corrections), be
// cancelled from any live stage, or branch into the post-trip states.
export const TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  enquiry:          ['under_review', 'cancelled'],
  under_review:     ['confirmed', 'enquiry', 'cancelled'],
  confirmed:        ['invoice_sent', 'under_review', 'cancelled'],
  invoice_sent:     ['paid', 'confirmed', 'cancelled'],
  paid:             ['trip_active', 'invoice_sent', 'cancelled'],
  trip_active:      ['completed', 'cancelled'],
  completed:        ['feedback_pending', 'trip_active'],
  feedback_pending: ['completed'],
  cancelled:        ['enquiry'], // allow re-opening a cancelled enquiry
};

// Minimal shape the entry gates need. Kept loose so both mock and live
// reservation objects satisfy it.
export interface LifecycleReservation {
  status: ReservationStatus;
  client_id?: string | null;
  arrival_date?: string | null;
  departure_date?: string | null;
  total_cost?: number | null;
  total_paid?: number | null;
  destinations?: string[] | null;
  accommodations?: unknown[] | null;
  itinerary_days?: unknown[] | null;
}

export function canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function isForward(from: ReservationStatus, to: ReservationStatus): boolean {
  const a = STAGE_ORDER.indexOf(from);
  const b = STAGE_ORDER.indexOf(to);
  return a !== -1 && b !== -1 && b > a;
}

// The next stage on the happy path (null if at the end or off-pipeline).
export function nextStage(status: ReservationStatus): ReservationStatus | null {
  const i = STAGE_ORDER.indexOf(status);
  if (i === -1 || i >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[i + 1];
}

// ── Entry gates ─────────────────────────────────────────────────────────────────
// Returns the list of unmet requirements for moving INTO `target`. Empty array
// means the move is allowed. Gates only apply to forward moves on the pipeline —
// corrections (stepping back) and cancellation are never gated.
export function getBlockers(r: LifecycleReservation, target: ReservationStatus): string[] {
  if (target === 'cancelled') return [];
  if (!isForward(r.status, target)) return [];

  const blockers: string[] = [];
  const hasItinerary =
    (r.accommodations?.length ?? 0) > 0 || (r.itinerary_days?.length ?? 0) > 0;
  const hasDestinations = (r.destinations?.length ?? 0) > 0;
  const totalCost = r.total_cost ?? 0;
  const totalPaid = r.total_paid ?? 0;
  const balance   = totalCost - totalPaid;

  switch (target) {
    case 'under_review':
      if (!r.client_id)        blockers.push('A client must be assigned.');
      if (!r.arrival_date)     blockers.push('Arrival date is required.');
      if (!r.departure_date)   blockers.push('Departure date is required.');
      break;

    case 'confirmed':
      // A real booking has at least one of: an itinerary, a priced trip, or
      // destinations. Web/purchased reservations satisfy this via cost/destinations,
      // so they no longer require a manually-built itinerary first.
      if (!hasItinerary && totalCost <= 0 && !hasDestinations)
        blockers.push('Add an itinerary, destinations, or a trip cost before confirming.');
      break;

    case 'invoice_sent':
      if (totalCost <= 0)
        blockers.push('Set the trip total cost before sending an invoice.');
      break;

    case 'paid':
      if (totalCost <= 0)      blockers.push('No invoice total has been set.');
      else if (balance > 0)
        blockers.push(`Outstanding balance of ${balance.toFixed(2)} must be settled.`);
      break;

    case 'trip_active':
      // No hard gate — ops may activate early for arrivals. Soft-warned in UI.
      break;

    case 'completed':
      // No hard gate — allow closing trips manually.
      break;
  }

  return blockers;
}

// Convenience: is a specific transition permitted right now (graph + gates)?
export function evaluateTransition(
  r: LifecycleReservation,
  target: ReservationStatus,
): { allowed: boolean; reason?: string; blockers: string[] } {
  if (!canTransition(r.status, target)) {
    return {
      allowed: false,
      reason: `Cannot move from "${STATUS_LABELS[r.status]}" to "${STATUS_LABELS[target]}".`,
      blockers: [],
    };
  }
  const blockers = getBlockers(r, target);
  if (blockers.length > 0) {
    return { allowed: false, reason: 'Requirements not met for this stage.', blockers };
  }
  return { allowed: true, blockers: [] };
}
