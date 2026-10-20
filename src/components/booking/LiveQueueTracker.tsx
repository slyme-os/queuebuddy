'use client';

import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  MapPin,
  Users,
  Ticket,
  Clock,
  ShieldCheck,
  Navigation,
  BellRing,
  Star,
  XCircle,
  LifeBuoy,
  FileCheck,
  ChevronRight,
  Check,
} from 'lucide-react';
import type { Booking } from '@/types';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { Alert, Avatar, Stat, StatusBadge } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/Toast';
import {
  BOOKING_FLOW,
  canCancelBooking,
  cn,
  estimateMinutes,
  formatDate,
  formatINR,
  formatMinutes,
  relativeTime,
  waLink,
} from '@/lib/utils';

interface LiveQueueTrackerProps {
  booking: Booking;
  docsReady: number;
  docsTotal: number;
  onOpenChecklist: () => void;
}

export const LiveQueueTracker: React.FC<LiveQueueTrackerProps> = ({ booking, docsReady, docsTotal, onOpenChecklist }) => {
  const { t, locale, buddies, cancelBooking, rateBooking, raiseDispute } = useApp();
  const toast = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueText, setIssueText] = useState('');

  const buddy = buddies.find((b) => b.id === booking.buddy_id) ?? booking.buddy;
  const summoned = booking.status === 'customer_summoned';
  const done = booking.status === 'handover_completed';
  const cancelled = booking.status === 'cancelled';
  const inQueue = booking.status === 'in_queue' || summoned;
  const stepIndex = BOOKING_FLOW.indexOf(booking.status);
  const peopleAhead = booking.people_ahead ?? 0;

  const timeline = [
    { key: 'requested', label: 'Booked' },
    { key: 'assigned', label: 'Buddy assigned' },
    { key: 'buddy_arrived', label: 'At office' },
    { key: 'in_queue', label: 'In queue' },
    { key: 'customer_summoned', label: 'Your turn soon' },
    { key: 'handover_completed', label: 'Handed over' },
  ];

  return (
    <div className="space-y-4">
      {summoned && (
        <div className="relative overflow-hidden rounded-2xl border border-rose-400/40 bg-gradient-to-r from-rose-500/25 via-amber-500/15 to-transparent p-4 sm:p-5">
          <div className="flex items-start gap-3.5">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white">
              <span className="absolute inset-0 animate-ping rounded-xl bg-rose-500/50" />
              <BellRing className="relative h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-200">Head to the office now</p>
              <p className="mt-1 font-display text-lg font-bold leading-snug text-white">
                {peopleAhead === 0 ? "You're next at the counter!" : `Only ${peopleAhead} ${peopleAhead === 1 ? 'person' : 'people'} ahead of you.`}
              </p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${booking.office.lat},${booking.office.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm mt-3"
              >
                <Navigation className="h-3.5 w-3.5" />
                Navigate to {booking.office.area}
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="card space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-semibold text-amber-300">{booking.booking_code}</span>
              <span>·</span>
              <span>
                {formatDate(booking.booking_date)}, {booking.arrival_time}
              </span>
            </div>
            <h2 className="mt-1.5 text-lg font-bold leading-snug">
              {locale === 'kn' ? booking.service.title_kn : booking.service.title}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {booking.office.name}
            </p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {/* Progress timeline */}
        {!cancelled && (
          <ol className="grid grid-cols-6 gap-1" aria-label="Booking progress">
            {timeline.map((s, i) => {
              const reached = i <= stepIndex;
              const current = i === stepIndex;
              return (
                <li key={s.key} className="space-y-2">
                  <span
                    className={cn(
                      'block h-1.5 rounded-full transition-colors',
                      reached ? (done ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-white/10',
                      current && !done && 'animate-pulse'
                    )}
                  />
                  <span className={cn('hidden text-[11px] leading-tight sm:block', current ? 'font-semibold text-white' : reached ? 'text-slate-400' : 'text-slate-600')}>
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {inQueue && (
          <div className="grid grid-cols-3 gap-2.5">
            <Stat label="Token" icon={<Ticket className="h-3.5 w-3.5" />} value={booking.token_number || '—'} accent="text-amber-300" />
            <Stat label="Ahead" icon={<Users className="h-3.5 w-3.5" />} value={peopleAhead} />
            <Stat label="Est. call" icon={<Clock className="h-3.5 w-3.5" />} value={`~${formatMinutes(estimateMinutes(peopleAhead))}`} accent="text-emerald-300" />
          </div>
        )}

        {booking.notes && !cancelled && (
          <div className="rounded-xl border border-white/[0.06] bg-ink-950/50 p-3 text-sm">
            <span className="text-xs font-semibold text-amber-300">Latest from your buddy · {relativeTime(booking.updated_at)}</span>
            <p className="mt-1 text-slate-300">{booking.notes}</p>
          </div>
        )}

        {booking.status === 'requested' && (
          <Alert tone="info">We&apos;re matching a verified {booking.preferred_language}-speaking buddy. This usually takes a few minutes.</Alert>
        )}
        {booking.status === 'assigned' && (
          <Alert tone="info">
            Your buddy will reach the office at {booking.arrival_time} on {formatDate(booking.booking_date)}. Relax — we&apos;ll keep you posted.
          </Alert>
        )}
        {cancelled && (
          <Alert tone="warning">
            Cancelled{booking.cancel_reason ? ` — ${booking.cancel_reason}` : ''}. {booking.payment_status === 'refunded' && `${formatINR(booking.total_amount)} refunded to your original payment method.`}
          </Alert>
        )}
      </div>

      {buddy && !cancelled && (
        <div className="card flex items-center gap-3.5 p-4">
          <Avatar name={buddy.full_name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-semibold text-white">{buddy.full_name}</p>
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-label="Verified" />
            </div>
            <p className="truncate text-xs text-slate-400">
              ★ {buddy.rating.toFixed(1)} · {buddy.total_jobs} queues · {buddy.languages.join(', ')}
            </p>
          </div>
          {!done && (
            <div className="flex gap-2">
              <a href={`tel:${buddy.phone.replace(/\s/g, '')}`} className="btn btn-secondary btn-icon" aria-label={`Call ${buddy.full_name}`}>
                <Phone className="h-4 w-4" />
              </a>
              <a href={waLink(buddy.phone)} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-icon" aria-label={`WhatsApp ${buddy.full_name}`}>
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      )}

      {done && (
        <div className="card space-y-3 p-5 text-center">
          <p className="text-sm font-semibold text-white">{booking.rating ? 'Thanks for rating your buddy!' : `How was ${buddy?.full_name ?? 'your buddy'}?`}</p>
          <div className="flex justify-center gap-1.5" role="radiogroup" aria-label="Rate your buddy">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={booking.rating === n}
                disabled={!!booking.rating}
                onClick={() => {
                  rateBooking(booking.id, n);
                  toast({ tone: 'success', title: 'Rating saved', description: 'Thanks — this helps keep quality high.' });
                }}
                className="rounded-lg p-1 transition hover:scale-110 disabled:hover:scale-100"
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star className={cn('h-7 w-7', (booking.rating ?? 0) >= n ? 'fill-amber-400 text-amber-400' : 'text-slate-600')} />
              </button>
            ))}
          </div>
        </div>
      )}

      {!cancelled && docsTotal > 0 && (
        <button onClick={onOpenChecklist} className="card flex w-full items-center gap-3.5 p-4 text-left transition hover:border-white/[0.14]">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              docsReady === docsTotal ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-300'
            )}
          >
            {docsReady === docsTotal ? <Check className="h-5 w-5" /> : <FileCheck className="h-5 w-5" />}
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-white">Document checklist</span>
            <span className="text-xs text-slate-400">
              {docsReady} of {docsTotal} ready{docsReady < docsTotal ? ' — finish before you head out' : ' — you’re counter-ready'}
            </span>
          </span>
          <ChevronRight className="h-5 w-5 text-slate-500" />
        </button>
      )}

      {!cancelled && (
        <div className="flex flex-wrap gap-2">
          {canCancelBooking(booking.status) && (
            <button onClick={() => setCancelOpen(true)} className="btn btn-danger-soft btn-sm">
              <XCircle className="h-4 w-4" />
              Cancel booking
            </button>
          )}
          <button onClick={() => setIssueOpen(true)} className="btn btn-ghost btn-sm">
            <LifeBuoy className="h-4 w-4" />
            Report a problem
          </button>
        </div>
      )}

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        size="sm"
        title="Cancel this booking?"
        description="Your buddy hasn't reached the office yet, so you get a full refund."
        footer={
          <div className="flex gap-2">
            <button onClick={() => setCancelOpen(false)} className="btn btn-secondary btn-md flex-1">
              Keep booking
            </button>
            <button
              onClick={() => {
                cancelBooking(booking.id);
                setCancelOpen(false);
                toast({ tone: 'success', title: 'Booking cancelled', description: `${formatINR(booking.total_amount)} will be refunded in 3–5 days.` });
              }}
              className="btn btn-danger btn-md flex-1"
            >
              Cancel & refund
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-400">
          {booking.service.title} at {booking.office.name} on {formatDate(booking.booking_date)}.
        </p>
      </Modal>

      <Modal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        size="sm"
        title="Report a problem"
        description="Our support team reviews every report within a few hours."
        footer={
          <button
            disabled={issueText.trim().length < 10}
            onClick={() => {
              raiseDispute(booking.id, issueText.trim());
              setIssueOpen(false);
              setIssueText('');
              toast({ tone: 'success', title: 'Report submitted', description: 'Support will contact you on WhatsApp.' });
            }}
            className="btn btn-primary btn-md w-full"
          >
            Submit report
          </button>
        }
      >
        <label htmlFor="issue" className="label">
          What went wrong?
        </label>
        <textarea
          id="issue"
          rows={4}
          value={issueText}
          onChange={(e) => setIssueText(e.target.value)}
          placeholder="e.g. The buddy didn't arrive on time, or the office closed early."
          className="input h-auto py-3"
        />
        <p className="hint">At least 10 characters.</p>
      </Modal>
    </div>
  );
};
