"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { ReservationRecord } from "@/lib/db";

/* ─── TYPES ──────────────────────────────────────────────────────── */

type FilterStatus = "all" | string;
type FilterType   = "all" | "purchase" | "save";
type FilterSource = "all" | "experiences" | "feeling-engine";

/* ─── CONSTANTS ──────────────────────────────────────────────────── */

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  pending:         { bg: "rgba(201,168,76,0.12)", color: "#E2C97E",  border: "rgba(201,168,76,0.3)" },
  pending_payment: { bg: "rgba(234,179,8,0.12)",  color: "#fbbf24",  border: "rgba(234,179,8,0.3)" },
  confirmed:       { bg: "rgba(34,197,94,0.12)",  color: "#4ade80",  border: "rgba(34,197,94,0.3)" },
  in_progress:     { bg: "rgba(99,102,241,0.12)", color: "#a5b4fc",  border: "rgba(99,102,241,0.3)" },
  completed:       { bg: "rgba(20,184,166,0.12)", color: "#2dd4bf",  border: "rgba(20,184,166,0.3)" },
  cancelled:       { bg: "rgba(239,68,68,0.12)",  color: "#f87171",  border: "rgba(239,68,68,0.3)" },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", pending_payment: "Pend. Payment",
  confirmed: "Confirmed", in_progress: "In Progress",
  completed: "Completed", cancelled: "Cancelled",
};

const PAYMENT_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  unpaid:   { bg: "rgba(239,68,68,0.1)",   color: "#f87171",  border: "rgba(239,68,68,0.25)" },
  paid:     { bg: "rgba(34,197,94,0.1)",   color: "#4ade80",  border: "rgba(34,197,94,0.25)" },
  refunded: { bg: "rgba(148,163,184,0.1)", color: "#94a3b8",  border: "rgba(148,163,184,0.25)" },
  failed:   { bg: "rgba(239,68,68,0.1)",   color: "#f87171",  border: "rgba(239,68,68,0.25)" },
};

const EMAIL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  sent:     { bg: "rgba(34,197,94,0.1)",   color: "#4ade80",  border: "rgba(34,197,94,0.25)" },
  failed:   { bg: "rgba(239,68,68,0.1)",   color: "#f87171",  border: "rgba(239,68,68,0.25)" },
  pending:  { bg: "rgba(201,168,76,0.1)",  color: "#E2C97E",  border: "rgba(201,168,76,0.25)" },
  skipped:  { bg: "rgba(100,100,100,0.1)", color: "#6b7280",  border: "rgba(100,100,100,0.25)" },
};

/* ─── HELPERS ────────────────────────────────────────────────────── */

