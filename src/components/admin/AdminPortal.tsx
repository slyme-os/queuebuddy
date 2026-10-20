'use client';

import React, { useMemo, useState } from 'react';
import {
  Radar,
  UserCheck,
  Building2,
  LifeBuoy,
  TrendingUp,
  UsersRound,
  CheckCircle2,
  XCircle,
  BellRing,
  Plus,
  Send,
  Copy,
  IndianRupee,
  Inbox,
  Lock,
} from 'lucide-react';
import type { AdminSubRole, Office, OfficeType, Service, CopyType } from '@/types';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { Alert, EmptyState, Stat, StatusBadge } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/Toast';
import { cn, formatDate, formatINR, isActiveBooking, isValidEmail, OFFICE_TYPE_META, relativeTime } from '@/lib/utils';

type Tab = 'dispatch' | 'buddies' | 'offices' | 'disputes' | 'demand' | 'staff';

const ACCESS: Record<Tab, AdminSubRole[]> = {
  dispatch: ['super_admin', 'ops', 'support'],
  buddies: ['super_admin', 'ops', 'support'],
  offices: ['super_admin', 'content'],
  disputes: ['super_admin', 'support'],
  demand: ['super_admin', 'ops', 'content'],
  staff: ['super_admin'],
};
const CAN_ACT: Record<Tab, AdminSubRole[]> = {
  dispatch: ['super_admin', 'ops'],
  buddies: ['super_admin', 'ops'],
  offices: ['super_admin', 'content'],
  disputes: ['super_admin', 'support'],
  demand: [],
  staff: ['super_admin'],
};

export const AdminPortal: React.FC<{ subRole: AdminSubRole }> = ({ subRole }) => {
  const app = useApp();
  const { bookings, buddies, disputes, demands, offices } = app;

  const tabs = (
    [
      { id: 'dispatch', label: 'Dispatch', icon: Radar, count: bookings.filter((b) => isActiveBooking(b.status)).length },
      { id: 'buddies', label: 'Buddies', icon: UserCheck, count: buddies.filter((b) => b.verification_status === 'pending').length },
      { id: 'offices', label: 'Offices', icon: Building2, count: offices.length },
      { id: 'disputes', label: 'Disputes', icon: LifeBuoy, count: disputes.filter((d) => d.status === 'open').length },
      { id: 'demand', label: 'Demand', icon: TrendingUp, count: demands.length },
      { id: 'staff', label: 'Staff', icon: UsersRound, count: 0 },
    ] as const
  ).filter((t) => ACCESS[t.id].includes(subRole));

  const [tab, setTab] = useState<Tab>(tabs[0].id);
  const current: Tab = ACCESS[tab].includes(subRole) ? tab : tabs[0].id;
  const canAct = CAN_ACT[current].includes(subRole);

  const revenue = bookings.filter((b) => b.payment_status === 'paid').reduce((sum, b) => sum + b.total_amount, 0);
  const unassigned = bookings.filter((b) => b.status === 'requested').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Active queues" value={bookings.filter((b) => isActiveBooking(b.status)).length} hint={`${unassigned} awaiting a buddy`} accent="text-amber-300" />
        <Stat label="Pending buddies" value={buddies.filter((b) => b.verification_status === 'pending').length} hint="KYC review" accent="text-indigo-300" />
        <Stat label="Open disputes" value={disputes.filter((d) => d.status === 'open').length} hint="Needs action" accent="text-rose-300" />
        <Stat label="Gross bookings" value={formatINR(revenue)} hint={`${demands.length} launch requests`} icon={<IndianRupee className="h-3.5 w-3.5" />} accent="text-emerald-300" />
      </div>

      <div className="-mx-4 overflow-x-auto px-4 scrollbar-none">
        <div className="segmented" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={current === t.id}
              onClick={() => setTab(t.id)}
              className={cn('segment h-9 px-3.5', current === t.id && 'segment-active')}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.count > 0 && <span className="rounded-full bg-white/10 px-1.5 text-[10px] font-bold">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {!canAct && current !== 'demand' && (
        <Alert tone="info">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" /> Read-only for your clearance ({subRole.replace('_', ' ')}).
          </span>
        </Alert>
      )}

      {current === 'dispatch' && <DispatchTab canAct={canAct} />}
      {current === 'buddies' && <BuddiesTab canAct={canAct} />}
      {current === 'offices' && <OfficesTab canAct={canAct} />}
      {current === 'disputes' && <DisputesTab canAct={canAct} />}
      {current === 'demand' && <DemandTab />}
      {current === 'staff' && <StaffTab />}
    </div>
  );
};

