'use client';

import React, { useState } from 'react';
import { User, Phone, Upload, Camera, CheckCircle2, ArrowRight, IndianRupee, Clock3, ShieldCheck } from 'lucide-react';
import type { SupportedLanguage } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { AuthShell } from '@/components/auth/AuthShell';
import { Alert, Spinner } from '@/components/ui/primitives';
import { cn, isValidIndianPhone, normalizePhone } from '@/lib/utils';

const LANGUAGES: SupportedLanguage[] = ['Kannada', 'English', 'Hindi', 'Tamil', 'Telugu'];
const ZONES = ['Indiranagar', 'Koramangala', 'Jayanagar', 'Bellandur', 'Central Bengaluru', 'Malleshwaram', 'Yelahanka', 'Shivajinagar', 'Lalbagh'];
const ID_TYPES = ['Aadhaar Card', 'Voter ID', 'Driving Licence', 'Passport'];

export default function BuddyApplyPage() {
  const { submitBuddyApplication } = useAuth();
  const { registerBuddyApplicant } = useApp();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [languages, setLanguages] = useState<SupportedLanguage[]>(['Kannada']);
  const [zones, setZones] = useState<string[]>([]);
  const [idType, setIdType] = useState(ID_TYPES[0]);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (fullName.trim().length < 3) return setError('Enter your full name as printed on your ID.');
    if (!isValidIndianPhone(phone)) return setError('Enter a valid 10-digit WhatsApp number.');
    if (!languages.length) return setError('Pick at least one language you speak fluently.');
    if (!zones.length) return setError('Pick at least one area you can travel to.');
    if (!idFile) return setError(`Attach a photo or PDF of your ${idType}.`);
    if (!selfie) return setError('Add a clear selfie so we can match it with your ID.');
    if (!consent) return setError('Please accept the background verification consent.');

    setBusy(true);
    const phoneNorm = normalizePhone(phone);
    registerBuddyApplicant({ fullName: fullName.trim(), phone: phoneNorm, languages, zones });
    const res = await submitBuddyApplication({ fullName: fullName.trim(), phone: phoneNorm, languages, preferredZones: zones, idType });
    setBusy(false);
    if (res.error) setError(res.error);
  };

  return (
    <AuthShell
      tag="Buddy partner"
      accent="emerald"
      wide
      title="Become a Queue Buddy"
      subtitle="Flexible work, paid per queue. Help Bengaluru skip the line."
      aside={
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            [IndianRupee, '₹300–₹500', 'per queue'],
            [Clock3, 'Your hours', 'pick any job'],
            [ShieldCheck, '24–48 hrs', 'verification'],
          ].map(([Icon, v, k]) => {
            const I = Icon as typeof IndianRupee;
            return (
              <div key={v as string} className="card-muted p-3">
                <I className="mx-auto h-4 w-4 text-emerald-300" />
                <p className="mt-1.5 text-sm font-bold text-white">{v as string}</p>
                <p className="text-[11px] text-slate-500">{k as string}</p>
              </div>
            );
          })}
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-7" noValidate>
        <Section n={1} title="About you">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ap-name" className="label">Full legal name</label>
              <div className="relative">
                <User className="field-icon" />
                <input id="ap-name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input input-icon" placeholder="As on your ID" />
              </div>
            </div>
            <div>
              <label htmlFor="ap-phone" className="label">WhatsApp number</label>
              <div className="relative">
                <Phone className="field-icon" />
                <input id="ap-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input input-icon" placeholder="98450 12345" />
              </div>
            </div>
          </div>
        </Section>

        <Section n={2} title="Languages you speak fluently" hint="Customers are matched to buddies who can talk to counter staff in their language.">
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <button key={l} type="button" onClick={() => setLanguages((s) => toggle(s, l))} className={cn('chip', languages.includes(l) && 'chip-active')} aria-pressed={languages.includes(l)}>
                {languages.includes(l) && <CheckCircle2 className="h-3.5 w-3.5" />}
                {l}
              </button>
            ))}
          </div>
        </Section>

        <Section n={3} title="Areas you can work in">
          <div className="flex flex-wrap gap-2">
            {ZONES.map((z) => (
              <button key={z} type="button" onClick={() => setZones((s) => toggle(s, z))} className={cn('chip', zones.includes(z) && 'chip-active')} aria-pressed={zones.includes(z)}>
                {z}
              </button>
            ))}
          </div>
        </Section>

        <Section n={4} title="Identity verification" hint="Used only for KYC by our ops team. Never shared with customers.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="ap-idtype" className="label">ID document</label>
              <select id="ap-idtype" value={idType} onChange={(e) => setIdType(e.target.value)} className="input">
                {ID_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <FilePick
                id="ap-id"
                accept="image/*,application/pdf"
                file={idFile}
                onFile={setIdFile}
                icon={<Upload className="h-4 w-4" />}
                label={`Upload ${idType}`}
              />
            </div>
            <div className="space-y-2">
              <span className="label">Live selfie</span>
              <FilePick
                id="ap-selfie"
                accept="image/*"
                capture="user"
                file={selfie}
                onFile={setSelfie}
                icon={<Camera className="h-4 w-4" />}
                label="Take a selfie"
                tall
              />
            </div>
          </div>
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-slate-400">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-amber-400" />
            I consent to QueueBuddy verifying my identity and running a background check, as per the DPDP Act, 2023.
          </label>
        </Section>

        {error && <Alert tone="error">{error}</Alert>}

        <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
          {busy ? <Spinner /> : 'Submit application'}
          {!busy && <ArrowRight className="h-4 w-4" />}
        </button>
        <p className="text-center text-xs text-slate-500">We review applications within 24–48 hours and confirm on WhatsApp.</p>
      </form>
    </AuthShell>
  );
}

function Section({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/15 text-xs font-bold text-amber-300">{n}</span>
        <span className="font-display font-bold text-white">{title}</span>
      </legend>
      {hint && <p className="text-sm text-slate-500">{hint}</p>}
      {children}
    </fieldset>
  );
}

function FilePick({
  id,
  accept,
  capture,
  file,
  onFile,
  icon,
  label,
  tall,
}: {
  id: string;
  accept: string;
  capture?: 'user';
  file: File | null;
  onFile: (f: File | null) => void;
  icon: React.ReactNode;
  label: string;
  tall?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed p-4 text-center text-sm transition',
        tall && 'min-h-[118px]',
        file ? 'border-emerald-400/40 bg-emerald-400/[0.06] text-emerald-200' : 'border-white/15 text-slate-400 hover:border-amber-400/50 hover:text-white'
      )}
    >
      <input id={id} type="file" accept={accept} capture={capture} className="sr-only" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      {file ? <CheckCircle2 className="h-5 w-5" /> : icon}
      <span className="max-w-full truncate font-medium">{file ? file.name : label}</span>
      {!file && <span className="text-[11px] text-slate-500">JPG, PNG or PDF · max 5 MB</span>}
    </label>
  );
}
