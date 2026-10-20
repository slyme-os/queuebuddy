'use client';

import React, { useMemo, useState } from 'react';
import { Clock, Users, ShieldCheck, History, MessageSquarePlus, Sunrise } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { cn, crowdLevel, CROWD_TONE, formatMinutes, primaryCrowdReport, relativeTime, estimateMinutes } from '@/lib/utils';

const SOURCE_META = {
  buddy_report: { label: 'Live buddy report', icon: ShieldCheck, className: 'text-amber-300' },
  customer_report: { label: 'Visitor report', icon: Users, className: 'text-sky-300' },
  historical_agg: { label: 'Historical pattern', icon: History, className: 'text-violet-300' },
} as const;

export const CrowdStatusCard: React.FC<{ officeId: string; compact?: boolean }> = ({ officeId, compact = false }) => {
  const { crowdReports, t, submitCrowdReport } = useApp();
  const { user } = useAuth();
  const toast = useToast();
  const [reporting, setReporting] = useState(false);
  const [count, setCount] = useState(8);

  const reports = useMemo(() => crowdReports.filter((r) => r.office_id === officeId), [crowdReports, officeId]);
  const primary = primaryCrowdReport(reports);
  const historical = reports.find((r) => r.source === 'historical_agg');

  if (!primary) {
    if (compact) return <span className="text-xs text-slate-500">No crowd reports yet today</span>;
    return (
      <div className="card-muted p-4 text-sm text-slate-400">
        {t.common.noDataYet}
      </div>
    );
  }

  const level = crowdLevel(primary.people_ahead);
  const tone = CROWD_TONE[level];
  const source = SOURCE_META[primary.source];

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={cn('badge', tone.className)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
          {primary.people_ahead} in line · {tone.label}
        </span>
        <span className="text-slate-500">
          {primary.source === 'historical_agg' ? 'Typical' : relativeTime(primary.reported_at)}
        </span>
      </div>
    );
  }

  const submit = () => {
    submitCrowdReport(officeId, count, estimateMinutes(count), `${count} people in line right now.`, 'customer_report', user?.full_name);
    setReporting(false);
    toast({ tone: 'success', title: 'Thanks for reporting!', description: 'Your update helps other citizens plan their visit.' });
  };

  return (
    <div className="card-muted space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className={cn('flex items-center gap-1.5 text-xs font-semibold', source.className)}>
          <source.icon className="h-3.5 w-3.5" />
          {source.label}
          <span className="font-normal text-slate-500">· {relativeTime(primary.reported_at)}</span>
        </span>
        <span className={cn('badge', tone.className)}>{tone.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-ink-950/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="h-3.5 w-3.5" /> In line
          </div>
          <div className="mt-1 font-display text-2xl font-extrabold text-white">{primary.people_ahead}</div>
        </div>
        <div className="rounded-xl bg-ink-950/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" /> Est. wait
          </div>
          <div className="mt-1 font-display text-2xl font-extrabold text-white">~{formatMinutes(primary.estimated_wait_minutes)}</div>
        </div>
      </div>

      {primary.notes && <p className="text-sm italic text-slate-300">&ldquo;{primary.notes}&rdquo;</p>}

      {historical && historical.id !== primary.id && historical.notes && (
        <p className="flex items-start gap-2 text-xs text-slate-400">
          <Sunrise className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span>
            <strong className="font-semibold text-emerald-300">Pattern: </strong>
            {historical.notes}
          </span>
        </p>
      )}

      {reporting ? (
        <div className="space-y-3 rounded-xl border border-white/[0.06] bg-ink-950/50 p-3">
          <div className="flex items-center justify-between text-sm">
            <label htmlFor={`count-${officeId}`} className="text-slate-300">
              How many people are in line?
            </label>
            <span className="font-display text-lg font-bold text-amber-300">{count}</span>
          </div>
          <input
            id={`count-${officeId}`}
            type="range"
            min={0}
            max={60}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="flex gap-2">
            <button onClick={() => setReporting(false)} className="btn btn-secondary btn-sm flex-1">
              Cancel
            </button>
            <button onClick={submit} className="btn btn-primary btn-sm flex-1">
              Submit report
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.05] pt-3">
          <span className="text-[11px] text-slate-500">Reported by people on site, never AI-generated.</span>
          <button onClick={() => setReporting(true)} className="btn btn-ghost btn-sm shrink-0 text-amber-300">
            <MessageSquarePlus className="h-4 w-4" />
            I&apos;m here
          </button>
        </div>
      )}
    </div>
  );
};
