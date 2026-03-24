"use client";

import { useState, useRef } from "react";

const systemPrompt = `You are Samsara's Feeling Curator — a poetic, deeply soulful luxury travel voice for Sri Lanka.

When a traveller tells you how they want to feel, or describes what they're looking for, you respond with a deeply personalised Sri Lanka journey concept.

Your response must follow this exact structure (use these exact labels on separate lines):

JOURNEY_TITLE: [A poetic 3-6 word title]
TAGLINE: [One single evocative sentence — what this journey promises]
DESCRIPTION: [2-3 sentences, poetic and personal, written directly to the traveller. No bullet points.]
DAYS: [A number only, e.g. 9]
DESTINATIONS: [Comma-separated list of 3-4 Sri Lankan places]
HIGHLIGHT: [One single unforgettable experience, written as a vivid moment, under 30 words]

Rules:
- Only Sri Lanka. Always luxury or boutique.
- Write like a poet who knows Sri Lanka intimately.
- Never be generic. Every response should feel written for this specific person.
- Keep DESCRIPTION under 60 words.
- Keep HIGHLIGHT under 30 words.
- If they mention a duration, use it. Otherwise choose the best duration.`;

const suggestions: string[] = [
  "I want to disappear into the jungle for a week",
  "Something spiritual and slow, just me and the mountains",
  "A honeymoon that feels like a dream we never wake from",
  "Wild nature, no crowds, complete silence",
  "I want to feel transformed by ancient history",
  "10 days somewhere no tourist has ever been",
];

type JourneyData = {
  title: string;
  tagline: string;
  description: string;
  days: string;
  destinations: string[];
  highlight: string;
};

function parseJourney(text: string): JourneyData {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const getValue = (key: string): string => {
    for (const line of lines) {
      if (line.toUpperCase().startsWith(key.toUpperCase() + ":")) {
        return line.substring(line.indexOf(":") + 1).trim();
      }
    }
    return "";
  };

  const destRaw = getValue("DESTINATIONS");
  const daysRaw = getValue("DAYS");
  const daysNum = daysRaw.match(/\d+/)?.[0] || "9";

  return {
    title: getValue("JOURNEY_TITLE") || getValue("TITLE") || "A Journey Awaits",
    tagline: getValue("TAGLINE"),
    description: getValue("DESCRIPTION"),
    days: daysNum,
    destinations: destRaw
      ? destRaw.split(",").map((d: string) => d.trim()).filter(Boolean)
      : [],
    highlight: getValue("HIGHLIGHT"),
  };
}

