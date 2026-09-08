import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { listOrders } from '@/lib/orders';

export const runtime = 'nodejs';

export async function GET() {
  if (!await getAdminUser()) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 403 });
  return NextResponse.json({ orders: await listOrders() }, { headers: { 'Cache-Control': 'no-store' } });
}
