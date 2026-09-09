import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { adminDatabase } from '@/lib/firebase/admin';
import { getOrderFiles } from '@/lib/order-types';
import { getOrder } from '@/lib/orders';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!await getAdminUser()) {
    return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 403 });
  }

  const order = await getOrder((await params).code);
  if (!order) {
    return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
  }

  const files = getOrderFiles(order);
  const requestedId = new URL(request.url).searchParams.get('fileId');
  const file = requestedId ? files.find((item) => item.id === requestedId) : files[0];
  if (!file) {
    return NextResponse.json({ error: 'Lampiran tidak ditemukan pada pesanan ini.' }, { status: 404 });
  }

  const safeName = file.name.replace(/["\r\n]/g, '_');
  const snapshot = await adminDatabase().ref(file.key).get();
  const value = snapshot.val() as { data?: unknown } | null;
  if (!value || typeof value.data !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(value.data)) {
    return NextResponse.json({ error: 'File pesanan tidak ditemukan.' }, { status: 404 });
  }

  const bytes = Buffer.from(value.data, 'base64');
  if (bytes.byteLength !== file.size || bytes.toString('base64') !== value.data) {
    return NextResponse.json({ error: 'Data file pesanan tidak valid.' }, { status: 422 });
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
      'Content-Length': String(bytes.byteLength),
      'Content-Type': file.type,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
