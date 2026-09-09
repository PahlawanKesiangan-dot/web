'use client';

import { useMemo, useState } from 'react';
import { Clock3, FileText, Inbox, LogOut, Search, Settings2, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatRupiah, type PublicSettings } from '@/lib/settings';
import { getOrderFiles, orderStatuses, statusLabels, type OrderRecord, type OrderStatus } from '@/lib/order-types';
import { SettingsForm } from './settings-form';
import { StatusSelect } from './status-select';

export function AdminDashboard({ orders: initial, settings, adminName }: { orders: OrderRecord[]; settings: PublicSettings; adminName: string }) {
  const [orders, setOrders] = useState(initial); const [query, setQuery] = useState(''); const [filter, setFilter] = useState('all');
  const visible = useMemo(() => orders.filter((order) => (filter === 'all' || order.status === filter) && `${order.code} ${order.customer_name} ${order.whatsapp}`.toLowerCase().includes(query.toLowerCase())), [orders, query, filter]);
  const active = orders.filter((order) => ['new', 'processing'].includes(order.status)).length;
  const ready = orders.filter((order) => order.status === 'ready').length;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = orders.filter((order) => order.created_at.slice(0, 10) === today).length;
  function statusChanged(code: string, status: OrderStatus) { setOrders((items) => items.map((item) => item.code === code ? { ...item, status } : item)); }

  return <main className="min-h-screen bg-slate-100 text-slate-950">
    <header className="border-b bg-[var(--ink)] text-white"><div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-4 sm:px-8"><a href="/admin" className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--cyan)] text-[var(--ink)]"><ShoppingBag className="size-5" /></span><span className="min-w-0"><strong className="block truncate">CetakRapi Admin</strong><small className="block max-w-44 truncate text-slate-300">{adminName}</small></span></a><div className="flex shrink-0 items-center gap-2"><Button render={<a href="/" />} variant="ghost" className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex">Website pelanggan</Button><Button render={<a href="/api/admin/logout" />} variant="outline" size="icon" className="size-10 border-white/20 bg-transparent text-white hover:bg-white/10" aria-label="Keluar"><LogOut /></Button></div></div></header>
    <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-8">
      <div className="mb-7"><h1 className="text-3xl font-black tracking-tight">Kelola pesanan</h1><p className="mt-1 text-muted-foreground">Pesanan terbaru, progres cetak, dan pengaturan layanan.</p></div>
      <div className="mb-7 grid gap-4 sm:grid-cols-3"><Stat icon={<Inbox />} label="Perlu ditangani" value={active} tone="blue" /><Stat icon={<Clock3 />} label="Siap diambil/dikirim" value={ready} tone="amber" /><Stat icon={<FileText />} label="Pesanan hari ini" value={todayCount} tone="green" /></div>
      <Tabs defaultValue="orders">
        <TabsList className="mb-5 grid w-full grid-cols-2 sm:inline-flex sm:w-auto"><TabsTrigger value="orders"><ShoppingBag /> Pesanan</TabsTrigger><TabsTrigger value="settings"><Settings2 /> Pengaturan</TabsTrigger></TabsList>
        <TabsContent value="orders">
          <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 pl-10" placeholder="Cari kode, nama, atau WhatsApp…" /></div><Select value={filter} onValueChange={(value) => setFilter(value || 'all')}><SelectTrigger className="h-10 w-full bg-white sm:w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua status</SelectItem>{orderStatuses.map((status) => <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>)}</SelectContent></Select></div>
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Pesanan</TableHead><TableHead>Pelanggan</TableHead><TableHead>Spesifikasi</TableHead><TableHead>Total</TableHead><TableHead className="min-w-48">Status</TableHead><TableHead><span className="sr-only">Aksi</span></TableHead></TableRow></TableHeader><TableBody>{visible.map((order) => <TableRow key={order.id}><TableCell><strong className="font-mono text-[var(--brand)]">{order.code}</strong><span className="mt-1 block text-xs text-muted-foreground">{formatDate(order.created_at)}</span></TableCell><TableCell><strong>{order.customer_name}</strong><a className="mt-1 block text-xs text-[var(--brand)] hover:underline" href={`https://wa.me/${order.whatsapp}`} target="_blank" rel="noreferrer">+{order.whatsapp}</a></TableCell><TableCell><div className="flex items-center gap-2"><Badge variant="secondary">{order.paper_size}</Badge><span className="text-sm">{order.color_mode === 'color' ? 'Berwarna' : 'Hitam putih'}</span></div><span className="mt-1 block text-xs text-muted-foreground">{order.page_count} hlm × {order.copy_count} salinan · {getOrderFiles(order).length} file</span></TableCell><TableCell className="font-semibold">{formatRupiah(order.estimated_total)}</TableCell><TableCell><StatusSelect code={order.code} value={order.status} onChange={(status) => statusChanged(order.code, status)} /></TableCell><TableCell><Button render={<a href={`/admin/orders/${order.code}`} />} variant="outline">Detail</Button></TableCell></TableRow>)}{!visible.length && <TableRow><TableCell colSpan={6} className="h-40 text-center"><Inbox className="mx-auto mb-2 size-7 text-slate-300" /><p className="font-semibold">Belum ada pesanan yang cocok</p><p className="mt-1 text-sm text-muted-foreground">Pesanan baru akan muncul di sini.</p></TableCell></TableRow>}</TableBody></Table></div>
          </section>
        </TabsContent>
        <TabsContent value="settings"><section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-8"><SettingsForm initial={settings} /></section></TabsContent>
      </Tabs>
    </div>
  </main>;
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'blue' | 'amber' | 'green' }) { const styles = { blue: 'bg-sky-100 text-sky-700', amber: 'bg-amber-100 text-amber-700', green: 'bg-emerald-100 text-emerald-700' }; return <div className="flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm"><span className={`grid size-11 place-items-center rounded-xl ${styles[tone]} [&_svg]:size-5`}>{icon}</span><div><p className="text-2xl font-black">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(value.endsWith('Z') ? value : `${value}Z`)); }
