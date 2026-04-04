"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        .global-navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          padding: 1.8rem 5rem;
          display: flex; align-items: center; justify-content: space-between;
          transition: background 0.5s, padding 0.4s, border-color 0.5s;
          border-bottom: 1px solid transparent;
        }
        .global-navbar.scrolled {
          background: rgba(8,8,8,0.93);
          backdrop-filter: blur(16px);
          padding: 1.2rem 5rem;
          border-color: rgba(201,168,76,0.12);
        }
        .global-nav-logo { display: flex; align-items: center; text-decoration: none; }
        .global-nav-logo img { height: 45px; width: auto; object-fit: contain; }
        .global-nav-links { display: flex; gap: 2.5rem; list-style: none; margin: 0; padding: 0; }
        .global-nav-links a {
          color: #ffffff; text-decoration: none;
          font-size: 0.75rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
          transition: color 0.3s; position: relative;
          font-family: 'Inter', sans-serif;
        }
        .global-nav-links a::after {
          content: ''; position: absolute; bottom: -4px; left: 0;
          width: 0; height: 1px; background: #C9A84C; transition: width 0.3s;
        }
        .global-nav-links a:hover { color: #E2C97E; }
        .global-nav-links a:hover::after { width: 100%; }
        .global-nav-cta {
          font-family: 'Inter', sans-serif;
          font-size: 0.68rem; letter-spacing: 0.22em; text-transform: uppercase;
          background: #C9A84C; color: #080808;
          border: none; padding: 0.75rem 1.8rem;
          cursor: pointer; transition: background 0.3s;
        }
        .global-nav-cta:hover { background: #E2C97E; }
        @media (max-width: 768px) {
          .global-navbar, .global-navbar.scrolled { padding: 1.2rem 2rem; }
          .global-nav-links { display: none; }
        }
      `}</style>

      <nav className={`global-navbar${scrolled ? " scrolled" : ""}`}>
        <a href="/" className="global-nav-logo">
          <img
            src="/images/navbar logo.png"
            alt="Samsara"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </a>
        <ul className="global-nav-links">
          <li><a href="/destinations-page">Destinations</a></li>
          <li><a href="/#explore">Experiences</a></li>
          <li><a href="/feeling-engine">Feelings Engine</a></li>
          <li><a href="/#about">About</a></li>
        </ul>
        <button className="global-nav-cta">Enquire Now</button>
      </nav>
    </>
  );
}
