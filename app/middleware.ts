import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS_ENV = process.env.ALLOWED_ORIGINS || 'https://www.gigagossip.xyz,https://gigagossip.xyz,http://localhost:5173,http://localhost:3000';

function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  return allowedOrigins.some(
    (allowed) => allowed === '*' || allowed === origin || allowed === origin.replace(/\/$/, ''),
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only apply CORS to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const allowedOrigins = ALLOWED_ORIGINS_ENV.split(',').map((s) => s.trim());
  const origin = req.headers.get('origin') || '';
  const allowed = isOriginAllowed(origin, allowedOrigins);

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 });
    if (allowed && origin) {
      res.headers.set('Access-Control-Allow-Origin', origin);
      res.headers.set('Vary', 'Origin');
    }
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.headers.set('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-CSRF-Token, X-Request-ID');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Access-Control-Max-Age', '300');
    return res;
  }

  // For actual requests, add CORS headers if origin is allowed
  const res = NextResponse.next();
  if (allowed && origin) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Vary', 'Origin');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Access-Control-Expose-Headers', 'Link, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, ETag');
  }

  return res;
}

export const config = {
  matcher: '/api/:path*',
};
