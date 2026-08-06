import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const allowDev =
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_CHART_TEST === '1' ||
    process.env.NEXT_PUBLIC_APP_ENV === 'staging' ||
    process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'staging';
  if (!allowDev && request.nextUrl.pathname.startsWith('/dev/')) {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/dev/:path*',
};
