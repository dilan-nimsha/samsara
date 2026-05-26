export interface AddOn {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface Experience {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  duration: string;
  location: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  groupSize: string;
  price: number;
  image: string;
  heroImage?: string;
  category: string;
  badge?: string;
  highlights: string[];
  includes: string[];
  addOns: AddOn[];
}

export const EXPERIENCES: Experience[] = [
  {
    id: "leopard-safari",
    title: "Leopard Safari at Yala",
    subtitle: "Sri Lanka's Premier Wildlife Encounter",
    description: "Track the island's elusive leopards through one of the world's highest leopard-density reserves on an exclusive game drive.",
    longDescription: "Yala National Park is home to the highest concentration of leopards per square kilometre on earth. Rise before dawn and venture deep into the wilderness aboard a private, open-top safari vehicle with one of Sri Lanka's most experienced wildlife trackers. Your guide reads the landscape like a living map — pugmarks in the red dust, alarm calls in the canopy — building the tension until the moment a leopard materialises from the undergrowth. Beyond the big cats, Yala holds sloth bears, elephants, crocodiles and over 200 bird species. A gourmet bush breakfast is served al fresco as the morning mist lifts over the lagoon.",
    duration: "Full Day · 8 hrs",
    location: "Yala National Park",
    difficulty: "Easy",
    groupSize: "2–8 guests",
    price: 280,
    image: "/images/dest-5.webp",
    heroImage: "/images/theSouth_1.webp",
    category: "Wildlife",
    badge: "Most Popular",
    highlights: [
      "Private jeep with expert wildlife tracker",
      "Morning & late-afternoon game drives",
      "Gourmet bush breakfast at a scenic lagoon",
      "Leopard, elephant, bear & crocodile sightings",
      "Up to 8 guests — never overcrowded",
    ],
    includes: [
      "Private 4×4 safari vehicle & fuel",
      "Certified wildlife guide",
      "Bush breakfast & refreshments",
      "National park entry fees",
      "Hotel transfers (Tissamaharama area)",
    ],
    addOns: [
      { id: "ls-ao1", name: "Wildlife Photography Guide", price: 145, description: "4-hour expert wildlife photographer, equipment & tips for perfect shots" },
      { id: "ls-ao2", name: "Sunrise Bird Walk", price: 65, description: "2-hour dawn birding walk along the lagoon fringe with ornithologist guide" },
      { id: "ls-ao3", name: "Luxury Picnic Hamper", price: 90, description: "Private gourmet hamper in the wilderness — curated by our in-house chef" },
    ],
  },
  {
    id: "whale-expedition",
    title: "Blue Whale Marine Expedition",
    subtitle: "The Largest Creatures on Earth",
    description: "Sail into the deep blue Indian Ocean at sunrise for a heart-stopping encounter with blue and sperm whales in their natural habitat.",
    longDescription: "Sri Lanka's southern waters form one of the most reliable whale-watching corridors on the planet. From November to April, blue whales — the largest animals ever known to exist — migrate through these warm waters in extraordinary numbers. Board a purpose-built, low-impact vessel from Mirissa harbour before first light, sailing out to the deep-water shelf where the ocean floor plunges to over 1,000 metres. Your marine biologist guide narrates every sighting as dolphins, flying fish and occasionally sperm whales accompany you on the open ocean. Breakfast is served on deck as the southern coast of Sri Lanka glows amber on the horizon.",
    duration: "Half Day · 5 hrs",
    location: "Mirissa, The South",
    difficulty: "Easy",
    groupSize: "4–12 guests",
    price: 195,
    image: "/images/galle-act-2.webp",
    heroImage: "/images/galle-beach-scaled.webp",
    category: "Marine",
    badge: "Seasonal (Nov–Apr)",
    highlights: [
      "Blue whale sightings with 95%+ success rate",
      "Marine biologist guide on board",
      "Spinner dolphin superpods en route",
      "Sunrise departure for the best conditions",
      "Breakfast and refreshments served at sea",
    ],
    includes: [
      "Private boat charter (small group)",
      "Certified marine biologist guide",
      "Breakfast & drinks on board",
      "Life jackets & safety equipment",
      "Harbour transfers",
    ],
    addOns: [
      { id: "we-ao1", name: "Underwater Camera Hire", price: 55, description: "GoPro Hero + waterproof housing, fully charged and ready to use" },
      { id: "we-ao2", name: "Snorkelling Extension", price: 85, description: "1-hour reef snorkel at Polhena after the whale watching" },
      { id: "we-ao3", name: "Sunset Dolphin Cruise", price: 110, description: "Additional 3-hour evening dolphin cruise as the sun sets over the Indian Ocean" },
    ],
  },
  {
    id: "highland-trek",
    title: "Highland Tea & Mist Trek",
    subtitle: "Into the Heart of the Hill Country",
    description: "Trek through endless green tea terraces, mist-wrapped ridgelines and ancient rainforests in the cool highlands of central Sri Lanka.",
    longDescription: "The hill country of Sri Lanka is a world unto itself — a vertical landscape of emerald tea estates, cascading waterfalls and colonial-era train lines that cling to improbable cliffs. This full-day guided trek takes you along ancient footpaths used by tea pluckers for over a century, through private estate land inaccessible to casual visitors. Your guide explains the history and science of Ceylon tea as you descend through the valley to the famous Nine Arch Bridge, arriving precisely as a steam train passes overhead through the jungle mist. Lunch is served at a heritage tea bungalow with uninterrupted panoramic views.",
    duration: "Full Day · 9 hrs",
    location: "Ella & Haputale, Hill Country",
    difficulty: "Moderate",
    groupSize: "2–6 guests",
    price: 310,
    image: "/images/hill-country.webp",
    heroImage: "/images/dest-2.webp",
    category: "Trekking",
    highlights: [
      "Private-estate tea terraces (closed to public)",
      "Nine Arch Bridge train timing guaranteed",
      "Lunch at a colonial heritage tea bungalow",
      "Ancient waterfall swim en route",
      "Little Adam's Peak sunrise option",
    ],
    includes: [
      "Licensed trekking guide",
      "Gourmet packed lunch & refreshments",
      "Private estate access permits",
      "Trek pole hire",
      "Hotel pickup & drop-off (Ella)",
    ],
    addOns: [
      { id: "ht-ao1", name: "Tea Masterclass", price: 75, description: "Private 90-min tea plucking and tasting experience with a senior planter" },
      { id: "ht-ao2", name: "Overnight in Tea Bungalow", price: 280, description: "Exclusive overnight stay in a colonial planter's bungalow (dinner included)" },
      { id: "ht-ao3", name: "Sunrise Summit Add-on", price: 55, description: "Pre-dawn start with guide to catch Little Adam's Peak at sunrise" },
    ],
  },
  {
    id: "sigiriya-sunrise",
    title: "Sigiriya Rock at Sunrise",
    subtitle: "An Ancient Fortress in the Clouds",
    description: "Climb the 5th-century rock fortress of Sigiriya before the crowds arrive and watch the jungle canopy emerge from a sea of morning mist.",
    longDescription: "Sigiriya — Lion Rock — rises 200 metres above the surrounding jungle and was once the fortified palace of a 5th-century king. It remains one of the most extraordinary archaeological sites on earth, with its ancient frescoes, mirror-polished water gardens and the summit palace still partially intact after 1,500 years. Begin your climb before dawn by torchlight, arriving at the summit as the first light transforms the jungle below into a landscape of gold and green. Your private archaeologist guide brings the site to life with stories of the king who built it, the monks who later inhabited it, and the British colonial officers who rediscovered it in 1831.",
    duration: "Half Day · 5 hrs",
    location: "Sigiriya, Cultural Triangle",
    difficulty: "Moderate",
    groupSize: "2–8 guests",
    price: 165,
    image: "/images/dest-4.webp",
    heroImage: "/images/dest-4.webp",
    category: "Cultural",
    highlights: [
      "Private archaeologist guide before gates open",
      "5th-century frescoes & mirror wall",
      "Panoramic sunrise from the summit palace",
      "Water gardens and moat exploration",
      "Nearby Pidurangala Rock option",
    ],
    includes: [
      "Pre-dawn access arrangement",
      "Sigiriya entrance fees",
      "Breakfast after the climb",
      "Hotel transfers (Dambulla / Habarana)",
    ],
    addOns: [
      { id: "ss-ao1", name: "Pidurangala Bonus Climb", price: 45, description: "Climb the neighbouring rock for the best view of Sigiriya without the crowds" },
      { id: "ss-ao2", name: "Village Tuk-Tuk Safari", price: 55, description: "Local exploration of surrounding paddy farms and temple ruins" },
      { id: "ss-ao3", name: "Elephant Sanctuary Visit", price: 95, description: "Ethical elephant sanctuary visit and feeding experience (2 hours)" },
    ],
  },
  {
    id: "turtle-reef",
    title: "Sea Turtle & Reef Safari",
    subtitle: "Ancient Encounters Beneath the Surface",
    description: "Snorkel and free-dive alongside hawksbill and green sea turtles on a pristine reef just minutes from the shore.",
    longDescription: "The waters off Sri Lanka's southern coast are home to five of the world's seven sea turtle species. This intimate, small-group experience takes you to a series of protected reefs where snorkelling with turtles is virtually guaranteed. This expedition takes you to a series of protected reefs where snorkelling with turtles is virtually guaranteed. A marine conservation guide accompanies every group, explaining the nesting cycle, the threats turtles face and the extraordinary local conservation work keeping them safe. The expedition also visits a traditional stilt fisherman for a sunrise demonstration before heading to the reef. If conditions allow, you'll have the opportunity to free-dive to deeper coral formations where larger hawksbills cruise along the reef wall.",
    duration: "Half Day · 4 hrs",
    location: "Koggala & Unawatuna",
    difficulty: "Easy",
    groupSize: "2–8 guests",
    price: 145,
    image: "/images/galle-act-3.webp",
    heroImage: "/images/galle.webp",
    category: "Marine",
    highlights: [
      "Snorkelling with wild sea turtles (guaranteed)",
      "Marine conservation guide on every trip",
      "Stilt fishermen at sunrise",
      "Free-diving option on deeper formations",
      "Turtle nesting site visit (seasonal)",
    ],
    includes: [
      "Marine conservation guide",
      "Full snorkel equipment (mask, fins, wetsuit)",
      "Traditional boat with captain",
      "Fresh fruit & coconut water",
      "Reef-safe sunscreen",
    ],
    addOns: [
      { id: "tr-ao1", name: "PADI Discover Scuba", price: 130, description: "Introductory scuba diving session with PADI-certified instructor at the reef" },
      { id: "tr-ao2", name: "Underwater Photography", price: 80, description: "Professional underwater photographer joins the group for the full session" },
      { id: "tr-ao3", name: "Jungle Beach Hike", price: 55, description: "Post-snorkel hike to the secluded Jungle Beach accessible only on foot" },
    ],
  },
  {
    id: "wild-camp",
    title: "Southern Wild Camp & Stars",
    subtitle: "Sleep Under the Milky Way",
    description: "Spend a night under the stars in a private wilderness camp along Sri Lanka's untouched southern coast — bonfires, ocean sounds and absolute silence.",
    longDescription: "This overnight wilderness experience takes you to a stretch of Sri Lanka's south coast that remains entirely undeveloped — no resorts, no crowds, just a mile of curved white sand backed by dense coastal jungle. Camp is established by our team before you arrive: canvas tents with proper beds and linen, a private chef's fire kitchen, lantern-lit communal area and a shoreside bonfire pit. The night sky this far from any city is extraordinary — the Milky Way arches directly overhead and shooting stars are commonplace. A guide leads an optional midnight beach walk during nesting season, when giant leatherback turtles haul themselves above the tide line to lay their eggs in the soft sand.",
    duration: "Overnight · 20 hrs",
    location: "Remote South Coast",
    difficulty: "Easy",
    groupSize: "2–10 guests",
    price: 420,
    image: "/images/the-south.webp",
    heroImage: "/images/theSouth_2.webp",
    category: "Adventure",
    badge: "Signature Experience",
    highlights: [
      "Exclusive private camp on deserted beach",
      "Chef-cooked dinner and breakfast at the shore",
      "Stargazing guide with telescope",
      "Midnight leatherback turtle walk",
      "Morning kayaking & ocean swim",
    ],
    includes: [
      "Canvas tent with real bed & linen",
      "Private chef for dinner & breakfast",
      "Stargazing guide & telescope",
      "Kayaks and snorkel equipment",
      "4×4 transfers to remote camp",
    ],
    addOns: [
      { id: "wc-ao1", name: "Private Chef Upgrade", price: 160, description: "Upgrade to a 4-course gourmet dinner with paired local wines and spirits" },
      { id: "wc-ao2", name: "Surf Lesson at Dawn", price: 85, description: "Private 2-hour surf lesson at a world-class break 10 minutes from camp" },
      { id: "wc-ao3", name: "Second Night Extension", price: 320, description: "Extend your camp to two nights — the deepest possible reset" },
    ],
  },
];

export const CATEGORIES = ["All", "Wildlife", "Marine", "Trekking", "Cultural", "Adventure"];
export const PICKUP_LOCATIONS = ["Colombo", "Galle", "Mirissa", "Ella", "Kandy", "Sigiriya", "Dambulla", "My Accommodation (specify in notes)"];
export const BUDGET_OPTIONS = ["Flexible — show me the best", "Under $300", "$300–$600", "$600–$1,200", "$1,200+"];
export const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: "rgba(61,180,100,0.8)",
  Moderate: "rgba(220,160,50,0.85)",
  Challenging: "rgba(220,80,70,0.8)",
};
