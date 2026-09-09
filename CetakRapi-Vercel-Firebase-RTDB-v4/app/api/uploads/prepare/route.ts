import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getPublicSettings } from '@/lib/settings.server';
import { validateUploadMetadata } from '@/lib/upload';
import { createUploadToken } from '@/lib/upload-token';

export const runtime = 'nodejs';

const MAX_DATABASE_FILE_BYTES = 7 * 1024 * 1024;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { fileName?: string; fileType?: string; fileSize?: number; website?: string } | null;
  if (!body || body.website) return error('Permintaan tidak valid.', 400);

  try {
    const settings = await getPublicSettings();
    const metadata = validateUploadMetadata(body.fileName || '', body.fileType || '', Number(body.fileSize), settings.allowedTypes, settings.maxFileMb);
    if (metadata.size > MAX_DATABASE_FILE_BYTES) {
      throw new Error('File maksimal 7 MB karena disimpan sebagai Base64 di Realtime Database.');
    }
    const id = crypto.randomUUID();
    const key = `orderFiles/${id}`;
    const exp = Date.now() + 60 * 60 * 1000;
    const firebaseToken = await adminAuth().createCustomToken(id, {
      upload: true,
      uploadMime: metadata.mime,
      uploadName: metadata.safeName,
      uploadSize: metadata.size,
    });
    const uploadToken = createUploadToken({
      exp,
      extension: metadata.extension,
      id,
      key,
      mime: metadata.mime,
      name: metadata.safeName,
      size: metadata.size,
    });

    return NextResponse.json({ firebaseToken, uploadName: metadata.safeName, uploadPath: key, uploadToken, contentType: metadata.mime, expiresAt: exp }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (cause) {
    return error(cause instanceof Error ? cause.message : 'Upload belum dapat disiapkan.', 422);
  }
}

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}
