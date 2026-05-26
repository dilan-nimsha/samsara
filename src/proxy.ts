import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Renamed from `middleware.ts` per Next 16 (Middleware → Proxy). Same logic.

// Paths reachable without a session: the login/auth screens and the
// system-to-system integration endpoints the public website calls (it has no
// user session of its own).
const PUBLIC_PREFIXES = [
  '/login',
  '/auth',
  '/api/me',         // returns clean 401 JSON itself when unauthenticated (no redirect)
  '/api/bookings',   // inbound web bookings + bookings list (called by the website)
  '/api/check-in',   // online check-in from the website
  '/api/health',
  '/api/notify',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Refreshes the session cookie and tells us if the request is authenticated.
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    // API calls must get JSON back — never an HTML login redirect. A client-side
    // `fetch(...).then(r => r.json())` would otherwise choke on the login page's
    // markup ("Unexpected token '<', \"<!DOCTYPE\"..."). Return a clean 401.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Signed-in users shouldn't sit on the login screen.
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|mp4)$).*)'],
};