// ---------------------------------------------------------------- dispatch

function DispatchTab({ canAct }: { canAct: boolean }) {
  const { bookings, buddies, reassignBuddy, updateBookingStatus, completeHandover } = useApp();
  const toast = useToast();
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const verified = buddies.filter((b) => b.verification_status === 'verified');
  const rows = bookings
    .filter((b) => filter === 'all' || isActiveBooking(b.status))
    .sort((a, b) => Number(b.status === 'requested') - Number(a.status === 'requested') || b.updated_at.localeCompare(a.updated_at));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="eyebrow">Live dispatch</h2>
        <div className="segmented">
          {(['active', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn('segment capitalize', filter === f && 'segment-active')}>
              {f}
            </button>
          ))}
        </div>
      </div>
      {rows.length === 0 && <EmptyState icon={<Inbox className="h-5 w-5" />} title="Nothing to dispatch" description="All bookings are completed." />}
      {rows.map((b) => (
        <div key={b.id} className={cn('card space-y-3 p-4', b.status === 'requested' && 'border-amber-400/30')}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-amber-300">{b.booking_code}</span>
                <StatusBadge status={b.status} />
              </div>
              <p className="mt-1 text-sm font-semibold text-white">{b.service.title}</p>
              <p className="text-xs text-slate-500">
                {b.office.name} · {formatDate(b.booking_date)} {b.arrival_time} · {b.customer_name} · {b.preferred_language}
              </p>
            </div>
            <span className="text-xs text-slate-500">{relativeTime(b.updated_at)}</span>
          </div>
          {canAct && isActiveBooking(b.status) && (
            <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.05] pt-3">
              <select
                value={b.buddy_id ?? ''}
                onChange={(e) => {
                  reassignBuddy(b.id, e.target.value);
                  toast({ tone: 'success', title: 'Buddy assigned', description: b.booking_code });
                }}
                className="input h-9 w-auto min-w-[200px] py-0 text-xs"
                aria-label="Assign buddy"
              >
                <option value="" disabled>
                  Assign a buddy…
                </option>
                {verified.map((bd) => (
                  <option key={bd.id} value={bd.id}>
                    {bd.full_name} — {bd.languages.join('/')}
                    {bd.languages.includes(b.preferred_language) ? ' ✓' : ''}
                  </option>
                ))}
              </select>
              {b.buddy_id && (
                <button
                  onClick={() => updateBookingStatus(b.id, 'customer_summoned', { notes: 'Ops: please head to the counter now.' })}
                  className="btn btn-danger-soft btn-sm"
                >
                  <BellRing className="h-3.5 w-3.5" />
                  Summon
                </button>
              )}
              {b.buddy_id && (
                <button onClick={() => completeHandover(b.id)} className="btn btn-secondary btn-sm">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark complete
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- buddies

function BuddiesTab({ canAct }: { canAct: boolean }) {
  const { buddies, verifyBuddy } = useApp();
  const toast = useToast();
  const sorted = [...buddies].sort((a, b) => Number(b.verification_status === 'pending') - Number(a.verification_status === 'pending'));
  const tone = {
    verified: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    pending: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    rejected: 'border-rose-400/30 bg-rose-500/10 text-rose-300',
  };

  return (
    <div className="space-y-3">
      <h2 className="eyebrow">Verification desk</h2>
      {sorted.map((b) => (
        <div key={b.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-white">{b.full_name}</p>
              <span className={cn('badge capitalize', tone[b.verification_status])}>{b.verification_status}</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {b.phone} · ★ {b.rating.toFixed(1)} · {b.total_jobs} jobs · {formatINR(b.earnings_balance)} balance
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {b.languages.join(', ')} — {b.preferred_zones.join(', ')}
            </p>
          </div>
          {canAct && b.verification_status !== 'verified' && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  verifyBuddy(b.id, 'verified');
                  toast({ tone: 'success', title: `${b.full_name} approved`, description: 'They can now accept jobs.' });
                }}
                className="btn btn-success btn-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve
              </button>
              {b.verification_status === 'pending' && (
                <button onClick={() => verifyBuddy(b.id, 'rejected')} className="btn btn-danger-soft btn-sm">
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- offices

const OFFICE_TYPES = Object.keys(OFFICE_TYPE_META) as OfficeType[];

function OfficesTab({ canAct }: { canAct: boolean }) {
  const { offices, services, checklists, setOfficeStatus } = useApp();
  const [addOffice, setAddOffice] = useState(false);
  const [serviceFor, setServiceFor] = useState<Office | null>(null);
  const [docFor, setDocFor] = useState<Service | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="eyebrow">Offices, services & checklists</h2>
        {canAct && (
          <button onClick={() => setAddOffice(true)} className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" />
            Add office
          </button>
        )}
      </div>
      {offices.map((o) => {
        const svc = services.filter((s) => s.office_id === o.id);
        return (
          <div key={o.id} className="card space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold" style={{ color: OFFICE_TYPE_META[o.office_type].color }}>
                  {OFFICE_TYPE_META[o.office_type].emoji} {OFFICE_TYPE_META[o.office_type].short} · {o.area}
                </p>
                <p className="mt-0.5 font-semibold text-white">{o.name}</p>
                <p className="text-xs text-slate-500">Verified {relativeTime(o.last_verified_date)}</p>
              </div>
              {canAct ? (
                <div className="segmented">
                  {(['bookable', 'coming_soon'] as const).map((s) => (
                    <button key={s} onClick={() => setOfficeStatus(o.id, s)} className={cn('segment', o.status === s && 'segment-active')}>
                      {s === 'bookable' ? 'Live' : 'Coming soon'}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="badge border-white/10 bg-white/[0.03] text-slate-300">{o.status === 'bookable' ? 'Live' : 'Coming soon'}</span>
              )}
            </div>
            <div className="space-y-1.5 border-t border-white/[0.05] pt-3">
              {svc.length === 0 && <p className="text-xs text-slate-500">No services configured yet.</p>}
              {svc.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/[0.02] px-3 py-2 text-xs">
                  <span className="min-w-0 truncate text-slate-200">{s.title}</span>
                  <span className="flex items-center gap-3 text-slate-500">
                    <span>Buddy {formatINR(s.queue_buddy_base_fee)}</span>
                    <span>Govt {formatINR(s.government_fee)}</span>
                    <span>{checklists.filter((c) => c.service_id === s.id).length} docs</span>
                    {canAct && (
                      <button onClick={() => setDocFor(s)} className="font-semibold text-amber-300 hover:underline">
                        + doc
                      </button>
                    )}
                  </span>
                </div>
              ))}
              {canAct && (
                <button onClick={() => setServiceFor(o)} className="btn btn-ghost btn-sm text-amber-300">
                  <Plus className="h-3.5 w-3.5" />
                  Add service
                </button>
              )}
            </div>
          </div>
        );
      })}

      <AddOfficeModal open={addOffice} onClose={() => setAddOffice(false)} />
      <AddServiceModal office={serviceFor} onClose={() => setServiceFor(null)} />
      <AddDocModal service={docFor} onClose={() => setDocFor(null)} />
    </div>
  );
}

function AddOfficeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addOffice } = useApp();
  const toast = useToast();
  const [f, setF] = useState({ name: '', name_kn: '', type: 'rto' as OfficeType, area: '', address: '', lat: '12.9716', lng: '77.5946', hours: '10:00 AM - 05:30 PM' });
  const [err, setErr] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = () => {
    const lat = Number(f.lat);
    const lng = Number(f.lng);
    if (!f.name.trim() || !f.area.trim() || !f.address.trim()) return setErr('Name, area and address are required.');
    if (!(lat > 12.7 && lat < 13.3 && lng > 77.3 && lng < 77.9)) return setErr('Coordinates must be within Bengaluru.');
    addOffice({
      name: f.name.trim(),
      name_kn: f.name_kn.trim() || f.name.trim(),
      office_type: f.type,
      area: f.area.trim(),
      address: f.address.trim(),
      lat,
      lng,
      status: 'coming_soon',
      working_hours: { mon_fri: f.hours, lunch: '01:30 PM - 02:15 PM' },
      holidays: ['Second Saturday', 'Fourth Saturday', 'All Sundays', 'Govt Holidays'],
    });
    toast({ tone: 'success', title: 'Office added', description: 'Listed as Coming soon until you set it Live.' });
    setErr('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add office" footer={<button onClick={submit} className="btn btn-primary btn-md w-full">Save office</button>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <In label="Name (English)" value={f.name} onChange={set('name')} className="sm:col-span-2" />
        <In label="Name (Kannada)" value={f.name_kn} onChange={set('name_kn')} className="sm:col-span-2" />
        <div>
          <label className="label">Type</label>
          <select value={f.type} onChange={set('type')} className="input">
            {OFFICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {OFFICE_TYPE_META[t].short}
              </option>
            ))}
          </select>
        </div>
        <In label="Area" value={f.area} onChange={set('area')} />
        <In label="Address" value={f.address} onChange={set('address')} className="sm:col-span-2" />
        <In label="Latitude" value={f.lat} onChange={set('lat')} inputMode="decimal" />
        <In label="Longitude" value={f.lng} onChange={set('lng')} inputMode="decimal" />
        <In label="Working hours" value={f.hours} onChange={set('hours')} className="sm:col-span-2" />
      </div>
      {err && <Alert tone="error" className="mt-4">{err}</Alert>}
    </Modal>
  );
}

function AddServiceModal({ office, onClose }: { office: Office | null; onClose: () => void }) {
  const { addService } = useApp();
  const toast = useToast();
  const [f, setF] = useState({ title: '', title_kn: '', description: '', gov: '0', fee: '299', wait: '90' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const valid = f.title.trim() && Number(f.fee) > 0;

  return (
    <Modal
      open={!!office}
      onClose={onClose}
      title="Add service"
      description={office?.name}
      footer={
        <button
          disabled={!valid}
          onClick={() => {
            addService({
              office_id: office!.id,
              title: f.title.trim(),
              title_kn: f.title_kn.trim() || f.title.trim(),
              description: f.description.trim(),
              government_fee: Number(f.gov) || 0,
              queue_buddy_base_fee: Number(f.fee),
              estimated_wait_minutes: Number(f.wait) || 60,
            });
            toast({ tone: 'success', title: 'Service added' });
            setF({ title: '', title_kn: '', description: '', gov: '0', fee: '299', wait: '90' });
            onClose();
          }}
          className="btn btn-primary btn-md w-full"
        >
          Save service
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <In label="Title (English)" value={f.title} onChange={set('title')} className="sm:col-span-3" />
        <In label="Title (Kannada)" value={f.title_kn} onChange={set('title_kn')} className="sm:col-span-3" />
        <In label="What the buddy does" value={f.description} onChange={set('description')} className="sm:col-span-3" />
        <In label="Govt fee ₹" value={f.gov} onChange={set('gov')} inputMode="numeric" />
        <In label="Buddy fee ₹" value={f.fee} onChange={set('fee')} inputMode="numeric" />
        <In label="Typical wait (min)" value={f.wait} onChange={set('wait')} inputMode="numeric" />
      </div>
    </Modal>
  );
}

function AddDocModal({ service, onClose }: { service: Service | null; onClose: () => void }) {
  const { addChecklistItem, checklists } = useApp();
  const toast = useToast();
  const [f, setF] = useState({ name: '', help: '', where: '', copy: 'original' as CopyType, copies: '1', mandatory: true });

  return (
    <Modal
      open={!!service}
      onClose={onClose}
      title="Add checklist document"
      description={service?.title}
      footer={
        <button
          disabled={!f.name.trim()}
          onClick={() => {
            addChecklistItem({
              service_id: service!.id,
              item_name: f.name.trim(),
              item_name_kn: f.name.trim(),
              help_text: f.help.trim(),
              copy_type: f.copy,
              copies_count: Math.max(1, Number(f.copies) || 1),
              is_mandatory: f.mandatory,
              where_to_get: f.where.trim() || '—',
              order_index: checklists.filter((c) => c.service_id === service!.id).length + 1,
            });
            toast({ tone: 'success', title: 'Document added to checklist' });
            setF({ name: '', help: '', where: '', copy: 'original', copies: '1', mandatory: true });
            onClose();
          }}
          className="btn btn-primary btn-md w-full"
        >
          Add document
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <In label="Document name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="sm:col-span-2" />
        <In label="Help text" value={f.help} onChange={(e) => setF({ ...f, help: e.target.value })} className="sm:col-span-2" />
        <In label="Where to get it" value={f.where} onChange={(e) => setF({ ...f, where: e.target.value })} className="sm:col-span-2" />
        <div>
          <label className="label">Copy type</label>
          <select value={f.copy} onChange={(e) => setF({ ...f, copy: e.target.value as CopyType })} className="input">
            <option value="original">Original</option>
            <option value="photocopy">Photocopy</option>
            <option value="both">Original + copy</option>
          </select>
        </div>
        <In label="Copies" value={f.copies} onChange={(e) => setF({ ...f, copies: e.target.value })} inputMode="numeric" />
        <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2">
          <input type="checkbox" checked={f.mandatory} onChange={(e) => setF({ ...f, mandatory: e.target.checked })} className="h-4 w-4 accent-amber-400" />
          Mandatory document
        </label>
      </div>
    </Modal>
  );
}

function In({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      <input {...props} className="input" />
    </div>
  );
}

// ---------------------------------------------------------------- disputes

function DisputesTab({ canAct }: { canAct: boolean }) {
  const { disputes, resolveDispute } = useApp();
  const toast = useToast();
  const [notes, setNotes] = useState<Record<string, string>>({});

  if (disputes.length === 0) return <EmptyState icon={<LifeBuoy className="h-5 w-5" />} title="No disputes" description="Customer reports will appear here." />;

  return (
    <div className="space-y-3">
      <h2 className="eyebrow">Disputes & refunds</h2>
      {disputes.map((d) => (
        <div key={d.id} className="card space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-amber-300">{d.booking_code}</p>
              <p className="text-sm font-semibold text-white">{d.customer_name}</p>
              <p className="text-xs text-slate-500">{relativeTime(d.created_at)}</p>
            </div>
            <span
              className={cn(
                'badge capitalize',
                d.status === 'open' ? 'border-rose-400/30 bg-rose-500/10 text-rose-300' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
              )}
            >
              {d.status}
            </span>
          </div>
          <p className="rounded-xl bg-ink-950/50 p-3 text-sm text-slate-300">&ldquo;{d.reason}&rdquo;</p>
          {d.admin_notes && <p className="text-xs text-slate-500">Resolution: {d.admin_notes}</p>}
          {canAct && d.status === 'open' && (
            <div className="space-y-2 border-t border-white/[0.05] pt-3">
              <input
                value={notes[d.id] ?? ''}
                onChange={(e) => setNotes({ ...notes, [d.id]: e.target.value })}
                placeholder="Resolution note (shared with customer)"
                className="input h-10 text-xs"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    resolveDispute(d.id, 'refunded', notes[d.id] || 'Full refund issued.');
                    toast({ tone: 'success', title: 'Refund issued', description: d.booking_code });
                  }}
                  className="btn btn-danger btn-sm"
                >
                  Issue full refund
                </button>
                <button
                  onClick={() => {
                    resolveDispute(d.id, 'resolved', notes[d.id] || 'Resolved with customer.');
                    toast({ tone: 'success', title: 'Dispute resolved' });
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Resolve without refund
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- demand

function DemandTab() {
  const { demands, offices } = useApp();
  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    demands.forEach((d) => map.set(d.office_id, (map.get(d.office_id) ?? 0) + 1));
    return Array.from(map.entries())
      .map(([id, count]) => ({ office: offices.find((o) => o.id === id), count }))
      .sort((a, b) => b.count - a.count);
  }, [demands, offices]);
  const max = Math.max(1, ...grouped.map((g) => g.count));

  if (demands.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-5 w-5" />}
        title="No launch requests yet"
        description="When citizens tap “Notify me” on a Coming soon office, demand shows up here to guide the next launch."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-5">
        <h2 className="eyebrow">Requests by office</h2>
        {grouped.map(({ office, count }) => (
          <div key={office?.id ?? 'unknown'} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="truncate text-slate-200">{office?.name ?? 'Unknown office'}</span>
              <span className="font-semibold text-white">{count}</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06]">
              <div className="h-2 rounded-full bg-violet-400" style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="card divide-y divide-white/[0.05]">
        {demands.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
            <span className="truncate text-slate-200">{d.phone_or_email}</span>
            <span className="shrink-0 text-xs text-slate-500">
              {offices.find((o) => o.id === d.office_id)?.area} · {relativeTime(d.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- staff

function StaffTab() {
  const { invites, addInvite } = useApp();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminSubRole>('ops');
  const [err, setErr] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setErr('Enter a valid work email.');
    if (invites.some((i) => i.email === email)) return setErr('This person already has a pending invite.');
    const inv = addInvite(email.trim(), role);
    setEmail('');
    setErr('');
    toast({ tone: 'success', title: 'Invite created', description: `One-time token ${inv.token} (expires in 7 days).` });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="card space-y-3 p-5" noValidate>
        <div>
          <h2 className="font-bold">Invite internal staff</h2>
          <p className="text-sm text-slate-400">There is no public admin sign-up. Invites expire after 7 days and require 2FA enrolment.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@queuebuddy.in" className="input" aria-label="Staff email" />
          <select value={role} onChange={(e) => setRole(e.target.value as AdminSubRole)} className="input sm:w-48" aria-label="Clearance">
            <option value="ops">Ops</option>
            <option value="support">Support</option>
            <option value="content">Content</option>
            <option value="super_admin">Super admin</option>
          </select>
          <button type="submit" className="btn btn-admin btn-md shrink-0">
            <Send className="h-4 w-4" />
            Send invite
          </button>
        </div>
        {err && <p className="error-text">{err}</p>}
      </form>
      <div className="card divide-y divide-white/[0.05]">
        {invites.map((inv) => (
          <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 p-3.5 text-sm">
            <span className="min-w-0 truncate text-slate-200">
              {inv.email} <span className="ml-1 text-xs capitalize text-indigo-300">{inv.sub_role.replace('_', ' ')}</span>
            </span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(inv.token).catch(() => undefined);
                toast({ tone: 'info', title: 'Token copied' });
              }}
              className="flex items-center gap-1.5 font-mono text-xs text-slate-500 hover:text-white"
            >
              {inv.token}
              <Copy className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
