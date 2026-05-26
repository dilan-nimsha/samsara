"use client";

import { useRef, useState } from "react";

const JOURNEYS = [
  {
    id: "itw-1",
    type: "Nature",
    title: "Into the Wild",
    duration: "10 Days",
    image: "/images/trip-1.webp",
    description: "Some places don't just take your breath away — they give it back. Crafted for souls most alive in nature's purest form.",
    highlights: ["Yala National Park", "Sinharaja Rainforest", "Knuckles Range", "Dawn wildlife drives"],
  },
  {
    id: "itw-2",
    type: "Adventure",
    title: "Capital, Coastal & Hill",
    duration: "8 Days",
    image: "/images/trip-2.webp",
    description: "From bustling capitals to serene coastlines and misty hills — a journey of contrasts that defines Sri Lanka.",
    highlights: ["Colombo city immersion", "Southern coast", "Hill country estates", "Ella rock climb"],
  },
  {
    id: "itw-3",
    type: "Expedition",
    title: "Lost & Found",
    duration: "12 Days",
    image: "/images/trip-3.webp",
    description: "Venture into the unknown and discover the parts of yourself only travel can reveal.",
    highlights: ["Off-grid villages", "Ancient forest trails", "Local ceremonies", "Remote stays"],
  },
  {
    id: "itw-4",
    type: "Slow Travel",
    title: "See You In the Moment",
    duration: "7 Days",
    image: "/images/trip-4.webp",
    description: "Slow down, breathe in and let each moment unfold without rush or agenda.",
    highlights: ["Coastal sunrises", "Tea estate walks", "Ayurvedic rituals", "Silence & stillness"],
  },
  {
    id: "itw-5",
    type: "Spiritual",
    title: "The Sacred Path",
    duration: "9 Days",
    image: "/images/dest-4.webp",
    description: "Ancient temples, sacred mountains and timeless rituals — a journey inward through the spiritual heart of Sri Lanka.",
    highlights: ["Temple of the Tooth", "Adam's Peak dawn climb", "Meditation retreats", "Puja ceremonies"],
  },
];

const HOTELS_ROW = [
  {
    id: "h1",
    name: "Chena Huts",
    location: "Galle",
    image: "/images/hotels/ugachenahuts.jpg",
    description: "A 17th-century Dutch merchant's townhouse within the World Heritage fort. Stone corridors, canopied beds and a rooftop terrace that catches every coastal breeze.",
  },
  {
    id: "h2",
    name: "98 Acres Resort & Spa",
    location: "Ella",
    image: "/images/hill-country.webp",
    description: "Planter-era bungalows on a working tea estate, with infinity-edge views across the Ella valley. The silence here is a feature, not a side effect.",
  },
  {
    id: "h3",
    name: "Santani Wellness Resort",
    location: "Wawuriya",
    image: "/images/dest-2.webp",
    description: "Sri Lanka's most celebrated Ayurvedic destination — minimalist suites, resident doctors and a wellness philosophy rooted entirely in the forest valley around you.",
  },
];



