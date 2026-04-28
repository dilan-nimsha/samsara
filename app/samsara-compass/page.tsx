"use client";

import { useState } from "react";

const questions = [
  {
    id: 1,
    question: "You have one free morning in Sri Lanka. Where do you go?",
    options: [
      { label: "A misty mountain trail before the world wakes up", tags: ["wild", "spiritual"] },
      { label: "A quiet beach where the only sound is the ocean", tags: ["still", "coastal"] },
      { label: "A centuries-old temple at the edge of a jungle", tags: ["spiritual", "cultural"] },
      { label: "A local market full of spice and colour", tags: ["cultural", "connected"] },
    ],
  },
  {
    id: 2,
    question: "Which photograph speaks to your soul?",
    options: [
      { label: "An elephant walking through golden morning mist", tags: ["wild", "spiritual"] },
      { label: "A fisherman casting his net at sunset", tags: ["coastal", "connected"] },
      { label: "Ancient stone steps leading to a forgotten temple", tags: ["cultural", "spiritual"] },
      { label: "A train winding through endless green tea terraces", tags: ["wild", "still"] },
    ],
  },
  {
    id: 3,
    question: "How do you like to move through a place?",
    options: [
      { label: "Slowly — I want to linger until I understand it", tags: ["still", "cultural"] },
      { label: "Actively — I want to be in it, not just watching it", tags: ["wild", "connected"] },
      { label: "Deeply — I go to fewer places but truly know them", tags: ["spiritual", "still"] },
      { label: "Openly — I follow what calls to me each day", tags: ["connected", "wild"] },
    ],
  },
  {
    id: 4,
    question: "What do you want to be doing at sunset?",
    options: [
      { label: "Watching it from a clifftop alone with my thoughts", tags: ["spiritual", "still"] },
      { label: "On a boat, somewhere between here and the horizon", tags: ["coastal", "wild"] },
      { label: "Sharing a meal with people I just met", tags: ["connected", "cultural"] },
      { label: "Watching it turn a ruined kingdom gold", tags: ["cultural", "spiritual"] },
    ],
  },
  {
    id: 5,
    question: "Which word feels most like a homecoming?",
    options: [
      { label: "Wilderness", tags: ["wild"] },
      { label: "Stillness", tags: ["still"] },
      { label: "Sacred", tags: ["spiritual"] },
      { label: "Belonging", tags: ["connected", "coastal"] },
    ],
  },
];

const results: Record<string, { title: string; subtitle: string; description: string; journey: string; destinations: string[]; image: string }> = {
  wild: {
    title: "The Wild Wanderer",
    subtitle: "Sri Lanka's untamed heart is calling you",
    description: "You are drawn to the raw, unfiltered pulse of nature. Your Sri Lanka is one of misty mountain forests, leopard sightings at dawn, rushing waterfalls and trails that feel like they were made for you alone. You don't want the postcard — you want the real thing.",
    journey: "Into the Wild — 11 Days",
    destinations: ["Knuckles Range", "Yala National Park", "Horton Plains", "Sinharaja"],
    image: "/images/hill-country.webp",
  },
  still: {
    title: "The Slow Traveller",
    subtitle: "Your Sri Lanka moves at the pace of the tides",
    description: "You believe the best travel happens when you stop trying to see everything. Your Sri Lanka is unhurried — long mornings on empty beaches, tea on a veranda as the mist lifts, afternoons with nowhere to be. You want to feel the island rather than tick it off.",
    journey: "The Slow Coast — 9 Days",
    destinations: ["Pasikuda", "Trincomalee", "Galle", "Weligama"],
    image: "/images/east.webp",
  },
  spiritual: {
    title: "The Sacred Seeker",
    subtitle: "Ancient Sri Lanka has been waiting for you",
    description: "Something in you recognises the sacred — in stone, in silence, in ritual. Your Sri Lanka is one of 2,000-year-old temples, meditation at dawn, Ayurvedic healing and landscapes that feel like they exist outside of time. You come here not to escape life, but to understand it.",
    journey: "The Inner Journey — 10 Days",
    destinations: ["Anuradhapura", "Kandy", "Sigiriya", "Dambulla"],
    image: "/images/dest-4.webp",
  },
  cultural: {
    title: "The Culture Collector",
    subtitle: "The stories of Sri Lanka are waiting to be heard",
    description: "For you, travel is about people, history and the stories that places carry. Your Sri Lanka is one of ancient kingdoms, colonial forts, spice markets, batik workshops and conversations that change how you see the world. You want to understand the island, not just visit it.",
    journey: "Sacred Kingdoms — 12 Days",
    destinations: ["Galle", "Kandy", "Polonnaruwa", "Jaffna"],
    image: "/images/dest-1.webp",
  },
  coastal: {
    title: "The Ocean Soul",
    subtitle: "Sri Lanka's coastline was made for you",
    description: "The sea calls to you. Your Sri Lanka is salt air and warm water, whale watches at sunrise, surf lessons with fishermen and evenings spent watching the Indian Ocean turn the colour of flame. You want to live at the edge of the island, where land becomes water.",
    journey: "The Southern Soul — 8 Days",
    destinations: ["Mirissa", "Unawatuna", "Trincomalee", "Pigeon Island"],
    image: "/images/dest-1.webp",
  },
  connected: {
    title: "The Human Collector",
    subtitle: "The people of Sri Lanka will stay with you forever",
    description: "The best souvenir you've ever brought home was a friendship. Your Sri Lanka is about the fisherman who shares his breakfast, the tea picker who teaches you her song and the family who insists you stay for dinner. You travel to belong, even briefly, somewhere new.",
    journey: "Living Like a Local — 10 Days",
    destinations: ["Galle", "Ella", "Kandy", "Jaffna"],
    image: "/images/dest-2.webp",
  },
};

