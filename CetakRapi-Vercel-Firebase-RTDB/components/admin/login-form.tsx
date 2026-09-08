'use client';

import { useState } from 'react';
import { inMemoryPersistence, setPersistence, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Loader2, LockKeyhole, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { firebaseAuth } from '@/lib/firebase/client';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      await setPersistence(firebaseAuth, inMemoryPersistence);
      const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      const idToken = await credential.user.getIdToken();
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const result = await response.json() as { error?: string };
      await signOut(firebaseAuth);
      if (!response.ok) throw new Error(result.error || 'Login gagal.');
      window.location.assign('/admin');
    } catch {
      await signOut(firebaseAuth).catch(() => undefined);
      setError('Email atau password salah, atau akun tidak memiliki akses admin.');
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="mt-2 space-y-4">
    <div className="relative"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 pl-10" type="email" autoComplete="username" placeholder="Email admin Firebase" required /></div>
    <div className="relative"><LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 pl-10" type="password" autoComplete="current-password" placeholder="Password admin" required /></div>
    {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
    <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}Masuk</Button>
  </form>;
}
