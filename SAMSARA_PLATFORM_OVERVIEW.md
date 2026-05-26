# Samsāra Travel Platform — System & Technology Overview

*A plain-English but detailed explanation of how the whole platform works, plus a section-by-section reading of the project poster.*

PUSL3190 Computing Project · BSc (Hons) Technology Management · Supervisor: Mrs. Lakni Peiris

---

## 0. The 30-second summary

Samsāra is a **luxury Destination Management Company (DMC) platform**. It is made of **two separate applications** that talk to each other:

1. **The Website (`samsara-frontend`)** — what *travellers* see. A cinematic luxury site where guests get inspired, explore experiences, talk to an AI travel consultant ("the Feelings Engine"), and submit a booking request. Runs on port **3000**.

2. **The RMS (`samsara-rms`)** — what *staff* see. A back-office "Reservation Management System" where the team receives those booking requests and manages the whole journey: clients, reservations, fleet (vehicles), guides, suppliers, partners, finance, and email. Runs on port **3001**.

When a guest books on the website, the request is **forwarded automatically into the RMS**, where it becomes a real reservation that staff can work on. That hand-off is the heart of the system.

```
   TRAVELLER                                  STAFF
 ┌────────────┐   booking request   ┌──────────────────────┐
 │  Website   │ ──────────────────► │   RMS (back-office)   │
 │  :3000     │   /api/bookings     │   :3001               │
 │            │ ──────────────────► │   /api/bookings/inbound│
 │ Feelings   │                     │                        │
 │ Engine (AI)│                     │ reservation created    │
 └────────────┘                     │ + emails sent          │
                                     └──────────────────────┘
```

---

## Part 1 — The Poster, Explained

The poster is the academic "shop window" for the project. Here is what each block is saying, in plain words.

### Header
- **Samsāra — A Luxury Destination Management Platform.** The product name and its category. A "DMC" is a company that designs and runs trips inside a destination (transport, guides, hotels, experiences). "Luxury" sets the quality bar.
- **PUSL3190 / BSc (Hons) Technology Management / Plymouth ID / Supervisor.** Standard university coursework identifiers.

