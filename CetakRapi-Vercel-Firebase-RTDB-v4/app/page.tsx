import { Clock3, Files, LockKeyhole, MessageCircle, PhoneCall, Printer } from 'lucide-react';
import { OrderForm } from '@/components/order-form';
import { formatWhatsapp } from '@/lib/settings';
import { getPublicSettings } from '@/lib/settings.server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const settings = await getPublicSettings();
  const whatsappHref = `https://wa.me/${settings.businessWhatsapp}?text=${encodeURIComponent('Halo, saya ingin bertanya tentang layanan cetak.')}`;
  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="border-b border-white/10 bg-[var(--ink)] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <a href="#pesan" className="flex min-w-0 items-center gap-3" aria-label={`${settings.businessName}, ke formulir pemesanan`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--cyan)] text-[var(--ink)] shadow-[0_8px_24px_rgb(0_216_255/20%)]"><Printer className="size-5" aria-hidden="true" /></span>
            <span className="min-w-0"><span className="block truncate text-lg font-extrabold tracking-tight">{settings.businessName}</span><span className="hidden text-xs text-slate-300 min-[390px]:block">Kirim file. Kami yang rapikan.</span></span>
          </a>
          <nav className="flex shrink-0 items-center gap-1 text-sm" aria-label="Navigasi utama">
            <a className="hidden rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10 hover:text-white sm:block" href="#layanan">Layanan</a>
            <a className="hidden rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10 hover:text-white sm:block" href="#kontak">Kontak</a>
            <a className="rounded-lg border border-white/15 px-3 py-2 font-semibold hover:bg-white/10" href="/admin">Admin</a>
          </nav>
        </div>
      </header>
      <section className="relative overflow-hidden bg-[var(--ink)] text-white">
        <div className="paper-grid absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-9 px-4 py-10 sm:px-8 sm:py-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:py-16">
          <div className="pt-1 lg:sticky lg:top-6 lg:pt-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1.5 text-sm font-semibold text-cyan-100"><Clock3 className="size-4" /> Pesan cetak tanpa antre</span>
            <h1 className="mt-6 max-w-xl text-balance text-4xl font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl">Banyak file, satu pesanan.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">Unggah tugas atau dokumen sebanyak yang dibutuhkan, pilih kebutuhan cetak, lalu simpan kode pesanan Anda. Estimasi biaya dihitung langsung.</p>
            <div className="mt-7 grid max-w-lg gap-3 min-[480px]:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <MiniFeature icon={<Files />} text="Banyak lampiran" />
              <MiniFeature icon={<LockKeyhole />} text="File tersimpan privat" />
              <MiniFeature icon={<MessageCircle />} text="Konfirmasi WhatsApp" />
            </div>
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-white/[0.12]"><PhoneCall className="size-4" /> {formatWhatsapp(settings.businessWhatsapp)}</a>
          </div>
          <div id="pesan" className="scroll-mt-5"><OrderForm settings={settings} /></div>
        </div>
      </section>
      <section id="layanan" className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-8 sm:py-12 md:grid-cols-3">
        <InfoCard number="01" title="Isi detail" text="Masukkan nama, WhatsApp, jenis kertas, warna, halaman, dan jumlah salinan." />
        <InfoCard number="02" title="Unggah semua file" text={`Pilih banyak lampiran sekaligus atau tambahkan satu per satu. Maksimal ${settings.maxFileMb} MB untuk setiap file.`} />
        <InfoCard number="03" title="Pantau lewat WA" text="Simpan kode pesanan. Penjual akan menghubungi Anda bila ada detail yang perlu dikonfirmasi." />
      </section>
      <section id="kontak" className="px-4 pb-10 sm:px-8 sm:pb-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 overflow-hidden rounded-3xl bg-[var(--brand)] p-6 text-white shadow-[0_22px_60px_rgb(7_95_141/18%)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div><p className="text-sm font-bold uppercase tracking-[.14em] text-cyan-100">Kontak kami</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Ada detail cetak yang ingin ditanyakan?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-50/85 sm:text-base">Hubungi {settings.businessName} melalui WhatsApp. Kami siap membantu memastikan file dan spesifikasi cetak Anda sudah benar.</p></div>
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-3 rounded-xl bg-white px-5 py-3 font-bold text-[var(--brand)] transition hover:bg-cyan-50 sm:w-auto"><MessageCircle className="size-5" /><span><span className="block text-xs font-semibold text-slate-500">WhatsApp</span><span className="block">{formatWhatsapp(settings.businessWhatsapp)}</span></span></a>
        </div>
      </section>
      <footer className="border-t bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-7 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p><strong className="text-foreground">{settings.businessName}</strong> · Layanan cetak tugas dan dokumen</p>
          <a className="font-semibold text-[var(--brand)] hover:underline" href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp {formatWhatsapp(settings.businessWhatsapp)}</a>
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
