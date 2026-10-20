'use client';

import React, { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Languages,
  MapPin,
  ShieldCheck,
  User,
  Phone,
  CalendarDays,
  Lock,
  PartyPopper,
  Ticket,
} from 'lucide-react';
import type { Booking, Office, Service, SupportedLanguage } from '@/types';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { Alert, Spinner } from '@/components/ui/primitives';
import { collectPayment } from '@/lib/razorpay';
import { BASE_HOURS, EXTRA_HOUR_FEE, PLATFORM_FEE } from '@/lib/config';
import {
  cn,
  formatDate,
  formatINR,
  isValidIndianPhone,
  normalizePhone,
  OFFICE_TYPE_META,
  toLocalDateInput,
} from '@/lib/utils';

const LANGUAGES: SupportedLanguage[] = ['Kannada', 'English', 'Hindi', 'Tamil', 'Telugu'];
const SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '02:30 PM'];

interface BookingWizardProps {
  open: boolean;
  initialOffice?: Office;
  initialService?: Service;
  onClose: () => void;
  onComplete: (booking: Booking) => void;
}

/** Returns a reason the office is closed on this date, if any. */
function closedReason(office: Office, isoDate: string): string | null {
  const d = new Date(`${isoDate}T00:00:00`);
  const day = d.getDay();
  const nth = Math.ceil(d.getDate() / 7);
  const h = office.holidays.join(' ').toLowerCase();
  if (day === 0 && h.includes('sunday')) return 'This office is closed on Sundays.';
  if (day === 6 && h.includes('all saturdays')) return 'This office is closed on Saturdays.';
  if (day === 6 && nth === 2 && h.includes('second saturday')) return 'Closed on the second Saturday of the month.';
  if (day === 6 && nth === 4 && h.includes('fourth saturday')) return 'Closed on the fourth Saturday of the month.';
  return null;
}

