import 'server-only';

import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

export const ADMIN_SESSION_COOKIE = 'cetakrapi_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

export type AdminUser = {
  userId: string;
  displayName: string;
  email: string;
};

export async function getAdminUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(sessionCookie, true);
    const email = decoded.email?.trim().toLowerCase() || '';
    if (!email || email !== adminEmail()) return null;
    return {
      userId: decoded.uid,
      email,
      displayName: decoded.name?.trim() || email,
    };
  } catch {
    return null;
  }
}

export function isAllowedAdminEmail(email: string | undefined): boolean {
  return Boolean(email && email.trim().toLowerCase() === adminEmail());
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'strict' as const,
    secure,
  };
}

function adminEmail(): string {
  const value = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!value) throw new Error('Environment variable ADMIN_EMAIL belum dikonfigurasi.');
  return value;
}
