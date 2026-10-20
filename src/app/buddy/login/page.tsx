'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, KeyRound, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AuthShell, DemoPersonas } from '@/components/auth/AuthShell';
import { Alert, Spinner } from '@/components/ui/primitives';
import { isDemoMode } from '@/lib/config';
import { isValidIndianPhone, normalizePhone } from '@/lib/utils';

export default function BuddyLoginPage() {
  const { requestPhoneOtp, verifyPhoneOtp, quickDemoLogin, user, isLoading } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!isLoading && user?.role === 'buddy') router.replace('/buddy');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    if (!isValidIndianPhone(phone)) return setError('Enter a valid 10-digit mobile number.');
    setBusy(true);
    const res = await requestPhoneOtp(normalizePhone(phone));
    setBusy(false);
    if (res.error) return setError(res.error);
    setSent(true);
    setCooldown(30);
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit code.');
    setBusy(true);
    const res = await verifyPhoneOtp(normalizePhone(phone), otp);
    setBusy(false);
    if (res.error) setError(res.error);
  };

  return (
    <AuthShell
      tag="Buddy partner"
      accent="emerald"
      title="Buddy sign in"
      subtitle="Pick up queue jobs, post live updates, and withdraw earnings to UPI."
      aside={
        <p className="text-center text-sm text-slate-400">
          Not a buddy yet?{' '}
          <Link href="/buddy/apply" className="font-semibold text-amber-300 hover:underline">
            Apply in 3 minutes
          </Link>
        </p>
      }
    >
      <div className="space-y-5">
        {isDemoMode && (
          <DemoPersonas
            items={[
              { label: 'Verified buddy', hint: 'Ramesh · has a live job', onClick: () => quickDemoLogin('buddy', undefined, 'verified') },
              { label: 'Pending applicant', hint: 'Manjunath · awaiting KYC', onClick: () => quickDemoLogin('buddy', undefined, 'pending') },
            ]}
          />
        )}

        {error && <Alert tone="error">{error}</Alert>}

        {!sent ? (
          <form onSubmit={send} className="space-y-4" noValidate>
            <div>
              <label htmlFor="b-phone" className="label">Mobile number</label>
              <div className="relative">
                <Phone className="field-icon" />
                <input
                  id="b-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input input-icon"
                  placeholder="98450 12345"
                />
              </div>
            </div>
            <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
              {busy ? <Spinner /> : 'Send OTP'}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-4" noValidate>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="b-otp" className="label">Code sent to {normalizePhone(phone)}</label>
                <button type="button" onClick={() => setSent(false)} className="mb-1.5 text-xs text-amber-300 hover:underline">
                  Change
                </button>
              </div>
              <div className="relative">
                <KeyRound className="field-icon" />
                <input
                  id="b-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="input input-icon font-mono text-lg tracking-[0.5em]"
                  placeholder="000000"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                {isDemoMode ? <span className="text-slate-500">Demo code: 123456</span> : <span />}
                <button type="button" disabled={cooldown > 0 || busy} onClick={() => send()} className="text-amber-300 hover:underline disabled:text-slate-600 disabled:no-underline">
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
              {busy ? <Spinner /> : 'Verify & continue'}
            </button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
