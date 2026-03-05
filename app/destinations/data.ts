export type Destination = {
  slug: string;
  name: string;
  sinhala: string;
  country: string;
  tagline: string;
  heroImage: string;
  about: string;
  activities: { title: string; description: string; image: string }[];
  gallery: string[];
  more: { name: string; country: string; slug: string; image: string }[];
};

export const destinations: Destination[] = [
  {
    slug: "galle",
    name: "Galle",
    sinhala: "ගාල්ල",
    country: "Sri Lanka",
    tagline: "Where History Meets the Sea",
    heroImage: "/images/dest-1.webp",
    about: "Galle is a city where colonial history breathes alongside tropical beauty. Walk the ancient Dutch fort walls as the Indian Ocean stretches endlessly before you, discover boutique shops and hidden cafes within centuries-old streets, and let the languid pace of the south slow you down.",
    activities: [
      { title: "Fort Galle", description: "Wander the UNESCO-listed Dutch fort at golden hour when the walls glow amber.", image: "/images/galle-act-1.webp" },
      { title: "Whale Watching", description: "Sail into the deep blue to witness blue whales — the largest creatures on Earth.", image: "/images/galle-act-2.webp" },
      { title: "Sea Turtle Nesting", description: "Visit nesting beaches at dawn and witness ancient sea turtles return to shore.", image: "/images/galle-act-3.webp" },
    ],
    gallery: ["/images/galle-g-1.webp", "/images/galle-g-2.webp", "/images/galle-g-3.webp", "/images/galle-g-4.webp"],
    more: [
      { name: "Ella", country: "The Hill Country", slug: "ella", image: "/images/dest-2.webp" },
      { name: "Sigiriya", country: "The Hill Country", slug: "sigiriya", image: "/images/dest-4.webp" },
      { name: "Unawatuna", country: "Down South", slug: "unawatuna", image: "/images/dest-3.webp" },
    ],
  },
  {
    slug: "ella",
    name: "Ella",
    sinhala: "එල්ල",
    country: "The Hill Country",
    tagline: "Lost in the Mist of the Mountains",
    heroImage: "/images/dest-2.webp",
    about: "Ella is Sri Lanka's soul in the hills — a place where tea plantations cascade down misty mountains, ancient bridges frame perfect valleys, and the air carries the scent of eucalyptus and rain. Time slows here, and that is entirely the point.",
    activities: [
      { title: "Nine Arch Bridge", description: "Visit the iconic colonial-era viaduct as a train passes through the jungle mist.", image: "/images/ella-act-1.webp" },
      { title: "Little Adam's Peak", description: "A gentle sunrise hike rewarded with panoramic views over the entire hill country.", image: "/images/ella-act-2.webp" },
      { title: "Tea Plantation Walk", description: "Walk through endless green tea terraces and learn the art of Ceylon tea.", image: "/images/ella-act-3.webp" },
    ],
    gallery: ["/images/ella-g-1.webp", "/images/ella-g-2.webp", "/images/ella-g-3.webp", "/images/ella-g-4.webp"],
    more: [
      { name: "Galle", country: "Down South", slug: "galle", image: "/images/dest-1.webp" },
      { name: "Sigiriya", country: "The Hill Country", slug: "sigiriya", image: "/images/dest-4.webp" },
      { name: "Pollonnaruwa", country: "The Ancient Kingdoms", slug: "pollonnaruwa", image: "/images/dest-5.webp" },
    ],
  },
  {
    slug: "unawatuna",
    name: "Unawatuna",
    sinhala: "උණවටුන",
    country: "Down South",
    tagline: "Where the Ocean Calls You Home",
    heroImage: "/images/dest-3.webp",
    about: "Unawatuna is one of Sri Lanka's most beloved coastal escapes — a crescent of golden sand, warm turquoise water and swaying palms. Beyond the beach, jungle paths lead to hidden temples and lookout points where the whole coast unfolds before you.",
    activities: [
      { title: "Snorkelling & Diving", description: "Explore vibrant coral reefs teeming with tropical fish just metres from the shore.", image: "/images/unawatuna-act-1.webp" },
      { title: "Jungle Beach", description: "Hike through dense jungle to a completely secluded beach known only to a few.", image: "/images/unawatuna-act-2.webp" },
      { title: "Japanese Peace Pagoda", description: "Climb to the hilltop pagoda at sunset for a panoramic view of the southern coastline.", image: "/images/unawatuna-act-3.webp" },
    ],
    gallery: ["/images/unawatuna-g-1.webp", "/images/unawatuna-g-2.webp", "/images/unawatuna-g-3.webp", "/images/unawatuna-g-4.webp"],
    more: [
      { name: "Galle", country: "Down South", slug: "galle", image: "/images/dest-1.webp" },
      { name: "Ella", country: "The Hill Country", slug: "ella", image: "/images/dest-2.webp" },
      { name: "Sigiriya", country: "The Hill Country", slug: "sigiriya", image: "/images/dest-4.webp" },
    ],
  },
  {
    slug: "sigiriya",
    name: "Sigiriya",
    sinhala: "සිගිරිය",
    country: "The Hill Country",
    tagline: "Rise Above the Ancient World",
    heroImage: "/images/dest-4.webp",
    about: "Rising dramatically from the jungle floor, Sigiriya is one of the most extraordinary sights on Earth. This ancient rock fortress — built by a king, abandoned to the jungle and rediscovered centuries later — stands as a testament to human ambition, artistry and the enduring power of nature.",
    activities: [
      { title: "Sigiriya Rock Climb", description: "Ascend the ancient citadel at sunrise, past 5th century frescoes to the summit palace.", image: "/images/sigiriya-act-1.webp" },
      { title: "Pidurangala Rock", description: "Climb the neighbouring rock for the best view of Sigiriya — without the crowds.", image: "/images/sigiriya-act-2.webp" },
      { title: "Village Safari", description: "Explore the surrounding countryside by tuk-tuk, boat and foot with a local guide.", image: "/images/sigiriya-act-3.webp" },
    ],
    gallery: ["/images/sigiriya-g-1.webp", "/images/sigiriya-g-2.webp", "/images/sigiriya-g-3.webp", "/images/sigiriya-g-4.webp"],
    more: [
      { name: "Ella", country: "The Hill Country", slug: "ella", image: "/images/dest-2.webp" },
      { name: "Pollonnaruwa", country: "The Ancient Kingdoms", slug: "pollonnaruwa", image: "/images/dest-5.webp" },
      { name: "Galle", country: "Down South", slug: "galle", image: "/images/dest-1.webp" },
    ],
  },
  {
    slug: "pollonnaruwa",
    name: "Pollonnaruwa",
    sinhala: "පොළොන්නරුව",
    country: "The Ancient Kingdoms",
    tagline: "Walk Through a Forgotten Empire",
    heroImage: "/images/dest-5.webp",
    about: "Pollonnaruwa is Sri Lanka's medieval capital — a UNESCO World Heritage Site where the ruins of a great civilisation lie scattered across a landscape of lakes and jungle. Ancient dagobas, royal palaces and colossal Buddha statues stand in extraordinary preservation, whispering the story of a kingdom at the height of its power.",
    activities: [
      { title: "Gal Vihara", description: "Stand before four magnificent rock-carved Buddha statues dating back to the 12th century.", image: "/images/pollonnaruwa-act-1.webp" },
      { title: "Cycle the Ruins", description: "Explore the ancient city by bicycle at your own pace through shaded jungle paths.", image: "/images/pollonnaruwa-act-2.webp" },
      { title: "Parakrama Samudra", description: "Watch the sunset over the vast ancient reservoir that powered an entire civilisation.", image: "/images/pollonnaruwa-act-3.webp" },
    ],
    gallery: ["/images/pollonnaruwa-g-1.webp", "/images/pollonnaruwa-g-2.webp", "/images/pollonnaruwa-g-3.webp", "/images/pollonnaruwa-g-4.webp"],
    more: [
      { name: "Sigiriya", country: "The Hill Country", slug: "sigiriya", image: "/images/dest-4.webp" },
      { name: "Ella", country: "The Hill Country", slug: "ella", image: "/images/dest-2.webp" },
      { name: "Galle", country: "Down South", slug: "galle", image: "/images/dest-1.webp" },
    ],
  },
];

export function getDestination(slug: string): Destination | undefined {
  return destinations.find((d) => d.slug === slug);
}