export type RegionDestination = {
  name: string;
  tagline: string;
  slug: string;
  image: string;
  hasPage: boolean;
};

export type RegionTrip = {
  nights: string;
  title: string;
  desc: string;
  image: string;
};

export type RegionInspiration = {
  image: string;
  caption: string;
  tag: string;
};

export type RegionTestimonial = {
  quote: string;
  name: string;
  detail: string;
};

export type Region = {
  slug: string;
  label: string;
  heroImage: string;
  description: string;
  about: string;
  destinations: RegionDestination[];
  trips: RegionTrip[];
  inspirations: RegionInspiration[];
  testimonials: RegionTestimonial[];
};

export const regions: Region[] = [
  {
    slug: "the-south",
    label: "The South",
    heroImage: "/images/the-south.webp",
    description: "Ancient forts, whale watching & golden shores",
    about: "Sri Lanka's southern coast is a world of contrasts — colonial forts rising above the Indian Ocean, pristine beaches stretching for miles, and warm turquoise waters hiding vibrant coral reefs. This is where history meets paradise.",
    destinations: [
      { name: "Galle", tagline: "Where History Meets the Sea", slug: "galle", image: "/images/dest-1.webp", hasPage: true },
      { name: "Unawatuna", tagline: "Where the Ocean Calls You Home", slug: "unawatuna", image: "/images/dest-3.webp", hasPage: true },
      { name: "Mirissa", tagline: "Whales, Waves & Wandering", slug: "mirissa", image: "/images/galle-trip-2.webp", hasPage: false },
      { name: "Tangalle", tagline: "Wild Coast, Untouched Shores", slug: "tangalle", image: "/images/galle-trip-4.webp", hasPage: false },
      { name: "Weligama", tagline: "The Surfer's Southern Dream", slug: "weligama", image: "/images/galle-trip-5.webp", hasPage: false },
    ],
    trips: [
      {
        nights: "7 Nights",
        title: "The Southern Coast Escape",
        desc: "Begin in the ancient streets of Galle Fort, drift south through coral-fringed Unawatuna, and end watching blue whales breach off Mirissa. A journey that moves with the rhythm of the sea.",
        image: "/images/galle-trip-1.webp",
      },
      {
        nights: "10 Nights",
        title: "The Full Southern Journey",
        desc: "A slow, deliberate traverse of Sri Lanka's south — from colonial Galle to the wild shores of Tangalle — pausing at every beach, reef, and headland worth knowing.",
        image: "/images/galle-trip-2.webp",
      },
      {
        nights: "5 Nights",
        title: "Galle & The Forts",
        desc: "Three days within Galle Fort's ancient walls, then two days exploring the lesser-known Dutch-era fortifications scattered along the coast. History, light, and the Indian Ocean.",
        image: "/images/galle-trip-4.webp",
      },
      {
        nights: "8 Nights",
        title: "Surf, Whale & Wild",
        desc: "For those who came to feel alive — morning surf at Weligama, an afternoon with whale sharks off Mirissa, and evenings in candlelit colonial restaurants.",
        image: "/images/galle-trip-5.webp",
      },
      {
        nights: "Custom",
        title: "Design Your Own Southern Journey",
        desc: "Tell us how you want to feel and we will craft a southern Sri Lanka journey entirely around that. Every detail considered. Every moment yours.",
        image: "/images/galle-trip-3.webp",
      },
    ],
    inspirations: [
      { image: "/images/theSouth_1.webp", caption: "Surrender to the flow", tag: "" },
      { image: "/images/theSouth_2.webp", caption: "Two souls — One Love", tag: "" },
      { image: "/images/galle-trip-4.webp", caption: "Ancient monks, silent courtyards, and the weight of centuries", tag: "The South" },
      { image: "/images/galle-trip-5.webp", caption: "A lone palm over still water — the south coast at its most intimate", tag: "Tangalle" },
    ],
    testimonials: [
      {
        quote: "We spent ten days along the south coast and left feeling like we had lived an entire lifetime. Galle at dusk, the whales off Mirissa, the silence of Tangalle — it was simply the most beautiful trip of our lives.",
        name: "Sophie & James",
        detail: "Honeymooners from London — 10 nights, The Full Southern Journey",
      },
      {
        quote: "I have travelled extensively across Asia, but nothing quite prepared me for the south of Sri Lanka. It has this rare quality — wild and refined at the same time. Samsara understood exactly what I was looking for.",
        name: "Marc T.",
        detail: "Solo traveller from Paris — 7 nights, The Southern Coast Escape",
      },
      {
        quote: "The fort walls of Galle at sunset, a candlelit dinner inside a 17th-century building, waking to the sound of the ocean every morning. I did not want to leave.",
        name: "Amelia R.",
        detail: "Travelled with her mother — 8 nights, Surf, Whale & Wild",
      },
    ],
  },
  {
    slug: "west-coast",
    label: "West Coast",
    heroImage: "/images/galle.webp",
    description: "Lagoons, seafood & the gateway to the island",
    about: "The west coast tells the story of Sri Lanka's layered history — colonial Dutch towns, sun-drenched beach strips, and lagoons teeming with birdlife. From Colombo's cultural pulse to Bentota's quiet luxury, this coast has many faces.",
    destinations: [
      { name: "Colombo", tagline: "The Island's Beating Heart", slug: "colombo", image: "/images/dest-1.webp", hasPage: false },
      { name: "Negombo", tagline: "Lagoons, Dutch Canals & Fresh Catch", slug: "negombo", image: "/images/galle-trip-1.webp", hasPage: false },
      { name: "Bentota", tagline: "A River Meets the Sea", slug: "bentota", image: "/images/galle-trip-3.webp", hasPage: false },
    ],
    trips: [], inspirations: [], testimonials: [],
  },
  {
    slug: "hill-country",
    label: "Hill Country",
    heroImage: "/images/dest-2.webp",
    description: "Misty mountains, tea terraces & jungle trails",
    about: "Rising through clouds and mist, Sri Lanka's hill country is a landscape of extraordinary beauty. Endless tea estates roll across the hills, waterfalls pour into deep valleys, and ancient trains wind through one of the world's most scenic railway routes.",
    destinations: [
      { name: "Ella", tagline: "Lost in the Mist of the Mountains", slug: "ella", image: "/images/dest-2.webp", hasPage: true },
      { name: "Nuwara Eliya", tagline: "Little England in the Clouds", slug: "nuwara-eliya", image: "/images/galle-trip-4.webp", hasPage: false },
      { name: "Kandy", tagline: "The Last Kingdom of Sri Lanka", slug: "kandy", image: "/images/galle-trip-5.webp", hasPage: false },
      { name: "Haputale", tagline: "Where the Clouds Begin", slug: "haputale", image: "/images/galle-trip-2.webp", hasPage: false },
    ],
    trips: [], inspirations: [], testimonials: [],
  },
  {
    slug: "ancient-cities",
    label: "The Ancient Cities",
    heroImage: "/images/dest-4.webp",
    description: "Rock fortresses, sacred temples & lost kingdoms",
    about: "Sri Lanka's Cultural Triangle holds some of Asia's most extraordinary ancient sites. Rock fortresses that touch the sky, Buddha statues carved into living stone, and sacred cities that were once capitals of great civilisations.",
    destinations: [
      { name: "Sigiriya", tagline: "Rise Above the Ancient World", slug: "sigiriya", image: "/images/dest-4.webp", hasPage: true },
      { name: "Polonnaruwa", tagline: "Walk Through a Forgotten Empire", slug: "pollonnaruwa", image: "/images/dest-5.webp", hasPage: true },
      { name: "Anuradhapura", tagline: "The Sacred City of Sri Lanka", slug: "anuradhapura", image: "/images/galle-trip-1.webp", hasPage: false },
      { name: "Dambulla", tagline: "Golden Temple of the Cave", slug: "dambulla", image: "/images/galle-trip-3.webp", hasPage: false },
    ],
    trips: [], inspirations: [], testimonials: [],
  },
  {
    slug: "the-east",
    label: "The East",
    heroImage: "/images/galle-trip-5.webp",
    description: "Untouched beaches, surf & whale sharks",
    about: "Sri Lanka's east coast remains one of Asia's great undiscovered secrets. Arugam Bay draws surfers from across the world, Trincomalee's deep natural harbour is ringed by some of the island's finest beaches, and the wildlife here is unlike anywhere else.",
    destinations: [
      { name: "Arugam Bay", tagline: "The World's Best Surf Secret", slug: "arugam-bay", image: "/images/galle-trip-2.webp", hasPage: false },
      { name: "Trincomalee", tagline: "Natural Harbour, Ancient Grace", slug: "trincomalee", image: "/images/galle-trip-4.webp", hasPage: false },
      { name: "Pasikuda", tagline: "Still Waters & Silver Sands", slug: "pasikuda", image: "/images/galle-trip-1.webp", hasPage: false },
    ],
    trips: [], inspirations: [], testimonials: [],
  },
  {
    slug: "jaffna-north",
    label: "Jaffna & The North",
    heroImage: "/images/dest-5.webp",
    description: "Cultural depth, Tamil heritage & raw beauty",
    about: "Jaffna is Sri Lanka at its most raw and real — a peninsula shaped by a distinct Tamil culture, centuries of history, and a landscape of lagoons, palmyra palms and ancient Hindu temples. Few places on the island feel more alive.",
    destinations: [
      { name: "Jaffna", tagline: "The Heart of Tamil Sri Lanka", slug: "jaffna", image: "/images/dest-5.webp", hasPage: false },
      { name: "Mannar", tagline: "Flamingos, Baobabs & the Wind", slug: "mannar", image: "/images/galle-trip-3.webp", hasPage: false },
      { name: "Vavuniya", tagline: "The Gateway to the North", slug: "vavuniya", image: "/images/galle-trip-5.webp", hasPage: false },
    ],
    trips: [], inspirations: [], testimonials: [],
  },
];

export function getRegion(slug: string): Region | undefined {
  return regions.find((r) => r.slug === slug);
}
