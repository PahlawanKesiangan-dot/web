import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { ADMIN_SESSION_COOKIE, isAllowedAdminEmail, isSameOrigin, SESSION_MAX_AGE_MS, sessionCookieOptions } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Permintaan tidak diizinkan.' }, { status: 403 });
  const body = await request.json().catch(() => null) as { idToken?: string } | null;
  if (!body?.idToken) return NextResponse.json({ error: 'Token login tidak ditemukan.' }, { status: 422 });

  try {
    const decoded = await adminAuth().verifyIdToken(body.idToken, true);
    const signedInRecently = Date.now() / 1000 - decoded.auth_time < 5 * 60;
    if (!signedInRecently || !isAllowedAdminEmail(decoded.email)) {
      return NextResponse.json({ error: 'Akun tidak memiliki akses admin.' }, { status: 403 });
    }

    const sessionCookie = await adminAuth().createSessionCookie(body.idToken, { expiresIn: SESSION_MAX_AGE_MS });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, sessionCookie, sessionCookieOptions(new URL(request.url).protocol === 'https:'));
    return response;
  } catch {
    return NextResponse.json({ error: 'Login Firebase tidak valid.' }, { status: 401 });
  }
}
