import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PUBLIC_CHART_TEST !== '1' &&
    request.nextUrl.pathname.startsWith('/dev/')
  ) {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/dev/:path*',
};
