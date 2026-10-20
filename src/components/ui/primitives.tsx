'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import type { BookingStatus } from '@/types';
import { cn, STATUS_TONE } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

export function Logo({ size = 'md', href = '/', tag }: { size?: 'sm' | 'md' | 'lg'; href?: string; tag?: string }) {
  const box = size === 'lg' ? 'h-12 w-12 text-2xl rounded-2xl' : size === 'sm' ? 'h-8 w-8 text-base rounded-xl' : 'h-10 w-10 text-xl rounded-[14px]';
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5" aria-label="QueueBuddy home">
      <span
        className={cn(
          'relative flex items-center justify-center bg-gradient-to-br from-amber-300 to-amber-500 font-display font-black text-ink-950 shadow-glow transition-transform group-hover:-rotate-6',
          box
        )}
      >
        Q
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink-950 bg-emerald-400" />
      </span>
      <span className="leading-none">
        <span className={cn('block font-display font-extrabold tracking-tight text-white', size === 'lg' ? 'text-xl' : 'text-base')}>
          QueueBuddy
        </span>
        {tag && <span className="mt-1 block text-[11px] font-medium text-slate-500">{tag}</span>}
      </span>
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} aria-hidden />;
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-slate-500">
      <Spinner className="h-6 w-6 text-amber-400" />
      {label}
    </div>
  );
}

export function Alert({
  tone = 'info',
  children,
  className,
}: {
  tone?: 'info' | 'success' | 'error' | 'warning';
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    info: 'border-sky-400/20 bg-sky-400/[0.06] text-sky-200',
    success: 'border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-200',
    error: 'border-rose-400/25 bg-rose-500/[0.08] text-rose-200',
    warning: 'border-amber-400/25 bg-amber-400/[0.07] text-amber-100',
  }[tone];
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'info' ? Info : AlertCircle;
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className={cn('flex items-start gap-2.5 rounded-xl border p-3 text-sm', styles, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-90" />
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('card flex flex-col items-center px-6 py-12 text-center', className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-slate-400">
        {icon}
      </div>
      <h3 className="text-base font-bold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const { t } = useApp();
  return (
    <span className={cn('badge', STATUS_TONE[status], className)}>
      {status === 'customer_summoned' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />}
      {t.status[status]}
    </span>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <span
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 font-display text-sm font-extrabold text-ink-950',
        className
      )}
      aria-hidden
    >
      {letters || '?'}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
  accent = 'text-white',
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="card-muted p-3.5">
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className={cn('mt-1.5 font-display text-xl font-extrabold tracking-tight', accent)}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="card-muted flex cursor-pointer items-center justify-between gap-4 p-4">
      <span>
        <span className="block text-sm font-semibold text-white">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-slate-400">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0 items-center">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-white/10 transition peer-checked:bg-amber-400 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-400/60" />
        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
