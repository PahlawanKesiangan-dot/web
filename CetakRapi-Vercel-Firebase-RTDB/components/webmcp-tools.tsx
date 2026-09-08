'use client';

import { useEffect } from 'react';
import { estimatePrice, type PublicSettings } from '@/lib/settings';

type ModelContext = { registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void> };

export function WebMcpTools({ settings }: { settings: PublicSettings }) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Record<string, unknown>) => Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined);
    void register({
      name: 'get_printing_options', title: 'Lihat pilihan cetak',
      description: 'Lihat kertas yang tersedia, format file, batas upload, dan harga layanan CetakRapi.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({
        papers: [settings.paperA4Enabled && { size: 'A4', pricePerSheet: settings.priceA4 }, settings.paperF4Enabled && { size: 'F4', pricePerSheet: settings.priceF4 }].filter(Boolean),
        colors: [{ value: 'bw', surchargePerSheet: settings.priceBw }, { value: 'color', surchargePerSheet: settings.priceColor }],
        allowedFileTypes: settings.allowedTypes, maxFileMb: settings.maxFileMb,
      }),
    });
    void register({
      name: 'stage_print_order', title: 'Siapkan pesanan cetak',
      description: 'Isi detail pesanan pada formulir pelanggan. Pengguna tetap harus memilih file lalu menekan Kirim pesanan.',
      inputSchema: { type: 'object', properties: {
        name: { type: 'string', minLength: 3, maxLength: 80 }, whatsapp: { type: 'string', minLength: 10, maxLength: 20 },
        paper: { type: 'string', enum: ['A4', 'F4'] }, color: { type: 'string', enum: ['bw', 'color'] },
        pages: { type: 'integer', minimum: 1, maximum: 10000 }, copies: { type: 'integer', minimum: 1, maximum: 1000 },
        notes: { type: 'string', maxLength: 1000 },
      }, required: ['name', 'whatsapp', 'paper', 'color', 'pages', 'copies'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input: unknown) => {
        const value = validate(input, settings);
        document.dispatchEvent(new CustomEvent('cetakrapi:stage-order', { detail: value }));
        document.querySelector<HTMLElement>('#file')?.focus();
        return { staged: true, requiresFile: true, estimatedTotal: estimatePrice(settings, value.paper, value.color, value.pages, value.copies) };
      },
    });
    return () => lifecycle.abort();
  }, [settings]);
  return null;
}

function validate(input: unknown, settings: PublicSettings) {
  if (!input || typeof input !== 'object') throw new Error('Detail pesanan tidak valid.');
  const value = input as Record<string, unknown>;
  const name = typeof value.name === 'string' ? value.name.trim() : ''; const whatsapp = typeof value.whatsapp === 'string' ? value.whatsapp.trim() : '';
  const paper = typeof value.paper === 'string' ? value.paper : ''; const color = typeof value.color === 'string' ? value.color : '';
  const pages = Number(value.pages); const copies = Number(value.copies); const notes = typeof value.notes === 'string' ? value.notes : '';
  if (name.length < 3 || name.length > 80 || !/^\+?[\d\s-]{10,20}$/.test(whatsapp)) throw new Error('Nama atau nomor WhatsApp tidak valid.');
  if (!['A4', 'F4'].includes(paper) || (paper === 'A4' && !settings.paperA4Enabled) || (paper === 'F4' && !settings.paperF4Enabled)) throw new Error('Kertas tersebut tidak tersedia.');
  if (!['bw', 'color'].includes(color) || !Number.isInteger(pages) || pages < 1 || pages > 10000 || !Number.isInteger(copies) || copies < 1 || copies > 1000 || notes.length > 1000) throw new Error('Spesifikasi cetak tidak valid.');
  return { name, whatsapp, paper, color, pages, copies, notes };
}
