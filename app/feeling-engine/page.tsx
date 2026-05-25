"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const systemPrompt = `You are Samsara's Feeling Curator — a poetic, deeply soulful luxury travel voice for Sri Lanka.

When a traveller tells you how they want to feel, or describes what they're looking for, you respond with a deeply personalised Sri Lanka journey concept.

Your response must follow this exact structure (use these exact labels on separate lines):

JOURNEY_TITLE: [A poetic 3-6 word title]
MOOD_TAG: [One word only — the emotional essence, e.g. Solitude, Awakening, Wildness, Reverence, Surrender, Stillness]
TAGLINE: [One single evocative sentence — what this journey promises the soul]
DESCRIPTION: [2-3 sentences, poetic and personal, written directly to the traveller. No bullet points. Under 60 words.]
BEST_SEASON: [Best months to travel, e.g. "November – March"]
ACCOMMODATION: [One evocative phrase describing the stay, e.g. "A colonial tea estate bungalow and a tented jungle camp"]
DAYS: [A number only, e.g. 9]
DESTINATIONS: [Comma-separated list of 3-4 Sri Lankan places]
HIGHLIGHT: [One unforgettable experience as a vivid sensory moment, under 30 words]
SOULFUL_MOMENT: [A second intimate, unexpected moment only possible in Sri Lanka, under 30 words]

