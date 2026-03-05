"use client";

import { useState, useEffect } from "react";

const regions = [
  {
    label: "The South",
    slug: "galle",
    image: "/images/dest-1.webp",
    description: "Ancient forts, whale watching & golden shores",
  },
  {
    label: "West Coast",
    slug: "negombo",
    image: "/images/west-coast.webp",
    description: "Lagoons, seafood & the gateway to the island",
  },
  {
    label: "Hill Country",
    slug: "ella",
    image: "/images/dest-2.webp",
    description: "Misty mountains, tea terraces & jungle trails",
  },
  {
    label: "The Ancient Cities",
    slug: "sigiriya",
    image: "/images/dest-4.webp",
    description: "Rock fortresses, sacred temples & lost kingdoms",
  },
  {
    label: "The East",
    slug: "trincomalee",
    image: "/images/east.webp",
    description: "Untouched beaches, surf & whale sharks",
  },
  {
    label: "Jaffna & The North",
    slug: "jaffna",
    image: "/images/jaffna.webp",
    description: "Cultural depth, Tamil heritage & raw beauty",
  },
];

export default function DestinationsPage() {
  const [hovered, setHovered] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        .nav-logo-text {
          font-family: 'inter';
          font-size: 1.6rem; font-weight: 400;
          letter-spacing: 0.3em; text-transform: uppercase; color: var(--white);
        }
        .nav-links { display: flex; gap: 2.5rem; list-style: none; }
        .nav-links a {
          color: rgb(255, 255, 255, 1); text-decoration: none;
          font-size: 0.80rem; letter-spacing: 0.1em; text-transform: uppercase;
          transition: color 0.3s; position: relative;
          font-family: 'Inter', sans-serif;
        }
        .nav-links a::after {
          content: ''; position: absolute; bottom: -4px; left: 0;
          width: 0; height: 1px; background: var(--gold); transition: width 0.3s;
        }
        .nav-links a:hover { color: var(--gold-light); }
        .nav-links a:hover::after { width: 100%; }
        .nav-cta {
            font-family: 'Jost', sans-serif;
            font-size: 0.68rem;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: #000000;
            border: none;
            padding: 0.65rem 1.6rem;
            background: #D4AA00;
            cursor: pointer;
            transition: all 0.3s;
}
.nav-cta:hover {
  background: var(--gold);
  color: var(--dark);
}
        /* HERO */
        .page-hero {
          height: 50vh; min-height: 400px;
          position: relative;
          display: flex; align-items: flex-end;
          overflow: hidden;
        }
        .page-hero-bg {
          position: absolute; inset: 0;
          background-image: url('/images/dest-1.webp');
          background-size: cover; background-position: center;
        }
        .page-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.3) 100%);
        }
        .page-hero-content {
          position: relative; z-index: 2;
          padding: 0 6rem 4rem;
          animation: fadeUp 1s ease both;
        }
        .page-eyebrow {
          font-size: 0.65rem; letter-spacing: 0.4em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 1rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .page-eyebrow::before {
          content: ''; display: inline-block;
          width: 30px; height: 1px; background: var(--gold);
        }
        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(3rem, 6vw, 5rem);
          font-weight: 300; color: var(--white); line-height: 1;
        }
        .page-title em { font-style: italic; color: var(--gold-light); }

        /* MAIN LAYOUT */
        .destinations-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 80vh;
        }

        /* LEFT - REGION LIST */
        .regions-list {
  padding: 8rem 6rem 4rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0;
  border-right: 1px solid rgba(201,168,76,0.1);
  overflow-y: auto;
}
        .region-item {
          display: flex; align-items: center;
          text-decoration: none;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: all 0.3s ease;
          cursor: pointer;
          gap: 1.5rem;
        }
        .region-item:last-child { border-bottom: none; }
        .region-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem; font-weight: 300;
          color: var(--gold-dim);
          min-width: 30px;
          transition: color 0.3s;
        }
        .region-text {}
        .region-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.8rem, 3vw, 2.8rem);
          font-weight: 300;
          color: rgba(255,255,255,0.4);
          line-height: 1.1;
          transition: all 0.3s ease;
          letter-spacing: 0.02em;
        }
        .region-desc {
          font-size: 0.72rem; letter-spacing: 0.1em;
          color: var(--cream-dim);
          margin-top: 0.2rem;
          opacity: 0;
          transform: translateX(-8px);
          transition: all 0.3s ease;
        }
        .region-arrow {
          margin-left: auto;
          color: var(--gold);
          font-size: 1.2rem;
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.3s ease;
        }
        .region-item:hover .region-name,
        .region-item.active .region-name {
          color: var(--white);
          padding-left: 0.5rem;
        }
        .region-item:hover .region-num,
        .region-item.active .region-num { color: var(--gold); }
        .region-item:hover .region-desc,
        .region-item.active .region-desc {
          opacity: 1; transform: translateX(0);
        }
        .region-item:hover .region-arrow,
        .region-item.active .region-arrow {
          opacity: 1; transform: translateX(0);
        }
           /* Destination Layout */
          .destinations-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100vh;
  overflow: hidden;
}

        /* RIGHT - IMAGE PREVIEW */
        .region-preview {
  position: relative;
  height: 100vh;
  overflow: hidden;
}
        .preview-img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: opacity 0.5s ease, transform 0.7s ease;
        }
        .preview-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to right, rgba(8,8,8,0.4) 0%, transparent 50%);
        }
        .preview-label {
          position: absolute;
          bottom: 4rem; left: 3rem;
          z-index: 2;
        }
        .preview-region {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem; font-weight: 300;
          color: var(--white); line-height: 1;
          margin-bottom: 0.5rem;
        }
        .preview-country {
          font-size: 0.65rem; letter-spacing: 0.3em;
          text-transform: uppercase; color: var(--gold);
        }

        /* ANIMATIONS */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .navbar, .navbar.scrolled { padding: 1.2rem 2rem; }
          .nav-links { display: none; }
          .page-hero-content { padding: 0 2rem 3rem; }
          .destinations-layout { grid-template-columns: 1fr; }
          .region-preview { display: none; }
          .regions-list { padding: 3rem 2rem; }
        }
      `}</style>

     
      {/* NAVBAR */}
      <nav className={`navbar ${scrollY > 60 ? "scrolled" : ""}`}>
       <a href="/" className="nav-logo">
  <img src="/images/navbar logo.png" alt="Samsara" style={{ height: "45px", width: "auto" }} />
</a>
        <ul className="nav-links">
          <li><a href="/destinations-page">Destinations</a></li>
          <li><a href="#explore">Experiences</a></li>
          <li><a href="#about">About</a></li>
        </ul>
        <button className="nav-cta">Enquire Now</button>
      </nav>

      {/* DESTINATIONS LAYOUT */}
      <div className="destinations-layout">
        {/* LEFT - REGION LIST */}
        <div className="regions-list">
          {regions.map((region, i) => (
            <a
              key={i}
              href={`/destinations/${region.slug}`}
              className={`region-item ${hovered === i ? "active" : ""}`}
              onMouseEnter={() => setHovered(i)}
            >
              <span className="region-num">0{i + 1}</span>
              <div className="region-text">
                <h2 className="region-name">{region.label}</h2>
                <p className="region-desc">{region.description}</p>
              </div>
              <span className="region-arrow">→</span>
            </a>
          ))}
        </div>

        {/* RIGHT - IMAGE PREVIEW */}
        <div className="region-preview">
          <img
            src={regions[hovered].image}
            alt={regions[hovered].label}
            className="preview-img"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <div className="preview-overlay" />
          <div className="preview-label">
            <h3 className="preview-region">{regions[hovered].label}</h3>
            <p className="preview-country">Sri Lanka</p>
          </div>
        </div>
      </div>

    </>
  );
}