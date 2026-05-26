"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";

/* ── Google Maps types ─────────────────────────────────────────────── */
declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps?: () => void;
  }
}

const COUNTRIES = [
  "United Kingdom","United States","Australia","Germany","France","Netherlands",
  "Sweden","Switzerland","Canada","New Zealand","Singapore","UAE","Japan",
  "India","China","South Korea","Sri Lanka","Other",
];

const TRAVELLER_OPTIONS = ["1","2","3","4","5","6","7","8","9","10+"];

interface FormState {
  fullName: string;   email: string;       phone: string;
  country: string;    travelers: string;   travelDate: string;
  returnDate: string; pickupLocation: string; dropoffLocation: string;
  package: string;    childSeat: boolean;  extraInsurance: boolean;
  specialRequests: string;
  emergencyContactName: string; emergencyContactPhone: string;
}

const EMPTY: FormState = {
  fullName: "", email: "", phone: "", country: "",
  travelers: "2", travelDate: "", returnDate: "",
  pickupLocation: "Bandaranaike International Airport, Colombo",
  dropoffLocation: "Bandaranaike International Airport, Colombo",
  package: "", childSeat: false, extraInsurance: false, specialRequests: "",
  emergencyContactName: "", emergencyContactPhone: "",
};

// Optional priced add-ons (per booking), used for the live total.
const CHILD_SEAT_PRICE     = 25;
const EXTRA_INSURANCE_PRICE = 80;