export default function FeelingEngine() {
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [journey, setJourney] = useState<JourneyData | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setJourney(null);
    setError(false);
    setSubmitted(true);

    try {
      const response = await fetch("/api/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt.trim() }],
        }),
      });

      const data = await response.json();
      const text: string = data.content?.[0]?.text || "";
      setJourney(parseJourney(text));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPrompt("");
    setJourney(null);
    setError(false);
    setSubmitted(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inter:wght@300;400;500&display=swap');

        :root {
          --gold: #C9A84C;
          --gold-light: #E2C97E;
          --gold-dim: rgba(201,168,76,0.15);
          --dark: #080808;
          --cream: #F2EDE4;
          --cream-dim: #a89f92;
          --white: #ffffff;
        }

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; overflow: hidden; }
        body {
          background: var(--dark);
          color: var(--cream);
          font-family: 'Inter', sans-serif;
          font-weight: 300;
        }

        /* BACKGROUND */
        .bg-layer { position: fixed; inset: 0; z-index: 0; }
        .bg-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%; object-fit: cover;
        }
        .bg-overlay {
          position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(
            to bottom,
            rgba(8,8,8,0.55) 0%,
            rgba(8,8,8,0.3) 30%,
            rgba(8,8,8,0.85) 100%
          );
        }
        .bg-grain {
          position: absolute; inset: 0; z-index: 2;
          opacity: 0.035; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        /* NAVBAR */
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          padding: 2rem 5rem;
          display: flex; align-items: center; justify-content: space-between;
        }
        .nav-logo { display: flex; align-items: center; text-decoration: none; }
        .nav-logo img { height: 45px; width: auto; }
        .nav-back {
          font-size: 0.68rem; letter-spacing: 0.22em;
          text-transform: uppercase; color: rgba(255,255,255,0.55);
          text-decoration: none; transition: color 0.3s;
        }
        .nav-back:hover { color: var(--gold); }

        /* PAGE LAYOUT */
        .page {
          position: fixed; inset: 0; z-index: 10;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 6rem 2rem 2rem;
        }
        .page.has-result {
          justify-content: flex-start;
          padding-top: 8rem;
          overflow-y: auto;
        }

        /* TOP SECTION */
        .top-section {
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          width: 100%; max-width: 760px;
          transition: all 0.6s cubic-bezier(0.4,0,0.2,1);
        }
        .top-section.compact { margin-bottom: 1.5rem; }

        .engine-eyebrow {
          font-size: 0.62rem; letter-spacing: 0.5em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 1.5rem;
          display: flex; align-items: center; gap: 1.2rem;
          animation: fadeUp 1s ease both;
        }
        .engine-eyebrow::before, .engine-eyebrow::after {
          content: ''; height: 1px; width: 50px;
        }
        .engine-eyebrow::before {
          background: linear-gradient(to right, transparent, rgba(201,168,76,0.6));
        }
        .engine-eyebrow::after {
          background: linear-gradient(to left, transparent, rgba(201,168,76,0.6));
        }

        .engine-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.8rem, 6vw, 5.5rem);
          font-weight: 300; color: var(--white);
          line-height: 1.05; margin-bottom: 1rem;
          animation: fadeUp 1s 0.15s ease both;
          letter-spacing: 0.01em;
          transition: font-size 0.5s ease;
        }
        .top-section.compact .engine-title {
          font-size: clamp(1.8rem, 3vw, 2.8rem);
          margin-bottom: 0.5rem;
        }
        .engine-title em { font-style: italic; color: var(--gold-light); }

        .engine-sub {
          font-size: 0.82rem; color: rgba(255,255,255,0.5);
          margin-bottom: 3rem;
          animation: fadeUp 1s 0.3s ease both;
          max-width: 460px; line-height: 1.9;
          transition: all 0.5s ease;
        }
        .top-section.compact .engine-sub { display: none; }

        /* INPUT */
        .input-section {
          width: 100%; max-width: 760px;
          animation: fadeUp 1s 0.5s ease both;
        }

        .input-box {
          position: relative;
          background: rgba(8,8,8,0.4);
          border: 1px solid rgba(255,255,255,0.15);
          backdrop-filter: blur(20px);
          transition: border-color 0.3s;
          border-radius: 16px;
          overflow: hidden;
        }
        .input-box:focus-within {
          border-color: rgba(201,168,76,0.5);
        }

        .prompt-textarea {
          width: 100%;
          background: transparent; border: none; outline: none;
          color: var(--white);
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1rem, 2vw, 1.3rem);
          font-weight: 300; font-style: italic;
          padding: 1.5rem 5rem 1.5rem 1.8rem;
          resize: none; line-height: 1.6;
          min-height: 70px;
          border-radius: 16px;
        }
        .prompt-textarea::placeholder {
          color: rgba(255,255,255,0.3);
          font-style: italic;
        }

        .send-btn {
          position: absolute; right: 1.2rem; bottom: 1.2rem;
          background: var(--gold); border: none;
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.3s;
          color: var(--dark); font-size: 1rem;
          border-radius: 4px;
        }
        .send-btn:hover { background: var(--gold-light); }
        .send-btn:disabled {
          background: rgba(201,168,76,0.25);
          cursor: not-allowed;
        }

        /* SUGGESTIONS */
        .suggestions {
          display: flex; gap: 0.6rem;
          flex-wrap: wrap; margin-top: 1rem;
          justify-content: center;
        }
        .suggestion-chip {
          font-size: 0.72rem; letter-spacing: 0.04em;
          color: rgba(255,255,255,0.45);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 0.45rem 1rem;
          cursor: pointer; transition: all 0.3s;
          backdrop-filter: blur(8px);
          font-family: 'Inter', sans-serif;
          border-radius: 4px;
        }
        .suggestion-chip:hover {
          color: var(--white);
          border-color: rgba(201,168,76,0.35);
          background: rgba(201,168,76,0.06);
        }

        /* RESULT PANEL */
        .result-panel {
          width: 100%; max-width: 1100px;
          margin-top: 2rem;
          background: linear-gradient(135deg, rgba(8,8,8,0.95), rgba(15,12,5,0.95));
          backdrop-filter: blur(28px);
          border: 1px solid rgba(201,168,76,0.18);
          padding: 2.5rem 3rem;
          animation: fadeUp 0.5s ease both;
          border-radius: 12px;
        }

        /* LOADING */
        .loading-state {
          display: flex; align-items: center; gap: 1.5rem;
          padding: 1rem 0;
        }
        .loading-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem; font-weight: 300;
          color: var(--cream-dim); font-style: italic;
        }
        .loading-dots { display: flex; gap: 0.4rem; align-items: center; }
        .loading-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--gold); opacity: 0.4;
          animation: dotBounce 1.2s ease-in-out infinite;
        }
        .loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dot:nth-child(3) { animation-delay: 0.4s; }

        /* JOURNEY RESULT */
        .journey-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 3rem;
        }
        .journey-meta {
          font-size: 0.6rem; letter-spacing: 0.38em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 0.7rem;
          display: flex; align-items: center; gap: 0.75rem;
        }
        .journey-meta::before {
          content: ''; width: 18px; height: 1px; background: var(--gold);
        }
        .journey-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.8rem, 3vw, 2.8rem);
          font-weight: 300; color: var(--white);
          line-height: 1.1; margin-bottom: 0.5rem;
        }
        .journey-tagline {
          font-size: 0.82rem; color: var(--cream-dim);
          font-style: italic; margin-bottom: 1.2rem; line-height: 1.7;
        }
        .journey-desc {
          font-size: 0.85rem; line-height: 1.9;
          color: rgba(255,255,255,0.65);
        }
        .highlight-label {
          font-size: 0.58rem; letter-spacing: 0.3em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 0.7rem;
        }
        .highlight-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.05rem; font-weight: 300;
          color: var(--white); line-height: 1.7;
          font-style: italic;
          border-left: 1px solid rgba(201,168,76,0.4);
          padding-left: 1.2rem;
          margin-bottom: 1.5rem;
        }
        .days-wrap {
          display: flex; align-items: baseline; gap: 0.4rem;
        }
        .days-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.5rem; font-weight: 300;
          color: var(--gold-light); line-height: 1;
        }
        .days-label {
          font-size: 0.62rem; letter-spacing: 0.25em;
          text-transform: uppercase; color: var(--cream-dim);
        }

        .journey-footer {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-top: 2rem; padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-wrap: wrap; gap: 1rem;
        }
        .journey-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .journey-tag {
          font-size: 0.58rem; letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--dark); background: var(--gold);
          padding: 0.28rem 0.75rem;
        }
        .footer-actions { display: flex; gap: 1rem; align-items: center; }
        .btn-enquire {
          font-family: 'Inter', sans-serif;
          font-size: 0.68rem; letter-spacing: 0.22em;
          text-transform: uppercase;
          background: var(--gold); color: var(--dark);
          border: none; padding: 0.85rem 2rem;
          cursor: pointer; transition: background 0.3s; white-space: nowrap;
        }
        .btn-enquire:hover { background: var(--gold-light); }
        .btn-reset {
          font-size: 0.62rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--cream-dim);
          background: none; border: none; cursor: pointer;
          transition: color 0.3s; font-family: 'Inter', sans-serif;
        }
        .btn-reset:hover { color: var(--white); }

        .user-prompt-display {
          font-size: 0.75rem; color: rgba(255,255,255,0.35);
          font-style: italic; margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .user-prompt-display span { color: rgba(255,255,255,0.55); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }

        @media (max-width: 768px) {
          .navbar { padding: 1.5rem 2rem; }
          .page { padding: 5rem 1.5rem 1.5rem; }
          .journey-grid { grid-template-columns: 1fr; gap: 1.5rem; }
          .result-panel { padding: 1.5rem; }
          .journey-footer { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      {/* BACKGROUND */}
      <div className="bg-layer">
        <img
          src="/images/feeling-bg.webp"
          alt="Sri Lanka"
          className="bg-img"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
        <div className="bg-overlay" />
        <div className="bg-grain" />
      </div>

      {/* NAVBAR */}
      <nav className="navbar">
        <a href="/" className="nav-logo">
          <img
            src="/images/navbar logo.png"
            alt="Samsara"
            style={{ height: "45px", width: "auto" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </a>
        <a href="/" className="nav-back">← Back to Samsara</a>
      </nav>

      {/* MAIN */}
      <div className={`page ${submitted ? "has-result" : ""}`}>

        {/* TOP */}
        <div className={`top-section ${submitted ? "compact" : ""}`}>
          <p className="engine-eyebrow">The Feeling Engine</p>
          <h1 className="engine-title">
            How do you want<br />to <em>feel?</em>
          </h1>
          <p className="engine-sub">
            Don&apos;t search for a destination. Tell us how you want to feel — in your own words —
            and our AI will design a Sri Lanka journey around that feeling alone.
          </p>
        </div>

        {/* INPUT */}
        <div className="input-section">
          <div className="input-box">
            <textarea
              ref={textareaRef}
              className="prompt-textarea"
              placeholder="I want to feel completely lost in nature, somewhere ancient and untouched…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={handleSubmit}
              disabled={!prompt.trim() || loading}
            >
              →
            </button>
          </div>

          {/* SUGGESTIONS — only show before submit */}
          {!submitted && (
            <div className="suggestions">
              {suggestions.map((s: string, i: number) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => {
                    setPrompt(s);
                    setTimeout(() => textareaRef.current?.focus(), 50);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RESULT */}
        {submitted && (
          <div className="result-panel">
            {loading && (
              <div className="loading-state">
                <p className="loading-text">Curating your journey</p>
                <div className="loading-dots">
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                </div>
              </div>
            )}

            {!loading && journey && (
              <>
                <p className="user-prompt-display">
                  You said: <span>&ldquo;{prompt}&rdquo;</span>
                </p>
                <div className="journey-grid">
                  <div>
                    <p className="journey-meta">{journey.days} Days · Sri Lanka</p>
                    <h2 className="journey-title">{journey.title}</h2>
                    <p className="journey-tagline">{journey.tagline}</p>
                    <p className="journey-desc">{journey.description}</p>
                  </div>
                  <div>
                    <p className="highlight-label">Defining Moment</p>
                    <p className="highlight-text">{journey.highlight}</p>
                    <div className="days-wrap">
                      <span className="days-num">{journey.days}</span>
                      <span className="days-label">Days</span>
                    </div>
                  </div>
                </div>
                <div className="journey-footer">
                  <div className="journey-tags">
                    {journey.destinations.map((d: string, i: number) => (
                      <span className="journey-tag" key={i}>{d}</span>
                    ))}
                  </div>
                  <div className="footer-actions">
                    <button className="btn-enquire">Enquire About This Journey</button>
                    <button className="btn-reset" onClick={handleReset}>✕ Start Over</button>
                  </div>
                </div>
              </>
            )}

            {!loading && error && (
              <div className="loading-state">
                <p className="loading-text">Something went wrong. Please try again.</p>
                <button className="btn-reset" onClick={handleReset}>Try Again</button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}