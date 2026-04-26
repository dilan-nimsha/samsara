"use client";

import { getRegion } from "../data";
import { useParams } from "next/navigation";
import { useRef } from "react";

export default function RegionPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const region = getRegion(slug);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = scrollLeft.current - (x - startX.current);
  };
  const onMouseUp = () => { isDragging.current = false; };

  if (!region) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inter:wght@200;300;400;500;600&display=swap');

        :root {
          --gold: #C9A84C;
          --gold-light: #E2C97E;
          --dark: #080808;
          --dark-2: #0f0f0f;
          --cream: #F2EDE4;
          --cream-dim: #a89f92;
          --white: #ffffff;
        }

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: var(--dark); color: var(--cream); font-family: 'Inter', sans-serif; font-weight: 300; }

        /* HERO */
        .region-hero {
          position: relative; height: 80vh; min-height: 520px;
          display: flex; align-items: flex-end; overflow: hidden;
        }
        .region-hero-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          transform: scale(1.04);
          transition: transform 8s ease;
        }
        .region-hero-grad {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.15) 60%);
        }
        .region-hero-content {
          position: relative; z-index: 2;
          padding: 0 6rem 5rem;
          animation: fadeUp 1s ease both;
        }
        .region-eyebrow {
          font-size: 0.62rem; letter-spacing: 0.45em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 1rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .region-eyebrow::before {
          content: ''; width: 40px; height: 1px;
          background: linear-gradient(to right, transparent, var(--gold));
        }
        .region-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(3rem, 7vw, 6rem);
          font-weight: 300; color: var(--white);
          line-height: 1; letter-spacing: 0.02em;
          margin-bottom: 1rem;
        }
        .region-tagline {
          font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--cream-dim);
        }

        /* ABOUT */
        .region-about {
          padding: 5rem 12rem;
          display: flex; flex-direction: column; align-items: center;
          text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          gap: 3rem;
        }
        .region-about-eyebrow {
          font-size: 0.62rem; letter-spacing: 0.45em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 0.6rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .region-about-eyebrow::before,
        .region-about-eyebrow::after { content: ''; width: 24px; height: 1px; background: var(--gold); }
        .region-about-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: 300; color: var(--white); line-height: 1.2;
        }
        .region-about-title em { font-style: italic; color: var(--gold-light); }
        .region-about-text {
          font-family: 'Inter', sans-serif; font-weight: 300;
          font-size: 0.95rem; line-height: 2; color: rgba(242,237,228,0.65);
          max-width: 60ch;
        }
        .region-about-stat {
          display: flex; flex-direction: row; gap: 4rem; justify-content: center;
        }
        .stat-item {
          display: flex; flex-direction: column; align-items: center;
          border-top: 1px solid rgba(201,168,76,0.25); padding-top: 1.5rem;
          min-width: 120px;
        }
        .stat-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.62rem; font-weight: 300; color: var(--gold-light); line-height: 1;
        }
        .stat-label {
          font-size: 0.62rem; letter-spacing: 0.3em; text-transform: uppercase;
          color: var(--cream-dim); margin-top: 0.5rem;
        }

        /* DESTINATIONS */
        .region-destinations {
          padding: 5rem 6rem 7rem;
        }
        .region-dest-header {
          margin-bottom: 3rem;
        }
        .region-dest-eyebrow {
          font-size: 0.62rem; letter-spacing: 0.45em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 0.8rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .region-dest-eyebrow::before {
          content: ''; width: 30px; height: 1px; background: var(--gold);
        }
        .region-dest-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.62rem, 3vw, 2.62rem);
          font-weight: 300; color: var(--white);
        }
        .region-dest-title em { font-style: italic; color: var(--gold-light); }

        /* DESTINATION CARDS */
        .dest-cards {
          display: flex; gap: 1rem; flex-wrap: wrap;
        }
        .dest-card {
          position: relative; overflow: hidden;
          text-decoration: none; display: block;
          flex: 0 0 calc(20% - 0.8rem);
          aspect-ratio: 3/4;
          cursor: pointer;
        }
        .dest-card.coming-soon { cursor: default; }
        .dest-card-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.7s ease;
        }
        .dest-card:hover .dest-card-img { transform: scale(1.06); }
        .dest-card.coming-soon:hover .dest-card-img { transform: none; }
        .dest-card-grad {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.1) 55%);
        }
        .dest-card.coming-soon .dest-card-grad {
          background: linear-gradient(to top, rgba(8,8,8,0.96) 0%, rgba(8,8,8,0.55) 100%);
        }
        .dest-card-arrow {
          position: absolute; top: 1rem; right: 1rem;
          width: 32px; height: 32px;
          border: 1px solid rgba(201,168,76,0.4);
          display: flex; align-items: center; justify-content: center;
          color: var(--gold); font-size: 0.9rem;
          opacity: 0; transform: translateY(-5px);
          transition: all 0.3s;
        }
        .dest-card:hover .dest-card-arrow { opacity: 1; transform: translateY(0); }
        .dest-card-info {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 1.4rem;
        }
        .dest-card-region {
          font-size: 0.58rem; letter-spacing: 0.25em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 0.35rem;
        }
        .dest-card-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.4rem; font-weight: 300; color: var(--white);
          line-height: 1.1; margin-bottom: 0.3rem;
        }
        .dest-card-tagline {
          font-size: 0.62rem; letter-spacing: 0.08em;
          color: rgba(242,237,228,0.55); line-height: 1.5;
        }
        .coming-soon-badge {
          position: absolute; top: 1rem; left: 1rem;
          font-size: 0.55rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--cream-dim); border: 1px solid rgba(255,255,255,0.15);
          padding: 0.25rem 0.6rem;
        }

        /* TRIP CARDS — matches Galle page */
        .region-trips { padding: 0; background: var(--dark-2); overflow: hidden; }
        .region-itin-layout {
          display: grid; grid-template-columns: 380px 1fr; min-height: 600px;
        }
        .region-itin-left {
          padding: 5rem 3rem 5rem 5rem;
          display: flex; flex-direction: column; justify-content: center;
          background: var(--dark-2);
          border-right: 1px solid rgba(201,168,76,0.08);
        }
        .region-itin-eyebrow {
          font-size: 0.62rem; letter-spacing: 0.4em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 1.5rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .region-itin-eyebrow::before { content: ''; width: 24px; height: 1px; background: var(--gold); }
        .region-itin-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.62rem, 2vw, 2.62rem);
          font-weight: 300; color: var(--white);
          line-height: 1.3; margin-bottom: 1.5rem;
        }
        .region-itin-desc {
          font-size: 0.88rem; line-height: 1.9; color: var(--cream-dim); margin-bottom: 2.5rem;
        }
        .region-itin-cta {
          font-family: 'Inter', sans-serif; font-size: 0.68rem; letter-spacing: 0.22em;
          text-transform: uppercase; background: var(--gold); color: var(--dark);
          border: none; padding: 0.9rem 2rem; cursor: pointer;
          transition: background 0.3s; width: fit-content;
        }
        .region-itin-cta:hover { background: var(--gold-light); }
        .region-scroll-wrap {
          overflow-x: auto; overflow-y: hidden;
          cursor: grab; scrollbar-width: none; user-select: none;
        }
        .region-scroll-wrap::-webkit-scrollbar { display: none; }
        .region-cards-row { display: flex; gap: 0; height: 600px; }
        .region-trip-card { position: relative; flex: 0 0 300px; overflow: hidden; cursor: pointer; }
        .region-trip-card-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          transition: transform 0.7s ease;
        }
        .region-trip-card:hover .region-trip-card-bg { transform: scale(1.06); }
        .region-trip-card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.2) 55%, rgba(8,8,8,0.05) 100%);
          transition: background 0.4s;
        }
        .region-trip-card:hover .region-trip-card-overlay {
          background: linear-gradient(to top, rgba(8,8,8,0.96) 0%, rgba(8,8,8,0.35) 55%, rgba(8,8,8,0.1) 100%);
        }
        .region-trip-nights {
          position: absolute; top: 1.2rem; right: 1.2rem;
          font-size: 0.62rem; letter-spacing: 0.25em; text-transform: uppercase;
          color: var(--white); font-family: 'Inter', sans-serif; font-weight: 500; z-index: 2;
        }
        .region-trip-bottom { position: absolute; bottom: 0; left: 0; right: 0; padding: 2rem 1.8rem; z-index: 2; }
        .region-trip-title {
          font-family: 'Inter', sans-serif; font-size: 0.88rem; font-weight: 400;
          color: var(--white); text-transform: uppercase;
          letter-spacing: 0.05em; line-height: 1.4; margin-bottom: 1.2rem;
        }
        .region-trip-desc {
          font-size: 0.82rem; line-height: 1.8; color: var(--cream-dim);
          font-family: 'Inter', sans-serif; font-weight: 300;
          max-height: 0; overflow: hidden; opacity: 0; margin: 0;
          transition: max-height 0.4s ease, opacity 0.4s ease, margin 0.4s ease;
        }
        .region-trip-card:hover .region-trip-desc { max-height: 120px; opacity: 1; margin: 0.8rem 0; }
        .region-trip-btn {
          display: inline-flex; align-items: center;
          font-size: 0.62rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--white); border: 1px solid rgba(255,255,255,0.5);
          padding: 0.6rem 1.2rem; background: none;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: border-color 0.3s, color 0.3s; position: relative; z-index: 4;
        }
        .region-trip-btn:hover { border-color: var(--gold); color: var(--gold); }

        /* INSPIRATIONS */
        .region-inspirations {
          background: var(--dark);
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 3rem 0 0;
        }
        .region-inspo-section-header {
          padding: 0 6rem 2rem;
        }
        .region-inspo-eyebrow {
          font-size: 0.62rem; letter-spacing: 0.45em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 0.8rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .region-inspo-eyebrow::before { content: ''; width: 30px; height: 1px; background: var(--gold); }
        .region-inspo-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.62rem, 3vw, 2.62rem);
          font-weight: 300; color: var(--white);
        }
        .region-inspo-title em { font-style: italic; color: var(--gold-light); }

        .inspo-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: stretch;
          gap: 0;
          border-top: 1px solid rgba(255,255,255,0.04);
          height: 30.9vw;
        }
        .inspo-row:last-child { border-bottom: 1px solid rgba(255,255,255,0.04); }
        .inspo-row-img-wrap {
          overflow: hidden;
          position: relative;
        }
        .inspo-row-img {
          width: 100%; height: 100%;
          object-fit: cover;
          object-position: bottom;
          display: block;
          transition: transform 0.9s ease;
        }
        .inspo-row:hover .inspo-row-img { transform: scale(1.03); }
        .inspo-row-text {
          padding: 2rem 4rem;
          display: flex; flex-direction: column; gap: 1.2rem;
          justify-content: center;
        }
        .inspo-row-tag {
          font-size: var(--text-xs); letter-spacing: 0.3em; text-transform: uppercase;
          color: var(--gold);
          display: inline-flex; align-items: center; gap: 0.6rem;
        }
        .inspo-row-tag::before { content: ''; width: 20px; height: 1px; background: var(--gold); }
        .inspo-row-caption {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.62rem, 2.8vw, 2.62rem);
          font-weight: 300; font-style: italic;
          color: var(--white); line-height: 1.3;
        }
        .inspo-row-body {
          font-family: 'Inter', sans-serif; font-size: var(--text-base);
          font-weight: 300; line-height: 2;
          color: rgba(242,237,228,0.55);
          max-width: 34ch;
        }
        .inspo-row-text.align-right {
          text-align: right; align-items: flex-end;
        }
        .inspo-row-text.align-right .inspo-row-tag {
          flex-direction: row-reverse;
        }
        .inspo-row-text.align-right .inspo-row-tag::before {
          display: none;
        }
        .inspo-row-text.align-right .inspo-row-tag::after {
          content: ''; width: 20px; height: 1px; background: var(--gold);
        }

        /* TESTIMONIALS */
        .region-testimonials {
          padding: 4rem 6rem;
          background: var(--dark-2);
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .region-test-header { margin-bottom: 2.5rem; text-align: center; }
        .region-test-eyebrow {
          font-size: 0.62rem; letter-spacing: 0.45em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 0.8rem;
          display: flex; align-items: center; justify-content: center; gap: 1rem;
        }
        .region-test-eyebrow::before,
        .region-test-eyebrow::after { content: ''; width: 30px; height: 1px; background: var(--gold); }
        .region-test-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.62rem, 3vw, 2.62rem);
          font-weight: 300; color: var(--white);
        }
        .region-test-title em { font-style: italic; color: var(--gold-light); }
        .region-test-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 0;
        }
        .test-card {
          padding: 1.5rem 2.5rem;
          display: flex; flex-direction: column; gap: 1.2rem;
          border-right: 1px solid rgba(255,255,255,0.06);
          text-align: center; align-items: center;
        }
        .test-card:last-child { border-right: none; }
        .test-quote-mark {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem; font-weight: 400; color: var(--gold);
          line-height: 1;
        }
        .test-quote {
          font-family: 'Inter', sans-serif;
          font-size: 0.72rem; font-weight: 600;
          color: var(--white); line-height: 1.85;
          text-transform: uppercase; letter-spacing: 0.06em;
          flex: 1;
        }
        .test-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem; font-weight: 300; font-style: italic;
          color: var(--gold-light); letter-spacing: 0.04em;
        }
        .test-detail {
          font-family: 'Inter', sans-serif; font-size: 0.62rem; font-weight: 300;
          color: var(--cream-dim); letter-spacing: 0.05em;
        }

        /* BACK LINK */
        .back-link {
          display: inline-flex; align-items: center; gap: 0.6rem;
          font-size: 0.68rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--cream-dim); text-decoration: none;
          transition: color 0.3s; padding: 5rem 6rem 0;
          font-family: 'Inter', sans-serif;
        }
        .back-link:hover { color: var(--gold); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1024px) {
          .region-hero-content, .region-about, .region-destinations, .region-trips, .back-link { padding-left: 3rem; padding-right: 3rem; }
          .region-about { grid-template-columns: 1fr; gap: 2rem; }
          .dest-card { flex: 0 0 calc(33.33% - 0.7rem); }
          .trip-card-v2 { flex: 0 0 calc(33.33% - 0.5rem); }
        }
        @media (max-width: 640px) {
          .region-hero-content { padding: 0 2rem 3rem; }
          .region-about, .region-destinations, .region-trips, .back-link { padding-left: 2rem; padding-right: 2rem; }
          .dest-card { flex: 0 0 calc(50% - 0.5rem); }
          .trip-cards-row { flex-wrap: wrap; }
          .trip-card-v2 { flex: 0 0 calc(50% - 0.4rem); }
        }
      `}</style>

      {/* HERO */}
      <section className="region-hero">
        <div
          className="region-hero-bg"
          style={{ backgroundImage: `url(${region.heroImage})` }}
        />
        <div className="region-hero-grad" />
        <div className="region-hero-content">
          <p className="region-eyebrow">Sri Lanka</p>
          <h1 className="region-title">{region.label}</h1>
          <p className="region-tagline">{region.description}</p>
        </div>
      </section>

      {/* BACK */}
      <a href="/destinations-page" className="back-link">← All Regions</a>

      {/* ABOUT */}
      <section className="region-about">
        <h2 className="region-about-title">
          The Soul of <em>{region.label}</em>
        </h2>
        <p className="region-about-text">{region.about}</p>
      </section>

      {/* TRIP CARDS — Galle style, trips first */}
      {region.trips.length > 0 && (
        <section className="region-trips">
          <div className="region-itin-layout">
            <div className="region-itin-left">
              <p className="region-itin-eyebrow">Example Trips</p>
              <h2 className="region-itin-title">Journeys Through {region.label}</h2>
              <p className="region-itin-desc">
                These journeys are simply suggestions for the kind of experience you might have across {region.label}.
                Yours will be tailored, altered, and refined until it matches you completely.
              </p>
              <button className="region-itin-cta">Build My Trip</button>
            </div>
            <div
              className="region-scroll-wrap"
              ref={scrollRef}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <div className="region-cards-row">
                {region.trips.map((trip, i) => (
                  <div className="region-trip-card" key={i}>
                    <div className="region-trip-card-bg" style={{ backgroundImage: `url(${trip.image})` }} />
                    <div className="region-trip-card-overlay" />
                    <span className="region-trip-nights">{trip.nights}</span>
                    <div className="region-trip-bottom">
                      <h3 className="region-trip-title">{trip.title}</h3>
                      <div className="region-trip-desc">{trip.desc}</div>
                      <button className="region-trip-btn">Explore Trip</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* INSPIRATIONS */}
      {region.inspirations && region.inspirations.length > 0 && (
        <section className="region-inspirations">
          <div className="region-inspo-section-header">
            <p className="region-inspo-eyebrow">Visual Journal</p>
            <h2 className="region-inspo-title">
              Glimpses of <em>{region.label}</em>
            </h2>
          </div>
          {region.inspirations.slice(0, 2).map((inspo, i) => (
            <div key={i} className="inspo-row">
              {i === 0 ? (
                <>
                  <div className="inspo-row-text align-right">
                    {inspo.tag && <p className="inspo-row-tag">{inspo.tag}</p>}
                    <p className="inspo-row-caption">
                      {inspo.caption.includes(' — ')
                        ? <>{inspo.caption.split(' — ')[0]}<br /><em>{inspo.caption.split(' — ')[1]}</em></>
                        : inspo.caption}
                    </p>
                    <p className="inspo-row-body">
                      Sri Lanka's {inspo.tag} is a place of quiet wonder — where every detail, every light, every moment tells a story worth living slowly.
                    </p>
                  </div>
                  <div className="inspo-row-img-wrap">
                    <img
                      src={inspo.image}
                      alt={inspo.caption}
                      className="inspo-row-img"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="inspo-row-img-wrap">
                    <img
                      src={inspo.image}
                      alt={inspo.caption}
                      className="inspo-row-img"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  <div className="inspo-row-text">
                    {inspo.tag && <p className="inspo-row-tag">{inspo.tag}</p>}
                    <p className="inspo-row-caption">
                      {inspo.caption.includes(' — ')
                        ? <>{inspo.caption.split(' — ')[0]}<br /><em>{inspo.caption.split(' — ')[1]}</em></>
                        : inspo.caption}
                    </p>
                    <p className="inspo-row-body">
                      Sri Lanka's {inspo.tag} is a place of quiet wonder — where every detail, every light, every moment tells a story worth living slowly.
                    </p>
                  </div>
                </>
              )}
            </div>
          ))}
        </section>
      )}

      {/* TESTIMONIALS */}
      {region.testimonials && region.testimonials.length > 0 && (
        <section className="region-testimonials">
          <div className="region-test-header">
            <p className="region-test-eyebrow">Traveler Stories</p>
            <h2 className="region-test-title">
              What Travelers Are <em>Saying</em>
            </h2>
          </div>
          <div className="region-test-grid">
            {region.testimonials.map((t, i) => (
              <div key={i} className="test-card">
                <div className="test-quote-mark">"</div>
                <p className="test-quote">{t.quote}</p>
                <p className="test-name">{t.name}</p>
                <p className="test-detail">{t.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DESTINATIONS */}
      <section className="region-destinations">
        <div className="region-dest-header">
          <p className="region-dest-eyebrow">Explore</p>
          <h2 className="region-dest-title">
            Destinations in <em>{region.label}</em>
          </h2>
        </div>
        <div className="dest-cards">
          {region.destinations.map((dest, i) => (
            dest.hasPage ? (
              <a key={i} href={`/destinations/${dest.slug}`} className="dest-card">
                <img src={dest.image} alt={dest.name} className="dest-card-img"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                <div className="dest-card-grad" />
                <div className="dest-card-arrow">↗</div>
                <div className="dest-card-info">
                  <p className="dest-card-region">{region.label}</p>
                  <h3 className="dest-card-name">{dest.name}</h3>
                  <p className="dest-card-tagline">{dest.tagline}</p>
                </div>
              </a>
            ) : (
              <div key={i} className="dest-card coming-soon">
                <img src={dest.image} alt={dest.name} className="dest-card-img"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                <div className="dest-card-grad" />
                <span className="coming-soon-badge">Coming Soon</span>
                <div className="dest-card-info">
                  <p className="dest-card-region">{region.label}</p>
                  <h3 className="dest-card-name">{dest.name}</h3>
                  <p className="dest-card-tagline">{dest.tagline}</p>
                </div>
              </div>
            )
          ))}
        </div>
      </section>
    </>
  );
}
