'use client';

import { useState } from 'react';
import { Check, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { defaultSettings, type PublicSettings } from '@/lib/settings';

export function SettingsForm({ initial }: { initial: PublicSettings }) {
  const [settings, setSettings] = useState(initial); const [busy, setBusy] = useState(false); const [saved, setSaved] = useState(false); const [error, setError] = useState('');
  function number(key: keyof PublicSettings, value: string) { setSettings((old) => ({ ...old, [key]: Math.max(0, Number(value) || 0) })); }
  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setSaved(false); setError('');
    const response = await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    const result = await response.json() as { settings?: PublicSettings; error?: string };
    if (response.ok && result.settings) { setSettings(result.settings); setSaved(true); } else setError(result.error || 'Pengaturan belum tersimpan.');
    setBusy(false);
  }
  const types = defaultSettings.allowedTypes;
  return <form onSubmit={submit} className="space-y-8">
    <section><h2 className="text-lg font-extrabold">Ketersediaan kertas</h2><p className="mt-1 text-sm text-muted-foreground">Pilihan yang dimatikan langsung hilang dari formulir pelanggan.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><PaperToggle label="Kertas A4" checked={settings.paperA4Enabled} onChange={(checked) => setSettings({ ...settings, paperA4Enabled: checked })} /><PaperToggle label="Kertas F4" checked={settings.paperF4Enabled} onChange={(checked) => setSettings({ ...settings, paperF4Enabled: checked })} /></div></section>
    <section><h2 className="text-lg font-extrabold">Harga per lembar</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><Money label="Kertas A4" value={settings.priceA4} onChange={(v) => number('priceA4', v)} /><Money label="Kertas F4" value={settings.priceF4} onChange={(v) => number('priceF4', v)} /><Money label="Tambahan hitam putih" value={settings.priceBw} onChange={(v) => number('priceBw', v)} /><Money label="Tambahan berwarna" value={settings.priceColor} onChange={(v) => number('priceColor', v)} /></div></section>
    <section><h2 className="text-lg font-extrabold">Aturan upload</h2><div className="mt-4 grid gap-5 sm:grid-cols-2"><Field><FieldLabel htmlFor="max-file">Ukuran maksimum file</FieldLabel><div className="relative"><Input id="max-file" type="number" min={1} max={7} value={settings.maxFileMb} onChange={(e) => number('maxFileMb', e.target.value)} className="h-11 pr-12" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">MB</span></div><FieldDescription>Maksimal 7 MB karena file disimpan sebagai Base64.</FieldDescription></Field><Field><FieldLabel>Format yang diizinkan</FieldLabel><div className="flex flex-wrap gap-2">{types.map((type) => { const checked = settings.allowedTypes.includes(type); return <label key={type} className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold"><Checkbox checked={checked} onCheckedChange={(value) => setSettings({ ...settings, allowedTypes: value ? [...settings.allowedTypes, type] : settings.allowedTypes.filter((item) => item !== type) })} />{type.toUpperCase()}</label>; })}</div><FieldDescription>Pilih minimal satu format.</FieldDescription></Field></div></section>
    <section><h2 className="text-lg font-extrabold">Informasi bisnis</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field><FieldLabel htmlFor="business-name">Nama bisnis</FieldLabel><Input id="business-name" className="h-11" maxLength={80} value={settings.businessName} onChange={(e) => setSettings({ ...settings, businessName: e.target.value })} required /></Field><Field><FieldLabel htmlFor="business-wa">WhatsApp bisnis</FieldLabel><Input id="business-wa" className="h-11" inputMode="tel" value={settings.businessWhatsapp} onChange={(e) => setSettings({ ...settings, businessWhatsapp: e.target.value })} placeholder="6281234567890" /><FieldDescription>Gunakan kode negara, tanpa tanda +.</FieldDescription></Field></div></section>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
    <div className="flex items-center gap-3"><Button type="submit" size="lg" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Save />}Simpan pengaturan</Button>{saved && <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><Check className="size-4" />Tersimpan</span>}</div>
  </form>;
}

function PaperToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) { return <label className="flex cursor-pointer items-center justify-between rounded-xl border bg-white p-4 font-semibold"><span>{label}<small className="mt-1 block font-normal text-muted-foreground">{checked ? 'Tersedia untuk pelanggan' : 'Tidak tersedia'}</small></span><Switch checked={checked} onCheckedChange={onChange} /></label>; }
function Money({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) { return <Field><FieldLabel>{label}</FieldLabel><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span><Input type="number" min={0} max={1000000} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 pl-10" required /></div></Field>; }