function fmtDate(iso: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

function fmtDateTime(iso: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

/* ─── BADGE ──────────────────────────────────────────────────────── */

function Badge({ value, map, label }: { value: string; map: Record<string, { bg: string; color: string; border: string }>; label?: string }) {
  const s = map[value] ?? { bg: "rgba(255,255,255,0.06)", color: "#a89f92", border: "rgba(255,255,255,0.1)" };
  return (
    <span style={{ display: "inline-block", padding: "0.2rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap", borderRadius: "2px" }}>
      {label ?? (STATUS_LABELS[value] ?? value)}
    </span>
  );
}

/* ─── DETAIL DRAWER ──────────────────────────────────────────────── */

function DetailDrawer({
  r, onClose, onUpdate,
}: {
  r: ReservationRecord;
  onClose: () => void;
  onUpdate: (ref: string, patch: Partial<ReservationRecord>) => Promise<void>;
}) {
  const [status, setStatus]         = useState(r.status);
  const [payment, setPayment]       = useState(r.paymentStatus);
  const [saving, setSaving]         = useState(false);
  const dirty = status !== r.status || payment !== r.paymentStatus;

  async function save() {
    setSaving(true);
    await onUpdate(r.bookingRef, { status, paymentStatus: payment });
    setSaving(false);
  }

  const F = r.form;
  const isExp = r.source === "experiences";
  const title = isExp ? r.experienceTitle : r.itineraryTitle;
  const location = isExp ? r.experienceLocation : r.itineraryDestination;
  const addOns = r.selectedAddOnsDetails ?? [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", justifyContent: "flex-end" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
      <div
        style={{ position: "relative", zIndex: 1, width: "min(540px,100vw)", background: "#0f0f0f", borderLeft: "1px solid rgba(201,168,76,0.15)", overflowY: "auto", padding: "2.5rem 2rem", display: "flex", flexDirection: "column", gap: "2rem" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <p style={eyebrow}>Booking Reference</p>
            <h2 style={{ fontFamily: "''TT Fors', sans-serif", fontSize: "1.7rem", fontWeight: 300, color: "#E2C97E", margin: 0 }}>{r.bookingRef}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#a89f92", width: 36, height: 36, cursor: "pointer", fontSize: "1rem", flexShrink: 0 }}>✕</button>
        </div>

        <Divider />

        {/* Badges */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Badge value={r.type} map={{ purchase: STATUS_COLORS.confirmed, save: STATUS_COLORS.pending }} label={r.type === "purchase" ? "Purchase" : "Enquiry"} />
          <Badge value={r.source} map={{ experiences: STATUS_COLORS.in_progress, "feeling-engine": STATUS_COLORS.completed }} label={r.source === "experiences" ? "Experiences" : "Feelings Engine"} />
          <Badge value={r.status} map={STATUS_COLORS} />
          <Badge value={r.paymentStatus} map={PAYMENT_COLORS} label={r.paymentStatus.charAt(0).toUpperCase() + r.paymentStatus.slice(1)} />
        </div>

        {/* Experience / Itinerary */}
        <Section title={isExp ? "Experience" : "Itinerary"}>
          <p style={{ fontFamily: "''TT Fors', sans-serif", fontSize: "1.1rem", color: "#F2EDE4", margin: "0 0 0.4rem" }}>{title ?? "—"}</p>
          {location && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.72rem", color: "#a89f92" }}>◎ {location}</p>}
        </Section>

        {/* Guest */}
        <Section title="Guest Details">
          <DR label="Full Name"  value={F.fullName} />
          <DR label="Email"      value={F.email} />
          <DR label="Phone"      value={F.phone} />
          <DR label="Travellers" value={F.travelers} />
          <DR label="Travel Date" value={fmtDate(F.travelDate)} />
          {F.pickupLocation   && <DR label="Pickup"   value={F.pickupLocation} />}
          {F.budgetPreference && <DR label="Budget"   value={F.budgetPreference} />}
          {F.specialRequests  && <DR label="Requests" value={F.specialRequests} />}
          {F.notes            && <DR label="Notes"    value={F.notes} />}
        </Section>

        {/* Financials */}
        <Section title="Financials">
          {isExp && r.experiencePrice != null && <DR label="Base Price" value={`$${r.experiencePrice.toLocaleString()}`} />}
          {addOns.length > 0 && (
            <div style={{ padding: "0.45rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.7rem", color: "#a89f92" }}>Add-ons</span>
              {addOns.map((a) => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
                  <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.72rem", color: "#F2EDE4" }}>{a.name}</span>
                  <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.72rem", color: "#E2C97E" }}>${a.price}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#a89f92" }}>Total</span>
            <span style={{ fontFamily: "''TT Fors', sans-serif", fontSize: "1.5rem", color: "#E2C97E", fontWeight: 300 }}>${r.total.toLocaleString()}</span>
          </div>
        </Section>

        {/* Email */}
        <Section title="Email Confirmation">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <Badge value={r.emailStatus} map={EMAIL_COLORS} label={r.emailStatus.charAt(0).toUpperCase() + r.emailStatus.slice(1)} />
            {r.emailSentAt && <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.65rem", color: "#5a5650" }}>{fmtDateTime(r.emailSentAt)}</span>}
          </div>
          {r.emailError && (
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.67rem", color: "#f87171", marginTop: "0.5rem", lineHeight: 1.5 }}>{r.emailError}</p>
          )}
        </Section>

        {/* Status controls */}
        <Section title="Update Status">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <p style={eyebrow}>Booking Status</p>
              <select value={status} onChange={e => setStatus(e.target.value)} style={selectSt}>
                {["pending","pending_payment","confirmed","in_progress","completed","cancelled"].map(v => (
                  <option key={v} value={v}>{STATUS_LABELS[v] ?? v}</option>
                ))}
              </select>
            </div>
            <div>
              <p style={eyebrow}>Payment Status</p>
              <select value={payment} onChange={e => setPayment(e.target.value)} style={selectSt}>
                {["unpaid","paid","refunded","failed"].map(v => (
                  <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          {dirty && (
            <button onClick={save} disabled={saving} style={{ marginTop: "1rem", width: "100%", background: saving ? "rgba(201,168,76,0.4)" : "#C9A84C", color: "#080808", border: "none", padding: "0.85rem", fontFamily: "'Inter',sans-serif", fontSize: "0.7rem", letterSpacing: "0.16em", textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600 }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          )}
        </Section>

        {/* Meta */}
        <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <DR label="Created"  value={fmtDateTime(r.createdAt)} />
          <DR label="Updated"  value={fmtDateTime(r.updatedAt)} />
        </div>
      </div>
    </div>
  );
}

/* ─── SMALL COMPONENTS ───────────────────────────────────────────── */

const eyebrow: React.CSSProperties = { fontFamily: "'Inter',sans-serif", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#a89f92", margin: "0 0 0.35rem" };
const selectSt: React.CSSProperties = { width: "100%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#F2EDE4", padding: "0.6rem 0.8rem", fontFamily: "'Inter',sans-serif", fontSize: "0.78rem", cursor: "pointer", appearance: "none" };

function Divider() {
  return <div style={{ height: "1px", background: "rgba(201,168,76,0.12)", margin: 0 }} />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C9A84C", margin: "0 0 0.85rem", fontWeight: 600 }}>{title}</h3>
      {children}
    </section>
  );
}

function DR({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: "0.42rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.68rem", color: "#a89f92", flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.75rem", color: "#F2EDE4", textAlign: "right", wordBreak: "break-word" }}>{value || "—"}</span>
    </div>
  );
}

const tdSt: React.CSSProperties = { padding: "0.85rem 1rem", verticalAlign: "middle" };

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */

export default function ReservationsAdmin() {
  const [records, setRecords]         = useState<ReservationRecord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [lastFetch, setLastFetch]     = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterType, setFilterType]   = useState<FilterType>("all");
  const [filterSource, setFilterSource] = useState<FilterSource>("all");
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState<ReservationRecord | null>(null);
  const [sortField, setSortField]     = useState<"createdAt" | "total" | "travelDate">("createdAt");
  const [sortDir, setSortDir]         = useState<"asc" | "desc">("desc");

  const fetchBookings = useCallback(async () => {
    try {
      const res  = await fetch("/api/bookings");
      const data = await res.json() as { success: boolean; reservations?: ReservationRecord[] };
      if (data.success && data.reservations) {
        setRecords(data.reservations);
        setLastFetch(new Date());
      }
    } catch {
      // silent — stale data stays visible
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Auto-refresh every 30 s
  useEffect(() => {
    const id = setInterval(fetchBookings, 30_000);
    return () => clearInterval(id);
  }, [fetchBookings]);

  async function updateBooking(ref: string, patch: Partial<ReservationRecord>) {
    const res  = await fetch(`/api/bookings/${encodeURIComponent(ref)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json() as { success: boolean; reservation?: ReservationRecord };
    if (data.success && data.reservation) {
      setRecords(prev => prev.map(r => r.bookingRef === ref ? data.reservation! : r));
      setSelected(prev => prev?.bookingRef === ref ? data.reservation! : prev);
    }
  }

  async function deleteBooking(ref: string) {
    if (!confirm(`Delete reservation ${ref}? This cannot be undone.`)) return;
    const res  = await fetch(`/api/bookings/${encodeURIComponent(ref)}`, { method: "DELETE" });
    const data = await res.json() as { success: boolean };
    if (data.success) {
      setRecords(prev => prev.filter(r => r.bookingRef !== ref));
      if (selected?.bookingRef === ref) setSelected(null);
    }
  }

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterStatus !== "all") list = list.filter(r => r.status === filterStatus);
    if (filterType   !== "all") list = list.filter(r => r.type === filterType);
    if (filterSource !== "all") list = list.filter(r => r.source === filterSource);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r =>
        r.bookingRef.toLowerCase().includes(q) ||
        (r.experienceTitle ?? "").toLowerCase().includes(q) ||
        (r.itineraryTitle ?? "").toLowerCase().includes(q) ||
        r.form.fullName.toLowerCase().includes(q) ||
        r.form.email.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if      (sortField === "total")      { av = a.total;          bv = b.total; }
      else if (sortField === "travelDate") { av = a.form.travelDate ?? ""; bv = b.form.travelDate ?? ""; }
      else                                 { av = a.createdAt ?? ""; bv = b.createdAt ?? ""; }
      const c = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? c : -c;
    });
    return list;
  }, [records, filterStatus, filterType, filterSource, search, sortField, sortDir]);

  const stats = useMemo(() => ({
    total:     records.length,
    pending:   records.filter(r => r.status === "pending" || r.status === "pending_payment").length,
    confirmed: records.filter(r => r.status === "confirmed" || r.status === "in_progress").length,
    revenue:   records.filter(r => r.paymentStatus === "paid").reduce((s, r) => s + r.total, 0),
    pipeline:  records.filter(r => r.paymentStatus !== "paid" && r.status !== "cancelled").reduce((s, r) => s + r.total, 0),
    emailFail: records.filter(r => r.emailStatus === "failed").length,
  }), [records]);

  const SortBtn = ({ field }: { field: typeof sortField }) => (
    <button className="th-btn" onClick={() => toggleSort(field)}>
      <span style={{ opacity: sortField === field ? 1 : 0.35, fontSize: "0.55rem", marginLeft: "3px" }}>
        {sortField === field ? (sortDir === "asc" ? "▲" : "▼") : "▼"}
      </span>
    </button>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#080808;color:#F2EDE4}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#0f0f0f}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.3);border-radius:2px}
        .res-row{cursor:pointer;transition:background 0.2s}
        .res-row:hover{background:rgba(201,168,76,0.04)!important}
        .fbtn{background:none;border:1px solid rgba(255,255,255,0.1);color:#a89f92;padding:0.42rem 0.9rem;cursor:pointer;font-family:'Inter',sans-serif;font-size:0.62rem;letter-spacing:0.1em;text-transform:uppercase;transition:all 0.2s;white-space:nowrap}
        .fbtn:hover,.fbtn.on{border-color:rgba(201,168,76,0.4);color:#E2C97E;background:rgba(201,168,76,0.08)}
        .th-btn{background:none;border:none;color:#5a5650;cursor:pointer;padding:0;display:inline-flex;align-items:center;vertical-align:middle}
        .th-btn:hover{color:#E2C97E}
        @media(max-width:1100px){.stats-grid{grid-template-columns:repeat(3,1fr)!important}}
        @media(max-width:768px){.stats-grid{grid-template-columns:repeat(2,1fr)!important}.adm-table-wrap{overflow-x:auto}.filter-row{flex-direction:column!important;align-items:stretch!important}}
        @media(max-width:480px){.stats-grid{grid-template-columns:1fr!important}}
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080808", paddingBottom: "6rem" }}>

        {/* ── TOP BAR ── */}
        <div style={{ borderBottom: "1px solid rgba(201,168,76,0.12)", padding: "1.3rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.1rem" }}>
            <a href="/" style={{ textDecoration: "none" }}>
              <img src="/images/navbar logo.png" alt="Samsara" style={{ height: 36, objectFit: "contain" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            </a>
            <div style={{ width: 1, height: 26, background: "rgba(201,168,76,0.2)" }} />
            <div>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "0.1rem" }}>Admin</p>
              <h1 style={{ fontFamily: "''TT Fors', sans-serif", fontSize: "1.25rem", fontWeight: 300, color: "#F2EDE4" }}>Reservations Dashboard</h1>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            {lastFetch && (
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.6rem", color: "#3a3530" }}>
                Updated {lastFetch.toLocaleTimeString()}
              </span>
            )}
            <button onClick={fetchBookings} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#a89f92", padding: "0.5rem 1rem", fontFamily: "'Inter',sans-serif", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
              ↺ Refresh
            </button>
            <a href="/experiences" style={{ textDecoration: "none" }}>
              <button style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#a89f92", padding: "0.5rem 1rem", fontFamily: "'Inter',sans-serif", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                ← Experiences
              </button>
            </a>
            <a href="/feeling-engine" style={{ textDecoration: "none" }}>
              <button style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#a89f92", padding: "0.5rem 1rem", fontFamily: "'Inter',sans-serif", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                Feelings Engine
              </button>
            </a>
          </div>
        </div>

        <div style={{ padding: "2rem 2rem 0" }}>

          {/* ── STATS ── */}
          <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "1px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.08)", marginBottom: "2rem" }}>
            {[
              { label: "Total",     value: stats.total,                          accent: undefined },
              { label: "Pending",   value: stats.pending,                        accent: "#fbbf24" },
              { label: "Confirmed", value: stats.confirmed,                      accent: "#4ade80" },
              { label: "Revenue",   value: `$${stats.revenue.toLocaleString()}`, accent: "#E2C97E" },
              { label: "Pipeline",  value: `$${stats.pipeline.toLocaleString()}`,accent: undefined },
              { label: "Email Err", value: stats.emailFail,                      accent: stats.emailFail > 0 ? "#f87171" : undefined },
            ].map(({ label, value, accent }) => (
              <div key={label} style={{ background: "#0a0a0a", padding: "1.25rem 1.4rem" }}>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.58rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5a5650", marginBottom: "0.4rem" }}>{label}</p>
                <p style={{ fontFamily: "''TT Fors', sans-serif", fontSize: "1.9rem", fontWeight: 300, color: accent ?? "#F2EDE4", lineHeight: 1 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* ── FILTERS ── */}
          <div className="filter-row" style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#3a3530", fontSize: "0.85rem" }}>⌕</span>
              <input
                type="text" placeholder="Search name, email, ref…" value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)", color: "#F2EDE4", padding: "0.55rem 0.8rem 0.55rem 2.1rem", fontFamily: "'Inter',sans-serif", fontSize: "0.75rem", outline: "none" }}
              />
            </div>

            {/* Status */}
            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
              {["all","pending","pending_payment","confirmed","in_progress","completed","cancelled"].map(s => (
                <button key={s} className={`fbtn${filterStatus === s ? " on" : ""}`} onClick={() => setFilterStatus(s)}>
                  {s === "all" ? "All" : s === "pending_payment" ? "Pend.$" : STATUS_LABELS[s] ?? s}
                </button>
              ))}
            </div>

            {/* Type */}
            <div style={{ display: "flex", gap: "0.3rem" }}>
              {(["all","purchase","save"] as FilterType[]).map(t => (
                <button key={t} className={`fbtn${filterType === t ? " on" : ""}`} onClick={() => setFilterType(t)}>
                  {t === "all" ? "Type: All" : t === "purchase" ? "Purchase" : "Enquiry"}
                </button>
              ))}
            </div>

            {/* Source */}
            <div style={{ display: "flex", gap: "0.3rem" }}>
              {(["all","experiences","feeling-engine"] as FilterSource[]).map(s => (
                <button key={s} className={`fbtn${filterSource === s ? " on" : ""}`} onClick={() => setFilterSource(s)}>
                  {s === "all" ? "Source: All" : s === "experiences" ? "Experiences" : "Feelings Eng."}
                </button>
              ))}
            </div>

            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.62rem", color: "#3a3530", whiteSpace: "nowrap" }}>
              {filtered.length} / {records.length}
            </span>
          </div>

          {/* ── TABLE ── */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "5rem", color: "#3a3530", fontFamily: "'Inter',sans-serif", fontSize: "0.75rem" }}>
              Loading reservations…
            </div>
          ) : records.length === 0 ? (
            <div style={{ textAlign: "center", padding: "6rem 2rem", border: "1px solid rgba(255,255,255,0.06)", background: "#0a0a0a" }}>
              <p style={{ fontFamily: "''TT Fors', sans-serif", fontSize: "1.8rem", fontWeight: 300, color: "#3a3530", marginBottom: "0.5rem" }}>No reservations yet</p>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.72rem", color: "#3a3530" }}>Bookings made through Experiences or the Feelings Engine will appear here</p>
              <a href="/experiences" style={{ textDecoration: "none" }}>
                <button style={{ marginTop: "2rem", background: "none", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C", padding: "0.7rem 1.8rem", fontFamily: "'Inter',sans-serif", fontSize: "0.65rem", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer" }}>
                  Go to Experiences
                </button>
              </a>
            </div>
          ) : (
            <div className="adm-table-wrap" style={{ border: "1px solid rgba(255,255,255,0.05)", background: "#0a0a0a" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
                    {[
                      { label: "Reference",    sort: null },
                      { label: "Title",        sort: null },
                      { label: "Guest",        sort: null },
                      { label: "Date",         sort: "travelDate" as const },
                      { label: "Travellers",   sort: null },
                      { label: "Total",        sort: "total" as const },
                      { label: "Status",       sort: null },
                      { label: "Payment",      sort: null },
                      { label: "Email",        sort: null },
                      { label: "Booked",       sort: "createdAt" as const },
                      { label: "",             sort: null },
                    ].map(({ label, sort }, i) => (
                      <th key={i} style={{ padding: "0.85rem 1rem", textAlign: "left", background: "#080808" }}>
                        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#3a3530", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                          {label}{sort && <SortBtn field={sort} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ padding: "3rem", textAlign: "center", fontFamily: "'Inter',sans-serif", fontSize: "0.72rem", color: "#3a3530" }}>
                        No bookings match your filters
                      </td>
                    </tr>
                  ) : filtered.map((r, idx) => {
                    const title = r.source === "experiences" ? r.experienceTitle : r.itineraryTitle;
                    return (
                      <tr
                        key={r.bookingRef} className="res-row"
                        onClick={() => setSelected(r)}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.008)" }}
                      >
                        <td style={tdSt}>
                          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.7rem", color: "#C9A84C", fontWeight: 600 }}>{r.bookingRef}</span>
                        </td>
                        <td style={tdSt}>
                          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.73rem", color: "#F2EDE4", maxWidth: 160, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {title ?? "—"}
                          </span>
                          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.6rem", color: "#3a3530" }}>
                            {r.source === "experiences" ? "Exp" : "FE"}
                          </span>
                        </td>
                        <td style={tdSt}>
                          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.73rem", color: "#F2EDE4", display: "block" }}>{r.form.fullName}</span>
                          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.63rem", color: "#a89f92" }}>{r.form.email}</span>
                        </td>
                        <td style={tdSt}>
                          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.68rem", color: "#a89f92" }}>{fmtDate(r.form.travelDate)}</span>
                        </td>
                        <td style={{ ...tdSt, textAlign: "center" }}>
                          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.73rem", color: "#F2EDE4" }}>{r.form.travelers}</span>
                        </td>
                        <td style={tdSt}>
                          <span style={{ fontFamily: "''TT Fors', sans-serif", fontSize: "1rem", color: "#E2C97E", fontWeight: 300 }}>${r.total.toLocaleString()}</span>
                        </td>
                        <td style={tdSt}><Badge value={r.status} map={STATUS_COLORS} /></td>
                        <td style={tdSt}><Badge value={r.paymentStatus} map={PAYMENT_COLORS} label={r.paymentStatus.charAt(0).toUpperCase() + r.paymentStatus.slice(1)} /></td>
                        <td style={tdSt}><Badge value={r.emailStatus} map={EMAIL_COLORS} label={r.emailStatus === "sent" ? "✓ Sent" : r.emailStatus.charAt(0).toUpperCase() + r.emailStatus.slice(1)} /></td>
                        <td style={tdSt}>
                          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.62rem", color: "#3a3530" }}>{fmtDate(r.createdAt)}</span>
                        </td>
                        <td style={{ ...tdSt, textAlign: "right" }}>
                          <button
                            onClick={e => { e.stopPropagation(); deleteBooking(r.bookingRef); }}
                            style={{ background: "none", border: "none", color: "#3a3530", cursor: "pointer", fontSize: "0.75rem", padding: "0.2rem 0.5rem", transition: "color 0.2s" }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#3a3530")}
                          >✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {records.length > 0 && !loading && (
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.6rem", color: "#3a3530", marginTop: "0.75rem" }}>
              Click any row to view full details and update status. Auto-refreshes every 30 seconds.
            </p>
          )}
        </div>
      </div>

      {selected && (
        <DetailDrawer
          r={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateBooking}
        />
      )}
    </>
  );
}
