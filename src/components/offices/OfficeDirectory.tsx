'use client';

import React, { useDeferredValue, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Search, Map as MapIcon, List, Columns2, MapPin, Clock, ChevronRight, Bell, X, SearchX } from 'lucide-react';
import type { Office, OfficeType } from '@/types';
import { useApp } from '@/context/AppContext';
import { CrowdStatusCard } from './CrowdStatusCard';
import { EmptyState } from '@/components/ui/primitives';
import { cn, OFFICE_TYPE_META } from '@/lib/utils';

const OfficeMap = dynamic(() => import('@/components/map/OfficeMap').then((m) => m.OfficeMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-ink-900" />,
});

interface OfficeDirectoryProps {
  onSelectOffice: (office: Office) => void;
  onBookOffice: (office: Office) => void;
}

const TYPE_FILTERS: (OfficeType | 'all')[] = ['all', 'rto', 'sub_registrar', 'psk', 'ward_civic', 'utility', 'taluk'];

export const OfficeDirectory: React.FC<OfficeDirectoryProps> = ({ onSelectOffice, onBookOffice }) => {
  const { offices, services, t, locale } = useApp();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [type, setType] = useState<OfficeType | 'all'>('all');
  const [area, setArea] = useState('all');
  const [bookableOnly, setBookableOnly] = useState(false);
  const [view, setView] = useState<'split' | 'map' | 'list'>('split');
  const [pinned, setPinned] = useState<Office | null>(null);

  const areas = useMemo(() => Array.from(new Set(offices.map((o) => o.area))).sort(), [offices]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return offices
      .filter((o) => {
        const serviceHit = services.some((s) => s.office_id === o.id && s.title.toLowerCase().includes(q));
        const matchesQuery =
          !q ||
          o.name.toLowerCase().includes(q) ||
          o.name_kn.includes(deferredQuery.trim()) ||
          o.area.toLowerCase().includes(q) ||
          o.address.toLowerCase().includes(q) ||
          serviceHit;
        return (
          matchesQuery &&
          (type === 'all' || o.office_type === type) &&
          (area === 'all' || o.area === area) &&
          (!bookableOnly || o.status === 'bookable')
        );
      })
      .sort((a, b) => (a.status === b.status ? 0 : a.status === 'bookable' ? -1 : 1));
  }, [offices, services, deferredQuery, type, area, bookableOnly]);

  const hasFilters = query || type !== 'all' || area !== 'all' || bookableOnly;
  const clearFilters = () => {
    setQuery('');
    setType('all');
    setArea('all');
    setBookableOnly(false);
  };

  const select = (office: Office) => {
    setPinned(office);
    onSelectOffice(office);
  };

  return (
    <section id="offices" className="scroll-mt-24 space-y-4" aria-label="Office directory">
      {/* Search & filters */}
      <div className="card space-y-3 p-3 sm:p-4">
        <div className="relative">
          <Search className="field-icon" />
          <input
            type="search"
            placeholder={t.common.searchOffice}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input input-icon h-12 pr-10 text-[15px]"
            aria-label="Search offices or services"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 scrollbar-none" role="tablist" aria-label="Office type">
          {TYPE_FILTERS.map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={type === id}
              onClick={() => setType(id)}
              className={cn('chip', type === id && 'chip-active')}
            >
              {id === 'all' ? (
                t.common.allOffices
              ) : (
                <>
                  <span aria-hidden>{OFFICE_TYPE_META[id].emoji}</span>
                  {OFFICE_TYPE_META[id].short}
                </>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-3">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="input h-9 w-auto py-0 pr-8 text-xs"
              aria-label={t.common.filterByArea}
            >
              <option value="all">All areas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={bookableOnly}
                onChange={(e) => setBookableOnly(e.target.checked)}
                className="h-4 w-4 rounded accent-amber-400"
              />
              {t.common.bookableOnly}
            </label>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs font-medium text-amber-300 hover:underline">
                Clear filters
              </button>
            )}
          </div>

          <div className="segmented" role="group" aria-label="Layout">
            {(
              [
                ['split', Columns2, 'Split'],
                ['map', MapIcon, 'Map'],
                ['list', List, 'List'],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={cn('segment', view === id && 'segment-active', id === 'split' && 'hidden lg:inline-flex')}
                aria-pressed={view === id}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {view !== 'list' && (
          <div
            className={cn(
              'w-full',
              view === 'map' ? 'h-[60dvh] min-h-[420px] lg:col-span-12' : 'h-[300px] lg:sticky lg:top-24 lg:col-span-5 lg:h-[calc(100dvh-8rem)]'
            )}
          >
            <OfficeMap offices={filtered} selectedOffice={pinned} onSelectOffice={select} />
          </div>
        )}

        {view !== 'map' && (
          <div className={cn('w-full space-y-3', view === 'list' ? 'lg:col-span-12' : 'lg:col-span-7')}>
            <p className="px-1 text-xs text-slate-500" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? 'office' : 'offices'} · sample Bengaluru data
            </p>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<SearchX className="h-5 w-5" />}
                title="No offices match"
                description="Try a different area or service name, or clear your filters."
                action={
                  <button onClick={clearFilters} className="btn btn-secondary btn-md">
                    Clear filters
                  </button>
                }
              />
            ) : (
              <div className={cn('grid gap-3', view === 'list' && 'md:grid-cols-2')}>
                {filtered.map((office) => (
                  <OfficeCard
                    key={office.id}
                    office={office}
                    active={pinned?.id === office.id}
                    serviceCount={services.filter((s) => s.office_id === office.id).length}
                    name={locale === 'kn' ? office.name_kn : office.name}
                    onOpen={() => select(office)}
                    onBook={() => onBookOffice(office)}
                    bookLabel={t.common.bookBuddy}
                    soonLabel={t.common.comingSoon}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

function OfficeCard({
  office,
  active,
  serviceCount,
  name,
  onOpen,
  onBook,
  bookLabel,
  soonLabel,
}: {
  office: Office;
  active: boolean;
  serviceCount: number;
  name: string;
  onOpen: () => void;
  onBook: () => void;
  bookLabel: string;
  soonLabel: string;
}) {
  const meta = OFFICE_TYPE_META[office.office_type];
  const soon = office.status === 'coming_soon';
  return (
    <article
      className={cn(
        'card group relative p-4 transition hover:border-white/[0.14] sm:p-5',
        active && 'border-amber-400/60 ring-4 ring-amber-400/10'
      )}
    >
      <div className="flex items-start gap-3.5">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ background: `${meta.color}1f` }}
          aria-hidden
        >
          {meta.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold" style={{ color: meta.color }}>
              {meta.short}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">{office.area}</span>
            {soon && <span className="badge ml-auto border-violet-400/30 bg-violet-400/10 text-violet-300">{soonLabel}</span>}
          </div>
          <h3 className="mt-1 text-[15px] font-bold leading-snug">
            {/* Whole card is clickable via this stretched button */}
            <button onClick={onOpen} className="text-left after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
              {name}
            </button>
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{office.address}</span>
          </p>
        </div>
      </div>

      <div className="mt-3.5">
        <CrowdStatusCard officeId={office.id} compact />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.05] pt-3.5">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          {office.working_hours.mon_fri}
          {!soon && <span className="hidden text-slate-600 sm:inline">· {serviceCount} services</span>}
        </span>
        {soon ? (
          <button onClick={onOpen} className="btn btn-secondary btn-sm relative z-10">
            <Bell className="h-3.5 w-3.5" />
            Notify me
          </button>
        ) : (
          <button onClick={onBook} className="btn btn-primary btn-sm relative z-10">
            {bookLabel}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  );
}
