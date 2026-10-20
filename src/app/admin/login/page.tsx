'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Fingerprint, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AuthShell, DemoPersonas } from '@/components/auth/AuthShell';
import { Alert, Spinner } from '@/components/ui/primitives';
import { isDemoMode } from '@/lib/config';
import { isValidEmail } from '@/lib/utils';

export default function AdminLoginPage() {
  const { signInAdmin, quickDemoLogin, user, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.role === 'admin') router.replace('/admin');
  }, [isLoading, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) return setError('Enter your work email.');
    setBusy(true);
    const res = await signInAdmin(email, password, totp);
    setBusy(false);
    if (res.error) setError(res.error);
  };

  return (
    <AuthShell
      tag="Staff terminal"
      accent="indigo"
      title="Admin sign in"
      subtitle="Authorised QueueBuddy staff only. Two-factor authentication is required."
      aside={
        <div className="card-muted space-y-2 p-4 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Clearance levels</p>
          <ul className="grid gap-1 sm:grid-cols-2">
            <li><span className="text-indigo-300">Super admin</span> · everything + staff invites</li>
            <li><span className="text-indigo-300">Ops</span> · dispatch & buddy verification</li>
            <li><span className="text-indigo-300">Support</span> · disputes & refunds</li>
            <li><span className="text-indigo-300">Content</span> · offices, fees & checklists</li>
          </ul>
        </div>
      }
    >
      <div className="space-y-5">
        {isDemoMode && (
          <DemoPersonas
            items={[
              { label: 'Super admin', hint: 'Full access', onClick: () => quickDemoLogin('admin', 'super_admin') },
              { label: 'Ops', hint: 'Dispatch', onClick: () => quickDemoLogin('admin', 'ops') },
              { label: 'Support', hint: 'Refunds', onClick: () => quickDemoLogin('admin', 'support') },
              { label: 'Content', hint: 'Offices', onClick: () => quickDemoLogin('admin', 'content') },
            ]}
          />
        )}

        {error && <Alert tone="error">{error}</Alert>}

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="a-email" className="label">Work email</label>
            <div className="relative">
              <Mail className="field-icon" />
              <input id="a-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="input input-icon" placeholder="you@queuebuddy.in" />
            </div>
          </div>
          <div>
            <label htmlFor="a-pass" className="label">Password</label>
            <div className="relative">
              <Lock className="field-icon" />
              <input id="a-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input input-icon" />
            </div>
          </div>
          <div>
            <label htmlFor="a-totp" className="label">Authenticator code</label>
            <div className="relative">
              <Fingerprint className="field-icon" />
              <input
                id="a-totp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, ''))}
                className="input input-icon font-mono tracking-[0.4em]"
                placeholder="000000"
              />
            </div>
            {isDemoMode && <p className="hint">Demo: any 6 digits. Email prefix ops@ / support@ / content@ picks the clearance.</p>}
          </div>
          <button type="submit" disabled={busy} className="btn btn-admin btn-lg w-full">
            {busy ? <Spinner /> : <ShieldCheck className="h-4 w-4" />}
            Authenticate
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