function slotToMinutes(slot: string) {
  const [time, ampm] = slot.split(' ');
  const [hh, mm] = time.split(':').map(Number);
  return ((hh % 12) + (ampm === 'PM' ? 12 : 0)) * 60 + mm;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({ open, initialOffice, initialService, onClose, onComplete }) => {
  const { offices, services, checklists, createBooking, preferences, t, locale } = useApp();
  const { user } = useAuth();

  const firstStep = initialOffice && initialService ? 3 : initialOffice ? 2 : 1;
  const [step, setStep] = useState(firstStep);
  const [office, setOffice] = useState<Office | null>(initialOffice ?? null);
  const [service, setService] = useState<Service | null>(initialService ?? null);

  const today = toLocalDateInput(new Date());
  const maxDate = toLocalDateInput(new Date(Date.now() + 30 * 86_400_000));
  const [date, setDate] = useState(toLocalDateInput(new Date(Date.now() + 86_400_000)));
  const [slot, setSlot] = useState('10:00 AM');
  const [hours, setHours] = useState(2);
  const [name, setName] = useState(user?.full_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [primaryLang, setPrimaryLang] = useState<SupportedLanguage>(preferences.preferredLanguage);
  const [backupLang, setBackupLang] = useState<SupportedLanguage | undefined>(
    preferences.backupLanguage !== preferences.preferredLanguage ? preferences.backupLanguage : undefined
  );
  const [touched, setTouched] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [confirmed, setConfirmed] = useState<Booking | null>(null);

  const bookableOffices = offices.filter((o) => o.status === 'bookable');
  const officeServices = office ? services.filter((s) => s.office_id === office.id) : [];

  const baseFee = service?.queue_buddy_base_fee ?? 0;
  const extraHours = Math.max(0, hours - BASE_HOURS);
  const extraFee = extraHours * EXTRA_HOUR_FEE;
  const buddyFee = baseFee + extraFee;
  const total = buddyFee + PLATFORM_FEE;

  const closed = office ? closedReason(office, date) : null;
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const slotDisabled = (s: string) => date === today && slotToMinutes(s) <= nowMinutes + 45;

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!date || date < today) e.date = 'Pick today or a future date.';
    else if (date > maxDate) e.date = 'Bookings open up to 30 days ahead.';
    else if (closed) e.date = closed;
    if (slotDisabled(slot)) e.slot = 'That time has passed — pick a later slot.';
    if (name.trim().length < 2) e.name = 'Enter your full name.';
    if (!isValidIndianPhone(phone)) e.phone = 'Enter a valid 10-digit Indian mobile number.';
    return e;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, slot, name, phone, closed, today, maxDate]);

  const canContinue =
    (step === 1 && !!office) || (step === 2 && !!service) || (step === 3 && Object.keys(errors).length === 0) || step === 4;

  const next = () => {
    if (step === 3 && Object.keys(errors).length) {
      setTouched(true);
      return;
    }
    if (canContinue) setStep((s) => s + 1);
  };

  const pay = async () => {
    if (!office || !service || !user) return;
    setPaying(true);
    setPayError('');
    const result = await collectPayment({
      amount: total,
      description: `${service.title} · ${office.name}`,
      customer: { name, email: user.email, phone },
      notes: { office: office.name, service: service.title, date },
    });
    setPaying(false);
    if (!result.ok) {
      if (!result.cancelled) setPayError(result.error);
      return;
    }
    const booking = createBooking({
      officeId: office.id,
      serviceId: service.id,
      bookingDate: date,
      arrivalTime: slot,
      expectedWaitHours: hours,
      preferredLanguage: primaryLang,
      backupLanguage: backupLang,
      customerId: user.id,
      customerName: name.trim(),
      customerPhone: normalizePhone(phone),
      totalAmount: total,
      queueBuddyFee: buddyFee,
      governmentFee: service.government_fee,
      paymentId: result.paymentId,
      orderId: result.orderId,
    });
    setConfirmed(booking);
    setStep(6);
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: ['#FBBF24', '#34D399', '#818CF8', '#F472B6'] });
  };

  const steps = [t.bookingWizard.step1, t.bookingWizard.step2, t.bookingWizard.step3, t.bookingWizard.step4, 'Review & pay'];

  const header =
    step <= 5 ? (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Step {step} of 5 · <span className="text-slate-300">{steps[step - 1]}</span>
          </span>
          {office && step > 1 && (
            <span className="hidden max-w-[50%] truncate sm:inline">
              {OFFICE_TYPE_META[office.office_type].emoji} {office.name}
            </span>
          )}
        </div>
        <div className="flex gap-1.5" aria-hidden>
          {steps.map((_, i) => (
            <span key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i < step ? 'bg-amber-400' : 'bg-white/10')} />
          ))}
        </div>
      </div>
    ) : null;

  const footer =
    step <= 5 ? (
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => (step === firstStep ? onClose() : setStep((s) => s - 1))}
          className="btn btn-ghost btn-md"
          disabled={paying}
        >
          {step === firstStep ? (
            t.common.cancel
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              {t.common.back}
            </>
          )}
        </button>
        {step < 5 ? (
          <button onClick={next} disabled={step !== 3 && !canContinue} className="btn btn-primary btn-md min-w-[120px]">
            {t.common.next}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={pay} disabled={paying} className="btn btn-primary btn-lg min-w-[180px]">
            {paying ? (
              <>
                <Spinner /> Processing…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Pay {formatINR(total)}
              </>
            )}
          </button>
        )}
      </div>
    ) : undefined;

  return (
    <Modal open={open} onClose={onClose} size="lg" title={step <= 5 ? t.common.bookBuddy : undefined} description={header} footer={footer} dismissible={!paying}>
      {/* Step 1: office */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Which office do you need help at?</p>
          <div className="grid gap-2">
            {bookableOffices.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setOffice(o);
                  setService(null);
                }}
                className={cn('option flex items-center gap-3 p-3.5', office?.id === o.id && 'option-active')}
                aria-pressed={office?.id === o.id}
              >
                <span className="text-xl" aria-hidden>
                  {OFFICE_TYPE_META[o.office_type].emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">{locale === 'kn' ? o.name_kn : o.name}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" /> {o.area}
                  </span>
                </span>
                <Radio checked={office?.id === o.id} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: service */}
      {step === 2 && office && (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            What do you need done at <span className="text-slate-200">{office.name}</span>?
          </p>
          <div className="grid gap-2">
            {officeServices.map((s) => {
              const docCount = checklists.filter((c) => c.service_id === s.id).length;
              return (
                <button
                  key={s.id}
                  onClick={() => setService(s)}
                  className={cn('option space-y-2 p-4', service?.id === s.id && 'option-active')}
                  aria-pressed={service?.id === s.id}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-white">{locale === 'kn' ? s.title_kn : s.title}</span>
                    <Radio checked={service?.id === s.id} />
                  </span>
                  <span className="block text-xs text-slate-400">{s.description}</span>
                  <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="font-semibold text-amber-300">from {formatINR(s.queue_buddy_base_fee)}</span>
                    <span className="text-slate-500">Govt fee {formatINR(s.government_fee)} at counter</span>
                    {docCount > 0 && <span className="text-slate-500">{docCount} documents</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: schedule + contact */}
      {step === 3 && office && (
        <div className="space-y-5">
          <div>
            <label htmlFor="bk-date" className="label">
              Date
            </label>
            <div className="relative">
              <CalendarDays className="field-icon" />
              <input
                id="bk-date"
                type="date"
                min={today}
                max={maxDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input input-icon"
                aria-invalid={!!errors.date}
              />
            </div>
            {errors.date ? <p className="error-text">{errors.date}</p> : <p className="hint">{formatDate(date, 'EEEE, d MMMM')}</p>}
          </div>

          <div>
            <span className="label">{t.bookingWizard.arrivalTimeLabel}</span>
            <div className="grid grid-cols-4 gap-2">
              {SLOTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSlot(s)}
                  disabled={slotDisabled(s)}
                  className={cn('option h-10 text-center text-xs font-semibold disabled:opacity-30', slot === s && 'option-active')}
                  aria-pressed={slot === s}
                >
                  {s}
                </button>
              ))}
            </div>
            {touched && errors.slot && <p className="error-text">{errors.slot}</p>}
            {office.working_hours.lunch && (
              <p className="hint">Lunch break: {office.working_hours.lunch}. Your buddy holds the spot through it.</p>
            )}
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="bk-hours" className="label">
                {t.bookingWizard.expectedWaitLabel}
              </label>
              <span className="font-display text-sm font-bold text-amber-300">{hours} hrs</span>
            </div>
            <input
              id="bk-hours"
              type="range"
              min={1}
              max={5}
              step={0.5}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <p className="hint">
              Up to {BASE_HOURS} hrs included. Extra time is {formatINR(EXTRA_HOUR_FEE)}/hr.
              {service && ` Typical wait here: ~${Math.round(service.estimated_wait_minutes / 30) / 2} hrs.`}
            </p>
          </div>

          <div className="grid gap-4 border-t border-white/[0.06] pt-5 sm:grid-cols-2">
            <div>
              <label htmlFor="bk-name" className="label">
                Your name
              </label>
              <div className="relative">
                <User className="field-icon" />
                <input
                  id="bk-name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input input-icon"
                  aria-invalid={touched && !!errors.name}
                />
              </div>
              {touched && errors.name && <p className="error-text">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="bk-phone" className="label">
                WhatsApp number
              </label>
              <div className="relative">
                <Phone className="field-icon" />
                <input
                  id="bk-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="98450 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input input-icon"
                  aria-invalid={touched && !!errors.phone}
                />
              </div>
              {touched && errors.phone ? (
                <p className="error-text">{errors.phone}</p>
              ) : (
                <p className="hint">Your buddy messages you here when it&apos;s time.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: language */}
      {step === 4 && (
        <div className="space-y-5">
          <p className="text-sm text-slate-400">{t.bookingWizard.preferredLangDesc}</p>
          <div>
            <span className="label">{t.bookingWizard.primaryLang}</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setPrimaryLang(l);
                    if (backupLang === l) setBackupLang(undefined);
                  }}
                  className={cn('option flex h-12 items-center justify-between px-3.5 text-sm font-semibold', primaryLang === l && 'option-active')}
                  aria-pressed={primaryLang === l}
                >
                  {l}
                  {primaryLang === l && <Check className="h-4 w-4 text-amber-300" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">{t.bookingWizard.backupLang}</span>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.filter((l) => l !== primaryLang).map((l) => (
                <button
                  key={l}
                  onClick={() => setBackupLang(backupLang === l ? undefined : l)}
                  className={cn('chip', backupLang === l && 'chip-active')}
                  aria-pressed={backupLang === l}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <Alert tone="info">
            We match a verified buddy who speaks <strong>{primaryLang}</strong>
            {backupLang ? (
              <>
                , or <strong>{backupLang}</strong> if none are free
              </>
            ) : null}
            . If nobody is free yet, your booking is queued and the first matching buddy picks it up.
          </Alert>
        </div>
      )}

      {/* Step 5: review */}
      {step === 5 && office && service && (
        <div className="space-y-5">
          <dl className="card-muted divide-y divide-white/[0.05] text-sm">
            <Row icon={<MapPin className="h-4 w-4" />} label="Office" value={office.name} />
            <Row icon={<Ticket className="h-4 w-4" />} label="Service" value={service.title} />
            <Row
              icon={<Clock className="h-4 w-4" />}
              label="When"
              value={`${formatDate(date)} · buddy arrives ${slot} · up to ${hours} hrs`}
            />
            <Row
              icon={<Languages className="h-4 w-4" />}
              label="Language"
              value={backupLang ? `${primaryLang} (backup: ${backupLang})` : primaryLang}
            />
            <Row icon={<Phone className="h-4 w-4" />} label="Contact" value={`${name} · ${normalizePhone(phone)}`} />
          </dl>

          <div className="card-muted p-4 text-sm">
            <h3 className="mb-3 text-sm font-bold">{t.bookingWizard.priceBreakdownTitle}</h3>
            <div className="space-y-2">
              <Line label="Queue Buddy service" value={formatINR(baseFee)} />
              {extraFee > 0 && <Line label={`Extra wait (${extraHours} hrs × ${formatINR(EXTRA_HOUR_FEE)})`} value={formatINR(extraFee)} />}
              <Line label="Platform & insurance" value={formatINR(PLATFORM_FEE)} />
              <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5 text-base font-bold text-white">
                <span>Pay now</span>
                <span className="font-display text-amber-300">{formatINR(total)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-white/[0.08] pt-2.5 text-xs text-slate-500">
                <span>Govt fee — you pay this directly at the counter</span>
                <span>{formatINR(service.government_fee)}</span>
              </div>
            </div>
          </div>

          {payError && <Alert tone="error">{payError}</Alert>}

          <p className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Secured by Razorpay · UPI, cards & netbanking · free cancellation until a buddy reaches the office
          </p>
        </div>
      )}

      {/* Step 6: confirmation */}
      {step === 6 && confirmed && (
        <div className="space-y-6 py-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 ring-8 ring-emerald-400/5">
            <PartyPopper className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold">You&apos;re booked!</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
              {confirmed.buddy
                ? `${confirmed.buddy.full_name} (${confirmed.buddy.languages.slice(0, 2).join(', ')}) will hold your spot.`
                : 'We are matching a verified buddy now. You will be notified as soon as one accepts.'}
            </p>
          </div>
          <div className="card-muted mx-auto max-w-sm space-y-2 p-4 text-left text-sm">
            <Line label="Booking ID" value={<span className="font-mono text-amber-300">{confirmed.booking_code}</span>} />
            <Line label="When" value={`${formatDate(confirmed.booking_date)}, ${confirmed.arrival_time}`} />
            <Line label="Paid" value={formatINR(confirmed.total_amount)} />
          </div>
          <div className="mx-auto flex max-w-sm flex-col gap-2">
            <button onClick={() => onComplete(confirmed)} className="btn btn-primary btn-lg w-full">
              Prepare my documents
              <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="btn btn-ghost btn-md w-full">
              {t.common.close}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition',
        checked ? 'border-amber-400 bg-amber-400 text-ink-950' : 'border-white/20'
      )}
      aria-hidden
    >
      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
    </span>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3.5">
      <span className="mt-0.5 text-slate-500">{icon}</span>
      <dt className="w-20 shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 flex-1 text-slate-100">{value}</dd>
    </div>
  );
}

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-slate-300">
      <span>{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}
