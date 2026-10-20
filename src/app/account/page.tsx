'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trash2, LogOut, Download, Check, ArrowLeft } from 'lucide-react';
import type { SupportedLanguage } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { RequireRole } from '@/components/auth/RequireRole';
import { Modal } from '@/components/ui/Modal';
import { Alert, Avatar, Spinner, Toggle } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/Toast';
import { cn, isValidIndianPhone, normalizePhone } from '@/lib/utils';

const LANGS: SupportedLanguage[] = ['Kannada', 'English', 'Hindi', 'Tamil', 'Telugu'];

function AccountContent() {
  const { user, signOut, deleteAccountAndData, updateProfile } = useAuth();
  const { preferences, setPreferences, bookings, locale, setLocale } = useApp();
  const toast = useToast();
  const [name, setName] = useState(user?.full_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [profileError, setProfileError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!user) return null;
  const variant = user.role === 'buddy' ? 'buddy' : user.role === 'admin' ? 'admin' : 'customer';
  const myBookings = bookings.filter((b) => b.customer_id === user.id);

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setProfileError('Enter your full name.');
    if (phone && !isValidIndianPhone(phone)) return setProfileError('Enter a valid 10-digit mobile number.');
    setProfileError('');
    updateProfile({ full_name: name.trim(), phone: phone ? normalizePhone(phone) : undefined });
    toast({ tone: 'success', title: 'Profile updated' });
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ profile: user, preferences, bookings: myBookings }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'queuebuddy-my-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const erase = async () => {
    setDeleting(true);
    setDeleteError('');
    const res = await deleteAccountAndData();
    if (res.error) {
      setDeleting(false);
      setDeleteError(res.error);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar variant={variant} />
      <main id="main" className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-28 md:pb-12">
        <Link href={variant === 'customer' ? '/app' : `/${variant}`} className="btn btn-ghost btn-sm -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <section className="card flex items-center gap-4 p-5">
          <Avatar name={user.full_name} className="h-14 w-14 text-lg" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold">{user.full_name}</h1>
            <p className="truncate text-sm text-slate-400">{user.email}</p>
          </div>
          <span className="badge border-amber-400/30 bg-amber-400/10 capitalize text-amber-200">{user.admin_sub_role?.replace('_', ' ') ?? user.role}</span>
        </section>

        <form onSubmit={saveProfile} className="card space-y-4 p-5" noValidate>
          <h2 className="font-bold">Profile</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ac-name" className="label">Full name</label>
              <input id="ac-name" value={name} onChange={(e) => setName(e.target.value)} className="input" autoComplete="name" />
            </div>
            <div>
              <label htmlFor="ac-phone" className="label">WhatsApp number</label>
              <input id="ac-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" autoComplete="tel" placeholder="98450 12345" />
            </div>
          </div>
          {profileError && <p className="error-text">{profileError}</p>}
          <button type="submit" className="btn btn-primary btn-md">Save profile</button>
        </form>

        <section className="card space-y-5 p-5">
          <h2 className="font-bold">Preferences</h2>
          <div>
            <span className="label">App language</span>
            <div className="segmented">
              {(['en', 'kn'] as const).map((l) => (
                <button key={l} onClick={() => setLocale(l)} className={cn('segment px-4', locale === l && 'segment-active')}>
                  {l === 'en' ? 'English' : 'ಕನ್ನಡ'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Preferred buddy language (pre-filled when you book)</span>
            <div className="flex flex-wrap gap-2">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setPreferences({ preferredLanguage: l });
                    toast({ tone: 'success', title: `Buddy language set to ${l}` });
                  }}
                  className={cn('chip', preferences.preferredLanguage === l && 'chip-active')}
                  aria-pressed={preferences.preferredLanguage === l}
                >
                  {preferences.preferredLanguage === l && <Check className="h-3.5 w-3.5" />}
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Toggle
              checked={preferences.eveningReminders}
              onChange={(v) => setPreferences({ eveningReminders: v })}
              label="Evening document reminder"
              description="7:00 PM IST the day before, if any required document is unchecked."
            />
            <Toggle
              checked={preferences.queuePings}
              onChange={async (v) => {
                setPreferences({ queuePings: v });
                if (v && 'Notification' in window && Notification.permission === 'default') {
                  await Notification.requestPermission().catch(() => undefined);
                }
              }}
              label="Your-turn alerts"
              description="Push notification when only 2–3 people are ahead of you."
            />
          </div>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="font-bold">Your data</h2>
          <p className="text-sm text-slate-400">
            Under India&apos;s DPDP Act, 2023 you can download or permanently erase everything we hold about you.
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportData} className="btn btn-secondary btn-md">
              <Download className="h-4 w-4" />
              Download my data
            </button>
            <button onClick={() => signOut()} className="btn btn-secondary btn-md">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
            <button onClick={() => setConfirmOpen(true)} className="btn btn-danger-soft btn-md">
              <Trash2 className="h-4 w-4" />
              Delete account
            </button>
          </div>
        </section>
      </main>

      <Modal
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        size="sm"
        title="Delete your account?"
        description="This permanently erases your profile, phone number, bookings and preferences. It cannot be undone."
        dismissible={!deleting}
        footer={
          <button onClick={erase} disabled={confirmText !== 'DELETE' || deleting} className="btn btn-danger btn-md w-full">
            {deleting ? <Spinner /> : <Trash2 className="h-4 w-4" />}
            Erase everything
          </button>
        }
      >
        <label htmlFor="confirm" className="label">
          Type <strong className="text-white">DELETE</strong> to confirm
        </label>
        <input id="confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="input font-mono" autoComplete="off" />
        {deleteError && <Alert tone="error" className="mt-3">{deleteError}</Alert>}
      </Modal>

      {variant === 'customer' && <BottomNav />}
    </div>
  );
}

export default function AccountPage() {
  return (
    <RequireRole>
      <AccountContent />
    </RequireRole>
  );
}
