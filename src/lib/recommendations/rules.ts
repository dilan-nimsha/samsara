// ─── Recommendation Rules & Catalog Data ─────────────────────────────────────
// All rule mappings and curated Sri Lanka DMC catalog entries live here.
// The engine reads these at scoring time — add/edit entries to tune results.

import type { CatalogItem } from './types';

// ─── Country → preferred activity tag set ─────────────────────────────────────
// Keys: ISO alpha-2 codes AND common nationality strings from the client form.

export const COUNTRY_PREFERENCES: Record<string, string[]> = {
  // Europe
  DE: ['cultural', 'heritage', 'eco', 'hiking', 'history', 'photography'],
  Germany: ['cultural', 'heritage', 'eco', 'hiking', 'history', 'photography'],
  GB: ['wildlife', 'luxury', 'history', 'beach', 'photography', 'colonial'],
  'United Kingdom': ['wildlife', 'luxury', 'history', 'beach', 'photography', 'colonial'],
  British: ['wildlife', 'luxury', 'history', 'beach', 'photography', 'colonial'],
  FR: ['luxury', 'culinary', 'cultural', 'romance', 'beach', 'art'],
  French: ['luxury', 'culinary', 'cultural', 'romance', 'beach', 'art'],
  IT: ['cultural', 'heritage', 'culinary', 'art', 'luxury', 'history'],
  Italian: ['cultural', 'heritage', 'culinary', 'art', 'luxury', 'history'],
  ES: ['beach', 'cultural', 'adventure', 'culinary', 'nightlife'],
  Spanish: ['beach', 'cultural', 'adventure', 'culinary', 'nightlife'],
  NL: ['eco', 'cycling', 'cultural', 'photography', 'adventure'],
  Dutch: ['eco', 'cycling', 'cultural', 'photography', 'adventure'],
  CH: ['luxury', 'wellness', 'hiking', 'nature', 'photography'],
  Swiss: ['luxury', 'wellness', 'hiking', 'nature', 'photography'],
  AT: ['cultural', 'hiking', 'eco', 'history', 'music'],
  Austrian: ['cultural', 'hiking', 'eco', 'history'],
  BE: ['cultural', 'eco', 'photography', 'culinary'],
  Belgian: ['cultural', 'eco', 'photography', 'culinary'],
  SE: ['eco', 'wildlife', 'adventure', 'hiking', 'photography'],
  Swedish: ['eco', 'wildlife', 'adventure', 'hiking', 'photography'],
  NO: ['eco', 'adventure', 'wildlife', 'hiking', 'photography'],
  Norwegian: ['eco', 'adventure', 'wildlife', 'hiking', 'photography'],
  DK: ['eco', 'cultural', 'cycling', 'design', 'photography'],
  Danish: ['eco', 'cultural', 'cycling', 'design', 'photography'],
  FI: ['eco', 'nature', 'wildlife', 'adventure'],
  Finnish: ['eco', 'nature', 'wildlife', 'adventure'],
  PL: ['cultural', 'heritage', 'history', 'adventure'],
  Polish: ['cultural', 'heritage', 'history', 'adventure'],
  RU: ['luxury', 'history', 'cultural', 'beach', 'shopping'],
  Russian: ['luxury', 'history', 'cultural', 'beach', 'shopping'],

  // Asia
  IN: ['cultural', 'shopping', 'city', 'temples', 'spice', 'food', 'culinary'],
  Indian: ['cultural', 'shopping', 'city', 'temples', 'spice', 'food', 'culinary'],
  CN: ['cultural', 'shopping', 'scenic', 'photography', 'luxury'],
  Chinese: ['cultural', 'shopping', 'scenic', 'photography', 'luxury'],
  JP: ['cultural', 'temples', 'nature', 'wellness', 'tea', 'photography', 'eco'],
  Japanese: ['cultural', 'temples', 'nature', 'wellness', 'tea', 'photography', 'eco'],
  KR: ['cultural', 'wellness', 'photography', 'temples', 'shopping'],
  Korean: ['cultural', 'wellness', 'photography', 'temples', 'shopping'],
  SG: ['luxury', 'city', 'culinary', 'beach', 'shopping'],
  Singaporean: ['luxury', 'city', 'culinary', 'beach', 'shopping'],
  MY: ['beach', 'culinary', 'cultural', 'shopping', 'adventure'],
  Malaysian: ['beach', 'culinary', 'cultural', 'shopping', 'adventure'],
  TH: ['beach', 'temples', 'culinary', 'cultural', 'wellness'],
  Thai: ['beach', 'temples', 'culinary', 'cultural', 'wellness'],
  AE: ['luxury', 'beach', 'adventure', 'city', 'wellness'],
  Emirati: ['luxury', 'beach', 'adventure', 'city', 'wellness'],
  SA: ['luxury', 'beach', 'cultural', 'shopping'],
  'Saudi Arabian': ['luxury', 'beach', 'cultural', 'shopping'],

  // Americas
  US: ['adventure', 'wildlife', 'beach', 'photography', 'safari', 'cultural'],
  American: ['adventure', 'wildlife', 'beach', 'photography', 'safari', 'cultural'],
  CA: ['eco', 'adventure', 'wildlife', 'photography', 'cultural'],
  Canadian: ['eco', 'adventure', 'wildlife', 'photography', 'cultural'],

  // Oceania
  AU: ['adventure', 'wildlife', 'diving', 'surfing', 'eco', 'beach'],
  Australian: ['adventure', 'wildlife', 'diving', 'surfing', 'eco', 'beach'],
  NZ: ['adventure', 'eco', 'wildlife', 'hiking', 'scenic'],
  'New Zealander': ['adventure', 'eco', 'wildlife', 'hiking', 'scenic'],
};

