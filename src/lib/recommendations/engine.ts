// ─── Recommendation Engine ────────────────────────────────────────────────────
// Rule-based scoring engine with a popularity layer.
// Scoring matrix per item (max ~14 points):
//   +3  country preference tag overlap
//   +2  group size within vehicle/itinerary capacity
//   +2  seasonal relevance (arrival month in item's bestMonths)
//   +3  popularity (normalised booking count, 0–3)
//   +2  duration match (itinerary days ≈ trip length)
//   +2  travel purpose match
//   +1  booking history overlap (visited destination bonus)
//
// The engine is designed to be extended with collaborative filtering:
// add a `collaborativeScore()` function and merge it into `scoreItem()`.

import type {
  RecommendationInput,
  RecommendationItem,
  RecommendationResult,
  ScoreBreakdown,
  CatalogItem,
} from './types';
import {
  COUNTRY_PREFERENCES,
  SEASONAL_MAP,
  GROUP_TRANSPORT_RULES,
  PURPOSE_ACTIVITY_TAGS,
  DURATION_RULES,
  ITINERARY_CATALOG,
  ACTIVITY_CATALOG,
  DESTINATION_CATALOG,
  TRANSPORT_CATALOG,
} from './rules';

// ─── Normalise country/nationality string to preference lookup key ─────────────

function normCountry(raw: string): string {
  const trimmed = raw.trim();
  // Try direct hit first (handles ISO codes and exact nationality strings)
  if (COUNTRY_PREFERENCES[trimmed]) return trimmed;
  // Case-insensitive scan
  const lower = trimmed.toLowerCase();
  const match = Object.keys(COUNTRY_PREFERENCES).find(k => k.toLowerCase() === lower);
  return match ?? trimmed;
}

// ─── Core item scorer ─────────────────────────────────────────────────────────

const MAX_BOOKING_COUNT = 250; // normalise popularity against this ceiling

function scoreItem(item: CatalogItem, input: RecommendationInput): ScoreBreakdown {
  const { customer, history } = input;
  let countryMatch     = 0;
  let groupSizeMatch   = 0;
  let seasonalRelevance = 0;
  let popularity       = 0;
  let durationMatch    = 0;
  let purposeMatch     = 0;
  let historyBonus     = 0;

  // ── Country match (+3) ────────────────────────────────────────────────────
  if (customer.country) {
    const key = normCountry(customer.country);
    const countryTags = COUNTRY_PREFERENCES[key] ?? [];
    if (countryTags.length > 0 && item.tags.some(t => countryTags.includes(t))) {
      countryMatch = 3;
    }
  }

  // ── Group size match (+2) ─────────────────────────────────────────────────
  if (customer.groupSize !== undefined) {
    const min = item.groupSizeMin ?? 1;
    const max = item.groupSizeMax ?? 999;
    if (customer.groupSize >= min && customer.groupSize <= max) {
      groupSizeMatch = 2;
    }
  }

  // ── Seasonal relevance (+2) ───────────────────────────────────────────────
  if (customer.arrivalMonth && item.bestMonths) {
    if (item.bestMonths.includes(customer.arrivalMonth)) {
      seasonalRelevance = 2;
    }
  }

  // ── Popularity (+0–3, normalised) ─────────────────────────────────────────
  popularity = parseFloat(((item.bookingCount / MAX_BOOKING_COUNT) * 3).toFixed(1));
  if (popularity > 3) popularity = 3;

  // ── Duration match (+0, +1, or +2) ───────────────────────────────────────
  if (customer.travelDuration && item.durationDays) {
    const diff = Math.abs(item.durationDays - customer.travelDuration);
    if (diff === 0) durationMatch = 2;
    else if (diff <= 2) durationMatch = 1;
  }

  // ── Purpose match (+2) ────────────────────────────────────────────────────
  if (customer.travelPurpose && item.purposeMatch) {
    // Check direct purpose match
    if (item.purposeMatch.includes(customer.travelPurpose)) {
      purposeMatch = 2;
    } else {
      // Fallback: check purpose→tag overlap
      const purposeTags = PURPOSE_ACTIVITY_TAGS[customer.travelPurpose] ?? [];
      if (purposeTags.length > 0 && item.tags.some(t => purposeTags.includes(t))) {
        purposeMatch = 1;
      }
    }
  }

  // ── History bonus (+1) ────────────────────────────────────────────────────
  if (history?.pastDestinations && item.destinations) {
    if (item.destinations.some(d => history.pastDestinations!.includes(d))) {
      historyBonus = 1;
    }
  }
  if (history?.pastActivities && item.tags) {
    if (item.tags.some(t => history.pastActivities!.includes(t))) {
      historyBonus = Math.max(historyBonus, 1);
    }
  }

  const total = parseFloat(
    (countryMatch + groupSizeMatch + seasonalRelevance + popularity + durationMatch + purposeMatch + historyBonus).toFixed(1)
  );

  return { countryMatch, groupSizeMatch, seasonalRelevance, popularity, durationMatch, purposeMatch, historyBonus, total };
}

