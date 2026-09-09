import { NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/admin-auth';
import { adminDatabase } from '@/lib/firebase/admin';
import { verifyUploadToken } from '@/lib/upload-token';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Permintaan tidak diizinkan.' }, { status: 403 });
  const body = await request.json().catch(() => null) as { uploadTokens?: unknown } | null;
  if (!body || !Array.isArray(body.uploadTokens)) return NextResponse.json({ cleaned: 0 });

  const candidates = body.uploadTokens.flatMap((token) => {
    if (typeof token !== 'string') return [];
    try {
      const claims = verifyUploadToken(token);
      return claims.key === `orderFiles/${claims.id}` ? [claims.key] : [];
    } catch {
      return [];
    }
  });
  const keys: string[] = [];
  for (const key of new Set(candidates)) {
    const snapshot = await adminDatabase().ref(key).get();
    if (snapshot.exists() && !snapshot.child('orderCode').exists()) keys.push(key);
  }
  if (keys.length) await adminDatabase().ref().update(Object.fromEntries(keys.map((key) => [key, null])));
  return NextResponse.json({ cleaned: keys.length });
}
