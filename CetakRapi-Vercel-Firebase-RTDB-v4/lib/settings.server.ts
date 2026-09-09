import 'server-only';

import { adminDatabase } from '@/lib/firebase/admin';
import { defaultSettings, normalizeWhatsapp, type PublicSettings } from '@/lib/settings';

export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    const snapshot = await adminDatabase().ref('settings').get();
    return normalizeSettings(snapshot.val());
  } catch {
    return defaultSettings;
  }
}

export async function savePublicSettings(settings: PublicSettings): Promise<void> {
  await adminDatabase().ref('settings').set({ ...settings, updatedAt: new Date().toISOString() });
}

function normalizeSettings(raw: unknown): PublicSettings {
  const value = raw && typeof raw === 'object' ? raw as Partial<PublicSettings> : {};
  const businessWhatsapp = normalizeWhatsapp(text(value.businessWhatsapp, defaultSettings.businessWhatsapp));
  return {
    businessName: text(value.businessName, defaultSettings.businessName),
    businessWhatsapp: /^\d{10,15}$/.test(businessWhatsapp) ? businessWhatsapp : defaultSettings.businessWhatsapp,
    maxFileMb: boundedNumber(value.maxFileMb, defaultSettings.maxFileMb, 1, 7),
    allowedTypes: parseTypes(value.allowedTypes),
    paperA4Enabled: boolean(value.paperA4Enabled, defaultSettings.paperA4Enabled),
    paperF4Enabled: boolean(value.paperF4Enabled, defaultSettings.paperF4Enabled),
    priceA4: boundedNumber(value.priceA4, defaultSettings.priceA4, 0, 1_000_000),
    priceF4: boundedNumber(value.priceF4, defaultSettings.priceF4, 0, 1_000_000),
    priceBw: boundedNumber(value.priceBw, defaultSettings.priceBw, 0, 1_000_000),
    priceColor: boundedNumber(value.priceColor, defaultSettings.priceColor, 0, 1_000_000),
  };
}

function boolean(value: unknown, fallback: boolean) { return typeof value === 'boolean' ? value : fallback; }
function text(value: unknown, fallback: string) { return typeof value === 'string' ? value : fallback; }
function boundedNumber(value: unknown, fallback: number, min: number, max: number) { const number = Number(value); return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback; }
function parseTypes(value: unknown) { const parsed = Array.isArray(value) ? value.map(String).map((item) => item.toLowerCase()).filter((item) => defaultSettings.allowedTypes.includes(item)) : []; return parsed.length ? [...new Set(parsed)] : defaultSettings.allowedTypes; }
