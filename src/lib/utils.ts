import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNowStrict, format, parseISO, isValid } from 'date-fns';
import type { BookingStatus, OfficeType, CrowdReport } from '@/types';
import { MINUTES_PER_PERSON } from './config';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
export const formatINR = (amount: number) => inr.format(amount);

export function relativeTime(iso: string) {
  const d = new Date(iso);
  if (!isValid(d)) return 'recently';
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

export function formatDate(isoDate: string, pattern = 'EEE, d MMM') {
  const d = parseISO(isoDate);
  return isValid(d) ? format(d, pattern) : isoDate;
}

/** Local YYYY-MM-DD (toISOString would shift the date for IST users before 5:30 AM). */
export function toLocalDateInput(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

/** Accepts 10-digit Indian mobile numbers with optional +91 / 0 prefix and spaces. */
export function isValidIndianPhone(phone: string) {
  const digits = phone.replace(/[^\d]/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(digits);
}

export function normalizePhone(phone: string) {
  const digits = phone.replace(/[^\d]/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : phone.trim();
}

export const waLink = (phone: string) => `https://wa.me/${phone.replace(/[^\d]/g, '')}`;

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const estimateMinutes = (peopleAhead: number) => peopleAhead * MINUTES_PER_PERSON;

export function formatMinutes(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// ---------------------------------------------------------------------------
// Booking status metadata
// ---------------------------------------------------------------------------

export const BOOKING_FLOW: BookingStatus[] = [
  'requested',
  'assigned',
  'buddy_arrived',
  'in_queue',
  'customer_summoned',
  'handover_completed',
];

export const STATUS_TONE: Record<BookingStatus, string> = {
  requested: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
  assigned: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  buddy_arrived: 'border-indigo-400/30 bg-indigo-400/10 text-indigo-300',
  in_queue: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  customer_summoned: 'border-rose-400/40 bg-rose-500/15 text-rose-300',
  handover_completed: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  cancelled: 'border-slate-600/40 bg-slate-700/20 text-slate-400',
};

export const isActiveBooking = (status: BookingStatus) =>
  status !== 'handover_completed' && status !== 'cancelled';

export const canCancelBooking = (status: BookingStatus) =>
  status === 'requested' || status === 'assigned';

// ---------------------------------------------------------------------------
// Office type metadata
// ---------------------------------------------------------------------------

export const OFFICE_TYPE_META: Record<OfficeType, { short: string; emoji: string; color: string }> = {
  rto: { short: 'RTO', emoji: '🚗', color: '#818cf8' },
  sub_registrar: { short: 'Sub-Registrar', emoji: '📜', color: '#fbbf24' },
  psk: { short: 'Passport', emoji: '🛂', color: '#34d399' },
  ward_civic: { short: 'BBMP / Civic', emoji: '🏢', color: '#f472b6' },
  utility: { short: 'Utility', emoji: '⚡', color: '#22d3ee' },
  taluk: { short: 'Taluk', emoji: '🏛️', color: '#a78bfa' },
  other: { short: 'Other', emoji: '🏛️', color: '#94a3b8' },
};

// ---------------------------------------------------------------------------
// Crowd level helpers
// ---------------------------------------------------------------------------

export type CrowdLevel = 'low' | 'moderate' | 'heavy';

export function crowdLevel(peopleAhead: number): CrowdLevel {
  if (peopleAhead > 15) return 'heavy';
  if (peopleAhead > 8) return 'moderate';
  return 'low';
}

export const CROWD_TONE: Record<CrowdLevel, { label: string; className: string; dot: string }> = {
  low: { label: 'Short wait', className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300', dot: 'bg-emerald-400' },
  moderate: { label: 'Moderate', className: 'border-amber-400/30 bg-amber-400/10 text-amber-300', dot: 'bg-amber-400' },
  heavy: { label: 'Heavy queue', className: 'border-rose-400/30 bg-rose-500/10 text-rose-300', dot: 'bg-rose-400' },
};

/** Picks the most trustworthy recent report: live buddy > visitor (< 6h old) > historical. */
export function primaryCrowdReport(reports: CrowdReport[]) {
  const sorted = [...reports].sort((a, b) => b.reported_at.localeCompare(a.reported_at));
  const fresh = (r: CrowdReport) => Date.now() - new Date(r.reported_at).getTime() < 6 * 3600_000;
  return (
    sorted.find((r) => r.source === 'buddy_report' && fresh(r)) ||
    sorted.find((r) => r.source === 'customer_report' && fresh(r)) ||
    sorted.find((r) => r.source === 'historical_agg') ||
    sorted[0]
  );
}

export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
