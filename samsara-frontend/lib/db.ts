import fs from "fs";
import path from "path";

/* ─── SCHEMA ─────────────────────────────────────────────────────── */

export interface ReservationRecord {
  bookingRef: string;
  source: "experiences" | "feeling-engine";

  /* Experiences fields */
  experienceId?: string;
  experienceTitle?: string;
  experiencePrice?: number;
  experienceLocation?: string;
  experienceDuration?: string;
  addOnsTotal?: number;
  selectedAddOnsDetails?: Array<{ id: string; name: string; price: number }>;

  /* Feeling-engine fields */
  itineraryTitle?: string;
  itineraryDestination?: string;
  itineraryDuration?: string;
  itineraryNarrative?: string;

  form: {
    fullName: string;
    email: string;
    phone: string;
    travelers: string;
    travelDate: string;
    pickupLocation?: string;
    budgetPreference?: string;
    specialRequests?: string;
    selectedAddOns?: string[];
    notes?: string;
  };

  total: number;
  travelerCount?: number;

  status: string;       // pending | pending_payment | confirmed | in_progress | completed | cancelled
  paymentStatus: string; // unpaid | paid | refunded | failed

  type: "purchase" | "save";

  emailStatus: "pending" | "sent" | "failed" | "skipped";
  emailSentAt?: string;
  emailError?: string;

  createdAt: string;
  updatedAt: string;
}

/* ─── FILE IO ────────────────────────────────────────────────────── */

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH  = path.join(DATA_DIR, "reservations.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function readAll(): ReservationRecord[] {
  ensureDir();
  if (!fs.existsSync(DB_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as ReservationRecord[];
  } catch {
    return [];
  }
}

function persist(records: ReservationRecord[]) {
  ensureDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(records, null, 2), "utf-8");
}

export function insertRecord(record: ReservationRecord): void {
  const records = readAll();
  // Prevent duplicate bookingRef
  if (records.some((r) => r.bookingRef === record.bookingRef)) return;
  records.unshift(record);
  persist(records);
}

export function updateRecord(bookingRef: string, patch: Partial<ReservationRecord>): ReservationRecord | null {
  const records = readAll();
  const idx = records.findIndex((r) => r.bookingRef === bookingRef);
  if (idx === -1) return null;
  records[idx] = { ...records[idx], ...patch, updatedAt: new Date().toISOString() };
  persist(records);
  return records[idx];
}

export function deleteRecord(bookingRef: string): boolean {
  const records = readAll();
  const next = records.filter((r) => r.bookingRef !== bookingRef);
  if (next.length === records.length) return false;
  persist(next);
  return true;
}
