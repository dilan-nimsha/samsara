"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

const systemPrompt = `You are the Samsara Journey Architect — a poetic, deeply knowledgeable luxury travel curator specialising exclusively in Sri Lanka. You speak with warmth, elegance and a deep love for the island.

Your role is to build bespoke Sri Lanka itineraries through natural, beautiful conversation. Never be clinical or list-heavy upfront. Ask one thoughtful question at a time. Listen deeply.

Ask about:
- How they want to FEEL (not just what they want to see)
- How many days they have
- Who they're travelling with
- Their pace (rushed explorer vs slow wanderer)
- Any passions (wildlife, culture, food, wellness, adventure, spirituality)
- Budget style (ultra-luxury, boutique, authentic local)

After gathering enough (3-4 exchanges), craft a beautiful, personalised Sri Lanka itinerary. Format it as:

**Your Samsara Journey: [Poetic Title]**
*[One evocative line about this journey]*

Then day by day, written poetically not clinically. Include:
- Specific places to stay (luxury/boutique Sri Lankan properties)
- Meaningful experiences (not tourist traps)
- Local food moments
- The feeling each day will bring

End with: "Shall I refine anything, or would you like to enquire about this journey?"

IMPORTANT: Only discuss Sri Lanka. If asked about other destinations, gently redirect. Keep responses warm, never more than 3 paragraphs unless delivering the full itinerary. Never use bullet points in conversation — only in the final itinerary.`;