// ─── Build human-readable reason strings ──────────────────────────────────────

function buildReasons(breakdown: ScoreBreakdown, item: CatalogItem, input: RecommendationInput): string[] {
  const { customer } = input;
  const reasons: string[] = [];

  if (breakdown.countryMatch > 0 && customer.country) {
    const key = normCountry(customer.country);
    reasons.push(`Popular with ${key} travellers`);
  }
  if (breakdown.groupSizeMatch > 0 && customer.groupSize !== undefined) {
    reasons.push(`Suited for a group of ${customer.groupSize}`);
  }
  if (breakdown.seasonalRelevance > 0 && customer.arrivalMonth) {
    const info = SEASONAL_MAP[customer.arrivalMonth];
    reasons.push(`Peak season — ${info?.label ?? 'ideal timing'}`);
  }
  if (breakdown.popularity >= 2) {
    reasons.push(`Top-rated · ${item.bookingCount} bookings this year`);
  } else if (breakdown.popularity >= 1) {
    reasons.push(`${item.bookingCount} bookings this year`);
  }
  if (breakdown.durationMatch === 2 && customer.travelDuration) {
    reasons.push(`Exact match for your ${customer.travelDuration}-day trip`);
  } else if (breakdown.durationMatch === 1 && customer.travelDuration && item.durationDays) {
    reasons.push(`Close fit — ${item.durationDays} days (your trip: ${customer.travelDuration})`);
  }
  if (breakdown.purposeMatch > 0 && customer.travelPurpose) {
    const label = customer.travelPurpose.replace('_', ' ');
    reasons.push(`Ideal for ${label} travel`);
  }
  if (breakdown.historyBonus > 0) {
    reasons.push('Matches your past travel preferences');
  }

  return reasons.slice(0, 3); // cap at 3 per card
}

// ─── Apply transport rules to boost the right vehicle ─────────────────────────

function applyTransportRules(items: CatalogItem[], input: RecommendationInput): CatalogItem[] {
  const { groupSize, travelPurpose } = input.customer;
  if (!groupSize) return items;

  const rule = GROUP_TRANSPORT_RULES.find(r => groupSize >= r.min && groupSize <= r.max);
  if (!rule) return items;

  return items.map(item => {
    if (item.id === rule.vehicleId) {
      // Give the rule-matched vehicle an artificial +1 boost in bookingCount for this run
      return { ...item, bookingCount: item.bookingCount + 50 };
    }
    // Luxury bonus for honeymooners/anniversary
    if ((travelPurpose === 'honeymoon' || travelPurpose === 'anniversary') &&
        item.id === 'trans_helicopter' && groupSize <= 4) {
      return { ...item, bookingCount: item.bookingCount + 30 };
    }
    return item;
  });
}

// ─── Filter activities for itinerary builder day context ──────────────────────

function filterForDayContext(items: CatalogItem[], input: RecommendationInput): CatalogItem[] {
  const { currentDestinations, dayNumber } = input;
  if (!currentDestinations || currentDestinations.length === 0) return items;

  return items.sort((a, b) => {
    const aMatch = a.destinations?.some(d =>
      currentDestinations.some(cd => cd.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(cd.toLowerCase()))
    ) ? 1 : 0;
    const bMatch = b.destinations?.some(d =>
      currentDestinations.some(cd => cd.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(cd.toLowerCase()))
    ) ? 1 : 0;
    return bMatch - aMatch; // destination matches first
  });
}

// ─── Convert scored CatalogItem → RecommendationItem ─────────────────────────

