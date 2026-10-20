'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import type { AdminSubRole } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { AdminPortal } from '@/components/admin/AdminPortal';
import { RequireRole } from '@/components/auth/RequireRole';
import { EmptyState } from '@/components/ui/primitives';
import { isDemoMode } from '@/lib/config';
import { cn } from '@/lib/utils';

const SUB_ROLES: AdminSubRole[] = ['super_admin', 'ops', 'support', 'content'];

function AdminHome() {
  const { user, adminSubRole, quickDemoLogin } = useAuth();
  const sub = adminSubRole ?? 'super_admin';

  return (
    <div className="min-h-screen">
      <Navbar variant="admin" />
      <main id="main" className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold">Operations desk</h1>
              <p className="text-sm text-slate-400">
                {user?.full_name} · <span className="capitalize text-indigo-300">{sub.replace('_', ' ')}</span> · 2FA verified
              </p>
            </div>
          </div>
          {isDemoMode && (
            <div className="segmented self-start" role="group" aria-label="Preview clearance">
              {SUB_ROLES.map((r) => (
                <button key={r} onClick={() => quickDemoLogin('admin', r)} className={cn('segment capitalize', sub === r && 'segment-active')}>
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>
        <AdminPortal key={sub} subRole={sub} />
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireRole
      roles={['admin']}
      loginPath="/admin/login"
      fallback={
        <div className="mx-auto max-w-md px-4 py-24">
          <EmptyState
            icon={<ShieldAlert className="h-5 w-5" />}
            title="Admin clearance required"
            description="This terminal is restricted to QueueBuddy operations staff with 2FA."
            action={
              <Link href="/admin/login" className="btn btn-admin btn-md">
                Staff sign in
              </Link>
            }
          />
        </div>
      }
    >
      <AdminHome />
    </RequireRole>
  );
}