// "7 Days" / "7 nights" → 7
function parseDurationDays(s: string): number {
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

function CheckoutForm() {
  const params        = useSearchParams();
  const expTitle      = params.get("title")    ?? "See You In the Moment";
  const expId         = params.get("id")       ?? "itw-4";
  const expPrice      = Number(params.get("price") ?? 3200);
  const expDuration   = params.get("duration") ?? "7 Days";

  const [form,    setForm]    = useState<FormState>({ ...EMPTY, package: expTitle });
  const [status,  setStatus]  = useState<"idle"|"submitting"|"success"|"error">("idle");
  const [bookingRef, setRef]  = useState("");
  const [errMsg,  setErrMsg]  = useState("");
  const [mapLocation, setMapLocation] = useState("Bandaranaike+International+Airport,+Colombo,+Sri+Lanka");
  const [mapsLoaded, setMapsLoaded]   = useState(false);

  const pickupRef  = useRef<HTMLInputElement>(null);
  const dropoffRef = useRef<HTMLInputElement>(null);
  const apiKey     = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const initAutocomplete = useCallback(() => {
    if (!window.google?.maps?.places) return;
    const opts = { componentRestrictions: { country: "lk" } };

    if (pickupRef.current) {
      const ac = new window.google.maps.places.Autocomplete(pickupRef.current, opts);
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const addr  = place.formatted_address ?? place.name ?? "";
        setForm(p => ({ ...p, pickupLocation: addr }));
        setMapLocation(encodeURIComponent(addr));
      });
    }
    if (dropoffRef.current) {
      const ac = new window.google.maps.places.Autocomplete(dropoffRef.current, opts);
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const addr  = place.formatted_address ?? place.name ?? "";
        setForm(p => ({ ...p, dropoffLocation: addr }));
      });
    }
    setMapsLoaded(true);
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    if (window.google?.maps?.places) { initAutocomplete(); return; }

    window.initGoogleMaps = () => { initAutocomplete(); };

    const existing = document.getElementById("gm-script");
    if (!existing) {
      const s  = document.createElement("script");
      s.id     = "gm-script";
      s.src    = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
      s.async  = true;
      document.head.appendChild(s);
    }
  }, [apiKey, initAutocomplete]);

  const set = (k: keyof FormState, v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }));

  // ── Live pricing — recalculates on every traveller / add-on change ──
  const travelersNum = parseInt(form.travelers, 10) || 1;   // "10+" → 10
  const durationDays = parseDurationDays(expDuration);
  const baseTotal    = expPrice * travelersNum;
  const extrasTotal  = (form.childSeat ? CHILD_SEAT_PRICE : 0) + (form.extraInsurance ? EXTRA_INSURANCE_PRICE : 0);
  const grandTotal   = baseTotal + extrasTotal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg("");

    // Required field validation
    if (!form.fullName.trim()) {
      setErrMsg("Please enter your full name.");
      setStatus("error");
      return;
    }
    if (!form.email.trim()) {
      setErrMsg("Please enter your email address.");
      setStatus("error");
      return;
    }
    if (!form.phone.trim()) {
      setErrMsg("Please enter your phone number.");
      setStatus("error");
      return;
    }
    if (!form.travelDate) {
      setErrMsg("Please select a travel date.");
      setStatus("error");
      return;
    }

    setStatus("submitting");

    // Notes capture the chosen extras + country (not free-text special requests).
    const noteParts: string[] = [];
    if (form.childSeat)      noteParts.push(`Child seat (+$${CHILD_SEAT_PRICE})`);
    if (form.extraInsurance) noteParts.push(`Extra insurance (+$${EXTRA_INSURANCE_PRICE})`);
    if (form.country)        noteParts.push(`Country: ${form.country}`);

    const payload = {
      source: "experiences",
      type: "purchase",
      experienceId: expId,
      experienceTitle: expTitle,
      experienceDuration: expDuration,
      experiencePrice: expPrice,
      travelerCount: travelersNum,
      total: grandTotal,
      form: {
        fullName:        form.fullName,
        email:           form.email,
        phone:           form.phone,
        travelers:       form.travelers,
        travelDate:      form.travelDate,
        returnDate:      form.returnDate || undefined,
        durationDays:    durationDays || undefined,
        pickupLocation:  form.pickupLocation,
        dropoffLocation: form.dropoffLocation || undefined,
        budgetPreference: form.package,
        specialRequests: form.specialRequests.trim() || undefined,
        bookingNotes:    noteParts.join(" · ") || undefined,
        emergencyContactName:  form.emergencyContactName.trim() || undefined,
        emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
      },
    };

    try {
      const res  = await fetch("/api/bookings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json() as {
        success: boolean;
        reservation?: { bookingRef: string; emailStatus: string };
        error?: string;
      };

      if (!data.success) throw new Error(data.error ?? "Booking failed");
      setRef(data.reservation?.bookingRef ?? "SAM-PENDING");
      setStatus("success");
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="co-confirm">
        <div className="co-confirm-inner">
          <span className="co-confirm-icon">✓</span>
          <span className="co-eyebrow">Booking Confirmed</span>
          <h1 className="co-confirm-title">Your Journey Awaits</h1>
          <p className="co-confirm-ref">Reference: <strong>{bookingRef}</strong></p>
          <p className="co-confirm-text">
            We've received your booking for <em>{expTitle}</em>. A confirmation has been sent to{" "}
            <strong>{form.email}</strong>. Our team will be in touch within 24 hours to finalise your itinerary.
          </p>
          <a href="/experiences" className="co-btn-gold">Back to Experiences</a>
        </div>
      </div>
    );
  }

  return (
    <form className="co-layout" onSubmit={handleSubmit} noValidate>

      {/* ── LEFT: FORM ── */}
      <div className="co-form-col">

        {/* Personal Details */}
        <section className="co-section">
          <span className="co-eyebrow">01</span>
          <h2 className="co-section-title">Personal Details</h2>
          <div className="co-grid-2">
            <div className="co-field">
              <label className="co-label">Full Name <span className="co-req">*</span></label>
              <input className="co-input" required value={form.fullName}
                onChange={e => set("fullName", e.target.value)} placeholder="Jane Smith" />
            </div>
            <div className="co-field">
              <label className="co-label">Country <span className="co-req">*</span></label>
              <select className="co-input co-select" required value={form.country}
                onChange={e => set("country", e.target.value)}>
                <option value="">Select country</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="co-field">
              <label className="co-label">Email <span className="co-req">*</span></label>
              <input className="co-input" type="email" required value={form.email}
                onChange={e => set("email", e.target.value)} placeholder="jane@example.com" />
            </div>
            <div className="co-field">
              <label className="co-label">Phone <span className="co-req">*</span></label>
              <input className="co-input" type="tel" required value={form.phone}
                onChange={e => set("phone", e.target.value)} placeholder="+44 7700 000000" />
            </div>
            <div className="co-field">
              <label className="co-label">Emergency Contact Name</label>
              <input className="co-input" value={form.emergencyContactName}
                onChange={e => set("emergencyContactName", e.target.value)} placeholder="Contact person" />
            </div>
            <div className="co-field">
              <label className="co-label">Emergency Contact Phone</label>
              <input className="co-input" type="tel" value={form.emergencyContactPhone}
                onChange={e => set("emergencyContactPhone", e.target.value)} placeholder="+44 7700 000000" />
            </div>
          </div>
        </section>

        <div className="co-divider" />

        {/* Trip Details */}
        <section className="co-section">
          <span className="co-eyebrow">02</span>
          <h2 className="co-section-title">Trip Details</h2>
          <div className="co-grid-2">
            <div className="co-field">
              <label className="co-label">Number of Travellers <span className="co-req">*</span></label>
              <select className="co-input co-select" required value={form.travelers}
                onChange={e => set("travelers", e.target.value)}>
                {TRAVELLER_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="co-field">
              <label className="co-label">Travel Date <span className="co-req">*</span></label>
              <input className="co-input" type="date" required value={form.travelDate}
                onChange={e => set("travelDate", e.target.value)}
                min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="co-field">
              <label className="co-label">Return Date</label>
              <input className="co-input" type="date" value={form.returnDate}
                onChange={e => set("returnDate", e.target.value)}
                min={form.travelDate || new Date().toISOString().split("T")[0]} />
            </div>
            <div className="co-field co-field-full co-location-field">
              <label className="co-label">
                Pick-up Location <span className="co-req">*</span>
                {mapsLoaded && <span className="co-maps-badge">Maps</span>}
              </label>
              <div className="co-input-icon-wrap">
                <span className="co-pin-icon">◎</span>
                <input
                  ref={pickupRef}
                  className="co-input co-input-with-icon"
                  required
                  value={form.pickupLocation}
                  onChange={e => set("pickupLocation", e.target.value)}
                  placeholder="Airport, hotel, or city"
                />
              </div>
            </div>
            <div className="co-field co-field-full co-location-field">
              <label className="co-label">Drop-off Location</label>
              <div className="co-input-icon-wrap">
                <span className="co-pin-icon">◎</span>
                <input
                  ref={dropoffRef}
                  className="co-input co-input-with-icon"
                  value={form.dropoffLocation}
                  onChange={e => set("dropoffLocation", e.target.value)}
                  placeholder="If different from pick-up"
                />
              </div>
            </div>

            {/* Map preview */}
            {apiKey && (
              <div className="co-field co-field-full">
                <div className="co-map-wrap">
                  <iframe
                    key={mapLocation}
                    className="co-map-iframe"
                    src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${mapLocation}&zoom=13`}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div className="co-map-label">
                    <span className="co-pin-icon" style={{ color: "var(--gold)" }}>◎</span>
                    Pick-up location preview
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="co-divider" />

        {/* Preferences */}
        <section className="co-section">
          <span className="co-eyebrow">03</span>
          <h2 className="co-section-title">Optional Preferences</h2>
          <div className="co-checks">
            <label className="co-check-label">
              <input type="checkbox" className="co-check"
                checked={form.childSeat} onChange={e => set("childSeat", e.target.checked)} />
              <span className="co-check-text">Child seat required</span>
            </label>
            <label className="co-check-label">
              <input type="checkbox" className="co-check"
                checked={form.extraInsurance} onChange={e => set("extraInsurance", e.target.checked)} />
              <span className="co-check-text">Extra travel insurance</span>
            </label>
          </div>
          <div className="co-field" style={{ marginTop: "1.5rem" }}>
            <label className="co-label">Special Requests</label>
            <textarea className="co-input co-textarea" rows={4} value={form.specialRequests}
              onChange={e => set("specialRequests", e.target.value)}
              placeholder="Dietary needs, accessibility requirements, room preferences…" />
          </div>
        </section>

        {status === "error" && (
          <p className="co-error">{errMsg || "An error occurred. Please try again."}</p>
        )}

        <button
          type="submit"
          className="co-submit-btn"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Processing…" : "Complete Booking"}
        </button>

        <p className="co-disclaimer">
          By completing this booking you agree to Samsara's terms and conditions.
          No payment is charged at this stage — our team will contact you to finalise arrangements.
        </p>

      </div>

      {/* ── RIGHT: SUMMARY ── */}
      <aside className="co-summary">
        <div className="co-summary-inner">
          <span className="co-eyebrow" style={{ marginBottom: "1.25rem", display: "block" }}>Your Selection</span>
          <h3 className="co-summary-title">{expTitle}</h3>
          <p className="co-summary-duration">{expDuration} · Slow Travel · Sri Lanka</p>
          <div className="co-summary-divider" />
          <div className="co-summary-line">
            <span>Journey</span>
            <span>{expTitle}</span>
          </div>
          <div className="co-summary-line">
            <span>Duration</span>
            <span>{expDuration}</span>
          </div>
          <div className="co-summary-line">
            <span>Travellers</span>
            <span>{form.travelers}</span>
          </div>
          {form.travelDate && (
            <div className="co-summary-line">
              <span>Departs</span>
              <span>{new Date(form.travelDate).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}</span>
            </div>
          )}
          <div className="co-summary-divider" />
          <div className="co-summary-line">
            <span>${expPrice.toLocaleString()} × {travelersNum} {travelersNum === 1 ? "traveller" : "travellers"}</span>
            <span>${baseTotal.toLocaleString()}</span>
          </div>
          {form.childSeat && (
            <div className="co-summary-line">
              <span>Child seat</span>
              <span>+${CHILD_SEAT_PRICE}</span>
            </div>
          )}
          {form.extraInsurance && (
            <div className="co-summary-line">
              <span>Extra insurance</span>
              <span>+${EXTRA_INSURANCE_PRICE}</span>
            </div>
          )}
          <div className="co-summary-divider" />
          <div className="co-summary-price-row">
            <span className="co-summary-price-label">Total</span>
            <span className="co-summary-price">${grandTotal.toLocaleString()} <small>USD</small></span>
          </div>
          <p className="co-summary-note">
            Total updates with traveller count. No payment is taken at this stage — pay on arrival.
          </p>
          <div className="co-summary-badges">
            <span className="co-badge">100% Private</span>
            <span className="co-badge">Fully Tailored</span>
            <span className="co-badge">Expert Guided</span>
          </div>
        </div>
      </aside>

    </form>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <style>{`
        :root { --gold:#C9A84C; --gold-l:#E2C97E; --dark:#080808; --white:#fff; }
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html { scroll-behavior:smooth; }
        body { background:var(--dark); color:var(--white); font-family:'TT Fors','Inter',sans-serif; font-weight:300; }

        /* ── PAGE SHELL ── */
        .co-page {
          min-height: 100vh; padding: 7rem 0 8rem;
          background: var(--dark);
        }
        .co-header {
          max-width: 1100px; margin: 0 auto;
          padding: 0 3rem 4rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 4rem;
        }
        .co-eyebrow {
          font-size: 0.55rem; letter-spacing: 0.4em; text-transform: uppercase;
          color: var(--gold); display: block; margin-bottom: 0.75rem;
          font-family: 'Inter', sans-serif;
        }
        .co-page-title {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(2rem, 4vw, 3.2rem);
          color: var(--white); text-transform: uppercase; letter-spacing: 0.05em;
          line-height: 1.05;
        }

        /* ── LAYOUT ── */
        .co-layout {
          max-width: 1100px; margin: 0 auto;
          padding: 0 3rem;
          display: grid; grid-template-columns: 1fr 360px;
          gap: 4rem; align-items: start;
        }

        /* ── SECTIONS ── */
        .co-section { margin-bottom: 0.25rem; }
        .co-section-title {
          font-family: 'TT Fors', sans-serif; font-weight: 400;
          font-size: clamp(1rem, 1.5vw, 1.2rem);
          color: var(--white); text-transform: uppercase;
          letter-spacing: 0.07em; margin-bottom: 2rem; margin-top: 0.5rem;
        }
        .co-divider {
          height: 1px; background: rgba(255,255,255,0.05);
          margin: 2.5rem 0;
        }

        /* ── FORM FIELDS ── */
        .co-grid-2 {
          display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;
        }
        .co-field { display: flex; flex-direction: column; gap: 0.5rem; }
        .co-field-full { grid-column: span 2; }
        .co-label {
          font-size: 0.6rem; letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(255,255,255,0.42); font-family: 'Inter', sans-serif;
        }
        .co-req { color: var(--gold); }
        .co-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          color: var(--white); font-family: 'TT Fors','Inter',sans-serif;
          font-size: 0.88rem; font-weight: 300;
          padding: 0.85rem 1.1rem;
          outline: none; transition: border-color 0.25s;
          width: 100%;
        }
        .co-input:focus { border-color: rgba(201,168,76,0.5); }
        .co-input::placeholder { color: rgba(255,255,255,0.2); }
        .co-select { appearance: none; cursor: pointer; }
        .co-select option { background: #1a1a1a; color: var(--white); }
        .co-textarea { resize: vertical; min-height: 110px; }

        /* Checkbox */
        .co-checks { display: flex; flex-direction: column; gap: 0.85rem; }
        .co-check-label {
          display: flex; align-items: center; gap: 0.75rem; cursor: pointer;
        }
        .co-check {
          width: 16px; height: 16px; accent-color: var(--gold);
          cursor: pointer; flex-shrink: 0;
        }
        .co-check-text {
          font-size: 0.85rem; color: rgba(255,255,255,0.6);
        }

        /* Submit */
        .co-submit-btn {
          display: block; width: 100%; margin-top: 2.5rem;
          background: var(--gold); color: var(--dark);
          border: none; padding: 1.15rem 2rem;
          font-family: 'Inter', sans-serif; font-size: 0.62rem;
          letter-spacing: 0.28em; text-transform: uppercase;
          cursor: pointer; font-weight: 600;
          transition: background 0.3s, transform 0.2s;
        }
        .co-submit-btn:hover:not(:disabled) { background: var(--gold-l); transform: translateY(-1px); }
        .co-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .co-disclaimer {
          font-size: 0.68rem; color: rgba(255,255,255,0.22);
          line-height: 1.7; margin-top: 1.25rem;
          text-align: center; font-family: 'Inter', sans-serif;
        }
        .co-error {
          background: rgba(220,60,60,0.08); border: 1px solid rgba(220,60,60,0.25);
          color: #f87171; padding: 0.85rem 1.1rem;
          font-size: 0.8rem; margin-top: 1rem;
        }

        /* ── SUMMARY SIDEBAR ── */
        .co-summary {
          position: sticky; top: 100px;
        }
        .co-summary-inner {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          padding: 2.25rem 2rem;
        }
        .co-summary-title {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(1.1rem, 1.8vw, 1.4rem);
          color: var(--white); text-transform: uppercase;
          letter-spacing: 0.06em; line-height: 1.2;
        }
        .co-summary-duration {
          font-size: 0.68rem; color: rgba(255,255,255,0.3);
          letter-spacing: 0.1em; margin-top: 0.4rem;
          font-family: 'Inter', sans-serif;
        }
        .co-summary-divider {
          height: 1px; background: rgba(255,255,255,0.06); margin: 1.5rem 0;
        }
        .co-summary-line {
          display: flex; justify-content: space-between; align-items: baseline;
          font-size: 0.78rem; color: rgba(255,255,255,0.45);
          margin-bottom: 0.65rem;
        }
        .co-summary-line span:last-child { color: rgba(255,255,255,0.7); text-align: right; max-width: 55%; }
        .co-summary-price-row {
          display: flex; justify-content: space-between; align-items: baseline;
          margin-top: 0.5rem;
        }
        .co-summary-price-label {
          font-size: 0.58rem; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--gold); font-family: 'Inter', sans-serif;
        }
        .co-summary-price {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(1.3rem, 2vw, 1.7rem);
          color: var(--white);
        }
        .co-summary-price small {
          font-size: 0.62rem; color: rgba(255,255,255,0.35);
          letter-spacing: 0.08em; margin-left: 0.3rem;
        }
        .co-summary-note {
          font-size: 0.68rem; color: rgba(255,255,255,0.25);
          line-height: 1.65; margin-top: 1rem;
          font-family: 'Inter', sans-serif;
        }
        .co-summary-badges {
          display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1.5rem;
        }
        .co-badge {
          font-size: 0.52rem; letter-spacing: 0.18em; text-transform: uppercase;
          border: 1px solid rgba(201,168,76,0.25); color: rgba(201,168,76,0.65);
          padding: 0.35rem 0.75rem; font-family: 'Inter', sans-serif;
        }

        /* ── CONFIRMATION ── */
        .co-confirm {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          padding: 4rem 2rem; background: var(--dark);
        }
        .co-confirm-inner {
          text-align: center; max-width: 540px;
        }
        .co-confirm-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 52px; height: 52px;
          border: 1px solid rgba(201,168,76,0.4); color: var(--gold);
          font-size: 1.3rem; border-radius: 50%; margin-bottom: 2rem;
        }
        .co-confirm-title {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(2rem, 4vw, 3rem);
          color: var(--white); text-transform: uppercase;
          letter-spacing: 0.06em; margin: 0.75rem 0 1rem;
        }
        .co-confirm-ref {
          font-size: 0.75rem; letter-spacing: 0.18em;
          color: var(--gold); margin-bottom: 1.25rem;
          font-family: 'Inter', sans-serif;
        }
        .co-confirm-ref strong { color: var(--white); }
        .co-confirm-text {
          font-size: 0.9rem; line-height: 1.85;
          color: rgba(255,255,255,0.45); margin-bottom: 2.5rem;
        }
        .co-confirm-text em { font-style: normal; color: rgba(255,255,255,0.7); }
        .co-confirm-text strong { font-weight: 400; color: rgba(255,255,255,0.7); }
        .co-btn-gold {
          display: inline-block;
          background: var(--gold); color: var(--dark);
          font-family: 'Inter', sans-serif; font-size: 0.6rem;
          letter-spacing: 0.28em; text-transform: uppercase;
          padding: 1rem 2.5rem; text-decoration: none;
          font-weight: 600; transition: background 0.3s;
        }
        .co-btn-gold:hover { background: var(--gold-l); }

        /* ── LOCATION / MAP ── */
        .co-input-icon-wrap {
          position: relative; display: flex; align-items: center;
        }
        .co-pin-icon {
          position: absolute; left: 1rem;
          color: rgba(201,168,76,0.55); font-size: 0.95rem;
          pointer-events: none; z-index: 1;
        }
        .co-input-with-icon {
          padding-left: 2.4rem !important;
        }
        .co-maps-badge {
          margin-left: 0.5rem; font-size: 0.48rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--gold);
          border: 1px solid rgba(201,168,76,0.35);
          padding: 0.15rem 0.45rem; vertical-align: middle;
          font-family: 'Inter', sans-serif;
        }
        .co-map-wrap {
          border: 1px solid rgba(255,255,255,0.07);
          overflow: hidden; margin-top: 0.25rem;
        }
        .co-map-iframe {
          width: 100%; height: 260px; border: none; display: block;
          filter: grayscale(25%) brightness(0.85);
        }
        .co-map-label {
          padding: 0.65rem 1rem;
          background: rgba(255,255,255,0.03);
          border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 0.6rem; letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(255,255,255,0.3); font-family: 'Inter', sans-serif;
          display: flex; align-items: center; gap: 0.5rem;
        }

        /* Google Places autocomplete dropdown styling */
        .pac-container {
          background: #111 !important;
          border: 1px solid rgba(201,168,76,0.2) !important;
          border-radius: 0 !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
          font-family: 'TT Fors','Inter',sans-serif !important;
          margin-top: 2px !important;
        }
        .pac-item {
          padding: 0.65rem 1rem !important;
          border-top: 1px solid rgba(255,255,255,0.05) !important;
          color: rgba(255,255,255,0.55) !important;
          font-size: 0.82rem !important;
          cursor: pointer !important;
          transition: background 0.2s;
        }
        .pac-item:hover, .pac-item-selected {
          background: rgba(201,168,76,0.08) !important;
        }
        .pac-item-query { color: rgba(255,255,255,0.85) !important; }
        .pac-icon { display: none !important; }
        .pac-matched { color: var(--gold) !important; font-weight: 500 !important; }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .co-layout { grid-template-columns: 1fr; gap: 2.5rem; padding: 0 1.5rem; }
          .co-summary { position: static; order: -1; }
          .co-header { padding: 0 1.5rem 3rem; }
        }
        @media (max-width: 580px) {
          .co-grid-2 { grid-template-columns: 1fr; }
          .co-field-full { grid-column: span 1; }
        }
      `}</style>

      <div className="co-page">
        <div className="co-header">
          <span className="co-eyebrow">Samsara · Book Your Journey</span>
          <h1 className="co-page-title">Complete Your Booking</h1>
        </div>
        <Suspense fallback={<div style={{ color: "rgba(255,255,255,0.3)", padding: "3rem", textAlign: "center" }}>Loading…</div>}>
          <CheckoutForm />
        </Suspense>
      </div>
    </>
  );
}
