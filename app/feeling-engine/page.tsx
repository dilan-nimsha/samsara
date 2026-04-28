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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inter:wght@200;300;400;500;600&display=swap');

        :root {
          --gold: #C9A84C;
          --gold-light: #E2C97E;
          --gold-dim: rgba(201,168,76,0.15);
          --dark: #080808;
          --cream: #F2EDE4;
          --cream-dim: #a89f92;
          --white: #ffffff;
          --text-xs: 0.62rem;
          --text-sm: 0.68rem;
          --text-base: 1rem;
          --text-md: 1.62rem;
          --text-lg: 2.62rem;
          --text-xl: 4.24rem;
        }

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { height: 100%; }
        body {
          background: var(--dark);
          color: var(--cream);
          font-family: 'Inter', sans-serif;
          font-weight: 300;
          min-height: 100vh;
        }

        /* NAVBAR */
        /* PAGE */
        .page {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center;
          padding-top: 110px;
          background: var(--dark);
        }
        .page.has-result {
          padding-bottom: 4rem;
        }

        /* HERO SECTION */
        .hero-section {
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          width: 100%; padding: 3rem 2rem 0;
          transition: all 0.5s ease;
        }
        .hero-section.compact { padding-top: 1rem; }

        .engine-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 300; color: var(--white);
          letter-spacing: 0.18em; text-transform: uppercase;
          margin-bottom: 2.5rem;
          animation: fadeUp 0.8s ease both;
        }
        .hero-section.compact .engine-title {
          font-size: clamp(1.2rem, 2.5vw, 1.8rem);
          margin-bottom: 1rem;
        }

        /* ILLUSTRATION */
        .illustration-wrap {
          width: 220px; height: auto;
          margin-bottom: 2.5rem;
          animation: fadeUp 0.8s 0.15s ease both;
          transition: all 0.5s ease;
        }
        .hero-section.compact .illustration-wrap {
          width: 100px;
          margin-bottom: 1.2rem;
        }
        .illustration-wrap img {
          width: 100%; height: auto; display: block;
        }

        /* INPUT */
        .input-section {
          width: 100%; max-width: 680px;
          padding: 0 2rem;
          animation: fadeUp 0.8s 0.3s ease both;
        }

        .input-bar {
          position: relative;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 50px;
          overflow: hidden;
          transition: border-color 0.3s;
        }
        .input-bar:focus-within {
          border-color: rgba(201,168,76,0.6);
        }

        .prompt-input {
          width: 100%;
          background: transparent; border: none; outline: none;
          color: var(--white);
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem; font-weight: 300;
          padding: 1.1rem 4rem 1.1rem 2rem;
          line-height: 1.5;
        }
        .prompt-input::placeholder {
          color: rgba(255,255,255,0.3);
        }

        .send-btn {
          position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);
          background: var(--gold); border: none;
          width: 38px; height: 38px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.3s;
          color: var(--dark); font-size: 1rem;
        }
        .send-btn:hover { background: var(--gold-light); }
        .send-btn:disabled {
          background: rgba(201,168,76,0.25);
          cursor: not-allowed;
        }

        /* SUGGESTIONS */
        .suggestions {
          display: flex; gap: 0.5rem;
          flex-wrap: wrap; margin-top: 1.2rem;
          justify-content: center;
          padding: 0 2rem;
          max-width: 680px;
          width: 100%;
          animation: fadeUp 0.8s 0.45s ease both;
        }
        .suggestion-chip {
          font-size: 0.68rem; letter-spacing: 0.04em;
          color: rgba(255,255,255,0.4);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 0.4rem 0.9rem;
          cursor: pointer; transition: all 0.3s;
          font-family: 'Inter', sans-serif;
          border-radius: 20px;
        }
        .suggestion-chip:hover {
          color: var(--white);
          border-color: rgba(201,168,76,0.35);
          background: rgba(201,168,76,0.06);
        }

        /* RESULT PANEL */
        .result-panel {
          width: 100%; max-width: 1000px;
          margin-top: 2.5rem;
          padding: 0 2rem;
          animation: fadeUp 0.5s ease both;
        }
        .result-inner {
          background: linear-gradient(135deg, rgba(15,12,5,0.98), rgba(8,8,8,0.98));
          border: 1px solid rgba(201,168,76,0.18);
          padding: 2.5rem 3rem;
          border-radius: 8px;
        }

        /* LOADING */
        .loading-state {
          display: flex; align-items: center; gap: 1.5rem;
          padding: 1rem 0;
        }
        .loading-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: var(--text-base); font-weight: 300;
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
          font-size: var(--text-xs); letter-spacing: 0.38em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 0.7rem;
          display: flex; align-items: center; gap: 0.75rem;
        }
        .journey-meta::before {
          content: ''; width: 18px; height: 1px; background: var(--gold);
        }
        .journey-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.62rem, 3vw, 2.62rem);
          font-weight: 300; color: var(--white);
          line-height: 1.1; margin-bottom: 0.5rem;
        }
        .journey-tagline {
          font-size: var(--text-base); color: var(--cream-dim);
          font-style: italic; margin-bottom: 1.2rem; line-height: 1.7;
        }
        .journey-desc {
          font-size: var(--text-base); line-height: 1.9;
          color: rgba(255,255,255,0.65);
        }
        .highlight-label {
          font-size: var(--text-xs); letter-spacing: 0.3em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 0.7rem;
        }
        .highlight-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: var(--text-base); font-weight: 300;
          color: var(--white); line-height: 1.7;
          font-style: italic;
          border-left: 1px solid rgba(201,168,76,0.4);
          padding-left: 1.2rem;
          margin-bottom: 1.5rem;
        }
        .days-wrap { display: flex; align-items: baseline; gap: 0.4rem; }
        .days-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: var(--text-lg); font-weight: 300;
          color: var(--gold-light); line-height: 1;
        }
        .days-label {
          font-size: var(--text-xs); letter-spacing: 0.25em;
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
          font-size: var(--text-xs); letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--dark); background: var(--gold);
          padding: 0.28rem 0.75rem;
        }
        .footer-actions { display: flex; gap: 1rem; align-items: center; }
        .btn-enquire {
          font-family: 'Inter', sans-serif;
          font-size: var(--text-sm); letter-spacing: 0.22em;
          text-transform: uppercase;
          background: var(--gold); color: var(--dark);
          border: none; padding: 0.85rem 2rem;
          cursor: pointer; transition: background 0.3s; white-space: nowrap;
        }
        .btn-enquire:hover { background: var(--gold-light); }
        .btn-reset {
          font-size: var(--text-xs); letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--cream-dim);
          background: none; border: none; cursor: pointer;
          transition: color 0.3s; font-family: 'Inter', sans-serif;
        }
        .btn-reset:hover { color: var(--white); }
        .user-prompt-display {
          font-size: var(--text-xs); color: rgba(255,255,255,0.35);
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
          .journey-grid { grid-template-columns: 1fr; gap: 1.5rem; }
          .result-inner { padding: 1.5rem; }
          .journey-footer { flex-direction: column; align-items: flex-start; }
        }
      `}</style>


      {/* MAIN */}
      <div className={`page ${submitted ? "has-result" : ""}`}>

        {/* HERO */}
        <div className={`hero-section ${submitted ? "compact" : ""}`}>
          <h1 className="engine-title">The Feelings Engine</h1>

          {!submitted && (
            <div className="illustration-wrap">
              <img
                src="/images/feelings_engine.png"
                alt="Sri Lanka"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}
        </div>

        {/* INPUT */}
        <div className="input-section">
          <div className="input-bar">
            <textarea
              ref={textareaRef}
              className="prompt-input"
              placeholder="I want to feel completely lost in nature, somewhere ancient and untouched…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
              style={{ resize: "none" }}
            />
            <button
              className="send-btn"
              onClick={handleSubmit}
              disabled={!prompt.trim() || loading}
            >
              →
            </button>
          </div>
        </div>


        {/* RESULT */}
        {submitted && (
          <div className="result-panel">
            <div className="result-inner">
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
          </div>
        )}
      </div>
    </>
  );
}