export default function IntoTheWildPage() {
  const overviewRef = useRef<HTMLDivElement>(null);
  const narrativeRef = useRef<HTMLElement>(null);
  const hotelsRef = useRef<HTMLDivElement>(null);
  const journeyRef = useRef<HTMLElement>(null);
  const [activeJourney, setActiveJourney] = useState<typeof JOURNEYS[0] | null>(null);

  function scrollToJourneys() {
    journeyRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap');

        :root {
          --gold: #C9A84C; --gold-l: #E2C97E; --dark: #080808;
          --cream: #F2EDE4; --cream-d: #a89f92; --white: #fff;
        }
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: var(--dark); color: var(--cream); font-family: 'TT Fors','Inter', sans-serif; font-weight: 300; }

        /* ── HERO VIDEO ── */
        .itw-hero {
          position: relative; height: 100vh; min-height: 600px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          overflow: hidden; text-align: center;
        }
        .itw-hero-video {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; object-position: center;
        }
        .itw-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, #080808 0%, rgba(8,8,8,0.55) 50%, rgba(8,8,8,0.25) 100%);
        }
        .itw-hero-content { position: relative; z-index: 2; padding: 0 2rem; }
        .itw-hero-eyebrow {
          font-size: 0.58rem; letter-spacing: 0.55em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 1.5rem;
          display: flex; align-items: center; justify-content: center; gap: 1rem;
        }
        .itw-hero-eyebrow::before, .itw-hero-eyebrow::after {
          content: ''; width: 40px; height: 1px; background: var(--gold); opacity: 0.6;
        }
        .itw-hero-title {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(3.5rem, 10vw, 8rem);
          color: var(--white); line-height: 0.95;
          text-transform: uppercase; letter-spacing: 0.06em;
          margin-bottom: 1.75rem;
        }
        .itw-hero-tagline {
          font-size: clamp(0.75rem, 1.2vw, 0.95rem);
          color: rgba(255,255,255,0.52); letter-spacing: 0.12em;
          max-width: 440px; margin: 0 auto 3rem; line-height: 1.7;
        }
        .itw-hero-cta {
          display: inline-flex; align-items: center; gap: 0.75rem;
          background: none; border: 1px solid rgba(201,168,76,0.5);
          color: var(--gold); font-family: 'Inter', sans-serif;
          font-size: 0.62rem; letter-spacing: 0.28em; text-transform: uppercase;
          padding: 0.9rem 2.2rem; cursor: pointer;
          transition: all 0.3s;
        }
        .itw-hero-cta:hover { background: rgba(201,168,76,0.08); border-color: var(--gold); }
        .itw-hero-scroll {
          position: absolute; bottom: 2.5rem; left: 50%; transform: translateX(-50%);
          z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
          cursor: pointer;
        }
        .itw-hero-scroll span {
          font-size: 0.52rem; letter-spacing: 0.35em; text-transform: uppercase;
          color: rgba(255,255,255,0.85);
        }
        .itw-scroll-line {
          width: 1px; height: 40px; background: linear-gradient(to bottom, rgba(255,255,255,0.8), transparent);
          animation: itw-line-drop 1.8s ease infinite;
        }
        @keyframes itw-line-drop {
          0%   { transform: scaleY(0); transform-origin: top; opacity: 1; }
          50%  { transform: scaleY(1); transform-origin: top; opacity: 1; }
          100% { transform: scaleY(1); transform-origin: bottom; opacity: 0; }
        }

        /* ── STICKY NAV ── */
        .itw-sticky-nav {
          position: sticky; top: 68px; z-index: 50;
          background: rgba(8,8,8,0.96); backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .itw-sticky-tabs {
          display: flex; align-items: center; justify-content: center;
          gap: 0; max-width: 900px; margin: 0 auto;
        }
        .itw-sticky-tab {
          background: none; border: none; border-bottom: 2px solid transparent;
          padding: 1.2rem 2.5rem; cursor: pointer;
          font-family: 'TT Fors', 'Inter', sans-serif;
          font-size: 0.62rem; letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(255,255,255,0.32); transition: all 0.25s; white-space: nowrap;
        }
        .itw-sticky-tab:hover { color: rgba(255,255,255,0.65); }
        .itw-sticky-tab.active { color: var(--white); border-bottom-color: var(--gold); }

        /* ── OVERVIEW ── */
        .itw-overview {
          max-width: 780px; margin: 0 auto;
          padding: 6rem 3rem 5rem; text-align: center;
        }
        .itw-ov-label {
          font-size: 0.57rem; letter-spacing: 0.42em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 1.5rem; display: block;
        }
        .itw-ov-title {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(1.6rem, 3vw, 2.4rem);
          color: var(--white); text-transform: uppercase;
          letter-spacing: 0.07em; margin-bottom: 2.5rem; line-height: 1.1;
        }
        .itw-ov-divider { width: 40px; height: 1px; background: rgba(201,168,76,0.35); margin: 0 auto 2.5rem; }
        .itw-ov-text {
          font-size: 0.95rem; line-height: 2; color: rgba(255,255,255,0.52);
          margin-bottom: 1.25rem; text-align: center;
        }
        .itw-ov-text:last-of-type { margin-bottom: 3.5rem; }
        .itw-ov-divider2 { width: 1px; height: 50px; background: rgba(255,255,255,0.08); margin: 2rem auto 3.5rem; }
        .itw-ov-meta {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 2rem; padding-top: 3rem;
        }
        .itw-ov-meta-item { display: flex; flex-direction: column; gap: 0.6rem; align-items: center; }
        .itw-ov-meta-label {
          font-size: 0.58rem; letter-spacing: 0.32em; text-transform: uppercase;
          color: var(--gold); font-family: 'Inter', sans-serif;
        }
        .itw-ov-meta-val {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(1rem, 1.5vw, 1.2rem);
          color: var(--white); text-transform: uppercase; letter-spacing: 0.06em;
        }
        .itw-ov-meta-sub {
          font-size: 0.65rem; color: rgba(255,255,255,0.3);
          letter-spacing: 0.08em; font-family: 'Inter', sans-serif;
        }

        /* ── INTRO ── */
        .itw-intro {
          max-width: 1100px; margin: 0 auto;
          padding: 8rem 3rem 7rem;
          display: grid; grid-template-columns: 1fr 1fr; gap: 6rem; align-items: center;
        }
        .itw-intro-quote {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(1.6rem, 3vw, 2.6rem);
          color: var(--white); line-height: 1.2;
          letter-spacing: 0.02em;
        }
        .itw-intro-quote em { font-style: normal; color: var(--gold); }
        .itw-intro-body { display: flex; flex-direction: column; gap: 1.5rem; }
        .itw-intro-text {
          font-size: 0.92rem; line-height: 1.9;
          color: rgba(255,255,255,0.48);
        }
        .itw-stats {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;
          margin-top: 1rem;
        }
        .itw-stat-item { display: flex; flex-direction: column; gap: 0.3rem; }
        .itw-stat-num {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          color: var(--gold); line-height: 1; letter-spacing: 0.04em;
        }
        .itw-stat-label {
          font-size: 0.6rem; letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(255,255,255,0.28);
        }
        .itw-intro-divider { width: 40px; height: 1px; background: rgba(201,168,76,0.35); }

        /* ── SECTION SHELL ── */
        .itw-section {
          padding: 7rem 3rem 7rem;
          max-width: 1280px; margin: 0 auto;
        }
        .itw-section-head {
          text-align: center; margin-bottom: 4rem;
        }
        .itw-eyebrow {
          font-size: 0.57rem; letter-spacing: 0.4em; text-transform: uppercase;
          color: var(--gold); display: block; margin-bottom: 0.8rem;
        }
        .itw-section-title {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(1.8rem, 3.5vw, 3rem);
          color: var(--white); text-transform: uppercase; letter-spacing: 0.06em;
        }
        .itw-section-sub {
          font-size: 0.85rem; color: rgba(255,255,255,0.35);
          max-width: 420px; margin: 1rem auto 0; line-height: 1.75;
        }

        /* ── THE COLLECTION (redesigned) ── */
        .itw-collection-wrap {
          display: flex; min-height: 640px;
          width: 100%;
          border-top: 1px solid rgba(255,255,255,0.04);
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .itw-collection-label {
          width: 340px; flex-shrink: 0;
          display: flex; flex-direction: column; justify-content: center;
          padding: 4rem 2.5rem;
          border-right: 1px solid rgba(255,255,255,0.05);
          overflow: visible;
        }
        .itw-collection-heading {
          font-family: 'TT Fors', sans-serif; font-weight: 500;
          font-size: clamp(2rem, 2.4vw, 2.6rem);
          color: var(--white); text-transform: uppercase;
          letter-spacing: 0.03em; line-height: 1.05;
        }
        .itw-collection-sub {
          font-size: 0.76rem; line-height: 1.8;
          color: rgba(255,255,255,0.32); margin-top: 1.25rem;
        }
        .itw-collection-cards {
          flex: 1; display: flex;
          overflow-x: hidden; overflow-y: hidden;
          scrollbar-width: none; align-items: stretch;
          gap: 2px;
        }
        .itw-collection-cards::-webkit-scrollbar { display: none; }

        .itw-jcard {
          flex: 1 0 220px;
          min-width: 220px;
          position: relative; overflow: hidden; cursor: pointer;
        }
        .itw-jcard-img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.7s ease;
        }
        .itw-jcard:hover .itw-jcard-img { transform: scale(1.06); }
        .itw-jcard-grad {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.1) 55%, transparent 100%);
          transition: background 0.4s;
        }
        .itw-jcard:hover .itw-jcard-grad {
          background: linear-gradient(to top, rgba(8,8,8,0.98) 0%, rgba(8,8,8,0.5) 100%);
        }
        .itw-jcard-badge {
          position: absolute; top: 1.1rem; right: 1.1rem;
          font-size: 0.5rem; letter-spacing: 0.28em; text-transform: uppercase;
          color: rgba(255,255,255,0.6); font-family: 'Inter', sans-serif;
        }
        .itw-jcard-info {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 0 1.5rem 1.75rem;
        }
        .itw-jcard-type {
          font-size: 0.5rem; letter-spacing: 0.32em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 0.5rem; font-family: 'Inter', sans-serif;
        }
        .itw-jcard-title {
          font-family: 'TT Fors', sans-serif; font-weight: 400;
          font-size: clamp(0.9rem, 1.3vw, 1.1rem);
          color: var(--white); text-transform: uppercase;
          letter-spacing: 0.04em; line-height: 1.2; margin-bottom: 1.1rem;
        }
        .itw-jcard-btn {
          display: inline-block;
          font-family: 'Inter', sans-serif; font-size: 0.52rem;
          letter-spacing: 0.22em; text-transform: uppercase;
          border: 1px solid rgba(255,255,255,0.5); color: var(--white);
          padding: 0.62rem 1.2rem; text-decoration: none; background: transparent;
          opacity: 0; transform: translateY(10px);
          transition: opacity 0.3s ease, transform 0.3s ease, background 0.25s;
        }
        .itw-jcard:hover .itw-jcard-btn { opacity: 1; transform: translateY(0); }
        .itw-jcard-btn:hover { background: rgba(255,255,255,0.1); }


        /* ── PURCHASE BUTTON ── */
        .itw-purchase-btn {
          display: inline-flex; align-items: center; gap: 0.65rem;
          font-family: 'Inter', sans-serif; font-size: 0.62rem;
          letter-spacing: 0.28em; text-transform: uppercase;
          background: var(--gold); color: var(--dark);
          border: none; padding: 1rem 2.6rem;
          cursor: pointer; text-decoration: none;
          transition: background 0.3s, transform 0.2s;
          font-weight: 500;
        }
        .itw-purchase-btn:hover { background: var(--gold-l); transform: translateY(-1px); }
        .itw-purchase-wrap {
          display: flex; align-items: center; justify-content: center;
          gap: 1.5rem; margin-top: 2.5rem; flex-wrap: wrap;
        }
        .itw-purchase-note {
          font-size: 0.62rem; letter-spacing: 0.1em;
          color: rgba(255,255,255,0.25); font-family: 'Inter', sans-serif;
        }

        /* ── CTA ── */
        .itw-cta-wrap {
          text-align: center; padding: 8rem 3rem 9rem;
          position: relative; overflow: hidden;
        }
        .itw-cta-wrap::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 70%);
          pointer-events: none;
        }
        .itw-cta-eyebrow {
          font-size: 0.57rem; letter-spacing: 0.4em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 1.25rem; display: block;
        }
        .itw-cta-title {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(2rem, 4.5vw, 3.8rem);
          color: var(--white); text-transform: uppercase;
          letter-spacing: 0.06em; line-height: 1; margin-bottom: 1.25rem;
        }
        .itw-cta-sub {
          font-size: 0.88rem; color: rgba(255,255,255,0.38);
          max-width: 400px; margin: 0 auto 3rem; line-height: 1.75;
        }
        .itw-cta-actions { display: flex; align-items: center; justify-content: center; gap: 1.25rem; flex-wrap: wrap; }
        .itw-cta-btn {
          font-family: 'Inter', sans-serif; font-size: 0.62rem;
          letter-spacing: 0.28em; text-transform: uppercase;
          background: var(--gold); color: var(--dark);
          border: none; padding: 1.1rem 2.8rem; cursor: pointer; transition: background 0.3s;
          text-decoration: none; display: inline-block;
        }
        .itw-cta-btn:hover { background: var(--gold-l); }
        .itw-cta-ghost {
          font-family: 'Inter', sans-serif; font-size: 0.62rem;
          letter-spacing: 0.22em; text-transform: uppercase;
          background: none; border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.55); padding: 1.1rem 2.5rem;
          cursor: pointer; transition: all 0.3s; text-decoration: none; display: inline-block;
        }
        .itw-cta-ghost:hover { border-color: rgba(255,255,255,0.35); color: var(--white); }

        /* ── THE JOURNEY (editorial narrative) ── */
        .itw-jrny {
          max-width: 820px; margin: 0 auto;
          padding: 7rem 3rem 6rem;
        }
        .itw-jrny-header {
          text-align: center; margin-bottom: 5rem;
        }
        .itw-jrny-lead {
          font-size: 0.97rem; line-height: 2; color: rgba(255,255,255,0.45);
          max-width: 620px; margin: 1.75rem auto 0;
        }
        .itw-jrny-phase {
          margin-bottom: 4.5rem;
        }
        .itw-jrny-phase-eyebrow {
          font-size: 0.55rem; letter-spacing: 0.4em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 1rem; display: block;
          font-family: 'Inter', sans-serif;
        }
        .itw-jrny-phase-title {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(1.15rem, 2vw, 1.55rem);
          color: var(--white); letter-spacing: 0.02em;
          line-height: 1.35; margin-bottom: 1.75rem;
          border-left: 2px solid rgba(201,168,76,0.4); padding-left: 1.25rem;
        }
        .itw-jrny-phase-text {
          font-size: 0.93rem; line-height: 2.05;
          color: rgba(255,255,255,0.46); margin-bottom: 1.1rem;
        }
        .itw-jrny-hr {
          width: 40px; height: 1px;
          background: rgba(201,168,76,0.22); margin: 4rem 0;
        }
        .itw-jrny-callout {
          border: 1px solid rgba(201,168,76,0.14);
          background: rgba(201,168,76,0.02);
          padding: 3rem 3.5rem; margin: 4rem 0; text-align: center;
        }
        .itw-jrny-callout-title {
          font-family: 'TT Fors', sans-serif; font-weight: 300;
          font-size: clamp(1rem, 1.8vw, 1.35rem);
          color: var(--white); text-transform: uppercase;
          letter-spacing: 0.08em; margin-bottom: 0.85rem;
        }
        .itw-jrny-callout-text {
          font-size: 0.84rem; color: rgba(255,255,255,0.4);
          line-height: 1.75; max-width: 400px;
          margin: 0 auto 1.85rem;
        }
        .itw-jrny-callout-btn {
          display: inline-block;
          font-family: 'Inter', sans-serif; font-size: 0.6rem;
          letter-spacing: 0.28em; text-transform: uppercase;
          background: none; border: 1px solid rgba(201,168,76,0.45);
          color: var(--gold); padding: 0.85rem 2.1rem;
          cursor: pointer; transition: all 0.3s; text-decoration: none;
        }
        .itw-jrny-callout-btn:hover {
          background: rgba(201,168,76,0.08); border-color: var(--gold);
        }

        /* ── WHERE TO REST ── */
        .itw-hotels-wrap { padding: 7rem 0 7rem; }
        .itw-hotels-header {
          max-width: 1280px; margin: 0 auto;
          padding: 0 3rem 4rem;
        }

        /* horizontal 3-across row — full bleed */
        .itw-hotels-row {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 3px; width: 100%;
        }
        .itw-hotel-col {
          position: relative; overflow: hidden;
          aspect-ratio: 4/3; cursor: pointer;
        }
        .itw-hotel-img-wrap {
          position: absolute; inset: 0;
        }
        .itw-hotel-img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.7s ease;
        }
        .itw-hotel-col:hover .itw-hotel-img { transform: scale(1.07); }

        /* default gradient — name always visible at bottom */
        .itw-hotel-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.25) 50%, transparent 100%);
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: 2rem 1.75rem;
          transition: background 0.45s ease;
        }
        .itw-hotel-col:hover .itw-hotel-overlay {
          background: rgba(8,8,8,0.78);
          justify-content: center;
        }
        .itw-hotel-location {
          font-size: 0.54rem; letter-spacing: 0.35em; text-transform: uppercase;
          color: var(--gold); font-family: 'Inter', sans-serif;
          margin-bottom: 0.45rem;
        }
        .itw-hotel-name {
          font-family: 'TT Fors', sans-serif; font-weight: 400;
          font-size: clamp(1rem, 1.5vw, 1.25rem);
          color: var(--white); text-transform: uppercase;
          letter-spacing: 0.07em; line-height: 1.2;
        }
        /* content revealed on hover */
        .itw-hotel-hover-body {
          overflow: hidden; max-height: 0; opacity: 0;
          transition: max-height 0.45s ease, opacity 0.35s ease 0.05s, margin-top 0.35s ease;
          margin-top: 0;
        }
        .itw-hotel-col:hover .itw-hotel-hover-body {
          max-height: 220px; opacity: 1; margin-top: 1rem;
        }
        .itw-hotel-desc {
          font-size: 0.78rem; line-height: 1.85;
          color: rgba(255,255,255,0.55);
          margin-bottom: 1.1rem;
        }
        .itw-hotel-link {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 0.56rem; letter-spacing: 0.25em; text-transform: uppercase;
          color: var(--gold); text-decoration: none;
          font-family: 'Inter', sans-serif; transition: gap 0.25s;
        }
        .itw-hotel-link:hover { gap: 0.85rem; }

        /* vertical stack — 3 rows, image left + text right */
        .itw-hotels-stack {
          display: flex; flex-direction: column;
          gap: 3px; margin-top: 3px; width: 100%;
        }
        .itw-hotel-row {
          display: grid; grid-template-columns: 480px 1fr;
          min-height: 280px;
          background: rgba(255,255,255,0.018);
          border: 1px solid rgba(255,255,255,0.04);
          transition: border-color 0.3s; overflow: hidden;
        }
        .itw-hotel-row:hover { border-color: rgba(201,168,76,0.2); }
        .itw-hotel-row-img-wrap {
          position: relative; overflow: hidden;
        }
        .itw-hotel-row-img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.65s ease;
        }
        .itw-hotel-row:hover .itw-hotel-row-img { transform: scale(1.04); }
        .itw-hotel-row-body {
          padding: 2.5rem 3rem;
          display: flex; flex-direction: column; justify-content: center; gap: 0.5rem;
        }
        .itw-hotel-row-num {
          font-size: 0.55rem; letter-spacing: 0.35em; text-transform: uppercase;
          color: rgba(255,255,255,0.18); font-family: 'Inter', sans-serif;
          margin-bottom: 0.5rem;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .itw-hotel-row { grid-template-columns: 340px 1fr; }
        }
        @media (max-width: 900px) {
          .itw-collection-wrap { flex-direction: column; min-height: auto; }
          .itw-collection-label { width: 100%; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 3rem 2rem 2rem; white-space: normal; }
          .itw-collection-cards { min-height: 420px; }
          .itw-jcard { width: clamp(180px, 55vw, 240px); }
          .itw-hotels-row { grid-template-columns: 1fr; }
          .itw-hotel-col { aspect-ratio: 16/9; }
          .itw-hotels-wrap { padding: 5rem 0; }
          .itw-hotels-header { padding: 0 2rem 3rem; }
          .itw-jrny { padding: 5rem 2rem 4rem; }
          .itw-jrny-callout { padding: 2.25rem 1.75rem; }
          .itw-intro { grid-template-columns: 1fr; gap: 3rem; padding: 5rem 2rem 4rem; }
.itw-section { padding: 5rem 2rem; }
        }
        @media (max-width: 580px) {
          .itw-cta-wrap { padding: 5rem 1.5rem 6rem; }
          .itw-stats { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {/* ── HERO VIDEO ── */}
      <section className="itw-hero">
        <video
          className="itw-hero-video"
          autoPlay muted loop playsInline
          poster="/images/trip-4.webp"
        >
          <source src="/videos/seeYouIntheMoment.mp4" type="video/mp4" />
        </video>
        <div className="itw-hero-overlay" />
        <div className="itw-hero-content">
          <h1 className="itw-hero-title">
            <span style={{ fontWeight: 100 }}>See You</span><br />
            <span style={{ fontWeight: 500 }}>In the Moment</span>
          </h1>
        </div>
        <div className="itw-hero-scroll" onClick={scrollToJourneys}>
          <div className="itw-scroll-line" />
          <span>Scroll</span>
        </div>
      </section>

      {/* ── STICKY NAV ── */}
      <div className="itw-sticky-nav">
        <div className="itw-sticky-tabs">
          {["Overview", "The Journey", "Hotels", "The Collection", "Enquire"].map((tab, i) => (
            <button key={tab} className={`itw-sticky-tab${i === 0 ? " active" : ""}`}
              onClick={() => {
                if (i === 0) overviewRef.current?.scrollIntoView({ behavior: "smooth" });
                else if (i === 1) narrativeRef.current?.scrollIntoView({ behavior: "smooth" });
                else if (i === 2) hotelsRef.current?.scrollIntoView({ behavior: "smooth" });
                else if (i === 3) journeyRef.current?.scrollIntoView({ behavior: "smooth" });
                else window.location.href = "/feeling-engine";
              }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW ── */}
      <div ref={overviewRef} className="itw-overview">
        <div className="itw-ov-meta">
          <div className="itw-ov-meta-item">
            <span className="itw-ov-meta-label">When</span>
            <span className="itw-ov-meta-val">Year-Round</span>
            <span className="itw-ov-meta-sub">Best Oct – Apr</span>
          </div>
          <div className="itw-ov-meta-item">
            <span className="itw-ov-meta-label">Duration</span>
            <span className="itw-ov-meta-val">7 Days</span>
            <span className="itw-ov-meta-sub">Ideal length</span>
          </div>
          <div className="itw-ov-meta-item">
            <span className="itw-ov-meta-label">Price</span>
            <span className="itw-ov-meta-val">From $3,200</span>
            <span className="itw-ov-meta-sub">Per person</span>
          </div>
        </div>
        <div className="itw-ov-divider2" />
        <h2 className="itw-ov-title">See You In the Moment</h2>
        <p className="itw-ov-text">
          There are journeys that rush you from wonder to wonder, filling every hour as though stillness were something to be afraid of. And then there are journeys like this one — where the point is not the destination, but the quiet miracle of paying attention.
        </p>
        <p className="itw-ov-text">
          Seven days threaded through Sri Lanka's southern coast and misty highlands. Mornings that ask nothing of you. Afternoons where time moves differently. Each moment chosen not for its spectacle, but for what it teaches you about being here — fully, unhurriedly, alive.
        </p>
        <div className="itw-purchase-wrap">
          <a href="/checkout?id=itw-4&title=See+You+In+the+Moment&price=3200&duration=7+Days" className="itw-purchase-btn">Purchase This Journey</a>
        </div>
      </div>


      {/* ── THE JOURNEY (narrative) ── */}
      <section ref={narrativeRef} style={{ background: "rgba(255,255,255,0.012)", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="itw-jrny">

          <div className="itw-jrny-header">
            <span className="itw-eyebrow">The Journey</span>
            <h2 className="itw-section-title">Seven Days. No Rush.</h2>
            <p className="itw-jrny-lead">
              Welcome to Sri Lanka's unhurried south — where time moves to the rhythm of the ocean and meals stretch long into the evening. Seven days crafted not around sights to tick off, but around feelings worth returning to. From ancient fort towns and mist-draped tea estates to Ayurvedic healing rituals and a sacred rock kingdom above the jungle, this is what slow travel actually looks and feels like.
            </p>
          </div>

          {/* Phase 1 */}
          <div className="itw-jrny-phase">
            <span className="itw-jrny-phase-eyebrow">Days 1 – 2 · Galle</span>
            <h3 className="itw-jrny-phase-title">Ancient walls and ocean light — arriving on the southern shore</h3>
            <p className="itw-jrny-phase-text">
              Your journey begins with a private transfer south from Colombo along the coast road, the Indian Ocean appearing and disappearing between coconut palms as you descend into the tropics. Your base for the first two nights is a restored colonial villa within the walls of Galle Fort — salt-washed stone, ceiling fans turning slowly overhead, a courtyard where frangipani drops its petals by morning.
            </p>
            <p className="itw-jrny-phase-text">
              The fort is best experienced on foot, at dawn, before the heat settles in. Your expert guide leads a private walk through cobbled lanes past 17th-century Dutch buildings, the lighthouse perched at the rampart's edge and a centuries-old mosque tucked between boutiques and spice merchants. Afternoons are left deliberately open — a swim off Jungle Beach, a tuk-tuk ride to a hidden cinnamon farm a few kilometres inland, or simply a long lunch watching sailing boats cross the harbour. Come evening, dinner is arranged at one of the fort's most intimate tables — Sri Lankan flavour in its truest form: coconut-tempered, darkly spiced, made entirely from what the morning market offered.
            </p>
          </div>

          <div className="itw-jrny-hr" />

          {/* Callout */}
          <div className="itw-jrny-callout">
            <h3 className="itw-jrny-callout-title">Make This Journey Yours</h3>
            <p className="itw-jrny-callout-text">
              Each and every Samsara trip is tailored exactly to who you are and what you need. Tell us about yourself and we'll create something that's entirely your own.
            </p>
            <a href="/feeling-engine" className="itw-jrny-callout-btn">Enquire Now →</a>
          </div>

          <div className="itw-jrny-hr" />

          {/* Phase 2 */}
          <div className="itw-jrny-phase">
            <span className="itw-jrny-phase-eyebrow">Days 3 – 4 · Ella & the Uva Highlands</span>
            <h3 className="itw-jrny-phase-title">Mist, silence and a single cup of tea — into the highlands</h3>
            <p className="itw-jrny-phase-text">
              After a slow morning checkout, a private vehicle begins its winding ascent from the coast into a completely different Sri Lanka. The road climbs through rubber plantations and paddy terraces before emerging into the cool, mist-draped tea country surrounding Ella. The temperature drops. The air changes. Your home for two nights is a boutique estate bungalow — a former British planter's residence where the veranda looks out over rolling rows of tea and, on clear days, all the way to the distant ocean.
            </p>
            <p className="itw-jrny-phase-text">
              Your days here follow the rhythm of the land rather than a schedule. A morning walk across the estate with the estate manager traces the full arc of tea — from leaf to cup, root to sip, in one seamless living ritual. A private hiking trail leads above the village to the Ella Rock viewpoint, where the island spreads beneath you in a single, breath-catching panorama. Evenings are generous — a fire lit in the sitting room, a pot of single-estate tea steeping on the side table, the sound of rain beginning again on the roof.
            </p>
          </div>

          <div className="itw-jrny-hr" />

          {/* Phase 3 */}
          <div className="itw-jrny-phase">
            <span className="itw-jrny-phase-eyebrow">Day 5 · Ayurvedic Retreat</span>
            <h3 className="itw-jrny-phase-title">The healing pause — your body already knows what it needs</h3>
            <p className="itw-jrny-phase-text">
              On the fifth morning, the pace slows to almost nothing. You travel down from the highlands to a dedicated Ayurvedic retreat on the edge of a private forest reserve, where the philosophy is simple: your body already knows what it needs — it only requires the quiet to listen. A consultation with the resident doctor shapes a programme built entirely around you — traditional herbal steam baths, synchronised four-hand oil treatments and slow-movement sessions guided by a practitioner who has spent decades in the discipline. Meals are prepared according to Ayurvedic principles: light, herbal and deeply restorative. There are no alarm clocks here.
            </p>
          </div>

          <div className="itw-jrny-hr" />

          {/* Phase 4 */}
          <div className="itw-jrny-phase">
            <span className="itw-jrny-phase-eyebrow">Days 6 – 7 · Sigiriya & the Cultural Triangle</span>
            <h3 className="itw-jrny-phase-title">Sacred stone and ancient light — the kingdom above the jungle</h3>
            <p className="itw-jrny-phase-text">
              The final stretch carries you northward into the cultural triangle — to ancient Sigiriya, where a fifth-century rock fortress rises two hundred metres from the surrounding jungle floor. Your private guide navigates the climb before the first tourist buses arrive, pausing at frescoes painted onto sheer rock faces, at the mirror wall where courtiers scratched poems in the 8th century, and at sky gardens that once held the king's private paradise. Below, the jungle stretches to every horizon without interruption.
            </p>
            <p className="itw-jrny-phase-text">
              A visit to the cave temples at Dambulla follows in the afternoon — walls covered floor to ceiling with 150 gilded Buddha figures, the silence broken only by the distant chanting of monks. Your final night is spent at a beachfront property north of Colombo — a proper send-off. Dinner on the sand, the Arabian Sea going dark at the edges, the stars arriving one by one. By morning, a private transfer will carry you to the airport. You will leave having been somewhere that changed the pace of everything.
            </p>
          </div>

        </div>
      </section>

      {/* ── WHERE TO REST ── */}
      <div ref={hotelsRef} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="itw-hotels-wrap">
          <div className="itw-hotels-header">
            <h2 className="itw-section-title" style={{ textAlign: "center" }}>Where to Rest Your Head</h2>
          </div>

          {/* 3 horizontal cards — full width */}
          <div className="itw-hotels-row">
            {HOTELS_ROW.map(h => (
              <div key={h.id} className="itw-hotel-col">
                <div className="itw-hotel-img-wrap">
                  <img
                    className="itw-hotel-img"
                    src={h.image}
                    alt={h.name}
                    onError={e => { (e.currentTarget as HTMLImageElement).src = "/images/dest-1.webp"; }}
                  />
                </div>
                <div className="itw-hotel-overlay">
                  <span className="itw-hotel-location">{h.location}</span>
                  <h3 className="itw-hotel-name">{h.name}</h3>
                  <div className="itw-hotel-hover-body">
                    <p className="itw-hotel-desc">{h.description}</p>
                    <a href="/feeling-engine" className="itw-hotel-link">View Hotel →</a>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── THE COLLECTION ── */}
      <section ref={journeyRef}>
        <div className="itw-collection-wrap">

          <div className="itw-collection-label">
            <h2 className="itw-collection-heading">The<br />Collection</h2>
          </div>

          <div className="itw-collection-cards">
            {JOURNEYS.map(j => (
              <div key={j.id} className="itw-jcard">
                <img
                  className="itw-jcard-img"
                  src={j.image}
                  alt={j.title}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = "/images/dest-1.webp"; }}
                />
                <div className="itw-jcard-grad" />
                <span className="itw-jcard-badge">{j.duration}</span>
                <div className="itw-jcard-info">
                  <p className="itw-jcard-type">{j.type}</p>
                  <h3 className="itw-jcard-title">{j.title}</h3>
                  <a href="/experiences" className="itw-jcard-btn">Explore Trip</a>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

{/* ── CTA ── */}
      <div className="itw-cta-wrap">
        <span className="itw-cta-eyebrow">Begin Your Journey</span>
        <h2 className="itw-cta-title">
          The Wild<br />Is Waiting
        </h2>
        <p className="itw-cta-sub">
          Tell us how you want to feel and we'll craft your Into the Wild journey from the ground up.
        </p>
        <div className="itw-cta-actions">
          <a href="/checkout?id=itw-4&title=See+You+In+the+Moment&price=3200&duration=7+Days" className="itw-purchase-btn">Purchase This Journey</a>
          <a href="/feeling-engine" className="itw-cta-btn">Start with the Feelings Engine</a>
          <a href="/#about" className="itw-cta-ghost">Learn About Samsara</a>
        </div>
      </div>
    </>
  );
}
