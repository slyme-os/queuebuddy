'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, LogIn, LogOut, User, ChevronDown, LayoutDashboard, Ticket, Building2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth, homeForRole } from '@/context/AuthContext';
import { Logo, Avatar } from '@/components/ui/primitives';
import { cn, isActiveBooking } from '@/lib/utils';

type Variant = 'customer' | 'buddy' | 'admin';

const TAGS: Record<Variant, string> = {
  customer: 'Bengaluru',
  buddy: 'Buddy Partner',
  admin: 'Admin Desk',
};

export const Navbar: React.FC<{ variant?: Variant; active?: 'offices' | 'queues' }> = ({ variant = 'customer', active }) => {
  const { locale, setLocale, t, bookings } = useApp();
  const { user, isAuthenticated, signOut } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [menuOpen]);

  const activeCount = user
    ? bookings.filter((b) => b.customer_id === user.id && isActiveBooking(b.status)).length
    : 0;
  const onQueues = active === 'queues';
  const onOffices = active === 'offices';

  const links =
    variant === 'customer'
      ? [
          { href: isAuthenticated ? '/app' : '/', label: t.nav.offices, icon: Building2, active: onOffices },
          {
            href: isAuthenticated ? '/app?tab=queues' : '/login?next=/app?tab=queues',
            label: t.nav.myBookings,
            icon: Ticket,
            active: onQueues,
            count: activeCount,
          },
        ]
      : [];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl no-print">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-8">
          <Logo href={variant === 'customer' ? '/' : homeForRole(variant)} tag={TAGS[variant]} />
          {links.length > 0 && (
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
              {links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className={cn(
                    'relative inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition',
                    l.active ? 'bg-white/[0.07] text-white' : 'text-slate-400 hover:text-white'
                  )}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                  {!!l.count && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-ink-950">
                      {l.count}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocale(locale === 'en' ? 'kn' : 'en')}
            className="btn btn-ghost btn-sm"
            aria-label={locale === 'en' ? 'Switch to Kannada' : 'Switch to English'}
          >
            <Globe className="h-4 w-4 text-amber-400" />
            <span>{locale === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
          </button>

          {isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] py-1 pl-1 pr-2 transition hover:bg-white/[0.07]"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar name={user.full_name} className="h-8 w-8 rounded-lg text-xs" />
                <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-200 sm:block">
                  {user.full_name.split(' ')[0]}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 animate-scale-in overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-800 p-1.5 shadow-2xl"
                >
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-white">{user.full_name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <div className="my-1 h-px bg-white/[0.06]" />
                  <MenuLink href={homeForRole(user.role)} icon={LayoutDashboard} onClick={() => setMenuOpen(false)}>
                    {user.role === 'buddy' ? 'Buddy cockpit' : user.role === 'admin' ? 'Admin desk' : 'Dashboard'}
                  </MenuLink>
                  <MenuLink href="/account" icon={User} onClick={() => setMenuOpen(false)}>
                    {t.nav.account}
                  </MenuLink>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-rose-300 transition hover:bg-rose-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    {t.nav.signOut}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={variant === 'buddy' ? '/buddy/login' : variant === 'admin' ? '/admin/login' : `/login?next=${encodeURIComponent(pathname || '/app')}`}
              className="btn btn-primary btn-sm"
            >
              <LogIn className="h-4 w-4" />
              {t.nav.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

function MenuLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
    >
      <Icon className="h-4 w-4 text-slate-500" />
      {children}
    </Link>
  );
}
