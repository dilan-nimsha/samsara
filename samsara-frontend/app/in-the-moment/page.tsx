"use client";

import { useState, useRef, useEffect } from "react";

const DAYS = [
  {
    day: "01",
    title: "Arrival & Stillness",
    location: "Colombo → Southern Coast",
    body: "Your journey begins with intention. A private transfer carries you south as the city gradually gives way to palms and coastline. Check in, leave your bags, and do nothing. That is the instruction for day one.",
    image: "/images/theSouth_1.webp",
  },
  {
    day: "02",
    title: "The Morning Shore",
    location: "Southern Coast",
    body: "Before the world wakes, walk to the water's edge. The Indian Ocean at dawn asks nothing of you. A private breakfast on the sand follows — unhurried, unforgettable.",
    image: "/images/galle-beach-scaled.webp",
  },
  {
    day: "03",
    title: "Into Galle",
    location: "Galle Fort",
    body: "The ancient Dutch fort at your own pace. No guide, no schedule — just a hand-drawn map and the freedom to wander cobblestone lanes, step into courtyards and pause at the rampart wall as the sea stretches below.",
    image: "/images/galle-trip-2.webp",
  },
  {
    day: "04",
    title: "Ayurveda & Rest",
    location: "Southern Coast",
    body: "A full day set aside for restoration. A two-hour Ayurvedic treatment tailored to your constitution, followed by afternoon silence. No agenda. The body knows what it needs.",
    image: "/images/galle-trip-1.webp",
  },
  {
    day: "05",
    title: "The Green Interior",
    location: "Hill Country",
    body: "A private drive into the highlands takes you through mist and tea estates. The air changes. The pace slows further. A sunset walk through the plantation as the last light catches the leaves.",
    image: "/images/hill-country.webp",
  },
  {
    day: "06",
    title: "Tea, Silence & Sky",
    location: "Ella",
    body: "Rise early. Walk the ridge above the valley while the world below is still in cloud. Spend the afternoon reading, journaling or simply watching the light shift across the mountains.",
    image: "/images/dest-1.webp",
  },
  {
    day: "07",
    title: "The Last Morning",
    location: "Return",
    body: "Every moment journey ends the same way — with the quiet certainty that something has changed. Your final morning is yours entirely. Depart when you're ready.",
    image: "/images/about.webp",
  },
];

const PILLARS = [
  { title: "Coastal Mornings",   body: "The southern shoreline at first light — private beaches, warm water, and the kind of silence that resets something deep.",    image: "/images/galle-beach-scaled.webp" },
  { title: "Tea Country",        body: "Misty highlands, emerald rows, and the meditative rhythm of walking through estates untouched by time.",                     image: "/images/hill-country.webp"       },
  { title: "Ayurveda",           body: "Personalised treatments rooted in 3,000 years of Sri Lankan tradition. Restoration, not indulgence.",                       image: "/images/galle-trip-1.webp"       },
  { title: "Stillness",          body: "The most radical act of travel: nothing. Space built into every day to simply be where you are.",                           image: "/images/theSouth_1.webp"         },
];

function FadeSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.8s ease, transform 0.8s ease" }}>
      {children}
    </div>
  );
}