export default function ItineraryBuilder() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Welcome. Before we speak of places, tell me — what are you hoping to leave behind when you board that plane? And what do you hope to find on the other side?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || "I seem to have lost my words for a moment. Please ask me again.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something interrupted our conversation. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
          --dark-3: #161616;
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
          overflow: hidden;
          height: 100vh;
        }

        .page {
          display: grid;
          grid-template-columns: 380px 1fr;
          height: 100vh;
          overflow: hidden;
        }

        /* LEFT PANEL */
        .left-panel {
          background: var(--dark-2);
          border-right: 1px solid rgba(201,168,76,0.1);
          display: flex; flex-direction: column;
          padding: 3rem 2.5rem;
          position: relative;
          overflow: hidden;
        }
        .left-panel::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 20% 80%, rgba(201,168,76,0.06) 0%, transparent 60%);
          pointer-events: none;
        }
        .panel-logo {
          display: flex; align-items: center; gap: 0.75rem;
          text-decoration: none; margin-bottom: 3rem;
        }
        .panel-logo img { height: 32px; width: auto; }
        .panel-eyebrow {
          font-size: 0.6rem; letter-spacing: 0.4em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 1rem;
          display: flex; align-items: center; gap: 0.75rem;
        }
        .panel-eyebrow::before {
          content: ''; width: 20px; height: 1px; background: var(--gold);
        }
        .panel-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.2rem; font-weight: 300;
          color: var(--white); line-height: 1.2;
          margin-bottom: 1.5rem;
        }
        .panel-title em { font-style: italic; color: var(--gold-light); }
        .panel-desc {
          font-size: 0.82rem; line-height: 1.9;
          color: var(--cream-dim); margin-bottom: 3rem;
        }
        .panel-divider {
          width: 40px; height: 1px;
          background: var(--gold-dim); margin-bottom: 2rem;
        }
        .panel-hints {
          display: flex; flex-direction: column; gap: 0.75rem;
        }
        .hint {
          font-size: 0.72rem; letter-spacing: 0.05em;
          color: var(--cream-dim); line-height: 1.6;
          padding: 0.75rem 1rem;
          border: 1px solid rgba(255,255,255,0.06);
          cursor: pointer; transition: all 0.3s;
          background: transparent;
          text-align: left; font-family: 'Inter', sans-serif;
        }
        .hint:hover {
          border-color: rgba(201,168,76,0.3);
          color: var(--cream); background: rgba(201,168,76,0.05);
        }
        .panel-footer {
          margin-top: auto;
          font-size: 0.62rem; letter-spacing: 0.1em;
          color: rgba(255,255,255,0.2);
          line-height: 1.6;
        }

        /* RIGHT - CHAT */
        .chat-panel {
          display: flex; flex-direction: column;
          height: 100vh; overflow: hidden;
          background: var(--dark);
        }
        .chat-header {
          padding: 1.5rem 3rem;
          border-bottom: 1px solid rgba(201,168,76,0.08);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .chat-header-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem; font-weight: 300;
          color: var(--cream-dim); letter-spacing: 0.1em;
        }
        .chat-status {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.62rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--gold);
        }
        .status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--gold);
          animation: pulse 2s ease-in-out infinite;
        }

        /* MESSAGES */
        .messages {
          flex: 1; overflow-y: auto;
          padding: 3rem;
          display: flex; flex-direction: column; gap: 2rem;
          scroll-behavior: smooth;
        }
        .messages::-webkit-scrollbar { width: 4px; }
        .messages::-webkit-scrollbar-track { background: transparent; }
        .messages::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 2px; }

        .message { display: flex; gap: 1.5rem; max-width: 760px; }
        .message.user { flex-direction: row-reverse; margin-left: auto; }

        .message-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          flex-shrink: 0; display: flex; align-items: center;
          justify-content: center; font-size: 0.7rem;
          letter-spacing: 0.1em; margin-top: 0.25rem;
        }
        .message.assistant .message-avatar {
          background: rgba(201,168,76,0.15);
          border: 1px solid rgba(201,168,76,0.3);
          color: var(--gold);
        }
        .message.user .message-avatar {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--cream-dim);
        }

        .message-bubble {
          padding: 1.5rem 2rem;
          line-height: 1.85;
          font-size: 0.88rem;
        }
        .message.assistant .message-bubble {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          color: var(--cream);
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem; font-weight: 300;
        }
        .message.user .message-bubble {
          background: rgba(201,168,76,0.08);
          border: 1px solid rgba(201,168,76,0.2);
          color: var(--cream);
        }

        /* TYPING */
        .typing-indicator {
          display: flex; gap: 0.4rem;
          align-items: center; padding: 1rem 0;
        }
        .typing-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--gold); opacity: 0.4;
          animation: typingBounce 1.2s ease-in-out infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        /* INPUT */
        .input-area {
          padding: 1.5rem 3rem 2rem;
          border-top: 1px solid rgba(201,168,76,0.08);
          flex-shrink: 0;
        }
        .input-wrap {
          display: flex; gap: 1rem; align-items: flex-end;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 1rem 1.5rem;
          transition: border-color 0.3s;
        }
        .input-wrap:focus-within {
          border-color: rgba(201,168,76,0.3);
        }
        .chat-input {
          flex: 1; background: transparent; border: none; outline: none;
          color: var(--cream); font-family: 'Inter', sans-serif;
          font-size: 0.88rem; font-weight: 300;
          resize: none; min-height: 24px; max-height: 120px;
          line-height: 1.6;
        }
        .chat-input::placeholder { color: rgba(255,255,255,0.2); }
        .send-btn {
          background: var(--gold); border: none;
          width: 36px; height: 36px; flex-shrink: 0;
          cursor: pointer; transition: background 0.3s;
          display: flex; align-items: center; justify-content: center;
          color: var(--dark); font-size: 0.9rem;
        }
        .send-btn:hover { background: var(--gold-light); }
        .send-btn:disabled { background: rgba(201,168,76,0.3); cursor: not-allowed; }
        .input-hint {
          font-size: 0.6rem; letter-spacing: 0.15em;
          color: rgba(255,255,255,0.2); margin-top: 0.75rem;
          text-align: center;
        }

        /* ANIMATIONS */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; } 50% { opacity: 0.3; }
        }
        @keyframes typingBounce {
          0%,60%,100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .page { grid-template-columns: 1fr; }
          .left-panel { display: none; }
          .messages { padding: 2rem 1.5rem; }
          .input-area { padding: 1rem 1.5rem 1.5rem; }
          .chat-header { padding: 1rem 1.5rem; }
        }
      `}</style>

      <div className="page">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <a href="/" className="panel-logo">
            <img src="/images/logo.png" alt="Samsara" onError={(e) => (e.currentTarget.style.display = "none")} />
          </a>
          <p className="panel-eyebrow">Journey Architect</p>
          <h1 className="panel-title">
            Your <em>Sri Lanka</em>,<br />designed by conversation
          </h1>
          <p className="panel-desc">
            Tell our Journey Architect how you want to feel. Ask questions. Dream out loud. A bespoke itinerary will emerge from the conversation.
          </p>
          <div className="panel-divider" />
          <div className="panel-hints">
            <p style={{ fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--gold)", marginBottom: "0.5rem" }}>Try saying</p>
            {[
              "\"I want to feel completely off the grid\"",
              "\"I have 10 days and I want silence\"",
              "\"Show me a Sri Lanka most tourists never see\"",
              "\"Plan something for two people in love\"",
            ].map((hint, i) => (
              <button
                key={i}
                className="hint"
                onClick={() => setInput(hint.replace(/"/g, ""))}
              >
                {hint}
              </button>
            ))}
          </div>
          <div className="panel-footer">
            Every itinerary is a starting point.<br />
            Your Samsara team will refine it personally.
          </div>
        </div>

        {/* CHAT PANEL */}
        <div className="chat-panel">
          <div className="chat-header">
            <span className="chat-header-title">Your Journey Architect</span>
            <div className="chat-status">
              <div className="status-dot" />
              Available
            </div>
          </div>

          <div className="messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`} style={{ animation: `fadeUp 0.4s ease both`, animationDelay: `${i * 0.05}s` }}>
                <div className="message-avatar">
                  {msg.role === "assistant" ? "✦" : "You"}
                </div>
                <div className="message-bubble">
                  {msg.content.split("\n").map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < msg.content.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="message-avatar">✦</div>
                <div className="message-bubble">
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="input-area">
            <div className="input-wrap">
              <textarea
                ref={inputRef}
                className="chat-input"
                placeholder="Tell me how you want to feel..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button className="send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>
                →
              </button>
            </div>
            <p className="input-hint">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </>
  );
}