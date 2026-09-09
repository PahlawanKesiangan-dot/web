import type { Metadata } from 'next';
import { LockKeyhole, Printer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminDashboard } from '@/components/admin/dashboard';
import { LoginForm } from '@/components/admin/login-form';
import { getAdminUser } from '@/lib/admin-auth';
import { listOrders } from '@/lib/orders';
import { getPublicSettings } from '@/lib/settings.server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin' };

export default async function AdminPage() {
  const admin = await getAdminUser();
  if (!admin) return <Gate title="Masuk ke halaman admin" description="Gunakan akun email/password yang dibuat di Firebase Authentication."><LoginForm /></Gate>;

  const [orders, settings] = await Promise.all([listOrders(), getPublicSettings()]);
  return <AdminDashboard orders={orders} settings={settings} adminName={admin.displayName} />;
}

function Gate({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--ink)] px-5"><div className="paper-grid absolute inset-0 opacity-40" /><Card className="relative w-full max-w-md border-0 bg-white py-0 shadow-2xl ring-0"><CardHeader className="items-center border-b p-7 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-cyan-100 text-[var(--brand)]"><LockKeyhole className="size-7" /></span><CardTitle className="mt-3 text-2xl font-black">{title}</CardTitle><CardDescription className="text-base">{description}</CardDescription></CardHeader><CardContent className="p-7">{children}<p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500"><Printer className="size-3.5" /> CetakRapi · Area penjual</p></CardContent></Card></main>;
}
