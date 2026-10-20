'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

export function AuthShell({
  tag,
  title,
  subtitle,
  children,
  aside,
  accent = 'amber',
  wide = false,
}: {
  tag: string;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  aside?: React.ReactNode;
  accent?: 'amber' | 'indigo' | 'emerald';
  wide?: boolean;
}) {
  const glow = {
    amber: 'bg-amber-400/15',
    indigo: 'bg-indigo-500/15',
    emerald: 'bg-emerald-400/10',
  }[accent];

  return (
    <div className="relative flex min-h-[calc(100dvh-2.5rem)] flex-col">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div className={cn('absolute -top-40 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full blur-3xl', glow)} />
      </div>

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <Logo tag={tag} />
        <Link href="/" className="btn btn-ghost btn-sm">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to offices</span>
        </Link>
      </header>

      <main id="main" className="relative flex flex-1 items-start justify-center px-4 pb-16 pt-4 sm:items-center">
        <div className={cn('w-full space-y-6', wide ? 'max-w-2xl' : 'max-w-md')}>
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
            {subtitle && <p className="mx-auto max-w-sm text-sm text-slate-400">{subtitle}</p>}
          </div>
          <div className="card p-5 sm:p-7">{children}</div>
          {aside}
        </div>
      </main>
    </div>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-widest text-slate-600">
      <span className="h-px flex-1 bg-white/[0.07]" />
      {label}
      <span className="h-px flex-1 bg-white/[0.07]" />
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.26 21.36 7.33 24 12 24z" />
      <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
    </svg>
  );
}

export function DemoPersonas({ items }: { items: { label: string; hint: string; onClick: () => void }[] }) {
  return (
    <div className="space-y-2 rounded-xl border border-dashed border-amber-400/25 bg-amber-400/[0.04] p-3">
      <p className="text-xs font-semibold text-amber-200">Try instantly (demo)</p>
      <div className="grid grid-cols-2 gap-2">
        {items.map((p) => (
          <button key={p.label} type="button" onClick={p.onClick} className="option p-2.5">
            <span className="block text-sm font-semibold text-white">{p.label}</span>
            <span className="block text-[11px] text-slate-500">{p.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
