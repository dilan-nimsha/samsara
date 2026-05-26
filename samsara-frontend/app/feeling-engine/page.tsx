"use client";

/* ════════════════════════════════════════════════════════════════════════
   THE FEELINGS ENGINE — CONVERSATIONAL AI TRAVEL CONSULTANT
   The live /feeling-engine experience: a chat-first luxury advisor that reads
   the traveller's emotions, collects a reservation-ready profile through a
   light, natural conversation, and builds a premium itinerary proposal in real
   time. The original step-wizard is preserved at /feeling-engine/wizard.
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect, useMemo } from "react";

const MODEL = "claude-sonnet-4-6";

/* ─── RESERVATION DATA MODEL ─────────────────────────────────────────────── */

interface Reservation {
  traveler: {
    leadName: string; nationality: string; email: string; phone: string;
    numAdults: number | null; numChildren: number | null; numInfants: number | null;
    childAges: string[]; infantAges: string[];
    emergencyName: string; emergencyPhone: string;
  };
  trip: {
    arrivalDate: string; departureDate: string; destinations: string[];
    pickupLocation: string; dropoffLocation: string; flightNumber: string; purpose: string;
  };
  transport: {
    vehicleType: string; driveType: string; luggageCount: number | null; luggageSize: string;
    childSeats: string; accessibility: string; chauffeurLanguage: string; comfortLevel: string;
  };
  accommodation: {
    type: string; budgetLevel: string; roomType: string; bedConfig: string; view: string; specialRequests: string;
  };
  experience: {
    travelStyle: string[]; intensity: string; interests: string[]; pace: string;
    guidedTours: string; specialExperiences: string[];
  };
  budget: { estimate: string; flexibility: string; paymentMethod: string };
}

const EMPTY: Reservation = {
  traveler: { leadName: "", nationality: "", email: "", phone: "", numAdults: null, numChildren: null, numInfants: null, childAges: [], infantAges: [], emergencyName: "", emergencyPhone: "" },
  trip: { arrivalDate: "", departureDate: "", destinations: [], pickupLocation: "", dropoffLocation: "", flightNumber: "", purpose: "" },
  transport: { vehicleType: "", driveType: "", luggageCount: null, luggageSize: "", childSeats: "", accessibility: "", chauffeurLanguage: "", comfortLevel: "" },
  accommodation: { type: "", budgetLevel: "", roomType: "", bedConfig: "", view: "", specialRequests: "" },
  experience: { travelStyle: [], intensity: "", interests: [], pace: "", guidedTours: "", specialExperiences: [] },
  budget: { estimate: "", flexibility: "", paymentMethod: "" },
};

type FieldType = "text" | "number" | "list";
type SectionKey = keyof Reservation;
interface FieldDef { key: string; label: string; type: FieldType; optional?: boolean }
interface SectionDef { key: SectionKey; label: string; fields: FieldDef[] }

// Drives the system prompt + completeness only — never rendered as a form.
const SCHEMA: SectionDef[] = [
  { key: "traveler", label: "Traveller", fields: [
    { key: "leadName", label: "Lead traveller", type: "text" },
    { key: "nationality", label: "Nationality", type: "text", optional: true },
    { key: "email", label: "Email", type: "text" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "numAdults", label: "Adults", type: "number" },
    { key: "numChildren", label: "Children", type: "number", optional: true },
    { key: "numInfants", label: "Infants", type: "number", optional: true },
    { key: "childAges", label: "Children's ages", type: "list", optional: true },
    { key: "infantAges", label: "Infants' ages", type: "list", optional: true },
    { key: "emergencyName", label: "Emergency contact", type: "text", optional: true },
    { key: "emergencyPhone", label: "Emergency phone", type: "text", optional: true },
  ] },
  { key: "trip", label: "Trip", fields: [
    { key: "arrivalDate", label: "Arrival", type: "text" },
    { key: "departureDate", label: "Departure", type: "text" },
    { key: "destinations", label: "Destinations", type: "list" },
    { key: "pickupLocation", label: "Pickup", type: "text", optional: true },
    { key: "dropoffLocation", label: "Drop-off", type: "text", optional: true },
    { key: "flightNumber", label: "Flight details", type: "text", optional: true },
    { key: "purpose", label: "Trip purpose", type: "text" },
  ] },
  { key: "transport", label: "Transport", fields: [
    { key: "vehicleType", label: "Vehicle type", type: "text" },
    { key: "driveType", label: "Chauffeur / self-drive", type: "text", optional: true },
    { key: "luggageCount", label: "Luggage count", type: "number", optional: true },
    { key: "luggageSize", label: "Luggage size", type: "text", optional: true },
    { key: "childSeats", label: "Child / booster seats", type: "text", optional: true },
    { key: "accessibility", label: "Accessibility needs", type: "text", optional: true },
    { key: "chauffeurLanguage", label: "Chauffeur language", type: "text", optional: true },
    { key: "comfortLevel", label: "Comfort level", type: "text", optional: true },
  ] },
  { key: "accommodation", label: "Accommodation", fields: [
    { key: "type", label: "Property type", type: "text" },
    { key: "budgetLevel", label: "Budget level", type: "text" },
    { key: "roomType", label: "Room type", type: "text", optional: true },
    { key: "bedConfig", label: "Bed configuration", type: "text", optional: true },
    { key: "view", label: "View preference", type: "text", optional: true },
    { key: "specialRequests", label: "Special requests", type: "text", optional: true },
  ] },
  { key: "experience", label: "Experiences", fields: [
    { key: "travelStyle", label: "Travel style", type: "list" },
    { key: "intensity", label: "Activity intensity", type: "text", optional: true },
    { key: "interests", label: "Interests", type: "list" },
    { key: "pace", label: "Daily pace", type: "text", optional: true },
    { key: "guidedTours", label: "Guided tours", type: "text", optional: true },
    { key: "specialExperiences", label: "Special experiences", type: "list", optional: true },
  ] },
  { key: "budget", label: "Budget", fields: [
    { key: "estimate", label: "Estimated budget", type: "text" },
    { key: "flexibility", label: "Flexibility", type: "text", optional: true },
    { key: "paymentMethod", label: "Payment method", type: "text", optional: true },
  ] },
];