// ─── Month → season & best / avoid regions ────────────────────────────────────

export interface SeasonInfo {
  season: 'peak_south' | 'peak_east' | 'shoulder' | 'low';
  label: string;
  bestRegions: string[];
  avoidRegions: string[];
}

export const SEASONAL_MAP: Record<number, SeasonInfo> = {
  1:  { season: 'peak_south', label: 'Jan — South Peak',      bestRegions: ['South Coast', 'Cultural Triangle', 'Hill Country'], avoidRegions: ['East Coast'] },
  2:  { season: 'peak_south', label: 'Feb — South Peak',      bestRegions: ['South Coast', 'Cultural Triangle', 'Hill Country'], avoidRegions: ['East Coast'] },
  3:  { season: 'peak_south', label: 'Mar — South Peak',      bestRegions: ['South Coast', 'Cultural Triangle', 'Hill Country'], avoidRegions: ['East Coast'] },
  4:  { season: 'shoulder',   label: 'Apr — Shoulder',        bestRegions: ['Cultural Triangle', 'Hill Country', 'East Coast'],  avoidRegions: [] },
  5:  { season: 'shoulder',   label: 'May — Shoulder',        bestRegions: ['Cultural Triangle', 'Hill Country'],                avoidRegions: ['South Coast'] },
  6:  { season: 'peak_east',  label: 'Jun — East Peak',       bestRegions: ['East Coast', 'Cultural Triangle'],                  avoidRegions: ['South Coast'] },
  7:  { season: 'peak_east',  label: 'Jul — East Peak',       bestRegions: ['East Coast', 'Cultural Triangle'],                  avoidRegions: ['South Coast'] },
  8:  { season: 'peak_east',  label: 'Aug — East Peak',       bestRegions: ['East Coast', 'Cultural Triangle'],                  avoidRegions: ['South Coast'] },
  9:  { season: 'low',        label: 'Sep — Low (Monsoon)',   bestRegions: ['Cultural Triangle'],                                avoidRegions: ['South Coast', 'East Coast'] },
  10: { season: 'shoulder',   label: 'Oct — Shoulder',        bestRegions: ['Cultural Triangle', 'Hill Country'],                avoidRegions: [] },
  11: { season: 'shoulder',   label: 'Nov — Shoulder',        bestRegions: ['South Coast', 'Cultural Triangle', 'Hill Country'], avoidRegions: ['East Coast'] },
  12: { season: 'peak_south', label: 'Dec — South Peak',      bestRegions: ['South Coast', 'Cultural Triangle', 'Hill Country'], avoidRegions: ['East Coast'] },
};

// ─── Group size → recommended transport ───────────────────────────────────────

export const GROUP_TRANSPORT_RULES: Array<{
  min: number; max: number; vehicleId: string;
}> = [
  { min: 1,  max: 2,   vehicleId: 'trans_sedan' },
  { min: 3,  max: 4,   vehicleId: 'trans_suv' },
  { min: 5,  max: 8,   vehicleId: 'trans_van' },
  { min: 9,  max: 15,  vehicleId: 'trans_mini_coach' },
  { min: 16, max: 999, vehicleId: 'trans_coach' },
];

// ─── Purpose → activity tag boosts ────────────────────────────────────────────

export const PURPOSE_ACTIVITY_TAGS: Record<string, string[]> = {
  honeymoon:   ['romance', 'luxury', 'beach', 'spa', 'private_dining', 'sunset_cruise', 'wellness'],
  leisure:     ['wildlife', 'beach', 'cultural', 'adventure', 'scenic', 'photography'],
  adventure:   ['safari', 'surfing', 'hiking', 'white_water_rafting', 'diving', 'rock_climbing', 'zip_lining'],
  business:    ['city', 'luxury', 'corporate_venue', 'wellness', 'culinary'],
  anniversary: ['romance', 'luxury', 'beach', 'spa', 'fine_dining', 'sunset_cruise'],
  birthday:    ['adventure', 'cultural', 'beach', 'group_activities', 'city'],
  group_tour:  ['cultural', 'photography', 'heritage', 'city_tour', 'markets', 'history'],
  corporate:   ['team_building', 'luxury', 'city', 'wellness', 'culinary'],
  other:       ['cultural', 'scenic', 'beach'],
};

// ─── Duration → recommended pattern ───────────────────────────────────────────

export const DURATION_RULES: Array<{
  min: number; max: number; pattern: string; preferredItineraryIds: string[];
}> = [
  { min: 1,  max: 3,  pattern: 'single_region',  preferredItineraryIds: ['itin_colombo_galle', 'itin_hill_country'] },
  { min: 4,  max: 6,  pattern: 'two_region',     preferredItineraryIds: ['itin_cultural_classic', 'itin_south_coast', 'itin_east_coast', 'itin_wildlife_safari'] },
  { min: 7,  max: 10, pattern: 'full_circuit',   preferredItineraryIds: ['itin_romance_package', 'itin_adventure_surf', 'itin_full_circuit'] },
  { min: 11, max: 999, pattern: 'comprehensive', preferredItineraryIds: ['itin_full_circuit', 'itin_northern_discovery'] },
];

