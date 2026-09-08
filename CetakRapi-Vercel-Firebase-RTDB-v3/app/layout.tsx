import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { FirebaseAnalytics } from '@/components/firebase-analytics';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'CetakRapi — Pesan Cetak Online', template: '%s · CetakRapi' },
  description: 'Kirim tugas dan dokumen untuk dicetak secara cepat, aman, dan mudah.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}><FirebaseAnalytics />{children}</body></html>;
}