Rules:
- Only Sri Lanka. Always luxury or boutique.
- Write like a poet who knows Sri Lanka's light, texture, silence, and scent intimately.
- Never be generic. Every word should feel written for this specific person's longing.
- Let the emotional subtext of what they have shared shape every response.
- If they mention a duration, honour it. Otherwise choose the ideal duration for the feeling.`;

const LOADING_MESSAGES = [
  "Listening to your longing…",
  "Feeling the landscape…",
  "Finding where Sri Lanka holds what you seek…",
  "Letting the journey take shape…",
  "Reading between your words…",
  "Tracing the path you haven’t walked yet…",
];

const SUGGESTIONS = [
  "I want to feel completely still",
  "Lost in ancient wilderness",
  "Spiritually awakened",
  "Wild and alive in nature",
  "Romantic and unhurried",
  "Immersed in local culture",
];

type JourneyData = {
  title: string;
  mood: string;
  tagline: string;
  description: string;
  season: string;
  accommodation: string;
  days: string;
  destinations: string[];
  highlight: string;
  soulfulMoment: string;
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
  const daysNum = getValue("DAYS").match(/\d+/)?.[0] || "9";

  return {
    title: getValue("JOURNEY_TITLE") || getValue("TITLE") || "A Journey Awaits",
    mood: getValue("MOOD_TAG"),
    tagline: getValue("TAGLINE"),
    description: getValue("DESCRIPTION"),
    season: getValue("BEST_SEASON"),
    accommodation: getValue("ACCOMMODATION"),
    days: daysNum,
    destinations: destRaw ? destRaw.split(",").map((d) => d.trim()).filter(Boolean) : [],
    highlight: getValue("HIGHLIGHT"),
    soulfulMoment: getValue("SOULFUL_MOMENT"),
  };
}

export default function FeelingEngine() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [journey, setJourney] = useState<JourneyData | null>(null);
  const [error, setError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [showEnquire, setShowEnquire] = useState(false);
  const [enquireName, setEnquireName] = useState("");
  const [enquireEmail, setEnquireEmail] = useState("");
  const [enquireNotes, setEnquireNotes] = useState("");
  const [enquireSent, setEnquireSent] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const msgTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [prompt]);

  const startMsgRotation = useCallback(() => {
    let i = 1;
    msgTimerRef.current = setInterval(() => {
      setLoadingMsg(LOADING_MESSAGES[i % LOADING_MESSAGES.length]);
      i++;
    }, 2200);
  }, []);

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setJourney(null);
    setError(false);
    setSubmitted(true);
    setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    startMsgRotation();

    try {
      const res = await fetch("/api/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt.trim() }],
          stream: true,
        }),
      });

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
              accumulated += evt.delta.text;
            }
          } catch { /* ignore partial JSON */ }
        }
      }

      setJourney(parseJourney(accumulated));
    } catch {
      setError(true);
    } finally {
      if (msgTimerRef.current) clearInterval(msgTimerRef.current);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPrompt("");
    setJourney(null);
    setError(false);
    setSubmitted(false);
    setShowEnquire(false);
    setEnquireName("");
    setEnquireEmail("");
    setEnquireNotes("");
    setEnquireSent(false);
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
        body { background: var(--dark); color: var(--cream); font-family: 'Inter', sans-serif; font-weight: 300; min-height: 100vh; }

        .page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding-top: 110px; background: var(--dark); }
        .page.has-result { padding-bottom: 4rem; }

        .hero-section { display: flex; flex-direction: column; align-items: center; text-align: center; width: 100%; padding: 3rem 2rem 0; transition: all 0.5s ease; }
        .hero-section.compact { padding-top: 1rem; }

        .engine-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 300; color: var(--white); letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 2.5rem; animation: fadeUp 0.8s ease both; }
        .hero-section.compact .engine-title { font-size: clamp(1.2rem, 2.5vw, 1.8rem); margin-bottom: 1rem; }

        .illustration-wrap { width: 220px; height: auto; margin-bottom: 2.5rem; animation: fadeUp 0.8s 0.15s ease both; transition: all 0.5s ease; }
        .hero-section.compact .illustration-wrap { width: 100px; margin-bottom: 1.2rem; }
        .illustration-wrap img { width: 100%; height: auto; display: block; }

        .input-section { width: 100%; max-width: 680px; padding: 0 2rem; animation: fadeUp 0.8s 0.3s ease both; }
        .input-bar { position: relative; background: transparent; border: 1px solid rgba(255,255,255,0.25); border-radius: 50px; overflow: hidden; transition: border-color 0.3s; }
        .input-bar:focus-within { border-color: rgba(201,168,76,0.6); }
        .prompt-input { width: 100%; background: transparent; border: none; outline: none; color: var(--white); font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 300; padding: 1.1rem 4rem 1.1rem 2rem; line-height: 1.5; min-height: 48px; max-height: 200px; overflow: hidden; }
        .prompt-input::placeholder { color: rgba(255,255,255,0.3); }
        .send-btn { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); background: var(--gold); border: none; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.3s; color: var(--dark); font-size: 1rem; flex-shrink: 0; }
        .send-btn:hover { background: var(--gold-light); }
        .send-btn:disabled { background: rgba(201,168,76,0.25); cursor: not-allowed; }

        .suggestions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1.2rem; justify-content: center; padding: 0 2rem; max-width: 680px; width: 100%; animation: fadeUp 0.8s 0.45s ease both; }
        .suggestion-chip { font-size: 0.68rem; letter-spacing: 0.04em; color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 0.4rem 0.9rem; cursor: pointer; transition: all 0.3s; font-family: 'Inter', sans-serif; border-radius: 20px; }
        .suggestion-chip:hover { color: var(--white); border-color: rgba(201,168,76,0.35); background: rgba(201,168,76,0.06); }

        .result-panel { width: 100%; max-width: 1000px; margin-top: 2.5rem; padding: 0 2rem; animation: fadeUp 0.5s ease both; }
        .result-inner { background: linear-gradient(135deg, rgba(15,12,5,0.98), rgba(8,8,8,0.98)); border: 1px solid rgba(201,168,76,0.18); padding: 2.5rem 3rem; border-radius: 8px; }

        .loading-state { display: flex; align-items: center; gap: 1.5rem; padding: 1rem 0; }
        .loading-text { font-family: 'Cormorant Garamond', serif; font-size: var(--text-base); font-weight: 300; color: var(--cream-dim); font-style: italic; transition: opacity 0.4s ease; }
        .loading-dots { display: flex; gap: 0.4rem; align-items: center; }
        .loading-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--gold); opacity: 0.4; animation: dotBounce 1.2s ease-in-out infinite; }
        .loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dot:nth-child(3) { animation-delay: 0.4s; }

        .journey-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 3rem; }

        .journey-meta { font-size: var(--text-xs); letter-spacing: 0.38em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.7rem; display: flex; align-items: center; gap: 0.75rem; animation: revealUp 0.5s 0.1s ease both; }
        .journey-meta::before { content: ''; width: 18px; height: 1px; background: var(--gold); flex-shrink: 0; }
        .mood-tag { font-size: var(--text-xs); letter-spacing: 0.1em; text-transform: uppercase; color: var(--dark); background: var(--gold); padding: 0.18rem 0.6rem; border-radius: 2px; white-space: nowrap; }

        .journey-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.62rem, 3vw, 2.62rem); font-weight: 300; color: var(--white); line-height: 1.1; margin-bottom: 0.5rem; animation: revealUp 0.5s 0.2s ease both; }
        .journey-tagline { font-size: var(--text-base); color: var(--cream-dim); font-style: italic; margin-bottom: 1.2rem; line-height: 1.7; animation: revealUp 0.5s 0.3s ease both; }
        .journey-desc { font-size: var(--text-base); line-height: 1.9; color: rgba(255,255,255,0.65); animation: revealUp 0.5s 0.4s ease both; }

        .journey-details { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.9rem; padding-top: 1.2rem; border-top: 1px solid rgba(255,255,255,0.06); animation: revealUp 0.5s 0.5s ease both; }
        .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
        .detail-label { font-size: var(--text-xs); letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); }
        .detail-value { font-size: 0.82rem; color: rgba(255,255,255,0.55); line-height: 1.6; font-style: italic; }

        .highlight-label { font-size: var(--text-xs); letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.7rem; animation: revealUp 0.5s 0.35s ease both; }
        .highlight-text { font-family: 'Cormorant Garamond', serif; font-size: var(--text-base); font-weight: 300; color: var(--white); line-height: 1.7; font-style: italic; border-left: 1px solid rgba(201,168,76,0.4); padding-left: 1.2rem; margin-bottom: 1.5rem; animation: revealUp 0.5s 0.45s ease both; }
        .days-wrap { display: flex; align-items: baseline; gap: 0.4rem; animation: revealUp 0.5s 0.7s ease both; margin-top: 0.5rem; }
        .days-num { font-family: 'Cormorant Garamond', serif; font-size: var(--text-lg); font-weight: 300; color: var(--gold-light); line-height: 1; }
        .days-label { font-size: var(--text-xs); letter-spacing: 0.25em; text-transform: uppercase; color: var(--cream-dim); }

        .journey-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; gap: 1rem; animation: revealUp 0.5s 0.6s ease both; }
        .journey-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .journey-tag { font-size: var(--text-xs); letter-spacing: 0.12em; text-transform: uppercase; color: var(--dark); background: var(--gold); padding: 0.28rem 0.75rem; }
        .footer-actions { display: flex; gap: 1rem; align-items: center; }
        .btn-enquire { font-family: 'Inter', sans-serif; font-size: var(--text-sm); letter-spacing: 0.22em; text-transform: uppercase; background: var(--gold); color: var(--dark); border: none; padding: 0.85rem 2rem; cursor: pointer; transition: background 0.3s; white-space: nowrap; }
        .btn-enquire:hover { background: var(--gold-light); }
        .btn-reset { font-size: var(--text-xs); letter-spacing: 0.2em; text-transform: uppercase; color: var(--cream-dim); background: none; border: none; cursor: pointer; transition: color 0.3s; font-family: 'Inter', sans-serif; }
        .btn-reset:hover { color: var(--white); }

        .user-prompt-display { font-size: var(--text-xs); color: rgba(255,255,255,0.35); font-style: italic; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); animation: revealUp 0.5s ease both; }
        .user-prompt-display span { color: rgba(255,255,255,0.55); }

        /* ENQUIRE MODAL */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.78); backdrop-filter: blur(6px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 2rem; animation: fadeIn 0.25s ease both; }
        .modal-card { position: relative; background: #0e0c07; border: 1px solid rgba(201,168,76,0.25); padding: 2.5rem; max-width: 520px; width: 100%; border-radius: 4px; animation: slideUp 0.35s ease both; }
        .modal-close { position: absolute; top: 1rem; right: 1.2rem; background: none; border: none; color: var(--cream-dim); font-size: 0.9rem; cursor: pointer; transition: color 0.2s; font-family: 'Inter', sans-serif; }
        .modal-close:hover { color: var(--white); }
        .modal-label { font-size: var(--text-xs); letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.5rem; }
        .modal-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.3rem, 3vw, 1.8rem); font-weight: 300; color: var(--white); line-height: 1.2; margin-bottom: 0.3rem; }
        .modal-sub { font-size: var(--text-xs); letter-spacing: 0.15em; text-transform: uppercase; color: var(--cream-dim); margin-bottom: 1.8rem; }
        .modal-fields { display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1.5rem; }
        .modal-input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: var(--white); font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 300; padding: 0.8rem 1rem; outline: none; transition: border-color 0.3s; border-radius: 2px; width: 100%; }
        .modal-input:focus { border-color: rgba(201,168,76,0.5); }
        .modal-input::placeholder { color: rgba(255,255,255,0.25); }
        .modal-textarea { resize: vertical; min-height: 80px; }
        .btn-enquire-modal { width: 100%; font-family: 'Inter', sans-serif; font-size: var(--text-sm); letter-spacing: 0.22em; text-transform: uppercase; background: var(--gold); color: var(--dark); border: none; padding: 1rem; cursor: pointer; transition: background 0.3s; }
        .btn-enquire-modal:hover { background: var(--gold-light); }
        .btn-enquire-modal:disabled { background: rgba(201,168,76,0.25); cursor: not-allowed; }
        .enquire-success { text-align: center; padding: 2rem 0; }
        .enquire-success-icon { font-size: 1.5rem; color: var(--gold); margin-bottom: 1.2rem; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes revealUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dotBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-6px); opacity: 1; } }

        @media (max-width: 768px) {
          .journey-grid { grid-template-columns: 1fr; gap: 1.5rem; }
          .result-inner { padding: 1.5rem; }
          .journey-footer { flex-direction: column; align-items: flex-start; }
          .modal-card { padding: 1.5rem; }
        }
      `}</style>

      {/* ENQUIRE MODAL */}
      {showEnquire && journey && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowEnquire(false); }}
        >
          <div className="modal-card">
            <button className="modal-close" onClick={() => setShowEnquire(false)}>✕</button>

            {!enquireSent ? (
              <>
                <p className="modal-label">Enquire About</p>
                <h3 className="modal-title">{journey.title}</h3>
                <p className="modal-sub">{journey.days} Days · {journey.destinations.join(" · ")}</p>
                <div className="modal-fields">
                  <input
                    className="modal-input"
                    placeholder="Your name"
                    value={enquireName}
                    onChange={(e) => setEnquireName(e.target.value)}
                  />
                  <input
                    className="modal-input"
                    type="email"
                    placeholder="Your email"
                    value={enquireEmail}
                    onChange={(e) => setEnquireEmail(e.target.value)}
                  />
                  <textarea
                    className="modal-input modal-textarea"
                    placeholder="Any special wishes or questions…"
                    value={enquireNotes}
                    onChange={(e) => setEnquireNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <button
                  className="btn-enquire-modal"
                  onClick={() => setEnquireSent(true)}
                  disabled={!enquireName.trim() || !enquireEmail.trim()}
                >
                  Send Enquiry
                </button>
              </>
            ) : (
              <div className="enquire-success">
                <p className="enquire-success-icon">✦</p>
                <h3 className="modal-title">We will be in touch</h3>
                <p className="modal-sub" style={{ marginTop: "0.5rem" }}>
                  Our curators will reach out within 24 hours.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
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
              style={{ resize: "none", overflow: "hidden" }}
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

        {/* SUGGESTION CHIPS — visible only before first submission */}
        {!submitted && (
          <div className="suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
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

        {/* RESULT PANEL */}
        {submitted && (
          <div className="result-panel">
            <div className="result-inner">

              {loading && (
                <div className="loading-state">
                  <p className="loading-text">{loadingMsg}</p>
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
                    {/* LEFT — narrative */}
                    <div>
                      <p className="journey-meta">
                        {journey.days} Days · Sri Lanka
                        {journey.mood && <span className="mood-tag">{journey.mood}</span>}
                      </p>
                      <h2 className="journey-title">{journey.title}</h2>
                      <p className="journey-tagline">{journey.tagline}</p>
                      <p className="journey-desc">{journey.description}</p>

                      {(journey.season || journey.accommodation) && (
                        <div className="journey-details">
                          {journey.season && (
                            <div className="detail-item">
                              <span className="detail-label">Best Season</span>
                              <span className="detail-value">{journey.season}</span>
                            </div>
                          )}
                          {journey.accommodation && (
                            <div className="detail-item">
                              <span className="detail-label">Where You Will Stay</span>
                              <span className="detail-value">{journey.accommodation}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* RIGHT — moments */}
                    <div>
                      <p className="highlight-label">Defining Moment</p>
                      <p className="highlight-text">{journey.highlight}</p>

                      {journey.soulfulMoment && (
                        <>
                          <p className="highlight-label" style={{ marginTop: "1.5rem" }}>Soulful Moment</p>
                          <p className="highlight-text">{journey.soulfulMoment}</p>
                        </>
                      )}

                      <div className="days-wrap">
                        <span className="days-num">{journey.days}</span>
                        <span className="days-label">Days</span>
                      </div>
                    </div>
                  </div>

                  <div className="journey-footer">
                    <div className="journey-tags">
                      {journey.destinations.map((d, i) => (
                        <span className="journey-tag" key={i}>{d}</span>
                      ))}
                    </div>
                    <div className="footer-actions">
                      <button className="btn-enquire" onClick={() => setShowEnquire(true)}>
                        Enquire About This Journey
                      </button>
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
