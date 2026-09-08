import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, sessionCookieOptions } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/admin', request.url));
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    ...sessionCookieOptions(new URL(request.url).protocol === 'https:'),
    maxAge: 0,
  });
  return response;
}
