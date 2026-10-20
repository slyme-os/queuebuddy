'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Ticket, UserRound } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { cn, isActiveBooking } from '@/lib/utils';

/** Mobile-only tab bar for the customer experience. */
export const BottomNav: React.FC<{ active?: 'offices' | 'queues' }> = ({ active }) => {
  const { bookings, t } = useApp();
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();

  const onQueues = active === 'queues';
  const activeCount = user ? bookings.filter((b) => b.customer_id === user.id && isActiveBooking(b.status)).length : 0;

  const items = [
    {
      href: isAuthenticated ? '/app' : '/',
      label: t.nav.explore,
      icon: Building2,
      active: active === 'offices',
    },
    {
      href: isAuthenticated ? '/app?tab=queues' : '/login?next=/app?tab=queues',
      label: t.nav.myBookings,
      icon: Ticket,
      active: onQueues,
      count: activeCount,
    },
    {
      href: isAuthenticated ? '/account' : '/login',
      label: isAuthenticated ? t.nav.account : t.nav.signIn,
      icon: UserRound,
      active: pathname === '/account' || pathname === '/login',
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-ink-950/90 pb-safe backdrop-blur-xl md:hidden no-print"
      aria-label="Primary"
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch justify-around px-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition',
              item.active ? 'text-amber-400' : 'text-slate-500 hover:text-slate-200'
            )}
          >
            {item.active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-amber-400" />}
            <span className="relative">
              <item.icon className="h-5 w-5" />
              {!!item.count && (
                <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-ink-950">
                  {item.count}
                </span>
              )}
            </span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};
