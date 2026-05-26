"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div style={{
      height: 420, borderRadius: 14, background: "#0a1628",
      border: "1px solid rgba(201,168,76,0.2)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#C9A84C", fontFamily: "TT Fors, sans-serif", fontSize: 16,
      letterSpacing: "0.1em",
    }}>
      Loading map…
    </div>
  ),
});

/* ─── TYPES ─────────────────────────────────────────────────── */

type Phase =
  | "welcome" | "feelings" | "destinations" | "route" | "pickup"
  | "stay" | "move" | "experiences" | "details"
  | "generating" | "itinerary";

type BookStatus = "idle" | "submitting" | "success" | "error";

// Everything we persist to localStorage so a refresh resumes the journey.
// dayImgs are intentionally excluded — they're object URLs that die on reload.
interface Snapshot {
  v: number; phase: Phase;
  selFeelings: string[]; selDests: string[]; route: DestItem[];
  selStay: string[]; selMove: string[]; selExp: string[];
  budget: string; groupType: string; groupSize: string;
  startDate: string; dietary: string; notes: string;
  pickup: PickupLoc | null; dropoff: PickupLoc | null;
  welcomeInput: string; itinerary: Itinerary | null;
}

interface DestItem {
  id: string; name: string; region: string; image: string;
  tags: string[]; desc: string; duration: string; budget: string;
  feelings: string[]; highlight: string;
  geoOrder: number; svgX: number; svgY: number; days: number;
}

interface CardItem { id: string; label: string; emoji: string; image: string; desc: string; }

interface ItDay {
  day: number; destination: string; theme: string;
  morning: string; afternoon: string; evening: string;
  accommodation: string; transport: string; tip: string;
}

interface Itinerary {
  title: string; tagline: string; narrative: string; totalDays: number;
  estimatedBudget: { min: number; max: number; currency: string; note: string };
  days: ItDay[]; highlights: string[]; accommodationList: string[]; essentialTips: string[];
}

/* ─── FEELINGS ──────────────────────────────────────────────── */

const FEELINGS = [
  { id: "relaxed",     label: "Relaxed",           emoji: "", desc: "Unwind, rest, let go",          color: "#2471A3" },
  { id: "adventurous", label: "Adventurous",        emoji: "", desc: "Thrill-seeking & exploration",  color: "#D35400" },
  { id: "romantic",    label: "Romantic",           emoji: "", desc: "Intimate & unforgettable",      color: "#A93226" },
  { id: "luxury",      label: "Luxury",             emoji: "", desc: "The finest experiences only",   color: "#B7950B" },
  { id: "peaceful",    label: "Peaceful",           emoji: "", desc: "Serenity & mindfulness",        color: "#1E8449" },
  { id: "cultural",    label: "Cultural",           emoji: "", desc: "History, art & traditions",     color: "#6C3483" },
  { id: "wildlife",    label: "Wildlife & Nature",  emoji: "", desc: "Safari & natural wonders",      color: "#117A65" },
  { id: "wellness",    label: "Wellness & Healing", emoji: "", desc: "Ayurveda & restoration",        color: "#148F77" },
  { id: "family",      label: "Family-Friendly",    emoji: "", desc: "Fun memories for all ages",    color: "#1A5276" },
] as const;

/* ─── DESTINATIONS ──────────────────────────────────────────── */

const DESTINATIONS: DestItem[] = [
  { id: "ella", name: "Ella", region: "Central Highlands",
    image: "/images/hill-country.webp", tags: ["Nature","Peaceful","Adventure"],
    desc: "Misty mountains, the iconic Nine Arch Bridge, and emerald tea plantations define this highland gem.",
    duration: "2–3 days", budget: "$60–$200/night",
    feelings: ["relaxed","adventurous","peaceful","wildlife"],
    highlight: "Nine Arch Bridge & Little Adam's Peak",
    geoOrder: 6, svgX: 188, svgY: 248, days: 2 },
  { id: "mirissa", name: "Mirissa", region: "Southern Coast",
    image: "/images/theSouth_1.webp", tags: ["Beach","Romantic","Vibrant"],
    desc: "A crescent-shaped paradise with world-class whale watching and cinematic sunset scenes.",
    duration: "2–3 days", budget: "$50–$250/night",
    feelings: ["relaxed","romantic","adventurous","luxury"],
    highlight: "Blue Whale Watching at Dawn",
    geoOrder: 10, svgX: 148, svgY: 352, days: 2 },
  { id: "sigiriya", name: "Sigiriya", region: "Cultural Triangle",
    image: "/images/dest-3.webp", tags: ["Culture","History","Adventure"],
    desc: "An ancient rock fortress rising 200m above the jungle — a UNESCO World Heritage Site.",
    duration: "1–2 days", budget: "$70–$300/night",
    feelings: ["cultural","adventurous","luxury"],
    highlight: "Sunrise Climb of the Lion Rock",
    geoOrder: 3, svgX: 172, svgY: 118, days: 2 },
  { id: "yala", name: "Yala", region: "Southeast",
    image: "/images/dest-2.webp", tags: ["Wildlife","Safari","Adventure"],
    desc: "Sri Lanka's premier wildlife sanctuary — the world's highest density of leopards per square kilometre.",
    duration: "2 days", budget: "$80–$400/night",
    feelings: ["wildlife","adventurous","family"],
    highlight: "Dawn Leopard Safari",
    geoOrder: 8, svgX: 215, svgY: 308, days: 2 },
  { id: "nuwara-eliya", name: "Nuwara Eliya", region: "Hill Country",
    image: "/images/dest-1.webp", tags: ["Peaceful","Scenic","Wellness"],
    desc: "The 'Little England' of Sri Lanka — rolling tea estates, colonial architecture, and cool mountain air.",
    duration: "2 days", budget: "$50–$180/night",
    feelings: ["peaceful","relaxed","wellness","romantic"],
    highlight: "Tea Plantation Sunrise Walk",
    geoOrder: 5, svgX: 175, svgY: 218, days: 2 },
  { id: "arugam-bay", name: "Arugam Bay", region: "East Coast",
    image: "/images/dest-5.webp", tags: ["Surfing","Adventure","Beach"],
    desc: "A world-renowned surf break on Sri Lanka's wild, unspoiled east coast.",
    duration: "3–4 days", budget: "$30–$150/night",
    feelings: ["adventurous","relaxed","wellness"],
    highlight: "Riding the Main Point Break",
    geoOrder: 7, svgX: 234, svgY: 220, days: 3 },
  { id: "galle", name: "Galle", region: "Southwest Coast",
    image: "/images/galle.webp", tags: ["Luxury","Culture","History"],
    desc: "A perfectly preserved Dutch colonial fort city with boutique hotels, galleries, and ocean ramparts.",
    duration: "2–3 days", budget: "$100–$600/night",
    feelings: ["luxury","cultural","romantic","relaxed"],
    highlight: "Sunset on the Fort Ramparts",
    geoOrder: 11, svgX: 112, svgY: 345, days: 2 },
  { id: "kandy", name: "Kandy", region: "Central Province",
    image: "/images/dest-4.webp", tags: ["Culture","Spiritual","Heritage"],
    desc: "Sri Lanka's cultural capital — the sacred Temple of the Tooth and traditional Kandyan dance.",
    duration: "2 days", budget: "$60–$250/night",
    feelings: ["cultural","peaceful","family","wellness"],
    highlight: "Temple of the Tooth at Dusk",
    geoOrder: 4, svgX: 162, svgY: 172, days: 2 },
  { id: "tangalle", name: "Tangalle", region: "Southern Coast",
    image: "/images/the-south.webp", tags: ["Peaceful","Remote","Luxury"],
    desc: "Wild beaches, sea turtles nesting at night, and some of Sri Lanka's most exclusive hidden resorts.",
    duration: "2–3 days", budget: "$80–$500/night",
    feelings: ["peaceful","luxury","romantic","wellness"],
    highlight: "Turtle Nesting on the Beach",
    geoOrder: 9, svgX: 172, svgY: 365, days: 2 },
  { id: "colombo", name: "Colombo", region: "Western Province",
    image: "/images/theSouth_2.webp", tags: ["City","Food","Modern"],
    desc: "A dynamic capital blending colonial heritage with a modern skyline and world-class dining.",
    duration: "1–2 days", budget: "$100–$400/night",
    feelings: ["luxury","cultural","family"],
    highlight: "Colombo City Food Tour",
    geoOrder: 12, svgX: 78, svgY: 165, days: 1 },
  { id: "trincomalee", name: "Trincomalee", region: "East Coast",
    image: "/images/galle-beach-scaled.webp", tags: ["Beach","Diving","Peaceful"],
    desc: "Pristine beaches, a natural harbour, and Asia's finest snorkelling — virtually untouched.",
    duration: "2–3 days", budget: "$40–$200/night",
    feelings: ["relaxed","adventurous","peaceful","wildlife"],
    highlight: "Snorkelling Pigeon Island",
    geoOrder: 2, svgX: 218, svgY: 88, days: 2 },
];

/* ─── STAYS ─────────────────────────────────────────────────── */

const STAYS: CardItem[] = [
  { id: "luxury-hotel",   label: "Luxury Hotels",    emoji: "", image: "/images/hotels/amangalla.webp",    desc: "5-star world-class properties" },
  { id: "boutique-villa", label: "Boutique Villas",  emoji: "", image: "/images/hotels/cape-waligma.webp", desc: "Private & intimate escapes" },
  { id: "eco-lodge",      label: "Eco Lodges",       emoji: "", image: "/images/dest-1.webp",              desc: "Sustainable stays in nature" },
  { id: "budget-stay",    label: "Budget Stays",     emoji: "", image: "/images/trip-3.webp",             desc: "Comfortable & affordable" },
  { id: "beach-resort",   label: "Beach Resorts",    emoji: "", image: "/images/theSouth_1.webp",          desc: "Oceanfront luxury & leisure" },
  { id: "glamping",       label: "Glamping",         emoji: "", image: "/images/galle-g-1.webp",          desc: "Luxury camping in the wild" },
];

/* ─── TRANSPORT ─────────────────────────────────────────────── */

const MOVES: CardItem[] = [
  { id: "private-car",     label: "Private Car",       emoji: "", image: "/images/galle-trip-1.webp", desc: "Comfort & full flexibility" },
  { id: "chauffeur",       label: "Chauffeur Service", emoji: "", image: "/images/galle-trip-2.webp", desc: "Premium door-to-door" },
  { id: "tuk-tuk",         label: "Tuk Tuk",           emoji: "", image: "/images/galle-trip-3.webp", desc: "Authentic local experience" },
  { id: "train",           label: "Train Journeys",    emoji: "", image: "/images/galle-trip-4.webp", desc: "Scenic highland railways" },
  { id: "domestic-flight", label: "Domestic Flights",  emoji: "", image: "/images/galle-trip-5.webp", desc: "Save time between regions" },
  { id: "rental",          label: "Rental Vehicles",   emoji: "", image: "/images/trip-4.webp",       desc: "Full freedom to explore" },
];

/* ─── ACTIVITIES ─────────────────────────────────────────────── */

const EXPERIENCES: CardItem[] = [
  { id: "safari",      label: "Safari",               emoji: "", image: "/images/dest-2.webp",             desc: "Wildlife in their habitat" },
  { id: "whale",       label: "Whale Watching",       emoji: "", image: "/images/galle-act-1.webp",        desc: "Blue whales off Mirissa" },
  { id: "hiking",      label: "Hiking & Trekking",    emoji: "", image: "/images/galle-act-2.webp",        desc: "Highland trails & jungle walks" },
  { id: "surfing",     label: "Surfing",              emoji: "", image: "/images/dest-5.webp",             desc: "World-class breaks year-round" },
  { id: "tea",         label: "Tea Plantation Tours", emoji: "", image: "/images/galle-act-3.webp",        desc: "Ceylon tea, leaf to cup" },
  { id: "ayurveda",    label: "Ayurveda & Wellness",  emoji: "", image: "/images/trip-1.webp",             desc: "Ancient healing traditions" },
  { id: "cultural",    label: "Cultural Experiences", emoji: "", image: "/images/galle-g-1.webp",          desc: "Temple visits & Kandyan dance" },
  { id: "food",        label: "Food Tours",           emoji: "", image: "/images/galle-trip-2.webp",       desc: "Sri Lankan cuisine journey" },
  { id: "diving",      label: "Diving & Snorkelling", emoji: "", image: "/images/galle-beach-scaled.webp", desc: "Coral reefs & shipwrecks" },
  { id: "photography", label: "Photography Tours",    emoji: "", image: "/images/trip-2.webp",             desc: "Capture Sri Lanka's beauty" },
];

/* ─── BUDGET / GROUP ─────────────────────────────────────────── */

const BUDGETS = [
  { id: "budget",       label: "Budget",       range: "$50–$100/day",  desc: "Smart travel, real experiences" },
  { id: "mid-range",    label: "Mid-Range",    range: "$100–$250/day", desc: "Comfort with character" },
  { id: "luxury",       label: "Luxury",       range: "$250–$500/day", desc: "Premium & curated" },
  { id: "ultra-luxury", label: "Ultra-Luxury", range: "$500+/day",     desc: "The absolute finest" },
];

