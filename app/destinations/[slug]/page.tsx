"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDestination } from "../data";

const NAV_SECTIONS = [
  { id: "overview",     label: "Overview" },
  { id: "itineraries",  label: "Itineraries" },
  { id: "see-do",       label: "See & Do" },
  { id: "hotels",       label: "Hotels" },
 
];

export default function DestinationPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const dest = getDestination(slug);
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      const offsets = NAV_SECTIONS.map(({ id }) => {
        const el = document.getElementById(id);
        return { id, top: el ? el.getBoundingClientRect().top : Infinity };
      });
      const current = offsets.filter(o => o.top <= 120).pop();
      if (current) setActiveSection(current.id);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  if (!dest) {
    return (
      <div style={{ background: "#080808", color: "#fff", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "serif", fontSize: "2rem" }}>
        Destination not found.
      </div>
    );
  }

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
        .itineraries { padding: 7rem 5rem; background: var(--dark-2); }
        .itinerary-cards {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-top: 3rem;
        }
        .itinerary-card {
          position: relative; overflow: hidden; cursor: pointer;
          aspect-ratio: 2 / 3;
          display: flex; flex-direction: column; justify-content: flex-end;
        }
        .itin-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          transition: transform 0.7s ease;
        }
        .itinerary-card:hover .itin-bg { transform: scale(1.05); }
        .itin-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.15) 55%, rgba(8,8,8,0.05) 100%);
        }
        .itin-nights {
          position: absolute; top: 1.2rem; right: 1.2rem;
          font-size: 0.62rem; letter-spacing: 0.25em; text-transform: uppercase;
          color: var(--white); font-family: 'Inter', sans-serif; font-weight: 500;
        }
        .itin-bottom {
          position: relative; z-index: 2; padding: 2rem;
        }
        .itin-title {
          font-family: 'Inter', sans-serif; font-size: 1rem; font-weight: 600;
          color: var(--white); text-transform: uppercase; letter-spacing: 0.05em;
          line-height: 1.4; margin-bottom: 1.2rem;
        }
        .itin-btn {
          display: inline-flex; align-items: center; gap: 0.75rem;
          font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--white); border: 1px solid rgba(255,255,255,0.5);
          padding: 0.6rem 1.2rem; background: none; cursor: pointer;
          transition: all 0.3s; font-family: 'Inter', sans-serif;
        }
        .itin-btn:hover { border-color: var(--gold); color: var(--gold); }
        .itin-custom-overlay {
          background: linear-gradient(to top, rgba(8,8,8,0.75) 0%, rgba(8,8,8,0.35) 55%, rgba(8,8,8,0.2) 100%) !important;
        }
        .itin-custom-title {
          font-size: 1.2rem !important;
        }

        /* ── SEE & DO — editorial split layout ── */
        .see-do { padding: 0; }

        .see-do-header {
          padding: 5rem 5rem 0;
          display: flex; flex-direction: column; align-items: center; text-align: center;
        }

        .see-do-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 600px;
          margin-top: 4rem;
        }

        .see-do-text {
          display: flex; flex-direction: column; justify-content: center;
          padding: 5rem 6rem 5rem 5rem;
        }

        .see-do-text .eyebrow {
          margin-bottom: 1.2rem;
        }

        .see-do-lead {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.5rem, 2.5vw, 2rem);
          font-weight: 300;
          line-height: 1.4;
          color: var(--white);
          margin-bottom: 1.8rem;
        }

        .see-do-lead em {
          font-style: italic;
          color: var(--gold-light);
        }

        .see-do-body {
          font-size: 0.88rem;
          line-height: 2;
          color: var(--cream-dim);
          margin-bottom: 1.4rem;
        }

        .see-do-enquire {
          font-family: 'Inter', sans-serif;
          font-size: 0.68rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          background: var(--gold);
          color: var(--dark);
          border: none;
          padding: 1rem 2.4rem;
          cursor: pointer;
          transition: background 0.3s;
          margin-top: 0.8rem;
          width: fit-content;
        }
        .see-do-enquire:hover { background: var(--gold-light); }

        .see-do-image {
          position: relative;
          overflow: hidden;
        }

        .see-do-image img {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
          transition: transform 0.8s ease;
        }
        .see-do-image:hover img { transform: scale(1.03); }

        /* gold accent line on image */
        .see-do-image::after {
          content: '';
          position: absolute;
          bottom: 2.5rem; left: -1.5rem;
          width: 40%; height: 40%;
          border: 1px solid rgba(201,168,76,0.35);
          pointer-events: none;
          z-index: 2;
        }

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

        /* INSPIRATION */
        .inspiration { padding: 7rem 5rem; }
        .gallery-grid { display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: auto auto; gap: 1rem; margin-top: 3rem; }
        .gallery-item { overflow: hidden; cursor: pointer; }
        .gallery-item:first-child { grid-column: span 2; grid-row: span 2; }
        .gallery-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.6s ease; min-height: 200px; }
        .gallery-item:hover .gallery-img { transform: scale(1.04); }

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
          .itineraries, .hotels, .inspiration, .more-dest { padding: 5rem 2rem; }
          .itinerary-cards, .hotels-grid, .more-grid { grid-template-columns: 1fr; }
          .gallery-grid { grid-template-columns: repeat(2,1fr); }
          .gallery-item:first-child { grid-column: span 2; grid-row: span 1; }
          .enquire-banner { flex-direction: column; gap: 3rem; padding: 5rem 2rem; align-items: flex-start; }
          .enquire-actions { align-items: flex-start; }
          .footer-main { grid-template-columns: 1fr 1fr; padding: 3rem 2rem 2rem; }
          .footer-bottom { flex-direction: column; gap: 1rem; padding: 1.5rem 2rem; }

          /* see-do responsive */
          .see-do-header { padding: 4rem 2rem 0; }
          .see-do-split { grid-template-columns: 1fr; }
          .see-do-text { padding: 3rem 2rem; }
          .see-do-image { min-height: 340px; }
          .see-do-image::after { display: none; }
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
        <h2 className="section-title">Example <em>{dest.name}</em> trips</h2>
        <div className="itinerary-cards">
          {[
            { nights: "2 Nights", title: "The Weekend Escape", image: dest.gallery[0] },
            { nights: "5 Nights", title: "The Deep Dive",      image: dest.gallery[1] },
          ].map((itin, i) => (
            <div className="itinerary-card" key={i}>
              <div className="itin-bg" style={{ backgroundImage: `url(${itin.image})` }} />
              <div className="itin-overlay" />
              <span className="itin-nights">{itin.nights}</span>
              <div className="itin-bottom">
                <h3 className="itin-title">{itin.title}</h3>
                <button className="itin-btn">Explore Trip →</button>
              </div>
            </div>
          ))}

          {/* CREATE YOUR OWN CARD */}
          <div className="itinerary-card itin-custom">
            <div className="itin-bg" style={{ backgroundImage: `url(${dest.gallery[2]})` }} />
            <div className="itin-overlay itin-custom-overlay" />
            <span className="itin-nights">Custom Trips</span>
            <div className="itin-bottom">
              <h3 className="itin-title itin-custom-title">Create Your Own Itinerary</h3>
              <button className="itin-btn">Create Trip →</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEE & DO — editorial split ── */}
      <section id="see-do" className="see-do">

        {/* centred heading block */}
        <div className="see-do-header">
          <p className="eyebrow" style={{ justifyContent: "center" }}>
            What to See &amp; Do
          </p>
          <h2 className="section-title" style={{ textAlign: "center" }}>
            Experience <em>{dest.name}</em>
          </h2>
        </div>

        {/* split: text left, image right */}
        <div className="see-do-split">

          <div className="see-do-text">
            <p className="eyebrow">Discover the Soul of {dest.name}</p>

            <p className="see-do-lead">
              A destination that rewards those who <em>linger</em>.
            </p>

            <p className="see-do-body">{dest.seeDo ?? dest.about}</p>

            <p className="see-do-body">
              Whether you're tracing centuries-old ramparts at dawn, watching sea turtles
              nest on moonlit shores, or losing yourself in the quiet lanes of the old
              fort — {dest.name} offers experiences that stay with you long after you leave.
              Let us craft a journey entirely around you.
            </p>

            <button className="see-do-enquire">Enquire Now</button>
          </div>

          <div className="see-do-image">
            <img
              src="/images/galle-beach-scaled.webp"
              alt={`Experience ${dest.name}`}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.background =
                  "linear-gradient(160deg,#1c1c1c,#111)";
                (e.currentTarget as HTMLImageElement).removeAttribute("src");
              }}
            />
          </div>

        </div>
      </section>

      {/* HOTELS */}
      <section id="hotels" className="hotels">
        <p className="eyebrow">Where to Stay</p>
        <h2 className="section-title">Hotels in <em>{dest.name}</em></h2>
        <div className="hotels-grid">
          {[
            { tag: "Boutique", name: "The Fort Residency", image: "/images/hotels/hotel1.jpg" },
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