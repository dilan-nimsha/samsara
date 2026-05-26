"use client";

import { useState, useEffect } from "react";

interface Props { onClose: () => void }

type Tab = "who" | "what" | "remarkable";

interface CardData {
  id: string; type: string; title: string; meta: string;
  image: string; description: string;
}

const WHO_CARDS: CardData[] = [
  { id: "solo",        type: "Traveller Type", title: "Solo & Duos",    meta: "Independent journeys",   image: "/images/galle-trip-1.webp",      description: "Designed for the free spirit — solo explorers and duos who travel on their own terms, unconstrained by itinerary." },
  { id: "couples",     type: "Traveller Type", title: "Couples",         meta: "Intimate escapes",       image: "/images/galle-trip-2.webp",      description: "Private villas, candlelit dinners, sunrise hikes — every moment crafted for two." },
  { id: "families",    type: "Traveller Type", title: "Families",        meta: "Memories for all ages",  image: "/images/trip-3.webp",            description: "Multi-generational adventures that bring every member of the family closer together." },
  { id: "adventurers", type: "Traveller Type", title: "Adventurers",     meta: "Beyond the ordinary",    image: "/images/hill-country.webp",      description: "For those who seek the edge — treks, safaris and encounters that push the limits of travel." },
  { id: "honeymoon",   type: "Traveller Type", title: "Honeymoons",      meta: "Love & celebration",     image: "/images/theSouth_1.webp",        description: "Your first journey together — extraordinary in every detail, from arrival to farewell." },
];

const WHAT_CARDS: CardData[] = [
  { id: "wildlife",  type: "Category", title: "Wildlife",   meta: "Safaris & nature",     image: "/images/dest-2.webp",             description: "Track leopards at dawn, watch elephants at dusk — Sri Lanka's wildlife is unlike anywhere on earth." },
  { id: "marine",    type: "Category", title: "Marine",     meta: "Ocean & underwater",   image: "/images/galle-beach-scaled.webp", description: "Dive pristine reefs, snorkel with turtles, and witness the largest creatures on the planet." },
  { id: "trekking",  type: "Category", title: "Trekking",   meta: "Highland trails",      image: "/images/hill-country.webp",      description: "Misty highlands, ancient trails and sweeping views across the island's emerald interior." },
  { id: "cultural",  type: "Category", title: "Cultural",   meta: "Heritage & tradition", image: "/images/dest-4.webp",            description: "Temple visits, Kandyan dance, ancient kingdoms — immerse yourself in 2,500 years of civilisation." },
  { id: "adventure", type: "Category", title: "Adventure",  meta: "Thrill-seeking",       image: "/images/dest-5.webp",            description: "White-water rapids, surf breaks and jungle expeditions for travellers who crave the extraordinary." },
];

const REM_CARDS: CardData[] = [
  { id: "itw-1", type: "Nature",      title: "Into the Wild",           meta: "10 Days", image: "/images/trip-1.webp", description: "Some places don't just take your breath away — they give it back. Crafted for souls most alive in nature's purest form." },
  { id: "itw-2", type: "Adventure",   title: "Capital, Coastal & Hill", meta: "8 Days",  image: "/images/trip-2.webp", description: "From bustling capitals to serene coastlines and misty hills — a journey of contrasts that defines Sri Lanka." },
  { id: "itw-3", type: "Expedition",  title: "Lost & Found",            meta: "12 Days", image: "/images/trip-3.webp", description: "Venture into the unknown and discover the parts of yourself only travel can reveal." },
  { id: "itw-4", type: "Slow Travel", title: "See You In the Moment",   meta: "7 Days",  image: "/images/trip-4.webp", description: "Slow down, breathe in and let each moment unfold without rush or agenda." },
  { id: "itw-5", type: "Spiritual",   title: "The Sacred Path",          meta: "9 Days",  image: "/images/dest-4.webp", description: "Ancient temples, sacred mountains and timeless rituals — a journey inward through the spiritual heart of Sri Lanka." },
];


const NAV: { id: Tab; label: string }[] = [
  { id: "who",        label: "WHO" },
  { id: "what",       label: "WHAT" },
  { id: "remarkable", label: "REMARKABLE\nEXPERIENCES" },
];

