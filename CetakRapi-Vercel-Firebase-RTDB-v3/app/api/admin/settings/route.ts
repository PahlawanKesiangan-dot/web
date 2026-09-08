import { NextResponse } from 'next/server';
import { getAdminUser, isSameOrigin } from '@/lib/admin-auth';
import { defaultSettings, normalizeWhatsapp, type PublicSettings } from '@/lib/settings';
import { getPublicSettings, savePublicSettings } from '@/lib/settings.server';

export const runtime = 'nodejs';

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Permintaan tidak diizinkan.' }, { status: 403 });
  if (!await getAdminUser()) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 403 });
  const body = await request.json().catch(() => null) as Partial<PublicSettings> | null;
  if (!body) return NextResponse.json({ error: 'Data pengaturan tidak valid.' }, { status: 400 });
  try {
    const settings: PublicSettings = {
      businessName: text(body.businessName, 2, 80, 'Nama bisnis'),
      businessWhatsapp: whatsapp(body.businessWhatsapp),
      maxFileMb: integer(body.maxFileMb, 1, 7, 'Ukuran file'),
      allowedTypes: types(body.allowedTypes),
      paperA4Enabled: Boolean(body.paperA4Enabled), paperF4Enabled: Boolean(body.paperF4Enabled),
      priceA4: integer(body.priceA4, 0, 1000000, 'Harga A4'),
      priceF4: integer(body.priceF4, 0, 1000000, 'Harga F4'),
      priceBw: integer(body.priceBw, 0, 1000000, 'Harga hitam putih'),
      priceColor: integer(body.priceColor, 0, 1000000, 'Harga berwarna'),
    };
    await savePublicSettings(settings);
    return NextResponse.json({ settings: await getPublicSettings() });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : 'Pengaturan tidak valid.' }, { status: 422 });
  }
}

function text(value: unknown, min: number, max: number, label: string) { const result = typeof value === 'string' ? value.trim() : ''; if (result.length < min || result.length > max) throw new Error(`${label} harus terdiri dari ${min}–${max} karakter.`); return result; }
function integer(value: unknown, min: number, max: number, label: string) { const result = Number(value); if (!Number.isInteger(result) || result < min || result > max) throw new Error(`${label} harus berupa angka ${min}–${max}.`); return result; }
function types(value: unknown) { if (!Array.isArray(value)) throw new Error('Pilih minimal satu format file.'); const result = [...new Set(value.map(String).filter((item) => defaultSettings.allowedTypes.includes(item)))]; if (!result.length) throw new Error('Pilih minimal satu format file.'); return result; }
function whatsapp(value: unknown) { const raw = typeof value === 'string' ? value : ''; if (!raw) return ''; const result = normalizeWhatsapp(raw); if (!/^\d{10,15}$/.test(result)) throw new Error('Nomor WhatsApp bisnis harus terdiri dari 10–15 digit.'); return result; }
