"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const destinations = [
    { name: "Galle", country: "Doen South", tag: "Coastal Luxury", image: "/images/dest-1.webp" },
    { name: "Ella", country: "The Hill Country", tag: "Island Escape", image: "/images/dest-2.webp" },
    { name: "Unawatuna", country: "Down South", tag: "Coastal Luxury", image: "/images/dest-3.webp" },
    { name: "Sigiriya", country: "The Hill Country", tag: "Wild Escape", image: "/images/dest-4.webp" },
    { name: "Pollonnaruwa", country: "The Ancient Kingdoms", tag: "The Royals", image: "/images/dest-5.webp" },
  ];

  const trips = [
  { title: "Into the Wild", duration: "10 Days", type: "Nature", image: "/images/trip-1.webp", description: "Some places don't just take your breath away — they give it back. Into the Wild journeys are crafted for souls who find themselves most alive when surrounded by nature's purest form." },
  { title: "Capital, Costal & Hill", duration: "8 Days", type: "Adventure", image: "/images/trip-2.webp", description: "From bustling capitals to serene coastlines and misty hills — a journey of contrasts." },
  { title: "Lost & Found", duration: "12 Days", type: "Expedition", image: "/images/trip-3.webp", description: "Venture into the unknown and discover the parts of yourself only travel can reveal." },
  { title: "See You In the Moment", duration: "7 Days", type: "Slow Travel", image: "/images/trip-4.webp", description: "Slow down, breathe in and let each moment unfold without rush or agenda." },
];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Inter:wght@300;400;500;600;700&display=swap');

        :root {
          --gold: #ffffff;
          --gold-light: #ffffff;
          --gold-dim: #6b5520;
          --dark: #080808;
          --dark-2: #0f0f0f;
          --dark-3: #161616;
          --cream: #F2EDE4;
          --cream-dim: #a89f92;
          --white: #ffffff;
        }

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          background: var(--dark);
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-weight: 400;
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

        /* VIDEO HERO */
        .hero {
          position: relative; height: 100vh; min-height: 650px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; overflow: hidden;
        }
        .hero-video {
          position: absolute; inset: 0;
          width: 100%; height: 100%; object-fit: cover; object-position: center;
        }
        .hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(8,8,8,0.3) 0%, rgba(8,8,8,0.25) 50%, rgba(8,8,8,0.75) 100%);
        }
        .hero-content {
          position: relative; z-index: 2; text-align: center;
          animation: fadeUp 1.4s ease both;
        }
        .hero-logo-img {
          height: 100px; width: auto; object-fit: contain;
          margin-bottom: 1.5rem; filter: brightness(0) invert(1);
          display: block; margin-left: auto; margin-right: auto;
        }
        .hero-brand {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(3.5rem, 9vw, 7.5rem); font-weight: 300;
          letter-spacing: 0.25em; text-transform: uppercase; color: var(--white); line-height: 1; margin-bottom: 1rem;
        }
        .hero-tagline {
          font-size: 0.75rem; letter-spacing: 0.35em; text-transform: uppercase;
          color: rgba(255,255,255,0.65); margin-bottom: 3rem;
        }
        .hero-actions { display: flex; align-items: center; justify-content: center; gap: 2rem; }
        .btn-gold {
          font-family: 'Jost', sans-serif; font-size: 0.7rem;
          letter-spacing: 0.22em; text-transform: uppercase;
          background: var(--gold); color: var(--dark); border: none;
          padding: 1rem 2.8rem; cursor: pointer; transition: background 0.3s;
        }
        .btn-gold:hover { background: var(--gold-light); }
        .btn-outline {
          font-family: 'Jost', sans-serif; font-size: 0.7rem;
          letter-spacing: 0.22em; text-transform: uppercase;
          background: transparent; color: var(--white);
          border: 1px solid rgba(255,255,255,0.35);
          padding: 1rem 2.8rem; cursor: pointer; transition: all 0.3s;
        }
        .btn-outline:hover { border-color: var(--gold); color: var(--gold); }
        .hero-scroll {
          position: absolute; bottom: 2.5rem; left: 50%; transform: translateX(-50%);
          z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 0.6rem;
          animation: fadeUp 2s 0.8s ease both;
        }
        .hero-scroll span { font-size: 0.6rem; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(255,255,255,0.5); }
        .scroll-dot { width: 1px; height: 50px; background: linear-gradient(to bottom, var(--gold), transparent); animation: pulse 2s ease-in-out infinite; }

        /* MARQUEE */
        .marquee { background: var(--gold); padding: 0.85rem 0; overflow: hidden; white-space: nowrap; }
        .marquee-track { display: inline-flex; animation: marquee 25s linear infinite; }
        .marquee-item {
          font-size: 0.62rem; letter-spacing: 0.3em; text-transform: uppercase;
          color: var(--dark); font-family: 'Jost', sans-serif; font-weight: 400;
          padding: 0 2.5rem; display: flex; align-items: center; gap: 2.5rem;
        }
        .marquee-item::after { content: '✦'; font-size: 0.45rem; }

        /* ABOUT */
        .about {
          padding: 9rem 10rem; display: grid;
          grid-template-columns: 1.2fr 1fr; gap: 6rem; align-items: center;
        }
        .eyebrow {
          font-size: 0.65rem; letter-spacing: 0.4em; text-transform: uppercase; color: var(--gold);
          margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem;
        }
        .eyebrow::before { content: ''; display: inline-block; width: 30px; height: 1px; background: var(--gold); }
        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.2rem, 4vw, 3.5rem); font-weight: 300;
          line-height: 1.18; color: var(--white); margin-bottom: 2rem;
        }
        .section-title em { font-style: italic; color: var(--gold-light); }
        .body-text { font-size: 0.9rem; line-height: 2; color: var(--cream-dim); margin-bottom: 1.4rem; }
        .text-link {
          display: inline-flex; align-items: center; gap: 0.75rem;
          font-size: 0.7rem; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--gold); text-decoration: none; margin-top: 1rem; transition: gap 0.3s;
        }
        .text-link:hover { gap: 1.25rem; }
        .about-image-col { position: relative; }
        .about-img { width: 100%; aspect-ratio: 4/5; object-fit: cover; display: block; }
        .about-gold-line {
          position: absolute; bottom: -2rem; left: -2rem;
          width: 55%; height: 55%; border: 1px solid var(--gold-dim); z-index: -1;
        }

        /* DESTINATIONS */
        .destinations { padding: 8rem 5rem; background: var(--dark-2); }
        .section-header { text-align: center; margin-bottom: 4rem; }
        .dest-grid { display: flex; gap: 1.2rem; height: 520px; }
        .dest-card {
          position: relative; overflow: hidden; cursor: pointer; flex: 1;
          transition: flex 0.6s cubic-bezier(0.4,0,0.2,1);
        }
        
        .dest-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.7s ease; }
        .dest-card:hover .dest-img { transform: scale(1.05); }
        .dest-img-ph { width: 100%; height: 100%; background: linear-gradient(160deg,#1c1c1c,#111,#181818); }
        .dest-grad { position: absolute; inset: 0; background: linear-gradient(to top, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.1) 60%, transparent 100%); }
        
        .dest-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 2rem 1.8rem; }
        .dest-tag { font-size: 0.58rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.4rem; }
        .dest-name { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 300; color: var(--white); line-height: 1.1; }
        .dest-country { font-size: 0.7rem; letter-spacing: 0.15em; color: var(--cream-dim); margin-top: 0.2rem; }
        .dest-arrow {
          position: absolute; top: 1.5rem; right: 1.5rem;
          width: 36px; height: 36px; border: 1px solid rgba(201,168,76,0.4);
          display: flex; align-items: center; justify-content: center; color: var(--gold);
          opacity: 0; transform: translateY(-6px); transition: all 0.4s;
        }
        .dest-card:hover .dest-arrow { opacity: 1; transform: translateY(0); }

        /* EXPLORE TRIPS */
        .explore { padding: 8rem 5rem; }
        .explore-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 4rem; }
        .trips-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
        .trip-card { position: relative; overflow: hidden; cursor: pointer; }
        .trip-img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; transition: transform 0.6s ease; }
        .trip-card:hover .trip-img { transform: scale(1.06); }
        .trip-img-ph { width: 100%; aspect-ratio: 3/4; background: linear-gradient(160deg,#181818,#0f0f0f); display: block; }
        .trip-grad { position: absolute; inset: 0; background: linear-gradient(to top, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.05) 55%); }
        .trip-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 1.8rem; }
        .trip-type { font-size: 0.58rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.4rem; }
        .trip-title { font-family: 'Cormorant Garamond', serif; font-size: 1.35rem; font-weight: 300; color: var(--white); line-height: 1.2; margin-bottom: 0.5rem; }
        .trip-meta { font-size: 0.65rem; letter-spacing: 0.15em; color: var(--cream-dim); display: flex; align-items: center; gap: 0.75rem; }
        .trip-meta::before { content: ''; display: inline-block; width: 18px; height: 1px; background: var(--gold-dim); }
        .trip-hover-btn {
          position: absolute; bottom: 1.8rem; right: 1.8rem;
          font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold);
          opacity: 0; transform: translateX(8px); transition: all 0.4s;
        }
        .trip-card:hover .trip-hover-btn { opacity: 1; transform: translateX(0); }
        .trip-description {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  background: rgba(8,8,8,0.75);
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: 2;
}
.trip-description p {
  font-size: 1.2rem;
  line-height: 1.8;
  color: var(--white);
  font-family: 'Inter', sans-serif;
}
.trip-card:hover .trip-description {
  opacity: 1;
}
.trip-card:hover .trip-info {
  opacity: 0;
}

        /* QUOTE */
        .quote-section { position: relative; min-height: 55vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .quote-bg {
          position: absolute; inset: 0;
          background-image: url('/images/quote-bg.jpg');
          background-size: cover; background-position: center; background-attachment: fixed;
        }
        .quote-overlay { position: absolute; inset: 0; background: rgba(8,8,8,0.72); }
        .quote-content { position: relative; z-index: 2; text-align: center; padding: 6rem 12rem; max-width: 1000px; }
        .quote-mark { font-family: 'Cormorant Garamond', serif; font-size: 6rem; line-height: 0.5; color: var(--gold); opacity: 0.4; display: block; margin-bottom: 2rem; }
        .quote-text { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.6rem, 3.5vw, 2.8rem); font-weight: 300; font-style: italic; line-height: 1.5; color: var(--white); margin-bottom: 2rem; }
        .quote-attr { font-size: 0.65rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); }

        /* FOOTER */
        footer { background: var(--dark-2); border-top: 1px solid rgba(201,168,76,0.1); }
        .footer-main { padding: 6rem 5rem 4rem; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 4rem; }
        .footer-logo-text { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 300; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold-light); margin-bottom: 1.2rem; display: block; }
        .footer-tagline { font-size: 0.8rem; line-height: 1.9; color: var(--cream-dim); max-width: 280px; margin-bottom: 2rem; }
        .footer-socials { display: flex; gap: 1rem; }
        .social-btn { width: 36px; height: 36px; border: 1px solid var(--gold-dim); display: flex; align-items: center; justify-content: center; color: var(--cream-dim); font-size: 0.75rem; cursor: pointer; background: none; transition: all 0.3s; }
        .social-btn:hover { border-color: var(--gold); color: var(--gold); }
        .footer-col-title { font-size: 0.65rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); margin-bottom: 1.8rem; }
        .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 0.9rem; }
        .footer-col ul a { font-size: 0.8rem; letter-spacing: 0.05em; color: var(--cream-dim); text-decoration: none; transition: color 0.3s; }
        .footer-col ul a:hover { color: var(--gold-light); }
        .footer-bottom { border-top: 1px solid rgba(201,168,76,0.08); padding: 1.8rem 5rem; display: flex; align-items: center; justify-content: space-between; }
        .footer-copy { font-size: 0.65rem; letter-spacing: 0.12em; color: var(--cream-dim); }
        .footer-bottom-links { display: flex; gap: 2rem; list-style: none; }
        .footer-bottom-links a { font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--cream-dim); text-decoration: none; transition: color 0.3s; }
        .footer-bottom-links a:hover { color: var(--gold); }

        /* ANIMATIONS */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }

        /* RESPONSIVE */
        @media (max-width: 1200px) {
          .about { padding: 7rem 5rem; gap: 4rem; }
          .footer-main { grid-template-columns: 1fr 1fr; gap: 3rem; }
          .trips-grid { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width: 900px) {
          .navbar, .navbar.scrolled { padding: 1.2rem 2rem; }
          .nav-links { display: none; }
          .about { grid-template-columns: 1fr; padding: 5rem 2rem; }
          .destinations, .explore { padding: 5rem 2rem; }
          .dest-grid { flex-direction: column; height: auto; }
          .dest-card { flex: none !important; height: 280px; }
          .explore-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
          .quote-content { padding: 4rem 2rem; }
          .footer-main { grid-template-columns: 1fr; padding: 4rem 2rem 2rem; }
          .footer-bottom { flex-direction: column; gap: 1rem; padding: 1.5rem 2rem; }
        }
        @media (max-width: 600px) {
          .trips-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className={`navbar ${scrollY > 60 ? "scrolled" : ""}`}>
       <a href="/" className="nav-logo">
  <img src="/images/navbar logo.png" alt="Samsara" style={{ height: "45px", width: "auto" }} />
</a>
        <ul className="nav-links">
          <li><a href="#destinations">Destinations</a></li>
          <li><a href="#explore">Experiences</a></li>
          <li><a href="#about">About</a></li>
        </ul>
        <button className="nav-cta">Enquire Now</button>
      </nav>

      {/* VIDEO HERO */}
      <section className="hero">
        {/*
          ▶ Place your video at: public/videos/hero.mp4
          ▶ For best results: compress to under 15MB, 1920×1080, H.264
          ▶ Optionally add a poster image at: public/images/hero-poster.jpg
             (this shows before the video loads)
        */}
        <video className="hero-video" autoPlay muted loop playsInline poster="/images/hero-poster.jpg" preload="auto">
          <source src="/videos/hero.mp4" type="video/mp4" />
          <source src="/videos/hero.webm" type="video/webm" />
        </video>
        <div className="hero-overlay" />
        <div className="hero-content">
          <img src="/images/logo.png" alt="Samsara" className="hero-logo-img"/>
        </div>
        <div className="hero-scroll">
          <div className="scroll-dot" />
          <span>Scroll</span>
        </div>
      </section>


      {/* ABOUT */}
      <section className="about" id="about">
        <div>
          <p className="eyebrow">The Art of Travel</p>
          <h2 className="section-title">Experience <br /><em>Life</em> and <em>Love.</em> </h2>
          <p className="body-text">
            Samsara was born from a simple but radical belief: that travel, at its finest,
            is not merely movement between places — it is a transformation of the self.
            We exist for those who seek not just destinations, but encounters that linger.
          </p>
          <p className="body-text">
            Samsara teaches about life through the lens of travel. We curate journeys that awaken the senses, stir the soul, 
            and connect you to the world in profound ways. Each experience is a chapter in your story, crafted with care and intention.
          </p>
          <a href="#" className="text-link">Discover Our Philosophy →</a>
        </div>
        <div className="about-image-col">
          <img src="/images/about.webp" alt="About Samsara" className="about-img"
            onError={(e) => {
              e.currentTarget.style.background = "#1a1a1a";
              e.currentTarget.style.minHeight = "500px";
            }}
          />
        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="destinations" id="destinations">
        <div className="section-header">
          <h2 className="section-title">Destinations That <em>Inspire</em></h2>
        </div>
        <div className="dest-grid">
          {destinations.map((dest, i) => (
            <div className="dest-card" key={i}>
              <img src={dest.image} alt={dest.name} className="dest-img"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <div className="dest-grad" />
              <div className="dest-arrow">↗</div>
              <div className="dest-info">
                <p className="dest-tag">{dest.tag}</p>
                <h3 className="dest-name">{dest.name}</h3>
                <p className="dest-country">{dest.country}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

     {/* EXPLORE TRIPS */}
<section className="explore" id="explore">
  <div className="explore-header">
    <div>
      <p className="eyebrow">Explore Our Trips</p>
      <h2 className="section-title">Journeys <em>Crafted</em><br />for the Curious</h2>
    </div>
    <button className="btn-outline">View All Trips</button>
  </div>
  <div className="trips-grid">
    {trips.map((trip, i) => (
     <div className="trip-card" key={i}>
  <img src={trip.image} alt={trip.title} className="trip-img"
    onError={(e) => { e.currentTarget.style.display = "none"; }}
  />
  <div className="trip-grad" />
  <div className="trip-description">
    <p>{trip.description}</p>
  </div>
  <div className="trip-info">
    <p className="trip-type">{trip.type}</p>
    <h3 className="trip-title">{trip.title}</h3>
    <p className="trip-meta">{trip.duration}</p>
  </div>
  <span className="trip-hover-btn">Explore →</span>
</div>
    ))}
  </div>
</section>

      {/* QUOTE */}
      <section className="quote-section">
        {/* Add an atmospheric image at: public/images/quote-bg.jpg */}
        <div className="quote-bg" />
        <div className="quote-overlay" />
        <div className="quote-content">
          <span className="quote-mark">"</span>
          <p className="quote-text">
            You will not see the world the same way after letting Samsara show you the beauty of its silence.
          </p>
          <p className="quote-attr">— A Samsara Traveller, Patagonia</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="footer">
        <div className="footer-main">
          <div>
            <span className="footer-logo-text">Samsara</span>
            <p className="footer-tagline">Crafting bespoke travel experiences for the discerning few. Every journey, a reflection of your desire.</p>
            <div className="footer-socials">
              {["In","Fb","Ig","Yt"].map((s) => (<button className="social-btn" key={s}>{s}</button>))}
            </div>
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
            <ul>{["About Us","Our Philosophy","Press","Careers","Contact"].map(l => (<li key={l}><a href="#">{l}</a></li>))}</ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">© 2025 Samsara. All rights reserved.</p>
          <ul className="footer-bottom-links">
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms</a></li>
            <li><a href="#">Cookies</a></li>
          </ul>
        </div>
      </footer>
    </>
  );
}