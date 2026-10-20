'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, FileText, Languages, MapPin, Phone, ShieldX } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { BuddyPortal } from '@/components/buddy/BuddyPortal';
import { RequireRole } from '@/components/auth/RequireRole';
import { EmptyState } from '@/components/ui/primitives';
import { isDemoMode } from '@/lib/config';

const digits = (s?: string) => (s ?? '').replace(/\D/g, '').slice(-10);

function BuddyHome() {
  const { user, buddyApplication } = useAuth();
  const { buddies } = useApp();

  // Link the signed-in user to their buddy profile by phone number.
  const profile = buddies.find((b) => digits(b.phone) === digits(user?.phone));
  const status = profile?.verification_status ?? (buddyApplication ? 'pending' : undefined);

  return (
    <div className="min-h-screen">
      <Navbar variant="buddy" />
      <main id="main" className="mx-auto max-w-3xl px-4 py-6 pb-16">
        {status === 'verified' && profile ? (
          <BuddyPortal buddy={profile} />
        ) : status === 'rejected' ? (
          <EmptyState
            icon={<ShieldX className="h-5 w-5" />}
            title="Application not approved"
            description="We couldn't verify your documents this time. Reach out to partner support on WhatsApp to re-apply."
          />
        ) : status === 'pending' ? (
          <div className="card space-y-6 p-6 text-center sm:p-8">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
              <Clock className="h-7 w-7" />
            </span>
            <div>
              <span className="badge border-amber-400/30 bg-amber-400/10 text-amber-200">Pending verification</span>
              <h1 className="mt-3 text-2xl font-extrabold">Your application is under review</h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                For citizen safety, jobs unlock once our ops team verifies your ID. This usually takes 24–48 hours — we&apos;ll WhatsApp you.
              </p>
            </div>
            <dl className="card-muted mx-auto max-w-sm divide-y divide-white/[0.05] text-left text-sm">
              {[
                [FileText, 'Applicant', profile?.full_name ?? buddyApplication?.full_name ?? user?.full_name],
                [Phone, 'Phone', profile?.phone ?? buddyApplication?.phone ?? user?.phone],
                [Languages, 'Languages', (profile?.languages ?? buddyApplication?.languages ?? []).join(', ')],
                [MapPin, 'Areas', (profile?.preferred_zones ?? buddyApplication?.preferred_zones ?? []).join(', ')],
              ].map(([Icon, k, v]) => {
                const I = Icon as typeof FileText;
                return (
                  <div key={k as string} className="flex items-center gap-3 p-3">
                    <I className="h-4 w-4 text-slate-500" />
                    <dt className="w-20 text-slate-500">{k as string}</dt>
                    <dd className="flex-1 truncate text-slate-100">{(v as string) || '—'}</dd>
                  </div>
                );
              })}
            </dl>
            {isDemoMode && (
              <p className="text-xs text-slate-500">
                Demo tip: switch to <strong className="text-slate-300">Admin</strong> in the top bar → Buddies tab → approve this applicant, then come back.
              </p>
            )}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="Finish your buddy application"
            description="We couldn't find a buddy profile for this number yet."
            action={
              <Link href="/buddy/apply" className="btn btn-primary btn-md">
                Start application
              </Link>
            }
          />
        )}
      </main>
    </div>
  );
}

export default function BuddyPage() {
  return (
    <RequireRole
      roles={['buddy']}
      loginPath="/buddy/login"
      fallback={
        <div className="mx-auto max-w-md px-4 py-24">
          <EmptyState
            icon={<ShieldX className="h-5 w-5" />}
            title="Buddy partners only"
            description="This cockpit is for verified Queue Buddies."
            action={
              <Link href="/buddy/login" className="btn btn-primary btn-md">
                Buddy sign in
              </Link>
            }
          />
        </div>
      }
    >
      <BuddyHome />
    </RequireRole>
  );
}
