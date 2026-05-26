"use client";

import { useState } from "react";

/* ── TYPES ───────────────────────────────────────────────────────────── */

interface Hotel {
  id: string; name: string; tagline: string; category: string;
  pricePerNight: number; image: string; rating: number;
  location: string; amenities: string[];
}
interface Vehicle {
  id: string; name: string; type: string; pricePerDay: number;
  capacity: number; features: string[]; bg: string; accent: string; icon: string;
}
interface Activity {
  id: string; name: string; category: string; pricePerPerson: number;
  duration: string; image: string; badge?: string;
}
interface BookingForm { fullName: string; email: string; phone: string; arrivalDate: string; notes: string; }

/* ── DATA ────────────────────────────────────────────────────────────── */

const HOTELS: Hotel[] = [
  {
    id: "amangalla", name: "Amangalla", tagline: "A sanctuary within the Fort's ancient walls",
    category: "Luxury Heritage", pricePerNight: 850, image: "/images/hotels/amangalla.webp",
    rating: 5, location: "Galle Fort",
    amenities: ["Private Pool", "Spa & Wellness", "Fine Dining", "Butler Service"],
  },
  {
    id: "cape-weligama", name: "Cape Weligama", tagline: "Perched on a clifftop above the Indian Ocean",
    category: "Clifftop Resort", pricePerNight: 620, image: "/images/hotels/cape-waligma.webp",
    rating: 5, location: "Weligama Bay",
    amenities: ["Infinity Pool", "Ocean Panorama", "Surf School", "Yoga Pavilion"],
  },
  {
    id: "fort-residency", name: "The Fort Residency", tagline: "Colonial elegance reimagined for modern travellers",
    category: "Boutique Heritage", pricePerNight: 280, image: "/images/hotels/the-fort-recidency.webp",
    rating: 4, location: "Galle Fort",
    amenities: ["Courtyard Pool", "Colonial Restaurant", "Rooftop Bar", "Terrace"],
  },
  {
    id: "heritage-galle", name: "The Heritage Galle", tagline: "Dutch colonial charm meets tropical luxury",
    category: "Colonial Classic", pricePerNight: 320, image: "/images/hotels/hotel1.jpg",
    rating: 4, location: "Galle City",
    amenities: ["Garden Pool", "Colonial Dining", "Ayurveda Spa", "Cultural Events"],
  },
];

const VEHICLES: Vehicle[] = [
  {
    id: "mercedes-gle", name: "Mercedes-Benz GLE", type: "Luxury SUV", pricePerDay: 140, capacity: 4,
    features: ["Climate Control", "Leather Interior", "Wi-Fi Hotspot", "Champagne on Arrival", "Professional Chauffeur"],
    bg: "linear-gradient(145deg,#1a1410 0%,#2c2218 100%)", accent: "#C9A84C", icon: "◈",
  },
  {
    id: "land-cruiser", name: "Toyota Land Cruiser", type: "Premium 4×4", pricePerDay: 110, capacity: 6,
    features: ["All-Terrain Capable", "Panoramic Roof", "Ice-Cold Cooler Box", "USB Charging", "Experienced Safari Guide"],
    bg: "linear-gradient(145deg,#0f1a0d 0%,#1a2a14 100%)", accent: "#6abf5e", icon: "◉",
  },
  {
    id: "hiace", name: "Toyota HiAce VIP", type: "Luxury Minivan", pricePerDay: 85, capacity: 8,
    features: ["Spacious Captain Seats", "Entertainment Screen", "Luggage Compartment", "Full AC", "Curtained Windows"],
    bg: "linear-gradient(145deg,#0a0f1a 0%,#0f1a2e 100%)", accent: "#5a9abf", icon: "◫",
  },
  {
    id: "tuk-tuk", name: "Private Tuk-Tuk", type: "Iconic Local", pricePerDay: 35, capacity: 2,
    features: ["Open-Air Freedom", "Local Expert Driver", "Authentic Sri Lanka", "Fort Street Access", "Photo Stops Included"],
    bg: "linear-gradient(145deg,#1a0d00 0%,#2e1a00 100%)", accent: "#d4832a", icon: "◎",
  },
];

const ACTIVITIES: Activity[] = [
  {
    id: "fort-walk", name: "Galle Fort Heritage Walk", category: "Cultural",
    pricePerPerson: 65, duration: "3 hrs", image: "/images/galle-act-1.webp", badge: "Most Popular",
  },
  {
    id: "whale-watch", name: "Blue Whale Expedition", category: "Marine",
    pricePerPerson: 120, duration: "5 hrs", image: "/images/galle-act-2.webp", badge: "Seasonal",
  },
  {
    id: "surf-lesson", name: "Surf Lesson at Midigama", category: "Adventure",
    pricePerPerson: 85, duration: "3 hrs", image: "/images/galle-act-3.webp",
  },
  {
    id: "cooking", name: "Sri Lankan Cooking Masterclass", category: "Culinary",
    pricePerPerson: 75, duration: "3 hrs", image: "/images/galle-trip-1.webp",
  },
  {
    id: "sunset-sail", name: "Sunset Sailing Cruise", category: "Marine",
    pricePerPerson: 95, duration: "2.5 hrs", image: "/images/galle-trip-2.webp", badge: "Signature",
  },
  {
    id: "tea-estate", name: "Southern Tea Estate Tour", category: "Nature",
    pricePerPerson: 55, duration: "Half Day", image: "/images/galle-trip-3.webp",
  },
];

/* ── COMPONENT ───────────────────────────────────────────────────────── */

