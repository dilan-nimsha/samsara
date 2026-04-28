"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { getDestination } from "../data";

const NAV_SECTIONS = [
  { id: "overview",    label: "Overview" },
  { id: "itineraries", label: "Itineraries" },
  { id: "see-do",      label: "See & Do" },
  { id: "hotels",      label: "Hotels" },
];

export default function DestinationPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const dest = getDestination(slug);
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState("overview");
  const [videoPlaying, setVideoPlaying] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      const offsets = NAV_SECTIONS.map(({ id }) => {
        const el = document.getElementById(id);
        return { id, top: el ? el.getBoundingClientRect().top : Infinity };
      });
      const current = offsets.filter((o) => o.top <= 120).pop();
      if (current) setActiveSection(current.id);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
    if (scrollRef.current) scrollRef.current.style.cursor = "grabbing";
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current.offsetLeft || 0);
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };
  const onMouseUp = () => {
    isDragging.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  };

  if (!dest) {
    return (
      <div style={{ background: "#080808", color: "#fff", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "serif", fontSize: "2rem" }}>
        Destination not found.
      </div>
    );
  }

  const trips = [
    { nights: "7 Nights", title: `${dest.name}: A Weekend Escape`, image: "/images/galle-trip-1.webp", desc: `A perfect introduction to ${dest.name} — sun-drenched coastlines, colonial charm, and evenings that linger long after the sun sets.` },
    { nights: "10 Nights", title: `${dest.name}: The Deep Dive`, image: "/images/galle-trip-2.webp", desc: `Go beyond the surface. This journey uncovers the hidden layers of ${dest.name} — its stories, its flavours, and its quieter corners.` },
    { nights: "8 Nights", title: `A Journey into ${dest.name}`, image: "/images/galle-trip-3.webp", desc: `A thoughtfully curated route through ${dest.name}'s most iconic and unexpected moments, crafted for the curious traveller.` },
    { nights: "12 Nights", title: `${dest.name}: A Spiritual Adventure`, image: "/images/galle-trip-4.webp", desc: `Temples, silence, and sacred landscapes. A journey that slows you down and reconnects you with something deeper.` },
    { nights: "Custom", title: `Create Your Own ${dest.name} Journey`, image: "/images/galle-trip-5.webp", desc: `No two travellers are alike. Tell us what moves you and we'll craft a ${dest.name} journey that is entirely, uniquely yours.` },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap');

        :root {
          --gold: #C9A84C;
          --gold-light: #E2C97E;
          --gold-dim: #6b5520;
          --dark: #080808;
          --dark-2: #0f0f0f;
          --cream: #F2EDE4;
          --cream-dim: #a89f92;
          --white: #ffffff;
        }

        @font-face {
          font-family: 'Pawana';
          src: url('/fonts/PWN-Pawana.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          background: var(--dark);
          color: var(--cream);
          font-family: 'Inter', sans-serif;
          font-weight: 300;
          overflow-x: hidden;
        }

        /* NAVBAR */
        /* HERO */
        .hero {
          position: relative; height: 100vh; min-height: 600px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: flex-end; overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          transform: translateY(calc(var(--scroll, 0px) * 0.3));
          will-change: transform;
        }
        .hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.3) 50%, rgba(8,8,8,0.2) 100%);
        }
        .hero-content {
          position: relative; z-index: 2;
          padding: 0 5rem 6rem; width: 100%;
          animation: fadeUp 1.2s ease both;
          display: flex; flex-direction: column; align-items: center; text-align: center;
        }
        .hero-country {
          font-size: var(--text-xs); letter-spacing: 0.4em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem;
        }
        .hero-country::before,
        .hero-country::after {
          content: ''; display: inline-block; width: 30px; height: 1px; background: var(--gold);
        }
        .hero-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(3rem, 7vw, 5.5rem);
          font-weight: 300; line-height: 1; color: var(--white); margin-bottom: 0.8rem;
        }
        .hero-sinhala {
          font-family: 'Pawana', sans-serif;
          font-size: clamp(1.2rem, 2.5vw, 2rem);
          color: #D4AA00; letter-spacing: 0.2em; margin-bottom: 1rem;
        }
        .hero-tagline {
          font-size: var(--text-base); letter-spacing: 0.1em;
          color: var(--cream-dim); max-width: 400px;
        }

        /* BREADCRUMB */
        .breadcrumb {
          padding: 1.2rem 5rem;
          display: flex; align-items: center; gap: 0.75rem;
          font-size: var(--text-xs); letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--cream-dim);
          border-bottom: 1px solid rgba(201,168,76,0.08);
        }
        .breadcrumb a { color: var(--cream-dim); text-decoration: none; transition: color 0.3s; }
        .breadcrumb a:hover { color: var(--gold); }
        .breadcrumb-sep { color: var(--gold-dim); }
        .breadcrumb-current { color: var(--gold); }

        /* SECTION NAV */
        .section-nav {
          position: sticky; top: 0; z-index: 150;
          background: var(--dark);
          border-bottom: 1px solid rgba(201,168,76,0.12);
        }
        .section-nav-inner {
          display: flex; align-items: center; justify-content: center;
          padding: 0 5rem;
        }
        .section-nav-link {
          font-family: 'Inter', sans-serif;
          font-size: var(--text-sm); letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--cream-dim); text-decoration: none;
          padding: 1.2rem 2rem; position: relative;
          cursor: pointer; transition: color 0.3s;
          border: none; background: none;
        }
        .section-nav-link::after {
          content: ''; position: absolute;
          bottom: 0; left: 50%; right: 50%;
          height: 2px; background: var(--gold);
          transition: left 0.3s, right 0.3s;
        }
        .section-nav-link:hover { color: var(--white); }
        .section-nav-link.active { color: var(--white); }
        .section-nav-link.active::after { left: 1rem; right: 1rem; }

        /* SHARED */
        .eyebrow {
          font-size: var(--text-xs); letter-spacing: 0.4em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem;
        }
        .eyebrow::before { content: ''; display: inline-block; width: 30px; height: 1px; background: var(--gold); }
        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.62rem, 4vw, 2.62rem);
          font-weight: 300; line-height: 1.2; color: var(--white); margin-bottom: 2rem;
        }
        .section-title em { font-style: italic; color: var(--gold-light); }
        .body-text { font-size: var(--text-base); line-height: 2; color: var(--cream-dim); margin-bottom: 2rem; }

        /* OVERVIEW */
        .overview {
          padding: 7rem 5rem;
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          max-width: 900px; margin: 0 auto;
        }
        .overview .eyebrow { justify-content: center; }
        .overview .eyebrow::before { display: none; }
        .overview .body-text { font-size: var(--text-base); line-height: 2; }
        .enquire-btn {
          font-family: 'Inter', sans-serif; font-size: var(--text-sm);
          letter-spacing: 0.22em; text-transform: uppercase;
          background: var(--gold); color: var(--dark);
          border: none; padding: 1rem 2.5rem; cursor: pointer; transition: background 0.3s;
        }
        .enquire-btn:hover { background: var(--gold-light); }

        /* ITINERARIES */
        .itineraries {
          padding: 0;
          background: var(--dark-2);
          overflow: hidden;
        }
        .itin-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          min-height: 600px;
        }
        .itin-left {
          padding: 5rem 3rem 5rem 5rem;
          display: flex; flex-direction: column;
          justify-content: center;
          background: var(--dark-2);
          position: relative; z-index: 2;
          border-right: 1px solid rgba(201,168,76,0.08);
        }
        .itin-left-eyebrow {
          font-size: var(--text-xs); letter-spacing: 0.4em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 1.5rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .itin-left-eyebrow::before {
          content: ''; width: 24px; height: 1px; background: var(--gold);
        }
        .itin-left-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.62rem, 2vw, var(--text-md));
          font-weight: 300; color: var(--white);
          line-height: 1.3; margin-bottom: 1.5rem;
        }
        .itin-left-desc {
          font-size: var(--text-base); line-height: 1.9;
          color: var(--cream-dim); margin-bottom: 2.5rem;
        }
        .itin-left-cta {
          font-family: 'Inter', sans-serif;
          font-size: var(--text-sm); letter-spacing: 0.22em;
          text-transform: uppercase;
          background: var(--gold); color: var(--dark);
          border: none; padding: 0.9rem 2rem;
          cursor: pointer; transition: background 0.3s;
          width: fit-content;
        }
        .itin-left-cta:hover { background: var(--gold-light); }
        .itin-scroll-wrap {
          overflow-x: auto; overflow-y: hidden;
          cursor: grab; scrollbar-width: none; user-select: none;
        }
        .itin-scroll-wrap::-webkit-scrollbar { display: none; }
        .itin-cards-row { display: flex; gap: 0; height: 600px; }
        .itin-card-v2 { position: relative; flex: 0 0 300px; overflow: hidden; cursor: pointer; }
        .itin-card-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          transition: transform 0.7s ease;
        }
        .itin-card-v2:hover .itin-card-bg { transform: scale(1.06); }
        .itin-card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.2) 55%, rgba(8,8,8,0.05) 100%);
          transition: background 0.4s;
        }
        .itin-card-v2:hover .itin-card-overlay {
          background: linear-gradient(to top, rgba(8,8,8,0.96) 0%, rgba(8,8,8,0.35) 55%, rgba(8,8,8,0.1) 100%);
        }
        .itin-card-nights {
          position: absolute; top: 1.2rem; right: 1.2rem;
          font-size: var(--text-xs); letter-spacing: 0.25em;
          text-transform: uppercase; color: var(--white);
          font-family: 'Inter', sans-serif; font-weight: 500; z-index: 2;
        }
        .itin-card-bottom { position: absolute; bottom: 0; left: 0; right: 0; padding: 2rem 1.8rem; z-index: 2; }
        .itin-card-title {
          font-family: 'Inter', sans-serif;
          font-size: var(--text-base); font-weight: 400;
          color: var(--white); text-transform: uppercase;
          letter-spacing: 0.05em; line-height: 1.4; margin-bottom: 1.2rem;
        }
        .itin-card-btn {
          display: inline-flex; align-items: center;
          font-size: var(--text-xs); letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--white);
          border: 1px solid rgba(255,255,255,0.5);
          padding: 0.6rem 1.2rem; background: none;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: border-color 0.3s, color 0.3s;
          position: relative; z-index: 4;
        }
        .itin-card-btn:hover { border-color: var(--gold); color: var(--gold); }
        .itin-card-desc {
          font-size: var(--text-base); line-height: 1.8;
          color: var(--cream-dim); font-family: 'Inter', sans-serif; font-weight: 300;
          max-height: 0; overflow: hidden;
          opacity: 0; margin: 0;
          transition: max-height 0.4s ease, opacity 0.4s ease, margin 0.4s ease;
        }
        .itin-card-v2:hover .itin-card-desc {
          max-height: 120px; opacity: 1; margin: 0.8rem 0;
        }

        /* SEE & DO */
        .see-do { padding: 0; background: var(--dark); }
        .see-do-header {
          padding: 4rem 5rem 3rem;
          text-align: center;
          border-bottom: 1px solid rgba(201,168,76,0.08);
        }
        .see-do-section-label {
          font-size: var(--text-xs); letter-spacing: 0.45em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 0.8rem; display: block;
        }
        .see-do-main-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.62rem, 3vw, 2.62rem);
          font-weight: 300; color: var(--white);
          line-height: 1.2; margin-bottom: 1rem;
        }
        .see-do-main-sub {
          font-size: var(--text-xs); letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--cream-dim);
          line-height: 1.8; max-width: 680px; margin: 0 auto;
        }
        .see-do-link { color: var(--cream-dim); text-decoration: underline; text-underline-offset: 3px; transition: color 0.3s; }
        .see-do-link:hover { color: var(--gold); }
        .see-do-hero {
          position: relative; overflow: hidden;
          aspect-ratio: 16/9; width: 100%;
        }
        .see-do-hero iframe {
          position: absolute; inset: 0;
          width: 100%; height: 100%; border: none; display: block;
        }
        .see-do-facade {
          position: absolute; inset: 0; cursor: pointer;
        }
        .see-do-facade-img {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .see-do-play-btn {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 72px; height: 72px;
          border-radius: 50%;
          background: rgba(0,0,0,0.55);
          border: 2px solid rgba(255,255,255,0.7);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.3s, border-color 0.3s;
        }
        .see-do-facade:hover .see-do-play-btn {
          background: var(--gold); border-color: var(--gold);
        }
        .see-do-play-icon {
          width: 0; height: 0;
          border-top: 12px solid transparent;
          border-bottom: 12px solid transparent;
          border-left: 20px solid #fff;
          margin-left: 4px;
        }
        .see-do-hero-grad {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(to bottom, rgba(8,8,8,0.3) 0%, rgba(8,8,8,0) 40%, rgba(8,8,8,0.6) 100%);
        }
        .see-do-hero-content {
          position: absolute; inset: 0; pointer-events: none;
          display: flex; flex-direction: column;
          align-items: center; justify-content: flex-end;
          text-align: center; padding: 0 2rem 4rem;
        }
        .see-do-inner-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.62rem, 5vw, 4.24rem); font-weight: 300;
          color: var(--white); margin-bottom: 1.5rem; line-height: 1.15;
        }
        .see-do-body {
          font-size: var(--text-base); line-height: 2; color: rgba(242,237,228,0.8);
          max-width: 640px; margin-bottom: 2.5rem;
          font-family: 'Inter', sans-serif; font-weight: 300;
        }
        .see-do-enquire {
          font-family: 'Inter', sans-serif;
          font-size: var(--text-sm); letter-spacing: 0.22em; text-transform: uppercase;
          background: transparent; color: var(--white);
          border: 1px solid rgba(255,255,255,0.6); padding: 0.9rem 2.5rem;
          cursor: pointer; transition: all 0.3s;
        }
        .see-do-enquire:hover { border-color: var(--gold); color: var(--gold); }

        /* HOTELS */
        .hotels { padding: 5rem 5rem 6rem; background: var(--dark); }
        .hotels-header {
          text-align: center;
          margin-bottom: 3rem;
        }
        .hotels-main-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.62rem, 3vw, 2.62rem);
          font-weight: 300; color: var(--white);
          margin-bottom: 2rem;
        }
        .hotels-tabs {
          display: flex; align-items: center; justify-content: center; gap: 0;
          border-bottom: 1px solid rgba(201,168,76,0.15);
          margin-bottom: 3.5rem;
        }
        .hotels-tab {
          font-family: 'Inter', sans-serif;
          font-size: var(--text-sm); letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--cream-dim); background: none; border: none;
          padding: 0.9rem 2rem; cursor: pointer; position: relative;
          transition: color 0.3s;
        }
        .hotels-tab::after {
          content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
          height: 2px; background: var(--gold);
          transform: scaleX(0); transition: transform 0.3s;
        }
        .hotels-tab:hover { color: var(--white); }
        .hotels-tab.active { color: var(--white); }
        .hotels-tab.active::after { transform: scaleX(1); }
        .hotels-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5rem; }
        .hotel-card { cursor: pointer; }
        .hotel-img-wrap { overflow: hidden; margin-bottom: 1.2rem; }
        .hotel-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; transition: transform 0.6s ease; }
        .hotel-card:hover .hotel-img { transform: scale(1.04); }
        .hotel-tag { font-size: var(--text-xs); letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.4rem; }
        .hotel-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: var(--text-md); font-weight: 300;
          color: var(--white); font-style: italic;
          letter-spacing: 0.03em; margin-bottom: 0.8rem; line-height: 1.2;
        }
        .hotel-desc { font-size: var(--text-sm); line-height: 1.9; color: var(--cream-dim); margin-bottom: 1rem; font-weight: 300; }
        .hotel-link {
          font-size: var(--text-xs); letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--gold); text-decoration: underline; text-underline-offset: 4px;
          transition: color 0.3s; background: none; border: none; cursor: pointer;
          padding: 0; font-family: 'Inter', sans-serif;
        }
        .hotel-link:hover { color: var(--gold-light); }

        /* ENQUIRE BANNER */
        .enquire-banner {
          padding: 7rem 5rem; background: var(--dark-2);
          display: flex; align-items: center; justify-content: space-between;
          border-top: 1px solid rgba(201,168,76,0.1); border-bottom: 1px solid rgba(201,168,76,0.1);
        }
        .enquire-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.62rem, 4vw, 2.62rem); font-weight: 300; color: var(--white); margin-bottom: 1rem; }
        .enquire-title em { font-style: italic; color: var(--gold-light); }
        .enquire-sub { font-size: var(--text-base); line-height: 1.8; color: var(--cream-dim); max-width: 480px; }
        .enquire-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 1rem; }
        .btn-gold-lg { font-family: 'Inter', sans-serif; font-size: var(--text-sm); letter-spacing: 0.25em; text-transform: uppercase; background: var(--gold); color: var(--dark); border: none; padding: 1.2rem 3rem; cursor: pointer; transition: background 0.3s; }
        .btn-gold-lg:hover { background: var(--gold-light); }
        .enquire-note { font-size: var(--text-xs); letter-spacing: 0.1em; color: var(--cream-dim); }

        /* MORE DESTINATIONS */
        .more-dest { padding: 7rem 5rem; }
        .more-grid { display: flex; gap: 0.75rem; margin-top: 3rem; }
        .more-card { position: relative; overflow: hidden; cursor: pointer; text-decoration: none; display: block; flex: 0 0 calc(20% - 0.6rem); aspect-ratio: 3/4; }
        .more-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.6s ease; position: absolute; inset: 0; }
        .more-card:hover .more-img { transform: scale(1.05); }
        .more-grad { position: absolute; inset: 0; background: linear-gradient(to top, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.1) 55%); }
        .more-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 1.4rem; }
        .more-country { font-size: var(--text-xs); letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.3rem; }
        .more-name { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; font-weight: 300; color: var(--white); }
        .more-arrow { position: absolute; top: 1rem; right: 1rem; width: 32px; height: 32px; border: 1px solid rgba(201,168,76,0.4); display: flex; align-items: center; justify-content: center; color: var(--gold); opacity: 0; transform: translateY(-5px); transition: all 0.3s; }
        .more-card:hover .more-arrow { opacity: 1; transform: translateY(0); }

        /* FOOTER */
        footer { background: var(--dark-2); border-top: 1px solid rgba(201,168,76,0.1); }
        .footer-main { padding: 5rem 5rem 3rem; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 3rem; }
        .footer-logo { font-family: 'Cormorant Garamond', serif; font-size: var(--text-md); font-weight: 300; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold-light); margin-bottom: 1rem; display: block; }
        .footer-tagline { font-size: var(--text-xs); line-height: 1.9; color: var(--cream-dim); max-width: 260px; }
        .footer-col-title { font-size: var(--text-xs); letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); margin-bottom: 1.5rem; }
        .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 0.8rem; }
        .footer-col ul a { font-size: var(--text-xs); color: var(--cream-dim); text-decoration: none; transition: color 0.3s; }
        .footer-col ul a:hover { color: var(--gold-light); }
        .footer-bottom { border-top: 1px solid rgba(201,168,76,0.08); padding: 1.5rem 5rem; display: flex; align-items: center; justify-content: space-between; }
        .footer-copy { font-size: var(--text-xs); color: var(--cream-dim); }
        .footer-bottom-links { display: flex; gap: 2rem; list-style: none; }
        .footer-bottom-links a { font-size: var(--text-xs); letter-spacing: 0.15em; text-transform: uppercase; color: var(--cream-dim); text-decoration: none; transition: color 0.3s; }
        .footer-bottom-links a:hover { color: var(--gold); }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(25px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 1024px) {
          .hero-content { padding: 0 2rem 4rem; }
          .breadcrumb { padding: 1.2rem 2rem; }
          .section-nav-inner { justify-content: flex-start; overflow-x: auto; padding: 0 2rem; }
          .section-nav-link { padding: 1rem 1.2rem; white-space: nowrap; }
          .overview { padding: 5rem 2rem; }
          .hotels, .more-dest { padding: 5rem 2rem; }
          .hotels-grid, .more-grid { grid-template-columns: 1fr; }
          .enquire-banner { flex-direction: column; gap: 3rem; padding: 5rem 2rem; align-items: flex-start; }
          .enquire-actions { align-items: flex-start; }
          .footer-main { grid-template-columns: 1fr 1fr; padding: 3rem 2rem 2rem; }
          .footer-bottom { flex-direction: column; gap: 1rem; padding: 1.5rem 2rem; }
          .itin-layout { grid-template-columns: 1fr; }
          .itin-left { padding: 4rem 2rem 2rem; border-right: none; border-bottom: 1px solid rgba(201,168,76,0.08); }
          .itin-cards-row { height: 460px; }
          .itin-card-v2 { flex: 0 0 260px; }
          .see-do-header { padding: 4rem 2rem 0; }
          .see-do-header { padding: 3rem 2rem 2rem; }
          .see-do-split { grid-template-columns: 1fr; }
          .see-do-text { padding: 3rem 2rem; }
          .see-do-image { min-height: 320px; }
          .see-do-image::after { display: none; }
          .exp-gallery { padding: 3.5rem 2rem; }
          .exp-gallery-layout { grid-template-columns: 1fr; gap: 2.5rem; }
          .exp-gallery-text-col { padding-right: 0; }
          .exp-gallery-img { aspect-ratio: 16/9; }
        }
      `}</style>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(${dest.heroImage})`, ["--scroll" as string]: `${scrollY}px` }} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-country">{dest.country}</p>
          <h1 className="hero-name">Luxury in {dest.name}</h1>
          <p className="hero-sinhala">{dest.sinhala}</p>
          <p className="hero-tagline">{dest.tagline}</p>
        </div>
      </section>

      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <a href="/">Home</a>
        <span className="breadcrumb-sep">→</span>
        <a href="/destinations-page">Destinations</a>
        <span className="breadcrumb-sep">→</span>
        <span className="breadcrumb-current">{dest.name}</span>
      </div>

      {/* STICKY SECTION NAV */}
      <nav className="section-nav">
        <div className="section-nav-inner">
          {NAV_SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              className={`section-nav-link ${activeSection === id ? "active" : ""}`}
              onClick={() => scrollTo(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* OVERVIEW */}
      <section id="overview" className="overview">
        <p className="eyebrow">About {dest.name}</p>
        <h2 className="section-title">A Place That<br /><em>Stays With You</em></h2>
        <p className="body-text">{dest.about}</p>
        <button className="enquire-btn">Plan My Journey</button>
      </section>

      {/* ITINERARIES */}
      <section id="itineraries" className="itineraries">
        <div className="itin-layout">
          <div className="itin-left">
            <p className="itin-left-eyebrow">Example Trips</p>
            <h2 className="itin-left-title">Example {dest.name} Trips</h2>
            <p className="itin-left-desc">
              These journeys are simply suggestions for the kind of experience you might have.
              Yours will be tailored, altered, and refined until it matches you completely.
            </p>
            <button className="itin-left-cta">Build My Trip</button>
          </div>
          <div
            className="itin-scroll-wrap"
            ref={scrollRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <div className="itin-cards-row">
              {trips.map((trip, i) => (
                <div className="itin-card-v2" key={i}>
                  <div className="itin-card-bg" style={{ backgroundImage: `url(${trip.image})` }} />
                  <div className="itin-card-overlay" />
                  <span className="itin-card-nights">{trip.nights}</span>
                  <div className="itin-card-bottom">
                    <h3 className="itin-card-title">{trip.title}</h3>
                    <div className="itin-card-desc">{trip.desc}</div>
                    <button className="itin-card-btn">Explore Trip</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* SEE & DO */}
      <section id="see-do" className="see-do">
        <div className="see-do-header">
          <span className="see-do-section-label">See &amp; Do</span>
          <h2 className="see-do-main-title">What to See and Do in <em>{dest.name}</em></h2>
          <p className="see-do-main-sub">
            Use the below as inspiration, then{" "}
            <a href="#" className="see-do-link">get in touch</a>{" "}
            to enquire about your dream {dest.name} holiday.
          </p>
        </div>
        <div className="see-do-hero">
          {videoPlaying ? (
            <iframe
              src="https://www.youtube.com/embed/jHV_9GBOf1s?autoplay=1&rel=0&modestbranding=1&start=1"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <div className="see-do-facade" onClick={() => setVideoPlaying(true)}>
              <img
                src="https://img.youtube.com/vi/jHV_9GBOf1s/3.jpg"
                alt="Play video"
                className="see-do-facade-img"
              />
              <div className="see-do-hero-grad" />
              <div className="see-do-hero-content">
                <h3 className="see-do-inner-title" style={{ pointerEvents: 'none' }}>Seek Authenticity.<br />The Culture. The People.</h3>
                <button className="see-do-enquire" style={{ pointerEvents: 'none' }}>Begin Your Journey</button>
              </div>
              <div className="see-do-play-btn">
                <div className="see-do-play-icon" />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* HOTELS */}
      <section id="hotels" className="hotels">
        <div className="hotels-header">
          <h2 className="hotels-main-title">Best Hotels</h2>
        </div>
        <div className="hotels-grid">
          {[
            {
              tag: "Boutique",
              name: "The Fort Residency",
              image: "/images/hotels/the-fort-recidency.webp",
              desc: `Tucked within the ancient walls of ${dest.name} Fort, this intimate boutique hotel blends colonial charm with refined comfort. A quiet retreat in the heart of the old city.`
            },
            {
              tag: "Luxury Resort",
              name: "Cape Weligama",
              image: "/images/hotels/cape-waligma.webp",
              desc: `Perched on a dramatic clifftop overlooking the Indian Ocean, Cape Weligama is a stunning resort offering breathtaking panoramic views and world-class amenities.`
            },
            {
              tag: "Heritage",
              name: "Amangalla",
              image: "/images/hotels/amangalla.webp",
              desc: `An iconic hotel nestled within one of ${dest.name}'s UNESCO World Heritage Sites. A peaceful, beautifully restored colonial landmark of rare distinction.`
            },
          ].map((hotel, i) => (
            <div className="hotel-card" key={i}>
              <div className="hotel-img-wrap">
                <img src={hotel.image} alt={hotel.name} className="hotel-img"
                  onError={(e) => { e.currentTarget.style.display = "none"; }} />
              </div>
              <p className="hotel-tag">{hotel.tag}</p>
              <h3 className="hotel-name">{hotel.name}</h3>
              <p className="hotel-desc">{hotel.desc}</p>
              <button className="hotel-link">View Hotel</button>
            </div>
          ))}
        </div>
      </section>

      {/* ENQUIRE BANNER */}
      <section className="enquire-banner">
        <div>
          <h2 className="enquire-title">Ready to Discover<br /><em>{dest.name}?</em></h2>
          <p className="enquire-sub">
            Let our travel artisans craft a bespoke {dest.name} journey designed entirely around you — your pace, your passions, your perfect trip.
          </p>
        </div>
        <div className="enquire-actions">
          <button className="btn-gold-lg">Enquire Now</button>
          <p className="enquire-note">We respond within 24 hours</p>
        </div>
      </section>

      {/* MORE DESTINATIONS */}
      <section className="more-dest">
        <p className="eyebrow">Keep Exploring</p>
        <h2 className="section-title">Discover More <em>Destinations</em></h2>
        <div className="more-grid">
          {dest.more.map((m, i) => (
            <a href={`/destinations/${m.slug}`} className="more-card" key={i}>
              <img src={m.image} alt={m.name} className="more-img"
                onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <div className="more-grad" />
              <div className="more-arrow">↗</div>
              <div className="more-info">
                <p className="more-country">{m.country}</p>
                <h3 className="more-name">{m.name}</h3>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-main">
          <div>
            <span className="footer-logo">Samsara</span>
            <p className="footer-tagline">Crafting bespoke travel experiences for the discerning few.</p>
          </div>
          <div className="footer-col">
            <p className="footer-col-title">Destinations</p>
            <ul>{["Europe","Asia","Africa","The Americas","Oceania"].map(l => (<li key={l}><a href="#">{l}</a></li>))}</ul>
          </div>
          <div className="footer-col">
            <p className="footer-col-title">Journeys</p>
            <ul>{["Cultural","Adventure","Wellness","Culinary","Private"].map(l => (<li key={l}><a href="#">{l}</a></li>))}</ul>
          </div>
          <div className="footer-col">
            <p className="footer-col-title">Company</p>
            <ul>{["About Us","Philosophy","Press","Careers","Contact"].map(l => (<li key={l}><a href="#">{l}</a></li>))}</ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">© 2025 Samsara. All rights reserved.</p>
          <ul className="footer-bottom-links">
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Terms</a></li>
            <li><a href="#">Cookies</a></li>
          </ul>
        </div>
      </footer>
    </>
  );
}