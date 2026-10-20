'use client';

import React, { useState } from 'react';
import { MapPin, Clock, CalendarX, FileText, Bell, ChevronDown, Navigation, Info, ArrowRight } from 'lucide-react';
import type { Office, Service } from '@/types';
import { useApp } from '@/context/AppContext';
import { CrowdStatusCard } from './CrowdStatusCard';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/Toast';
import { cn, formatINR, formatMinutes, isValidEmail, isValidIndianPhone, OFFICE_TYPE_META, relativeTime } from '@/lib/utils';

interface OfficeDetailModalProps {
  office: Office | null;
  onClose: () => void;
  onBookService: (office: Office, service: Service) => void;
}

const HOUR_LABELS: Record<string, string> = {
  mon_fri: 'Working hours',
  counter: 'Counter',
  token_issue: 'Token issue',
  khata_counter: 'Khata counter',
  cash_counter: 'Cash counter',
  lunch: 'Lunch break',
};

export const OfficeDetailModal: React.FC<OfficeDetailModalProps> = ({ office, onClose, onBookService }) => {
  const { services, checklists, registerDemand, t, locale } = useApp();
  const toast = useToast();
  const [contact, setContact] = useState('');
  const [contactError, setContactError] = useState('');
  const [notified, setNotified] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!office) return null;

  const officeServices = services.filter((s) => s.office_id === office.id);
  const soon = office.status === 'coming_soon';
  const meta = OFFICE_TYPE_META[office.office_type];

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidIndianPhone(contact) && !isValidEmail(contact)) {
      setContactError('Enter a valid 10-digit mobile number or email address.');
      return;
    }
    registerDemand(office.id, contact.trim(), 'Office launch');
    setNotified(true);
    toast({ tone: 'success', title: "You're on the list", description: `We'll notify you when ${office.area} goes live.` });
  };

  return (
    <Modal
      open={!!office}
      onClose={onClose}
      size="lg"
      title={locale === 'kn' ? office.name_kn : office.name}
      description={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold" style={{ color: meta.color }}>
            {meta.emoji} {meta.short}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {office.address}
          </span>
        </span>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${office.lat},${office.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <Navigation className="h-3.5 w-3.5" />
            Directions
          </a>
          <span className="badge border-white/10 bg-white/[0.03] text-slate-400">
            Verified {relativeTime(office.last_verified_date)}
          </span>
        </div>

        <section className="space-y-2">
          <h3 className="eyebrow">Live crowd</h3>
          <CrowdStatusCard officeId={office.id} />
        </section>

        <section className="space-y-2">
          <h3 className="eyebrow">Timings</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(office.working_hours).map(([key, value]) =>
              value ? (
                <div key={key} className="card-muted p-3">
                  <div className="text-[11px] text-slate-500">{HOUR_LABELS[key] ?? key}</div>
                  <div className={cn('mt-0.5 text-sm font-semibold', key === 'lunch' ? 'text-amber-300' : 'text-white')}>
                    {value}
                  </div>
                </div>
              ) : null
            )}
          </div>
          <p className="flex items-start gap-2 pt-1 text-xs text-slate-400">
            <CalendarX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
            Closed: {office.holidays.join(', ')}
          </p>
        </section>

        {soon ? (
          <section className="space-y-3 rounded-2xl border border-violet-400/25 bg-violet-500/[0.07] p-4">
            <div className="flex items-center gap-2 font-semibold text-violet-200">
              <Bell className="h-4 w-4" />
              Get notified when this office launches
            </div>
            <p className="text-sm text-slate-400">
              We&apos;re onboarding verified buddies here. Every request helps us prioritise the next launch.
            </p>
            {notified ? (
              <Alert tone="success">You&apos;re on the list. We&apos;ll message you as soon as bookings open.</Alert>
            ) : (
              <form onSubmit={handleNotify} className="space-y-1" noValidate>
                <div className="flex gap-2">
                  <input
                    value={contact}
                    onChange={(e) => {
                      setContact(e.target.value);
                      setContactError('');
                    }}
                    placeholder="Mobile number or email"
                    className="input"
                    aria-invalid={!!contactError}
                    aria-label="Mobile number or email"
                  />
                  <button type="submit" className="btn btn-primary btn-md shrink-0">
                    Notify me
                  </button>
                </div>
                {contactError && <p className="error-text">{contactError}</p>}
              </form>
            )}
          </section>
        ) : (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="eyebrow">{t.common.servicesOffered}</h3>
              <span className="text-xs text-slate-500">{officeServices.length} available</span>
            </div>
            {officeServices.map((service) => {
              const docs = checklists.filter((c) => c.service_id === service.id).sort((a, b) => a.order_index - b.order_index);
              const open = expanded === service.id;
              return (
                <div key={service.id} className="card-muted overflow-hidden">
                  <div className="space-y-3 p-4">
                    <div>
                      <h4 className="text-[15px] font-bold">{locale === 'kn' ? service.title_kn : service.title}</h4>
                      <p className="mt-1 text-sm text-slate-400">{service.description}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="badge border-amber-400/30 bg-amber-400/10 text-amber-200">
                        Buddy {formatINR(service.queue_buddy_base_fee)}
                      </span>
                      <span className="badge border-white/10 bg-white/[0.03] text-slate-300">
                        Govt fee {formatINR(service.government_fee)} (paid at counter)
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="h-3.5 w-3.5" /> ~{formatMinutes(service.estimated_wait_minutes)} typical wait
                      </span>
                    </div>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                      {docs.length > 0 ? (
                        <button
                          onClick={() => setExpanded(open ? null : service.id)}
                          className="btn btn-ghost btn-sm justify-start px-2 text-slate-300"
                          aria-expanded={open}
                        >
                          <FileText className="h-4 w-4" />
                          {docs.length} documents needed
                          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
                        </button>
                      ) : (
                        <span />
                      )}
                      <button onClick={() => onBookService(office, service)} className="btn btn-primary btn-md">
                        Book for this service
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {open && (
                    <ol className="space-y-2.5 border-t border-white/[0.05] bg-ink-950/40 p-4 text-sm">
                      {docs.map((doc, i) => (
                        <li key={doc.id} className="flex gap-3">
                          <span className="font-mono text-xs text-amber-400">{String(i + 1).padStart(2, '0')}</span>
                          <div>
                            <span className="font-medium text-slate-100">{locale === 'kn' ? doc.item_name_kn : doc.item_name}</span>
                            {!doc.is_mandatory && <span className="ml-1.5 text-xs text-slate-500">(optional)</span>}
                            <p className="mt-0.5 text-xs text-slate-500">{doc.help_text}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}
          </section>
        )}

        <p className="flex items-start gap-2 text-xs text-slate-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Sample data for demonstration. Always confirm timings and holidays on the office notice board.
        </p>
      </div>
    </Modal>
  );
};
