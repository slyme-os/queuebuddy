'use client';

import React, { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  MapPin,
  Phone,
  MessageCircle,
  Ticket,
  Navigation,
  CheckCircle2,
  BellRing,
  Minus,
  Plus,
  Wallet,
  Star,
  Briefcase,
  Languages,
  Send,
  Inbox,
  CalendarClock,
} from 'lucide-react';
import type { Booking, BuddyProfile } from '@/types';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { Avatar, EmptyState, Spinner, Stat, StatusBadge } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/Toast';
import { SUMMON_THRESHOLD } from '@/lib/config';
import { cn, estimateMinutes, formatDate, formatINR, formatMinutes, isActiveBooking, waLink } from '@/lib/utils';

const QUICK_NOTES = ['Counter moving fast', 'Lunch break started', 'Server slow at counter', 'Token display stuck', 'Officer stepped out'];

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const BuddyPortal: React.FC<{ buddy: BuddyProfile }> = ({ buddy }) => {
  const { bookings, acceptJob, requestPayout } = useApp();
  const toast = useToast();

  const myJobs = useMemo(
    () =>
      bookings
        .filter((b) => b.buddy_id === buddy.id && isActiveBooking(b.status))
        .sort((a, b) => a.booking_date.localeCompare(b.booking_date) || a.arrival_time.localeCompare(b.arrival_time)),
    [bookings, buddy.id]
  );
  // A job that has started takes priority; otherwise the next upcoming one.
  const active = myJobs.find((b) => b.status !== 'assigned') ?? myJobs[0];
  const upcoming = myJobs.filter((b) => b.id !== active?.id);
  const openJobs = bookings.filter((b) => b.status === 'requested' && !b.buddy_id);
  const completedToday = bookings.filter((b) => b.buddy_id === buddy.id && b.status === 'handover_completed').length;

  const payout = () => {
    const amount = requestPayout(buddy.id);
    toast({ tone: 'success', title: `${formatINR(amount)} sent to your UPI`, description: 'Usually arrives within a minute.' });
  };

  return (
    <div className="space-y-6">
      <section className="card space-y-5 p-5">
        <div className="flex items-center gap-4">
          <Avatar name={buddy.full_name} className="h-14 w-14 text-lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold">{buddy.full_name}</h1>
              <span className="badge border-emerald-400/30 bg-emerald-400/10 text-emerald-300">Verified</span>
            </div>
            <p className="mt-0.5 truncate text-sm text-slate-400">
              {buddy.languages.join(' · ')} — {buddy.preferred_zones.join(', ')}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <Stat label="Balance" icon={<Wallet className="h-3.5 w-3.5" />} value={formatINR(buddy.earnings_balance)} accent="text-emerald-300" />
          <Stat label="Queues" icon={<Briefcase className="h-3.5 w-3.5" />} value={buddy.total_jobs} hint={completedToday ? `+${completedToday} recently` : undefined} />
          <Stat label="Rating" icon={<Star className="h-3.5 w-3.5" />} value={buddy.rating.toFixed(1)} accent="text-amber-300" />
        </div>
        <button onClick={payout} disabled={buddy.earnings_balance <= 0} className="btn btn-secondary btn-md w-full">
          <Wallet className="h-4 w-4" />
          {buddy.earnings_balance > 0 ? `Withdraw ${formatINR(buddy.earnings_balance)} to UPI` : 'No balance to withdraw'}
        </button>
      </section>

      {active ? <ActiveJob key={active.id} job={active} /> : (
        <EmptyState icon={<Inbox className="h-5 w-5" />} title="No active job" description="Accept an open job below to get started." />
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="eyebrow px-1">Upcoming · {upcoming.length}</h2>
          {upcoming.map((job) => (
            <div key={job.id} className="card flex items-center gap-3 p-4">
              <CalendarClock className="h-5 w-5 shrink-0 text-sky-300" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{job.service.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {job.office.name} · {formatDate(job.booking_date)}, {job.arrival_time}
                </p>
              </div>
              <span className="text-sm font-bold text-emerald-300">{formatINR(job.queue_buddy_fee)}</span>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="eyebrow">Open jobs near you</h2>
          <span className="text-xs text-slate-500">{openJobs.length} available</span>
        </div>
        {openJobs.length === 0 ? (
          <div className="card-muted p-6 text-center text-sm text-slate-500">All caught up. New bookings appear here instantly.</div>
        ) : (
          openJobs.map((job) => {
            const langMatch = buddy.languages.includes(job.preferred_language) || (!!job.backup_language && buddy.languages.includes(job.backup_language));
            return (
              <article key={job.id} className="card space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-amber-300">{job.booking_code}</p>
                    <h3 className="mt-0.5 text-[15px] font-bold leading-snug">{job.service.title}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.office.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-extrabold text-emerald-300">{formatINR(job.queue_buddy_fee)}</p>
                    <p className="text-[11px] text-slate-500">you earn</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="badge border-white/10 bg-white/[0.03] text-slate-300">
                    <CalendarClock className="h-3 w-3" />
                    {formatDate(job.booking_date)}, {job.arrival_time}
                  </span>
                  <span className={cn('badge', langMatch ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-300')}>
                    <Languages className="h-3 w-3" />
                    {job.preferred_language}
                    {job.backup_language ? ` / ${job.backup_language}` : ''}
                  </span>
                </div>
                <button
                  onClick={() => {
                    acceptJob(job.id, buddy.id);
                    toast({ tone: 'success', title: 'Job accepted', description: `${job.customer_name} has been notified.` });
                  }}
                  className="btn btn-primary btn-md w-full"
                >
                  Accept job
                </button>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

function ActiveJob({ job }: { job: Booking }) {
  const { updateBookingStatus, postQueueUpdate, completeHandover } = useApp();
  const toast = useToast();
  const [token, setToken] = useState(job.token_number ?? '');
  const [ahead, setAhead] = useState(job.people_ahead ?? 15);
  const [note, setNote] = useState('');
  const [locating, setLocating] = useState(false);
  const [confirmDone, setConfirmDone] = useState(false);

  const checkIn = () => {
    const finish = (extra = '') => {
      updateBookingStatus(job.id, 'buddy_arrived', { notes: `Your buddy has reached ${job.office.name}.${extra}` });
      toast({ tone: 'success', title: 'Checked in', description: 'Collect a token and join the queue.' });
      setLocating(false);
    };
    if (!('geolocation' in navigator)) return finish();
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const km = distanceKm({ lat: pos.coords.latitude, lng: pos.coords.longitude }, job.office);
        if (km > 1) toast({ tone: 'info', title: `You appear ${km.toFixed(1)} km away`, description: 'Check-in recorded; ops may verify your location.' });
        finish();
      },
      () => finish(),
      { timeout: 6000, maximumAge: 60_000 }
    );
  };

  const joinQueue = () => {
    if (!token.trim()) return toast({ tone: 'error', title: 'Enter your token number first' });
    postQueueUpdate(job.id, token.trim().toUpperCase(), ahead, `Joined the queue with token ${token.trim().toUpperCase()}. ${ahead} people ahead.`);
    toast({ tone: 'success', title: 'Customer notified', description: 'They can now track the queue live.' });
  };

  const post = () => {
    postQueueUpdate(job.id, token.trim().toUpperCase() || job.token_number || '—', ahead, note.trim() || undefined);
    setNote('');
    toast({
      tone: 'success',
      title: ahead <= SUMMON_THRESHOLD ? 'Customer summoned' : 'Update posted',
      description: ahead <= SUMMON_THRESHOLD ? `Only ${ahead} ahead — they've been told to head over.` : `${ahead} ahead · ~${formatMinutes(estimateMinutes(ahead))}`,
    });
  };

  const isQueue = job.status === 'in_queue' || job.status === 'customer_summoned';

  return (
    <section className="card overflow-hidden border-amber-400/40">
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] bg-amber-400/[0.05] p-5">
        <div className="min-w-0">
          <p className="eyebrow text-amber-300">Active job</p>
          <h2 className="mt-1 text-lg font-bold leading-snug">{job.service.title}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {job.office.name}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatDate(job.booking_date)}, arrive by {job.arrival_time} · up to {job.expected_wait_hours} hrs
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="space-y-5 p-5">
        <div className="flex items-center gap-3">
          <Avatar name={job.customer_name} className="h-10 w-10 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{job.customer_name}</p>
            <p className="text-xs text-slate-500">
              Speaks {job.preferred_language}
              {job.backup_language ? ` / ${job.backup_language}` : ''}
            </p>
          </div>
          <a href={`tel:${job.customer_phone.replace(/\s/g, '')}`} className="btn btn-secondary btn-icon" aria-label="Call customer">
            <Phone className="h-4 w-4" />
          </a>
          <a href={waLink(job.customer_phone)} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-icon" aria-label="WhatsApp customer">
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>

        {job.status === 'assigned' && (
          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${job.office.lat},${job.office.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-lg"
            >
              <Navigation className="h-4 w-4" />
              Navigate
            </a>
            <button onClick={checkIn} disabled={locating} className="btn btn-primary btn-lg">
              {locating ? <Spinner /> : <MapPin className="h-4 w-4" />}
              I&apos;ve arrived
            </button>
          </div>
        )}

        {job.status === 'buddy_arrived' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="tok" className="label">Token number from the counter</label>
              <div className="relative">
                <Ticket className="field-icon" />
                <input id="tok" value={token} onChange={(e) => setToken(e.target.value)} className="input input-icon font-mono uppercase" placeholder="e.g. B42" autoFocus />
              </div>
            </div>
            <AheadStepper value={ahead} onChange={setAhead} />
            <button onClick={joinQueue} className="btn btn-primary btn-lg w-full">
              <Ticket className="h-4 w-4" />
              Start live queue
            </button>
          </div>
        )}

        {isQueue && (
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <div>
                <label htmlFor="tok2" className="label">Token</label>
                <input id="tok2" value={token} onChange={(e) => setToken(e.target.value)} className="input font-mono uppercase" />
              </div>
              <div className="pb-2.5 text-right text-xs text-slate-500">~{formatMinutes(estimateMinutes(ahead))} left</div>
            </div>
            <AheadStepper value={ahead} onChange={setAhead} />
            <div>
              <label htmlFor="note" className="label">Note for customer (optional)</label>
              <input id="note" value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="What's happening at the counter?" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_NOTES.map((q) => (
                  <button key={q} onClick={() => setNote(q)} className="chip h-7 px-2.5 text-[11px]">
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button onClick={post} className="btn btn-secondary btn-lg">
                <Send className="h-4 w-4" />
                Post update
              </button>
              <button
                onClick={() => {
                  updateBookingStatus(job.id, 'customer_summoned', {
                    people_ahead: ahead,
                    notes: `Token ${token || job.token_number} is close — please come to the counter now.`,
                  });
                  toast({ tone: 'success', title: 'Customer summoned', description: 'They got an urgent alert.' });
                }}
                className="btn btn-danger btn-lg"
              >
                <BellRing className="h-4 w-4" />
                Call customer now
              </button>
            </div>
            <button onClick={() => setConfirmDone(true)} className="btn btn-success btn-lg w-full">
              <CheckCircle2 className="h-4 w-4" />
              Hand over spot & finish job
            </button>
          </div>
        )}
      </div>

      <Modal
        open={confirmDone}
        onClose={() => setConfirmDone(false)}
        size="sm"
        title="Hand over the spot?"
        description={`Confirm ${job.customer_name} is at the counter with you.`}
        footer={
          <div className="flex gap-2">
            <button onClick={() => setConfirmDone(false)} className="btn btn-secondary btn-md flex-1">
              Not yet
            </button>
            <button
              onClick={() => {
                completeHandover(job.id);
                setConfirmDone(false);
                confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
                toast({ tone: 'success', title: `+${formatINR(job.queue_buddy_fee)} earned`, description: 'Great work! Added to your balance.' });
              }}
              className="btn btn-success btn-md flex-1"
            >
              Confirm handover
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-400">You&apos;ll earn {formatINR(job.queue_buddy_fee)} for this job.</p>
      </Modal>
    </section>
  );
}

function AheadStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <span className="label">People ahead of your token</span>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(0, value - 1))} className="btn btn-secondary h-14 w-14 shrink-0 p-0" aria-label="One less">
          <Minus className="h-5 w-5" />
        </button>
        <div className="flex h-14 flex-1 flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-ink-950/60">
          <span className={cn('font-display text-2xl font-extrabold', value <= SUMMON_THRESHOLD ? 'text-rose-300' : 'text-white')} aria-live="polite">
            {value}
          </span>
        </div>
        <button onClick={() => onChange(Math.min(99, value + 1))} className="btn btn-secondary h-14 w-14 shrink-0 p-0" aria-label="One more">
          <Plus className="h-5 w-5" />
        </button>
      </div>
      {value <= SUMMON_THRESHOLD && <p className="mt-1.5 text-xs text-rose-300">Posting this will alert the customer to head over now.</p>}
    </div>
  );
}