function toRecommendationItem(item: CatalogItem, breakdown: ScoreBreakdown, reasons: string[]): RecommendationItem {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    tags: item.tags,
    score: breakdown.total,
    breakdown,
    reasons,
    metadata: {
      durationDays:   item.durationDays,
      destinations:   item.destinations,
      vehicleType:    item.vehicleType,
      capacity:       item.capacity,
      priceRange:     item.priceRange,
      bookingCount:   item.bookingCount,
      popularityRank: item.popularityRank,
    },
  };
}

// ─── Score, sort, and slice a catalog ─────────────────────────────────────────

function rankCatalog(
  catalog: CatalogItem[],
  input: RecommendationInput,
  limit: number,
  appliedRules: Set<string>
): RecommendationItem[] {
  const scored = catalog.map(item => {
    const breakdown = scoreItem(item, input);
    const reasons   = buildReasons(breakdown, item, input);

    // Track which rules fired
    if (breakdown.countryMatch > 0)      appliedRules.add(`country:${normCountry(input.customer.country ?? '')}`);
    if (breakdown.groupSizeMatch > 0)    appliedRules.add(`groupSize:${input.customer.groupSize}`);
    if (breakdown.seasonalRelevance > 0) appliedRules.add(`season:month${input.customer.arrivalMonth}`);
    if (breakdown.purposeMatch > 0)      appliedRules.add(`purpose:${input.customer.travelPurpose}`);
    if (breakdown.durationMatch > 0)     appliedRules.add(`duration:${input.customer.travelDuration}d`);

    return toRecommendationItem(item, breakdown, reasons);
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ─── Public entry point ───────────────────────────────────────────────────────

export function getRecommendations(input: RecommendationInput): RecommendationResult {
  const limit = input.limit ?? 5;
  const appliedRules = new Set<string>();

  // Determine duration rules for itineraries
  let itinCatalog = [...ITINERARY_CATALOG];
  if (input.customer.travelDuration) {
    const rule = DURATION_RULES.find(
      r => (input.customer.travelDuration ?? 0) >= r.min && (input.customer.travelDuration ?? 0) <= r.max
    );
    if (rule) {
      appliedRules.add(`durationPattern:${rule.pattern}`);
      // Boost preferred itineraries for this duration band
      itinCatalog = itinCatalog.map(it =>
        rule.preferredItineraryIds.includes(it.id)
          ? { ...it, bookingCount: it.bookingCount + 30 }
          : it
      );
    }
  }

  // Apply transport rules before scoring
  const transportCatalog = applyTransportRules([...TRANSPORT_CATALOG], input);

  // For itinerary builder: sort activities by destination relevance first
  const activityCatalog = input.context === 'itinerary_builder'
    ? filterForDayContext([...ACTIVITY_CATALOG], input)
    : [...ACTIVITY_CATALOG];

  const itineraries  = rankCatalog(itinCatalog,       input, limit, appliedRules);
  const activities   = rankCatalog(activityCatalog,   input, limit, appliedRules);
  const destinations = rankCatalog([...DESTINATION_CATALOG], input, limit, appliedRules);
  const transport    = rankCatalog(transportCatalog,  input, limit, appliedRules);

  return {
    itineraries,
    activities,
    destinations,
    transport,
    meta: {
      appliedRules:    Array.from(appliedRules),
      computedAt:      new Date().toISOString(),
      totalCandidates: ITINERARY_CATALOG.length + ACTIVITY_CATALOG.length + DESTINATION_CATALOG.length + TRANSPORT_CATALOG.length,
    },
  };
}

// ─── Utility: get only top transport for a given group size ───────────────────
// Useful for the "recommended vehicle" quick-pick in the reservation form.

export function getRecommendedTransport(groupSize: number, travelPurpose?: string): CatalogItem | undefined {
  const rule = GROUP_TRANSPORT_RULES.find(r => groupSize >= r.min && groupSize <= r.max);
  if (!rule) return undefined;

  // Luxury override for honeymoon/anniversary small groups
  if ((travelPurpose === 'honeymoon' || travelPurpose === 'anniversary') && groupSize <= 4) {
    const suv = TRANSPORT_CATALOG.find(t => t.id === 'trans_suv');
    if (suv) return suv;
  }

  return TRANSPORT_CATALOG.find(t => t.id === rule.vehicleId);
}

// ─── Utility: seasonal banner info ───────────────────────────────────────────

export { SEASONAL_MAP };
