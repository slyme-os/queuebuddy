'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth, homeForRole } from '@/context/AuthContext';
import { AuthShell, Divider, GoogleIcon, DemoPersonas } from '@/components/auth/AuthShell';
import { Alert, Spinner } from '@/components/ui/primitives';
import { isDemoMode } from '@/lib/config';
import { isValidEmail, isValidIndianPhone } from '@/lib/utils';

type Mode = 'signin' | 'signup' | 'magic' | 'forgot';

const COPY: Record<Mode, { title: string; cta: string }> = {
  signin: { title: 'Welcome back', cta: 'Sign in' },
  signup: { title: 'Create your account', cta: 'Create account' },
  magic: { title: 'Sign in with a magic link', cta: 'Email me a link' },
  forgot: { title: 'Reset your password', cta: 'Send reset link' },
};

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInWithMagicLink, resetPassword, quickDemoLogin, user, isLoading } =
    useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || undefined;

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  // Already signed in when arriving → skip the form (sign-in actions navigate on their own).
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    if (isLoading || checked) return;
    setChecked(true);
    if (user) router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : homeForRole(user.role));
  }, [isLoading, checked, user, next, router]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setSuccess('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    if (mode === 'signup') {
      if (fullName.trim().length < 2) return setError('Enter your full name.');
      if (phone && !isValidIndianPhone(phone)) return setError('Enter a valid 10-digit mobile number, or leave it blank.');
    }
    setBusy(true);
    const res =
      mode === 'signin'
        ? await signInWithEmail(email, password, next)
        : mode === 'signup'
          ? await signUpWithEmail(email, password, fullName.trim(), phone || undefined, next)
          : mode === 'magic'
            ? await signInWithMagicLink(email, next)
            : await resetPassword(email);
    setBusy(false);
    if (res.error) setError(res.error);
    if (res.message) setSuccess(res.message);
  };

  return (
    <AuthShell
      tag="Bengaluru"
      title={COPY[mode].title}
      subtitle="Book verified line-waiters at RTO, Sub-Registrar, Passport and BBMP offices."
      aside={
        <div className="flex items-center justify-center gap-5 text-sm text-slate-500">
          <Link href="/buddy/login" className="hover:text-white">
            Buddy partner login
          </Link>
          <span className="h-4 w-px bg-white/10" />
          <Link href="/admin/login" className="hover:text-white">
            Staff terminal
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        {isDemoMode && (
          <DemoPersonas
            items={[
              { label: 'Customer', hint: 'Arjun · 2 bookings', onClick: () => quickDemoLogin('customer', undefined, undefined, next) },
              { label: 'Queue Buddy', hint: 'Ramesh · verified', onClick: () => quickDemoLogin('buddy') },
            ]}
          />
        )}

        {(mode === 'signin' || mode === 'signup') && (
          <>
            <button
              type="button"
              onClick={async () => {
                setError('');
                const res = await signInWithGoogle(next);
                if (res.error) setError(res.error);
              }}
              className="btn btn-md w-full bg-white text-slate-900 hover:bg-slate-100"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <Divider label="or with email" />
          </>
        )}

        {error && <Alert tone="error">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

        <form onSubmit={submit} className="space-y-4" noValidate>
          {mode === 'signup' && (
            <>
              <Field id="name" label="Full name" icon={User}>
                <input id="name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input input-icon" placeholder="Arjun Mehta" />
              </Field>
              <Field id="phone" label="WhatsApp number (optional)" icon={Phone}>
                <input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input input-icon" placeholder="98450 12345" />
              </Field>
            </>
          )}

          <Field id="email" label="Email" icon={Mail}>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input input-icon" placeholder="you@example.com" />
          </Field>

          {(mode === 'signin' || mode === 'signup') && (
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="label">
                  Password
                </label>
                {mode === 'signin' && (
                  <button type="button" onClick={() => switchMode('forgot')} className="mb-1.5 text-xs text-amber-300 hover:underline">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="field-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-icon pr-11"
                  placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
            {busy ? <Spinner /> : COPY[mode].cta}
            {!busy && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="space-y-2 border-t border-white/[0.06] pt-4 text-center text-sm text-slate-400">
          {mode === 'signin' ? (
            <>
              <p>
                New to QueueBuddy?{' '}
                <button onClick={() => switchMode('signup')} className="font-semibold text-amber-300 hover:underline">
                  Create an account
                </button>
              </p>
              <button onClick={() => switchMode('magic')} className="text-slate-500 hover:text-white">
                Sign in without a password
              </button>
            </>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => switchMode('signin')} className="font-semibold text-amber-300 hover:underline">
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </AuthShell>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <Icon className="field-icon" />
        {children}
      </div>
    </div>
  );
}
