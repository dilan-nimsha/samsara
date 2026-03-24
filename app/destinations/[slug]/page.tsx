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
    { nights: "7 Nights", title: `${dest.name}: A Weekend Escape`, image: dest.gallery[0] },
    { nights: "10 Nights", title: `${dest.name}: The Deep Dive`, image: dest.gallery[1] },
    { nights: "8 Nights", title: `A Journey into ${dest.name}`, image: dest.gallery[2] },
    { nights: "12 Nights", title: `${dest.name}: A Spiritual Adventure`, image: dest.gallery[0] },
    { nights: "Custom", title: `Create Your Own ${dest.name} Journey`, image: dest.gallery[1] },
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
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          padding: 2rem 5rem;
          display: flex; align-items: center; justify-content: space-between;
          transition: background 0.5s, padding 0.4s, border-color 0.5s;
          border-bottom: 1px solid transparent;
        }
        .navbar.scrolled {
          background: rgba(8,8,8,0.93);
          backdrop-filter: blur(16px);
          padding: 1.2rem 5rem;
          border-color: rgba(201,168,76,0.12);
        }
        .nav-logo { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; }
        .nav-logo img { height: 38px; width: auto; object-fit: contain; }
        .nav-links { display: flex; gap: 2.5rem; list-style: none; }
        .nav-links a {
          color: #fff; text-decoration: none;
          font-size: 0.80rem; letter-spacing: 0.1em; text-transform: uppercase;
          transition: color 0.3s; position: relative; font-family: 'Inter', sans-serif;
        }
        .nav-links a::after {
          content: ''; position: absolute; bottom: -4px; left: 0;
          width: 0; height: 1px; background: var(--gold); transition: width 0.3s;
        }
        .nav-links a:hover { color: var(--gold-light); }
        .nav-links a:hover::after { width: 100%; }
        .nav-cta {
          font-family: 'Inter', sans-serif; font-size: 0.68rem;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #000; border: none; padding: 0.65rem 1.6rem;
          background: #D4AA00; cursor: pointer; transition: all 0.3s;
        }
        .nav-cta:hover { background: var(--gold); color: var(--dark); }

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
        }
        .hero-country {
          font-size: 0.7rem; letter-spacing: 0.4em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem;
        }
        .hero-country::before {
          content: ''; display: inline-block; width: 30px; height: 1px; background: var(--gold);
        }
        .hero-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(4rem, 9vw, 8rem);
          font-weight: 300; line-height: 1; color: var(--white); margin-bottom: 0.5rem;
        }
        .hero-sinhala {
          font-family: 'Pawana', sans-serif;
          font-size: clamp(1.5rem, 3vw, 2.5rem);
          color: #D4AA00; letter-spacing: 0.2em; margin-bottom: 1rem;
        }
        .hero-tagline {
          font-size: 0.9rem; letter-spacing: 0.1em;
          color: var(--cream-dim); max-width: 400px;
        }

        /* BREADCRUMB */
        .breadcrumb {
          padding: 1.2rem 5rem;
          display: flex; align-items: center; gap: 0.75rem;
          font-size: 0.65rem; letter-spacing: 0.2em;
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
          font-size: 0.68rem; letter-spacing: 0.2em; text-transform: uppercase;
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
          font-size: 0.65rem; letter-spacing: 0.4em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem;
        }
        .eyebrow::before { content: ''; display: inline-block; width: 30px; height: 1px; background: var(--gold); }
        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 300; line-height: 1.2; color: var(--white); margin-bottom: 2rem;
        }
        .section-title em { font-style: italic; color: var(--gold-light); }
        .body-text { font-size: 0.88rem; line-height: 2; color: var(--cream-dim); margin-bottom: 2rem; }

        /* OVERVIEW */
        .overview {
          padding: 7rem 5rem;
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          max-width: 900px; margin: 0 auto;
        }
        .overview .eyebrow { justify-content: center; }
        .overview .eyebrow::before { display: none; }
        .overview .body-text { font-size: 1.15rem; line-height: 2; }
        .enquire-btn {
          font-family: 'Inter', sans-serif; font-size: 0.7rem;
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
          font-size: 0.62rem; letter-spacing: 0.4em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 1.5rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .itin-left-eyebrow::before {
          content: ''; width: 24px; height: 1px; background: var(--gold);
        }
        .itin-left-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(1.3rem, 2vw, 1.7rem);
          font-weight: 600; color: var(--white);
          text-transform: uppercase; letter-spacing: 0.06em;
          line-height: 1.3; margin-bottom: 1.5rem;
        }
        .itin-left-desc {
          font-size: 0.85rem; line-height: 1.9;
          color: var(--cream-dim); margin-bottom: 2.5rem;
        }
        .itin-left-cta {
          font-family: 'Inter', sans-serif;
          font-size: 0.68rem; letter-spacing: 0.22em;
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
          font-size: 0.62rem; letter-spacing: 0.25em;
          text-transform: uppercase; color: var(--white);
          font-family: 'Inter', sans-serif; font-weight: 500; z-index: 2;
        }
        .itin-card-bottom { position: absolute; bottom: 0; left: 0; right: 0; padding: 2rem 1.8rem; z-index: 2; }
        .itin-card-title {
          font-family: 'Inter', sans-serif;
          font-size: 0.88rem; font-weight: 600;
          color: var(--white); text-transform: uppercase;
          letter-spacing: 0.05em; line-height: 1.4; margin-bottom: 1.2rem;
        }
        .itin-card-btn {
          display: inline-flex; align-items: center;
          font-size: 0.65rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--white);
          border: 1px solid rgba(255,255,255,0.5);
          padding: 0.6rem 1.2rem; background: none;
          cursor: pointer; transition: all 0.3s; font-family: 'Inter', sans-serif;
        }
        .itin-card-btn:hover { border-color: var(--gold); color: var(--gold); }

        /* SEE & DO */
        .see-do { padding: 0; background: var(--dark); }
        .see-do-top {
          padding: 3.5rem 5rem 2.5rem;
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          border-bottom: 1px solid rgba(201,168,76,0.08);
        }
        .see-do-main-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(1.4rem, 3vw, 2rem);
          font-weight: 700; color: var(--white);
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1.2rem;
        }
        .see-do-main-sub {
          font-size: 0.78rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--cream-dim); line-height: 1.8;
        }
        .see-do-link { color: var(--white); text-decoration: underline; text-underline-offset: 3px; transition: color 0.3s; }
        .see-do-link:hover { color: var(--gold); }
        .see-do-split { display: grid; grid-template-columns: 1fr 1.4fr; min-height: 420px; }
        .see-do-text {
          display: flex; flex-direction: column; justify-content: center;
          padding: 3.5rem 4rem; border-right: 1px solid rgba(201,168,76,0.08);
        }
        .see-do-inner-title {
          font-family: 'Inter', sans-serif;
          font-size: 1rem; font-weight: 700;
          color: var(--white); text-transform: uppercase;
          letter-spacing: 0.08em; margin-bottom: 1.2rem;
        }
        .see-do-body { font-size: 0.85rem; line-height: 1.9; color: var(--cream-dim); margin-bottom: 1.5rem; }
        .see-do-enquire {
          font-family: 'Inter', sans-serif;
          font-size: 0.7rem; letter-spacing: 0.22em; text-transform: uppercase;
          background: var(--white); color: var(--dark);
          border: none; padding: 0.85rem 1.8rem; cursor: pointer; transition: all 0.3s; width: fit-content;
        }
        .see-do-enquire:hover { background: var(--gold); color: var(--dark); }
        .see-do-image { position: relative; overflow: hidden; }
        .see-do-image img {
          width: 100%; height: 100%; max-height: 420px; object-fit: cover; display: block; transition: transform 0.8s ease;
        }
        .see-do-image:hover img { transform: scale(1.03); }

        /* EXPERIENCE GALLERY */
        .exp-gallery {
          padding: 4rem 5rem;
          background: var(--dark-2);
          border-top: 1px solid rgba(201,168,76,0.08);
        }
        .exp-gallery-title-row {
          text-align: center;
          margin-bottom: 3rem;
        }
        .exp-gallery-label {
          font-size: 0.62rem; letter-spacing: 0.45em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 0.75rem; display: block;
        }
        .exp-gallery-heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.8rem, 3.5vw, 2.8rem);
          font-weight: 300; color: var(--white); line-height: 1.2;
        }
        .exp-gallery-heading em { font-style: italic; color: var(--gold-light); }
        .exp-gallery-layout {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 4rem;
          align-items: center;
          max-width: 1300px;
          margin: 0 auto;
        }
        .exp-gallery-img-wrap { overflow: hidden; }
        .exp-gallery-img {
          width: 100%;
          aspect-ratio: 16/10;
          object-fit: cover;
          display: block;
          background: #1a1a1a;
          transition: transform 0.8s ease;
        }
        .exp-gallery-img-wrap:hover .exp-gallery-img { transform: scale(1.03); }
        .exp-gallery-text-col { padding-right: 1rem; }
        .exp-gallery-text-col .eyebrow { margin-bottom: 1rem; }
        .exp-gallery-text-col .section-title { font-size: clamp(1.6rem, 2.8vw, 2.4rem); margin-bottom: 1.5rem; }
        .exp-gallery-body {
          font-size: 0.85rem; line-height: 2;
          color: var(--cream-dim); margin-bottom: 2rem;
        }
        .exp-gallery-link {
          display: inline-flex; align-items: center; gap: 0.75rem;
          font-size: 0.68rem; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--gold); text-decoration: none; transition: gap 0.3s;
        }
        .exp-gallery-link:hover { gap: 1.25rem; }

        /* HOTELS */
        .hotels { padding: 7rem 5rem; background: var(--dark-2); }
        .hotels-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-top: 3rem; }
        .hotel-card { position: relative; overflow: hidden; cursor: pointer; }
        .hotel-img { width: 100%; aspect-ratio: 1/1; object-fit: cover; display: block; transition: transform 0.6s ease; }
        .hotel-card:hover .hotel-img { transform: scale(1.04); }
        .hotel-grad { position: absolute; inset: 0; background: linear-gradient(to top, rgba(8,8,8,0.92) 0%, transparent 55%); }
        .hotel-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 1.5rem; }
        .hotel-tag { font-size: 0.58rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.3rem; }
        .hotel-name { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 300; color: var(--white); }

        /* ENQUIRE BANNER */
        .enquire-banner {
          padding: 7rem 5rem; background: var(--dark-2);
          display: flex; align-items: center; justify-content: space-between;
          border-top: 1px solid rgba(201,168,76,0.1); border-bottom: 1px solid rgba(201,168,76,0.1);
        }
        .enquire-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2rem, 4vw, 3rem); font-weight: 300; color: var(--white); margin-bottom: 1rem; }
        .enquire-title em { font-style: italic; color: var(--gold-light); }
        .enquire-sub { font-size: 0.85rem; line-height: 1.8; color: var(--cream-dim); max-width: 480px; }
        .enquire-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 1rem; }
        .btn-gold-lg { font-family: 'Inter', sans-serif; font-size: 0.7rem; letter-spacing: 0.25em; text-transform: uppercase; background: var(--gold); color: var(--dark); border: none; padding: 1.2rem 3rem; cursor: pointer; transition: background 0.3s; }
        .btn-gold-lg:hover { background: var(--gold-light); }
        .enquire-note { font-size: 0.65rem; letter-spacing: 0.1em; color: var(--cream-dim); }

        /* MORE DESTINATIONS */
        .more-dest { padding: 7rem 5rem; }
        .more-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 3rem; }
        .more-card { position: relative; overflow: hidden; cursor: pointer; text-decoration: none; display: block; }
        .more-img { width: 100%; aspect-ratio: 3/2; object-fit: cover; display: block; transition: transform 0.6s ease; }
        .more-card:hover .more-img { transform: scale(1.04); }
        .more-grad { position: absolute; inset: 0; background: linear-gradient(to top, rgba(8,8,8,0.85) 0%, transparent 60%); }
        .more-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 1.5rem; }
        .more-country { font-size: 0.6rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.3rem; }
        .more-name { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 300; color: var(--white); }
        .more-arrow { position: absolute; top: 1rem; right: 1rem; color: var(--gold); font-size: 1rem; opacity: 0; transform: translateX(-5px); transition: all 0.3s; }
        .more-card:hover .more-arrow { opacity: 1; transform: translateX(0); }

        /* FOOTER */
        footer { background: var(--dark-2); border-top: 1px solid rgba(201,168,76,0.1); }
        .footer-main { padding: 5rem 5rem 3rem; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 3rem; }
        .footer-logo { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 300; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold-light); margin-bottom: 1rem; display: block; }
        .footer-tagline { font-size: 0.8rem; line-height: 1.9; color: var(--cream-dim); max-width: 260px; }
        .footer-col-title { font-size: 0.65rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); margin-bottom: 1.5rem; }
        .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 0.8rem; }
        .footer-col ul a { font-size: 0.8rem; color: var(--cream-dim); text-decoration: none; transition: color 0.3s; }
        .footer-col ul a:hover { color: var(--gold-light); }
        .footer-bottom { border-top: 1px solid rgba(201,168,76,0.08); padding: 1.5rem 5rem; display: flex; align-items: center; justify-content: space-between; }
        .footer-copy { font-size: 0.65rem; color: var(--cream-dim); }
        .footer-bottom-links { display: flex; gap: 2rem; list-style: none; }
        .footer-bottom-links a { font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--cream-dim); text-decoration: none; transition: color 0.3s; }
        .footer-bottom-links a:hover { color: var(--gold); }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(25px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 1024px) {
          .navbar, .navbar.scrolled { padding: 1.2rem 2rem; }
          .nav-links { display: none; }
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
          .see-do-split { grid-template-columns: 1fr; }
          .see-do-text { padding: 3rem 2rem; }
          .see-do-image { min-height: 280px; }
          .see-do-image::after { display: none; }
          .exp-gallery { padding: 3.5rem 2rem; }
          .exp-gallery-layout { grid-template-columns: 1fr; gap: 2.5rem; }
          .exp-gallery-text-col { padding-right: 0; }
          .exp-gallery-img { aspect-ratio: 16/9; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className={`navbar ${scrollY > 60 ? "scrolled" : ""}`}>
        <a href="/" className="nav-logo">
          <img src="/images/navbar logo.png" alt="Samsara" style={{ height: "45px", width: "auto", objectFit: "contain" }} onError={(e) => (e.currentTarget.style.display = "none")} />
        </a>
        <ul className="nav-links">
          <li><a href="/destinations-page">Destinations</a></li>
          <li><a href="/#explore">Experiences</a></li>
          <li><a href="/feeling-engine">Feelings Engine</a></li>
          <li><a href="/#about">About</a></li>
        </ul>
        <button className="nav-cta">Enquire Now</button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(${dest.heroImage})`, ["--scroll" as string]: `${scrollY}px` }} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-country">{dest.country}</p>
          <h1 className="hero-name">{dest.name}</h1>
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
        <div className="see-do-top">
          <h2 className="see-do-main-title">What to See and Do in {dest.name}</h2>
          <p className="see-do-main-sub">
            Use the below as inspiration, then{" "}
            <a href="#" className="see-do-link">get in touch</a>{" "}
            to enquire about your dream {dest.name} holiday.
          </p>
        </div>
        <div className="see-do-split">
          <div className="see-do-text">
            <h3 className="see-do-inner-title">Luxury in {dest.name}</h3>
            <p className="see-do-body">{dest.about}</p>
            <button className="see-do-enquire">Enquire</button>
          </div>
          <div className="see-do-image">
            <img
              src={dest.gallery[0]}
              alt={`Experience ${dest.name}`}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.background = "linear-gradient(160deg,#1c1c1c,#111)";
                (e.currentTarget as HTMLImageElement).removeAttribute("src");
              }}
            />
          </div>
        </div>
      </section>

      {/* EXPERIENCE GALLERY */}
      <section className="exp-gallery">
        <div className="exp-gallery-title-row">
          <span className="exp-gallery-label">{dest.name} Activities</span>
          <h2 className="exp-gallery-heading">
            Experiences That <em>Define</em> {dest.name}
          </h2>
        </div>
        <div className="exp-gallery-layout">
          <div className="exp-gallery-img-wrap">
            <img
              src={dest.gallery[1]}
              alt={`${dest.name} Activities`}
              className="exp-gallery-img"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.background = "linear-gradient(160deg,#1c1c1c,#111)";
                (e.currentTarget as HTMLImageElement).removeAttribute("src");
              }}
            />
          </div>
          <div className="exp-gallery-text-col">
            <p className="eyebrow">The {dest.name} Experience</p>
            <h3 className="section-title">
              Life Lived <em>Fully.</em>
            </h3>
            <p className="exp-gallery-body">{dest.about}</p>
            <a href="#" className="exp-gallery-link">Explore All Activities →</a>
          </div>
        </div>
      </section>

      {/* HOTELS */}
      <section id="hotels" className="hotels">
        <p className="eyebrow">Where to Stay</p>
        <h2 className="section-title">Hotels in <em>{dest.name}</em></h2>
        <div className="hotels-grid">
          {[
            { tag: "Boutique", name: "The Fort Residency", image: dest.gallery[0] },
            { tag: "Luxury",   name: "Amangalla",          image: dest.gallery[1] },
            { tag: "Heritage", name: "Cape Weligama",      image: dest.gallery[2] },
          ].map((hotel, i) => (
            <div className="hotel-card" key={i}>
              <img src={hotel.image} alt={hotel.name} className="hotel-img"
                onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <div className="hotel-grad" />
              <div className="hotel-info">
                <p className="hotel-tag">{hotel.tag}</p>
                <h3 className="hotel-name">{hotel.name}</h3>
              </div>
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
              <span className="more-arrow">→</span>
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