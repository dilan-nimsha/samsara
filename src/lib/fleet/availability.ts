// ─── FLEET / GUIDE AVAILABILITY ─────────────────────────────────────────────────
// Pure functions for detecting resource double-bookings via date-range overlap.
// Dates are ISO 'YYYY-MM-DD' strings, which compare correctly lexicographically.

export type ResourceType = 'vehicle' | 'driver' | 'guide';

export interface Assignment {
  id: string;
  reservation_id?: string | null;
  resource_type: ResourceType;
  resource_id: string;
  start_date: string;
  end_date: string;
  pickup_time?: string | null;
  pickup_location?: string | null;
  flight_number?: string | null;
  pax_count?: number | null;
}

// Two inclusive date ranges overlap iff each starts on/before the other ends.
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

// Does an assignment span the given date?
export function coversDate(a: Pick<Assignment, 'start_date' | 'end_date'>, date: string): boolean {
  return a.start_date <= date && a.end_date >= date;
}

// Assignments for the same resource whose range overlaps [start, end].
// `excludeId` lets an assignment be re-saved without conflicting with itself.
export function findConflicts(
  existing: Assignment[],
  resourceType: ResourceType,
  resourceId: string,
  start: string,
  end: string,
  excludeId?: string,
): Assignment[] {
  return existing.filter(a =>
    a.resource_type === resourceType &&
    a.resource_id === resourceId &&
    a.id !== excludeId &&
    rangesOverlap(a.start_date, a.end_date, start, end),
  );
}

// True when the resource has no overlapping assignment in the window.
export function isResourceFree(
  existing: Assignment[],
  resourceType: ResourceType,
  resourceId: string,
  start: string,
  end: string,
  excludeId?: string,
): boolean {
  return findConflicts(existing, resourceType, resourceId, start, end, excludeId).length === 0;
}