export default function InTheMomentPage() {
  const [activeDay, setActiveDay] = useState(0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap');

        :root {
          --gold: #C9A84C; --gold-l: #E2C97E;
          --dark: #080808; --dark2: #0d0d0d;
          --cream: #F2EDE4; --cream-d: #a89f92;
          --white: #ffffff;
        }
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: var(--dark); color: var(--cream); font-family: 'TT Fors','Inter',sans-serif; font-weight: 300; }

        /* ── HERO ── */
        .itm-hero {
          position: relative; height: 100vh; min-height: 600px;
          display: flex; align-items: flex-end; justify-content: flex-start;
          overflow: hidden;
        }
        .itm-hero-img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; object-position: center 40%;
        }
        .itm-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(105deg, rgba(8,8,8,0.82) 0%, rgba(8,8,8,0.3) 55%, rgba(8,8,8,0.15) 100%);
        }
        .itm-hero-content {
          position: relative; z-index: 2;
          padding: 0 5rem 6rem;
          max-width: 700px;
        }
        .itm-hero-eyebrow {
          font-size: 0.57rem; letter-spacing: 0.5em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 1.5rem; display: block;
        }
        .itm-hero-title {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(2.8rem, 7vw, 6.5rem);
          color: var(--white); line-height: 1;
          text-transform: uppercase; letter-spacing: 0.04em;
          margin-bottom: 2rem;
        }
        .itm-hero-meta {
          display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;
        }
        .itm-hero-tag {
          font-size: 0.58rem; letter-spacing: 0.3em; text-transform: uppercase;
          color: rgba(255,255,255,0.38); display: flex; align-items: center; gap: 0.6rem;
        }
        .itm-hero-tag::before { content: ''; width: 20px; height: 1px; background: rgba(201,168,76,0.5); }

        /* ── OPENING STATEMENT ── */
        .itm-opening {
          padding: 9rem 5rem;
          max-width: 1000px; margin: 0 auto;
          text-align: center;
        }
        .itm-opening-pre {
          font-size: 0.57rem; letter-spacing: 0.42em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 2rem; display: block;
        }
        .itm-opening-text {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(1.5rem, 3.5vw, 2.8rem);
          color: var(--white); line-height: 1.3; letter-spacing: 0.02em;
        }
        .itm-opening-text em { font-style: normal; color: var(--gold); }
        .itm-opening-sub {
          font-size: 0.88rem; line-height: 1.9;
          color: rgba(255,255,255,0.38); max-width: 500px;
          margin: 2.5rem auto 0;
        }
        .itm-opening-line {
          width: 1px; height: 60px;
          background: linear-gradient(to bottom, transparent, rgba(201,168,76,0.4), transparent);
          margin: 3rem auto 0;
        }

        /* ── PILLARS ── */
        .itm-pillars {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(255,255,255,0.04);
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .itm-pillar {
          position: relative; overflow: hidden;
          height: clamp(300px, 42vh, 480px);
          cursor: pointer;
        }
        .itm-pillar-img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.8s ease; filter: brightness(0.45) saturate(0.7);
        }
        .itm-pillar:hover .itm-pillar-img { transform: scale(1.07); filter: brightness(0.6) saturate(0.85); }
        .itm-pillar-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.2) 60%);
        }
        .itm-pillar-content {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 2rem 1.75rem;
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        .itm-pillar:last-child .itm-pillar-content { border-right: none; }
        .itm-pillar-num {
          font-size: 0.52rem; letter-spacing: 0.3em; color: var(--gold);
          font-family: 'Inter', sans-serif; margin-bottom: 0.7rem; display: block;
        }
        .itm-pillar-title {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(0.95rem, 1.4vw, 1.2rem);
          color: var(--white); text-transform: uppercase;
          letter-spacing: 0.07em; line-height: 1.2; margin-bottom: 0.6rem;
        }
        .itm-pillar-body {
          font-size: 0.72rem; line-height: 1.7;
          color: rgba(255,255,255,0.0);
          max-height: 0; overflow: hidden;
          transition: max-height 0.45s ease, color 0.4s ease;
        }
        .itm-pillar:hover .itm-pillar-body { max-height: 80px; color: rgba(255,255,255,0.52); }

        /* ── JOURNEY DAYS ── */
        .itm-days-section {
          max-width: 1200px; margin: 0 auto;
          padding: 8rem 3rem;
          display: grid; grid-template-columns: 320px 1fr; gap: 6rem;
          align-items: start;
        }
        .itm-days-sticky {
          position: sticky; top: 120px;
        }
        .itm-days-label {
          font-size: 0.57rem; letter-spacing: 0.42em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 1.75rem; display: block;
        }
        .itm-days-title {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(1.6rem, 2.5vw, 2.2rem);
          color: var(--white); text-transform: uppercase;
          letter-spacing: 0.06em; line-height: 1.1; margin-bottom: 1rem;
        }
        .itm-days-sub {
          font-size: 0.78rem; line-height: 1.8;
          color: rgba(255,255,255,0.35); margin-bottom: 2rem;
        }
        .itm-day-tabs {
          display: flex; flex-direction: column; gap: 0;
        }
        .itm-day-tab {
          background: none; border: none; cursor: pointer;
          text-align: left; padding: 0.85rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          display: flex; align-items: center; gap: 1rem;
          transition: all 0.25s;
        }
        .itm-day-tab-num {
          font-size: 0.55rem; letter-spacing: 0.2em; color: rgba(255,255,255,0.2);
          font-family: 'Inter', sans-serif; transition: color 0.25s; flex-shrink: 0;
        }
        .itm-day-tab-name {
          font-size: 0.78rem; letter-spacing: 0.06em; text-transform: uppercase;
          color: rgba(255,255,255,0.3); transition: color 0.25s;
          font-family: 'TT Fors', sans-serif; font-weight: 300;
        }
        .itm-day-tab.active .itm-day-tab-num { color: var(--gold); }
        .itm-day-tab.active .itm-day-tab-name { color: var(--white); }
        .itm-day-tab:hover .itm-day-tab-name { color: rgba(255,255,255,0.65); }

        .itm-days-panel { display: flex; flex-direction: column; gap: 0; }
        .itm-day-panel {
          display: flex; flex-direction: column; gap: 2rem;
          padding: 2.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: opacity 0.4s; opacity: 1;
        }
        .itm-day-panel-img {
          width: 100%; height: clamp(220px, 38vh, 380px);
          object-fit: cover; display: block;
        }
        .itm-day-panel-day {
          font-size: 0.55rem; letter-spacing: 0.35em; text-transform: uppercase;
          color: var(--gold); font-family: 'Inter', sans-serif; margin-bottom: 0.4rem;
        }
        .itm-day-panel-loc {
          font-size: 0.62rem; letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(255,255,255,0.28); font-family: 'Inter', sans-serif; margin-bottom: 0.65rem;
        }
        .itm-day-panel-title {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(1.2rem, 2vw, 1.75rem);
          color: var(--white); text-transform: uppercase;
          letter-spacing: 0.06em; margin-bottom: 1rem;
        }
        .itm-day-panel-body {
          font-size: 0.9rem; line-height: 1.9;
          color: rgba(255,255,255,0.52);
        }

        /* ── FULL-BLEED IMAGE ── */
        .itm-fullbleed {
          position: relative; height: clamp(380px, 55vh, 600px); overflow: hidden;
        }
        .itm-fullbleed-img {
          width: 100%; height: 100%; object-fit: cover;
          object-position: center 55%;
          filter: brightness(0.55) saturate(0.8);
        }
        .itm-fullbleed-text {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; padding: 2rem;
        }
        .itm-fullbleed-quote {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(1.4rem, 3vw, 2.6rem);
          color: var(--white); letter-spacing: 0.03em; line-height: 1.25;
          max-width: 620px;
        }
        .itm-fullbleed-attr {
          font-size: 0.58rem; letter-spacing: 0.3em; text-transform: uppercase;
          color: var(--gold); margin-top: 1.5rem; font-family: 'Inter', sans-serif;
        }

        /* ── CTA ── */
        .itm-cta {
          padding: 9rem 3rem 10rem;
          text-align: center; position: relative; overflow: hidden;
        }
        .itm-cta::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 60%, rgba(201,168,76,0.04) 0%, transparent 65%);
          pointer-events: none;
        }
        .itm-cta-eyebrow {
          font-size: 0.57rem; letter-spacing: 0.42em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 1.25rem; display: block;
        }
        .itm-cta-title {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(2rem, 5vw, 4rem);
          color: var(--white); text-transform: uppercase;
          letter-spacing: 0.06em; line-height: 1; margin-bottom: 1.25rem;
        }
        .itm-cta-sub {
          font-size: 0.88rem; color: rgba(255,255,255,0.35);
          max-width: 380px; margin: 0 auto 3rem; line-height: 1.8;
        }
        .itm-cta-row { display: flex; align-items: center; justify-content: center; gap: 1.25rem; flex-wrap: wrap; }
        .itm-btn-gold {
          font-family: 'Inter', sans-serif; font-size: 0.62rem;
          letter-spacing: 0.28em; text-transform: uppercase;
          background: var(--gold); color: var(--dark);
          border: none; padding: 1.1rem 2.8rem; cursor: pointer;
          transition: background 0.3s; text-decoration: none; display: inline-block;
        }
        .itm-btn-gold:hover { background: var(--gold-l); }
        .itm-btn-ghost {
          font-family: 'Inter', sans-serif; font-size: 0.62rem;
          letter-spacing: 0.22em; text-transform: uppercase;
          background: none; border: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.5); padding: 1.1rem 2.5rem;
          cursor: pointer; transition: all 0.3s;
          text-decoration: none; display: inline-block;
        }
        .itm-btn-ghost:hover { border-color: rgba(255,255,255,0.32); color: var(--white); }

        /* ── RESPONSIVE ── */
        @media(max-width:900px) {
          .itm-hero-content { padding: 0 2.5rem 4.5rem; }
          .itm-opening { padding: 6rem 2rem; }
          .itm-pillars { grid-template-columns: repeat(2, 1fr); }
          .itm-pillar:nth-child(2) .itm-pillar-content { border-right: none; }
          .itm-pillar:nth-child(3) .itm-pillar-content { border-right: 1px solid rgba(255,255,255,0.05); }
          .itm-days-section { grid-template-columns: 1fr; gap: 2.5rem; padding: 5rem 2rem; }
          .itm-days-sticky { position: static; }
        }
        @media(max-width:580px) {
          .itm-hero-content { padding: 0 1.5rem 3.5rem; }
          .itm-pillars { grid-template-columns: 1fr; }
          .itm-pillar { height: 260px; }
          .itm-pillar-content { border-right: none !important; }
          .itm-opening { padding: 4rem 1.5rem; }
          .itm-cta { padding: 5rem 1.5rem 6rem; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section className="itm-hero">
        <img
          className="itm-hero-img"
          src="/images/trip-4.webp"
          alt="See You In the Moment"
          onError={e => { (e.currentTarget as HTMLImageElement).src = "/images/dest-1.webp"; }}
        />
        <div className="itm-hero-overlay" />
        <div className="itm-hero-content">
          <span className="itm-hero-eyebrow">A Samsara Journey · Slow Travel</span>
          <h1 className="itm-hero-title">
            See You<br />In the<br />Moment
          </h1>
          <div className="itm-hero-meta">
            <span className="itm-hero-tag">7 Days</span>
            <span className="itm-hero-tag">Sri Lanka</span>
            <span className="itm-hero-tag">Private</span>
          </div>
        </div>
      </section>

      {/* ── OPENING ── */}
      <FadeSection>
        <div className="itm-opening">
          <span className="itm-opening-pre">The Premise</span>
          <p className="itm-opening-text">
            This is not a journey to a destination.<br />
            It is a journey <em>to yourself.</em>
          </p>
          <p className="itm-opening-sub">
            Seven days designed with intention and space. No checkboxes. No race to the next sight. Only the quiet accumulation of moments you'll remember for the rest of your life.
          </p>
          <div className="itm-opening-line" />
        </div>
      </FadeSection>

      {/* ── PILLARS (4 image columns) ── */}
      <div className="itm-pillars">
        {PILLARS.map((p, i) => (
          <div key={p.title} className="itm-pillar">
            <img
              className="itm-pillar-img"
              src={p.image}
              alt={p.title}
              onError={e => { (e.currentTarget as HTMLImageElement).src = "/images/dest-1.webp"; }}
            />
            <div className="itm-pillar-overlay" />
            <div className="itm-pillar-content">
              <span className="itm-pillar-num">0{i + 1}</span>
              <h3 className="itm-pillar-title">{p.title}</h3>
              <p className="itm-pillar-body">{p.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 7 DAYS ── */}
      <div className="itm-days-section">
        <div className="itm-days-sticky">
          <FadeSection>
            <span className="itm-days-label">The Journey</span>
            <h2 className="itm-days-title">Seven Days,<br />Your Pace</h2>
            <p className="itm-days-sub">
              A loose structure that holds space for spontaneity. Each day is a suggestion, not a schedule.
            </p>
            <div className="itm-day-tabs">
              {DAYS.map((d, i) => (
                <button
                  key={d.day}
                  className={`itm-day-tab${activeDay === i ? " active" : ""}`}
                  onClick={() => setActiveDay(i)}
                >
                  <span className="itm-day-tab-num">Day {d.day}</span>
                  <span className="itm-day-tab-name">{d.title}</span>
                </button>
              ))}
            </div>
          </FadeSection>
        </div>

        <div className="itm-days-panel">
          <FadeSection key={activeDay} className="itm-day-panel">
            <img
              className="itm-day-panel-img"
              src={DAYS[activeDay].image}
              alt={DAYS[activeDay].title}
              onError={e => { (e.currentTarget as HTMLImageElement).src = "/images/dest-1.webp"; }}
            />
            <div>
              <p className="itm-day-panel-day">Day {DAYS[activeDay].day}</p>
              <p className="itm-day-panel-loc">◎ {DAYS[activeDay].location}</p>
              <h3 className="itm-day-panel-title">{DAYS[activeDay].title}</h3>
              <p className="itm-day-panel-body">{DAYS[activeDay].body}</p>
            </div>
          </FadeSection>
        </div>
      </div>

      {/* ── FULL-BLEED QUOTE ── */}
      <FadeSection>
        <div className="itm-fullbleed">
          <img
            className="itm-fullbleed-img"
            src="/images/galle-beach-scaled.webp"
            alt="The moment"
            onError={e => { (e.currentTarget as HTMLImageElement).src = "/images/dest-1.webp"; }}
          />
          <div className="itm-fullbleed-text">
            <p className="itm-fullbleed-quote">
              "Slow down, breathe in and let each moment unfold without rush or agenda."
            </p>
            <span className="itm-fullbleed-attr">See You In the Moment · 7 Days</span>
          </div>
        </div>
      </FadeSection>

      {/* ── CTA ── */}
      <FadeSection>
        <div className="itm-cta">
          <span className="itm-cta-eyebrow">Begin Your Journey</span>
          <h2 className="itm-cta-title">
            The Moment<br />Is Now
          </h2>
          <p className="itm-cta-sub">
            Tell us how you want to feel and we'll shape every detail of your seven days around that.
          </p>
          <div className="itm-cta-row">
            <a href="/feeling-engine" className="itm-btn-gold">Start with the Feelings Engine</a>
            <a href="/experiences" className="itm-btn-ghost">Explore All Journeys</a>
          </div>
        </div>
      </FadeSection>
    </>
  );
}
