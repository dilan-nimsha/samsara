"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

/* ─── TYPES ─────────────────────────────────────────────────────────── */

interface BookingInfo {
  reference: string;
  clientName: string;
  arrivalDate: string;
  departureDate: string;
  destinations: string[];
  numAdults: number;
  numChildren: number;
  numInfants: number;
  totalCost: number;
  currency: string;
  pickupLocation: string;
  flightArrival: string;
  flightDeparture: string;
}

interface PersonalData {
  full_name: string;
  date_of_birth: string;
  nationality: string;
  passport_number: string;
  passport_expiry: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

interface FlightData {
  flight_arrival: string;
  arrival_datetime: string;
  flight_departure: string;
  departure_datetime: string;
}

interface PickupData {
  pickup_location: string;
  pickup_time: string;
  dropoff_location: string;
  special_requests: string;
  dietary_requirements: string;
}

interface UploadedDoc {
  field: "passport" | "driving_licence" | "booking_confirmation" | "other";
  label: string;
  name: string;
  size: number;
  type: string;
  data: string;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_LABELS = [
  "Your Booking",
  "Personal Details",
  "Flight Details",
  "Pickup & Drop-off",
  "Documents",
  "Confirm",
];

const DOC_TYPES: { field: UploadedDoc["field"]; label: string; required: boolean; hint: string }[] = [
  { field: "passport",             label: "Passport",              required: true,  hint: "Photo page showing your name, photo, and expiry date" },
  { field: "driving_licence",      label: "Driving Licence",       required: false, hint: "If you plan to drive — front and back" },
  { field: "booking_confirmation", label: "Booking Confirmation",  required: false, hint: "Your original booking confirmation email or PDF" },
];

/* ─── HELPERS ────────────────────────────────────────────────────────── */

function fmtDate(d: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return d; }
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/* ─── COMPONENT ─────────────────────────────────────────────────────── */

export default function CheckInPage() {
  const params = useSearchParams();
  const ref = params.get("ref") ?? "";

  const [step, setStep] = useState<Step>(1);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [refInput, setRefInput] = useState(ref);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  const [personal, setPersonal] = useState<PersonalData>({
    full_name: "", date_of_birth: "", nationality: "",
    passport_number: "", passport_expiry: "",
    emergency_contact_name: "", emergency_contact_phone: "",
  });

  const [flights, setFlights] = useState<FlightData>({
    flight_arrival: "", arrival_datetime: "",
    flight_departure: "", departure_datetime: "",
  });

  const [pickup, setPickup] = useState<PickupData>({
    pickup_location: "", pickup_time: "",
    dropoff_location: "", special_requests: "", dietary_requirements: "",
  });

  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const topRef = useRef<HTMLDivElement>(null);

  // Auto-lookup on mount if ref in URL
  useEffect(() => {
    if (ref) fetchBooking(ref);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [step]);

  async function fetchBooking(reference: string) {
    setLoadingBooking(true);
    setBookingError("");
    try {
      const res = await fetch(`/api/check-in?ref=${encodeURIComponent(reference.trim().toUpperCase())}`);
      const data = await res.json() as { success: boolean; booking?: BookingInfo; error?: string };
      if (!data.success || !data.booking) {
        setBookingError(data.error ?? "Booking not found. Please check your reference.");
        return;
      }
      const b = data.booking;
      setBooking(b);
      setPersonal(p => ({ ...p, full_name: b.clientName }));
      setFlights(f => ({
        ...f,
        flight_arrival: b.flightArrival ?? "",
        flight_departure: b.flightDeparture ?? "",
        arrival_datetime: b.arrivalDate ? b.arrivalDate + "T00:00" : "",
        departure_datetime: b.departureDate ? b.departureDate + "T00:00" : "",
      }));
      setPickup(p => ({ ...p, pickup_location: b.pickupLocation ?? "" }));
    } catch {
      setBookingError("Could not reach the booking system. Please try again.");
    } finally {
      setLoadingBooking(false);
    }
  }

  async function handleFileSelect(field: UploadedDoc["field"], label: string, file: File) {
    if (file.size > 10 * 1024 * 1024) { alert("File must be under 10 MB."); return; }
    setUploading(field);
    try {
      const data = await toBase64(file);
      setDocs(prev => {
        const filtered = prev.filter(d => d.field !== field);
        return [...filtered, { field, label, name: file.name, size: file.size, type: file.type, data }];
      });
    } catch { alert("Could not read file. Please try again."); }
    finally { setUploading(null); }
  }

  const handleRemoveDoc = useCallback((field: string) => {
    setDocs(prev => prev.filter(d => d.field !== field));
    if (fileRefs.current[field]) fileRefs.current[field]!.value = "";
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: booking!.reference,
          personal,
          flights,
          pickup,
          documents: docs.map(d => ({ field: d.field, label: d.label, name: d.name, type: d.type, data: d.data })),
        }),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (!data.success) throw new Error(data.error ?? "Submission failed");
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const canNext: Record<Step, boolean> = {
    1: !!booking,
    2: !!(personal.full_name && personal.date_of_birth && personal.nationality && personal.passport_number && personal.passport_expiry),
    3: true,
    4: !!pickup.pickup_location,
    5: docs.some(d => d.field === "passport"),
    6: true,
  };

  /* ── Styles ── */
  const s = {
    page:    { minHeight: "100vh", background: "#F5F2EB", fontFamily: "'TT Fors', Arial, sans-serif" } as React.CSSProperties,
    inner:   { maxWidth: 660, margin: "0 auto", padding: "0 16px 80px" } as React.CSSProperties,
    card:    { background: "#ffffff", borderRadius: 4, border: "1px solid #EDE8DC", overflow: "hidden", marginBottom: 12 } as React.CSSProperties,
    sHead:   { background: "#FAFAF6", borderBottom: "1px solid #EDE8DC", padding: "10px 20px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#B8902A" },
    row:     { display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 20px", borderBottom: "1px solid #F5F2EB" } as React.CSSProperties,
    label:   { fontSize: 11, color: "#8a8070", width: 150, flexShrink: 0, paddingTop: 9 } as React.CSSProperties,
    inp:     { flex: 1, fontSize: 13, padding: "7px 10px", border: "1px solid #DDD8CC", borderRadius: 3, background: "#FFFEF9", outline: "none", fontFamily: "inherit", color: "#1a1410", width: "100%" } as React.CSSProperties,
    btnPrim: { background: "#C9A84C", color: "#080808", border: "none", borderRadius: 3, padding: "12px 28px", fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "inherit" },
    btnSec:  { background: "none", color: "#8a8070", border: "1px solid #DDD8CC", borderRadius: 3, padding: "11px 24px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  };

  /* ─── DONE STATE ─── */
  if (done) return (
    <div style={s.page}>
      <div style={{ ...s.inner, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>✓</div>
        <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "#B8902A", textTransform: "uppercase", margin: "0 0 10px" }}>Check-In Complete</p>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 28, color: "#1a1410", margin: "0 0 8px" }}>You're all set.</p>
        <p style={{ fontSize: 14, color: "#8a8070", margin: "0 0 6px" }}>
          Booking <strong style={{ color: "#1a1410" }}>{booking?.reference}</strong>
        </p>
        <p style={{ fontSize: 13, color: "#8a8070", margin: "0 0 36px", maxWidth: 380, lineHeight: 1.7 }}>
          Your check-in information has been received. A Samsara representative will meet you upon arrival.
        </p>
        <Link href="/" style={{ ...s.btnPrim, textDecoration: "none", display: "inline-block" }}>
          Back to Samsara
        </Link>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{`
        input:focus, textarea:focus, select:focus { border-color: #C9A84C !important; box-shadow: 0 0 0 2px rgba(201,168,76,0.12); }
        input::placeholder, textarea::placeholder { color: #c8c0b0; }
        @media (max-width: 520px) { .ci-step-label { display: none; } }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: "#080808", padding: "18px 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 660, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: "#C9A84C", fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", margin: "0 0 2px" }}>INTO THE WILD</p>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#F2EDE4", margin: 0, letterSpacing: "0.2em" }}>SAMSARA</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: "0 0 2px", letterSpacing: "0.1em" }}>ONLINE CHECK-IN</p>
            {booking && <p style={{ fontSize: 12, color: "#C9A84C", margin: 0, fontWeight: 700 }}>{booking.reference}</p>}
          </div>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #EDE8DC", padding: "16px 24px" }}>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {STEP_LABELS.map((label, i) => {
              const n = (i + 1) as Step;
              const done_s = n < step;
              const active = n === step;
              return (
                <div key={n} style={{ display: "flex", alignItems: "center", flex: n < 6 ? 1 : "unset" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: done_s ? "#C9A84C" : active ? "#1a1410" : "#F0EBE0",
                      border: `2px solid ${done_s ? "#C9A84C" : active ? "#1a1410" : "#DDD8CC"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700,
                      color: done_s ? "#080808" : active ? "#C9A84C" : "#8a8070",
                      flexShrink: 0, transition: "all 0.2s",
                    }}>
                      {done_s ? "✓" : n}
                    </div>
                    <span className="ci-step-label" style={{
                      fontSize: 9, letterSpacing: "0.08em", whiteSpace: "nowrap",
                      color: active ? "#1a1410" : done_s ? "#C9A84C" : "#c8c0b0",
                      fontWeight: active ? 700 : 400, textTransform: "uppercase",
                    }}>{label}</span>
                  </div>
                  {n < 6 && (
                    <div style={{ flex: 1, height: 1, background: done_s ? "#C9A84C" : "#DDD8CC", margin: "0 4px", marginBottom: 18, transition: "background 0.3s" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={s.inner} ref={topRef}>
        <div style={{ height: 24 }} />

        {/* ══════════════════════════════════════════ */}
        {/* STEP 1 — Booking Lookup                   */}
        {/* ══════════════════════════════════════════ */}
        {step === 1 && (
          <>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "#B8902A", textTransform: "uppercase", margin: "0 0 6px" }}>Step 1 of 5</p>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#1a1410", margin: "0 0 6px" }}>Your Booking</p>
              <p style={{ fontSize: 13, color: "#8a8070", margin: 0 }}>We'll retrieve your reservation details to get started.</p>
            </div>

            {!booking && (
              <div style={s.card}>
                <div style={s.sHead}>Booking Reference</div>
                <div style={{ padding: "20px" }}>
                  <p style={{ fontSize: 13, color: "#5a5248", margin: "0 0 14px", lineHeight: 1.6 }}>
                    Enter the booking reference from your confirmation email (e.g. <strong>ITW-2026-9285</strong>).
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input
                      type="text"
                      value={refInput}
                      onChange={e => setRefInput(e.target.value.toUpperCase())}
                      placeholder="ITW-2026-XXXX"
                      style={{ ...s.inp, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", flexShrink: 1 }}
                      onKeyDown={e => { if (e.key === "Enter") fetchBooking(refInput); }}
                    />
                    <button
                      onClick={() => fetchBooking(refInput)}
                      disabled={loadingBooking || !refInput.trim()}
                      style={{ ...s.btnPrim, flexShrink: 0, opacity: loadingBooking ? 0.6 : 1 }}
                    >
                      {loadingBooking ? "Looking…" : "Find"}
                    </button>
                  </div>
                  {bookingError && (
                    <p style={{ fontSize: 12, color: "#c0392b", margin: "10px 0 0" }}>{bookingError}</p>
                  )}
                </div>
              </div>
            )}

            {booking && (
              <div style={s.card}>
                <div style={s.sHead}>Reservation Found</div>
                {[
                  ["Reference",   booking.reference],
                  ["Guest",       booking.clientName],
                  ["Arrival",     fmtDate(booking.arrivalDate)],
                  ["Departure",   fmtDate(booking.departureDate)],
                  ["Destinations", booking.destinations.join(" · ")],
                  ["Travellers",  [booking.numAdults && `${booking.numAdults} adult${booking.numAdults > 1 ? "s" : ""}`, booking.numChildren && `${booking.numChildren} child${booking.numChildren > 1 ? "ren" : ""}`, booking.numInfants && `${booking.numInfants} infant${booking.numInfants > 1 ? "s" : ""}`].filter(Boolean).join(", ")],
                  ["Total",       `${booking.currency} ${booking.totalCost.toLocaleString()}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", padding: "9px 20px", borderBottom: "1px solid #F5F2EB" }}>
                    <span style={{ fontSize: 11, color: "#8a8070", width: 120, flexShrink: 0 }}>{k}</span>
                    <span style={{ fontSize: 13, color: "#1a1410", fontWeight: k === "Reference" ? 700 : 400 }}>{v || "—"}</span>
                  </div>
                ))}
                <div style={{ padding: "10px 20px" }}>
                  <button
                    onClick={() => { setBooking(null); setRefInput(""); }}
                    style={{ fontSize: 11, color: "#8a8070", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                  >
                    Not your booking? Search again
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════ */}
        {/* STEP 2 — Personal Details                 */}
        {/* ══════════════════════════════════════════ */}
        {step === 2 && (
          <>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "#B8902A", textTransform: "uppercase", margin: "0 0 6px" }}>Step 2 of 5</p>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#1a1410", margin: "0 0 6px" }}>Personal Details</p>
              <p style={{ fontSize: 13, color: "#8a8070", margin: 0 }}>Enter your details exactly as they appear on your passport.</p>
            </div>

            <div style={s.card}>
              <div style={s.sHead}>Traveller Information</div>
              {([
                ["Full Name *",           "full_name",       "text",  "As shown on passport"],
                ["Date of Birth *",       "date_of_birth",   "date",  ""],
                ["Nationality *",         "nationality",     "text",  "e.g. British, American"],
                ["Passport Number *",     "passport_number", "text",  "e.g. AB1234567"],
                ["Passport Expiry *",     "passport_expiry", "date",  "Must be valid for 6+ months after travel"],
              ] as [string, keyof PersonalData, string, string][]).map(([label, field, type, hint]) => (
                <div key={field} style={s.row}>
                  <label style={s.label}>{label}</label>
                  <div style={{ flex: 1 }}>
                    <input
                      type={type}
                      value={personal[field]}
                      onChange={e => setPersonal(p => ({ ...p, [field]: e.target.value }))}
                      placeholder={hint}
                      style={s.inp}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={s.card}>
              <div style={s.sHead}>Emergency Contact</div>
              {([
                ["Contact Name",  "emergency_contact_name",  "text", "Full name"],
                ["Contact Phone", "emergency_contact_phone", "tel",  "+44 7700 000000"],
              ] as [string, keyof PersonalData, string, string][]).map(([label, field, type, placeholder]) => (
                <div key={field} style={s.row}>
                  <label style={s.label}>{label}</label>
                  <div style={{ flex: 1 }}>
                    <input
                      type={type}
                      value={personal[field]}
                      onChange={e => setPersonal(p => ({ ...p, [field]: e.target.value }))}
                      placeholder={placeholder}
                      style={s.inp}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════ */}
        {/* STEP 3 — Flight Details                   */}
        {/* ══════════════════════════════════════════ */}
        {step === 3 && (
          <>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "#B8902A", textTransform: "uppercase", margin: "0 0 6px" }}>Step 3 of 5</p>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#1a1410", margin: "0 0 6px" }}>Flight Details</p>
              <p style={{ fontSize: 13, color: "#8a8070", margin: 0 }}>We use this to arrange your airport meet-and-greet.</p>
            </div>

            <div style={s.card}>
              <div style={s.sHead}>Arrival Flight</div>
              {([
                ["Flight Number",   "flight_arrival",   "text",           "e.g. EK 651"],
                ["Arrival Date/Time", "arrival_datetime", "datetime-local", ""],
              ] as [string, keyof FlightData, string, string][]).map(([label, field, type, placeholder]) => (
                <div key={field} style={s.row}>
                  <label style={s.label}>{label}</label>
                  <div style={{ flex: 1 }}>
                    <input
                      type={type}
                      value={flights[field]}
                      onChange={e => setFlights(f => ({ ...f, [field]: e.target.value }))}
                      placeholder={placeholder}
                      style={s.inp}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={s.card}>
              <div style={s.sHead}>Departure Flight</div>
              {([
                ["Flight Number",      "flight_departure",   "text",           "e.g. EK 652"],
                ["Departure Date/Time","departure_datetime", "datetime-local",  ""],
              ] as [string, keyof FlightData, string, string][]).map(([label, field, type, placeholder]) => (
                <div key={field} style={s.row}>
                  <label style={s.label}>{label}</label>
                  <div style={{ flex: 1 }}>
                    <input
                      type={type}
                      value={flights[field]}
                      onChange={e => setFlights(f => ({ ...f, [field]: e.target.value }))}
                      placeholder={placeholder}
                      style={s.inp}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════ */}
        {/* STEP 4 — Pickup & Drop-off                */}
        {/* ══════════════════════════════════════════ */}
        {step === 4 && (
          <>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "#B8902A", textTransform: "uppercase", margin: "0 0 6px" }}>Step 4 of 5</p>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#1a1410", margin: "0 0 6px" }}>Pickup & Drop-off</p>
              <p style={{ fontSize: 13, color: "#8a8070", margin: 0 }}>Tell us where and when you need to be picked up.</p>
            </div>

            <div style={s.card}>
              <div style={s.sHead}>Pickup Details</div>
              <div style={s.row}>
                <label style={s.label}>Pickup Location *</label>
                <div style={{ flex: 1 }}>
                  <select
                    value={pickup.pickup_location}
                    onChange={e => setPickup(p => ({ ...p, pickup_location: e.target.value }))}
                    style={{ ...s.inp, cursor: "pointer" }}
                  >
                    <option value="">Select location…</option>
                    <option value="Colombo Bandaranaike International Airport">Colombo Bandaranaike International Airport</option>
                    <option value="Colombo City Centre">Colombo City Centre</option>
                    <option value="Negombo">Negombo</option>
                    <option value="Kandy">Kandy</option>
                    <option value="Galle">Galle</option>
                    <option value="Ella">Ella</option>
                    <option value="Other">Other (specify in notes)</option>
                  </select>
                </div>
              </div>
              <div style={s.row}>
                <label style={s.label}>Preferred Pickup Time</label>
                <div style={{ flex: 1 }}>
                  <input
                    type="time"
                    value={pickup.pickup_time}
                    onChange={e => setPickup(p => ({ ...p, pickup_time: e.target.value }))}
                    style={s.inp}
                  />
                </div>
              </div>
              <div style={s.row}>
                <label style={s.label}>Drop-off Location</label>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={pickup.dropoff_location}
                    onChange={e => setPickup(p => ({ ...p, dropoff_location: e.target.value }))}
                    placeholder="Hotel name or address"
                    style={s.inp}
                  />
                </div>
              </div>
            </div>

            <div style={s.card}>
              <div style={s.sHead}>Additional Preferences</div>
              <div style={s.row}>
                <label style={s.label}>Special Requests</label>
                <div style={{ flex: 1 }}>
                  <textarea
                    value={pickup.special_requests}
                    onChange={e => setPickup(p => ({ ...p, special_requests: e.target.value }))}
                    placeholder="Child seat, wheelchair access, extra luggage, etc."
                    rows={3}
                    style={{ ...s.inp, height: "auto", resize: "vertical" as const }}
                  />
                </div>
              </div>
              <div style={s.row}>
                <label style={s.label}>Dietary Requirements</label>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={pickup.dietary_requirements}
                    onChange={e => setPickup(p => ({ ...p, dietary_requirements: e.target.value }))}
                    placeholder="Vegetarian, vegan, halal, allergies, etc."
                    style={s.inp}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════ */}
        {/* STEP 5 — Documents                        */}
        {/* ══════════════════════════════════════════ */}
        {step === 5 && (
          <>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "#B8902A", textTransform: "uppercase", margin: "0 0 6px" }}>Step 5 of 5</p>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#1a1410", margin: "0 0 6px" }}>Upload Documents</p>
              <p style={{ fontSize: 13, color: "#8a8070", margin: 0 }}>Securely upload your documents. Passport is required — others are optional.</p>
            </div>

            {DOC_TYPES.map(({ field, label, required, hint }) => {
              const uploaded = docs.find(d => d.field === field);
              return (
                <div key={field} style={{ ...s.card, marginBottom: 12 }}>
                  <div style={{ ...s.sHead, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{label}{required ? " *" : ""}</span>
                    {uploaded && (
                      <span style={{ fontSize: 10, color: "#2D6A2D", fontWeight: 700 }}>✓ Uploaded</span>
                    )}
                  </div>
                  <div style={{ padding: "16px 20px" }}>
                    <p style={{ fontSize: 12, color: "#8a8070", margin: "0 0 12px" }}>{hint}</p>

                    {uploaded ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F5FBF5", border: "1px solid #C3E0C3", borderRadius: 3, padding: "10px 14px" }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#1a1410", margin: "0 0 2px" }}>{uploaded.name}</p>
                          <p style={{ fontSize: 11, color: "#8a8070", margin: 0 }}>{(uploaded.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button
                          onClick={() => handleRemoveDoc(field)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#c0392b", fontSize: 11, padding: 0 }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileRefs.current[field]?.click()}
                        style={{
                          border: "2px dashed #DDD8CC", borderRadius: 3, padding: "24px 16px",
                          textAlign: "center", cursor: "pointer", transition: "border-color 0.2s",
                          background: uploading === field ? "#FAFAF6" : "#FEFDFB",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "#C9A84C")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "#DDD8CC")}
                      >
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                        <p style={{ fontSize: 13, color: "#5a5248", margin: "0 0 4px", fontWeight: 500 }}>
                          {uploading === field ? "Reading file…" : "Click to upload"}
                        </p>
                        <p style={{ fontSize: 11, color: "#c8c0b0", margin: 0 }}>JPG, PNG, PDF — max 10 MB</p>
                      </div>
                    )}

                    <input
                      ref={el => { fileRefs.current[field] = el; }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      style={{ display: "none" }}
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file) await handleFileSelect(field, label, file);
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {!docs.some(d => d.field === "passport") && (
              <p style={{ fontSize: 12, color: "#c0392b", margin: "4px 0 0", padding: "0 4px" }}>
                Passport upload is required to proceed.
              </p>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════ */}
        {/* STEP 6 — Review & Confirm                 */}
        {/* ══════════════════════════════════════════ */}
        {step === 6 && (
          <>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "#B8902A", textTransform: "uppercase", margin: "0 0 6px" }}>Review</p>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#1a1410", margin: "0 0 6px" }}>Confirm Check-In</p>
              <p style={{ fontSize: 13, color: "#8a8070", margin: 0 }}>Please review your information before submitting.</p>
            </div>

            {/* Booking */}
            <div style={s.card}>
              <div style={s.sHead}>Booking</div>
              {[["Reference", booking?.reference], ["Guest", personal.full_name], ["Arrival", fmtDate(booking?.arrivalDate ?? "")], ["Departure", fmtDate(booking?.departureDate ?? "")]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", padding: "8px 20px", borderBottom: "1px solid #F5F2EB" }}>
                  <span style={{ fontSize: 11, color: "#8a8070", width: 130, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 13, color: "#1a1410" }}>{v || "—"}</span>
                </div>
              ))}
            </div>

            {/* Personal */}
            <div style={s.card}>
              <div style={{ ...s.sHead, display: "flex", justifyContent: "space-between" }}>
                <span>Personal Details</span>
                <button onClick={() => setStep(2)} style={{ fontSize: 10, color: "#B8902A", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Edit</button>
              </div>
              {[["Name", personal.full_name], ["Date of Birth", personal.date_of_birth], ["Nationality", personal.nationality], ["Passport", personal.passport_number], ["Expiry", personal.passport_expiry], personal.emergency_contact_name ? ["Emergency Contact", `${personal.emergency_contact_name} · ${personal.emergency_contact_phone}`] : null].filter((x): x is [string, string] => x !== null).map(([k, v]) => (
                <div key={k as string} style={{ display: "flex", padding: "8px 20px", borderBottom: "1px solid #F5F2EB" }}>
                  <span style={{ fontSize: 11, color: "#8a8070", width: 130, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 13, color: "#1a1410" }}>{v as string || "—"}</span>
                </div>
              ))}
            </div>

            {/* Flights */}
            <div style={s.card}>
              <div style={{ ...s.sHead, display: "flex", justifyContent: "space-between" }}>
                <span>Flight Details</span>
                <button onClick={() => setStep(3)} style={{ fontSize: 10, color: "#B8902A", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Edit</button>
              </div>
              {[["Arrival Flight", flights.flight_arrival], ["Arrival Time", flights.arrival_datetime?.replace("T", " ") || ""], ["Departure Flight", flights.flight_departure], ["Departure Time", flights.departure_datetime?.replace("T", " ") || ""]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", padding: "8px 20px", borderBottom: "1px solid #F5F2EB" }}>
                  <span style={{ fontSize: 11, color: "#8a8070", width: 130, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 13, color: "#1a1410" }}>{v || "—"}</span>
                </div>
              ))}
            </div>

            {/* Pickup */}
            <div style={s.card}>
              <div style={{ ...s.sHead, display: "flex", justifyContent: "space-between" }}>
                <span>Pickup & Drop-off</span>
                <button onClick={() => setStep(4)} style={{ fontSize: 10, color: "#B8902A", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Edit</button>
              </div>
              {[["Pickup", pickup.pickup_location], ["Pickup Time", pickup.pickup_time], ["Drop-off", pickup.dropoff_location], pickup.special_requests ? ["Requests", pickup.special_requests] : null, pickup.dietary_requirements ? ["Dietary", pickup.dietary_requirements] : null].filter((x): x is [string, string] => x !== null).map(([k, v]) => (
                <div key={k as string} style={{ display: "flex", padding: "8px 20px", borderBottom: "1px solid #F5F2EB" }}>
                  <span style={{ fontSize: 11, color: "#8a8070", width: 130, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 13, color: "#1a1410" }}>{v as string || "—"}</span>
                </div>
              ))}
            </div>

            {/* Docs */}
            <div style={s.card}>
              <div style={{ ...s.sHead, display: "flex", justifyContent: "space-between" }}>
                <span>Documents</span>
                <button onClick={() => setStep(5)} style={{ fontSize: 10, color: "#B8902A", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Edit</button>
              </div>
              {docs.length === 0 ? (
                <div style={{ padding: "12px 20px" }}>
                  <span style={{ fontSize: 13, color: "#8a8070" }}>No documents uploaded.</span>
                </div>
              ) : docs.map(d => (
                <div key={d.field} style={{ display: "flex", padding: "8px 20px", borderBottom: "1px solid #F5F2EB" }}>
                  <span style={{ fontSize: 11, color: "#8a8070", width: 130, flexShrink: 0 }}>{d.label}</span>
                  <span style={{ fontSize: 13, color: "#2D6A2D" }}>✓ {d.name}</span>
                </div>
              ))}
            </div>

            {submitError && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 3, padding: "12px 16px", marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: "#c0392b", margin: 0 }}>{submitError}</p>
              </div>
            )}

            <p style={{ fontSize: 11, color: "#8a8070", lineHeight: 1.6, margin: "0 0 16px" }}>
              By submitting, you confirm that all information provided is accurate and matches your travel documents.
            </p>
          </>
        )}

        {/* ── Navigation ── */}
        <div style={{ display: "flex", justifyContent: step === 1 ? "flex-end" : "space-between", gap: 12, marginTop: 8 }}>
          {step > 1 && (
            <button
              onClick={() => setStep(s => (s - 1) as Step)}
              style={s.btnSec}
            >
              ← Back
            </button>
          )}
          {step < 6 ? (
            <button
              onClick={() => setStep(s => (s + 1) as Step)}
              disabled={!canNext[step]}
              style={{ ...s.btnPrim, opacity: canNext[step] ? 1 : 0.4, cursor: canNext[step] ? "pointer" : "not-allowed" }}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ ...s.btnPrim, opacity: submitting ? 0.6 : 1, minWidth: 160 }}
            >
              {submitting ? "Submitting…" : "Submit Check-In"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
