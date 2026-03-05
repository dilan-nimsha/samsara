"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDestination, destinations } from "../data";



export default function DestinationPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const dest = getDestination(slug);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
  src: url('/fonts/pawana.ttf') format('truetype');
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
.nav-logo-text {
  font-family: 'inter';
  font-size: 1.6rem; font-weight: 400;
  letter-spacing: 0.3em; text-transform: uppercase; color: var(--white);
}
.nav-links { display: flex; gap: 2.5rem; list-style: none; }
.nav-links a {
  color: rgb(255, 255, 255);
  text-decoration: none;
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
        .hero {
          position: relative; height: 100vh; min-height: 600px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: flex-end;
          overflow: hidden;
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
          padding: 0 5rem 6rem;
          width: 100%;
          animation: fadeUp 1.2s ease both;
        }
        .hero-country {
          font-size: 0.7rem; letter-spacing: 0.4em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 1rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .hero-country::before {
          content: ''; display: inline-block;
          width: 30px; height: 1px; background: var(--gold);
        }
        .hero-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(4rem, 9vw, 8rem);
          font-weight: 300; line-height: 1;
          color: var(--white); margin-bottom: 1rem;
        }
        .hero-tagline {
          font-size: 0.9rem; letter-spacing: 0.1em;
          color: var(--cream-dim); max-width: 400px;
        }
          .about-sinhala {
  font-family: 'Pawana', sans-serif;
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  color: var(--cream-dim);
  letter-spacing: 0.2em;
  margin-top: 0.5rem;
}

        /* BREADCRUMB */
        .breadcrumb {
          padding: 1.5rem 5rem;
          display: flex; align-items: center; gap: 0.75rem;
          font-size: 0.65rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--cream-dim);
          border-bottom: 1px solid rgba(201,168,76,0.1);
        }
        .breadcrumb a { color: var(--cream-dim); text-decoration: none; transition: color 0.3s; }
        .breadcrumb a:hover { color: var(--gold); }
        .breadcrumb-sep { color: var(--gold-dim); }
        .breadcrumb-current { color: var(--gold); }

        /* ABOUT */
        .about {
          padding: 7rem 5rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6rem; align-items: center;
        }
        .eyebrow {
          font-size: 0.65rem; letter-spacing: 0.4em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 1.5rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .eyebrow::before {
          content: ''; display: inline-block;
          width: 30px; height: 1px; background: var(--gold);
        }
        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 300; line-height: 1.2;
          color: var(--white); margin-bottom: 2rem;
        }
        .section-title em { font-style: italic; color: var(--gold-light); }
        .body-text {
          font-size: 0.88rem; line-height: 2;
          color: var(--cream-dim); margin-bottom: 2rem;
        }
        .about-img {
          width: 100%; aspect-ratio: 4/5;
          object-fit: cover; display: block;
        }
        .enquire-btn {
          font-family: 'Inter', sans-serif;
          font-size: 0.7rem; letter-spacing: 0.22em;
          text-transform: uppercase;
          background: var(--gold); color: var(--dark);
          border: none; padding: 1rem 2.5rem;
          cursor: pointer; transition: background 0.3s;
          display: inline-block;
        }
        .enquire-btn:hover { background: var(--gold-light); }

        /* ACTIVITIES */
        .activities {
          padding: 7rem 5rem;
          background: var(--dark-2);
        }
        .activities-header { margin-bottom: 4rem; }
        .activities-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        .activity-card { position: relative; overflow: hidden; cursor: pointer; }
        .activity-img {
          width: 100%; aspect-ratio: 4/3;
          object-fit: cover; display: block;
          transition: transform 0.6s ease;
        }
        .activity-card:hover .activity-img { transform: scale(1.04); }
        .activity-img-ph {
          width: 100%; aspect-ratio: 4/3;
          background: linear-gradient(135deg, #1a1a1a, #111);
          display: block;
        }
        .activity-grad {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,8,8,0.9) 0%, transparent 60%);
        }
        .activity-info {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 1.8rem;
        }
        .activity-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem; font-weight: 300;
          color: rgba(201,168,76,0.3); line-height: 1;
          margin-bottom: 0.5rem;
        }
        .activity-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.4rem; font-weight: 300;
          color: var(--white); margin-bottom: 0.5rem;
        }
        .activity-desc {
          font-size: 0.75rem; line-height: 1.7;
          color: var(--cream-dim);
          opacity: 0; transform: translateY(8px);
          transition: all 0.4s ease;
        }
        .activity-card:hover .activity-desc {
          opacity: 1; transform: translateY(0);
        }

        /* GALLERY */
        .gallery { padding: 7rem 5rem; }
        .gallery-header { margin-bottom: 3rem; }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: auto auto;
          gap: 1rem;
        }
        .gallery-item { overflow: hidden; cursor: pointer; }
        .gallery-item:first-child {
          grid-column: span 2;
          grid-row: span 2;
        }
        .gallery-img {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
          transition: transform 0.6s ease;
          min-height: 200px;
        }
        .gallery-item:hover .gallery-img { transform: scale(1.04); }
        .gallery-img-ph {
          width: 100%; height: 100%; min-height: 200px;
          background: linear-gradient(135deg, #1a1a1a, #111);
          display: block;
        }

        /* ENQUIRE BANNER */
        .enquire-banner {
          padding: 7rem 5rem;
          background: var(--dark-2);
          display: flex; align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(201,168,76,0.1);
          border-bottom: 1px solid rgba(201,168,76,0.1);
        }
        .enquire-text {}
        .enquire-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 300; color: var(--white);
          margin-bottom: 1rem;
        }
        .enquire-title em { font-style: italic; color: var(--gold-light); }
        .enquire-sub {
          font-size: 0.85rem; line-height: 1.8;
          color: var(--cream-dim); max-width: 480px;
        }
        .enquire-actions {
          display: flex; flex-direction: column;
          align-items: flex-end; gap: 1rem;
        }
        .btn-gold-lg {
          font-family: 'Inter', sans-serif;
          font-size: 0.7rem; letter-spacing: 0.25em;
          text-transform: uppercase;
          background: var(--gold); color: var(--dark);
          border: none; padding: 1.2rem 3rem;
          cursor: pointer; transition: background 0.3s;
        }
        .btn-gold-lg:hover { background: var(--gold-light); }
        .enquire-note {
          font-size: 0.65rem; letter-spacing: 0.1em;
          color: var(--cream-dim);
        }

        /* MORE DESTINATIONS */
        .more-dest { padding: 7rem 5rem; }
        .more-header { margin-bottom: 3rem; }
        .more-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .more-card {
          position: relative; overflow: hidden;
          cursor: pointer; text-decoration: none;
          display: block;
        }
        .more-img {
          width: 100%; aspect-ratio: 3/2;
          object-fit: cover; display: block;
          transition: transform 0.6s ease;
        }
        .more-card:hover .more-img { transform: scale(1.04); }
        .more-img-ph {
          width: 100%; aspect-ratio: 3/2;
          background: linear-gradient(135deg, #1a1a1a, #111);
          display: block;
        }
        .more-grad {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,8,8,0.85) 0%, transparent 60%);
        }
        .more-info {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 1.5rem;
        }
        .more-country {
          font-size: 0.6rem; letter-spacing: 0.25em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 0.3rem;
        }
        .more-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem; font-weight: 300; color: var(--white);
        }
        .more-arrow {
          position: absolute; top: 1rem; right: 1rem;
          color: var(--gold); font-size: 1rem;
          opacity: 0; transform: translateX(-5px);
          transition: all 0.3s;
        }
        .more-card:hover .more-arrow { opacity: 1; transform: translateX(0); }

        /* FOOTER */
        footer {
          background: var(--dark-2);
          border-top: 1px solid rgba(201,168,76,0.1);
        }
        .footer-main {
          padding: 5rem 5rem 3rem;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 3rem;
        }
        .footer-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.6rem; font-weight: 300;
          letter-spacing: 0.25em; text-transform: uppercase;
          color: var(--gold-light); margin-bottom: 1rem; display: block;
        }
        .footer-tagline {
          font-size: 0.8rem; line-height: 1.9;
          color: var(--cream-dim); max-width: 260px;
        }
        .footer-col-title {
          font-size: 0.65rem; letter-spacing: 0.3em;
          text-transform: uppercase; color: var(--gold); margin-bottom: 1.5rem;
        }
        .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 0.8rem; }
        .footer-col ul a {
          font-size: 0.8rem; color: var(--cream-dim);
          text-decoration: none; transition: color 0.3s;
        }
        .footer-col ul a:hover { color: var(--gold-light); }
        .footer-bottom {
          border-top: 1px solid rgba(201,168,76,0.08);
          padding: 1.5rem 5rem;
          display: flex; align-items: center; justify-content: space-between;
        }
        .footer-copy { font-size: 0.65rem; color: var(--cream-dim); }
        .footer-bottom-links { display: flex; gap: 2rem; list-style: none; }
        .footer-bottom-links a {
          font-size: 0.65rem; letter-spacing: 0.15em;
          text-transform: uppercase; color: var(--cream-dim);
          text-decoration: none; transition: color 0.3s;
        }
        .footer-bottom-links a:hover { color: var(--gold); }

        /* ANIMATIONS */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(25px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .about { grid-template-columns: 1fr; padding: 5rem 2rem; gap: 3rem; }
          .activities { padding: 5rem 2rem; }
          .activities-grid { grid-template-columns: 1fr; }
          .gallery { padding: 5rem 2rem; }
          .gallery-grid { grid-template-columns: repeat(2,1fr); }
          .gallery-item:first-child { grid-column: span 2; grid-row: span 1; }
          .more-dest { padding: 5rem 2rem; }
          .more-grid { grid-template-columns: 1fr; }
          .enquire-banner { flex-direction: column; gap: 3rem; padding: 5rem 2rem; align-items: flex-start; }
          .enquire-actions { align-items: flex-start; }
          .footer-main { grid-template-columns: 1fr 1fr; padding: 3rem 2rem 2rem; }
          .footer-bottom { flex-direction: column; gap: 1rem; padding: 1.5rem 2rem; }
          .navbar, .navbar.scrolled { padding: 1.2rem 2rem; }
          .nav-links { display: none; }
          .hero-content { padding: 0 2rem 4rem; }
          .breadcrumb { padding: 1.5rem 2rem; }
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
          <li><a href="/#about">About</a></li>
        </ul>
        <button className="nav-cta">Enquire Now</button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div
          className="hero-bg"
          style={{
            backgroundImage: `url(${dest.heroImage})`,
            ["--scroll" as string]: `${scrollY}px`,
          }}
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-country">{dest.country}</p>
          <h1 className="hero-name">{dest.name}</h1>
<p style={{ color: '#D4AA00', fontFamily: 'PWN pawana' }}>
  {dest.sinhala}
</p>
          <p className="hero-tagline">{dest.tagline}</p>
        </div>
      </section>

      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <a href="/">Home</a>
        <span className="breadcrumb-sep">→</span>
        <a href="/#destinations">Destinations</a>
        <span className="breadcrumb-sep">→</span>
        <span className="breadcrumb-current">{dest.name}</span>
      </div>

      {/* ABOUT */}
      <section className="about">
        <div>
          <p className="eyebrow">About {dest.name}</p>
          <h2 className="section-title">
            A Place That<br /><em>Stays With You</em>
          </h2>
          <p className="body-text">{dest.about}</p>
          <button className="enquire-btn">Plan My Journey</button>
        </div>
        <div>
          <img
            src={dest.heroImage}
            alt={dest.name}
            className="about-img"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </div>
      </section>

      {/* ACTIVITIES */}
      <section className="activities">
        <div className="activities-header">
          <p className="eyebrow">Experiences</p>
          <h2 className="section-title">
            Things to Do in <em>{dest.name}</em>
          </h2>
        </div>
        <div className="activities-grid">
          {dest.activities.map((act, i) => (
            <div className="activity-card" key={i}>
              <img
                src={act.image}
                alt={act.title}
                className="activity-img"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <div className="activity-grad" />
              <div className="activity-info">
                <p className="activity-num">0{i + 1}</p>
                <h3 className="activity-title">{act.title}</h3>
                <p className="activity-desc">{act.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GALLERY */}
      <section className="gallery">
        <div className="gallery-header">
          <p className="eyebrow">Gallery</p>
          <h2 className="section-title"><em>{dest.name}</em> Through Our Eyes</h2>
        </div>
        <div className="gallery-grid">
          {dest.gallery.map((img, i) => (
            <div className="gallery-item" key={i}>
              <img
                src={img}
                alt={`${dest.name} ${i + 1}`}
                className="gallery-img"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ENQUIRE BANNER */}
      <section className="enquire-banner">
        <div className="enquire-text">
          <h2 className="enquire-title">
            Ready to Discover<br /><em>{dest.name}?</em>
          </h2>
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
        <div className="more-header">
          <p className="eyebrow">Keep Exploring</p>
          <h2 className="section-title">Discover More <em>Destinations</em></h2>
        </div>
        <div className="more-grid">
          {dest.more.map((m, i) => (
            <a href={`/destinations/${m.slug}`} className="more-card" key={i}>
              <img
                src={m.image}
                alt={m.name}
                className="more-img"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
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