export default function DestinationPlannerPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phase, setPhase] = useState<"browse" | "review" | "success">("browse");
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [nights, setNights] = useState(3);
  const [travelers, setTravelers] = useState(2);
  const [bookingForm, setBookingForm] = useState<BookingForm>({ fullName: "", email: "", phone: "", arrivalDate: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  const hotel    = HOTELS.find(h => h.id === selectedHotel) ?? null;
  const vehicle  = VEHICLES.find(v => v.id === selectedVehicle) ?? null;
  const activities = ACTIVITIES.filter(a => selectedActivities.includes(a.id));

  const hotelCost      = hotel    ? hotel.pricePerNight  * nights   : 0;
  const vehicleCost    = vehicle  ? vehicle.pricePerDay  * nights   : 0;
  const activitiesCost = activities.reduce((s, a) => s + a.pricePerPerson * travelers, 0);
  const total          = hotelCost + vehicleCost + activitiesCost;

  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);
  const canNext = step === 1 ? !!selectedHotel : step === 2 ? !!selectedVehicle : true;

  function toggleActivity(id: string) {
    setSelectedActivities(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function submitBooking() {
    setSubmitting(true);
    const ref = "GAL-" + Date.now().toString(36).toUpperCase().slice(-4) + "-" + Math.random().toString(36).substring(2,5).toUpperCase();
    try {
      await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "feeling-engine", type: "purchase",
          itineraryTitle: `Galle — ${nights} nights, ${travelers} travellers`,
          itineraryDestination: "Galle, Sri Lanka",
          itineraryDuration: `${nights} nights`,
          total,
          form: {
            fullName: bookingForm.fullName, email: bookingForm.email,
            phone: bookingForm.phone, travelers: String(travelers),
            travelDate: bookingForm.arrivalDate, specialRequests: bookingForm.notes,
          },
        }),
      });
    } catch { /* fallback */ }
    setBookingRef(ref);
    setPhase("success");
    setSubmitting(false);
  }

  /* ── CSS ─────────────────────────────────────────────────────────── */
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500&display=swap');

    :root {
      --gold: #C9A84C; --gold-l: #E2C97E; --gold-d: rgba(201,168,76,0.12);
      --dark: #080808; --dark2: #0f0f0f; --dark3: #161616;
      --cream: #F2EDE4; --cream-d: #a89f92; --white: #fff;
    }
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { background: var(--dark); color: var(--cream); font-family: 'Inter', sans-serif; font-weight: 300; }

    /* HERO */
    .dp-hero {
      position: relative; height: 78vh; min-height: 520px; overflow: hidden;
      display: flex; flex-direction: column; justify-content: flex-end; align-items: center;
      padding-bottom: 4rem; text-align: center;
    }
    .dp-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 30%; }
    .dp-hero-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, #080808 0%, rgba(8,8,8,0.6) 45%, rgba(8,8,8,0.25) 100%);
    }
    .dp-hero-content { position: relative; z-index: 2; }
    .dp-hero-eyebrow {
      font-size: 0.55rem; letter-spacing: 0.5em; text-transform: uppercase;
      color: var(--gold); margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.75rem;
    }
    .dp-hero-eyebrow::before, .dp-hero-eyebrow::after { content: ''; width: 32px; height: 1px; background: var(--gold); }
    .dp-hero-title {
      font-family: 'TT Fors', sans-serif; font-weight: 300; font-size: clamp(2.6rem, 6vw, 5rem);
      font-weight: 300; color: var(--white); line-height: 1.08; margin-bottom: 0.8rem;
          text-transform: uppercase; letter-spacing: 0.08em;
    }
    .dp-hero-sub { font-size: 0.88rem; color: rgba(255,255,255,0.55); letter-spacing: 0.05em; margin-bottom: 2rem; }
    .dp-hero-pills { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .dp-hero-pill {
      padding: 0.4rem 1.1rem; border: 1px solid rgba(201,168,76,0.35);
      font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold);
    }

    /* CONFIG BAR */
    .dp-config {
      position: sticky; top: 0; z-index: 50;
      background: rgba(8,8,8,0.95); backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(201,168,76,0.12);
      display: flex; align-items: center; justify-content: center; gap: 0; flex-wrap: wrap;
    }
    .dp-config-item {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.9rem 2rem;
      border-right: 1px solid rgba(255,255,255,0.06);
    }
    .dp-config-item:last-child { border-right: none; }
    .dp-config-label { font-size: 0.55rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--cream-d); }
    .dp-config-ctrl { display: flex; align-items: center; gap: 0.5rem; }
    .dp-config-btn {
      width: 26px; height: 26px; border: 1px solid rgba(255,255,255,0.12); background: none;
      color: var(--cream); cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .dp-config-btn:hover { border-color: var(--gold); color: var(--gold); }
    .dp-config-val { font-family: 'TT Fors', sans-serif; font-weight: 300; font-size: 1.2rem; color: var(--white); min-width: 24px; text-align: center; }
    .dp-total-pill {
      padding: 0.4rem 1.25rem; background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.25);
      font-size: 0.62rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold);
      display: flex; align-items: center; gap: 0.5rem; margin-left: 1rem;
    }
    .dp-total-pill strong { font-family: 'TT Fors', sans-serif; font-size: 1.1rem; font-weight: 300; letter-spacing: 0; }

    /* STEP NAV */
    .dp-step-nav {
      display: grid; grid-template-columns: 1fr 1fr 1fr;
      border-bottom: 1px solid rgba(255,255,255,0.05); max-width: 860px; margin: 0 auto;
    }
    .dp-step-btn {
      padding: 1.4rem 1rem; background: none; border: none; border-bottom: 2px solid transparent;
      cursor: pointer; font-family: 'Inter', sans-serif; font-size: 0.5rem;
      letter-spacing: 0.4em; text-transform: uppercase; color: rgba(255,255,255,0.25);
      transition: all 0.3s; position: relative; display: flex; align-items: center; justify-content: center; gap: 0.6rem;
    }
    .dp-step-btn + .dp-step-btn { border-left: 1px solid rgba(255,255,255,0.05); }
    .dp-step-btn .dp-step-num {
      width: 22px; height: 22px; border-radius: 50%; border: 1px solid currentColor;
      display: flex; align-items: center; justify-content: center; font-size: 0.55rem; flex-shrink: 0;
    }
    .dp-step-btn.done { color: rgba(201,168,76,0.6); }
    .dp-step-btn.done .dp-step-num { background: rgba(201,168,76,0.15); border-color: var(--gold); }
    .dp-step-btn.active { color: var(--gold); }
    .dp-step-btn.active .dp-step-num { background: var(--gold); border-color: var(--gold); color: var(--dark); }
    .dp-step-btn.active::after {
      content: ''; position: absolute; bottom: -2px; left: 10%; right: 10%;
      height: 2px; background: linear-gradient(90deg, transparent, var(--gold), transparent);
    }
    .dp-step-btn:hover:not(.active) { color: rgba(255,255,255,0.5); }

    /* MAIN LAYOUT */
    .dp-body { max-width: 1380px; margin: 0 auto; padding: 2.5rem 1.5rem 6rem; }
    .dp-layout { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; align-items: start; }

    /* SECTION HEADER */
    .dp-section-head { margin-bottom: 1.75rem; }
    .dp-section-eyebrow { font-size: 0.52rem; letter-spacing: 0.35em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.5rem; }
    .dp-section-title { font-family: 'TT Fors', sans-serif; font-size: 1.75rem; font-weight: 300; color: var(--white); margin-bottom: 0.3rem;  text-transform: uppercase; letter-spacing: 0.08em; }
    .dp-section-sub { font-size: 0.78rem; color: var(--cream-d); line-height: 1.7; }

    /* HOTEL CARDS */
    .dp-hotel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem; }
    .dp-hotel-card {
      border: 1px solid rgba(255,255,255,0.06); overflow: hidden; cursor: pointer;
      transition: all 0.3s; position: relative; background: var(--dark2);
    }
    .dp-hotel-card:hover { border-color: rgba(201,168,76,0.3); transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.5); }
    .dp-hotel-card.selected { border-color: var(--gold); box-shadow: 0 0 0 1px var(--gold), 0 16px 48px rgba(201,168,76,0.15); }
    .dp-hotel-img { width: 100%; height: 200px; object-fit: cover; display: block; transition: transform 0.55s ease; }
    .dp-hotel-card:hover .dp-hotel-img { transform: scale(1.05); }
    .dp-hotel-card-body { padding: 1.1rem 1.25rem 1.25rem; }
    .dp-hotel-category { font-size: 0.52rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.3rem; }
    .dp-hotel-name { font-family: 'TT Fors', sans-serif; font-size: 1.2rem; font-weight: 300; color: var(--white); margin-bottom: 0.2rem; }
    .dp-hotel-tagline { font-size: 0.7rem; color: var(--cream-d);  margin-bottom: 0.75rem; line-height: 1.5; }
    .dp-hotel-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .dp-hotel-rating { font-size: 0.62rem; color: var(--gold); letter-spacing: 0.05em; }
    .dp-hotel-location { font-size: 0.62rem; color: var(--cream-d); }
    .dp-hotel-amenities { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1rem; }
    .dp-amenity { font-size: 0.55rem; padding: 0.2rem 0.55rem; border: 1px solid rgba(255,255,255,0.1); color: var(--cream-d); letter-spacing: 0.06em; }
    .dp-hotel-price-row { display: flex; align-items: baseline; justify-content: space-between; }
    .dp-hotel-price { font-family: 'TT Fors', sans-serif; font-weight: 300; font-size: 1.4rem; color: var(--gold-l); }
    .dp-hotel-price span { font-family: 'Inter', sans-serif; font-size: 0.58rem; color: var(--cream-d); margin-left: 0.3rem; }
    .dp-select-badge {
      position: absolute; top: 0.85rem; right: 0.85rem;
      width: 30px; height: 30px; border-radius: 50%; background: var(--gold);
      display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: var(--dark);
      opacity: 0; transition: opacity 0.25s;
    }
    .dp-hotel-card.selected .dp-select-badge { opacity: 1; }

    /* VEHICLE CARDS */
    .dp-vehicle-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem; }
    .dp-vehicle-card {
      border: 1px solid rgba(255,255,255,0.06); overflow: hidden; cursor: pointer;
      transition: all 0.3s; position: relative;
    }
    .dp-vehicle-card:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.5); }
    .dp-vehicle-card.selected { box-shadow: 0 0 0 1px var(--gold), 0 16px 48px rgba(201,168,76,0.15); }
    .dp-vehicle-top {
      height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center;
      position: relative; padding: 1.5rem;
    }
    .dp-vehicle-icon { font-size: 2.8rem; margin-bottom: 0.75rem; }
    .dp-vehicle-type-badge {
      font-size: 0.52rem; letter-spacing: 0.25em; text-transform: uppercase;
      padding: 0.25rem 0.75rem; border: 1px solid; margin-bottom: 0.5rem;
    }
    .dp-vehicle-name { font-family: 'TT Fors', sans-serif; font-size: 1.1rem; font-weight: 300; color: var(--white); text-align: center; }
    .dp-vehicle-body { padding: 1rem 1.25rem 1.25rem; background: var(--dark2); }
    .dp-vehicle-features { list-style: none; margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.35rem; }
    .dp-vehicle-features li { font-size: 0.68rem; color: var(--cream-d); display: flex; align-items: center; gap: 0.5rem; }
    .dp-vehicle-features li::before { content: '◆'; font-size: 0.35rem; color: var(--gold); flex-shrink: 0; }
    .dp-vehicle-footer { display: flex; justify-content: space-between; align-items: baseline; }
    .dp-vehicle-cap { font-size: 0.6rem; color: var(--cream-d); }
    .dp-vehicle-price { font-family: 'TT Fors', sans-serif; font-weight: 300; font-size: 1.35rem; color: var(--gold-l); }
    .dp-vehicle-price span { font-family: 'Inter', sans-serif; font-size: 0.55rem; color: var(--cream-d); margin-left: 0.25rem; }
    .dp-vehicle-check {
      position: absolute; top: 0.85rem; right: 0.85rem;
      width: 28px; height: 28px; border-radius: 50%; background: var(--gold);
      display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: var(--dark);
      opacity: 0; transition: opacity 0.25s;
    }
    .dp-vehicle-card.selected .dp-vehicle-check { opacity: 1; }

    /* ACTIVITY CARDS */
    .dp-activity-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.1rem; margin-bottom: 1.5rem; }
    .dp-activity-card {
      border: 1px solid rgba(255,255,255,0.06); overflow: hidden; cursor: pointer;
      transition: all 0.3s; position: relative; background: var(--dark2);
    }
    .dp-activity-card:hover { border-color: rgba(201,168,76,0.3); transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.45); }
    .dp-activity-card.selected { border-color: var(--gold); box-shadow: 0 0 0 1px var(--gold); }
    .dp-activity-img-wrap { position: relative; overflow: hidden; }
    .dp-activity-img { width: 100%; height: 150px; object-fit: cover; display: block; transition: transform 0.5s ease; }
    .dp-activity-card:hover .dp-activity-img { transform: scale(1.07); }
    .dp-activity-badge {
      position: absolute; top: 0.65rem; left: 0.65rem;
      font-size: 0.48rem; padding: 0.2rem 0.55rem; letter-spacing: 0.18em; text-transform: uppercase;
      background: var(--gold); color: var(--dark);
    }
    .dp-activity-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(8,8,8,0.7) 0%, transparent 60%);
      opacity: 0; transition: opacity 0.3s;
    }
    .dp-activity-card.selected .dp-activity-overlay,
    .dp-activity-card:hover .dp-activity-overlay { opacity: 1; }
    .dp-activity-body { padding: 0.85rem 1rem 1rem; }
    .dp-activity-cat { font-size: 0.5rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.3rem; }
    .dp-activity-name { font-family: 'TT Fors', sans-serif; font-size: 1rem; font-weight: 300; color: var(--white); margin-bottom: 0.5rem; line-height: 1.3; }
    .dp-activity-footer { display: flex; justify-content: space-between; align-items: center; }
    .dp-activity-dur { font-size: 0.6rem; color: var(--cream-d); }
    .dp-activity-price { font-family: 'TT Fors', sans-serif; font-weight: 300; font-size: 1.05rem; color: var(--gold-l); }
    .dp-activity-price span { font-family: 'Inter', sans-serif; font-size: 0.52rem; color: var(--cream-d); }
    .dp-activity-tick {
      position: absolute; top: 0.65rem; right: 0.65rem;
      width: 26px; height: 26px; border-radius: 50%; background: var(--gold);
      display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: var(--dark);
      opacity: 0; transition: opacity 0.22s; z-index: 2;
    }
    .dp-activity-card.selected .dp-activity-tick { opacity: 1; }

    /* NAVIGATION BUTTONS */
    .dp-nav-row { display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; }
    .dp-btn-back {
      background: none; border: 1px solid rgba(255,255,255,0.12); color: var(--cream-d);
      padding: 0.75rem 1.5rem; font-family: 'Inter', sans-serif; font-size: 0.62rem;
      letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer; transition: all 0.25s;
    }
    .dp-btn-back:hover { border-color: rgba(255,255,255,0.3); color: var(--cream); }
    .dp-btn-next {
      background: var(--gold); color: var(--dark); border: none;
      padding: 0.85rem 2rem; font-family: 'Inter', sans-serif; font-size: 0.65rem;
      letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; transition: background 0.25s;
    }
    .dp-btn-next:hover:not(:disabled) { background: var(--gold-l); }
    .dp-btn-next:disabled { background: rgba(201,168,76,0.25); cursor: not-allowed; }
    .dp-btn-review {
      background: var(--dark3); color: var(--cream); border: 1px solid rgba(201,168,76,0.3);
      padding: 0.85rem 2rem; font-family: 'Inter', sans-serif; font-size: 0.65rem;
      letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; transition: all 0.25s;
    }
    .dp-btn-review:hover { background: rgba(201,168,76,0.08); border-color: var(--gold); color: var(--gold); }

    /* SIDEBAR */
    .dp-sidebar {
      position: sticky; top: 56px; background: var(--dark2);
      border: 1px solid rgba(255,255,255,0.07); max-height: calc(100vh - 72px); overflow-y: auto;
    }
    .dp-sidebar-header {
      padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06);
      background: rgba(201,168,76,0.04);
    }
    .dp-sidebar-eyebrow { font-size: 0.5rem; letter-spacing: 0.35em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.3rem; }
    .dp-sidebar-dest { font-family: 'TT Fors', sans-serif; font-size: 1.2rem; font-weight: 300; color: var(--white); }
    .dp-sidebar-meta { font-size: 0.65rem; color: var(--cream-d); margin-top: 0.2rem; }
    .dp-sidebar-hero { width: 100%; height: 110px; object-fit: cover; object-position: center 40%; display: block; }
    .dp-sidebar-section { padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .dp-sidebar-section-label {
      font-size: 0.5rem; letter-spacing: 0.28em; text-transform: uppercase; color: var(--cream-d); margin-bottom: 0.75rem;
    }
    .dp-sidebar-empty {
      padding: 0.65rem 0.9rem; border: 1px dashed rgba(255,255,255,0.1);
      font-size: 0.65rem; color: rgba(255,255,255,0.25); text-align: center; 
    }
    .dp-sidebar-item {
      display: flex; gap: 0.75rem; align-items: flex-start; position: relative;
    }
    .dp-sidebar-item-img { width: 52px; height: 52px; object-fit: cover; flex-shrink: 0; }
    .dp-sidebar-item-icon {
      width: 52px; height: 52px; flex-shrink: 0; display: flex; align-items: center;
      justify-content: center; font-size: 1.4rem;
    }
    .dp-sidebar-item-name { font-size: 0.8rem; color: var(--cream); margin-bottom: 0.2rem; line-height: 1.3; }
    .dp-sidebar-item-price { font-size: 0.65rem; color: var(--gold); }
    .dp-sidebar-item-sub { font-size: 0.58rem; color: var(--cream-d); }
    .dp-sidebar-remove {
      position: absolute; top: 0; right: 0; background: none; border: none;
      color: rgba(255,255,255,0.2); cursor: pointer; font-size: 1rem; line-height: 1;
      transition: color 0.2s; padding: 0;
    }
    .dp-sidebar-remove:hover { color: rgba(255,80,80,0.7); }
    .dp-sidebar-activity-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .dp-sidebar-act { display: flex; align-items: center; gap: 0.6rem; }
    .dp-sidebar-act-img { width: 38px; height: 38px; object-fit: cover; flex-shrink: 0; }
    .dp-sidebar-act-name { font-size: 0.7rem; color: var(--cream); flex: 1; line-height: 1.35; }
    .dp-sidebar-act-price { font-size: 0.65rem; color: var(--gold); flex-shrink: 0; }
    .dp-sidebar-act-remove { background: none; border: none; color: rgba(255,255,255,0.2); cursor: pointer; font-size: 0.85rem; padding: 0; transition: color 0.2s; }
    .dp-sidebar-act-remove:hover { color: rgba(255,80,80,0.7); }
    .dp-sidebar-breakdown { padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .dp-breakdown-row { display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--cream-d); margin-bottom: 0.4rem; }
    .dp-breakdown-row span:last-child { color: var(--cream); }
    .dp-sidebar-total { padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: baseline; }
    .dp-sidebar-total-l { font-size: 0.55rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--cream-d); }
    .dp-sidebar-total-v { font-family: 'TT Fors', sans-serif; font-size: 1.65rem; font-weight: 300; color: var(--gold-l);  text-transform: uppercase; letter-spacing: 0.08em; }
    .dp-sidebar-cta {
      margin: 0 1.5rem 1.5rem; display: block; background: var(--gold); color: var(--dark);
      border: none; padding: 1rem; font-family: 'Inter', sans-serif; font-size: 0.65rem;
      letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; width: calc(100% - 3rem);
      transition: background 0.25s;
    }
    .dp-sidebar-cta:hover:not(:disabled) { background: var(--gold-l); }
    .dp-sidebar-cta:disabled { background: rgba(201,168,76,0.2); cursor: not-allowed; }
    .dp-sidebar-note { padding: 0 1.5rem 1.25rem; font-size: 0.58rem; color: rgba(255,255,255,0.2); line-height: 1.6; }

    /* REVIEW PHASE */
    .dp-review { max-width: 900px; margin: 0 auto; padding: 3.5rem 1.5rem 6rem; }
    .dp-review-title { font-family: 'TT Fors', sans-serif; font-size: 2.2rem; font-weight: 300; color: var(--white); margin-bottom: 0.4rem;  text-transform: uppercase; letter-spacing: 0.08em; }
    .dp-review-sub { font-size: 0.8rem; color: var(--cream-d); margin-bottom: 2.5rem; line-height: 1.7; }
    .dp-review-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 2rem; }
    .dp-review-card { background: var(--dark2); border: 1px solid rgba(255,255,255,0.07); overflow: hidden; }
    .dp-review-card-img { width: 100%; height: 140px; object-fit: cover; display: block; }
    .dp-review-card-icon { width: 100%; height: 140px; display: flex; align-items: center; justify-content: center; font-size: 3rem; }
    .dp-review-card-body { padding: 1rem 1.25rem; }
    .dp-review-card-label { font-size: 0.5rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.35rem; }
    .dp-review-card-name { font-family: 'TT Fors', sans-serif; font-size: 1.15rem; font-weight: 300; color: var(--white); margin-bottom: 0.3rem; }
    .dp-review-card-meta { font-size: 0.68rem; color: var(--cream-d); }
    .dp-review-card-price { font-family: 'TT Fors', sans-serif; font-weight: 300; font-size: 1.1rem; color: var(--gold-l); margin-top: 0.5rem; }
    .dp-review-card-edit {
      margin-top: 0.75rem; background: none; border: 1px solid rgba(255,255,255,0.1); color: var(--cream-d);
      padding: 0.35rem 0.85rem; font-family: 'Inter', sans-serif; font-size: 0.55rem;
      letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; transition: all 0.22s;
    }
    .dp-review-card-edit:hover { border-color: var(--gold); color: var(--gold); }
    .dp-review-acts { grid-column: 1 / -1; background: var(--dark2); border: 1px solid rgba(255,255,255,0.07); padding: 1.25rem; }
    .dp-review-acts-title { font-size: 0.5rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); margin-bottom: 1rem; }
    .dp-review-acts-list { display: flex; flex-direction: column; gap: 0.6rem; }
    .dp-review-act { display: flex; align-items: center; gap: 0.85rem; }
    .dp-review-act-img { width: 48px; height: 48px; object-fit: cover; flex-shrink: 0; }
    .dp-review-act-info { flex: 1; }
    .dp-review-act-name { font-size: 0.82rem; color: var(--cream); }
    .dp-review-act-meta { font-size: 0.62rem; color: var(--cream-d); }
    .dp-review-act-price { font-family: 'TT Fors', sans-serif; font-weight: 300; font-size: 1rem; color: var(--gold-l); flex-shrink: 0; }
    .dp-review-total-bar {
      display: flex; justify-content: space-between; align-items: baseline;
      padding: 1.25rem 1.5rem; background: rgba(201,168,76,0.06); border: 1px solid rgba(201,168,76,0.2);
      margin-bottom: 2rem;
    }
    .dp-review-total-l { font-size: 0.6rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--cream-d); }
    .dp-review-total-v { font-family: 'TT Fors', sans-serif; font-size: 2.2rem; font-weight: 300; color: var(--gold-l);  text-transform: uppercase; letter-spacing: 0.08em; }

    /* BOOKING FORM */
    .dp-form { background: var(--dark2); border: 1px solid rgba(255,255,255,0.07); padding: 2rem; margin-bottom: 1.5rem; }
    .dp-form-title { font-family: 'TT Fors', sans-serif; font-size: 1.4rem; font-weight: 300; color: var(--white); margin-bottom: 1.5rem; }
    .dp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .dp-form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .dp-form-group.full { grid-column: 1 / -1; }
    .dp-form-label { font-size: 0.55rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--cream-d); }
    .dp-form-input, .dp-form-textarea {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
      color: var(--cream); font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 300;
      padding: 0.7rem 0.9rem; outline: none; transition: border-color 0.25s; width: 100%;
    }
    .dp-form-input:focus, .dp-form-textarea:focus { border-color: rgba(201,168,76,0.4); }
    .dp-form-input::placeholder, .dp-form-textarea::placeholder { color: rgba(255,255,255,0.18); }
    .dp-form-textarea { min-height: 80px; resize: vertical; }
    .dp-review-actions { display: flex; gap: 1rem; align-items: center; }
    .dp-confirm-btn {
      background: var(--gold); color: var(--dark); border: none;
      padding: 1.1rem 2.5rem; font-family: 'Inter', sans-serif; font-size: 0.68rem;
      letter-spacing: 0.22em; text-transform: uppercase; cursor: pointer; transition: background 0.25s;
      display: flex; align-items: center; gap: 0.65rem;
    }
    .dp-confirm-btn:hover:not(:disabled) { background: var(--gold-l); }
    .dp-confirm-btn:disabled { background: rgba(201,168,76,0.25); cursor: not-allowed; }
    .dp-confirm-spinner {
      width: 16px; height: 16px; border: 2px solid rgba(8,8,8,0.3);
      border-top-color: var(--dark); border-radius: 50%;
      animation: dp-spin 0.8s linear infinite; flex-shrink: 0;
    }
    .dp-back-btn {
      background: none; border: 1px solid rgba(255,255,255,0.12); color: var(--cream-d);
      padding: 1.1rem 1.75rem; font-family: 'Inter', sans-serif; font-size: 0.62rem;
      letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer; transition: all 0.25s;
    }
    .dp-back-btn:hover { border-color: rgba(255,255,255,0.3); color: var(--cream); }

    /* SUCCESS */
    .dp-success {
      min-height: 80vh; display: flex; flex-direction: column; align-items: center;
      justify-content: center; text-align: center; padding: 5rem 2rem; gap: 1.75rem;
    }
    .dp-success-mark {
      width: 72px; height: 72px; border-radius: 50%; border: 1px solid rgba(201,168,76,0.4);
      background: rgba(201,168,76,0.08); display: flex; align-items: center; justify-content: center;
      font-size: 1.8rem; color: var(--gold);
    }
    .dp-success-title { font-family: 'TT Fors', sans-serif; font-size: clamp(1.8rem,4vw,2.8rem); font-weight: 300; color: var(--white);  text-transform: uppercase; letter-spacing: 0.08em; }
    .dp-success-sub { font-size: 0.85rem; color: var(--cream-d); max-width: 480px; line-height: 1.9; }
    .dp-success-ref { padding: 1.25rem 2.5rem; background: rgba(201,168,76,0.07); border: 1px solid rgba(201,168,76,0.3); }
    .dp-success-ref-label { font-size: 0.55rem; letter-spacing: 0.35em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.4rem; }
    .dp-success-ref-code { font-family: 'TT Fors', sans-serif; font-weight: 300; font-size: 2rem; color: var(--white); letter-spacing: 0.15em;  text-transform: uppercase; letter-spacing: 0.08em; }
    .dp-success-home {
      background: var(--gold); color: var(--dark); border: none;
      padding: 0.9rem 2rem; font-family: 'Inter', sans-serif; font-size: 0.65rem;
      letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; transition: background 0.25s;
    }
    .dp-success-home:hover { background: var(--gold-l); }

    /* ANIMATIONS */
    @keyframes dp-spin { to { transform: rotate(360deg); } }
    @keyframes dp-fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    .dp-anim { animation: dp-fadeUp 0.4s ease both; }

    /* RESPONSIVE */
    @media (max-width: 1100px) {
      .dp-layout { grid-template-columns: 1fr; }
      .dp-sidebar { position: static; max-height: none; }
    }
    @media (max-width: 860px) {
      .dp-hotel-grid, .dp-vehicle-grid { grid-template-columns: 1fr; }
      .dp-activity-grid { grid-template-columns: 1fr 1fr; }
      .dp-review-grid { grid-template-columns: 1fr; }
      .dp-form-grid { grid-template-columns: 1fr; }
      .dp-form-group.full { grid-column: 1; }
    }
    @media (max-width: 560px) {
      .dp-activity-grid { grid-template-columns: 1fr; }
      .dp-review-actions { flex-direction: column; }
    }
  `;

  /* ── SUCCESS ─────────────────────────────────────────────────────── */
  if (phase === "success") {
    return (
      <>
        <style>{css}</style>
        <div className="dp-success dp-anim">
          <div className="dp-success-mark">✦</div>
          <h2 className="dp-success-title">Your Galle Journey<br />Has Been Reserved</h2>
          <p className="dp-success-sub">Our team has received your itinerary and will confirm all arrangements within 24 hours. No payment is collected at this stage.</p>
          <div className="dp-success-ref">
            <p className="dp-success-ref-label">Booking Reference</p>
            <p className="dp-success-ref-code">{bookingRef}</p>
          </div>
          <button className="dp-success-home" onClick={() => window.location.href = "/"}>Return to Home</button>
        </div>
      </>
    );
  }

  /* ── REVIEW ──────────────────────────────────────────────────────── */
  if (phase === "review") {
    const isValid = bookingForm.fullName.trim() && bookingForm.email.trim() && bookingForm.phone.trim() && bookingForm.arrivalDate;
    return (
      <>
        <style>{css}</style>
        <div className="dp-review dp-anim">
          <h2 className="dp-review-title">Review Your Galle Journey</h2>
          <p className="dp-review-sub">Confirm your selections below. You can edit any section before submitting.</p>

          <div className="dp-review-grid">
            {/* Hotel */}
            {hotel && (
              <div className="dp-review-card">
                <img className="dp-review-card-img" src={hotel.image} alt={hotel.name}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/galle.webp"; }} />
                <div className="dp-review-card-body">
                  <p className="dp-review-card-label">Accommodation · {nights} nights</p>
                  <p className="dp-review-card-name">{hotel.name}</p>
                  <p className="dp-review-card-meta">{hotel.location} · {hotel.category}</p>
                  <p className="dp-review-card-price">{fmt(hotelCost)} <span style={{ fontSize: "0.65rem", fontFamily: "Inter,sans-serif", color: "var(--cream-d)" }}>total</span></p>
                  <button className="dp-review-card-edit" onClick={() => { setPhase("browse"); setStep(1); }}>← Edit Hotel</button>
                </div>
              </div>
            )}
            {/* Vehicle */}
            {vehicle && (
              <div className="dp-review-card">
                <div className="dp-review-card-icon" style={{ background: vehicle.bg }}>{vehicle.icon}</div>
                <div className="dp-review-card-body">
                  <p className="dp-review-card-label">Transport · {nights} days</p>
                  <p className="dp-review-card-name">{vehicle.name}</p>
                  <p className="dp-review-card-meta">{vehicle.type} · Up to {vehicle.capacity} guests</p>
                  <p className="dp-review-card-price">{fmt(vehicleCost)} <span style={{ fontSize: "0.65rem", fontFamily: "Inter,sans-serif", color: "var(--cream-d)" }}>total</span></p>
                  <button className="dp-review-card-edit" onClick={() => { setPhase("browse"); setStep(2); }}>← Edit Vehicle</button>
                </div>
              </div>
            )}
            {/* Activities */}
            {activities.length > 0 && (
              <div className="dp-review-acts">
                <p className="dp-review-acts-title">Experiences · {activities.length} selected</p>
                <div className="dp-review-acts-list">
                  {activities.map(a => (
                    <div key={a.id} className="dp-review-act">
                      <img className="dp-review-act-img" src={a.image} alt={a.name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/galle.webp"; }} />
                      <div className="dp-review-act-info">
                        <p className="dp-review-act-name">{a.name}</p>
                        <p className="dp-review-act-meta">{a.category} · {a.duration}</p>
                      </div>
                      <p className="dp-review-act-price">{fmt(a.pricePerPerson * travelers)}</p>
                    </div>
                  ))}
                </div>
                <button className="dp-review-card-edit" style={{ marginTop: "1rem" }} onClick={() => { setPhase("browse"); setStep(3); }}>← Edit Experiences</button>
              </div>
            )}
          </div>

          <div className="dp-review-total-bar">
            <span className="dp-review-total-l">Estimated Total · {travelers} traveller{travelers > 1 ? "s" : ""}</span>
            <span className="dp-review-total-v">{fmt(total)} <span style={{ fontSize: "0.7rem", fontFamily: "Inter,sans-serif", color: "var(--cream-d)" }}>USD</span></span>
          </div>

          {/* Booking Form */}
          <div className="dp-form">
            <p className="dp-form-title">Your Details</p>
            <div className="dp-form-grid">
              <div className="dp-form-group">
                <label className="dp-form-label">Full Name *</label>
                <input className="dp-form-input" placeholder="Your full name"
                  value={bookingForm.fullName}
                  onChange={e => setBookingForm(p => ({ ...p, fullName: e.target.value }))} />
              </div>
              <div className="dp-form-group">
                <label className="dp-form-label">Email Address *</label>
                <input className="dp-form-input" type="email" placeholder="your@email.com"
                  value={bookingForm.email}
                  onChange={e => setBookingForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="dp-form-group">
                <label className="dp-form-label">Phone Number *</label>
                <input className="dp-form-input" type="tel" placeholder="+1 (555) 000 0000"
                  value={bookingForm.phone}
                  onChange={e => setBookingForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="dp-form-group">
                <label className="dp-form-label">Arrival Date *</label>
                <input className="dp-form-input" type="date" style={{ colorScheme: "dark" }}
                  value={bookingForm.arrivalDate}
                  onChange={e => setBookingForm(p => ({ ...p, arrivalDate: e.target.value }))} />
              </div>
              <div className="dp-form-group full">
                <label className="dp-form-label">Special Requests</label>
                <textarea className="dp-form-textarea" placeholder="Dietary requirements, special occasions, specific preferences…"
                  value={bookingForm.notes}
                  onChange={e => setBookingForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="dp-review-actions">
            <button className="dp-confirm-btn" disabled={!isValid || submitting} onClick={submitBooking}>
              {submitting ? <><div className="dp-confirm-spinner" />Processing…</> : "Confirm & Submit Booking →"}
            </button>
            <button className="dp-back-btn" onClick={() => setPhase("browse")}>← Back to Planner</button>
          </div>
          <p style={{ marginTop: "1rem", fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", lineHeight: 1.7 }}>
            No payment is collected at this stage. Our team will contact you within 24 hours to confirm availability and arrange payment.
          </p>
        </div>
      </>
    );
  }

  /* ── BROWSE ──────────────────────────────────────────────────────── */
  return (
    <>
      <style>{css}</style>

      {/* Hero */}
      <section className="dp-hero">
        <img className="dp-hero-img" src="/images/galle-beach-scaled.webp" alt="Galle, Sri Lanka"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/galle.webp"; }} />
        <div className="dp-hero-overlay" />
        <div className="dp-hero-content dp-anim">
          <p className="dp-hero-eyebrow">Visual Planner · Galle, Sri Lanka</p>
          <h1 className="dp-hero-title">Build Your Perfect<br />Galle Journey</h1>
          <p className="dp-hero-sub">Choose your hotel, vehicle and experiences — see your itinerary take shape in real time</p>
          <div className="dp-hero-pills">
            <span className="dp-hero-pill">4 Hotels</span>
            <span className="dp-hero-pill">4 Vehicles</span>
            <span className="dp-hero-pill">6 Experiences</span>
            <span className="dp-hero-pill">Instant Pricing</span>
          </div>
        </div>
      </section>

      {/* Sticky Config Bar */}
      <div className="dp-config">
        <div className="dp-config-item">
          <span className="dp-config-label">Nights</span>
          <div className="dp-config-ctrl">
            <button className="dp-config-btn" onClick={() => setNights(n => Math.max(1, n - 1))}>−</button>
            <span className="dp-config-val">{nights}</span>
            <button className="dp-config-btn" onClick={() => setNights(n => Math.min(30, n + 1))}>+</button>
          </div>
        </div>
        <div className="dp-config-item">
          <span className="dp-config-label">Travellers</span>
          <div className="dp-config-ctrl">
            <button className="dp-config-btn" onClick={() => setTravelers(t => Math.max(1, t - 1))}>−</button>
            <span className="dp-config-val">{travelers}</span>
            <button className="dp-config-btn" onClick={() => setTravelers(t => Math.min(20, t + 1))}>+</button>
          </div>
        </div>
        {total > 0 && (
          <div className="dp-total-pill">
            Estimated Total <strong>{fmt(total)} USD</strong>
          </div>
        )}
      </div>

      {/* Step Navigation */}
      <div className="dp-step-nav">
        {([
          { n: 1 as const, label: "Hotel", done: !!selectedHotel },
          { n: 2 as const, label: "Vehicle", done: !!selectedVehicle },
          { n: 3 as const, label: "Experiences", done: selectedActivities.length > 0 },
        ]).map(s => (
          <button
            key={s.n}
            className={`dp-step-btn ${step === s.n ? "active" : ""} ${s.done && step !== s.n ? "done" : ""}`}
            onClick={() => setStep(s.n)}
          >
            <span className="dp-step-num">{s.done && step !== s.n ? "✓" : s.n}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Main body */}
      <div className="dp-body">
        <div className="dp-layout">

          {/* ── CARDS AREA ── */}
          <div>
            {/* STEP 1 — HOTELS */}
            {step === 1 && (
              <div className="dp-anim">
                <div className="dp-section-head">
                  <p className="dp-section-eyebrow">Step 1 of 3 · Accommodation</p>
                  <h2 className="dp-section-title">Where Will You Stay?</h2>
                  <p className="dp-section-sub">Select one hotel for your Galle stay. All properties are carefully vetted for quality and location.</p>
                </div>
                <div className="dp-hotel-grid">
                  {HOTELS.map(h => (
                    <div
                      key={h.id}
                      className={`dp-hotel-card ${selectedHotel === h.id ? "selected" : ""}`}
                      onClick={() => setSelectedHotel(h.id)}
                    >
                      <div style={{ overflow: "hidden" }}>
                        <img className="dp-hotel-img" src={h.image} alt={h.name}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/galle.webp"; }} />
                      </div>
                      <div className="dp-select-badge">✓</div>
                      <div className="dp-hotel-card-body">
                        <p className="dp-hotel-category">{h.category}</p>
                        <p className="dp-hotel-name">{h.name}</p>
                        <p className="dp-hotel-tagline">{h.tagline}</p>
                        <div className="dp-hotel-meta">
                          <span className="dp-hotel-rating">{stars(h.rating)}</span>
                          <span className="dp-hotel-location">◎ {h.location}</span>
                        </div>
                        <div className="dp-hotel-amenities">
                          {h.amenities.map(a => <span key={a} className="dp-amenity">{a}</span>)}
                        </div>
                        <div className="dp-hotel-price-row">
                          <span className="dp-hotel-price">{fmt(h.pricePerNight)}<span>/ night</span></span>
                          {nights > 0 && <span style={{ fontSize: "0.65rem", color: "var(--cream-d)" }}>{fmt(h.pricePerNight * nights)} total</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="dp-nav-row">
                  <div />
                  <button className="dp-btn-next" disabled={!canNext} onClick={() => setStep(2)}>
                    Next: Vehicle →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — VEHICLES */}
            {step === 2 && (
              <div className="dp-anim">
                <div className="dp-section-head">
                  <p className="dp-section-eyebrow">Step 2 of 3 · Transportation</p>
                  <h2 className="dp-section-title">How Will You Travel?</h2>
                  <p className="dp-section-sub">Select your preferred vehicle for the duration of your stay. All vehicles include a driver.</p>
                </div>
                <div className="dp-vehicle-grid">
                  {VEHICLES.map(v => (
                    <div
                      key={v.id}
                      className={`dp-vehicle-card ${selectedVehicle === v.id ? "selected" : ""}`}
                      onClick={() => setSelectedVehicle(v.id)}
                    >
                      <div className="dp-vehicle-top" style={{ background: v.bg, borderBottom: `1px solid ${v.accent}22` }}>
                        <span className="dp-vehicle-icon">{v.icon}</span>
                        <span className="dp-vehicle-type-badge" style={{ color: v.accent, borderColor: `${v.accent}55` }}>{v.type}</span>
                        <span className="dp-vehicle-name">{v.name}</span>
                      </div>
                      <div className="dp-vehicle-check">✓</div>
                      <div className="dp-vehicle-body">
                        <ul className="dp-vehicle-features">
                          {v.features.map(f => <li key={f}>{f}</li>)}
                        </ul>
                        <div className="dp-vehicle-footer">
                          <span className="dp-vehicle-cap">Up to {v.capacity} guests</span>
                          <span className="dp-vehicle-price">{fmt(v.pricePerDay)}<span>/ day</span></span>
                        </div>
                        {nights > 0 && (
                          <div style={{ marginTop: "0.5rem", fontSize: "0.62rem", color: "var(--cream-d)", textAlign: "right" }}>
                            {fmt(v.pricePerDay * nights)} for {nights} days
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="dp-nav-row">
                  <button className="dp-btn-back" onClick={() => setStep(1)}>← Back to Hotels</button>
                  <button className="dp-btn-next" disabled={!canNext} onClick={() => setStep(3)}>
                    Next: Experiences →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — ACTIVITIES */}
            {step === 3 && (
              <div className="dp-anim">
                <div className="dp-section-head">
                  <p className="dp-section-eyebrow">Step 3 of 3 · Experiences · Optional</p>
                  <h2 className="dp-section-title">What Will You Discover?</h2>
                  <p className="dp-section-sub">Select as many experiences as you like. Prices are per person. You can add or remove from your summary at any time.</p>
                </div>
                <div className="dp-activity-grid">
                  {ACTIVITIES.map(a => {
                    const isSelected = selectedActivities.includes(a.id);
                    return (
                      <div
                        key={a.id}
                        className={`dp-activity-card ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleActivity(a.id)}
                      >
                        <div className="dp-activity-img-wrap">
                          <img className="dp-activity-img" src={a.image} alt={a.name}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/galle.webp"; }} />
                          {a.badge && <span className="dp-activity-badge">{a.badge}</span>}
                          <div className="dp-activity-overlay" />
                        </div>
                        <div className="dp-activity-tick">✓</div>
                        <div className="dp-activity-body">
                          <p className="dp-activity-cat">{a.category}</p>
                          <p className="dp-activity-name">{a.name}</p>
                          <div className="dp-activity-footer">
                            <span className="dp-activity-dur">{a.duration}</span>
                            <span className="dp-activity-price">{fmt(a.pricePerPerson)}<span> /person</span></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="dp-nav-row">
                  <button className="dp-btn-back" onClick={() => setStep(2)}>← Back to Vehicles</button>
                  <button className="dp-btn-review" onClick={() => setPhase("review")}>
                    Review Itinerary →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── STICKY SIDEBAR ── */}
          <div className="dp-sidebar">
            <img className="dp-sidebar-hero" src="/images/galle.webp" alt="Galle"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/dest-1.webp"; }} />
            <div className="dp-sidebar-header">
              <p className="dp-sidebar-eyebrow">Your Itinerary</p>
              <p className="dp-sidebar-dest">Galle, Sri Lanka</p>
              <p className="dp-sidebar-meta">{nights} night{nights !== 1 ? "s" : ""} · {travelers} traveller{travelers !== 1 ? "s" : ""}</p>
            </div>

            {/* Hotel */}
            <div className="dp-sidebar-section">
              <p className="dp-sidebar-section-label">Accommodation</p>
              {hotel ? (
                <div className="dp-sidebar-item">
                  <img className="dp-sidebar-item-img" src={hotel.image} alt={hotel.name}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/galle.webp"; }} />
                  <div style={{ flex: 1 }}>
                    <p className="dp-sidebar-item-name">{hotel.name}</p>
                    <p className="dp-sidebar-item-sub">{hotel.location} · {nights} nights</p>
                    <p className="dp-sidebar-item-price">{fmt(hotelCost)}</p>
                  </div>
                  <button className="dp-sidebar-remove" onClick={e => { e.stopPropagation(); setSelectedHotel(null); }}>×</button>
                </div>
              ) : (
                <div className="dp-sidebar-empty" onClick={() => setStep(1)} style={{ cursor: "pointer" }}>
                  Select a hotel →
                </div>
              )}
            </div>

            {/* Vehicle */}
            <div className="dp-sidebar-section">
              <p className="dp-sidebar-section-label">Transportation</p>
              {vehicle ? (
                <div className="dp-sidebar-item">
                  <div className="dp-sidebar-item-icon" style={{ background: vehicle.bg, fontSize: "1.5rem", border: `1px solid ${vehicle.accent}22` }}>
                    {vehicle.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="dp-sidebar-item-name">{vehicle.name}</p>
                    <p className="dp-sidebar-item-sub">{vehicle.type} · {nights} days</p>
                    <p className="dp-sidebar-item-price">{fmt(vehicleCost)}</p>
                  </div>
                  <button className="dp-sidebar-remove" onClick={e => { e.stopPropagation(); setSelectedVehicle(null); }}>×</button>
                </div>
              ) : (
                <div className="dp-sidebar-empty" onClick={() => setStep(2)} style={{ cursor: "pointer" }}>
                  Select a vehicle →
                </div>
              )}
            </div>

            {/* Activities */}
            <div className="dp-sidebar-section">
              <p className="dp-sidebar-section-label">Experiences {activities.length > 0 && `· ${activities.length} selected`}</p>
              {activities.length > 0 ? (
                <div className="dp-sidebar-activity-list">
                  {activities.map(a => (
                    <div key={a.id} className="dp-sidebar-act">
                      <img className="dp-sidebar-act-img" src={a.image} alt={a.name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/galle.webp"; }} />
                      <span className="dp-sidebar-act-name">{a.name}</span>
                      <span className="dp-sidebar-act-price">{fmt(a.pricePerPerson * travelers)}</span>
                      <button className="dp-sidebar-act-remove" onClick={() => toggleActivity(a.id)}>×</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dp-sidebar-empty" onClick={() => setStep(3)} style={{ cursor: "pointer" }}>
                  Add experiences →
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            {total > 0 && (
              <div className="dp-sidebar-breakdown">
                {hotelCost > 0 && <div className="dp-breakdown-row"><span>Hotel ({nights} nights)</span><span>{fmt(hotelCost)}</span></div>}
                {vehicleCost > 0 && <div className="dp-breakdown-row"><span>Vehicle ({nights} days)</span><span>{fmt(vehicleCost)}</span></div>}
                {activitiesCost > 0 && <div className="dp-breakdown-row"><span>Experiences ({travelers} pax)</span><span>{fmt(activitiesCost)}</span></div>}
              </div>
            )}

            <div className="dp-sidebar-total">
              <span className="dp-sidebar-total-l">Estimated Total</span>
              <span className="dp-sidebar-total-v">{total > 0 ? fmt(total) : "—"}</span>
            </div>

            <button
              className="dp-sidebar-cta"
              disabled={!hotel || !vehicle}
              onClick={() => setPhase("review")}
            >
              {!hotel ? "Select a Hotel First" : !vehicle ? "Select a Vehicle First" : "Review My Itinerary →"}
            </button>
            <p className="dp-sidebar-note">No payment collected now. Our team confirms availability within 24 hours.</p>
          </div>
        </div>
      </div>
    </>
  );
}