const GROUP_TYPES = [
  { id: "solo",      label: "Solo",      emoji: "" },
  { id: "couple",    label: "Couple",    emoji: "" },
  { id: "family",    label: "Family",    emoji: "" },
  { id: "friends",   label: "Friends",   emoji: "" },
  { id: "honeymoon", label: "Honeymoon", emoji: "" },
];

/* ─── PICKUP / DROP-OFF ──────────────────────────────────────── */

export interface PickupLoc { name: string; coords: [number, number] }

const COMMON_LOCATIONS: PickupLoc[] = [
  { name: "Bandaranaike International Airport (CMB)", coords: [7.1808, 79.8842] },
  { name: "Mattala Rajapaksa Airport (HRI)",          coords: [6.2845, 81.1241] },
  { name: "Colombo City",                             coords: [6.9271, 79.8612] },
  { name: "Negombo",                                  coords: [7.2095, 79.8350] },
  { name: "Kandy",                                    coords: [7.2906, 80.6337] },
  { name: "Galle",                                    coords: [6.0535, 80.2210] },
  { name: "Mirissa",                                  coords: [5.9483, 80.4716] },
  { name: "Ella",                                     coords: [6.8667, 81.0466] },
  { name: "Nuwara Eliya",                             coords: [6.9497, 80.7891] },
  { name: "Tangalle",                                 coords: [6.0240, 80.7929] },
  { name: "Trincomalee",                              coords: [8.5874, 81.2152] },
  { name: "Sigiriya",                                 coords: [7.9570, 80.7603] },
  { name: "Arugam Bay",                               coords: [6.8395, 81.8355] },
  { name: "Yala",                                     coords: [6.3728, 81.5168] },
  { name: "Hikkaduwa",                                coords: [6.1395, 80.1046] },
  { name: "Dambulla",                                 coords: [7.8675, 80.6517] },
  { name: "Anuradhapura",                             coords: [8.3114, 80.4037] },
  { name: "Jaffna",                                   coords: [9.6615, 80.0255] },
];

const QUICK_LOCATIONS: PickupLoc[] = [
  { name: "CMB Airport",  coords: [7.1808, 79.8842] },
  { name: "Colombo",      coords: [6.9271, 79.8612] },
  { name: "Negombo",      coords: [7.2095, 79.8350] },
  { name: "Galle",        coords: [6.0535, 80.2210] },
];

/* ─── AI MODEL ───────────────────────────────────────────────── */

const MODEL = "claude-sonnet-4-6";

const STORAGE_KEY = "fe_session_v1";

/* ─── FREE-TEXT INTERPRETATION PROMPT ────────────────────────── */
// Turns the welcome screen's "I want to feel…" sentence into a head start:
// matching feeling ids + a few destination ids, chosen ONLY from our catalogue.
const INTERPRET_SYS = `You map a traveller's free-text wish into Samsara's fixed catalogue.
Respond ONLY with valid JSON — no markdown, no preamble. Start with { and end with }.

Choose ONLY from these feeling ids: ${FEELINGS.map(f => f.id).join(", ")}.
Choose ONLY from these destination ids: ${DESTINATIONS.map(d => d.id).join(", ")}.

Return: { "feelings": ["id", ...], "destinations": ["id", ...] }
- feelings: 1–4 ids that best match the mood/intent of the text.
- destinations: 0–5 ids that fit the text; omit or leave empty if nothing clearly fits.
Never invent ids. If the text is vague, return your best guess for feelings and an empty destinations array.`;

/* ─── ITINERARY SYSTEM PROMPT ────────────────────────────────── */

const ITINERARY_SYS = `You are Samsara's luxury AI travel consultant for Sri Lanka.
Generate a complete, detailed, personalised day-by-day itinerary based on the traveller's selections.
Respond ONLY with valid JSON — no markdown, no code blocks, no preamble. Start with { and end with }.

Required structure:
{
  "title": "Poetic, evocative trip title (max 8 words)",
  "tagline": "One captivating line (max 10 words)",
  "narrative": "2-3 sentences painting the emotional arc of this journey",
  "totalDays": [integer],
  "estimatedBudget": { "min": [integer USD pp total], "max": [integer USD pp total], "currency": "USD", "note": "Per person, land arrangements only" },
  "days": [
    { "day": 1, "destination": "City name", "theme": "Emotional theme for the day", "morning": "Rich 2-sentence description", "afternoon": "Rich 2-sentence description", "evening": "Rich 2-sentence description including dinner suggestion", "accommodation": "Specific property name and style", "transport": "How to arrive from previous stop", "tip": "Local insider tip or important note" }
  ],
  "highlights": ["5 unforgettable moments from the trip"],
  "accommodationList": ["Property Name, Destination" for each destination stop],
  "essentialTips": ["5 practical Sri Lanka travel tips relevant to this journey"]
}

Rules: Only Sri Lanka. Luxury tone. Poetic but practical. Match experiences to the stated feelings and selected activities.
If PICKUP LOCATION is provided, reference it in the transport field of Day 1 (arrival transfer from that location).
If DROP-OFF LOCATION is provided, reference it in the transport field of the final day (departure transfer to that location).`;

/* ─── HELPERS ────────────────────────────────────────────────── */

function optimizeRoute(ids: string[]): DestItem[] {
  return DESTINATIONS.filter(d => ids.includes(d.id)).sort((a, b) => a.geoOrder - b.geoOrder);
}

