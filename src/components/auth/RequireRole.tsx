'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { UserRole } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/ui/primitives';

/**
 * Client-side route guard. Real authorisation is enforced by Supabase RLS;
 * this keeps the UI from rendering a portal to the wrong audience.
 */
export function RequireRole({
  roles,
  loginPath = '/login',
  children,
  fallback,
}: {
  roles?: UserRole[];
  loginPath?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`${loginPath}?next=${encodeURIComponent(pathname || '/')}`);
    }
  }, [isLoading, user, router, loginPath, pathname]);

  if (isLoading || !user) return <PageLoader />;
  if (roles && !roles.includes(user.role)) return <>{fallback ?? <PageLoader />}</>;
  return <>{children}</>;
}
