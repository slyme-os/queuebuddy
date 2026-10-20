'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, BadgeCheck, CalendarCheck2, FileCheck2, Radar, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import type { Booking, Office, Service } from '@/types';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { OfficeDirectory } from '@/components/offices/OfficeDirectory';
import { OfficeDetailModal } from '@/components/offices/OfficeDetailModal';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { MyBookingsView } from '@/components/booking/MyBookingsView';
import { isActiveBooking } from '@/lib/utils';

export interface CustomerHomeParams {
  tab?: string | null;
  book?: string | null;
  service?: string | null;
  booking?: string | null;
  panel?: string | null;
}

export function CustomerHome({ landing = false, params = {} }: { landing?: boolean; params?: CustomerHomeParams }) {
  const { t, offices, services, buddies, bookings, hydrated } = useApp();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const tab = params.tab === 'queues' ? 'queues' : 'offices';
  const [detail, setDetail] = useState<Office | null>(null);
  const [wizard, setWizard] = useState<{ office?: Office; service?: Service; key: number } | null>(null);

  // Resume a booking the user started before signing in (/app?book=<office>&service=<service>).
  const bookOfficeId = params.book;
  const bookServiceId = params.service;
  useEffect(() => {
    if (!bookOfficeId || !isAuthenticated || !hydrated) return;
    const office = offices.find((o) => o.id === bookOfficeId && o.status === 'bookable');
    const service = services.find((s) => s.id === bookServiceId && s.office_id === bookOfficeId);
    if (office) setWizard({ office, service, key: Date.now() });
    router.replace(pathname);
  }, [bookOfficeId, bookServiceId, isAuthenticated, hydrated, offices, services, router, pathname]);

  const openBooking = (office: Office, service?: Service) => {
    if (!isAuthenticated) {
      const next = `/app?book=${office.id}${service ? `&service=${service.id}` : ''}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setDetail(null);
    setWizard({ office, service, key: Date.now() });
  };

  const onBooked = (booking: Booking) => {
    setWizard(null);
    router.push(`/app?tab=queues&booking=${booking.id}&panel=checklist`);
  };

  const activeForUser = user ? bookings.filter((b) => b.customer_id === user.id && isActiveBooking(b.status)) : [];
  const verifiedBuddies = buddies.filter((b) => b.verification_status === 'verified').length;
  const bookableCount = offices.filter((o) => o.status === 'bookable').length;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar active={tab} />

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 pb-28 pt-6 md:pb-12">
        {tab === 'queues' ? (
          isLoading ? null : isAuthenticated ? (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-extrabold sm:text-3xl">{t.nav.myBookings}</h1>
                <p className="mt-1 text-sm text-slate-400">Track your buddy live and get your documents ready.</p>
              </div>
              <MyBookingsView
                onBrowse={() => router.push('/app')}
                focusBookingId={params.booking}
                initialPanel={params.panel === 'checklist' ? 'checklist' : 'tracker'}
              />
            </div>
          ) : null
        ) : (
          <>
            {landing && !isAuthenticated ? (
              <Hero t={t} stats={{ offices: bookableCount, buddies: verifiedBuddies }} />
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold sm:text-3xl">
                    {user ? `Namaskara, ${user.full_name.split(' ')[0]}` : t.nav.offices}
                  </h1>
                  <p className="mt-1 text-sm text-slate-400">Find an office, check the crowd, and book a buddy in under a minute.</p>
                </div>
                {activeForUser.length > 0 && (
                  <Link href="/app?tab=queues" className="card flex items-center gap-3 px-4 py-3 transition hover:border-amber-400/40">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
                    </span>
                    <span className="text-sm">
                      <strong className="text-white">{activeForUser.length} active</strong>{' '}
                      <span className="text-slate-400">{activeForUser.length === 1 ? 'queue' : 'queues'}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </Link>
                )}
              </div>
            )}

            <OfficeDirectory onSelectOffice={setDetail} onBookOffice={(o) => openBooking(o)} />

            {landing && !isAuthenticated && <HowItWorks t={t} />}
          </>
        )}
      </main>

      {landing && <Footer />}

      {detail && (
        <OfficeDetailModal key={detail.id} office={detail} onClose={() => setDetail(null)} onBookService={openBooking} />
      )}

      {wizard && (
        <BookingWizard
          key={wizard.key}
          open
          initialOffice={wizard.office}
          initialService={wizard.service}
          onClose={() => setWizard(null)}
          onComplete={onBooked}
        />
      )}

      <BottomNav active={tab} />
    </div>
  );
}

type T = ReturnType<typeof useApp>['t'];

function Hero({ t, stats }: { t: T; stats: { offices: number; buddies: number } }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-ink-900 px-5 py-10 sm:px-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          <span className="badge border-amber-400/30 bg-amber-400/10 px-3 py-1 text-amber-200">
            <Sparkles className="h-3.5 w-3.5" />
            {t.home.badge}
          </span>
          <h1 className="text-balance text-4xl font-black leading-[1.05] sm:text-5xl">
            {t.home.titleA}{' '}
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent">{t.home.titleB}</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">{t.subtitle}</p>
          <div className="flex flex-wrap gap-3">
            <a href="#offices" className="btn btn-primary btn-lg">
              {t.home.cta}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#how" className="btn btn-secondary btn-lg">
              {t.home.ctaSecondary}
            </a>
          </div>
          <ul className="flex flex-col gap-2 pt-2 text-sm text-slate-400 sm:flex-row sm:flex-wrap sm:gap-x-5">
            {[t.home.trust1, t.home.trust2, t.home.trust3].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Live preview card */}
        <div className="relative hidden lg:block" aria-hidden>
          <div className="card rotate-1 space-y-4 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-amber-300">QB-BLR-8492</span>
              <span className="badge border-rose-400/40 bg-rose-500/15 text-rose-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
                Head to office now
              </span>
            </div>
            <div>
              <p className="font-display text-lg font-bold text-white">DL Renewal · Indiranagar RTO</p>
              <p className="text-sm text-slate-500">Buddy Ramesh is at counter 2</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['Token', 'B42'],
                ['Ahead', '2'],
                ['Call in', '~10m'],
              ].map(([k, v]) => (
                <div key={k} className="card-muted p-3">
                  <p className="text-[11px] text-slate-500">{k}</p>
                  <p className="font-display text-xl font-extrabold text-white">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < 4 ? 'bg-amber-400' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
          <div className="card absolute -bottom-8 -left-8 flex -rotate-2 items-center gap-3 p-3.5 shadow-2xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
              <FileCheck2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">5 of 5 documents ready</p>
              <p className="text-xs text-slate-500">You&apos;re counter-ready</p>
            </div>
          </div>
        </div>
      </div>

      <dl className="relative mt-10 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-6 sm:max-w-xl">
        {[
          ['4–6', t.home.stat1],
          [String(stats.buddies), t.home.stat2],
          [String(stats.offices), t.home.stat3],
        ].map(([v, k]) => (
          <div key={k}>
            <dt className="sr-only">{k}</dt>
            <dd className="font-display text-2xl font-extrabold text-white sm:text-3xl">{v}</dd>
            <dd className="text-xs text-slate-500">{k}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HowItWorks({ t }: { t: T }) {
  const steps = [
    { icon: CalendarCheck2, title: t.home.how1Title, desc: t.home.how1Desc },
    { icon: UsersRound, title: t.home.how2Title, desc: t.home.how2Desc },
    { icon: Radar, title: t.home.how3Title, desc: t.home.how3Desc },
  ];
  return (
    <section id="how" className="scroll-mt-24 space-y-6 pt-6">
      <div className="text-center">
        <p className="eyebrow">Simple, honest, safe</p>
        <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">{t.home.howTitle}</h2>
      </div>
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="card relative space-y-3 p-6">
            <span className="absolute right-5 top-5 font-display text-4xl font-black text-white/[0.05]">0{i + 1}</span>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
              <s.icon className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-bold">{s.title}</h3>
            <p className="text-sm leading-relaxed text-slate-400">{s.desc}</p>
          </li>
        ))}
      </ol>
      <div className="card flex flex-col items-start justify-between gap-4 bg-gradient-to-r from-amber-400/[0.08] to-transparent p-6 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-amber-300" />
          <div>
            <p className="font-semibold text-white">Want to earn as a Queue Buddy?</p>
            <p className="text-sm text-slate-400">Flexible work across Bengaluru. ₹300–₹500 per queue, paid instantly via UPI.</p>
          </div>
        </div>
        <Link href="/buddy/apply" className="btn btn-secondary btn-md shrink-0">
          Apply to be a buddy
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
