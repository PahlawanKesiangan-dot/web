import { NextResponse } from 'next/server';
import { adminDatabase } from '@/lib/firebase/admin';
import { createOrder } from '@/lib/orders';
import { estimatePrice, normalizeWhatsapp } from '@/lib/settings';
import { getPublicSettings } from '@/lib/settings.server';
import { signatureMatches } from '@/lib/upload';
import { verifyUploadToken } from '@/lib/upload-token';

export const runtime = 'nodejs';

type OrderInput = {
  color?: string;
  copies?: number;
  name?: string;
  notes?: string;
  pages?: number;
  paper?: string;
  uploadToken?: string;
  website?: string;
  whatsapp?: string;
};

export async function POST(request: Request) {
  let uploadedKey = '';
  try {
    const body = await request.json().catch(() => null) as OrderInput | null;
    if (!body || body.website) return error('Permintaan tidak valid.', 400);
    const name = String(body.name || '').trim();
    const whatsapp = normalizeWhatsapp(String(body.whatsapp || ''));
    const paper = String(body.paper || '');
    const color = String(body.color || '');
    const pages = positiveInteger(body.pages, 10_000);
    const copies = positiveInteger(body.copies, 1_000);
    const notes = String(body.notes || '').trim();
    const settings = await getPublicSettings();

    if (name.length < 3 || name.length > 80) return error('Nama lengkap harus terdiri dari 3–80 karakter.');
    if (!/^\d{10,15}$/.test(whatsapp)) return error('Nomor WhatsApp harus berisi 10–15 digit.');
    if (!['A4', 'F4'].includes(paper)) return error('Pilih jenis kertas yang valid.');
    if ((paper === 'A4' && !settings.paperA4Enabled) || (paper === 'F4' && !settings.paperF4Enabled)) return error('Jenis kertas tersebut sedang tidak tersedia.');
    if (!['bw', 'color'].includes(color)) return error('Pilih warna cetak yang valid.');
    if (!pages || !copies) return error('Jumlah halaman dan salinan harus berupa angka positif.');
    if (notes.length > 1_000) return error('Catatan maksimal 1.000 karakter.');
    if (!body.uploadToken) return error('File belum berhasil diunggah.');

    const upload = verifyUploadToken(body.uploadToken);
    uploadedKey = upload.key;
    if (!settings.allowedTypes.includes(upload.extension) || upload.size > settings.maxFileMb * 1024 * 1024) {
      throw new Error('File tidak lagi sesuai dengan aturan upload saat ini.');
    }

    const snapshot = await adminDatabase().ref(upload.key).get();
    const inlineFile = readInlineFile(snapshot.val());
    if (inlineFile.name !== upload.name || inlineFile.mime !== upload.mime || inlineFile.size !== upload.size) {
      throw new Error('Metadata file Base64 tidak sesuai.');
    }
    const bytes = decodeBase64(inlineFile.data);
    if (bytes.byteLength !== upload.size) throw new Error('Ukuran file Base64 tidak sesuai.');
    if (!signatureMatches(upload.extension, bytes.subarray(0, 8))) throw new Error('Isi file tidak sesuai atau file rusak.');

    const code = createOrderCode();
    const now = new Date().toISOString();
    const totalPages = pages * copies;
    const estimatedTotal = estimatePrice(settings, paper, color, pages, copies);
    await adminDatabase().ref(upload.key).update({ orderCode: code });
    await createOrder({
      id: upload.id,
      code,
      customer_name: name,
      whatsapp,
      paper_size: paper,
      color_mode: color,
      page_count: pages,
      copy_count: copies,
      total_pages: totalPages,
      estimated_total: estimatedTotal,
      notes,
      status: 'new',
      file_name: upload.name,
      file_key: upload.key,
      file_type: upload.mime,
      file_size: upload.size,
      created_at: now,
      updated_at: now,
    });

    uploadedKey = '';
    const message = `Halo, saya baru mengirim pesanan cetak dengan kode ${code}.`;
    const whatsappUrl = settings.businessWhatsapp ? `https://wa.me/${settings.businessWhatsapp}?text=${encodeURIComponent(message)}` : null;
    return NextResponse.json({ code, estimatedTotal, whatsappUrl }, { status: 201 });
  } catch (cause) {
    if (uploadedKey) await adminDatabase().ref(uploadedKey).remove().catch(() => undefined);
    const message = cause instanceof Error && cause.message ? cause.message : 'Terjadi kesalahan saat mengirim pesanan.';
    return error(message, 400);
  }
}

type InlineFile = { data: string; mime: string; name: string; size: number };

function readInlineFile(value: unknown): InlineFile {
  if (!value || typeof value !== 'object') throw new Error('File Base64 tidak ditemukan. Silakan pilih file kembali.');
  const record = value as Partial<InlineFile>;
  if (typeof record.data !== 'string' || typeof record.mime !== 'string' || typeof record.name !== 'string' || !Number.isInteger(record.size)) {
    throw new Error('Data file Base64 tidak valid.');
  }
  return record as InlineFile;
}

function decodeBase64(value: string): Uint8Array {
  if (value.length > 10_000_000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw new Error('Data file Base64 tidak valid.');
  const decoded = Buffer.from(value, 'base64');
  if (decoded.toString('base64') !== value) throw new Error('Data file Base64 tidak valid.');
  return new Uint8Array(decoded);
}

function positiveInteger(value: unknown, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : 0;
}

function createOrderCode() {
  const date = new Date();
  const stamp = `${String(date.getUTCFullYear()).slice(-2)}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;
  const random = Array.from(crypto.getRandomValues(new Uint8Array(5)), (byte) => (byte % 36).toString(36).toUpperCase()).join('');
  return `CTK-${stamp}-${random}`;
}

function error(message: string, status = 422) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}
