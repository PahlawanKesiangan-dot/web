import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ArrowLeft, CalendarClock, Copy, Download, FileText, MessageCircle, Palette, Printer } from 'lucide-react';
import { StatusSelect } from '@/components/admin/status-select';
import { Button } from '@/components/ui/button';
import { getAdminUser } from '@/lib/admin-auth';
import { getOrder } from '@/lib/orders';
import { formatRupiah } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Detail pesanan' };

export default async function OrderDetailPage({ params }: { params: Promise<{ code: string }> }) {
  if (!await getAdminUser()) redirect('/admin');
  const code = (await params).code;
  const order = await getOrder(code);
  if (!order) return <main className="grid min-h-screen place-items-center bg-slate-100 px-5"><div className="text-center"><h1 className="text-2xl font-black">Pesanan tidak ditemukan</h1><Button render={<a href="/admin" />} variant="outline" className="mt-5"><ArrowLeft /> Kembali</Button></div></main>;
  return <main className="min-h-screen bg-slate-100 text-slate-950">
    <header className="border-b bg-[var(--ink)] text-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8"><a href="/admin" className="flex items-center gap-2 font-semibold"><ArrowLeft className="size-4" /> Semua pesanan</a><span className="flex items-center gap-2 text-sm text-slate-300"><Printer className="size-4" /> CetakRapi Admin</span></div></header>
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-sm font-black text-[var(--brand)]">{order.code}</p><h1 className="mt-1 text-3xl font-black tracking-tight">{order.customer_name}</h1><p className="mt-1 text-sm text-muted-foreground">Diterima {formatDate(order.created_at)}</p></div><div className="w-full sm:w-64"><label className="mb-2 block text-sm font-semibold">Status pesanan</label><StatusSelect code={order.code} value={order.status} /></div></div>
      <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-lg font-extrabold">Detail cetak</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Detail icon={<FileText />} label="Jenis kertas" value={order.paper_size} /><Detail icon={<Palette />} label="Warna" value={order.color_mode === 'color' ? 'Berwarna' : 'Hitam putih'} /><Detail icon={<Copy />} label="Jumlah" value={`${order.page_count} halaman × ${order.copy_count} salinan`} /><Detail icon={<CalendarClock />} label="Total lembar" value={`${order.total_pages} lembar`} /></div><div className="mt-6 rounded-xl bg-cyan-50 p-4"><p className="text-sm text-slate-600">Perkiraan total</p><p className="mt-1 text-2xl font-black text-[var(--brand)]">{formatRupiah(order.estimated_total)}</p></div></section>
          <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-lg font-extrabold">Catatan pelanggan</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{order.notes || 'Tidak ada catatan tambahan.'}</p></section>
        </div>
        <aside className="space-y-5">
          <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-lg font-extrabold">File pelanggan</h2><div className="mt-4 rounded-xl border bg-slate-50 p-4"><FileText className="size-7 text-[var(--brand)]" /><p className="mt-3 break-all font-semibold">{order.file_name}</p><p className="mt-1 text-xs text-muted-foreground">{order.file_type} · {formatBytes(order.file_size)}</p></div><Button render={<a href={`/api/admin/orders/${order.code}/file`} />} size="lg" className="mt-4 w-full"><Download /> Unduh file</Button></section>
          <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-lg font-extrabold">Kontak pelanggan</h2><p className="mt-2 text-sm text-muted-foreground">WhatsApp</p><p className="font-semibold">+{order.whatsapp}</p><Button render={<a href={`https://wa.me/${order.whatsapp}?text=${encodeURIComponent(`Halo ${order.customer_name}, kami menghubungi terkait pesanan ${order.code}.`)}`} target="_blank" rel="noreferrer" />} variant="outline" size="lg" className="mt-4 w-full"><MessageCircle /> Hubungi pelanggan</Button></section>
        </aside>
      </div>
    </div>
  </main>;
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-[var(--brand)] [&_svg]:size-5">{icon}</span><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-0.5 font-semibold">{value}</p></div></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(value.endsWith('Z') ? value : `${value}Z`)); }
function formatBytes(value: number) { if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`; return `${(value / 1024 / 1024).toFixed(1)} MB`; }
