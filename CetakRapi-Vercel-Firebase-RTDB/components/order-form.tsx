'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { inMemoryPersistence, setPersistence, signInWithCustomToken, signOut } from 'firebase/auth';
import { ref as databaseRef, set as setDatabaseValue } from 'firebase/database';
import { CheckCircle2, FileUp, Loader2, MessageCircle, Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { estimatePrice, formatRupiah, type PublicSettings } from '@/lib/settings';
import { firebaseAuth, firebaseDatabase } from '@/lib/firebase/client';
import { WebMcpTools } from '@/components/webmcp-tools';

type Success = { code: string; estimatedTotal: number; whatsappUrl: string | null };

export function OrderForm({ settings }: { settings: PublicSettings }) {
  const formRef = useRef<HTMLFormElement>(null);
  const availablePapers = [settings.paperA4Enabled && 'A4', settings.paperF4Enabled && 'F4'].filter(Boolean) as string[];
  const [paper, setPaper] = useState(availablePapers[0] || '');
  const [color, setColor] = useState('bw');
  const [pages, setPages] = useState(1);
  const [copies, setCopies] = useState(1);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<Success | null>(null);
  const estimate = useMemo(() => paper ? estimatePrice(settings, paper, color, pages, copies) : 0, [settings, paper, color, pages, copies]);

  useEffect(() => {
    function stage(event: Event) {
      const detail = (event as CustomEvent<{ name: string; whatsapp: string; paper: string; color: string; pages: number; copies: number; notes: string }>).detail;
      const form = formRef.current;
      if (!form) return;
      (form.elements.namedItem('name') as HTMLInputElement).value = detail.name;
      (form.elements.namedItem('whatsapp') as HTMLInputElement).value = detail.whatsapp;
      (form.elements.namedItem('notes') as HTMLTextAreaElement).value = detail.notes;
      setPaper(detail.paper); setColor(detail.color); setPages(detail.pages); setCopies(detail.copies);
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    document.addEventListener('cetakrapi:stage-order', stage);
    return () => document.removeEventListener('cetakrapi:stage-order', stage);
  }, []);

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const form = new FormData(event.currentTarget);
      const file = form.get('file');
      if (!(file instanceof File) || !file.size) throw new Error('Pilih file yang akan dicetak.');

      const prepareResponse = await fetch('/api/uploads/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          website: formText(form, 'website'),
        }),
      });
      const prepared = await prepareResponse.json() as { contentType?: string; error?: string; firebaseToken?: string; uploadName?: string; uploadPath?: string; uploadToken?: string };
      if (!prepareResponse.ok || !prepared.firebaseToken || !prepared.uploadName || !prepared.uploadPath || !prepared.uploadToken || !prepared.contentType) {
        throw new Error(prepared.error || 'Upload belum dapat disiapkan.');
      }

      await setPersistence(firebaseAuth, inMemoryPersistence);
      await signInWithCustomToken(firebaseAuth, prepared.firebaseToken);
      try {
        await setDatabaseValue(databaseRef(firebaseDatabase, prepared.uploadPath), {
          data: arrayBufferToBase64(await file.arrayBuffer()),
          mime: prepared.contentType,
          name: prepared.uploadName,
          size: file.size,
        });
      } finally {
        await signOut(firebaseAuth).catch(() => undefined);
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formText(form, 'name'),
          whatsapp: formText(form, 'whatsapp'),
          paper,
          color,
          pages,
          copies,
          notes: formText(form, 'notes'),
          website: formText(form, 'website'),
          uploadToken: prepared.uploadToken,
        }),
      });
      const result = await response.json() as Success & { error?: string };
      if (!response.ok) throw new Error(result.error || 'Pesanan belum dapat dikirim.');
      setSuccess(result); formRef.current?.reset();
    } catch (err) { setError(err instanceof Error ? err.message : 'Pesanan belum dapat dikirim.'); }
    finally { setBusy(false); }
  }

  if (success) return (
    <Card className="border-0 bg-white py-0 shadow-[0_30px_90px_rgb(0_0_0/22%)] ring-0">
      <CardContent className="p-7 text-center sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 className="size-8" /></span>
        <p className="mt-5 text-sm font-bold uppercase tracking-[.14em] text-emerald-700">Pesanan berhasil dikirim</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--ink)]">{success.code}</h2>
        <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">Simpan kode ini untuk referensi. Estimasi biaya Anda <strong className="text-slate-950">{formatRupiah(success.estimatedTotal)}</strong>.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {success.whatsappUrl && <Button render={<a href={success.whatsappUrl} target="_blank" rel="noreferrer" />} size="lg"><MessageCircle /> Hubungi penjual</Button>}
          <Button variant="outline" size="lg" onClick={() => { setSuccess(null); setFileName(''); }}>Buat pesanan lain</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="border-0 bg-white py-0 text-slate-950 shadow-[0_30px_90px_rgb(0_0_0/22%)] ring-0">
      <WebMcpTools settings={settings} />
      <CardHeader className="border-b border-slate-100 p-6 sm:p-8">
        <CardTitle className="text-2xl font-black tracking-tight">Buat pesanan cetak</CardTitle>
        <CardDescription className="text-base">Kolom bertanda * wajib diisi.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        <form ref={formRef} onSubmit={submit}>
          <FieldGroup className="gap-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field><FieldLabel htmlFor="name">Nama lengkap *</FieldLabel><Input id="name" name="name" autoComplete="name" minLength={3} maxLength={80} required placeholder="Contoh: Siti Rahma" /></Field>
              <Field><FieldLabel htmlFor="whatsapp">Nomor WhatsApp *</FieldLabel><Input id="whatsapp" name="whatsapp" inputMode="tel" autoComplete="tel" required placeholder="Contoh: 081234567890" /><FieldDescription>Gunakan nomor aktif, 10–15 digit.</FieldDescription></Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field><FieldLabel htmlFor="paper">Jenis kertas *</FieldLabel><Select name="paper" value={paper} onValueChange={(value) => setPaper(value as string)} required disabled={!availablePapers.length}><SelectTrigger id="paper" className="h-11 w-full"><SelectValue placeholder="Pilih kertas" /></SelectTrigger><SelectContent>{availablePapers.map((size) => <SelectItem key={size} value={size}>{size} · {formatRupiah(size === 'A4' ? settings.priceA4 : settings.priceF4)}/lembar</SelectItem>)}</SelectContent></Select>{!availablePapers.length && <FieldDescription>Saat ini belum ada kertas yang tersedia.</FieldDescription>}</Field>
              <Field><FieldLabel>Warna cetak *</FieldLabel><RadioGroup name="color" value={color} onValueChange={setColor} className="grid grid-cols-2 gap-2"><FieldLabel className="cursor-pointer border-slate-200 bg-slate-50"><RadioGroupItem value="bw" />Hitam putih</FieldLabel><FieldLabel className="cursor-pointer border-slate-200 bg-slate-50"><RadioGroupItem value="color" />Berwarna</FieldLabel></RadioGroup></Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field><FieldLabel htmlFor="pages">Jumlah halaman *</FieldLabel><Input id="pages" name="pages" type="number" min={1} max={10000} value={pages} onChange={(e) => setPages(Math.max(1, Number(e.target.value) || 1))} required /></Field>
              <Field><FieldLabel htmlFor="copies">Jumlah salinan *</FieldLabel><Input id="copies" name="copies" type="number" min={1} max={1000} value={copies} onChange={(e) => setCopies(Math.max(1, Number(e.target.value) || 1))} required /></Field>
            </div>
            <Field><FieldLabel htmlFor="file">File yang akan dicetak *</FieldLabel><label htmlFor="file" className="group grid min-h-28 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-[var(--brand)] hover:bg-cyan-50"><span><span className="mx-auto grid size-10 place-items-center rounded-xl bg-white text-[var(--brand)] shadow-sm"><FileUp className="size-5" /></span><span className="mt-2 block font-semibold">{fileName || 'Pilih file dari perangkat'}</span><span className="mt-1 block text-sm text-slate-500">{settings.allowedTypes.map((type) => type.toUpperCase()).join(', ')} · maks. {settings.maxFileMb} MB</span><span className="mt-1 block text-xs text-slate-400">Semua lampiran disimpan sebagai Base64 di Realtime Database.</span></span></label><Input id="file" name="file" type="file" className="sr-only" accept={settings.allowedTypes.map((type) => `.${type}`).join(',')} onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} required /></Field>
            <Field><FieldLabel htmlFor="notes">Catatan tambahan</FieldLabel><Textarea id="notes" name="notes" maxLength={1000} rows={3} placeholder="Contoh: halaman 1 berwarna, sisanya hitam putih; jilid di sisi kiri." /></Field>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
            <div className="flex flex-col gap-4 rounded-2xl bg-[var(--ink)] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm text-slate-300">Perkiraan total</p><p className="mt-1 text-2xl font-black">{formatRupiah(estimate)}</p><p className="mt-1 text-xs text-slate-400">Harga akhir dikonfirmasi penjual.</p></div>
              <Button type="submit" size="lg" disabled={busy || !availablePapers.length} className="h-12 bg-[var(--cyan)] px-5 font-bold text-[var(--ink)] hover:bg-cyan-200">{busy ? <Loader2 className="animate-spin" /> : <Send />}{busy ? 'Mengirim…' : 'Kirim pesanan'}</Button>
            </div>
            <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><Paperclip className="mt-0.5 size-3.5 shrink-0" />File Anda tidak dipublikasikan dan hanya dapat diunduh admin yang berwenang.</p>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function formText(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}
