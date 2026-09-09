import { NextResponse } from 'next/server';
import { getAdminUser, isSameOrigin } from '@/lib/admin-auth';
import { getOrder, orderStatuses, setOrderStatus, type OrderStatus } from '@/lib/orders';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!await getAdminUser()) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 403 });
  const order = await getOrder((await params).code);
  return order ? NextResponse.json({ order }, { headers: { 'Cache-Control': 'no-store' } }) : NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Permintaan tidak diizinkan.' }, { status: 403 });
  if (!await getAdminUser()) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 403 });
  const body = await request.json().catch(() => null) as { status?: string } | null;
  if (!body?.status || !orderStatuses.includes(body.status as OrderStatus)) return NextResponse.json({ error: 'Status tidak valid.' }, { status: 422 });
  const updated = await setOrderStatus((await params).code, body.status as OrderStatus);
  return updated ? NextResponse.json({ ok: true, status: body.status }) : NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
}
