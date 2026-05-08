import { NextRequest, NextResponse } from 'next/server';
import { getRecommendations } from '@/lib/recommendations';
import type { RecommendationInput } from '@/lib/recommendations';

// POST /api/recommendations
// Body: RecommendationInput
// Returns: RecommendationResult
//
// Scalability note: replace getRecommendations() with an async call to
// a vector DB or ML inference endpoint to enable collaborative filtering.

export async function POST(req: NextRequest) {
  try {
    const body: RecommendationInput = await req.json();

    if (!body.customer) {
      return NextResponse.json({ error: 'customer context is required' }, { status: 400 });
    }

    const result = getRecommendations(body);

    return NextResponse.json(result, {
      headers: {
        // Cache for 5 minutes — recommendations are deterministic for the same input
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('[recommendations] error:', error);
    return NextResponse.json({ error: 'Failed to compute recommendations' }, { status: 500 });
  }
}

// GET /api/recommendations?country=DE&groupSize=4&month=3&purpose=leisure&duration=7
// Convenience endpoint for quick client-side fetches without a body.

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const input: RecommendationInput = {
      customer: {
        country:        sp.get('country')  ?? undefined,
        groupSize:      sp.get('groupSize') ? parseInt(sp.get('groupSize')!, 10) : undefined,
        arrivalMonth:   sp.get('month')     ? parseInt(sp.get('month')!, 10)     : undefined,
        travelPurpose:  sp.get('purpose')  ?? undefined,
        travelDuration: sp.get('duration') ? parseInt(sp.get('duration')!, 10)  : undefined,
      },
      context: (sp.get('context') as RecommendationInput['context']) ?? 'reservation',
      limit: sp.get('limit') ? parseInt(sp.get('limit')!, 10) : 5,
    };

    const result = getRecommendations(input);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[recommendations] GET error:', error);
    return NextResponse.json({ error: 'Failed to compute recommendations' }, { status: 500 });
  }
}