### THE PROBLEM — *"Luxury travel deserves a digital presence that matches its promise"*
Most DMCs still run on **manual coordination** (phone calls, spreadsheets, WhatsApp), **direct referrals** (word of mouth), and **static brochure websites** (pretty but can't *do* anything). So there's a gap: the trip being sold is world-class, but the digital experience selling it is not. That gap is the opportunity this project targets.

### AIM
Build a **full-stack** luxury DMC platform. "Full-stack" = both the part users see (front end) and the engine behind it (back end). The back end replaces manual coordination with **live provider connectivity** (a real, queryable database of vehicles/guides/suppliers) and **AI-driven personalisation** (the Feelings Engine).

### KEY OBJECTIVES
1. **Front end** — a visually sophisticated luxury web interface.
2. **Back end** — a provider-management + reservation system (this is the RMS).
3. **Feelings Engine** — emotion-driven trip personalisation (recommend trips by how you want to *feel*, not just where you want to go).
4. **OTA Connectivity** — distribution beyond direct channels. ("OTA" = Online Travel Agency, like Booking.com/Expedia. The idea: sell inventory through third-party channels too.)
5. **Responsive** — works well on phones, tablets, and desktops.

### The quote
> *"A person does not fly twelve hours because of a landmark. They go because something in them is searching — for stillness, for adventure, or simply to feel alive."*

This is the **design philosophy** behind the Feelings Engine: people travel for *feelings*, so the product is organised around feelings.

### SYSTEM ARCHITECTURE — "Two-layer full-stack platform"
The poster draws the system as two layers feeding a set of services:
- **Front End layer** (the website).
- **API layer** (the back end that the website calls).
- Services hanging off the API: **Provider DB**, **Feelings Engine** (recommendation logic), **Reservation System** (booking lifecycle), **OTA Integration** (live sync).

> ⚠️ The *labels* on this diagram (Next.js 14, Node.js · Express · JWT, React 18) describe an **earlier planned stack**. The actual build evolved — see [Part 4](#part-4--poster-vs-actual-build-honest-reconciliation) for the exact mapping. This matters if a marker asks you to defend the architecture.

### PLATFORM SECTIONS
The eight building blocks of the public website: full-screen video hero, scroll-driven navigation, the Feelings Engine UI, an "OTA connectivity layer", a destination showcase, a trips/experiences grid, an atmospheric quote section, and a multi-column footer. (This is why the poster lists **"8 UI sections".**)

### VISUAL DESIGN SYSTEM
A **dark luxury palette** (blacks, charcoal, gold accents) and the **Inter** typeface in Light + Medium weights. (In the live code this is realised with a self-hosted **"TT Fors"** font family plus Inter as fallback.) Restraint and whitespace = the visual language of luxury.

### KEY RESULTS
- **78 Lighthouse score** — Google's automated quality score (performance/accessibility/best-practices/SEO), out of 100.
- **850+ lines TypeScript** — a size indicator. *(In reality the codebase is far larger now — thousands of lines across both apps — so treat 850 as an early snapshot.)*
- **8 UI sections** — the building blocks listed above.
- **3 breakpoints** — three responsive layout widths (e.g. mobile / tablet / desktop).

### TESTING SUMMARY
- **FR-01–09** — nine functional requirements all passed across Chrome, Firefox, Safari.
- **WCAG 2.1 Level A** — the lowest tier of the web accessibility standard was met.
- **Reservation system** — provider connectivity, lifecycle, and data integrity validated.
- **OTA sandbox** — inventory sync and inbound booking processing verified. *(See the OTA note in Part 4.)*

### FINAL CONTRIBUTION
What the project claims to add to the world: replace manual DMC coordination with a **live, queryable provider inventory**; recommend journeys by **emotional intent**; extend reach via **OTA**; and set a **commercial-grade visual standard** for luxury travel brands.

### TECHNOLOGIES (as printed on the poster)
Next.js 14 · TypeScript · React 18 · Node.js · Express · PostgreSQL · Tailwind CSS · Git · ESLint.

---

## Part 2 — How the Platform Actually Works

This part describes the **real, current code** in the repository.

### 2.1 Two apps, one workspace

| App | Folder | Who uses it | Port | Framework |
|-----|--------|-------------|------|-----------|
| Public website | `samsara-frontend` | Travellers / guests | 3000 | Next.js **16.1.6**, React **19** |
| Back-office RMS | `samsara-rms` | Samsāra staff | 3001 | Next.js **16.2.2**, React **19** |

Both are **Next.js App Router** apps written in **TypeScript** and styled with **Tailwind CSS v4**. They run as independent servers but cooperate over HTTP.

### 2.2 The Website (`samsara-frontend`)

**What it is:** the storefront. Cinematic, content-rich, designed to *inspire* and then *capture a booking request*.

**Main pages (in `app/`):**
- `page.tsx` — the homepage (video hero, brand story, calls to action).
- `experiences/` — the catalogue of curated experiences.
- `destinations-page/`, `destinations/[slug]/`, `region/[slug]/` — destination and region showcases.
- `feeling-engine/` — **the live conversational Feelings Engine** (the AI chat consultant).
- `feeling-engine/wizard/` — the older **step-by-step wizard** version, kept as an alternative.
- `in-the-moment/`, `samsara-compass/`, `destination-planner/`, `itinerary-builder/`, `travel-consultant/` — supporting discovery/planning tools.
- `checkout/`, `check-in/` — booking checkout and a guest check-in flow.
- `reservations-admin/` — a lightweight in-site view of bookings the website itself captured.

**The website's own API routes (in `app/api/`):**
- `travel-consultant/` — a **thin proxy to Anthropic Claude** (the AI brain; see 2.4).
- `bookings/` and `bookings/[id]/` — **send a booking to the RMS** and read it back.
- `reservations/`, `check-in/`, `journey/` — supporting endpoints.

**Notable libraries:** `leaflet` + `react-leaflet` (interactive maps), `nodemailer` (email), self-hosted "TT Fors" fonts.

**A quirk to know — `lib/db.ts`:** the website also keeps a **simple JSON-file database** (`data/reservations.json`) for bookings it handles locally. It's a flat file the code reads/writes directly — handy for demos and as a fallback, but it is *not* the real production datastore. The real one is Supabase, inside the RMS. (This duplication is the project's known "mock-data gap".)

### 2.3 The RMS — back-office (`samsara-rms`)

**What it is:** the operational brain. Staff log in and run the business here.

**Main pages (in `src/app/`):**
- `login/` — staff sign-in.
- `dashboard/` — the operational overview.
- `reservations/`, `reservations/[id]/`, `reservations/new/`, `reservations/[id]/itinerary/` — the reservation list, a single reservation, manual creation, and per-trip itinerary.
- `clients/`, `partners/`, `suppliers/` (+ `suppliers/[id]`, `suppliers/new`), `guides/` — the people/companies Samsāra works with.
- `fleet/` — vehicles and their scheduling.
- `finance/`, `rates/`, `analytics/` — money, pricing, and reporting.
- `email/` — email/communications console.

**API routes (in `src/app/api/`):** `reservations` (+ `[id]`, `[id]/activity`, `[id]/payments`, `[id]/send-confirmation`), `bookings` and **`bookings/inbound`** (the entry point for website bookings), `check-in`, `clients`, `partners`, `suppliers`, `guides`, `fleet` (+ `availability`, `assignments`), `me`, `health`, `notify`, `recommendations`, `email-settings`, `email-test`, `gmail`.

**Data + auth:**
- **Supabase** provides the database (**managed PostgreSQL**), authentication, and row-level security. The SQL that defines the schema lives in `supabase/` (`schema.sql`, `extended-schema.sql`, `auth-rbac.sql`, `activity-log.sql`, `fleet-assignments.sql`, `booking-fields.sql`, `email-settings.sql`, `fix-rls.sql`).
- **`src/proxy.ts`** is the gatekeeper (Next.js 16's renamed "middleware"). Every request passes through it: if you're not logged in and you ask for a protected page, it redirects you to `/login`; if you hit a protected **API** route, it returns a clean **`401 JSON`** (this replaced an earlier bug where the API redirected to an HTML page and broke the website).
- **Role-based access control (RBAC):** users have roles — **admin / ops / finance / agent / partner** — and only see what their role allows.

**Notable libraries:** `@supabase/ssr` + `@supabase/supabase-js` (database/auth), `nodemailer` + `resend` + `imapflow` (sending and reading email/Gmail), `jspdf` + `jspdf-autotable` (PDF generation, e.g. itineraries/confirmations), `@dnd-kit/*` (drag-and-drop, e.g. assignments), `date-fns` (dates), `lucide-react` (icons).

### 2.4 The Feelings Engine (the AI)

This is the project's signature feature — a **conversational luxury travel consultant**.

- The guest opens `/feeling-engine` and starts a conversation ("I want to feel *alive*…").
- The page sends the chat to the website's `/api/travel-consultant` route, which is a **passthrough proxy** that forwards the request to **Anthropic's Claude API** (model `claude-sonnet-4-6`) using a secret key kept on the server.
- Claude is given a **system prompt** that makes it behave as "the Feelings Engine": a senior luxury advisor that asks **one question at a time**, writes in an evocative "Black Tomato" style, and — crucially — returns a **structured JSON object every turn**:
  `{ reply, updates, suggestions, overview, itinerary, pricing, notes, warnings, phase }`.
- The `updates` progressively **fill in a Reservation object** (traveller, trip, transport, accommodation, experiences, budget). The right-hand panel renders this as a **premium, read-only itinerary proposal** that grows as the chat continues.
- A client-side helper, **`deriveAdvisor()`**, adds rule-based intelligence offline (e.g. sizing the vehicle to the group, flagging a child seat, catching date/budget conflicts). If the AI API can't be reached, a **deterministic offline fallback** keeps the conversation usable.
- When the conversation reaches `phase: "complete"`, the engine shows a **warm closing message** ("your details have been forwarded to our reservation team…").

> Important nuance: that closing message is currently **simulated** in the conversational engine — the "Send to RMS" buttons were removed during the customer-focused redesign, so the chat version doesn't yet POST to the RMS automatically. The **wizard** version (`/feeling-engine/wizard`) *does* complete a real booking through `/api/bookings`. Wiring a silent background forward on `complete` is the obvious next step if you want the chat to create real reservations.

### 2.5 The end-to-end booking flow (the most important data journey)

```
1. Guest finishes a booking on the website
       (Feelings Engine wizard, or an Experience checkout)
                    │  POST /api/bookings   { source, type, traveller, trip… }
                    ▼
2. Website forwards it to the RMS
       POST  http://localhost:3001/api/bookings/inbound
       (20-second timeout; clean error messages if RMS is down)
                    │
                    ▼
3. RMS creates a reservation in Supabase
       status = "enquiry",  reference = "SAM-YYYY-XXXX"
                    │
                    ├──► customer confirmation email
                    └──► staff notification email
                    ▼
4. Staff open the RMS dashboard and work the reservation
       through its lifecycle (enquiry → … → completed),
       assigning fleet, guides, suppliers, and payments.
```

`source: "feeling-engine"` tells the RMS where the booking came from; `type: "save"` means "create an enquiry" (versus a paid purchase). The website never talks to the database directly — it always goes **through the RMS API**, which keeps one source of truth.

### 2.6 Reservation lifecycle

Inside the RMS, a reservation moves through defined states (a **state machine** in `src/lib/reservations/lifecycle.ts`), and every change is written to an **activity log** (`supabase/activity-log.sql`) so there's a full audit trail of who did what and when. Payments are tracked per reservation (`reservations/[id]/payments`).

---

## Part 3 — Technology Stack (as actually built)

| Layer | Technology | Where |
|-------|-----------|-------|
| Language | **TypeScript** | both apps |
| Framework | **Next.js 16** (App Router) | frontend 16.1.6 · RMS 16.2.2 |
| UI library | **React 19** | both apps |
| Styling | **Tailwind CSS v4** | both apps |
| Database | **Supabase (managed PostgreSQL)** | RMS |
| Auth | **Supabase Auth** (cookie/SSR sessions) + app-layer **RBAC** | RMS |
| Request gate | **`proxy.ts`** (Next.js 16 middleware) | RMS |
| AI | **Anthropic Claude** (`claude-sonnet-4-6`) via `/api/travel-consultant` proxy | frontend |
| Maps | **Leaflet** / react-leaflet | frontend |
| Email | **Nodemailer · Resend · ImapFlow (Gmail)** | RMS (+ nodemailer on frontend) |
| PDF | **jsPDF** + autotable | RMS |
| Drag-and-drop | **@dnd-kit** | RMS |
| Local demo store | **JSON file** via `lib/db.ts` → `data/reservations.json` | frontend |
| Tooling | **ESLint**, **Git** | both apps |

---

## Part 4 — Poster vs. Actual Build (honest reconciliation)

The poster reflects an **earlier design**; the code has since evolved. Knowing the differences will help you defend the project confidently.

| Poster says | Actual build | Why it changed / note |
|-------------|--------------|----------------------|
| **Next.js 14** | **Next.js 16** (16.1.6 / 16.2.2) | Upgraded; Next 16 renames middleware → "proxy". |
| **Node.js · Express · JWT Auth** | **Next.js App Router route handlers** (no Express); **Supabase Auth** with cookie/SSR sessions (no hand-rolled JWT) | The "API layer" is built *inside* Next.js, not as a separate Express server. |
| **React 18** | **React 19** | Came with the Next.js upgrade. |
| **Provider DB (PostgreSQL)** | **Supabase** (managed PostgreSQL) — *plus* a JSON-file store on the website | Supabase gives Postgres + auth + row-level security out of the box. |
| **Feelings Engine = "recommendation logic"** | A genuine **conversational AI** powered by **Anthropic Claude**, with a rule-based offline fallback | Far beyond simple recommendation rules. |
| **OTA Integration / "OTA sandbox verified"** | **Not implemented in code** — no OTA endpoints or channel-manager integration exist | This is an **aspirational objective**; it appears in copy/diagrams but has no working implementation yet. Be ready to frame it as "future work" if asked. |
| **850+ lines TypeScript** | Much larger — thousands of lines across both apps | The poster figure is an early snapshot. |
| **78 Lighthouse · 8 sections · 3 breakpoints** | Plausible frontend metrics | Not re-verified in this document; re-run Lighthouse before the viva if you want a current number. |

**Bottom line:** the *vision* on the poster is intact, and most of it is real and working. The two honest caveats are (1) **OTA connectivity is not built**, and (2) the **stack labels are out of date** (it's Next.js 16 + Supabase, not Next 14 + Express + JWT).

---

## Part 5 — How to run it

Both apps are needed for the full booking flow to work end-to-end.

```bash
# 1. The website  →  http://localhost:3000
cd samsara-frontend
npm install
npm run dev

# 2. The RMS  →  http://localhost:3001
cd samsara-rms
npm install
npm run dev          # already pinned to port 3001
```

**Environment variables** (each app has a `.env.local`, which is git-ignored and never pushed):
- Frontend: `ANTHROPIC_API_KEY` (for the Feelings Engine), `RMS_URL` (defaults to `http://localhost:3001`).
- RMS: Supabase URL + keys (anon + service-role), and email/Gmail credentials.

**Seeding the RMS** (first-time setup): `npm run seed:users` and `npm run seed:fleet` create demo staff accounts and vehicles.

**Health check:** `GET http://localhost:3001/api/health` confirms the RMS is up.

---

*Document generated from the live codebase on 2026-05-26. If the poster is updated for submission, reconcile the stack labels (Next.js 16, Supabase) and either implement a minimal OTA stub or relabel OTA as planned future work.*