function TripCard({ card, delay = 0 }: { card: CardData; delay?: number }) {
  return (
    <a
      className="eo2-trip-card"
      href="/experiences"
      style={{ animationDelay: `${delay}s` }}
    >
      <img
        className="eo2-trip-img"
        src={card.image}
        alt={card.title}
        onError={e => { (e.currentTarget as HTMLImageElement).src = "/images/dest-1.webp"; }}
      />
      <div className="eo2-trip-grad" />
      <div className="eo2-trip-info">
        <p className="eo2-trip-type">{card.type}</p>
        <h3 className="eo2-trip-title">{card.title}</h3>
        <p className="eo2-trip-meta">{card.meta}</p>
      </div>
    </a>
  );
}

export default function ExperiencesOverlay({ onClose }: Props) {
  const [active, setActive] = useState<Tab>("who");
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  function switchTab(id: Tab) {
    if (id === active) return;
    setActive(id);
    setAnimKey(k => k + 1);
  }

  return (
    <>
      <style>{`
        /* ── ROOT ── */
        .eo2-root {
          position: fixed; inset: 0; z-index: 2000;
          background: #080808;
          display: flex; flex-direction: column;
          animation: eo2-enter 0.45s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @keyframes eo2-enter {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── TOPBAR ── */
        .eo2-topbar {
          display: flex; align-items: center; justify-content: flex-end;
          padding: 1.5rem 3rem; flex-shrink: 0;
        }
        .eo2-close {
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.35); transition: color 0.2s;
          padding: 0.4rem; width: 32px; height: 32px;
        }
        .eo2-close:hover { color: #fff; }
        .eo2-close-icon { width: 20px; height: 20px; position: relative; }
        .eo2-close-icon::before, .eo2-close-icon::after {
          content: ''; position: absolute; top: 50%; left: 50%;
          width: 18px; height: 1px; background: currentColor;
        }
        .eo2-close-icon::before { transform: translate(-50%,-50%) rotate(45deg); }
        .eo2-close-icon::after  { transform: translate(-50%,-50%) rotate(-45deg); }

        /* ── BODY ── */
        .eo2-body { display: flex; flex: 1; overflow: hidden; min-height: 0; }

        /* ── LEFT NAV ── */
        .eo2-nav {
          width: 280px; flex-shrink: 0;
          display: flex; flex-direction: column; justify-content: center;
          padding: 2rem 3rem;
          border-right: 1px solid rgba(255,255,255,0.05);
          gap: 0.1rem;
        }
        .eo2-nav-item {
          background: none; border: none; cursor: pointer; text-align: left;
          padding: 0.85rem 0 0.85rem 1.2rem; margin-left: -1.2rem;
          font-family: 'TT Fors', 'Inter', sans-serif;
          font-size: clamp(1rem, 1.6vw, 1.35rem);
          font-weight: 300; letter-spacing: 0.06em; text-transform: uppercase;
          color: rgba(255,255,255,0.18); line-height: 1.25; white-space: pre-line;
          border-left: 2px solid transparent; transition: all 0.25s;
        }
        .eo2-nav-item:hover { color: rgba(255,255,255,0.55); }
        .eo2-nav-item.active {
          color: #ffffff; border-left-color: #C9A84C;
          font-size: clamp(1.3rem, 2.2vw, 1.9rem);
        }
        .eo2-nav-divider { height: 1px; background: rgba(255,255,255,0.04); margin: 1.25rem 0; }
        .eo2-nav-feelings {
          display: block; padding: 0.85rem 0 0.85rem 1.2rem; margin-left: -1.2rem;
          font-family: 'TT Fors', 'Inter', sans-serif;
          font-size: clamp(0.72rem, 1vw, 0.9rem);
          font-weight: 300; letter-spacing: 0.1em; text-transform: uppercase;
          color: #C9A84C; text-decoration: none; transition: opacity 0.2s;
          border-left: 2px solid rgba(201,168,76,0.3);
        }
        .eo2-nav-feelings:hover { opacity: 0.65; }

        /* ── RIGHT PANEL ── */
        .eo2-right {
          flex: 1; min-width: 0;
          overflow-y: auto; overflow-x: hidden;
          padding: 2rem 2.5rem 3rem;
          display: flex; flex-direction: column;
          scrollbar-width: thin;
          scrollbar-color: rgba(201,168,76,0.12) transparent;
        }
        .eo2-right::-webkit-scrollbar { width: 3px; }
        .eo2-right::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.15); border-radius: 2px; }

        /* ── WHO / WHAT: full-height portrait cards ── */
        .eo2-fullheight-wrap {
          flex: 1; display: flex; min-height: 0; align-items: stretch;
        }
        .eo2-cards-row {
          display: flex; gap: 10px; flex: 1;
          overflow-x: auto; overflow-y: hidden;
          scrollbar-width: none; align-items: stretch;
        }
        .eo2-cards-row::-webkit-scrollbar { display: none; }


        /* ── TRIP CARD ── */
        .eo2-trip-card {
          flex-shrink: 0; flex: 1;
          min-width: 185px; max-width: 300px;
          position: relative; overflow: hidden; cursor: pointer;
          animation: eo2-card-in 0.5s cubic-bezier(0.22,1,0.36,1) both;
          text-decoration: none; display: block;
        }
        @keyframes eo2-card-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .eo2-trip-img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.65s ease;
        }
        .eo2-trip-card:hover .eo2-trip-img { transform: scale(1.07); }
        .eo2-trip-grad {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,8,8,0.96) 0%, rgba(8,8,8,0.04) 55%);
        }
        .eo2-trip-info {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 1.4rem; transition: opacity 0.4s;
        }
        .eo2-trip-type {
          font-size: 0.57rem; letter-spacing: 0.25em; text-transform: uppercase;
          color: #C9A84C; margin-bottom: 0.35rem; font-family: 'Inter', sans-serif;
        }
        .eo2-trip-title {
          font-family: 'TT Fors', 'Inter', sans-serif;
          font-size: clamp(0.88rem, 1.4vw, 1.15rem);
          font-weight: 300; color: #ffffff;
          text-transform: uppercase; letter-spacing: 0.05em;
          line-height: 1.2; margin-bottom: 0.3rem;
        }
        .eo2-trip-meta {
          font-size: 0.59rem; letter-spacing: 0.15em;
          color: rgba(242,237,228,0.45); font-family: 'Inter', sans-serif;
        }

        /* ── RESPONSIVE ── */
        @media(max-width:900px) {
          .eo2-nav { width: 210px; padding: 2rem; }
          .eo2-right { padding: 1.5rem; }
        }
        @media(max-width:640px) {
          .eo2-topbar { padding: 1rem 1.5rem; }
          .eo2-body { flex-direction: column; }
          .eo2-nav {
            width: 100%; flex-direction: row; flex-wrap: wrap; gap: 0.35rem;
            padding: 0.9rem 1.2rem; border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            justify-content: flex-start;
          }
          .eo2-nav-item { font-size: 0.8rem !important; padding: 0.38rem 0.8rem; border-left: none; margin-left: 0; white-space: nowrap; border-bottom: 2px solid transparent; }
          .eo2-nav-item.active { font-size: 0.8rem !important; border-left: none; border-bottom-color: #C9A84C; }
          .eo2-nav-divider, .eo2-nav-feelings { display: none; }
          .eo2-right { padding: 1rem 1rem 1.5rem; }
          .eo2-trip-card { min-width: 140px; max-width: 175px; }
          .eo2-fixed-row { height: clamp(160px, 28vh, 240px); }
          .eo2-itw-heading { font-size: clamp(1.7rem, 7vw, 2.6rem); }
        }
      `}</style>

      <div className="eo2-root">

        <div className="eo2-topbar">
          <button className="eo2-close" onClick={onClose} aria-label="Close">
            <span className="eo2-close-icon" />
          </button>
        </div>

        <div className="eo2-body">

          <nav className="eo2-nav">
            {NAV.map(item => (
              <button
                key={item.id}
                className={`eo2-nav-item${active === item.id ? " active" : ""}`}
                onClick={() => switchTab(item.id)}
              >
                {item.label}
              </button>
            ))}
            <div className="eo2-nav-divider" />
            <a href="/feeling-engine" className="eo2-nav-feelings" onClick={onClose}>
              The Feelings Engine →
            </a>
          </nav>

          <div className="eo2-right" key={animKey}>

            {/* ── WHO / WHAT: full-height portrait cards ── */}
            {active !== "remarkable" && (
              <div className="eo2-fullheight-wrap">
                <div className="eo2-cards-row">
                  {(active === "who" ? WHO_CARDS : WHAT_CARDS).map((card, i) => (
                    <TripCard key={card.id} card={card} delay={i * 0.06} />
                  ))}
                </div>
              </div>
            )}

            {/* ── REMARKABLE: single unified card row ── */}
            {active === "remarkable" && (
              <div className="eo2-fullheight-wrap">
                <div className="eo2-cards-row">
                  {REM_CARDS.map((card, i) => (
                    <TripCard key={card.id} card={card} delay={i * 0.06} />
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
