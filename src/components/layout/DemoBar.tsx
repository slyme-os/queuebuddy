'use client';

import React, { useState } from 'react';
import { FlaskConical, RotateCcw, X } from 'lucide-react';
import { isDemoMode } from '@/lib/config';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

/**
 * Slim banner shown only in demo mode. Lets reviewers jump between personas and reset data.
 * Hidden entirely when NEXT_PUBLIC_DEMO_MODE=false and Supabase is configured.
 */
export function DemoBar() {
  const { user, quickDemoLogin } = useAuth();
  const { resetDemoData } = useApp();
  const toast = useToast();
  const [hidden, setHidden] = useState(false);

  if (!isDemoMode || hidden) return null;

  const personas = [
    {
      label: 'Customer',
      active: user?.role === 'customer',
      // On /login, resume wherever the guest was heading (e.g. a booking they started).
      go: () => quickDemoLogin('customer', undefined, undefined, new URLSearchParams(window.location.search).get('next') ?? undefined),
    },
    { label: 'Buddy', active: user?.role === 'buddy', go: () => quickDemoLogin('buddy') },
    { label: 'Admin', active: user?.role === 'admin', go: () => quickDemoLogin('admin', 'super_admin') },
  ];

  return (
    <div className="relative z-50 border-b border-amber-400/15 bg-gradient-to-r from-amber-400/[0.09] via-ink-950 to-ink-950 text-xs no-print">
      <div className="mx-auto flex h-10 max-w-6xl items-center gap-3 px-4">
        <span className="flex shrink-0 items-center gap-1.5 font-semibold text-amber-300">
          <FlaskConical className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Demo mode</span>
        </span>
        <span className="hidden text-slate-500 lg:inline">Data stays in your browser · open two tabs to see live sync</span>
        <div className="ml-auto flex items-center gap-1 overflow-x-auto scrollbar-none">
          <span className="mr-1 hidden text-slate-500 sm:inline">View as</span>
          {personas.map((p) => (
            <button
              key={p.label}
              onClick={p.go}
              className={cn(
                'h-7 shrink-0 rounded-lg px-2.5 font-semibold transition',
                p.active ? 'bg-amber-400 text-ink-950' : 'text-slate-300 hover:bg-white/[0.07]'
              )}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => {
              resetDemoData();
              toast({ tone: 'info', title: 'Demo data reset', description: 'Offices, bookings and buddies restored.' });
            }}
            className="ml-1 flex h-7 shrink-0 items-center gap-1 rounded-lg px-2 text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
            title="Reset demo data"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={() => setHidden(true)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:text-white"
            aria-label="Hide demo bar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