// ─── Itinerary catalog ────────────────────────────────────────────────────────

export const ITINERARY_CATALOG: CatalogItem[] = [
  {
    id: 'itin_cultural_classic',
    type: 'itinerary',
    title: 'Cultural Triangle Classic',
    subtitle: '5 Days · Heritage & History',
    description: "Explore the ancient kingdoms of Sigiriya, Polonnaruwa, and Dambulla — Ceylon's UNESCO-listed heartland paired with the hill city of Kandy.",
    tags: ['cultural', 'heritage', 'history', 'temples', 'photography'],
    durationDays: 5,
    destinations: ['Sigiriya', 'Dambulla', 'Polonnaruwa', 'Kandy'],
    bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12],
    purposeMatch: ['leisure', 'group_tour', 'business', 'other'],
    groupSizeMin: 1, groupSizeMax: 999,
    priceRange: 'Mid-range',
    bookingCount: 87, popularityRank: 1,
  },
  {
    id: 'itin_south_coast',
    type: 'itinerary',
    title: 'South Coast & Whale Watch',
    subtitle: '6 Days · Beach & Wildlife',
    description: "Galle Fort's colonial history, Mirissa's whale-watching, and Yala's legendary leopards — Sri Lanka's golden south in one arc.",
    tags: ['beach', 'wildlife', 'history', 'whale_watching', 'safari', 'colonial'],
    durationDays: 6,
    destinations: ['Galle', 'Mirissa', 'Tangalle', 'Yala'],
    bestMonths: [11,12,1,2,3,4],
    purposeMatch: ['leisure', 'honeymoon', 'anniversary', 'adventure'],
    groupSizeMin: 1, groupSizeMax: 12,
    priceRange: 'Mid–High',
    bookingCount: 74, popularityRank: 2,
  },
  {
    id: 'itin_full_circuit',
    type: 'itinerary',
    title: 'Full Island Circuit',
    subtitle: '12 Days · Complete Sri Lanka',
    description: 'The definitive Sri Lanka experience — UNESCO heritage, hill country tea trails, colonial coast, and leopard country in one grand journey.',
    tags: ['cultural', 'heritage', 'beach', 'wildlife', 'scenic', 'tea', 'photography'],
    durationDays: 12,
    destinations: ['Colombo', 'Sigiriya', 'Polonnaruwa', 'Kandy', 'Nuwara Eliya', 'Ella', 'Yala', 'Mirissa', 'Galle'],
    bestMonths: [11,12,1,2,3,4],
    purposeMatch: ['leisure', 'group_tour', 'honeymoon'],
    groupSizeMin: 1, groupSizeMax: 999,
    priceRange: 'High',
    bookingCount: 62, popularityRank: 3,
  },
  {
    id: 'itin_hill_country',
    type: 'itinerary',
    title: 'Hill Country Escape',
    subtitle: '4 Days · Tea & Scenery',
    description: 'Colonial hill stations, misty tea estates, and the legendary Kandy-to-Ella train journey through the most scenic railway on Earth.',
    tags: ['scenic', 'tea', 'hiking', 'cultural', 'photography', 'train', 'eco'],
    durationDays: 4,
    destinations: ['Kandy', 'Nuwara Eliya', 'Ella'],
    bestMonths: [1,2,3,4,12],
    purposeMatch: ['leisure', 'honeymoon', 'anniversary', 'adventure'],
    groupSizeMin: 1, groupSizeMax: 8,
    priceRange: 'Mid-range',
    bookingCount: 58, popularityRank: 4,
  },
  {
    id: 'itin_romance_package',
    type: 'itinerary',
    title: 'Romantic Sri Lanka',
    subtitle: '7 Days · Luxury & Intimacy',
    description: 'Private pool villas, candle-lit beach dinners, sunrise hot-air balloon over Sigiriya, and sunset catamaran — crafted exclusively for couples.',
    tags: ['romance', 'luxury', 'beach', 'spa', 'private_dining', 'honeymoon', 'sunset_cruise', 'wellness'],
    durationDays: 7,
    destinations: ['Colombo', 'Sigiriya', 'Kandy', 'Galle', 'Mirissa'],
    bestMonths: [11,12,1,2,3,4],
    purposeMatch: ['honeymoon', 'anniversary', 'birthday'],
    groupSizeMin: 1, groupSizeMax: 4,
    priceRange: 'Luxury',
    bookingCount: 51, popularityRank: 5,
  },
  {
    id: 'itin_east_coast',
    type: 'itinerary',
    title: 'East Coast Explorer',
    subtitle: '5 Days · Beaches & Diving',
    description: "Trincomalee's natural harbor, Pigeon Island's coral reefs, and Arugam Bay's legendary surf breaks — the undiscovered east.",
    tags: ['beach', 'diving', 'surfing', 'adventure', 'eco', 'snorkeling'],
    durationDays: 5,
    destinations: ['Trincomalee', 'Pigeon Island', 'Arugam Bay'],
    bestMonths: [5,6,7,8,9,10],
    purposeMatch: ['leisure', 'adventure', 'group_tour', 'birthday'],
    groupSizeMin: 1, groupSizeMax: 12,
    priceRange: 'Mid-range',
    bookingCount: 43, popularityRank: 6,
  },
  {
    id: 'itin_wildlife_safari',
    type: 'itinerary',
    title: 'Wildlife Safari Special',
    subtitle: '5 Days · Big Five & Birds',
    description: "Yala's leopards, Udawalawe's elephant herds, and Minneriya's famous elephant gathering — for serious wildlife enthusiasts.",
    tags: ['wildlife', 'safari', 'photography', 'eco', 'elephants', 'leopards'],
    durationDays: 5,
    destinations: ['Minneriya', 'Udawalawe', 'Yala'],
    bestMonths: [2,3,4,5,6,7,8,9,10],
    purposeMatch: ['leisure', 'adventure', 'group_tour'],
    groupSizeMin: 1, groupSizeMax: 8,
    priceRange: 'Mid–High',
    bookingCount: 39, popularityRank: 7,
  },
  {
    id: 'itin_adventure_surf',
    type: 'itinerary',
    title: 'Adventure & Surf',
    subtitle: '6 Days · Thrills & Waves',
    description: 'White-water rafting in Kitulgala, rock climbing in Ella, surf lessons at Arugam Bay, and zip-lining — built for adrenaline seekers.',
    tags: ['adventure', 'surfing', 'hiking', 'white_water_rafting', 'rock_climbing', 'zip_lining', 'group_activities'],
    durationDays: 6,
    destinations: ['Kitulgala', 'Ella', 'Arugam Bay'],
    bestMonths: [5,6,7,8,9,10],
    purposeMatch: ['adventure', 'leisure', 'group_tour', 'birthday'],
    groupSizeMin: 1, groupSizeMax: 12,
    priceRange: 'Mid-range',
    bookingCount: 35, popularityRank: 8,
  },
  {
    id: 'itin_colombo_galle',
    type: 'itinerary',
    title: 'City & Coast Long Weekend',
    subtitle: '3 Days · Urban & Colonial',
    description: "Colombo's vibrant neighborhoods and Galle Fort's UNESCO-listed bastions — the perfect short-stay introduction to Sri Lanka.",
    tags: ['city', 'history', 'cultural', 'shopping', 'culinary', 'colonial', 'art'],
    durationDays: 3,
    destinations: ['Colombo', 'Galle'],
    bestMonths: [11,12,1,2,3,4,5,10],
    purposeMatch: ['leisure', 'business', 'group_tour', 'corporate'],
    groupSizeMin: 1, groupSizeMax: 999,
    priceRange: 'Mid-range',
    bookingCount: 31, popularityRank: 9,
  },
  {
    id: 'itin_northern_discovery',
    type: 'itinerary',
    title: 'Northern Discovery',
    subtitle: '5 Days · Jaffna & Beyond',
    description: "Sri Lanka's newly accessible north — Hindu temple towns, Jaffna's unique cuisine, Mannar's flamingoes, and ancient forts.",
    tags: ['cultural', 'heritage', 'temples', 'photography', 'offbeat', 'food', 'history'],
    durationDays: 5,
    destinations: ['Jaffna', 'Mannar', 'Anuradhapura'],
    bestMonths: [1,2,3,4,10,11,12],
    purposeMatch: ['leisure', 'group_tour', 'adventure'],
    groupSizeMin: 1, groupSizeMax: 12,
    priceRange: 'Mid-range',
    bookingCount: 22, popularityRank: 10,
  },
];