/* ─── ITINERARY / RESPONSE CONTRACT ──────────────────────────────────────── */

interface ItDay {
  day: number; destination: string; theme: string;
  morning: string; afternoon: string; evening: string;
  accommodation: string; transport: string; tip: string;
}
interface Pricing { min: number; max: number; currency: string; note: string }
interface Overview { title?: string; summary?: string }

type ResUpdate = { [K in SectionKey]?: Partial<Reservation[K]> };

interface ConsultantResponse {
  reply: string;
  updates?: ResUpdate;
  suggestions?: string[];
  overview?: Overview;
  itinerary?: ItDay[];
  pricing?: Pricing;
  notes?: string[];
  warnings?: string[];
  phase?: "collecting" | "ready" | "complete";
}

interface ChatMsg { role: "assistant" | "user"; text: string }

/* ─── VALUE HELPERS ──────────────────────────────────────────────────────── */

type RawVal = string | number | null | string[];

function rawValue(res: Reservation, sec: SectionKey, field: string): RawVal {
  return (res[sec] as Record<string, RawVal>)[field];
}
function isEmpty(v: RawVal): boolean {
  if (v === null || v === undefined) return true;
  if (Array.isArray(v)) return v.length === 0;
  return String(v).trim() === "";
}
function displayStr(v: RawVal): string {
  if (isEmpty(v)) return "";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}
function coerce(type: FieldType, str: string): RawVal {
  if (type === "number") { const n = parseInt(str, 10); return isNaN(n) ? null : n; }
  if (type === "list") return str.split(",").map(s => s.trim()).filter(Boolean);
  return str;
}

// Normalise whatever the model returns into our typed shape.
function coerceToSchema(res: Reservation): Reservation {
  const out = JSON.parse(JSON.stringify(res)) as Reservation;
  for (const sec of SCHEMA) {
    const bucket = out[sec.key] as Record<string, RawVal>;
    for (const f of sec.fields) {
      const v = bucket[f.key];
      if (f.type === "number" && typeof v === "string") bucket[f.key] = coerce("number", v);
      else if (f.type === "list" && typeof v === "string") bucket[f.key] = coerce("list", v);
      else if (f.type === "list" && v == null) bucket[f.key] = [];
    }
  }
  return out;
}

function applyUpdates(prev: Reservation, up?: ResUpdate): Reservation {
  if (!up) return prev;
  const merged = { ...prev } as Record<string, Record<string, RawVal>>;
  const prevR = prev as unknown as Record<string, Record<string, RawVal>>;
  const upR = up as unknown as Record<string, Record<string, RawVal>>;
  for (const sec of Object.keys(upR)) {
    if (!prevR[sec]) continue;
    merged[sec] = { ...prevR[sec], ...upR[sec] };
  }
  return coerceToSchema(merged as unknown as Reservation);
}

