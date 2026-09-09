'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { inMemoryPersistence, setPersistence, signInWithCustomToken, signOut } from 'firebase/auth';
import { ref as databaseRef, set as setDatabaseValue } from 'firebase/database';
import { CheckCircle2, FileText, FileUp, Files, Loader2, MessageCircle, Paperclip, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { firebaseAuth, firebaseDatabase } from '@/lib/firebase/client';
import { estimatePrice, formatRupiah, type PublicSettings } from '@/lib/settings';
import { WebMcpTools } from '@/components/webmcp-tools';

type Success = { code: string; estimatedTotal: number; fileCount: number; whatsappUrl: string };
type PreparedUpload = { contentType: string; firebaseToken: string; uploadName: string; uploadPath: string; uploadToken: string };

export function OrderForm({ settings }: { settings: PublicSettings }) {
  const formRef = useRef<HTMLFormElement>(null);
  const availablePapers = [settings.paperA4Enabled && 'A4', settings.paperF4Enabled && 'F4'].filter(Boolean) as string[];
  const [paper, setPaper] = useState(availablePapers[0] || '');
  const [color, setColor] = useState('bw');
  const [pages, setPages] = useState(1);
  const [copies, setCopies] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<Success | null>(null);
  const estimate = useMemo(() => paper ? estimatePrice(settings, paper, color, pages, copies) : 0, [settings, paper, color, pages, copies]);
  const totalUploadSize = useMemo(() => files.reduce((total, file) => total + file.size, 0), [files]);

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

  function addFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const additions = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = '';
    if (!additions.length) return;
    const maxBytes = settings.maxFileMb * 1024 * 1024;
    const allowed = new Set(settings.allowedTypes);
    const invalid = additions.find((file) => !allowed.has(fileExtension(file.name)) || !file.size || file.size > maxBytes);
    if (invalid) {
      setError(!allowed.has(fileExtension(invalid.name))
        ? `Format file ${invalid.name} tidak didukung.`
        : `File ${invalid.name} harus berukuran lebih dari 0 dan maksimal ${settings.maxFileMb} MB.`);
      return;
    }
    setError('');
    setFiles((current) => {
      const existing = new Set(current.map(fileIdentity));
      return [...current, ...additions.filter((file) => !existing.has(fileIdentity(file)))];
    });
  }

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setProgress('Menyiapkan lampiran…');
    const uploadTokens: string[] = [];
    try {
      if (!files.length) throw new Error('Pilih minimal satu file yang akan dicetak.');
      const form = new FormData(event.currentTarget);
      const website = formText(form, 'website');
      await setPersistence(firebaseAuth, inMemoryPersistence);

      for (const [index, file] of files.entries()) {
        setProgress(`Mengunggah ${index + 1} dari ${files.length}: ${file.name}`);
        const prepared = await prepareUpload(file, website);
        uploadTokens.push(prepared.uploadToken);
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
      }

      setProgress('Menyimpan pesanan…');
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
          website,
          uploadTokens,
        }),
      });
      const result = await response.json() as Success & { error?: string };
      if (!response.ok) throw new Error(result.error || 'Pesanan belum dapat dikirim.');
      setSuccess(result);
      resetForm();
      uploadTokens.length = 0;
    } catch (err) {
      if (uploadTokens.length) await cleanupUploads(uploadTokens);
      setError(err instanceof Error ? err.message : 'Pesanan belum dapat dikirim.');
    } finally {
      setProgress('');
      setBusy(false);
    }
  }

  function resetForm() {
    formRef.current?.reset();
    setPaper(availablePapers[0] || ''); setColor('bw'); setPages(1); setCopies(1); setFiles([]);
  }

  if (success) return (
    <Card className="border-0 bg-white py-0 shadow-[0_30px_90px_rgb(0_0_0/22%)] ring-0">
      <CardContent className="p-6 text-center sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 className="size-8" /></span>
        <p className="mt-5 text-sm font-bold uppercase tracking-[.14em] text-emerald-700">Pesanan berhasil dikirim</p>
        <h2 className="mt-2 break-all text-3xl font-black tracking-tight text-[var(--ink)]">{success.code}</h2>
        <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">Kami menerima <strong className="text-slate-950">{success.fileCount} lampiran</strong>. Simpan kode ini untuk referensi. Estimasi biaya Anda <strong className="text-slate-950">{formatRupiah(success.estimatedTotal)}</strong>.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button render={<a href={success.whatsappUrl} target="_blank" rel="noreferrer" />} size="lg" className="h-11 w-full sm:w-auto"><MessageCircle /> Hubungi penjual</Button>
          <Button variant="outline" size="lg" className="h-11 w-full sm:w-auto" onClick={() => setSuccess(null)}>Buat pesanan lain</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="border-0 bg-white py-0 text-slate-950 shadow-[0_30px_90px_rgb(0_0_0/22%)] ring-0">
      <WebMcpTools settings={settings} />
      <CardHeader className="border-b border-slate-100 p-5 sm:p-8">
        <CardTitle className="text-2xl font-black tracking-tight">Buat pesanan cetak</CardTitle>
        <CardDescription className="text-base">Kolom bertanda * wajib diisi.</CardDescription>
      </CardHeader>
      <CardContent className="p-5 sm:p-8">
        <form ref={formRef} onSubmit={submit}>
          <FieldGroup className="gap-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field><FieldLabel htmlFor="name">Nama lengkap *</FieldLabel><Input id="name" name="name" className="h-11" autoComplete="name" minLength={3} maxLength={80} required placeholder="Contoh: Siti Rahma" /></Field>
              <Field><FieldLabel htmlFor="whatsapp">Nomor WhatsApp *</FieldLabel><Input id="whatsapp" name="whatsapp" className="h-11" inputMode="tel" autoComplete="tel" required placeholder="Contoh: 081234567890" /><FieldDescription>Gunakan nomor aktif, 10–15 digit.</FieldDescription></Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field><FieldLabel htmlFor="paper">Jenis kertas *</FieldLabel><Select name="paper" value={paper} onValueChange={(value) => setPaper(value as string)} required disabled={!availablePapers.length}><SelectTrigger id="paper" className="h-11 w-full"><SelectValue placeholder="Pilih kertas" /></SelectTrigger><SelectContent>{availablePapers.map((size) => <SelectItem key={size} value={size}>{size} · {formatRupiah(size === 'A4' ? settings.priceA4 : settings.priceF4)}/lembar</SelectItem>)}</SelectContent></Select>{!availablePapers.length && <FieldDescription>Saat ini belum ada kertas yang tersedia.</FieldDescription>}</Field>
              <Field><FieldLabel>Warna cetak *</FieldLabel><RadioGroup name="color" value={color} onValueChange={setColor} className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2"><FieldLabel className="min-h-11 cursor-pointer border-slate-200 bg-slate-50"><RadioGroupItem value="bw" />Hitam putih</FieldLabel><FieldLabel className="min-h-11 cursor-pointer border-slate-200 bg-slate-50"><RadioGroupItem value="color" />Berwarna</FieldLabel></RadioGroup></Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field><FieldLabel htmlFor="pages">Jumlah halaman *</FieldLabel><Input id="pages" name="pages" className="h-11" type="number" min={1} max={10000} value={pages} onChange={(e) => setPages(Math.max(1, Number(e.target.value) || 1))} required /></Field>
              <Field><FieldLabel htmlFor="copies">Jumlah salinan *</FieldLabel><Input id="copies" name="copies" className="h-11" type="number" min={1} max={1000} value={copies} onChange={(e) => setCopies(Math.max(1, Number(e.target.value) || 1))} required /></Field>
            </div>
            <Field>
              <FieldLabel htmlFor="files">File yang akan dicetak *</FieldLabel>
              <label htmlFor="files" className={`group grid min-h-32 place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-[var(--brand)] hover:bg-cyan-50 ${busy ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}>
                <span><span className="mx-auto grid size-10 place-items-center rounded-xl bg-white text-[var(--brand)] shadow-sm"><FileUp className="size-5" /></span><span className="mt-2 block font-semibold">{files.length ? 'Tambah file lainnya' : 'Pilih satu atau beberapa file'}</span><span className="mt-1 block text-sm text-slate-500">{settings.allowedTypes.map((type) => type.toUpperCase()).join(', ')} · maks. {settings.maxFileMb} MB per file</span><span className="mt-1 block text-xs text-slate-400">Jumlah lampiran tidak dibatasi. Anda dapat memilih file lagi setelah menambahkan file pertama.</span></span>
              </label>
              <Input id="files" name="files" type="file" multiple className="sr-only" accept={settings.allowedTypes.map((type) => `.${type}`).join(',')} onChange={addFiles} disabled={busy} />
              {files.length > 0 && <div className="mt-3 overflow-hidden rounded-xl border bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 px-3 py-2.5"><p className="flex items-center gap-2 text-sm font-bold"><Files className="size-4 text-[var(--brand)]" />{files.length} lampiran · {formatBytes(totalUploadSize)}</p><button type="button" onClick={() => setFiles([])} disabled={busy} className="min-h-8 rounded-lg px-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">Hapus semua</button></div>
                <ul className="divide-y">{files.map((file, index) => <li key={fileIdentity(file)} className="flex min-w-0 items-center gap-3 px-3 py-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-cyan-50 text-[var(--brand)]"><FileText className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold" title={file.name}>{file.name}</span><span className="block text-xs text-muted-foreground">{formatBytes(file.size)}</span></span><Button type="button" variant="ghost" size="icon" className="size-10 shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={busy} aria-label={`Hapus ${file.name}`}><Trash2 /></Button></li>)}</ul>
              </div>}
              <FieldDescription><Paperclip className="mr-1 inline size-3.5" />Semua lampiran disimpan sebagai Base64 di Realtime Database dan hanya dapat diunduh admin.</FieldDescription>
            </Field>
            <Field><FieldLabel htmlFor="notes">Catatan tambahan</FieldLabel><Textarea id="notes" name="notes" maxLength={1000} rows={3} placeholder="Contoh: halaman 1 berwarna, sisanya hitam putih; jilid di sisi kiri." /></Field>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            {progress && <output className="flex items-center gap-2 rounded-xl bg-cyan-50 px-4 py-3 text-sm font-semibold text-[var(--brand)]"><Loader2 className="size-4 shrink-0 animate-spin" /><span className="min-w-0 break-words">{progress}</span></output>}
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
            <div className="flex flex-col gap-4 rounded-2xl bg-[var(--ink)] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm text-slate-300">Perkiraan total</p><p className="mt-1 text-2xl font-black">{formatRupiah(estimate)}</p><p className="mt-1 text-xs text-slate-400">Harga akhir dikonfirmasi penjual.</p></div>
              <Button type="submit" size="lg" disabled={busy || !availablePapers.length || !files.length} className="h-12 w-full bg-[var(--cyan)] px-5 font-bold text-[var(--ink)] hover:bg-cyan-200 sm:w-auto">{busy ? <Loader2 className="animate-spin" /> : <Send />}{busy ? 'Mengunggah…' : 'Kirim pesanan'}</Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

async function prepareUpload(file: File, website: string): Promise<PreparedUpload> {
  const response = await fetch('/api/uploads/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size, website }),
  });
  const prepared = await response.json() as Partial<PreparedUpload> & { error?: string };
  if (!response.ok || !prepared.firebaseToken || !prepared.uploadName || !prepared.uploadPath || !prepared.uploadToken || !prepared.contentType) {
    throw new Error(prepared.error || `Upload ${file.name} belum dapat disiapkan.`);
  }
  return prepared as PreparedUpload;
}

async function cleanupUploads(uploadTokens: string[]) {
  await fetch('/api/uploads/cleanup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadTokens }),
  }).catch(() => undefined);
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

function fileExtension(name: string) { return name.split('.').pop()?.toLowerCase() || ''; }
function fileIdentity(file: File) { return `${file.name}:${file.size}:${file.lastModified}`; }
function formatBytes(value: number) { if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`; return `${(value / 1024 / 1024).toFixed(1)} MB`; }
