// ─── Recommendation System — Type Definitions ─────────────────────────────────

export type RecommendationType = 'itinerary' | 'destination' | 'activity' | 'transport';

// ─── Input context ─────────────────────────────────────────────────────────────

export interface CustomerContext {
  /** ISO alpha-2 country code or full country name from client nationality field */
  country?: string;
  groupSize?: number;
  /** Trip length in days (departure - arrival) */
  travelDuration?: number;
  /** 1–12 */
  arrivalMonth?: number;
  travelPurpose?: string;
  /** Total trip budget in USD equivalent (optional) */
  budget?: number;
  isRepeatClient?: boolean;
}

export interface BookingHistoryContext {
  pastDestinations?: string[];
  pastActivities?: string[];
}

export interface RecommendationInput {
  customer: CustomerContext;
  history?: BookingHistoryContext;
  /** Which UI surface triggered this request */
  context: 'reservation' | 'itinerary_builder';
  /** Destinations already on the itinerary — used to avoid duplication */
  currentDestinations?: string[];
  /** Current day number in builder (1-based) — used to suggest day-appropriate activities */
  dayNumber?: number;
  /** Max items per category (default: 5) */
  limit?: number;
}

// ─── Output ────────────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  countryMatch: number;     // 0 or +3
  groupSizeMatch: number;   // 0 or +2
  seasonalRelevance: number;// 0 or +2
  popularity: number;       // 0–3 (normalised from booking count)
  durationMatch: number;    // 0, +1, or +2
  purposeMatch: number;     // 0 or +2
  historyBonus: number;     // 0 or +1
  total: number;
}

export interface RecommendationItem {
  id: string;
  type: RecommendationType;
  title: string;
  subtitle?: string;
  description: string;
  tags: string[];
  score: number;
  breakdown: ScoreBreakdown;
  /** Human-readable reasons shown in the UI */
  reasons: string[];
  metadata: {
    durationDays?: number;
    destinations?: string[];
    activities?: string[];
    vehicleType?: string;
    capacity?: string;
    priceRange?: string;
    bestSeason?: string[];
    bookingCount?: number;
    popularityRank?: number;
  };
}

export interface RecommendationResult {
  itineraries: RecommendationItem[];
  activities: RecommendationItem[];
  destinations: RecommendationItem[];
  transport: RecommendationItem[];
  meta: {
    /** Rule strings that fired during scoring */
    appliedRules: string[];
    computedAt: string;
    totalCandidates: number;
  };
}

// ─── Internal catalog item shape (unified across all catalogs) ─────────────────

export interface CatalogItem {
  id: string;
  type: RecommendationType;
  title: string;
  subtitle?: string;
  description: string;
  tags: string[];
  destinations?: string[];
  activities?: string[];
  durationDays?: number;
  groupSizeMin?: number;
  groupSizeMax?: number;
  bestMonths?: number[];
  purposeMatch?: string[];
  vehicleType?: string;
  capacity?: string;
  priceRange?: string;
  bookingCount: number;
  popularityRank: number;
}