export default function SamsaraCompass() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[][]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  const handleAnswer = (tags: string[]) => {
    if (animating) return;
    setAnimating(true);
    const newAnswers = [...answers, tags];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent((prev) => prev + 1);
        setAnimating(false);
      } else {
        // Calculate result
        const tally: Record<string, number> = {};
        newAnswers.flat().forEach((tag) => {
          tally[tag] = (tally[tag] || 0) + 1;
        });
        const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
        setResult(top);
        setAnimating(false);
      }
    }, 400);
  };

  const reset = () => {
    setCurrent(0);
    setAnswers([]);
    setResult(null);
  };

  const res = result ? results[result] || results["wild"] : null;
  const progress = ((current) / questions.length) * 100;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inter:wght@300;400;500&display=swap');

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
        html, body { height: 100%; }
        body {
          background: var(--dark);
          color: var(--cream);
          font-family: 'Inter', sans-serif;
          font-weight: 300;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* NAVBAR */
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 1.8rem 5rem;
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(8,8,8,0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(201,168,76,0.08);
        }
        .nav-logo { display: flex; align-items: center; text-decoration: none; }
        .nav-logo img { height: 32px; width: auto; }
        .nav-back {
          font-size: 0.68rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--cream-dim); text-decoration: none; transition: color 0.3s;
        }
        .nav-back:hover { color: var(--gold); }

        /* PROGRESS */
        .progress-bar {
          position: fixed; top: 0; left: 0; right: 0; height: 2px;
          background: rgba(255,255,255,0.05); z-index: 200;
        }
        .progress-fill {
          height: 100%; background: var(--gold);
          transition: width 0.5s ease;
        }

        /* MAIN */
        .compass-wrap {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          padding: 8rem 5rem 5rem;
        }
        .compass-inner { width: 100%; max-width: 760px; }

        /* QUESTION */
        .question-section {
          animation: fadeSlide 0.5s ease both;
        }
        .q-counter {
          font-size: 0.62rem; letter-spacing: 0.4em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 2rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .q-counter::before {
          content: ''; width: 20px; height: 1px; background: var(--gold);
        }
        .q-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.8rem, 4vw, 3rem);
          font-weight: 300; color: var(--white);
          line-height: 1.3; margin-bottom: 3rem;
        }
        .options {
          display: flex; flex-direction: column; gap: 1rem;
        }
        .option-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          padding: 1.5rem 2rem;
          text-align: left; cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.15rem; font-weight: 300;
          color: rgba(255,255,255,0.55);
          line-height: 1.4;
          position: relative; overflow: hidden;
        }
        .option-btn::before {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 0; background: rgba(201,168,76,0.08);
          transition: width 0.3s ease;
        }
        .option-btn:hover {
          border-color: rgba(201,168,76,0.4);
          color: var(--white);
          padding-left: 2.5rem;
        }
        .option-btn:hover::before { width: 100%; }
        .option-letter {
          font-size: 0.6rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--gold-dim);
          margin-bottom: 0.25rem; display: block;
        }

        /* RESULT */
        .result-section {
          animation: fadeSlide 0.8s ease both;
        }
        .result-hero {
          position: relative; margin-bottom: 3rem;
          overflow: hidden;
        }
        .result-img {
          width: 100%; aspect-ratio: 16/7;
          object-fit: cover; display: block;
        }
        .result-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.2) 60%);
        }
        .result-img-text {
          position: absolute; bottom: 2.5rem; left: 2.5rem;
        }
        .result-eyebrow {
          font-size: 0.62rem; letter-spacing: 0.4em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 0.75rem;
          display: flex; align-items: center; gap: 0.75rem;
        }
        .result-eyebrow::before {
          content: ''; width: 20px; height: 1px; background: var(--gold);
        }
        .result-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 300; color: var(--white); line-height: 1;
        }
        .result-subtitle {
          font-size: 0.82rem; letter-spacing: 0.05em;
          color: var(--cream-dim); margin-top: 0.5rem;
        }
        .result-body { margin-bottom: 2.5rem; }
        .result-desc {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.2rem; font-weight: 300;
          line-height: 1.8; color: var(--cream);
          margin-bottom: 2rem; font-style: italic;
        }
        .result-journey {
          font-size: 0.68rem; letter-spacing: 0.25em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 1rem;
        }
        .result-tags {
          display: flex; flex-wrap: wrap; gap: 0.5rem;
          margin-bottom: 2.5rem;
        }
        .result-tag {
          font-size: 0.62rem; letter-spacing: 0.15em;
          text-transform: uppercase; color: var(--dark);
          background: var(--gold); padding: 0.4rem 1rem;
        }
        .result-actions {
          display: flex; gap: 1rem; flex-wrap: wrap;
        }
        .btn-primary {
          font-family: 'Inter', sans-serif;
          font-size: 0.7rem; letter-spacing: 0.22em;
          text-transform: uppercase;
          background: var(--gold); color: var(--dark);
          border: none; padding: 1rem 2.5rem;
          cursor: pointer; transition: background 0.3s;
        }
        .btn-primary:hover { background: var(--gold-light); }
        .btn-ghost {
          font-family: 'Inter', sans-serif;
          font-size: 0.7rem; letter-spacing: 0.22em;
          text-transform: uppercase;
          background: transparent; color: var(--cream-dim);
          border: 1px solid rgba(255,255,255,0.15);
          padding: 1rem 2.5rem;
          cursor: pointer; transition: all 0.3s;
        }
        .btn-ghost:hover { border-color: var(--gold); color: var(--gold); }

        /* ANIMATIONS */
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .navbar { padding: 1.2rem 2rem; }
          .compass-wrap { padding: 7rem 2rem 4rem; }
        }
      `}</style>

      {/* PROGRESS */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: result ? "100%" : `${progress}%` }} />
      </div>

      {/* NAVBAR */}
      <nav className="navbar">
        <a href="/" className="nav-logo">
          <img src="/images/logo.png" alt="Samsara" onError={(e) => (e.currentTarget.style.display = "none")} />
        </a>
        <a href="/" className="nav-back">← Back to Samsara</a>
      </nav>

      <div className="compass-wrap">
        <div className="compass-inner">

          {!result ? (
            <div className="question-section" key={current}>
              <p className="q-counter">
                Question {current + 1} of {questions.length}
              </p>
              <h2 className="q-text">{questions[current].question}</h2>
              <div className="options">
                {questions[current].options.map((opt, i) => (
                  <button
                    key={i}
                    className="option-btn"
                    onClick={() => handleAnswer(opt.tags)}
                    disabled={animating}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : res ? (
            <div className="result-section">
              <div className="result-hero">
                <img
                  src={res.image}
                  alt={res.title}
                  className="result-img"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div className="result-img-overlay" />
                <div className="result-img-text">
                  <p className="result-eyebrow">Your Sri Lanka</p>
                  <h2 className="result-name">{res.title}</h2>
                  <p className="result-subtitle">{res.subtitle}</p>
                </div>
              </div>
              <div className="result-body">
                <p className="result-desc">"{res.description}"</p>
                <p className="result-journey">Suggested Journey: {res.journey}</p>
                <div className="result-tags">
                  {res.destinations.map((d, i) => (
                    <span className="result-tag" key={i}>{d}</span>
                  ))}
                </div>
              </div>
              <div className="result-actions">
                <button className="btn-primary">Enquire About This Journey</button>
                <button className="btn-ghost" onClick={reset}>Take the Compass Again</button>
              </div>
            </div>
          ) : null}

        </div>
      </div>
    </>
  );
}