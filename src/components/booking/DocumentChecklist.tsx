'use client';

import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Check, Printer, ShieldCheck, MapPin, PartyPopper, AlertTriangle } from 'lucide-react';
import type { Booking, DocumentChecklistItem } from '@/types';
import { useApp } from '@/context/AppContext';
import { cn, formatDate } from '@/lib/utils';

interface DocumentChecklistProps {
  booking: Booking;
  items: DocumentChecklistItem[];
  onToggleItem: (itemId: string) => void;
}

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({ booking, items, onToggleItem }) => {
  const { t, locale } = useApp();
  const checked = booking.checklist_progress || [];
  const sorted = [...items].sort((a, b) => Number(b.is_mandatory) - Number(a.is_mandatory) || a.order_index - b.order_index);
  const mandatory = items.filter((i) => i.is_mandatory);
  const mandatoryDone = mandatory.filter((i) => checked.includes(i.id)).length;
  const done = items.filter((i) => checked.includes(i.id)).length;
  const allReady = mandatory.length > 0 && mandatoryDone === mandatory.length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  // Celebrate only on the transition to "all mandatory ready", not when opening an already-complete list.
  const wasReady = useRef(allReady);
  useEffect(() => {
    if (allReady && !wasReady.current) {
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 }, colors: ['#FBBF24', '#34D399', '#818CF8'] });
    }
    wasReady.current = allReady;
  }, [allReady]);

  const r = 22;
  const c = 2 * Math.PI * r;

  const copyLabel = (item: DocumentChecklistItem) =>
    item.copy_type === 'original'
      ? item.copies_count > 1
        ? `${item.copies_count} originals`
        : t.checklist.original
      : item.copy_type === 'photocopy'
        ? `${item.copies_count} ${t.checklist.photocopy}${item.copies_count > 1 ? 's' : ''}`
        : `${t.checklist.both} ×${item.copies_count}`;

  return (
    <div className="print-area space-y-4">
      <div className="card flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <h2 className="text-lg font-bold">{t.checklist.title}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {booking.service.title} · {formatDate(booking.booking_date)}
          </p>
        </div>
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center no-print" aria-label={`${pct}% ready`}>
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r={r} strokeWidth="5" className="fill-none stroke-white/10" />
            <circle
              cx="28"
              cy="28"
              r={r}
              strokeWidth="5"
              strokeLinecap="round"
              className={cn('fill-none transition-[stroke-dashoffset] duration-500', allReady ? 'stroke-emerald-400' : 'stroke-amber-400')}
              strokeDasharray={c}
              strokeDashoffset={c * (1 - pct / 100)}
            />
          </svg>
          <span className="absolute font-display text-sm font-extrabold text-white">{pct}%</span>
        </div>
      </div>

      {allReady ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-4 no-print">
          <PartyPopper className="h-5 w-5 shrink-0 text-emerald-300" />
          <div>
            <p className="text-sm font-semibold text-emerald-100">{t.checklist.allSetTitle}</p>
            <p className="text-xs text-emerald-200/70">{t.checklist.allSetDesc}</p>
          </div>
        </div>
      ) : (
        mandatory.length > 0 && (
          <p className="flex items-center gap-2 px-1 text-xs text-amber-300 no-print">
            <AlertTriangle className="h-3.5 w-3.5" />
            {mandatory.length - mandatoryDone} required {mandatory.length - mandatoryDone === 1 ? 'document' : 'documents'} still missing
          </p>
        )
      )}

      <ul className="space-y-2.5">
        {sorted.map((item) => {
          const isChecked = checked.includes(item.id);
          return (
            <li key={item.id}>
              <button
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => onToggleItem(item.id)}
                className={cn(
                  'card flex w-full items-start gap-3.5 p-4 text-left transition hover:border-white/[0.14]',
                  isChecked && 'border-emerald-400/25 bg-emerald-400/[0.04]'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition',
                    isChecked ? 'border-emerald-400 bg-emerald-400 text-ink-950' : 'border-white/20'
                  )}
                >
                  {isChecked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1 space-y-1.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={cn('text-sm font-semibold', isChecked ? 'text-slate-400 line-through' : 'text-white')}>
                      {locale === 'kn' ? item.item_name_kn : item.item_name}
                    </span>
                    {!item.is_mandatory && <span className="badge border-white/10 bg-white/[0.03] text-slate-400">{t.checklist.optional}</span>}
                  </span>
                  <span className="block text-xs text-slate-400">{item.help_text}</span>
                  <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="font-medium text-slate-300">{copyLabel(item)}</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {item.where_to_get}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
        <p className="flex items-start gap-2 text-xs text-slate-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          {t.common.privacyNote}
        </p>
        <button onClick={() => window.print()} className="btn btn-secondary btn-md shrink-0">
          <Printer className="h-4 w-4" />
          {t.common.printChecklist}
        </button>
      </div>
    </div>
  );
};