function getRecommended(feelingIds: string[]): DestItem[] {
  if (!feelingIds.length) return DESTINATIONS;
  return DESTINATIONS
    .map(d => ({ d, score: d.feelings.filter(f => feelingIds.includes(f)).length }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.d);
}

function sumDays(route: DestItem[]): number {
  return route.reduce((s, d) => s + d.days, 0);
}

function getLabel(id: string, list: readonly { id: string; label: string }[]): string {
  return list.find(x => x.id === id)?.label ?? id;
}

/* ─── SVG MAP ────────────────────────────────────────────────── */


/* ─── SHARED UI COMPONENTS ───────────────────────────────────── */

function AIBubble({ text }: { text: React.ReactNode }) {
  return (
    <div className="fe-bubble">
      <div className="fe-bubble-icon">✦</div>
      <div>
        <div className="fe-bubble-label">Samsara AI</div>
        <div className="fe-bubble-text">{text}</div>
      </div>
    </div>
  );
}

function PhaseFooter({ hint, onBack, backLabel = "← Back", onNext, nextLabel, nextDisabled }: {
  hint?: string; onBack?: () => void; backLabel?: string;
  onNext: () => void; nextLabel: string; nextDisabled?: boolean;
}) {
  return (
    <div className="fe-footer">
      {hint && <span className="fe-hint">{hint}</span>}
      <div className="fe-footer-btns">
        {onBack && <button className="fe-back" onClick={onBack}>{backLabel}</button>}
        <button className="fe-cta" onClick={onNext} disabled={nextDisabled}>{nextLabel}</button>
      </div>
    </div>
  );
}

function DestCard({ d, selected, onToggle }: { d: DestItem; selected: boolean; onToggle: () => void }) {
  return (
    <button className={`fe-dest${selected ? " fe-dest--on" : ""}`} onClick={onToggle}>
      <img src={d.image} alt={d.name} className="fe-dest-img" />
      <div className="fe-dest-body">
        <div className="fe-dest-tags">{d.tags.map(t => <span key={t} className="fe-tag">{t}</span>)}</div>
        <div className="fe-dest-name">{d.name}</div>
        <div className="fe-dest-region">{d.region}</div>
        <div className="fe-dest-desc">{d.desc}</div>
        <div className="fe-dest-meta"><span>{d.duration}</span><span>{d.budget}</span></div>
        <div className="fe-dest-hl">★ {d.highlight}</div>
      </div>
      {selected && <div className="fe-check">✓</div>}
    </button>
  );
}

function OptionCard({ item, selected, onToggle }: { item: CardItem; selected: boolean; onToggle: () => void }) {
  return (
    <button className={`fe-opt${selected ? " fe-opt--on" : ""}`} onClick={onToggle}>
      <img src={item.image} alt={item.label} className="fe-opt-img" />
      <div className="fe-opt-body">
        <div className="fe-opt-label">{item.label}</div>
        <div className="fe-opt-desc">{item.desc}</div>
      </div>
      {selected && <div className="fe-check">✓</div>}
    </button>
  );
}

/* ─── PHASE COMPONENTS ───────────────────────────────────────── */

function Welcome({ onStart }: { onStart: (input: string) => void | Promise<void> }) {
  const [input, setInput] = useState("");
  const [busy, setBusy]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try { await onStart(input.trim()); }
    finally { setBusy(false); }
  }

  return (
    <div className="fe-welcome">
      <div className="fe-welcome-content fe-fadein">

        {/* Title lockup */}
        <div className="fe-title-lockup">
          <span className="fe-title-pre">THE</span>
          <h1 className="fe-welcome-h1">FEELINGS ENGINE</h1>
        </div>

        {/* Tagline */}
        <p className="fe-tagline">Feel the world with our AI-enhanced tool.</p>

        {/* Divider */}
        <div className="fe-divider" />

        {/* Description */}
        <p className="fe-welcome-bold">Who said machines don&apos;t have a heart?</p>
        <p className="fe-welcome-sub">
          Our Feelings Engine combines the best of our human insight with AI-augmented technology.
          All you need to do is share how you want to feel and our Engine will suggest a trip that
          embodies it. For every feeling there&apos;s a place where you can find it.
        </p>

        {/* Input */}
        <form className="fe-input-row" onSubmit={handleSubmit}>
          <input
            className="fe-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="I want to feel..."
            disabled={busy}
          />
          <button type="submit" className="fe-input-btn" aria-label="Begin" disabled={busy}>
            {busy ? (
              <span className="fe-spin" aria-hidden />
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3l7 7-7 7M3 10h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </form>
        {busy && <p className="fe-welcome-interpreting">Reading your wish and matching it to Sri Lanka…</p>}

      </div>
    </div>
  );
}

function PhaseFeelings({ selFeelings, toggle, onNext }: { selFeelings: string[]; toggle: (id: string) => void; onNext: () => void }) {
  return (
    <div className="fe-phase fe-fadein">
      <AIBubble text={<>How do you want to feel during your Sri Lanka journey? Select all that resonate — this becomes the emotional blueprint of your trip.</>} />
      <div className="fe-feelings-grid">
        {FEELINGS.map(f => (
          <button
            key={f.id}
            className={`fe-feeling${selFeelings.includes(f.id) ? " fe-feeling--on" : ""}`}
            style={{ "--fc": f.color } as React.CSSProperties}
            onClick={() => toggle(f.id)}
          >
            <span className="fe-feeling-lbl">{f.label}</span>
            <span className="fe-feeling-desc">{f.desc}</span>
            {selFeelings.includes(f.id) && <span className="fe-feeling-check">✓</span>}
          </button>
        ))}
      </div>
      <PhaseFooter
        hint={selFeelings.length === 0 ? "Select at least one feeling to continue" : `${selFeelings.length} feeling${selFeelings.length > 1 ? "s" : ""} selected`}
        onNext={onNext} nextLabel="Discover Your Destinations →" nextDisabled={selFeelings.length === 0}
      />
    </div>
  );
}

function PhaseDestinations({ recommended, selDests, toggle, onBack, onNext, selFeelings }: {
  recommended: DestItem[]; selDests: string[]; toggle: (id: string) => void;
  onBack: () => void; onNext: () => void; selFeelings: string[];
}) {
  const others = DESTINATIONS.filter(d => !recommended.find(r => r.id === d.id));
  const feelingNames = selFeelings.map(id => FEELINGS.find(f => f.id === id)?.label).filter(Boolean).join(", ");
  return (
    <div className="fe-phase fe-fadein">
      <AIBubble text={<>Based on your desire to feel <strong>{feelingNames}</strong>, these Sri Lankan destinations match your emotional blueprint. Select the places that call to you.</>} />
      {recommended.length > 0 && (
        <>
          <div className="fe-section-lbl">✦ Recommended for you</div>
          <div className="fe-dest-grid">{recommended.map(d => <DestCard key={d.id} d={d} selected={selDests.includes(d.id)} onToggle={() => toggle(d.id)} />)}</div>
        </>
      )}
      {others.length > 0 && (
        <>
          <div className="fe-section-lbl" style={{ marginTop: "2rem" }}>All destinations</div>
          <div className="fe-dest-grid">{others.map(d => <DestCard key={d.id} d={d} selected={selDests.includes(d.id)} onToggle={() => toggle(d.id)} />)}</div>
        </>
      )}
      <PhaseFooter
        hint={selDests.length === 0 ? "Select at least one destination" : `${selDests.length} destination${selDests.length > 1 ? "s" : ""} selected`}
        onBack={onBack} onNext={onNext} nextLabel="Plan My Route →" nextDisabled={selDests.length === 0}
      />
    </div>
  );
}

function PhaseRoute({ route, onBack, onNext }: { route: DestItem[]; onBack: () => void; onNext: () => void }) {
  const td = sumDays(route);
  return (
    <div className="fe-phase fe-fadein">
      <AIBubble text={<>Your route has been optimized to minimize travel time and maximize the flow of experiences. Here is your <strong>{td}-day Sri Lanka journey</strong> across {route.length} destination{route.length > 1 ? "s" : ""}.</>} />
      <div className="fe-route-layout">
        <div className="fe-map-wrap"><LeafletMap route={route} /></div>
        <div className="fe-route-list">
          {route.map((d, i) => (
            <div key={d.id} className="fe-route-stop">
              <div className="fe-route-num">{i + 1}</div>
              <div className="fe-route-card">
                <img src={d.image} alt={d.name} className="fe-route-img" />
                <div className="fe-route-info">
                  <div className="fe-route-name">{d.name}</div>
                  <div className="fe-route-region">{d.region}</div>
                  <div className="fe-route-meta">{d.days} nights &nbsp;·&nbsp;  {d.budget}</div>
                  <div className="fe-route-hl">★ {d.highlight}</div>
                </div>
              </div>
              {i < route.length - 1 && <div className="fe-route-arrow">↓</div>}
            </div>
          ))}
          <div className="fe-route-summary">
            <span>Total: <strong>{td} days</strong></span>
            <span>Stops: <strong>{route.length}</strong></span>
          </div>
        </div>
      </div>
      <PhaseFooter onBack={onBack} backLabel="← Edit Destinations" onNext={onNext} nextLabel="This Is My Journey →" />
    </div>
  );
}

function PhasePickup({ route, pickup, setPickup, dropoff, setDropoff, onBack, onNext }: {
  route: DestItem[];
  pickup: PickupLoc | null; setPickup: (v: PickupLoc) => void;
  dropoff: PickupLoc | null; setDropoff: (v: PickupLoc) => void;
  onBack: () => void; onNext: () => void;
}) {
  const [pickupText, setPText] = useState(pickup?.name ?? "");
  const [dropoffText, setDText] = useState(dropoff?.name ?? "");
  const [sameAsPickup, setSame] = useState(() => !!(pickup && dropoff && pickup.name === dropoff.name));
  const [pickupOpen, setPOpen]  = useState(false);
  const [dropoffOpen, setDOpen] = useState(false);

  const pickupSugg  = COMMON_LOCATIONS.filter(l => pickupText.length > 0 && l.name.toLowerCase().includes(pickupText.toLowerCase()));
  const dropoffSugg = COMMON_LOCATIONS.filter(l => dropoffText.length > 0 && l.name.toLowerCase().includes(dropoffText.toLowerCase()));

  function selectPickup(l: PickupLoc) {
    setPText(l.name); setPickup(l); setPOpen(false);
    if (sameAsPickup) { setDText(l.name); setDropoff(l); }
  }

  function selectDropoff(l: PickupLoc) {
    setDText(l.name); setDropoff(l); setDOpen(false);
  }

  function handleSame(checked: boolean) {
    setSame(checked);
    if (checked && pickup) { setDText(pickup.name); setDropoff(pickup); }
    else { setDText(""); }
  }

  function handleNext() {
    const center: [number, number] = [7.1808, 79.8842];
    const finalPickup: PickupLoc  = pickup  ?? { name: pickupText,  coords: center };
    const finalDropoff: PickupLoc = sameAsPickup ? finalPickup : (dropoff ?? { name: dropoffText, coords: center });
    setPickup(finalPickup);
    setDropoff(finalDropoff);
    onNext();
  }

  const canNext = pickupText.trim().length > 0 && (sameAsPickup || dropoffText.trim().length > 0);

  return (
    <div className="fe-phase fe-fadein">
      <AIBubble text={<>To complete your journey plan, tell me where your adventure <strong>begins and ends</strong>. These will be included in your itinerary and shown on the route map.</>} />

      <div className="fe-pickup-wrap">
        {/* ── Pickup ── */}
        <div className="fe-pickup-block">
          <div className="fe-pickup-label">
            <span className="fe-pickup-badge fe-pickup-badge--start">START</span>
            Pickup Location
          </div>
          <div className="fe-pickup-desc">Airport, hotel, or any city in Sri Lanka</div>
          <div className="fe-pickup-input-wrap">
            <input
              className="fe-input fe-pickup-input"
              value={pickupText}
              onChange={e => { setPText(e.target.value); setPickup({ name: e.target.value, coords: [7.1808, 79.8842] }); setPOpen(true); }}
              onFocus={() => setPOpen(true)}
              onBlur={() => setTimeout(() => setPOpen(false), 150)}
              placeholder="e.g. Colombo Airport, Negombo, your hotel…"
            />
            {pickupOpen && pickupSugg.length > 0 && (
              <div className="fe-pickup-sugg">
                {pickupSugg.slice(0, 6).map(l => (
                  <button key={l.name} className="fe-pickup-sugg-item" onMouseDown={() => selectPickup(l)}>{l.name}</button>
                ))}
              </div>
            )}
          </div>
          <div className="fe-pickup-quick">
            {QUICK_LOCATIONS.map(q => (
              <button key={q.name} className={`fe-pickup-chip${pickup?.name === q.name ? " fe-pickup-chip--on" : ""}`} onClick={() => selectPickup(q)}>{q.name}</button>
            ))}
          </div>
        </div>

        {/* ── Route connector ── */}
        <div className="fe-pickup-connector">
          <div className="fe-pickup-conn-track" />
          {route.slice(0, 5).map((d, i) => (
            <div key={d.id} className="fe-pickup-stop">
              <div className="fe-pickup-stop-dot">{i + 1}</div>
              <span className="fe-pickup-stop-name">{d.name}</span>
            </div>
          ))}
          {route.length > 5 && <div className="fe-pickup-more">+{route.length - 5} more stops</div>}
        </div>

        {/* ── Drop-off ── */}
        <div className="fe-pickup-block">
          <div className="fe-pickup-label">
            <span className="fe-pickup-badge fe-pickup-badge--end">END</span>
            Drop-off Location
          </div>
          <div className="fe-pickup-desc">Where should your journey end?</div>
          <label className="fe-pickup-same">
            <input type="checkbox" checked={sameAsPickup} onChange={e => handleSame(e.target.checked)} />
            Same as pickup location
          </label>
          {!sameAsPickup && (
            <>
              <div className="fe-pickup-input-wrap" style={{ marginTop: "0.75rem" }}>
                <input
                  className="fe-input fe-pickup-input"
                  value={dropoffText}
                  onChange={e => { setDText(e.target.value); setDropoff({ name: e.target.value, coords: [7.1808, 79.8842] }); setDOpen(true); }}
                  onFocus={() => setDOpen(true)}
                  onBlur={() => setTimeout(() => setDOpen(false), 150)}
                  placeholder="e.g. Colombo Airport, your hotel…"
                />
                {dropoffOpen && dropoffSugg.length > 0 && (
                  <div className="fe-pickup-sugg">
                    {dropoffSugg.slice(0, 6).map(l => (
                      <button key={l.name} className="fe-pickup-sugg-item" onMouseDown={() => selectDropoff(l)}>{l.name}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="fe-pickup-quick">
                {QUICK_LOCATIONS.map(q => (
                  <button key={q.name} className={`fe-pickup-chip${dropoff?.name === q.name ? " fe-pickup-chip--on" : ""}`} onClick={() => selectDropoff(q)}>{q.name}</button>
                ))}
              </div>
            </>
          )}
          {sameAsPickup && pickupText && (
            <div className="fe-pickup-same-preview">Returning to: <strong>{pickupText}</strong></div>
          )}
        </div>
      </div>

      <PhaseFooter
        hint={!pickupText.trim() ? "Enter your pickup location to continue" : ""}
        onBack={onBack}
        onNext={handleNext}
        nextLabel="Confirm Locations →"
        nextDisabled={!canNext}
      />
    </div>
  );
}

function PhaseCards({ subtitle, items, sel, toggle, onBack, onNext, nextLabel, cols5 }: {
  subtitle: string; items: CardItem[]; sel: string[];
  toggle: (id: string) => void; onBack: () => void; onNext: () => void; nextLabel: string; cols5?: boolean;
}) {
  return (
    <div className="fe-phase fe-fadein">
      <AIBubble text={subtitle} />
      <div className={`fe-opt-grid${cols5 ? " fe-opt-grid--5" : ""}`}>
        {items.map(item => <OptionCard key={item.id} item={item} selected={sel.includes(item.id)} onToggle={() => toggle(item.id)} />)}
      </div>
      <PhaseFooter
        hint={sel.length === 0 ? "Select at least one option" : `${sel.length} selected`}
        onBack={onBack} onNext={onNext} nextLabel={nextLabel} nextDisabled={sel.length === 0}
      />
    </div>
  );
}

function PhaseDetails({ budget, setBudget, groupType, setGroup, groupSize, setSize, startDate, setDate, dietary, setDietary, notes, setNotes, onBack, onGenerate }: {
  budget: string; setBudget: (v: string) => void; groupType: string; setGroup: (v: string) => void;
  groupSize: string; setSize: (v: string) => void; startDate: string; setDate: (v: string) => void;
  dietary: string; setDietary: (v: string) => void; notes: string; setNotes: (v: string) => void;
  onBack: () => void; onGenerate: () => void;
}) {
  return (
    <div className="fe-phase fe-fadein">
      <AIBubble text="A few final details and your personalised Sri Lanka itinerary will be ready. These help me craft every moment to absolute perfection." />
      <div className="fe-details">
        <div className="fe-detail-section">
          <div className="fe-detail-lbl">Budget Range</div>
          <div className="fe-budget-grid">
            {BUDGETS.map(b => (
              <button key={b.id} className={`fe-budget-card${budget === b.id ? " fe-budget-card--on" : ""}`} onClick={() => setBudget(b.id)}>
                <div className="fe-budget-name">{b.label}</div>
                <div className="fe-budget-range">{b.range}</div>
                <div className="fe-budget-desc">{b.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="fe-detail-section">
          <div className="fe-detail-lbl">Travelling As</div>
          <div className="fe-group-row">
            {GROUP_TYPES.map(g => (
              <button key={g.id} className={`fe-group-btn${groupType === g.id ? " fe-group-btn--on" : ""}`} onClick={() => setGroup(g.id)}>
                <span>{g.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="fe-detail-row">
          <div className="fe-detail-section">
            <div className="fe-detail-lbl">Number of Travellers</div>
            <input type="number" min="1" max="20" value={groupSize} onChange={e => setSize(e.target.value)} className="fe-input" placeholder="2" />
          </div>
          <div className="fe-detail-section">
            <div className="fe-detail-lbl">Preferred Start Date</div>
            <input type="date" value={startDate} onChange={e => setDate(e.target.value)} className="fe-input" />
          </div>
        </div>
        <div className="fe-detail-section">
          <div className="fe-detail-lbl">Dietary Preferences / Restrictions</div>
          <input type="text" value={dietary} onChange={e => setDietary(e.target.value)} className="fe-input" placeholder="e.g. vegetarian, gluten-free, halal, none…" />
        </div>
        <div className="fe-detail-section">
          <div className="fe-detail-lbl">Special Requests or Notes</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="fe-input fe-textarea" placeholder="Anniversaries, mobility needs, bucket-list moments, anything at all…" rows={3} />
        </div>
      </div>
      <div className="fe-footer">
        <div className="fe-footer-btns">
          <button className="fe-back" onClick={onBack}>← Back</button>
          <button className="fe-cta fe-cta--pulse" onClick={onGenerate}>✦ Generate My Itinerary</button>
        </div>
      </div>
    </div>
  );
}

function PhaseGenerating({ msg, userInput }: { msg: string; userInput?: string }) {
  return (
    <div className="fe-generating fe-fadein">
      {userInput && (
        <div className="fe-gen-user-bubble">{userInput}</div>
      )}

      <div className="fe-gen-sketch">
        <svg viewBox="0 0 900 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="fe-gen-svg">
          {/* Ground sweep */}
          <path className="fe-draw fe-draw-g" d="M 0,355 C 100,348 220,344 380,342 C 520,340 660,338 900,342" stroke="currentColor" strokeWidth="1.5" />

          {/* Palm 1 — trunk */}
          <path className="fe-draw fe-draw-t1" d="M 508,342 C 504,298 498,254 490,210 C 483,168 476,130 470,98 C 466,82 464,74 462,68" stroke="currentColor" strokeWidth="2.5" />
          {/* Palm 1 — fronds batch A */}
          <path className="fe-draw fe-draw-f1a" d="M 462,68 C 442,52 416,40 386,36" stroke="currentColor" strokeWidth="1.8" />
          <path className="fe-draw fe-draw-f1a" d="M 462,68 C 450,46 434,28 414,18" stroke="currentColor" strokeWidth="1.8" />
          {/* Palm 1 — fronds batch B */}
          <path className="fe-draw fe-draw-f1b" d="M 462,68 C 460,44 461,22 464,4" stroke="currentColor" strokeWidth="1.8" />
          <path className="fe-draw fe-draw-f1b" d="M 462,68 C 474,46 488,28 504,18" stroke="currentColor" strokeWidth="1.8" />
          {/* Palm 1 — fronds batch C */}
          <path className="fe-draw fe-draw-f1c" d="M 462,68 C 476,52 494,42 514,38" stroke="currentColor" strokeWidth="1.8" />
          <path className="fe-draw fe-draw-f1c" d="M 462,68 C 478,76 496,82 514,90" stroke="currentColor" strokeWidth="1.8" />
          {/* Palm 1 — frond batch D (left drooping) */}
          <path className="fe-draw fe-draw-f1d" d="M 462,68 C 444,76 426,84 408,88" stroke="currentColor" strokeWidth="1.8" />

          {/* Palm 2 — trunk (background, lighter) */}
          <path className="fe-draw fe-draw-t2" d="M 678,338 C 676,308 672,276 668,244 C 664,214 659,186 655,162 C 652,146 650,138 648,130" stroke="currentColor" strokeWidth="1.8" strokeOpacity="0.35" />
          {/* Palm 2 — fronds */}
          <path className="fe-draw fe-draw-f2" d="M 648,130 C 633,118 616,110 598,108" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.28" />
          <path className="fe-draw fe-draw-f2" d="M 648,130 C 640,112 630,96 617,88" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.28" />
          <path className="fe-draw fe-draw-f2" d="M 648,130 C 648,110 650,92 654,78" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.28" />
          <path className="fe-draw fe-draw-f2" d="M 648,130 C 658,114 670,104 684,100" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.28" />
          <path className="fe-draw fe-draw-f2" d="M 648,130 C 660,120 674,116 688,116" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.28" />
        </svg>
      </div>

      <p className="fe-gen-caption">
        Give me a moment whilst I craft your perfect Sri Lanka journey.
        <br />In the meantime, here&apos;s a little sketch for you.
      </p>
      <p className="fe-gen-status">{msg}</p>
    </div>
  );
}

function PhaseItinerary({ it, route, pickup, dropoff, dayImgs, onUpload, expandedDay, setExpanded, onEdit, onBook, onUpdateMeta, onUpdateDay }: {
  it: Itinerary; route: DestItem[];
  pickup: PickupLoc | null; dropoff: PickupLoc | null;
  dayImgs: Record<number, string>;
  onUpload: (day: number, f: File) => void;
  expandedDay: number | null; setExpanded: (n: number | null) => void;
  onEdit: () => void;
  onBook: () => void;
  onUpdateMeta: (patch: Partial<Itinerary>) => void;
  onUpdateDay: (day: number, patch: Partial<ItDay>) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const heroImg = route[0]?.image ?? "/images/dest-1.webp";
  return (
    <div className="fe-it fe-fadein">
      {/* Hero */}
      <div className="fe-it-hero">
        <img src={heroImg} alt="" className="fe-it-hero-img" />
        <div className="fe-it-hero-ov" />
        <div className="fe-it-hero-content">
          {editMode ? (
            <>
              <input className="fe-edit-hero fe-edit-hero--eyebrow" value={it.tagline} onChange={e => onUpdateMeta({ tagline: e.target.value })} placeholder="Tagline" />
              <input className="fe-edit-hero fe-edit-hero--title" value={it.title} onChange={e => onUpdateMeta({ title: e.target.value })} placeholder="Trip title" />
              <textarea className="fe-edit-hero fe-edit-hero--narr" value={it.narrative} onChange={e => onUpdateMeta({ narrative: e.target.value })} rows={2} placeholder="A line or two about this journey…" />
            </>
          ) : (
            <>
              <div className="fe-eyebrow">{it.tagline}</div>
              <h1 className="fe-it-title">{it.title}</h1>
              <p className="fe-it-narrative">{it.narrative}</p>
            </>
          )}
          <div className="fe-it-meta">
            <span>{it.totalDays} days</span>
            {pickup  && <span>From: {pickup.name}</span>}
            <span>{route.map(d => d.name).join(" → ")}</span>
            {dropoff && <span>To: {dropoff.name}</span>}
            <span>{it.estimatedBudget.currency}{it.estimatedBudget.min.toLocaleString()}–{it.estimatedBudget.currency}{it.estimatedBudget.max.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="fe-it-actions">
        <button className="fe-it-act" onClick={onEdit}>← Edit Journey</button>
        <button className={`fe-it-act${editMode ? " fe-it-act--gold" : ""}`} onClick={() => setEditMode(v => !v)}>
          {editMode ? "✓ Done Editing" : "✎ Edit Itinerary"}
        </button>
        <button className="fe-it-act fe-it-act--gold" onClick={() => window.print()}>↓ Save PDF</button>
        <button className="fe-it-act fe-it-act--book" onClick={onBook}>Book This Journey →</button>
      </div>
      {editMode && <p className="fe-it-edit-hint">✎ Editing mode — tap any text to rewrite it. Changes save automatically.</p>}

      {/* Body */}
      <div className="fe-it-body">
        {/* Timeline */}
        <div className="fe-it-timeline">
          <div className="fe-it-section-title">Day-by-Day Journey</div>
          {it.days.map(d => {
            const destData = DESTINATIONS.find(x =>
              x.name.toLowerCase() === d.destination.toLowerCase() ||
              x.name.toLowerCase().includes(d.destination.toLowerCase().split(" ")[0])
            );
            const img = dayImgs[d.day] ?? destData?.image ?? heroImg;
            const open = editMode || expandedDay === d.day;
            return (
              <div key={d.day} className="fe-it-day">
                {editMode ? (
                  <div className="fe-it-day-hdr fe-it-day-hdr--edit">
                    <div className="fe-it-day-left">
                      <span className="fe-it-day-num">Day {d.day}</span>
                      <span className="fe-it-day-dest">{d.destination}</span>
                      <input className="fe-edit-inline" value={d.theme} onChange={e => onUpdateDay(d.day, { theme: e.target.value })} placeholder="Theme of the day" />
                    </div>
                  </div>
                ) : (
                  <button className="fe-it-day-hdr" onClick={() => setExpanded(open ? null : d.day)}>
                    <div className="fe-it-day-left">
                      <span className="fe-it-day-num">Day {d.day}</span>
                      <span className="fe-it-day-dest">{d.destination}</span>
                      <span className="fe-it-day-theme">{d.theme}</span>
                    </div>
                    <span className="fe-it-chevron">{open ? "▲" : "▼"}</span>
                  </button>
                )}
                {open && (
                  <div className="fe-it-day-body fe-fadein">
                    <div className="fe-it-img-wrap">
                      <img src={img} alt={d.destination} className="fe-it-day-img" />
                      <label className="fe-it-upload">
                         Add Photo
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) onUpload(d.day, e.target.files[0]); }} />
                      </label>
                    </div>
                    <div className="fe-it-day-content">
                      <div className="fe-it-time-block">
                        <div className="fe-it-time-lbl">Morning</div>
                        {editMode
                          ? <textarea className="fe-edit-area" value={d.morning} onChange={e => onUpdateDay(d.day, { morning: e.target.value })} rows={3} />
                          : <p className="fe-it-time-text">{d.morning}</p>}
                      </div>
                      <div className="fe-it-time-block">
                        <div className="fe-it-time-lbl">Afternoon</div>
                        {editMode
                          ? <textarea className="fe-edit-area" value={d.afternoon} onChange={e => onUpdateDay(d.day, { afternoon: e.target.value })} rows={3} />
                          : <p className="fe-it-time-text">{d.afternoon}</p>}
                      </div>
                      <div className="fe-it-time-block">
                        <div className="fe-it-time-lbl">Evening</div>
                        {editMode
                          ? <textarea className="fe-edit-area" value={d.evening} onChange={e => onUpdateDay(d.day, { evening: e.target.value })} rows={3} />
                          : <p className="fe-it-time-text">{d.evening}</p>}
                      </div>
                      <div className="fe-it-extras">
                        <div className="fe-it-extra">{editMode ? <input className="fe-edit-inline" value={d.accommodation} onChange={e => onUpdateDay(d.day, { accommodation: e.target.value })} /> : <span>{d.accommodation}</span>}</div>
                        <div className="fe-it-extra">{editMode ? <input className="fe-edit-inline" value={d.transport} onChange={e => onUpdateDay(d.day, { transport: e.target.value })} /> : <span>{d.transport}</span>}</div>
                        <div className="fe-it-extra fe-it-tip"> {editMode ? <input className="fe-edit-inline" value={d.tip} onChange={e => onUpdateDay(d.day, { tip: e.target.value })} /> : <span>{d.tip}</span>}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="fe-it-sidebar">
          <div className="fe-it-card">
            <div className="fe-it-card-title">Your Route</div>
            <LeafletMap route={route} pickup={pickup} dropoff={dropoff} />
          </div>
          {(pickup || dropoff) && (
            <div className="fe-it-card">
              <div className="fe-it-card-title">Transfer Details</div>
              <ul className="fe-it-list">
                {pickup  && <li><span style={{color:"#27ae60",fontWeight:600}}>● START</span> — {pickup.name}</li>}
                {route.map((d, i) => <li key={d.id}><span style={{color:"#C9A84C",fontWeight:600}}>● Stop {i + 1}</span> — {d.name}</li>)}
                {dropoff && <li><span style={{color:"#e74c3c",fontWeight:600}}>● END</span> — {dropoff.name}</li>}
              </ul>
            </div>
          )}
          <div className="fe-it-card">
            <div className="fe-it-card-title">Estimated Budget</div>
            <div className="fe-it-budget-range">{it.estimatedBudget.currency}{it.estimatedBudget.min.toLocaleString()} – {it.estimatedBudget.currency}{it.estimatedBudget.max.toLocaleString()}</div>
            <div className="fe-it-budget-note">{it.estimatedBudget.note}</div>
          </div>
          <div className="fe-it-card">
            <div className="fe-it-card-title">Trip Highlights</div>
            <ul className="fe-it-list">{it.highlights.map((h, i) => <li key={i}>★ {h}</li>)}</ul>
          </div>
          <div className="fe-it-card">
            <div className="fe-it-card-title">Accommodation</div>
            <ul className="fe-it-list">{it.accommodationList.map((a, i) => <li key={i}> {a}</li>)}</ul>
          </div>
          <div className="fe-it-card">
            <div className="fe-it-card-title">Essential Tips</div>
            <ul className="fe-it-list">{it.essentialTips.map((t, i) => <li key={i}> {t}</li>)}</ul>
          </div>
          <button className="fe-it-book-cta" onClick={onBook}>
            ✦ Book This Journey
            <span>Send to reservations →</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── BOOKING MODAL ──────────────────────────────────────────── */

function BookingModal({ it, route, pickup, dropoff, groupSize, startDate, status, bookingRef, errMsg, onClose, onSubmit }: {
  it: Itinerary; route: DestItem[];
  pickup: PickupLoc | null; dropoff: PickupLoc | null;
  groupSize: string; startDate: string;
  status: BookStatus; bookingRef: string; errMsg: string;
  onClose: () => void;
  onSubmit: (c: { fullName: string; email: string; phone: string }) => void;
}) {
  const [fullName, setName]     = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [localErr, setLocalErr] = useState("");
  const submitting = status === "submitting";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!fullName.trim()) { setLocalErr("Please enter your full name."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setLocalErr("Please enter a valid email address."); return; }
    if (!phone.trim()) { setLocalErr("Please enter a phone number."); return; }
    setLocalErr("");
    onSubmit({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim() });
  }

  const fmtDate = (d: string) => {
    if (!d) return "Flexible";
    try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return d; }
  };

  return (
    <div className="fe-modal-overlay" onClick={status === "success" ? onClose : undefined}>
      <div className="fe-modal" onClick={e => e.stopPropagation()}>
        {status === "success" ? (
          <div className="fe-modal-success fe-fadein">
            <div className="fe-modal-check">✓</div>
            <div className="fe-eyebrow">Enquiry Received</div>
            <h2 className="fe-modal-title">Your journey is reserved</h2>
            <p className="fe-modal-ref">Reference&nbsp;<strong>{bookingRef}</strong></p>
            <p className="fe-modal-text">
              We&apos;ve sent a confirmation to <strong>{email}</strong> and notified our travel team.
              A Samsara consultant will be in touch within 24 hours to finalise <em>{it.title}</em>.
            </p>
            <button className="fe-modal-done" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="fe-modal-form" onSubmit={submit}>
            <button type="button" className="fe-modal-x" onClick={onClose} aria-label="Close">×</button>
            <div className="fe-eyebrow">Book This Journey</div>
            <h2 className="fe-modal-title">{it.title}</h2>

            <div className="fe-modal-summary">
              <div><span>Route</span><strong>{route.map(d => d.name).join(" → ") || "Sri Lanka"}</strong></div>
              <div><span>Duration</span><strong>{it.totalDays} days</strong></div>
              <div><span>Travellers</span><strong>{Math.max(1, parseInt(groupSize) || 1)}</strong></div>
              <div><span>Start</span><strong>{fmtDate(startDate)}</strong></div>
              {pickup  && <div><span>Pickup</span><strong>{pickup.name}</strong></div>}
              {dropoff && <div><span>Drop-off</span><strong>{dropoff.name}</strong></div>}
              <div><span>Estimate</span><strong>{it.estimatedBudget.currency}{it.estimatedBudget.min.toLocaleString()}–{it.estimatedBudget.currency}{it.estimatedBudget.max.toLocaleString()} pp</strong></div>
            </div>

            <label className="fe-modal-label">Full name
              <input className="fe-modal-input" value={fullName} onChange={e => setName(e.target.value)} placeholder="Jane Smith" disabled={submitting} />
            </label>
            <label className="fe-modal-label">Email
              <input className="fe-modal-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" disabled={submitting} />
            </label>
            <label className="fe-modal-label">Phone
              <input className="fe-modal-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 7700 900000" disabled={submitting} />
            </label>

            {(localErr || (status === "error" && errMsg)) && (
              <p className="fe-modal-err">{localErr || errMsg}</p>
            )}

            <button type="submit" className="fe-modal-submit" disabled={submitting}>
              {submitting ? "Sending…" : "Confirm & Send Enquiry"}
            </button>
            <p className="fe-modal-fine">No payment now — our team confirms details and pricing with you first.</p>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────── */

export default function FeelingEnginePage() {
  const [phase, setPhase]         = useState<Phase>("welcome");
  const [selFeelings, setSelF]    = useState<string[]>([]);
  const [selDests, setSelD]       = useState<string[]>([]);
  const [route, setRoute]         = useState<DestItem[]>([]);
  const [selStay, setSelStay]     = useState<string[]>([]);
  const [selMove, setSelMove]     = useState<string[]>([]);
  const [selExp, setSelExp]       = useState<string[]>([]);
  const [budget, setBudget]       = useState("mid-range");
  const [groupType, setGroup]     = useState("couple");
  const [groupSize, setSize]      = useState("2");
  const [startDate, setDate]      = useState("");
  const [dietary, setDietary]     = useState("");
  const [notes, setNotes]         = useState("");
  const [pickup, setPickup]       = useState<PickupLoc | null>(null);
  const [dropoff, setDropoff]     = useState<PickupLoc | null>(null);
  const [welcomeInput, setWelcomeInput] = useState("");
  const [genMsg, setGenMsg]       = useState("");
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [dayImgs, setDayImgs]     = useState<Record<number, string>>({});
  const [expandedDay, setExpanded]= useState<number | null>(1);

  // Booking (close-the-loop to the RMS)
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookStatus, setBookStatus]   = useState<BookStatus>("idle");
  const [bookingRef, setBookingRef]   = useState("");
  const [bookErr, setBookErr]         = useState("");

  // Resume: true once a saved session has been restored (drives the resume banner)
  const [resumed, setResumed]   = useState(false);
  const hydrated                = useRef(false);

  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase]);

  // ── Restore a saved in-progress session (once, on mount) ──────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<Snapshot>;
        if (s && s.phase && s.phase !== "welcome") {
          if (s.selFeelings) setSelF(s.selFeelings);
          if (s.selDests)    setSelD(s.selDests);
          if (s.route)       setRoute(s.route);
          if (s.selStay)     setSelStay(s.selStay);
          if (s.selMove)     setSelMove(s.selMove);
          if (s.selExp)      setSelExp(s.selExp);
          if (s.budget)      setBudget(s.budget);
          if (s.groupType)   setGroup(s.groupType);
          if (s.groupSize)   setSize(s.groupSize);
          if (typeof s.startDate === "string")    setDate(s.startDate);
          if (typeof s.dietary === "string")      setDietary(s.dietary);
          if (typeof s.notes === "string")        setNotes(s.notes);
          if (s.pickup !== undefined)             setPickup(s.pickup ?? null);
          if (s.dropoff !== undefined)            setDropoff(s.dropoff ?? null);
          if (typeof s.welcomeInput === "string") setWelcomeInput(s.welcomeInput);
          if (s.itinerary !== undefined)          setItinerary(s.itinerary ?? null);
          setPhase(s.phase);
          setResumed(true);
        }
      }
    } catch { /* corrupt/unavailable storage — start clean */ }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save the session whenever meaningful state changes ────────────
  useEffect(() => {
    if (!hydrated.current || phase === "welcome") return;
    try {
      const snap: Snapshot = {
        v: 1, phase, selFeelings, selDests, route, selStay, selMove, selExp,
        budget, groupType, groupSize, startDate, dietary, notes,
        pickup, dropoff, welcomeInput, itinerary,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    } catch { /* quota or serialization issue — non-fatal */ }
  }, [phase, selFeelings, selDests, route, selStay, selMove, selExp, budget,
      groupType, groupSize, startDate, dietary, notes, pickup, dropoff, welcomeInput, itinerary]);

  const recommended = useMemo(() => getRecommended(selFeelings), [selFeelings]);

  function toggle(get: string[], set: (v: string[]) => void, id: string) {
    set(get.includes(id) ? get.filter(x => x !== id) : [...get, id]);
  }

  function goRoute() { setRoute(optimizeRoute(selDests)); setPhase("route"); }

  // Turn the welcome "I want to feel…" sentence into pre-selected feelings and
  // destinations. Best-effort: any failure just lands the user on an empty grid.
  async function interpretWelcome(text: string) {
    const validFeel = new Set<string>(FEELINGS.map(f => f.id));
    const validDest = new Set(DESTINATIONS.map(d => d.id));
    try {
      const res = await fetch("/api/travel-consultant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 300,
          system: INTERPRET_SYS,
          messages: [{ role: "user", content: text }],
        }),
      });
      const data = await res.json() as { content?: { text?: string }[] };
      const raw  = data.content?.[0]?.text ?? "";
      const m    = raw.match(/\{[\s\S]*\}/);
      if (!m) return;
      const parsed   = JSON.parse(m[0]) as { feelings?: string[]; destinations?: string[] };
      const feelings = (parsed.feelings ?? []).filter(id => validFeel.has(id));
      const dests    = (parsed.destinations ?? []).filter(id => validDest.has(id));
      if (feelings.length) setSelF(feelings);
      if (dests.length)    setSelD(dests);
    } catch { /* best-effort */ }
  }

  async function handleWelcomeStart(text: string) {
    setWelcomeInput(text);
    if (text) await interpretWelcome(text);
    setPhase("feelings");
  }

  async function generateItinerary() {
    setPhase("generating");
    const msgs = [
      "Reading your emotional travel blueprint…",
      "Mapping your perfect Sri Lanka route…",
      "Handpicking experiences just for you…",
      "Crafting your day-by-day itinerary…",
      "Adding the finishing touches…",
    ];
    let idx = 0;
    setGenMsg(msgs[0]);
    const ticker = setInterval(() => { idx = (idx + 1) % msgs.length; setGenMsg(msgs[idx]); }, 2200);

    try {
      const userMsg = [
        ...(welcomeInput ? [`HOW TRAVELLER WANTS TO FEEL: "${welcomeInput}"`] : []),
        `FEELINGS: ${selFeelings.map(id => getLabel(id, FEELINGS)).join(", ")}`,
        `PICKUP LOCATION: ${pickup?.name || "Not specified"}`,
        `DROP-OFF LOCATION: ${dropoff?.name || "Not specified"}`,
        `ROUTE: ${route.map(d => `${d.name} (${d.days} nights)`).join(" → ")}`,
        `TOTAL DAYS: ${sumDays(route)}`,
        `ACCOMMODATION: ${selStay.map(id => getLabel(id, STAYS)).join(", ")}`,
        `TRANSPORT: ${selMove.map(id => getLabel(id, MOVES)).join(", ")}`,
        `ACTIVITIES: ${selExp.map(id => getLabel(id, EXPERIENCES)).join(", ")}`,
        `BUDGET: ${getLabel(budget, BUDGETS)} (${BUDGETS.find(b => b.id === budget)?.range})`,
        `GROUP: ${getLabel(groupType, GROUP_TYPES)}, ${groupSize} people`,
        `START DATE: ${startDate || "Flexible"}`,
        `DIETARY: ${dietary || "No restrictions"}`,
        `NOTES: ${notes || "None"}`,
        "",
        "Generate my complete personalised Sri Lanka itinerary.",
      ].join("\n");

      const res = await fetch("/api/travel-consultant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 4000,
          system: ITINERARY_SYS,
          messages: [{ role: "user", content: userMsg }],
        }),
      });
      const data = await res.json() as { content?: { text?: string }[]; error?: { message?: string } };
      const text = data.content?.[0]?.text ?? "";
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        setItinerary(JSON.parse(m[0]) as Itinerary);
      } else {
        setItinerary(buildFallback());
      }
    } catch {
      setItinerary(buildFallback());
    } finally {
      clearInterval(ticker);
      setPhase("itinerary");
    }
  }

  function buildFallback(): Itinerary {
    const r = route.length ? route : DESTINATIONS.slice(0, 3);
    const td = sumDays(r);
    const mult = budget === "ultra-luxury" ? 700 : budget === "luxury" ? 350 : budget === "mid-range" ? 180 : 80;
    const gs = Math.max(1, parseInt(groupSize) || 2);
    const feelingLabels = selFeelings.slice(0, 2).map(id => getLabel(id, FEELINGS).toLowerCase()).join(" and ");
    const stayLabel = selStay[0] ? getLabel(selStay[0], STAYS) : "boutique property";
    const moveLabel = selMove[0] ? getLabel(selMove[0], MOVES) : "private car";
    return {
      title: `Your Sri Lanka ${selFeelings.slice(0, 2).map(id => getLabel(id, FEELINGS)).filter(Boolean).join(" & ")} Journey`,
      tagline: "Where feelings become memories that last a lifetime",
      narrative: `A ${td}-day curated journey through ${r.map(d => d.name).join(", ")}, designed around your desire to feel ${feelingLabels || "extraordinary"}. Every destination, every sunrise, and every moment has been chosen to move you deeply.`,
      totalDays: td,
      estimatedBudget: { min: Math.round(mult * gs * td * 0.8), max: Math.round(mult * gs * td * 1.3), currency: "USD", note: "Per person, land arrangements only" },
      days: r.flatMap((dest, di) =>
        Array.from({ length: dest.days }, (_, d) => ({
          day: r.slice(0, di).reduce((s, x) => s + x.days, 0) + d + 1,
          destination: dest.name,
          theme: `${dest.tags[0]} & Discovery`,
          morning: `Rise early and embrace ${dest.name}. ${dest.highlight} awaits — a moment that encapsulates everything you came here to feel.`,
          afternoon: `${dest.desc} Immerse yourself fully in the landscape and let it change you.`,
          evening: `A quiet evening in ${dest.name}. Savour local cuisine and watch the sky change colour as the day draws to a beautiful close.`,
          accommodation: `${stayLabel} in ${dest.name}`,
          transport: di === 0 ? "Arrival transfer from Colombo Bandaranaike International Airport" : `Scenic ${moveLabel} from ${r[di - 1].name} — approximately 2–4 hours`,
          tip: `Visit ${dest.highlight} in the early morning to experience it before the crowds arrive.`,
        }))
      ),
      highlights: r.map(d => d.highlight),
      accommodationList: r.map(d => `${stayLabel}, ${d.name}`),
      essentialTips: [
        "Best time for the west & south coast: December–March. East coast: May–September.",
        "Carry cash — rural areas have limited ATM access throughout Sri Lanka.",
        "Remove shoes and dress modestly when visiting all religious sites.",
        "Book Yala and Udawalawe safari jeeps well in advance during peak season (Nov–Apr).",
        "The Kandy–Ella scenic train is one of the world's great rail journeys — book first class seats ahead of time.",
      ],
    };
  }

  // ── Inline itinerary editing ──────────────────────────────────────
  function updateMeta(patch: Partial<Itinerary>) {
    setItinerary(prev => (prev ? { ...prev, ...patch } : prev));
  }
  function updateDay(day: number, patch: Partial<ItDay>) {
    setItinerary(prev => prev
      ? { ...prev, days: prev.days.map(d => (d.day === day ? { ...d, ...patch } : d)) }
      : prev);
  }

  // ── Submit the planned journey to the RMS as an enquiry ───────────
  async function submitBooking(contact: { fullName: string; email: string; phone: string }) {
    if (!itinerary) return;
    setBookStatus("submitting"); setBookErr("");

    const travelers      = Math.max(1, parseInt(groupSize) || 1);
    const perPersonMin   = itinerary.estimatedBudget?.min ?? 0;
    const estTotal       = Math.max(0, Math.round(perPersonMin * travelers));
    const destinationStr = route.map(d => d.name).join(", ") || "Sri Lanka";

    const noteBits = [
      selFeelings.length && `Feelings: ${selFeelings.map(id => getLabel(id, FEELINGS)).join(", ")}`,
      selExp.length      && `Activities: ${selExp.map(id => getLabel(id, EXPERIENCES)).join(", ")}`,
      selStay.length     && `Stay: ${selStay.map(id => getLabel(id, STAYS)).join(", ")}`,
      selMove.length     && `Transport: ${selMove.map(id => getLabel(id, MOVES)).join(", ")}`,
      `Group: ${getLabel(groupType, GROUP_TYPES)}`,
    ].filter(Boolean) as string[];
    const reqBits = [dietary && `Dietary: ${dietary}`, notes].filter(Boolean) as string[];

    const payload = {
      source: "feeling-engine",
      type:   "save",
      itineraryTitle:       itinerary.title,
      itineraryDestination: destinationStr,
      itineraryDuration:    `${itinerary.totalDays} days`,
      travelerCount:        travelers,
      total:                estTotal,
      form: {
        fullName:         contact.fullName,
        email:            contact.email,
        phone:            contact.phone,
        travelers:        String(travelers),
        travelDate:       startDate || "",
        durationDays:     itinerary.totalDays || sumDays(route) || undefined,
        pickupLocation:   pickup?.name || undefined,
        dropoffLocation:  dropoff?.name || undefined,
        budgetPreference: getLabel(budget, BUDGETS),
        specialRequests:  reqBits.join(" · ") || undefined,
        bookingNotes:     noteBits.join(" · ") || undefined,
      },
    };

    try {
      const res  = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { success: boolean; reservation?: { bookingRef: string }; error?: string };
      if (!data.success) throw new Error(data.error ?? "Booking could not be saved");
      setBookingRef(data.reservation?.bookingRef ?? "SAM-PENDING");
      setBookStatus("success");
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    } catch (err) {
      setBookErr(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBookStatus("error");
    }
  }

  function openBooking() {
    setBookStatus("idle"); setBookErr(""); setBookingRef(""); setBookingOpen(true);
  }

  function startFresh() {
    setSelF([]); setSelD([]); setRoute([]); setSelStay([]); setSelMove([]); setSelExp([]);
    setBudget("mid-range"); setGroup("couple"); setSize("2"); setDate(""); setDietary(""); setNotes("");
    setPickup(null); setDropoff(null);
    setItinerary(null); setDayImgs({}); setWelcomeInput("");
    setBookingOpen(false); setBookStatus("idle"); setBookingRef(""); setBookErr("");
    setResumed(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setPhase("welcome");
  }

  /* ─── PROGRESS ───────────────────────────────────────────── */

  const STEP_PHASES: Phase[] = ["feelings","destinations","route","pickup","stay","move","experiences","details","itinerary"];
  const STEP_LABELS = ["Feelings","Destinations","Route","Pickup","Stay","Move","Experiences","Details","Itinerary"];
  const stepIdx = STEP_PHASES.indexOf(phase);
  const showProgress = !["welcome","generating"].includes(phase);

  /* ─── RENDER ─────────────────────────────────────────────── */

  return (
    <div className={`fe-root${phase === "welcome" ? "" : " fe-root--wizard"}`} ref={topRef}>
      <style>{CSS}</style>

      {showProgress && (
        <div className="fe-progress">
          <div className="fe-progress-track">
            <div className="fe-progress-fill" style={{ width: `${(Math.max(0, stepIdx) / (STEP_LABELS.length - 1)) * 100}%` }} />
          </div>
          <div className="fe-steps">
            {STEP_LABELS.map((lbl, i) => (
              <div key={lbl} className={`fe-step${stepIdx === i ? " fe-step--active" : stepIdx > i ? " fe-step--done" : ""}`}>
                <div className="fe-step-dot" />
              </div>
            ))}
          </div>
        </div>
      )}

      {resumed && phase !== "welcome" && (
        <div className="fe-resume">
          <button className="fe-resume-btn" onClick={startFresh}>↺ Start fresh</button>
        </div>
      )}

      {phase === "welcome"      && <Welcome onStart={handleWelcomeStart} />}
      {phase === "feelings"     && <PhaseFeelings selFeelings={selFeelings} toggle={f => toggle(selFeelings, setSelF, f)} onNext={() => setPhase("destinations")} />}
      {phase === "destinations" && <PhaseDestinations recommended={recommended} selDests={selDests} toggle={d => toggle(selDests, setSelD, d)} onBack={() => setPhase("feelings")} onNext={goRoute} selFeelings={selFeelings} />}
      {phase === "route"        && <PhaseRoute route={route} onBack={() => setPhase("destinations")} onNext={() => setPhase("pickup")} />}
      {phase === "pickup"       && <PhasePickup route={route} pickup={pickup} setPickup={setPickup} dropoff={dropoff} setDropoff={setDropoff} onBack={() => setPhase("route")} onNext={() => setPhase("stay")} />}
      {phase === "stay"         && <PhaseCards subtitle="Where will you rest your head? Your accommodation sets the tone for the entire journey. Choose all styles that appeal to you." items={STAYS} sel={selStay} toggle={id => toggle(selStay, setSelStay, id)} onBack={() => setPhase("pickup")} onNext={() => setPhase("move")} nextLabel="Next →" />}
      {phase === "move"         && <PhaseCards subtitle="How will you move through Sri Lanka? The journey between destinations is often as memorable as the destination itself." items={MOVES} sel={selMove} toggle={id => toggle(selMove, setSelMove, id)} onBack={() => setPhase("stay")} onNext={() => setPhase("experiences")} nextLabel="Next →" />}
      {phase === "experiences"  && <PhaseCards subtitle="What experiences are calling to you? These are the moments you will tell stories about for years. Select everything that excites you." items={EXPERIENCES} sel={selExp} toggle={id => toggle(selExp, setSelExp, id)} onBack={() => setPhase("move")} onNext={() => setPhase("details")} nextLabel="Next →" cols5 />}
      {phase === "details"      && <PhaseDetails budget={budget} setBudget={setBudget} groupType={groupType} setGroup={setGroup} groupSize={groupSize} setSize={setSize} startDate={startDate} setDate={setDate} dietary={dietary} setDietary={setDietary} notes={notes} setNotes={setNotes} onBack={() => setPhase("experiences")} onGenerate={generateItinerary} />}
      {phase === "generating"   && <PhaseGenerating msg={genMsg} userInput={welcomeInput} />}
      {phase === "itinerary" && itinerary && <PhaseItinerary it={itinerary} route={route} pickup={pickup} dropoff={dropoff} dayImgs={dayImgs} onUpload={(day, f) => setDayImgs(prev => ({ ...prev, [day]: URL.createObjectURL(f) }))} expandedDay={expandedDay} setExpanded={setExpanded} onEdit={() => setPhase("details")} onBook={openBooking} onUpdateMeta={updateMeta} onUpdateDay={updateDay} />}

      {bookingOpen && itinerary && (
        <BookingModal
          it={itinerary} route={route} pickup={pickup} dropoff={dropoff}
          groupSize={groupSize} startDate={startDate}
          status={bookStatus} bookingRef={bookingRef} errMsg={bookErr}
          onClose={() => setBookingOpen(false)} onSubmit={submitBooking}
        />
      )}
    </div>
  );
}

/* ═══ CSS ═════════════════════════════════════════════════════ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

.fe-root { min-height:100vh; background:#080808; color:#fff; font-family:'Inter',sans-serif; }
/* Wizard phases clear the fixed global navbar (welcome hero stays full-bleed). */
.fe-root--wizard { padding-top:96px; }

/* Animations */
@keyframes fe-in { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
.fe-fadein { animation:fe-in 0.45s ease forwards; }

/* Progress */
.fe-progress { position:sticky; top:96px; z-index:100; background:rgba(8,8,8,0.96); backdrop-filter:blur(12px); border-bottom:1px solid #1a1a1a; padding:0.7rem 1.5rem; }
.fe-progress-track { height:2px; background:#1a1a1a; border-radius:2px; margin-bottom:0.6rem; max-width:900px; margin-left:auto; margin-right:auto; overflow:hidden; }
.fe-progress-fill { height:100%; background:linear-gradient(to right,#C9A84C,#E8C96E); transition:width 0.6s ease; }
.fe-steps { display:flex; justify-content:center; max-width:900px; margin:0 auto; padding-bottom:0.6rem; }
.fe-step { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; }
.fe-step-dot { width:7px; height:7px; border-radius:50%; background:#222; transition:all 0.3s; }
.fe-step--active .fe-step-dot { background:#C9A84C; box-shadow:0 0 8px #C9A84C80; }
.fe-step--done .fe-step-dot { background:#6b5520; }
.fe-step-lbl { font-size:0.57rem; letter-spacing:0.07em; text-transform:uppercase; color:#333; transition:color 0.3s; }
.fe-step--active .fe-step-lbl { color:#C9A84C; }
.fe-step--done .fe-step-lbl { color:#555; }

/* Welcome */
.fe-welcome { position:relative; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0e0e0e; overflow:hidden; }
.fe-welcome::before { content:''; position:absolute; inset:0; background-image:url('/images/Feeling engine.jpg'); background-size:cover; background-position:center; filter:brightness(0.62) saturate(0.85); z-index:0; }
.fe-welcome::after { content:''; position:absolute; inset:0; background:linear-gradient(to top,#0e0e0e 0%,rgba(14,14,14,0.35) 55%,rgba(14,14,14,0.05) 100%); z-index:1; }
.fe-welcome-content { position:relative; z-index:2; text-align:center; max-width:700px; padding:5rem 2rem; display:flex; flex-direction:column; align-items:center; }
.fe-title-lockup { display:flex; flex-direction:column; align-items:center; margin-bottom:1.5rem; }
.fe-title-pre { font-family:'TT Fors', sans-serif; font-size:clamp(0.72rem,1.4vw,0.9rem); font-weight:300; letter-spacing:0.55em; text-transform:uppercase; color:rgba(255,255,255,0.35); margin-bottom:0.2rem; }
.fe-welcome-h1 { font-family:'TT Fors', sans-serif; font-size:clamp(2.8rem,8vw,6rem); font-weight:300; line-height:1; text-transform:uppercase; letter-spacing:0.06em; color:#fff; margin:0; }
.fe-tagline { font-family:'TT Fors', sans-serif; font-size:clamp(0.7rem,1.1vw,0.82rem); font-weight:300; letter-spacing:0.22em; text-transform:uppercase; color:rgba(255,255,255,0.35); margin-bottom:2.25rem; }
.fe-divider { width:36px; height:1px; background:#2a2a2a; margin:0 auto 2.25rem; }
.fe-welcome-bold { font-family:'TT Fors', sans-serif; font-size:clamp(1rem,1.6vw,1.18rem); font-weight:300; color:rgba(255,255,255,0.9); margin-bottom:0.75rem; letter-spacing:0.01em; }
.fe-welcome-sub { font-size:0.87rem; line-height:1.8; color:rgba(255,255,255,0.35); max-width:500px; margin:0 auto 2.5rem; }
.fe-input-row { display:flex; align-items:center; background:#181818; border:1px solid #282828; border-radius:50px; padding:0.35rem 0.35rem 0.35rem 1.4rem; width:100%; max-width:460px; gap:0.5rem; transition:border-color 0.2s; }
.fe-input-row:focus-within { border-color:#3a3a3a; }
.fe-input-row .fe-input { background:transparent; border:none; border-radius:0; padding:0.5rem 0; font-size:0.9rem; color:#fff; flex:1; min-width:0; box-sizing:border-box; }
.fe-input-row .fe-input:focus { border-color:transparent; }
.fe-input-row .fe-input::placeholder { color:rgba(255,255,255,0.22); }
.fe-input-btn { width:38px; height:38px; border-radius:50%; background:#fff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#0e0e0e; flex-shrink:0; transition:all 0.2s; }
.fe-input-btn:hover { background:#C9A84C; transform:scale(1.06); }
/* Phase shell */
.fe-phase { max-width:1080px; margin:0 auto; padding:2.5rem 1.5rem 6rem; }

/* AI bubble */
.fe-bubble { display:flex; gap:1rem; align-items:flex-start; background:#0e0e0e; border:1px solid #1e1e1e; border-left:3px solid #C9A84C; border-radius:12px; padding:1.25rem 1.5rem; margin-bottom:2.5rem; }
.fe-bubble-icon { color:#C9A84C; font-size:1.1rem; flex-shrink:0; margin-top:2px; }
.fe-bubble-label { font-size:0.6rem; letter-spacing:0.24em; text-transform:uppercase; color:#C9A84C; font-weight:600; margin-bottom:0.35rem; }
.fe-bubble-text { font-size:0.95rem; line-height:1.68; color:#ccc; }
.fe-bubble-text strong { color:#fff; }
.fe-section-lbl { font-size:0.63rem; letter-spacing:0.22em; text-transform:uppercase; color:#C9A84C; font-weight:600; margin-bottom:1rem; }

/* Feelings grid */
.fe-feelings-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0.9rem; margin-bottom:2rem; }
@media(max-width:580px){.fe-feelings-grid{grid-template-columns:repeat(2,1fr);}}
.fe-feeling { position:relative; background:#0e0e0e; border:1.5px solid #1e1e1e; border-radius:14px; padding:1.5rem 1rem 1.3rem; text-align:center; cursor:pointer; transition:all 0.22s; display:flex; flex-direction:column; align-items:center; gap:0.35rem; overflow:hidden; }
.fe-feeling::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,var(--fc,#333) 0%,transparent 65%); opacity:0; transition:opacity 0.3s; pointer-events:none; }
.fe-feeling:hover { border-color:var(--fc,#444); transform:translateY(-2px); }
.fe-feeling:hover::after { opacity:0.1; }
.fe-feeling--on { border-color:var(--fc,#C9A84C); background:#111; }
.fe-feeling--on::after { opacity:0.18; }
.fe-feeling-emoji { font-size:2rem; line-height:1; position:relative; z-index:1; }
.fe-feeling-lbl { font-size:0.85rem; font-weight:600; color:#fff; position:relative; z-index:1; }
.fe-feeling-desc { font-size:0.68rem; color:#666; position:relative; z-index:1; }
.fe-feeling-check { position:absolute; top:8px; right:10px; color:#C9A84C; font-size:0.8rem; font-weight:700; z-index:1; }

/* Destination cards */
.fe-dest-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(265px,1fr)); gap:1.1rem; margin-bottom:1rem; }
.fe-dest { position:relative; background:#0e0e0e; border:1.5px solid #1e1e1e; border-radius:14px; overflow:hidden; text-align:left; cursor:pointer; transition:all 0.22s; display:flex; flex-direction:column; }
.fe-dest:hover { border-color:#C9A84C40; transform:translateY(-3px); box-shadow:0 14px 44px rgba(0,0,0,0.5); }
.fe-dest--on { border-color:#C9A84C; }
.fe-dest-img { width:100%; height:175px; object-fit:cover; display:block; }
.fe-dest-body { padding:1rem; flex:1; }
.fe-dest-tags { display:flex; gap:0.32rem; flex-wrap:wrap; margin-bottom:0.55rem; }
.fe-tag { font-size:0.58rem; letter-spacing:0.08em; text-transform:uppercase; padding:2px 7px; background:#181818; border:1px solid #2a2a2a; border-radius:20px; color:#C9A84C; }
.fe-dest-name { font-family:'TT Fors', sans-serif; font-size:1.3rem; font-weight: 300; color:#fff; margin-bottom:0.1rem; }
.fe-dest-region { font-size:0.62rem; letter-spacing:0.12em; text-transform:uppercase; color:#555; margin-bottom:0.5rem; }
.fe-dest-desc { font-size:0.79rem; line-height:1.55; color:#888; margin-bottom:0.65rem; }
.fe-dest-meta { display:flex; gap:0.9rem; font-size:0.72rem; color:#666; margin-bottom:0.4rem; }
.fe-dest-hl { font-size:0.72rem; color:#C9A84C; }

/* Shared check badge */
.fe-check { position:absolute; top:9px; right:9px; width:24px; height:24px; border-radius:50%; background:#C9A84C; color:#000; font-size:0.7rem; font-weight:700; display:flex; align-items:center; justify-content:center; }

/* Route */
.fe-route-layout { display:grid; grid-template-columns:auto 1fr; gap:2.5rem; align-items:start; margin-bottom:2rem; }
@media(max-width:680px){.fe-route-layout{grid-template-columns:1fr;}}
.fe-map-wrap { position:sticky; top:110px; }
.fe-route-list { display:flex; flex-direction:column; }
.fe-route-stop { display:flex; flex-direction:column; align-items:flex-start; }
.fe-route-num { width:30px; height:30px; border-radius:50%; background:#C9A84C; color:#000; font-weight:700; font-size:0.78rem; display:flex; align-items:center; justify-content:center; margin-bottom:0.5rem; }
.fe-route-card { display:flex; gap:0.85rem; background:#0e0e0e; border:1px solid #1a1a1a; border-radius:12px; overflow:hidden; width:100%; }
.fe-route-img { width:90px; height:72px; object-fit:cover; flex-shrink:0; }
.fe-route-info { padding:0.7rem; flex:1; }
.fe-route-name { font-family:'TT Fors', sans-serif; font-size:1.1rem; font-weight: 300; color:#fff; }
.fe-route-region { font-size:0.62rem; letter-spacing:0.1em; text-transform:uppercase; color:#555; margin-bottom:0.25rem; }
.fe-route-meta { font-size:0.72rem; color:#777; margin-bottom:0.2rem; }
.fe-route-hl { font-size:0.7rem; color:#C9A84C; }
.fe-route-arrow { font-size:1.1rem; color:#C9A84C; padding:0.3rem 0 0.3rem 0.85rem; opacity:0.5; }
.fe-route-summary { margin-top:1rem; display:flex; gap:2rem; font-size:0.8rem; color:#666; border-top:1px solid #181818; padding-top:0.9rem; }
.fe-route-summary strong { color:#C9A84C; }

/* Option cards */
.fe-opt-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:0.9rem; margin-bottom:2rem; }
.fe-opt-grid--5 { grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); }
.fe-opt { position:relative; background:#0e0e0e; border:1.5px solid #1e1e1e; border-radius:12px; overflow:hidden; cursor:pointer; transition:all 0.22s; text-align:left; display:flex; flex-direction:column; }
.fe-opt:hover { border-color:#C9A84C40; transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,0.4); }
.fe-opt--on { border-color:#C9A84C; }
.fe-opt-img { width:100%; height:125px; object-fit:cover; display:block; }
.fe-opt-body { padding:0.7rem; flex:1; }
.fe-opt-emoji { font-size:1.25rem; }
.fe-opt-label { font-size:0.83rem; font-weight:600; color:#fff; margin:0.28rem 0 0.15rem; }
.fe-opt-desc { font-size:0.7rem; color:#777; }

/* Details */
.fe-details { display:flex; flex-direction:column; gap:1.5rem; margin-bottom:2rem; }
.fe-detail-section {}
.fe-detail-lbl { font-size:0.68rem; letter-spacing:0.14em; text-transform:uppercase; color:#777; margin-bottom:0.65rem; font-weight:500; }
.fe-detail-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
@media(max-width:540px){.fe-detail-row{grid-template-columns:1fr;}}
.fe-budget-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:0.7rem; }
@media(min-width:660px){.fe-budget-grid{grid-template-columns:repeat(4,1fr);}}
.fe-budget-card { background:#0e0e0e; border:1.5px solid #1e1e1e; border-radius:10px; padding:1rem; cursor:pointer; transition:all 0.2s; text-align:left; }
.fe-budget-card:hover { border-color:#C9A84C40; }
.fe-budget-card--on { border-color:#C9A84C; background:#111; }
.fe-budget-name { font-size:0.82rem; font-weight:600; color:#fff; margin-bottom:0.18rem; }
.fe-budget-range { font-size:0.75rem; color:#C9A84C; margin-bottom:0.15rem; }
.fe-budget-desc { font-size:0.66rem; color:#666; }
.fe-group-row { display:flex; gap:0.55rem; flex-wrap:wrap; }
.fe-group-btn { display:flex; flex-direction:column; align-items:center; gap:0.22rem; background:#0e0e0e; border:1.5px solid #1e1e1e; border-radius:10px; padding:0.7rem 1rem; cursor:pointer; transition:all 0.2s; font-size:0.73rem; color:#666; }
.fe-group-btn:hover { border-color:#C9A84C40; color:#fff; }
.fe-group-btn--on { border-color:#C9A84C; color:#fff; }
.fe-group-btn span:first-child { font-size:1.4rem; }
.fe-input { width:100%; background:#0e0e0e; border:1.5px solid #1e1e1e; border-radius:8px; color:#fff; font-size:0.86rem; font-family:'Inter',sans-serif; padding:0.75rem 1rem; transition:border-color 0.2s; outline:none; box-sizing:border-box; }
.fe-input:focus { border-color:#C9A84C55; }
.fe-input::placeholder { color:#444; }
.fe-textarea { resize:vertical; min-height:80px; }

/* Footer / CTA */
.fe-footer { display:flex; justify-content:space-between; align-items:center; border-top:1px solid #181818; padding-top:1.5rem; flex-wrap:wrap; gap:0.85rem; }
.fe-footer-btns { display:flex; gap:0.85rem; flex-wrap:wrap; margin-left:auto; }
.fe-hint { font-size:0.75rem; color:#555; }
.fe-cta { background:#C9A84C; color:#080808; border:none; padding:0.9rem 2rem; border-radius:8px; font-size:0.85rem; font-weight:700; letter-spacing:0.04em; cursor:pointer; transition:all 0.2s; white-space:nowrap; font-family:'Inter',sans-serif; }
.fe-cta:hover { background:#E8C96E; transform:translateY(-1px); }
.fe-cta:disabled { opacity:0.35; cursor:not-allowed; transform:none; }
.fe-cta--hero { font-size:0.92rem; padding:1rem 2.5rem; }
@keyframes fe-pulse { 0%,100%{box-shadow:0 0 0 0 #C9A84C25} 50%{box-shadow:0 0 0 14px transparent} }
.fe-cta--pulse { animation:fe-pulse 2.2s infinite; }
.fe-back { background:transparent; color:#666; border:1px solid #282828; padding:0.9rem 1.5rem; border-radius:8px; font-size:0.82rem; cursor:pointer; transition:all 0.2s; font-family:'Inter',sans-serif; }
.fe-back:hover { border-color:#444; color:#fff; }

/* Generating */
.fe-generating { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#0e0e0e; padding:3rem 2rem; position:relative; gap:0; }
.fe-gen-user-bubble { position:absolute; top:2.5rem; right:2.5rem; background:#fff; color:#111; padding:0.7rem 1.2rem; border-radius:20px 20px 4px 20px; font-size:0.88rem; font-family:'TT Fors',sans-serif; font-weight:400; max-width:240px; line-height:1.4; box-shadow:0 4px 20px rgba(0,0,0,0.6); }
.fe-gen-sketch { width:100%; max-width:820px; margin-bottom:1.75rem; }
.fe-gen-svg { width:100%; height:auto; display:block; color:rgba(255,255,255,0.72); }
.fe-gen-caption { font-family:'TT Fors',sans-serif; font-size:clamp(0.82rem,1.3vw,1rem); font-weight:300; color:rgba(255,255,255,0.38); text-align:center; max-width:520px; line-height:1.75; margin-bottom:1.5rem; }
.fe-gen-status { font-family:'TT Fors',sans-serif; font-size:0.72rem; letter-spacing:0.18em; text-transform:uppercase; color:rgba(255,255,255,0.2); text-align:center; }

@keyframes fe-draw { to { stroke-dashoffset: 0; } }
.fe-draw { fill:none; stroke-dasharray:2000; stroke-dashoffset:2000; }
.fe-draw-g  { animation:fe-draw 1.2s cubic-bezier(0.4,0,0.2,1) forwards; animation-delay:0.2s; }
.fe-draw-t1 { animation:fe-draw 1.5s cubic-bezier(0.4,0,0.2,1) forwards; animation-delay:1.1s; }
.fe-draw-f1a{ animation:fe-draw 0.7s ease forwards; animation-delay:2.3s; }
.fe-draw-f1b{ animation:fe-draw 0.7s ease forwards; animation-delay:2.8s; }
.fe-draw-f1c{ animation:fe-draw 0.7s ease forwards; animation-delay:3.2s; }
.fe-draw-f1d{ animation:fe-draw 0.65s ease forwards; animation-delay:3.6s; }
.fe-draw-t2 { animation:fe-draw 1.1s cubic-bezier(0.4,0,0.2,1) forwards; animation-delay:3.9s; }
.fe-draw-f2 { animation:fe-draw 0.6s ease forwards; animation-delay:4.7s; }

/* Itinerary hero */
.fe-it {}
.fe-it-hero { position:relative; height:62vh; min-height:380px; overflow:hidden; }
.fe-it-hero-img { width:100%; height:100%; object-fit:cover; }
.fe-it-hero-ov { position:absolute; inset:0; background:linear-gradient(to top,#080808 0%,rgba(8,8,8,0.62) 48%,rgba(8,8,8,0.1) 100%); }
.fe-it-hero-content { position:absolute; bottom:0; left:0; right:0; padding:2.5rem; max-width:800px; }
.fe-it-title { font-family:'TT Fors', sans-serif; font-size:clamp(1.9rem,4.5vw,3rem); font-weight: 300; line-height:1.1; margin-bottom:0.75rem;  text-transform: uppercase; letter-spacing: 0.08em; }
.fe-it-narrative { font-size:0.9rem; color:#ccc; line-height:1.7; max-width:600px; margin-bottom:1.1rem; }
.fe-it-meta { display:flex; gap:1.5rem; flex-wrap:wrap; font-size:0.8rem; color:#aaa; }

/* Itinerary actions */
.fe-it-actions { display:flex; gap:0.8rem; padding:1.1rem 1.5rem; background:#0c0c0c; border-bottom:1px solid #181818; flex-wrap:wrap; }
.fe-it-act { padding:0.6rem 1.4rem; border-radius:8px; font-size:0.8rem; cursor:pointer; transition:all 0.2s; border:1px solid #282828; background:transparent; color:#888; font-family:'Inter',sans-serif; }
.fe-it-act:hover { border-color:#444; color:#fff; }
.fe-it-act--gold { background:#C9A84C; color:#000; border-color:#C9A84C; font-weight:700; }
.fe-it-act--gold:hover { background:#E8C96E; }
.fe-it-act--book { background:#111; border-color:#C9A84C55; color:#C9A84C; font-weight:600; }
.fe-it-act--book:hover { background:#C9A84C; color:#000; }

/* Itinerary body */
.fe-it-body { display:grid; grid-template-columns:1fr 370px; max-width:1380px; margin:0 auto; }
@media(max-width:880px){.fe-it-body{grid-template-columns:1fr;}}
.fe-it-timeline { padding:2.5rem 2rem; border-right:1px solid #141414; }
.fe-it-section-title { font-family:'TT Fors', sans-serif; font-size:1.45rem; font-weight: 300; color:#C9A84C; margin-bottom:1.8rem; letter-spacing:0.02em; }

/* Day cards */
.fe-it-day { background:#0b0b0b; border:1px solid #181818; border-radius:13px; overflow:hidden; margin-bottom:1rem; }
.fe-it-day-hdr { width:100%; background:none; border:none; cursor:pointer; display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; padding:1.1rem 1.4rem; text-align:left; }
.fe-it-day-left { display:flex; flex-direction:column; gap:0.18rem; }
.fe-it-day-num { font-size:0.58rem; letter-spacing:0.25em; text-transform:uppercase; color:#C9A84C; font-weight:600; }
.fe-it-day-dest { font-family:'TT Fors', sans-serif; font-size:1.25rem; font-weight: 300; color:#fff; }
.fe-it-day-theme { font-size:0.71rem; color:#666;  }
.fe-it-chevron { color:#555; font-size:0.68rem; flex-shrink:0; margin-top:4px; }
.fe-it-day-body {}
.fe-it-img-wrap { position:relative; height:200px; overflow:hidden; }
.fe-it-day-img { width:100%; height:100%; object-fit:cover; display:block; }
.fe-it-upload { position:absolute; bottom:10px; right:10px; background:rgba(0,0,0,0.72); border:1px solid #333; border-radius:8px; color:#fff; font-size:0.7rem; padding:0.35rem 0.65rem; cursor:pointer; transition:all 0.2s; }
.fe-it-upload:hover { background:rgba(201,168,76,0.85); color:#000; }
.fe-it-day-content { padding:1.35rem 1.4rem; }
.fe-it-time-block { margin-bottom:1.1rem; }
.fe-it-time-lbl { font-size:0.6rem; letter-spacing:0.18em; text-transform:uppercase; color:#C9A84C; font-weight:600; margin-bottom:0.3rem; }
.fe-it-time-text { font-size:0.83rem; line-height:1.65; color:#aaa; margin:0; }
.fe-it-extras { border-top:1px solid #181818; padding-top:0.9rem; display:flex; flex-direction:column; gap:0.45rem; }
.fe-it-extra { font-size:0.76rem; color:#777; display:flex; gap:0.5rem; line-height:1.45; }
.fe-it-tip { color:#C9A84C99; }

/* Sidebar */
.fe-it-sidebar { padding:1.8rem 1.4rem; background:#080808; display:flex; flex-direction:column; gap:1rem; }
.fe-it-card { background:#0e0e0e; border:1px solid #181818; border-radius:12px; padding:1.15rem; }
.fe-it-card-title { font-size:0.6rem; letter-spacing:0.22em; text-transform:uppercase; color:#C9A84C; font-weight:600; margin-bottom:0.9rem; }
.fe-it-budget-range { font-family:'TT Fors', sans-serif; font-size:1.45rem; color:#fff; font-weight: 300; margin-bottom:0.25rem; }
.fe-it-budget-note { font-size:0.66rem; color:#555; }
.fe-it-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.55rem; }
.fe-it-list li { font-size:0.76rem; color:#999; line-height:1.5; }
.fe-it-book-cta { background:linear-gradient(135deg,#C9A84C,#E8C96E); color:#080808; border:none; border-radius:12px; padding:1.2rem 1.4rem; cursor:pointer; transition:all 0.2s; display:flex; flex-direction:column; align-items:center; gap:0.25rem; font-weight:700; font-size:0.95rem; font-family:'Inter',sans-serif; }
.fe-it-book-cta span { font-size:0.68rem; font-weight:400; opacity:0.75; }
.fe-it-book-cta:hover { transform:translateY(-2px); box-shadow:0 10px 34px rgba(201,168,76,0.3); }

/* ── Pickup Phase ── */
.fe-pickup-wrap { display:flex; flex-direction:column; gap:2rem; max-width:680px; }
.fe-pickup-block { background:#0e0e0e; border:1px solid #1e1e1e; border-radius:14px; padding:1.75rem; }
.fe-pickup-label { display:flex; align-items:center; gap:0.65rem; font-family:'TT Fors', sans-serif; font-size:1.25rem; font-weight: 300; color:#fff; margin-bottom:0.4rem; }
.fe-pickup-badge { font-family:'Inter',sans-serif; font-size:0.6rem; font-weight:700; letter-spacing:0.12em; padding:0.2rem 0.55rem; border-radius:4px; }
.fe-pickup-badge--start { background:#27ae60; color:#fff; }
.fe-pickup-badge--end   { background:#e74c3c; color:#fff; }
.fe-pickup-desc { font-size:0.82rem; color:#555; margin-bottom:1rem; }
.fe-pickup-input-wrap { position:relative; }
.fe-pickup-input { width:100%; }
.fe-pickup-sugg { position:absolute; top:calc(100% + 4px); left:0; right:0; background:#111; border:1px solid #2a2a2a; border-radius:10px; z-index:200; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.5); }
.fe-pickup-sugg-item { display:block; width:100%; text-align:left; background:transparent; border:none; color:#ccc; padding:0.7rem 1rem; font-size:0.88rem; cursor:pointer; transition:background 0.15s; }
.fe-pickup-sugg-item:hover { background:#1a1a1a; color:#C9A84C; }
.fe-pickup-quick { display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.85rem; }
.fe-pickup-chip { background:#111; border:1px solid #222; color:#888; border-radius:20px; padding:0.3rem 0.85rem; font-size:0.78rem; cursor:pointer; transition:all 0.2s; }
.fe-pickup-chip:hover { border-color:#C9A84C; color:#C9A84C; }
.fe-pickup-chip--on { background:rgba(201,168,76,0.12); border-color:#C9A84C; color:#C9A84C; }
.fe-pickup-same { display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; color:#888; cursor:pointer; margin-bottom:0; }
.fe-pickup-same input { accent-color:#C9A84C; width:15px; height:15px; cursor:pointer; }
.fe-pickup-same-preview { margin-top:0.85rem; padding:0.75rem 1rem; background:#0a0a0a; border:1px solid #222; border-radius:8px; font-size:0.88rem; color:#777; }
.fe-pickup-same-preview strong { color:#C9A84C; }
.fe-pickup-connector { display:flex; flex-direction:column; align-items:flex-start; gap:0.65rem; padding-left:1.5rem; position:relative; }
.fe-pickup-conn-track { position:absolute; left:1.75rem; top:0; bottom:0; width:1px; background:linear-gradient(to bottom,#27ae60,#C9A84C,#e74c3c); opacity:0.35; }
.fe-pickup-stop { display:flex; align-items:center; gap:0.75rem; position:relative; z-index:1; }
.fe-pickup-stop-dot { width:24px; height:24px; border-radius:50%; background:#C9A84C; color:#080808; display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:700; flex-shrink:0; }
.fe-pickup-stop-name { font-size:0.88rem; color:#999; }
.fe-pickup-more { font-size:0.78rem; color:#444; padding-left:0.25rem; }

@media print {
  .fe-progress,.fe-it-actions,.fe-it-book-cta,.fe-it-act,.fe-resume,.fe-modal-overlay,.fe-it-edit-hint { display:none!important; }
  .fe-it-body { display:block; }
  .fe-it-day-body { display:block!important; }
}

/* ── Welcome busy spinner + interpreting hint ── */
.fe-spin { width:16px; height:16px; border-radius:50%; border:2px solid rgba(14,14,14,0.25); border-top-color:#0e0e0e; animation:fe-spin 0.7s linear infinite; }
@keyframes fe-spin { to { transform:rotate(360deg); } }
.fe-welcome-interpreting { margin-top:1rem; font-size:0.78rem; letter-spacing:0.04em; color:#C9A84C; opacity:0.85; }

/* ── Resume banner ── */
.fe-resume { max-width:1080px; margin:0.9rem auto -0.4rem; padding:0 1.5rem; display:flex; align-items:center; justify-content:flex-end; }
.fe-resume-btn { background:transparent; border:1px solid #2c2c2c; color:#888; font-size:0.74rem; padding:0.45rem 1rem; border-radius:7px; cursor:pointer; font-family:'Inter',sans-serif; transition:all 0.2s; white-space:nowrap; }
.fe-resume-btn:hover { border-color:#C9A84C; color:#C9A84C; }

/* ── Inline itinerary editing ── */
.fe-it-edit-hint { max-width:1180px; margin:0.6rem auto 0; padding:0 1.5rem; font-size:0.74rem; color:#C9A84C; opacity:0.85; }
.fe-it-day-hdr--edit { display:flex; align-items:center; width:100%; padding:1rem 1.25rem; box-sizing:border-box; }
.fe-edit-hero { display:block; width:100%; box-sizing:border-box; background:rgba(0,0,0,0.35); border:1px solid rgba(201,168,76,0.4); border-radius:8px; color:#fff; font-family:'Inter',sans-serif; margin-bottom:0.6rem; padding:0.5rem 0.7rem; outline:none; }
.fe-edit-hero:focus { border-color:#C9A84C; }
.fe-edit-hero--eyebrow { max-width:340px; font-size:0.7rem; letter-spacing:0.18em; text-transform:uppercase; color:#C9A84C; }
.fe-edit-hero--title { font-family:'TT Fors', sans-serif; font-size:clamp(1.5rem,3.5vw,2.4rem); font-weight:300; text-transform:uppercase; letter-spacing:0.06em; }
.fe-edit-hero--narr { font-size:0.9rem; color:#eee; line-height:1.6; resize:vertical; max-width:620px; }
.fe-edit-inline { width:100%; box-sizing:border-box; background:#0a0a0a; border:1px solid #2a2a2a; border-radius:6px; color:#e8e8e8; font-family:'Inter',sans-serif; font-size:0.85rem; padding:0.4rem 0.6rem; outline:none; }
.fe-edit-inline:focus { border-color:#C9A84C77; }
.fe-edit-area { width:100%; box-sizing:border-box; background:#0a0a0a; border:1px solid #2a2a2a; border-radius:6px; color:#e8e8e8; font-family:'Inter',sans-serif; font-size:0.85rem; line-height:1.6; padding:0.5rem 0.7rem; outline:none; resize:vertical; }
.fe-edit-area:focus { border-color:#C9A84C77; }

/* ── Booking modal ── */
.fe-modal-overlay { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,0.78); backdrop-filter:blur(4px); display:flex; align-items:flex-start; justify-content:center; padding:5vh 1rem; overflow-y:auto; animation:fe-fade 0.25s ease; }
@keyframes fe-fade { from { opacity:0; } to { opacity:1; } }
.fe-modal { width:100%; max-width:480px; background:#0c0c0c; border:1px solid #1f1f1f; border-radius:16px; box-shadow:0 24px 80px rgba(0,0,0,0.6); position:relative; }
.fe-modal-form { padding:2rem 1.9rem; display:flex; flex-direction:column; }
.fe-modal-x { position:absolute; top:0.9rem; right:1.1rem; background:none; border:none; color:#666; font-size:1.5rem; line-height:1; cursor:pointer; transition:color 0.2s; }
.fe-modal-x:hover { color:#fff; }
.fe-modal-title { font-family:'TT Fors', sans-serif; font-size:1.5rem; font-weight:300; color:#fff; text-transform:uppercase; letter-spacing:0.05em; margin:0.35rem 0 1.1rem; line-height:1.15; }
.fe-modal-summary { background:#0a0a0a; border:1px solid #1a1a1a; border-radius:10px; padding:0.9rem 1.05rem; margin-bottom:1.3rem; display:flex; flex-direction:column; gap:0.5rem; }
.fe-modal-summary > div { display:flex; justify-content:space-between; gap:1rem; font-size:0.8rem; }
.fe-modal-summary span { color:#666; }
.fe-modal-summary strong { color:#d8d8d8; font-weight:500; text-align:right; }
.fe-modal-label { display:flex; flex-direction:column; gap:0.35rem; font-size:0.7rem; letter-spacing:0.1em; text-transform:uppercase; color:#9a9a9a; margin-bottom:0.85rem; }
.fe-modal-input { background:#0e0e0e; border:1.5px solid #1e1e1e; border-radius:8px; color:#fff; font-size:0.88rem; font-family:'Inter',sans-serif; padding:0.7rem 0.9rem; outline:none; transition:border-color 0.2s; }
.fe-modal-input:focus { border-color:#C9A84C55; }
.fe-modal-input:disabled { opacity:0.5; }
.fe-modal-err { background:#2a1416; border:1px solid #5a2327; color:#f3a6ab; font-size:0.78rem; border-radius:8px; padding:0.55rem 0.8rem; margin:0 0 0.9rem; }
.fe-modal-submit { background:linear-gradient(135deg,#C9A84C,#E8C96E); color:#080808; border:none; border-radius:9px; padding:0.95rem; font-size:0.88rem; font-weight:700; letter-spacing:0.03em; cursor:pointer; font-family:'Inter',sans-serif; transition:all 0.2s; }
.fe-modal-submit:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 10px 30px rgba(201,168,76,0.28); }
.fe-modal-submit:disabled { opacity:0.55; cursor:default; }
.fe-modal-fine { font-size:0.7rem; color:#5a5a5a; text-align:center; margin:0.9rem 0 0; }
.fe-modal-success { padding:2.6rem 2rem; text-align:center; display:flex; flex-direction:column; align-items:center; }
.fe-modal-check { width:54px; height:54px; border-radius:50%; background:rgba(39,174,96,0.15); border:1.5px solid #27ae60; color:#27ae60; font-size:1.6rem; display:flex; align-items:center; justify-content:center; margin-bottom:1.1rem; }
.fe-modal-ref { font-size:0.95rem; color:#fff; margin:0.5rem 0 0.9rem; letter-spacing:0.02em; }
.fe-modal-ref strong { color:#C9A84C; }
.fe-modal-text { font-size:0.85rem; color:#bbb; line-height:1.65; max-width:360px; margin:0 0 1.6rem; }
.fe-modal-done { background:#C9A84C; color:#080808; border:none; border-radius:9px; padding:0.8rem 2.4rem; font-size:0.85rem; font-weight:700; cursor:pointer; font-family:'Inter',sans-serif; transition:all 0.2s; }
.fe-modal-done:hover { background:#E8C96E; }
`;