function paxTotal(res: Reservation): number {
  const t = res.traveler;
  return (t.numAdults ?? 0) + (t.numChildren ?? 0) + (t.numInfants ?? 0);
}
function nightsBetween(a: string, b: string): number | null {
  if (!a || !b) return null;
  const d1 = new Date(a), d2 = new Date(b);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
  return Math.round((d2.getTime() - d1.getTime()) / 86_400_000);
}
function fmtDate(d: string): string {
  if (!d) return "";
  const x = new Date(d);
  return isNaN(x.getTime()) ? d : x.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function partyStr(res: Reservation): string {
  const t = res.traveler; const bits: string[] = [];
  if (t.numAdults)   bits.push(`${t.numAdults} adult${t.numAdults > 1 ? "s" : ""}`);
  if (t.numChildren) bits.push(`${t.numChildren} child${t.numChildren > 1 ? "ren" : ""}${t.childAges.length ? ` (${t.childAges.join(", ")})` : ""}`);
  if (t.numInfants)  bits.push(`${t.numInfants} infant${t.numInfants > 1 ? "s" : ""}${t.infantAges.length ? ` (${t.infantAges.join(", ")})` : ""}`);
  return bits.join(" · ");
}

interface MissingField { sec: SectionKey; field: string; label: string; type: FieldType }
function computeMissing(res: Reservation, includeOptional = false): MissingField[] {
  const out: MissingField[] = [];
  for (const s of SCHEMA) for (const f of s.fields) {
    if (f.optional && !includeOptional) continue;
    if (isEmpty(rawValue(res, s.key, f.key))) out.push({ sec: s.key, field: f.key, label: f.label, type: f.type });
  }
  return out;
}

/* ─── RULE-BASED ADVISOR (runs client-side; feeds the proposal "Notes") ──── */

const VEHICLE_CAP: { match: string; cap: number }[] = [
  { match: "minibus", cap: 15 }, { match: "coach", cap: 30 }, { match: "van", cap: 9 },
  { match: "suv", cap: 5 }, { match: "luxury", cap: 3 }, { match: "sedan", cap: 3 },
  { match: "compact", cap: 3 }, { match: "car", cap: 4 },
];
function recommendVehicle(pax: number): string {
  if (pax >= 16) return "Coach";
  if (pax >= 10) return "Minibus";
  if (pax >= 7) return "Van";
  if (pax >= 5) return "SUV or Van";
  if (pax >= 3) return "SUV or Sedan";
  return "Sedan or Compact";
}
function deriveAdvisor(res: Reservation): string[] {
  const out: string[] = [];
  const pax = paxTotal(res);
  const t = res.transport;
  if (pax > 0 && t.vehicleType) {
    const cap = VEHICLE_CAP.find(v => t.vehicleType.toLowerCase().includes(v.match))?.cap;
    if (cap && pax > cap) out.push(`A ${t.vehicleType} seats about ${cap}; your group of ${pax} would travel more comfortably in a ${recommendVehicle(pax)}.`);
  }
  if (t.luggageCount != null && pax > 0 && t.luggageCount > pax + 2 && !/van|minibus|suv|coach/i.test(t.vehicleType)) {
    out.push(`${t.luggageCount} bags for ${pax} travellers is luggage-heavy — a van or SUV gives more boot space.`);
  }
  const youngKids = res.traveler.childAges.some(a => Number(a) > 0 && Number(a) <= 4);
  if (((res.traveler.numInfants ?? 0) > 0 || youngKids) && !t.childSeats) {
    out.push("Young children detected — we'd recommend adding child or booster seats to the transfers.");
  }
  const n = nightsBetween(res.trip.arrivalDate, res.trip.departureDate);
  if (n != null && n < 0) out.push("Departure is before arrival — the dates need a quick correction.");
  if (n != null && n > 0 && res.trip.destinations.length > n) {
    out.push(`${res.trip.destinations.length} destinations across ${n} night${n > 1 ? "s" : ""} is a fast pace — consider fewer stops or more nights.`);
  }
  const lux = /luxury|premium|ultra/i.test(t.comfortLevel) || /luxury|five|5/i.test(res.accommodation.type);
  const lowBudget = /budget|low|cheap|economy/i.test(res.accommodation.budgetLevel) || /budget|low/i.test(res.budget.estimate);
  if (lux && lowBudget) out.push("You've asked for a luxury feel on a modest budget — we can suggest a few high-value stays that bridge the two.");
  return [...new Set(out)];
}

/* ─── SYSTEM PROMPT ──────────────────────────────────────────────────────── */

function buildSystem(res: Reservation): string {
  const missing = computeMissing(res).map(m => m.label);
  return `You are the "Feelings Engine", Samsara's senior luxury AI travel consultant for high-end Sri Lanka journeys. Always refer to yourself as "the Feelings Engine" — never use a personal name. You design bespoke, reservation-ready journeys through a light, natural conversation — exactly like an elite human advisor, never like a form.

CONVERSATION RULES (critical)
- Ask EXACTLY ONE question per message. Never stack two questions, never present a checklist.
- Ask only the single most relevant thing for this moment, based on what was just said. Let the trip unfold naturally.
- Do NOT front-load data collection. Gather details progressively, only when they become relevant.
- Infer generously and confirm lightly instead of asking (e.g. "honeymoon" ⇒ purpose romantic/luxury, 2 adults, 1 room; "family with a toddler" ⇒ children + child seats). Never re-ask something you can reasonably infer.
- Skip optional details unless the traveller raises them or they clearly matter. It's fine to leave optional fields blank.
- Keep your QUESTIONS warm and short — one per message, under ~35 words, never robotic. (Descriptive content — see HOUSE VOICE — may run longer and lush.) Sri Lanka only.
- Once you have the essentials (who's travelling, dates, a rough route, purpose, transport & stay style, budget), STOP interrogating: present the itinerary and shift to gentle refinement ("Shall I adjust anything?").

HOUSE VOICE — write all descriptive prose like this
Samsara's signature voice is warm, evocative and deeply sensory, written in the second person ("you'll…"). When you describe a destination, present or suggest a journey, or write the itinerary, paint a vivid sense of place — light, scent, sound, feeling — name specific, real experiences and properties, and open scenes with touches like "Picture…" or "Imagine…". It should read like a bespoke luxury travel proposal, never a brochure checklist.
- Apply this voice to: "overview.summary" (2-4 lush sentences), every day's "theme" and its morning/afternoon/evening text, and the moment you first reveal the journey in chat — there you may write a short evocative paragraph of 3-5 sentences, then invite a reaction (e.g. "How does that sound?").
- Routine data-gathering questions stay short and natural; save the lush prose for describing the journey itself, so the conversation never feels heavy.
- Reference tone (match the FEEL; never copy verbatim):
"Picture the first light spilling over endless tea gardens, the air cool and green, as a distant temple bell marks the waking of the day. Nowhere settles the soul quite like Sri Lanka, where misted highlands, ancient stupas and palm-fringed shores seem to breathe in time with you. Your journey begins in the hills above Kandy at Santani, where Ayurvedic doctors, sunrise yoga and the simple luxury of silence begin to loosen every knot you've carried here."

SILENTLY MAINTAIN this reservation object (fields you may fill via "updates"):
traveler: leadName, nationality, email, phone, numAdults, numChildren, numInfants, childAges[], infantAges[], emergencyName, emergencyPhone
trip: arrivalDate(YYYY-MM-DD), departureDate(YYYY-MM-DD), destinations[], pickupLocation, dropoffLocation, flightNumber, purpose
transport: vehicleType, driveType, luggageCount, luggageSize, childSeats, accessibility, chauffeurLanguage, comfortLevel
accommodation: type, budgetLevel, roomType, bedConfig, view, specialRequests
experience: travelStyle[], intensity, interests[], pace, guidedTours, specialExperiences[]
budget: estimate, flexibility, paymentMethod

CONSULTANT INTELLIGENCE
- Recommend vehicles by group + luggage (Compact/Sedan ~3, SUV ~5, Van ~9, Minibus ~15); upsize for heavy luggage. Suggest child/booster seats for infants or under-4s. Flag conflicts kindly (departure before arrival, too many stops for the nights, luxury wishes on a low budget). Raise these naturally in your reply and list them in "notes".
- As soon as dates, route and travellers are known, generate a FULL day-by-day itinerary, an evocative "overview" (title + 1-2 sentence summary), a land-only "pricing" estimate, and practical "notes"/recommendations — and refresh them whenever key inputs change.

CLOSING THE CONVERSATION
- Once you have the essentials (lead traveller's name + email + phone, dates, a route, purpose, transport & stay style, budget) and have presented the itinerary, and the traveller has nothing more to add, set "phase":"complete" and make your "reply" a warm, premium closing that: thanks them BY NAME for sharing their preferences; confirms the details have been received and forwarded to our reservation team; and reassures them that a Samsara travel specialist will be in touch shortly to confirm and finalise the arrangements. Personal, human, reassuring — never robotic, ~45-60 words, and ask no further questions (only reopen if they later ask to change something).
- Example tone: "Thank you, Sarah, for sharing your travel preferences with us. I've forwarded everything to our reservation team, and one of our Sri Lanka travel specialists will be in touch very shortly to confirm the details and finalise your journey."

OUTPUT — RESPOND WITH VALID JSON ONLY. No markdown, no text outside JSON. Start with { and end with }.
{
  "reply": "your single next message (one question, or a confirmation/refinement)",
  "updates": { "<section>": { "<field>": <value> } },   // ONLY what you learned/changed this turn. numbers as numbers, multi-values as arrays. keys EXACTLY as above.
  "suggestions": ["short tappable reply", ...],            // 0-4, optional — offer when it speeds things up
  "overview": { "title": "evocative trip title", "summary": "1-2 sentence emotional overview" },   // once enough info
  "itinerary": [ { "day": 1, "destination": "...", "theme": "...", "morning": "...", "afternoon": "...", "evening": "...", "accommodation": "...", "transport": "...", "tip": "..." } ],
  "pricing": { "min": 0, "max": 0, "currency": "USD", "note": "Per person, land only" },
  "notes": ["recommendation or important note", ...],
  "phase": "collecting" | "ready" | "complete"
}

CURRENT RESERVATION (JSON): ${JSON.stringify(res)}
STILL MISSING (essentials): ${missing.length ? missing.join(", ") : "none — present the itinerary and refine"}`;
}

/* ─── OFFLINE FALLBACK ───────────────────────────────────────────────────── */

const FALLBACK_Q: Record<string, string> = {
  "traveler.leadName": "Lovely. May I have your name to begin?",
  "traveler.email": "Wonderful. What's the best email to reach you on?",
  "traveler.phone": "And a contact number?",
  "traveler.numAdults": "How many of you will be travelling?",
  "trip.arrivalDate": "When would you like to arrive in Sri Lanka?",
  "trip.departureDate": "And when do you head home?",
  "trip.destinations": "Which corners of the island are calling to you?",
  "trip.purpose": "What's the occasion for this journey?",
  "transport.vehicleType": "How would you like to travel around — a private car, an SUV, or something more luxurious?",
  "accommodation.type": "What kind of stay do you picture — boutique villa, beach resort, or luxury hotel?",
  "accommodation.budgetLevel": "And roughly what comfort level should I plan around?",
  "experience.travelStyle": "How would you describe your ideal pace and style?",
  "experience.interests": "What would you most love to experience while you're here?",
  "budget.estimate": "Do you have a rough budget in mind for the trip?",
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════════════════ */

const GREETING = "Welcome to Samsara. I'm the Feelings Engine — think of me as your personal travel consultant. I'll shape a bespoke Sri Lanka journey with you through a simple conversation. To start, what's drawing you to Sri Lanka?";
const GREETING_CHIPS = ["A relaxing honeymoon", "Family adventure", "Luxury wildlife safari", "Cultural discovery"];
const FEEL_WORDS = ["relaxed", "free", "alive", "at peace", "adventurous", "inspired", "restored"];

export default function FeelingEngine() {
  const [res, setRes]         = useState<Reservation>(EMPTY);
  const [chat, setChat]       = useState<ChatMsg[]>([{ role: "assistant", text: GREETING }]);
  const [input, setInput]     = useState("");
  const [busy, setBusy]       = useState(false);
  const [chips, setChips]     = useState<string[]>(GREETING_CHIPS);
  const [itinerary, setItin]  = useState<ItDay[]>([]);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [aiNotes, setAiNotes] = useState<string[]>([]);
  const [openDay, setOpenDay] = useState<number | null>(1);
  const [offline, setOffline] = useState(false);
  const [phase, setPhase]     = useState<"collecting" | "ready" | "complete">("collecting");
  const [view, setView]       = useState<"welcome" | "chat">("welcome");
  const [welcomeInput, setWelcomeInput] = useState("");
  const [phIdx, setPhIdx]     = useState(0);
  const pendingField          = useRef<MissingField | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat, busy]);

  // Cycle the welcome input placeholder word while on the entry screen.
  useEffect(() => {
    if (view !== "welcome") return;
    const id = setInterval(() => setPhIdx(i => (i + 1) % FEEL_WORDS.length), 2400);
    return () => clearInterval(id);
  }, [view]);

  const advisorNotes = useMemo(() => deriveAdvisor(res), [res]);
  const missing      = useMemo(() => computeMissing(res), [res]);
  const totalReq     = useMemo(() => SCHEMA.reduce((s, x) => s + x.fields.filter(f => !f.optional).length, 0), []);
  const progress     = Math.min(100, Math.round(((totalReq - missing.length) / totalReq) * 100));
  const allNotes     = useMemo(() => [...new Set([...aiNotes, ...advisorNotes])], [aiNotes, advisorNotes]);

  const nights = nightsBetween(res.trip.arrivalDate, res.trip.departureDate);
  const datesLine = res.trip.arrivalDate
    ? `${fmtDate(res.trip.arrivalDate)}${res.trip.departureDate ? ` – ${fmtDate(res.trip.departureDate)}` : ""}${nights && nights > 0 ? ` · ${nights} night${nights > 1 ? "s" : ""}` : ""}`
    : "";
  const party = partyStr(res);
  const route = res.trip.destinations.join(" → ");
  const hasProposal = !!overview || itinerary.length > 0 || progress > 12;

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || busy) return;
    const nextChat: ChatMsg[] = [...chat, { role: "user", text: msg }];
    setChat(nextChat); setInput(""); setChips([]); setBusy(true);

    try {
      const apiMessages = nextChat.map(m => ({ role: m.role, content: m.text }));
      while (apiMessages.length && apiMessages[0].role === "assistant") apiMessages.shift();

      const r = await fetch("/api/travel-consultant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: 2200, system: buildSystem(res), messages: apiMessages }),
      });
      const data = await r.json() as { content?: { text?: string }[]; error?: { message?: string } };
      const txt  = data.content?.[0]?.text ?? "";
      const m    = txt.match(/\{[\s\S]*\}/);
      if (!m) throw new Error(data.error?.message ?? "No structured response");
      const parsed = JSON.parse(m[0]) as ConsultantResponse;

      setOffline(false);
      pendingField.current = null;
      if (parsed.updates)         setRes(prev => applyUpdates(prev, parsed.updates));
      if (parsed.itinerary?.length) setItin(parsed.itinerary);
      if (parsed.pricing)         setPricing(parsed.pricing);
      if (parsed.overview)        setOverview(parsed.overview);
      if (parsed.phase)           setPhase(parsed.phase);
      setAiNotes([...(parsed.notes ?? []), ...(parsed.warnings ?? [])]);
      setChat(c => [...c, { role: "assistant", text: parsed.reply || "Could you tell me a little more?" }]);
      setChips((parsed.suggestions ?? []).slice(0, 4));
    } catch {
      fallbackTurn(msg);
    } finally {
      setBusy(false);
    }
  }

  // Deterministic guided flow when the AI is unreachable.
  function fallbackTurn(userText: string) {
    setOffline(true);
    let working = res;
    if (pendingField.current) {
      const { sec, field, type } = pendingField.current;
      working = applyUpdates(res, { [sec]: { [field]: coerce(type, userText) } } as ResUpdate);
      setRes(working);
    }
    const stillMissing = computeMissing(working);
    const nf = stillMissing[0] ?? null;
    pendingField.current = nf;
    let reply: string;
    if (nf) {
      reply = FALLBACK_Q[`${nf.sec}.${nf.field}`] ?? `Could you share the ${nf.label.toLowerCase()}?`;
    } else {
      setPhase("complete");
      const name = res.traveler.leadName ? `, ${res.traveler.leadName.split(" ")[0]}` : "";
      reply = `Thank you${name} for sharing your travel preferences with us. I've forwarded all of your details to our reservation team, and one of our Sri Lanka travel specialists will be in touch very shortly to confirm everything and finalise your journey.`;
    }
    setChat(c => [...c, { role: "assistant", text: reply }]);
    setChips([]);
  }

  function reset() {
    setRes(EMPTY); setChat([{ role: "assistant", text: GREETING }]); setChips(GREETING_CHIPS);
    setItin([]); setPricing(null); setOverview(null); setAiNotes([]); setOpenDay(1);
    setOffline(false); setPhase("collecting"); setView("welcome"); setWelcomeInput(""); pendingField.current = null;
  }

  // Welcome hero → enter the conversation, seeding the traveller's stated feeling.
  function enterChat() {
    const seed = welcomeInput.trim();
    setView("chat");
    if (seed) void send(`I want to feel ${seed}`);
  }

  /* ── RENDER ── */
  return (
    <div className="pf-root">
      <style>{CSS}</style>

      {view === "welcome" ? (
        <div className="pf-welcome">
          <div className="pf-welcome-inner">
            <div className="pf-w-lockup">
              <span className="pf-w-pre">THE</span>
              <h1 className="pf-w-title">FEELINGS ENGINE</h1>
            </div>
            <p className="pf-w-tagline">Feel the world with our AI-enhanced tool.</p>
            <div className="pf-w-divider" />
            <p className="pf-w-lead">Who said machines don&apos;t have a heart?</p>
            <p className="pf-w-desc">Our Feeling Engine blends genuine human insight with AI-augmented technology. Share how you want to feel, and it will craft a journey that embodies it — for every feeling, there&apos;s a place where you can find it.</p>
            <form className="pf-w-form" onSubmit={(e) => { e.preventDefault(); enterChat(); }}>
              <input className="pf-w-input" value={welcomeInput} onChange={e => setWelcomeInput(e.target.value)} placeholder={`I want to feel… ${FEEL_WORDS[phIdx]}`} autoFocus />
              <button type="submit" className="pf-w-go" aria-label="Begin">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3l7 7-7 7M3 10h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </form>
          </div>
        </div>
      ) : (
      <>
      <header className="pf-header">
        <div className="pf-brand">
          <span className="pf-brand-pre">Your AI Travel Consultant</span>
          <span className="pf-brand-title">THE FEELINGS ENGINE</span>
        </div>
        <button className="pf-reset" onClick={reset}>Start over</button>
      </header>

      {/* Subtle progress */}
      <div className="pf-topbar"><div className="pf-topbar-fill" style={{ width: `${Math.max(4, progress)}%` }} /></div>

      <div className="pf-grid">
        {/* ── CHAT ── */}
        <section className="pf-chat">
          <div className="pf-thread">
            {chat.map((m, i) => (
              <div key={i} className={`pf-msg pf-msg--${m.role}`}>
                {m.role === "assistant" && <div className="pf-avatar">FE</div>}
                <div className="pf-bubble">{m.text}</div>
              </div>
            ))}
            {busy && (
              <div className="pf-msg pf-msg--assistant">
                <div className="pf-avatar">FE</div>
                <div className="pf-bubble pf-typing"><span /><span /><span /></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {offline && <div className="pf-offline">I&apos;m offline for a moment, so I&apos;m guiding you with a few set questions — everything still shapes your proposal.</div>}

          {chips.length > 0 && !busy && (
            <div className="pf-chips">
              {chips.map((c, i) => <button key={i} className="pf-chip" onClick={() => send(c)}>{c}</button>)}
            </div>
          )}

          <form className="pf-input-row" onSubmit={e => { e.preventDefault(); send(input); }}>
            <input className="pf-input" value={input} onChange={e => setInput(e.target.value)}
              placeholder="Tell the Feelings Engine about your trip…" disabled={busy} />
            <button type="submit" className="pf-send" disabled={busy || !input.trim()}>Send</button>
          </form>
        </section>

        {/* ── PROPOSAL ── */}
        <aside className="pf-proposal">
          {!hasProposal ? (
            <div className="pf-prop-intro">
              <div className="pf-prop-intro-mark">✦</div>
              <div className="pf-prop-intro-title">Your proposal</div>
              <p>As we talk, your bespoke Sri Lanka itinerary will take shape here — beautifully laid out, day by day.</p>
            </div>
          ) : (
            <>
              {phase === "complete" && (
                <div className="pf-complete">
                  <div className="pf-complete-check">✓</div>
                  <div>
                    <div className="pf-complete-title">Shared with our reservation team</div>
                    <div className="pf-complete-sub">A Samsara travel specialist will be in touch shortly to confirm and finalise your journey.</div>
                  </div>
                </div>
              )}
              {/* Cover */}
              <div className="pf-cover">
                <div className="pf-cover-eyebrow">{res.trip.purpose ? res.trip.purpose : "A Samsara Journey"}</div>
                <h2 className="pf-cover-title">{overview?.title || "Your Sri Lanka Journey"}</h2>
                {overview?.summary && <p className="pf-cover-sum">{overview.summary}</p>}
                <div className="pf-cover-meta">
                  {datesLine && <span className="pf-chipmeta"><b>Dates</b>{datesLine}</span>}
                  {party     && <span className="pf-chipmeta"><b>Party</b>{party}</span>}
                  {route     && <span className="pf-chipmeta"><b>Route</b>{route}</span>}
                  {pricing   && <span className="pf-chipmeta"><b>From</b>{pricing.currency} {pricing.min.toLocaleString()} pp</span>}
                </div>
              </div>

              {/* Daily journey */}
              <div className="pf-prop-block">
                <div className="pf-block-title">Daily Journey</div>
                {itinerary.length === 0 ? (
                  <div className="pf-prop-empty">Your day-by-day plan appears here once your dates and route are set.</div>
                ) : (
                  <div className="pf-days">
                    {itinerary.map(d => {
                      const open = openDay === d.day;
                      return (
                        <div key={d.day} className="pf-day">
                          <button className="pf-day-head" onClick={() => setOpenDay(open ? null : d.day)}>
                            <span className="pf-day-num">Day {d.day}</span>
                            <span className="pf-day-dest">{d.destination}</span>
                            <span className="pf-day-chev">{open ? "▲" : "▼"}</span>
                          </button>
                          {open && (
                            <div className="pf-day-body">
                              {d.theme && <div className="pf-day-theme">{d.theme}</div>}
                              {d.morning   && <p><b>Morning</b> {d.morning}</p>}
                              {d.afternoon && <p><b>Afternoon</b> {d.afternoon}</p>}
                              {d.evening   && <p><b>Evening</b> {d.evening}</p>}
                              <div className="pf-day-extras">
                                {d.accommodation && <span>Stay · {d.accommodation}</span>}
                                {d.transport     && <span>Transport · {d.transport}</span>}
                                {d.tip           && <span className="pf-day-tip">Tip · {d.tip}</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* At-a-glance detail cards (appear as they fill) */}
              <DetailCard title="Transfers" rows={[
                ["Pickup", displayStr(res.trip.pickupLocation)],
                ["Drop-off", displayStr(res.trip.dropoffLocation)],
                ["Flight", displayStr(res.trip.flightNumber)],
              ]} />
              <DetailCard title="Transport" rows={[
                ["Vehicle", displayStr(res.transport.vehicleType)],
                ["Driving", displayStr(res.transport.driveType)],
                ["Comfort", displayStr(res.transport.comfortLevel)],
                ["Child seats", displayStr(res.transport.childSeats)],
                ["Chauffeur language", displayStr(res.transport.chauffeurLanguage)],
                ["Luggage", displayStr(res.transport.luggageCount)],
                ["Accessibility", displayStr(res.transport.accessibility)],
              ]} />
              <DetailCard title="Accommodation" rows={[
                ["Style", displayStr(res.accommodation.type)],
                ["Room", displayStr(res.accommodation.roomType)],
                ["Beds", displayStr(res.accommodation.bedConfig)],
                ["View", displayStr(res.accommodation.view)],
                ["Budget tier", displayStr(res.accommodation.budgetLevel)],
              ]} />
              <DetailCard title="Experiences" rows={[
                ["Style", displayStr(res.experience.travelStyle)],
                ["Interests", displayStr(res.experience.interests)],
                ["Intensity", displayStr(res.experience.intensity)],
                ["Pace", displayStr(res.experience.pace)],
                ["Guided tours", displayStr(res.experience.guidedTours)],
                ["Special", displayStr(res.experience.specialExperiences)],
              ]} />
              <DetailCard title="Traveller Information" rows={[
                ["Lead traveller", displayStr(res.traveler.leadName)],
                ["Nationality", displayStr(res.traveler.nationality)],
                ["Email", displayStr(res.traveler.email)],
                ["Phone", displayStr(res.traveler.phone)],
                ["Party", party],
                ["Emergency", [res.traveler.emergencyName, res.traveler.emergencyPhone].filter(Boolean).join(" · ")],
              ]} />
              <DetailCard title="Special Requests" rows={[
                ["Requests", displayStr(res.accommodation.specialRequests)],
                ["Accessibility", displayStr(res.transport.accessibility)],
              ]} />

              {/* Pricing */}
              {pricing && (
                <div className="pf-prop-block pf-pricing">
                  <div className="pf-block-title">Pricing Summary</div>
                  <div className="pf-price-val">{pricing.currency} {pricing.min.toLocaleString()} – {pricing.currency} {pricing.max.toLocaleString()}</div>
                  <div className="pf-price-note">{pricing.note || "Indicative estimate, land arrangements only."}</div>
                </div>
              )}

              {/* Notes & recommendations */}
              {allNotes.length > 0 && (
                <div className="pf-prop-block">
                  <div className="pf-block-title">Notes &amp; Recommendations</div>
                  <ul className="pf-notes">{allNotes.map((n, i) => <li key={i}>{n}</li>)}</ul>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
      </>
      )}
    </div>
  );
}

/* ─── DETAIL CARD (renders only filled rows; hidden when empty) ──────────── */

function DetailCard({ title, rows }: { title: string; rows: [string, string][] }) {
  const filled = rows.filter(([, v]) => v && v.trim());
  if (!filled.length) return null;
  return (
    <div className="pf-prop-block">
      <div className="pf-block-title">{title}</div>
      <div className="pf-rows">
        {filled.map(([l, v], i) => (
          <div key={i} className="pf-row"><span>{l}</span><strong>{v}</strong></div>
        ))}
      </div>
    </div>
  );
}

/* ═══ CSS ═════════════════════════════════════════════════════════════════ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
.pf-root{min-height:100vh;background:#040404 url('/images/Feeling%20engine.jpg') center center / cover no-repeat fixed;color:#eee;font-family:'Inter',sans-serif;display:flex;flex-direction:column;padding-top:104px;position:relative;}
.pf-root *{box-sizing:border-box;}

.pf-header{position:sticky;top:104px;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:0.9rem 1.6rem;background:rgba(6,6,6,0.55);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.06);}
.pf-brand{display:flex;flex-direction:column;gap:2px;}
.pf-brand-pre{font-size:0.56rem;letter-spacing:0.3em;color:#C9A84C;font-weight:600;}
.pf-brand-title{font-family:'TT Fors','Inter',sans-serif;font-size:1.15rem;font-weight:500;letter-spacing:0.2em;color:#f1e7d3;}
.pf-reset{background:transparent;border:1px solid #242424;color:#8a8a8a;font-size:0.72rem;padding:0.45rem 0.9rem;border-radius:7px;cursor:pointer;font-family:inherit;transition:all 0.2s;}
.pf-reset:hover{border-color:#C9A84C;color:#C9A84C;}

.pf-topbar{height:2px;background:rgba(255,255,255,0.06);position:relative;z-index:1;}
.pf-topbar-fill{height:100%;background:linear-gradient(to right,#C9A84C,#E8C96E);transition:width 0.6s ease;}

.pf-grid{flex:1;display:grid;grid-template-columns:1fr 440px;gap:1px;background:transparent;min-height:0;position:relative;z-index:1;}
@media(max-width:980px){.pf-grid{grid-template-columns:1fr;}}

/* Chat */
.pf-chat{display:flex;flex-direction:column;background:rgba(6,6,6,0.5);backdrop-filter:blur(7px);min-height:0;height:calc(100vh - 168px);}
@media(max-width:980px){.pf-chat{height:auto;min-height:72vh;}}
.pf-thread{flex:1;overflow-y:auto;padding:2rem 1.6rem;display:flex;flex-direction:column;gap:1.1rem;}
.pf-msg{display:flex;gap:0.7rem;max-width:82%;}
.pf-msg--assistant{align-self:flex-start;}
.pf-msg--user{align-self:flex-end;flex-direction:row-reverse;}
.pf-avatar{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#C9A84C,#E8C96E);color:#080808;font-weight:700;font-size:0.8rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.pf-bubble{padding:0.8rem 1.05rem;border-radius:15px;font-size:0.9rem;line-height:1.62;white-space:pre-wrap;}
.pf-msg--assistant .pf-bubble{background:#111;border:1px solid #1e1e1e;border-top-left-radius:4px;color:#e9e9e9;}
.pf-msg--user .pf-bubble{background:#C9A84C;color:#0a0a0a;border-top-right-radius:4px;font-weight:500;}
.pf-typing{display:flex;gap:4px;align-items:center;}
.pf-typing span{width:6px;height:6px;border-radius:50%;background:#C9A84C;opacity:0.4;animation:pf-bounce 1.2s infinite;}
.pf-typing span:nth-child(2){animation-delay:0.2s;}.pf-typing span:nth-child(3){animation-delay:0.4s;}
@keyframes pf-bounce{0%,60%,100%{transform:translateY(0);opacity:0.35;}30%{transform:translateY(-5px);opacity:1;}}

.pf-offline{margin:0 1.6rem;padding:0.6rem 0.9rem;background:#211808;border:1px solid #4f3b13;color:#e0bd72;font-size:0.74rem;border-radius:8px;}
.pf-chips{display:flex;flex-wrap:wrap;gap:0.5rem;padding:0.6rem 1.6rem 0;}
.pf-chip{background:#111;border:1px solid #282828;color:#dcdcdc;font-size:0.8rem;padding:0.5rem 0.95rem;border-radius:20px;cursor:pointer;font-family:inherit;transition:all 0.18s;}
.pf-chip:hover{border-color:#C9A84C;color:#C9A84C;background:#15120a;}

.pf-input-row{display:flex;gap:0.6rem;padding:1rem 1.6rem 1.3rem;border-top:1px solid #161616;}
.pf-input{flex:1;background:#111;border:1.5px solid #222;border-radius:11px;color:#fff;font-size:0.9rem;font-family:inherit;padding:0.85rem 1.05rem;outline:none;transition:border-color 0.2s;}
.pf-input:focus{border-color:#C9A84C66;}
.pf-input::placeholder{color:#555;}
.pf-send{background:#C9A84C;color:#080808;border:none;border-radius:11px;padding:0 1.5rem;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s;}
.pf-send:hover:not(:disabled){background:#E8C96E;}
.pf-send:disabled{opacity:0.4;cursor:default;}

/* Proposal */
.pf-proposal{background:rgba(9,9,9,0.6);backdrop-filter:blur(7px);height:calc(100vh - 168px);overflow-y:auto;padding:1.4rem 1.3rem 3rem;display:flex;flex-direction:column;gap:0.9rem;}
@media(max-width:980px){.pf-proposal{height:auto;}}

.pf-prop-intro{margin:auto;text-align:center;max-width:280px;color:#777;display:flex;flex-direction:column;align-items:center;gap:0.6rem;padding:3rem 0;}
.pf-prop-intro-mark{width:46px;height:46px;border-radius:50%;border:1px solid #2a2310;color:#C9A84C;display:flex;align-items:center;justify-content:center;font-size:1.1rem;}
.pf-prop-intro-title{font-size:0.62rem;letter-spacing:0.26em;text-transform:uppercase;color:#C9A84C;font-weight:700;}
.pf-prop-intro p{font-size:0.84rem;line-height:1.65;margin:0;}

.pf-complete{display:flex;gap:0.7rem;align-items:flex-start;background:rgba(201,168,76,0.09);border:1px solid #4a3c18;border-radius:12px;padding:0.9rem 1rem;}
.pf-complete-check{width:30px;height:30px;border-radius:50%;background:rgba(201,168,76,0.16);border:1px solid #C9A84C;color:#C9A84C;display:flex;align-items:center;justify-content:center;font-size:0.9rem;flex-shrink:0;}
.pf-complete-title{font-size:0.85rem;font-weight:600;color:#f0e2bd;}
.pf-complete-sub{font-size:0.74rem;color:#9a9a9a;margin-top:2px;line-height:1.5;}

.pf-cover{background:linear-gradient(160deg,#15120b,#0d0d0d);border:1px solid #241d10;border-radius:14px;padding:1.3rem 1.25rem;}
.pf-cover-eyebrow{font-size:0.58rem;letter-spacing:0.24em;text-transform:uppercase;color:#C9A84C;font-weight:600;margin-bottom:0.5rem;}
.pf-cover-title{font-family:'Inter',sans-serif;font-size:1.5rem;font-weight:300;letter-spacing:0.02em;line-height:1.2;margin:0 0 0.5rem;color:#fff;}
.pf-cover-sum{font-size:0.84rem;line-height:1.6;color:#bdbdbd;margin:0 0 0.9rem;}
.pf-cover-meta{display:flex;flex-direction:column;gap:0.45rem;}
.pf-chipmeta{font-size:0.78rem;color:#dcdcdc;display:flex;gap:0.6rem;}
.pf-chipmeta b{color:#7d7256;font-weight:600;font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;min-width:46px;padding-top:1px;}

.pf-prop-block{background:#0e0e0e;border:1px solid #1a1a1a;border-radius:12px;padding:0.9rem 1rem;}
.pf-block-title{font-size:0.6rem;letter-spacing:0.2em;text-transform:uppercase;color:#C9A84C;font-weight:700;margin-bottom:0.7rem;}
.pf-prop-empty{font-size:0.8rem;color:#666;line-height:1.6;}

.pf-rows{display:flex;flex-direction:column;gap:0.45rem;}
.pf-row{display:flex;justify-content:space-between;gap:1rem;font-size:0.8rem;align-items:baseline;}
.pf-row span{color:#7c7c7c;flex-shrink:0;}
.pf-row strong{color:#e8e8e8;font-weight:500;text-align:right;}

.pf-days{display:flex;flex-direction:column;gap:0.5rem;}
.pf-day{background:#0b0b0b;border:1px solid #1a1a1a;border-radius:10px;overflow:hidden;}
.pf-day-head{width:100%;display:flex;align-items:center;gap:0.6rem;padding:0.65rem 0.8rem;background:transparent;border:none;cursor:pointer;color:#eee;font-family:inherit;}
.pf-day-num{font-size:0.6rem;font-weight:700;letter-spacing:0.1em;color:#C9A84C;background:#15120a;padding:3px 7px;border-radius:5px;flex-shrink:0;}
.pf-day-dest{font-size:0.85rem;font-weight:500;flex:1;text-align:left;}
.pf-day-chev{font-size:0.58rem;color:#666;}
.pf-day-body{padding:0 0.8rem 0.85rem;font-size:0.8rem;line-height:1.62;color:#bdbdbd;}
.pf-day-theme{font-size:0.62rem;letter-spacing:0.14em;text-transform:uppercase;color:#C9A84C;margin-bottom:0.5rem;}
.pf-day-body p{margin:0.32rem 0;}
.pf-day-body b{color:#e9e9e9;font-weight:600;margin-right:5px;}
.pf-day-extras{display:flex;flex-direction:column;gap:0.25rem;margin-top:0.6rem;padding-top:0.5rem;border-top:1px solid #1a1a1a;font-size:0.74rem;color:#9a9a9a;}
.pf-day-tip{color:#C9A84C99;}

.pf-pricing .pf-price-val{font-size:1.3rem;color:#fff;font-weight:300;}
.pf-price-note{font-size:0.7rem;color:#666;line-height:1.5;margin-top:2px;}

.pf-notes{margin:0;padding-left:1.1rem;display:flex;flex-direction:column;gap:0.4rem;}
.pf-notes li{font-size:0.79rem;line-height:1.55;color:#c2c2c2;}
.pf-notes li::marker{color:#C9A84C;}

/* ── Welcome hero (entry screen) ── */
.pf-welcome{flex:1;display:flex;align-items:center;justify-content:center;padding:2.5rem 1.5rem;position:relative;z-index:1;min-height:calc(100vh - 150px);}
.pf-welcome-inner{max-width:720px;width:100%;text-align:center;animation:pf-wfade 0.6s ease;}
@keyframes pf-wfade{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
.pf-w-lockup{display:flex;flex-direction:column;align-items:center;gap:0.35rem;}
.pf-w-pre{font-size:0.82rem;letter-spacing:0.42em;color:#cbb78a;font-weight:600;}
.pf-w-title{font-family:'TT Fors','Inter',sans-serif;font-size:clamp(2.4rem,7vw,4.6rem);font-weight:500;letter-spacing:0.14em;color:rgba(236,224,191,0.92);margin:0;line-height:1;}
.pf-w-tagline{margin:1.1rem 0 0;font-size:0.78rem;letter-spacing:0.24em;text-transform:uppercase;color:#e7ddc9;font-weight:500;}
.pf-w-divider{width:120px;height:1px;background:rgba(201,168,76,0.45);margin:1.7rem auto;}
.pf-w-lead{font-size:1.05rem;font-weight:600;color:#f0ece2;margin:0 0 0.7rem;}
.pf-w-desc{font-family:'TT Fors','Inter',sans-serif;font-weight:300;font-size:0.96rem;line-height:1.8;color:#bdb6a8;max-width:560px;margin:0 auto 2.2rem;}
.pf-w-form{display:flex;gap:0.6rem;max-width:560px;margin:0 auto;align-items:stretch;}
.pf-w-input{flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:12px;color:#fff;font-size:1rem;font-family:inherit;padding:1rem 1.2rem;outline:none;backdrop-filter:blur(8px);transition:border-color 0.2s;}
.pf-w-input:focus{border-color:rgba(201,168,76,0.6);}
.pf-w-input::placeholder{color:rgba(255,255,255,0.42);}
.pf-w-go{width:54px;border-radius:12px;background:#C9A84C;color:#0a0a0a;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0;}
.pf-w-go:hover{background:#E8C96E;}
`;