// ─── Activity catalog ─────────────────────────────────────────────────────────

export const ACTIVITY_CATALOG: CatalogItem[] = [
  { id: 'act_sigiriya',       type: 'activity', title: 'Sigiriya Rock Fortress',           subtitle: 'UNESCO World Heritage', description: 'Climb the 5th-century citadel rising 200m above the jungle — frescoes, water gardens, and panoramic views await.', tags: ['cultural', 'heritage', 'photography', 'hiking', 'history'], destinations: ['Sigiriya'], bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12], purposeMatch: ['leisure', 'group_tour', 'adventure', 'other'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 156, popularityRank: 1 },
  { id: 'act_whale',          type: 'activity', title: 'Whale Watching — Mirissa',          subtitle: 'Nov–Apr Season',        description: 'Blue whales, sperm whales, and pods of spinner dolphins just miles off the southern coast.', tags: ['wildlife', 'beach', 'photography', 'eco'], destinations: ['Mirissa'], bestMonths: [11,12,1,2,3,4], purposeMatch: ['leisure', 'honeymoon', 'anniversary', 'adventure'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 134, popularityRank: 2 },
  { id: 'act_yala_safari',    type: 'activity', title: 'Yala National Park Safari',         subtitle: 'Highest Leopard Density', description: "Dawn and dusk game drives through Asia's best leopard habitat — also elephants, sloth bears, and crocs.", tags: ['wildlife', 'safari', 'leopards', 'photography', 'eco'], destinations: ['Yala'], bestMonths: [2,3,4,5,6,7,8,9,10], purposeMatch: ['leisure', 'adventure', 'group_tour'], groupSizeMin: 1, groupSizeMax: 8, bookingCount: 121, popularityRank: 3 },
  { id: 'act_kandy_ella_train', type: 'activity', title: 'Kandy to Ella Scenic Train',      subtitle: 'Most Beautiful Rail Journey', description: 'Six hours through tea estates, misty mountains, and nine-arch bridges on the colonial-era hill railway.', tags: ['scenic', 'photography', 'train', 'tea', 'cultural'], destinations: ['Kandy', 'Ella'], bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12], purposeMatch: ['leisure', 'honeymoon', 'anniversary', 'group_tour'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 118, popularityRank: 4 },
  { id: 'act_elephant_udawalawe', type: 'activity', title: 'Elephant Watching — Udawalawe', subtitle: 'Year-round Sightings',  description: "Safari drives to observe Sri Lanka's largest elephant population in their natural habitat.", tags: ['wildlife', 'elephants', 'eco', 'photography'], destinations: ['Udawalawe'], bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12], purposeMatch: ['leisure', 'group_tour', 'adventure'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 99, popularityRank: 5 },
  { id: 'act_dambulla',       type: 'activity', title: 'Dambulla Cave Temples',             subtitle: 'UNESCO Site · 5 Caves',  description: '153 statues of the Buddha and elaborate ceiling murals inside cave shrines dating to the 1st century BC.', tags: ['cultural', 'heritage', 'temples', 'history', 'art'], destinations: ['Dambulla'], bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12], purposeMatch: ['leisure', 'group_tour', 'other'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 91, popularityRank: 6 },
  { id: 'act_galle_fort',     type: 'activity', title: 'Galle Fort Walking Tour',           subtitle: 'UNESCO Colonial Quarter', description: 'Rampart walks, boutique galleries, Dutch Reformed Church, and artisan workshops inside the 17th-century fort.', tags: ['history', 'colonial', 'cultural', 'photography', 'art', 'shopping'], destinations: ['Galle'], bestMonths: [11,12,1,2,3,4,5,10], purposeMatch: ['leisure', 'honeymoon', 'business', 'group_tour'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 88, popularityRank: 7 },
  { id: 'act_tea_factory',    type: 'activity', title: 'Tea Factory & Estate Tour',          subtitle: 'Nuwara Eliya Highlands',  description: "From leaf to cup — walk the estate, watch withering and rolling, and taste fresh-plucked single-estate Ceylon tea.", tags: ['tea', 'eco', 'cultural', 'photography', 'food'], destinations: ['Nuwara Eliya'], bestMonths: [1,2,3,4,12], purposeMatch: ['leisure', 'group_tour', 'business', 'corporate'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 82, popularityRank: 8 },
  { id: 'act_cooking_class',  type: 'activity', title: 'Sri Lankan Cooking Class',          subtitle: '3-Hour Hands-on Session', description: 'Learn to make kottu, hoppers, and pol sambol at a heritage home kitchen with a local chef.', tags: ['culinary', 'cultural', 'food', 'hands_on', 'spice'], destinations: ['Colombo', 'Galle'], bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12], purposeMatch: ['leisure', 'honeymoon', 'group_tour', 'corporate'], groupSizeMin: 1, groupSizeMax: 16, bookingCount: 71, popularityRank: 9 },
  { id: 'act_surf_arugam',    type: 'activity', title: 'Surf Lessons — Arugam Bay',         subtitle: 'May–Oct Surf Season',    description: "Sri Lanka's most consistent right-hand point break — lessons for beginners and free surfing for experienced riders.", tags: ['surfing', 'adventure', 'beach', 'group_activities'], destinations: ['Arugam Bay'], bestMonths: [5,6,7,8,9,10], purposeMatch: ['adventure', 'leisure', 'birthday', 'group_tour'], groupSizeMin: 1, groupSizeMax: 12, bookingCount: 65, popularityRank: 10 },
  { id: 'act_pigeon_island',  type: 'activity', title: 'Pigeon Island Snorkeling & Diving', subtitle: 'National Park · Coral Reefs', description: 'Vibrant reefs, blacktip reef sharks, and sea turtles just 1km off Trincomalee in protected national park waters.', tags: ['diving', 'snorkeling', 'beach', 'eco', 'adventure'], destinations: ['Trincomalee'], bestMonths: [5,6,7,8,9,10], purposeMatch: ['adventure', 'leisure', 'group_tour'], groupSizeMin: 1, groupSizeMax: 12, bookingCount: 58, popularityRank: 11 },
  { id: 'act_balloon',        type: 'activity', title: 'Hot Air Balloon — Sigiriya',        subtitle: 'Sunrise Flight',          description: 'Drift over the Cultural Triangle at sunrise — Sigiriya rock, Dambulla temples, and the jungle canopy below.', tags: ['adventure', 'photography', 'romance', 'scenic', 'luxury', 'sunset_cruise'], destinations: ['Sigiriya'], bestMonths: [1,2,3,4,11,12], purposeMatch: ['honeymoon', 'anniversary', 'leisure', 'adventure'], groupSizeMin: 1, groupSizeMax: 8, bookingCount: 52, popularityRank: 12 },
  { id: 'act_rafting',        type: 'activity', title: 'White Water Rafting — Kitulgala',   subtitle: 'Grade 3–4 Rapids',        description: "6km of rapids through the rainforest on the Kelani river — the same location as the film Bridge on the River Kwai.", tags: ['adventure', 'white_water_rafting', 'group_activities', 'eco'], destinations: ['Kitulgala'], bestMonths: [3,4,5,6,7,8,9,10,11], purposeMatch: ['adventure', 'group_tour', 'birthday', 'corporate'], groupSizeMin: 2, groupSizeMax: 20, bookingCount: 48, popularityRank: 13 },
  { id: 'act_polonnaruwa',    type: 'activity', title: 'Polonnaruwa Cycling Tour',          subtitle: 'Ancient Capital · UNESCO', description: 'Hire bicycles and explore the medieval royal palace, moonstone carvings, and lotus pond among jungle ruins.', tags: ['cultural', 'heritage', 'history', 'cycling', 'photography'], destinations: ['Polonnaruwa'], bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12], purposeMatch: ['leisure', 'adventure', 'group_tour'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 44, popularityRank: 14 },
  { id: 'act_adams_peak',     type: 'activity', title: "Little Adam's Peak Hike",           subtitle: 'Ella — Sunrise Trek',     description: '3km trek through tea estates to a 1141m peak with panoramic views over Ella Gap and the south plains.', tags: ['hiking', 'scenic', 'adventure', 'photography', 'tea'], destinations: ['Ella'], bestMonths: [1,2,3,4,5,10,11,12], purposeMatch: ['adventure', 'leisure', 'group_tour'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 41, popularityRank: 15 },
  { id: 'act_catamaran',      type: 'activity', title: 'Sunset Catamaran Cruise',           subtitle: 'Mirissa Harbour',         description: 'Two-hour sunset sail with champagne, dolphin spotting, and panoramic views of the southern coast.', tags: ['romance', 'beach', 'luxury', 'scenic', 'sunset_cruise', 'wellness'], destinations: ['Mirissa'], bestMonths: [11,12,1,2,3,4], purposeMatch: ['honeymoon', 'anniversary', 'leisure'], groupSizeMin: 1, groupSizeMax: 20, bookingCount: 39, popularityRank: 16 },
  { id: 'act_spice_garden',   type: 'activity', title: 'Spice Garden Tour — Matale',        subtitle: 'Cinnamon & Cardamom',     description: 'Walking tour of a working spice garden — see how cinnamon, pepper, nutmeg, and cloves are grown and processed.', tags: ['eco', 'cultural', 'food', 'spice', 'culinary'], destinations: ['Matale'], bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12], purposeMatch: ['leisure', 'group_tour', 'corporate'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 35, popularityRank: 17 },
  { id: 'act_minneriya',      type: 'activity', title: 'Minneriya Elephant Gathering',      subtitle: 'Jul–Oct Spectacle',       description: "Up to 300 wild elephants congregate at Minneriya tank's receding waters — one of Asia's greatest wildlife events.", tags: ['wildlife', 'elephants', 'photography', 'eco'], destinations: ['Minneriya'], bestMonths: [7,8,9,10], purposeMatch: ['leisure', 'group_tour', 'adventure'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 33, popularityRank: 18 },
  { id: 'act_ayurveda',       type: 'activity', title: 'Traditional Ayurveda Treatment',    subtitle: '90-Minute Session',       description: 'Authentic Ayurvedic consultation, oil massage, and herbal steam bath at a certified wellness centre.', tags: ['wellness', 'spa', 'romance', 'luxury', 'cultural'], destinations: ['Colombo', 'Kandy'], bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12], purposeMatch: ['honeymoon', 'anniversary', 'leisure', 'business'], groupSizeMin: 1, groupSizeMax: 4, bookingCount: 29, popularityRank: 19 },
  { id: 'act_jaffna',         type: 'activity', title: 'Jaffna Temple Circuit',             subtitle: 'Nallur & Nagadeepa',      description: "The Nallur Kandaswamy Kovil, Nagadeepa island temple by boat, and Jaffna's unique Hindu cultural heritage.", tags: ['temples', 'cultural', 'heritage', 'photography', 'offbeat'], destinations: ['Jaffna'], bestMonths: [1,2,3,4,10,11,12], purposeMatch: ['leisure', 'group_tour', 'adventure'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 25, popularityRank: 20 },
];

// ─── Destination catalog ──────────────────────────────────────────────────────

export const DESTINATION_CATALOG: CatalogItem[] = [
  { id: 'dest_sigiriya',      type: 'destination', title: 'Sigiriya',       subtitle: 'Cultural Triangle', description: "The 5th-century Lion Rock citadel rising 200m above the jungle — Sri Lanka's most iconic landmark.", tags: ['cultural', 'heritage', 'photography', 'history'], destinations: ['Sigiriya'], bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12], purposeMatch: ['leisure','group_tour','adventure','other'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 203, popularityRank: 1 },
  { id: 'dest_kandy',         type: 'destination', title: 'Kandy',          subtitle: 'Hill Country Gateway', description: "Sacred city of the Tooth Relic, Perahera festival, and the gateway to Sri Lanka's misty hill country.", tags: ['cultural', 'temples', 'scenic', 'tea', 'history'], destinations: ['Kandy'], bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12], purposeMatch: ['leisure','group_tour','honeymoon','other'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 189, popularityRank: 2 },
  { id: 'dest_galle',         type: 'destination', title: 'Galle',          subtitle: 'South Coast · UNESCO Fort', description: "17th-century Dutch fort packed with boutique hotels, galleries, and cafés — Sri Lanka's colonial jewel.", tags: ['colonial', 'history', 'beach', 'culinary', 'art', 'shopping'], destinations: ['Galle'], bestMonths: [11,12,1,2,3,4], purposeMatch: ['leisure','honeymoon','business','group_tour'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 171, popularityRank: 3 },
  { id: 'dest_ella',          type: 'destination', title: 'Ella',           subtitle: 'Hill Country · Trekkers\' Haven', description: 'Misty mountain village famed for Nine Arch Bridge, Little Adam\'s Peak, and spectacular valley views.', tags: ['scenic', 'hiking', 'tea', 'adventure', 'photography'], destinations: ['Ella'], bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12], purposeMatch: ['leisure','adventure','honeymoon','group_tour'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 158, popularityRank: 4 },
  { id: 'dest_yala',          type: 'destination', title: 'Yala',           subtitle: 'Wildlife · Leopard Capital', description: "Sri Lanka's flagship national park with the world's highest leopard density per square kilometre.", tags: ['wildlife', 'safari', 'leopards', 'eco', 'photography'], destinations: ['Yala'], bestMonths: [2,3,4,5,6,7,8,9,10], purposeMatch: ['leisure','adventure','group_tour'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 144, popularityRank: 5 },
  { id: 'dest_mirissa',       type: 'destination', title: 'Mirissa',        subtitle: 'South Coast · Blue Whale Season', description: 'Crescent-shaped beach by day, whale-watching port by dawn — the undisputed highlight of the south coast.', tags: ['beach', 'whale_watching', 'romance', 'luxury', 'sunset_cruise'], destinations: ['Mirissa'], bestMonths: [11,12,1,2,3,4], purposeMatch: ['leisure','honeymoon','anniversary'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 137, popularityRank: 6 },
  { id: 'dest_nuwara_eliya',  type: 'destination', title: 'Nuwara Eliya',   subtitle: 'Little England · Tea Country', description: "Colonial bungalows, rose gardens, and pristine tea estates at 1,868m — Sri Lanka's most English town.", tags: ['tea', 'scenic', 'colonial', 'wellness', 'hiking'], destinations: ['Nuwara Eliya'], bestMonths: [1,2,3,4,12], purposeMatch: ['leisure','honeymoon','anniversary','group_tour'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 122, popularityRank: 7 },
  { id: 'dest_colombo',       type: 'destination', title: 'Colombo',        subtitle: 'Capital · Urban Culture', description: "Sri Lanka's buzzing capital — Pettah markets, Beira Lake, rooftop bars, and Asia's finest street food.", tags: ['city', 'culinary', 'shopping', 'cultural', 'nightlife', 'art'], destinations: ['Colombo'], bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12], purposeMatch: ['leisure','business','group_tour','corporate'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 115, popularityRank: 8 },
  { id: 'dest_trincomalee',   type: 'destination', title: 'Trincomalee',    subtitle: 'East Coast · Natural Harbor', description: "One of the world's finest natural harbors — Fort Frederick, hot springs at Kanniya, and Pigeon Island reefs.", tags: ['beach', 'diving', 'history', 'eco', 'adventure'], destinations: ['Trincomalee'], bestMonths: [5,6,7,8,9,10], purposeMatch: ['leisure','adventure','group_tour'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 98, popularityRank: 9 },
  { id: 'dest_udawalawe',     type: 'destination', title: 'Udawalawe',      subtitle: 'Elephant Sanctuary', description: 'Year-round elephant safaris at the 30,821-hectare reservoir park — also home to leopards, buffalo, and 200 bird species.', tags: ['wildlife', 'elephants', 'eco', 'photography', 'safari'], destinations: ['Udawalawe'], bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12], purposeMatch: ['leisure','adventure','group_tour'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 103, popularityRank: 10 },
  { id: 'dest_arugam_bay',    type: 'destination', title: 'Arugam Bay',     subtitle: 'East Coast · Surf Mecca', description: "One of the world's top 10 surf destinations — a laid-back lagoon village with world-class right-hand breaks.", tags: ['surfing', 'beach', 'adventure', 'eco', 'nightlife'], destinations: ['Arugam Bay'], bestMonths: [5,6,7,8,9,10], purposeMatch: ['leisure','adventure','group_tour','birthday'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 86, popularityRank: 11 },
  { id: 'dest_dambulla',      type: 'destination', title: 'Dambulla',       subtitle: 'Cultural Triangle · Caves', description: 'The Golden Temple cave complex — Sri Lanka\'s largest and best-preserved cave temple, UNESCO-listed.', tags: ['cultural', 'heritage', 'temples', 'art', 'history'], destinations: ['Dambulla'], bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12], purposeMatch: ['leisure','group_tour','other'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 142, popularityRank: 12 },
  { id: 'dest_jaffna',        type: 'destination', title: 'Jaffna',         subtitle: 'North · Tamil Culture', description: "The gateway to Sri Lanka's Tamil heartland — ancient Hindu temples, palmyra palms, and distinct cuisine.", tags: ['cultural', 'heritage', 'temples', 'offbeat', 'food', 'history'], destinations: ['Jaffna'], bestMonths: [1,2,3,4,10,11,12], purposeMatch: ['leisure','adventure','group_tour'], groupSizeMin: 1, groupSizeMax: 999, bookingCount: 55, popularityRank: 13 },
  { id: 'dest_tangalle',      type: 'destination', title: 'Tangalle',       subtitle: 'South Coast · Seclusion', description: 'Secluded bays, turtle nesting beaches, and boutique eco-lodges — the quieter, wilder end of the south coast.', tags: ['beach', 'luxury', 'romance', 'eco', 'wellness'], destinations: ['Tangalle'], bestMonths: [11,12,1,2,3,4], purposeMatch: ['honeymoon','anniversary','leisure'], groupSizeMin: 1, groupSizeMax: 8, bookingCount: 72, popularityRank: 14 },
];

// ─── Transport catalog ────────────────────────────────────────────────────────

export const TRANSPORT_CATALOG: CatalogItem[] = [
  { id: 'trans_sedan',      type: 'transport', title: 'Private Air-conditioned Sedan',    subtitle: '1–3 Passengers', description: 'Comfortable Toyota Corolla or similar with an English-speaking driver for private transfers and day tours.', tags: ['private', 'comfortable', 'economy'], vehicleType: 'sedan', capacity: '1–3 pax', groupSizeMin: 1, groupSizeMax: 3, priceRange: 'Economy', bookingCount: 234, popularityRank: 1, bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 'trans_suv',        type: 'transport', title: 'Premium SUV / Toyota Prado',       subtitle: '1–4 Passengers', description: 'Spacious 4×4 with leather seating — ideal for couples, small families, and off-road wildlife safaris.', tags: ['private', 'luxury', 'comfort', 'safari'], vehicleType: 'suv', capacity: '1–4 pax', groupSizeMin: 1, groupSizeMax: 4, priceRange: 'Mid-range', bookingCount: 187, popularityRank: 2, bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 'trans_van',        type: 'transport', title: 'Air-conditioned KDH Van',          subtitle: '5–8 Passengers', description: 'Toyota KDH Hi-Ace with generous luggage space — the standard for small group tours across Sri Lanka.', tags: ['group', 'comfortable', 'luggage'], vehicleType: 'van', capacity: '5–8 pax', groupSizeMin: 5, groupSizeMax: 8, priceRange: 'Mid-range', bookingCount: 162, popularityRank: 3, bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 'trans_mini_coach', type: 'transport', title: 'Mini Coach (21-seater)',            subtitle: '9–15 Passengers', description: 'Reclining seats, A/C, PA system — perfect for mid-size tour groups and airport transfers.', tags: ['group', 'economy', 'tour', 'group_activities'], vehicleType: 'mini_coach', capacity: '9–15 pax', groupSizeMin: 9, groupSizeMax: 15, priceRange: 'Economy', bookingCount: 88, popularityRank: 4, bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 'trans_coach',      type: 'transport', title: 'Full-size Coach (45-seater)',       subtitle: '16–40 Passengers', description: 'Full-size luxury coach with PA, A/C, and luggage bay — for large groups and incentive travel.', tags: ['large_group', 'economy', 'corporate', 'group_activities'], vehicleType: 'coach', capacity: '16–40 pax', groupSizeMin: 16, groupSizeMax: 40, priceRange: 'Economy per pax', bookingCount: 44, popularityRank: 5, bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 'trans_luxury_van', type: 'transport', title: 'Mercedes-Benz Sprinter (Luxury)',  subtitle: '5–8 Passengers', description: 'Executive Sprinter with leather captain seats, USB charging, Wi-Fi, and a uniformed chauffeur.', tags: ['luxury', 'group', 'premium', 'corporate', 'wellness'], vehicleType: 'luxury_van', capacity: '5–8 pax', groupSizeMin: 5, groupSizeMax: 8, priceRange: 'Luxury', bookingCount: 39, popularityRank: 6, bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 'trans_tuk_tuk',   type: 'transport', title: 'Tuk-tuk (Local Exploration)',       subtitle: '1–3 Passengers', description: 'The quintessential Sri Lankan experience — navigate markets, temples, and backstreets in style.', tags: ['local', 'adventure', 'eco', 'city', 'cultural', 'offbeat'], vehicleType: 'tuk_tuk', capacity: '1–3 pax', groupSizeMin: 1, groupSizeMax: 3, priceRange: 'Budget', bookingCount: 67, popularityRank: 7, bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 'trans_train',      type: 'transport', title: 'Scenic Hill Railway (Kandy–Ella)', subtitle: 'Observation Car', description: 'Book a first-class observation car seat on the colonial-era hill line — the most scenic train in Asia.', tags: ['scenic', 'photography', 'cultural', 'tea', 'adventure'], vehicleType: 'train', capacity: 'Per seat', groupSizeMin: 1, groupSizeMax: 999, priceRange: 'Budget', bookingCount: 118, popularityRank: 8, bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 'trans_helicopter', type: 'transport', title: 'Helicopter Charter',               subtitle: 'Exclusive Transfer', description: 'Fly over the jungle and coast — Colombo to Sigiriya in 35 minutes instead of 4 hours by road.', tags: ['luxury', 'scenic', 'private', 'romance', 'exclusive'], vehicleType: 'helicopter', capacity: '1–4 pax', groupSizeMin: 1, groupSizeMax: 4, priceRange: 'Ultra-luxury', bookingCount: 12, popularityRank: 9, bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12] },
];
