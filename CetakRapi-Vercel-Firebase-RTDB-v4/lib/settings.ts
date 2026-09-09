export type PublicSettings = {
  businessName: string; businessWhatsapp: string; maxFileMb: number; allowedTypes: string[];
  paperA4Enabled: boolean; paperF4Enabled: boolean; priceA4: number; priceF4: number;
  priceBw: number; priceColor: number;
};

export const defaultSettings: PublicSettings = {
  businessName: 'CetakRapi', businessWhatsapp: '6285124005652', maxFileMb: 7,
  allowedTypes: ['png', 'jpg', 'jpeg', 'docx', 'xlsx', 'pdf'],
  paperA4Enabled: true, paperF4Enabled: true, priceA4: 1000, priceF4: 1000,
  priceBw: 0, priceColor: 1000,
};

export function estimatePrice(s: PublicSettings, paper: string, color: string, pages: number, copies: number) {
  const paperPrice = paper === 'F4' ? s.priceF4 : s.priceA4;
  const colorPrice = color === 'color' ? s.priceColor : s.priceBw;
  return (paperPrice + colorPrice) * pages * copies;
}

export function formatRupiah(value: number) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value); }
export function normalizeWhatsapp(value: string) { const digits = value.replace(/\D/g, ''); return digits.startsWith('0') ? `62${digits.slice(1)}` : digits; }
export function formatWhatsapp(value: string) {
  const normalized = normalizeWhatsapp(value);
  const local = normalized.startsWith('62') ? `0${normalized.slice(2)}` : normalized;
  return local.replace(/^(\d{4})(\d{4})(\d+)$/, '$1 $2 $3');
}
