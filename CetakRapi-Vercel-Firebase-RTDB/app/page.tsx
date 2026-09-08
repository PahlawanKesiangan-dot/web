import { Clock3, FileCheck2, LockKeyhole, MessageCircle, Printer } from 'lucide-react';
import { OrderForm } from '@/components/order-form';
import { getPublicSettings } from '@/lib/settings.server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const settings = await getPublicSettings();
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 bg-[var(--ink)] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="#pesan" className="flex items-center gap-3" aria-label="CetakRapi, ke formulir pemesanan">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--cyan)] text-[var(--ink)] shadow-[0_8px_24px_rgb(0_216_255/20%)]"><Printer className="size-5" aria-hidden="true" /></span>
            <span><span className="block text-lg font-extrabold tracking-tight">{settings.businessName}</span><span className="block text-xs text-slate-300">Kirim file. Kami yang rapikan.</span></span>
          </a>
          <nav className="flex items-center gap-1 text-sm" aria-label="Navigasi utama">
            <a className="hidden rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10 hover:text-white sm:block" href="#layanan">Layanan</a>
            <a className="hidden rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10 hover:text-white sm:block" href="#kontak">Kontak</a>
            <a className="rounded-lg border border-white/15 px-3 py-2 font-semibold hover:bg-white/10" href="/admin">Admin</a>
          </nav>
        </div>
      </header>
      <section className="relative overflow-hidden bg-[var(--ink)] text-white">
        <div className="paper-grid absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:py-16">
          <div className="pt-3 lg:sticky lg:top-6 lg:pt-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1.5 text-sm font-semibold text-cyan-100"><Clock3 className="size-4" /> Pesan cetak tanpa antre</span>
            <h1 className="mt-6 max-w-xl text-balance text-4xl font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl">File siap. Cetak jadi lebih mudah.</h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-300">Unggah tugas atau dokumen, pilih kebutuhan cetak, lalu simpan kode pesanan Anda. Estimasi biaya dihitung langsung.</p>
            <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <MiniFeature icon={<FileCheck2 />} text="PDF, DOCX, XLSX, JPG, PNG" />
              <MiniFeature icon={<LockKeyhole />} text="File tersimpan privat" />
              <MiniFeature icon={<MessageCircle />} text="Konfirmasi WhatsApp" />
            </div>
          </div>
          <div id="pesan" className="scroll-mt-5"><OrderForm settings={settings} /></div>
        </div>
      </section>
      <section id="layanan" className="mx-auto grid max-w-7xl gap-5 px-5 py-12 sm:px-8 md:grid-cols-3">
        <InfoCard number="01" title="Isi detail" text="Masukkan nama, WhatsApp, jenis kertas, warna, halaman, dan jumlah salinan." />
        <InfoCard number="02" title="Unggah file" text={`Pilih file yang didukung dengan ukuran maksimal ${settings.maxFileMb} MB.`} />
        <InfoCard number="03" title="Pantau lewat WA" text="Simpan kode pesanan. Penjual akan menghubungi Anda bila ada detail yang perlu dikonfirmasi." />
      </section>
      <footer id="kontak" className="border-t bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p><strong className="text-foreground">{settings.businessName}</strong> · Layanan cetak tugas dan dokumen</p>
          {settings.businessWhatsapp ? <a className="font-semibold text-[var(--brand)] hover:underline" href={`https://wa.me/${settings.businessWhatsapp}`} target="_blank" rel="noreferrer">Hubungi via WhatsApp</a> : <p>Kontak WhatsApp segera tersedia</p>}
        </div>
      </footer>
    </main>
  );
}

function MiniFeature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-sm text-slate-200 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-[var(--cyan)]">{icon}<span>{text}</span></div>;
}

function InfoCard({ number, title, text }: { number: string; title: string; text: string }) {
  return <article className="rounded-2xl border bg-card p-6 shadow-[0_14px_40px_rgb(15_23_42/5%)]"><span className="font-mono text-sm font-black text-[var(--brand)]">{number}</span><h2 className="mt-3 text-xl font-extrabold tracking-tight">{title}</h2><p className="mt-2 leading-6 text-muted-foreground">{text}</p></article>;
}
