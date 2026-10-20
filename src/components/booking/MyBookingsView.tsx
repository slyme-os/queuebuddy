'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Ticket, Radar, FileCheck, CalendarPlus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { LiveQueueTracker } from './LiveQueueTracker';
import { DocumentChecklist } from './DocumentChecklist';
import { EmptyState, StatusBadge } from '@/components/ui/primitives';
import { cn, formatDate, isActiveBooking } from '@/lib/utils';

export const MyBookingsView: React.FC<{ onBrowse: () => void; focusBookingId?: string | null; initialPanel?: 'tracker' | 'checklist' }> = ({
  onBrowse,
  focusBookingId,
  initialPanel = 'tracker',
}) => {
  const { bookings, checklists, toggleChecklistItem, locale } = useApp();
  const { user } = useAuth();

  const mine = useMemo(
    () =>
      bookings
        .filter((b) => b.customer_id === user?.id)
        .sort((a, b) => {
          const activeDiff = Number(isActiveBooking(b.status)) - Number(isActiveBooking(a.status));
          return activeDiff || a.booking_date.localeCompare(b.booking_date);
        }),
    [bookings, user?.id]
  );

  const [selectedId, setSelectedId] = useState<string | null>(focusBookingId ?? mine[0]?.id ?? null);
  const [panel, setPanel] = useState<'tracker' | 'checklist'>(initialPanel);

  useEffect(() => {
    if (focusBookingId) {
      setSelectedId(focusBookingId);
      setPanel(initialPanel);
    }
  }, [focusBookingId, initialPanel]);

  useEffect(() => {
    if (!mine.find((b) => b.id === selectedId)) setSelectedId(mine[0]?.id ?? null);
  }, [mine, selectedId]);

  const selected = mine.find((b) => b.id === selectedId);
  const items = selected ? checklists.filter((c) => c.service_id === selected.service_id) : [];
  const ready = selected ? items.filter((i) => selected.checklist_progress.includes(i.id)).length : 0;

  if (mine.length === 0) {
    return (
      <EmptyState
        icon={<Ticket className="h-5 w-5" />}
        title="No queues booked yet"
        description="Book a verified buddy for your next RTO, passport or registration visit and track the line live from here."
        action={
          <button onClick={onBrowse} className="btn btn-primary btn-md">
            <CalendarPlus className="h-4 w-4" />
            Book your first buddy
          </button>
        }
      />
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
      <aside className="min-w-0 space-y-2">
        <p className="eyebrow px-1">Your bookings · {mine.length}</p>
        <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-none lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {mine.map((b) => {
            const total = checklists.filter((c) => c.service_id === b.service_id).length;
            const active = selectedId === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setSelectedId(b.id)}
                aria-current={active}
                className={cn(
                  'option w-64 shrink-0 space-y-2 p-3.5 lg:w-full',
                  active && 'option-active',
                  !isActiveBooking(b.status) && !active && 'opacity-60'
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold text-amber-300">{b.booking_code}</span>
                  <StatusBadge status={b.status} />
                </span>
                <span className="block truncate text-sm font-semibold text-white">
                  {locale === 'kn' ? b.service.title_kn : b.service.title}
                </span>
                <span className="flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate">
                    {b.office.area} · {formatDate(b.booking_date)}
                  </span>
                  {total > 0 && (
                    <span className="shrink-0">
                      {b.checklist_progress.length}/{total} docs
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {selected && (
        <div className="min-w-0 space-y-4">
          {items.length > 0 && (
            <div className="segmented w-full no-print" role="tablist">
              <button
                role="tab"
                aria-selected={panel === 'tracker'}
                onClick={() => setPanel('tracker')}
                className={cn('segment flex-1', panel === 'tracker' && 'segment-active')}
              >
                <Radar className="h-4 w-4" />
                Live queue
              </button>
              <button
                role="tab"
                aria-selected={panel === 'checklist'}
                onClick={() => setPanel('checklist')}
                className={cn('segment flex-1', panel === 'checklist' && 'segment-active')}
              >
                <FileCheck className="h-4 w-4" />
                Documents ({ready}/{items.length})
              </button>
            </div>
          )}
          {panel === 'tracker' || items.length === 0 ? (
            <LiveQueueTracker booking={selected} docsReady={ready} docsTotal={items.length} onOpenChecklist={() => setPanel('checklist')} />
          ) : (
            <DocumentChecklist booking={selected} items={items} onToggleItem={(id) => toggleChecklistItem(selected.id, id)} />
          )}
        </div>
      )}
    </div>
  );
};
