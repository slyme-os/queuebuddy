import Link from 'next/link';
import { Logo } from '@/components/ui/primitives';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/[0.06] pb-24 pt-10 md:pb-10 no-print">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo tag="Bengaluru" />
          <p className="max-w-xs text-sm text-slate-500">
            Verified people who hold your place in government office queues, so you only show up when it&apos;s your turn.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="eyebrow">Partners</p>
          <Link href="/buddy/apply" className="block text-slate-400 hover:text-white">
            Become a Queue Buddy
          </Link>
          <Link href="/buddy/login" className="block text-slate-400 hover:text-white">
            Buddy sign in
          </Link>
          <Link href="/admin/login" className="block text-slate-400 hover:text-white">
            Staff terminal
          </Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="eyebrow">Trust</p>
          <p className="text-slate-400">No documents uploaded or stored</p>
          <p className="text-slate-400">DPDP Act-ready data erasure</p>
          <p className="text-slate-400">Office data is sample data — verify on site</p>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl px-4 text-xs text-slate-600">
        © {new Date().getFullYear()} QueueBuddy. Not affiliated with any government department.
      </p>
    </footer>
  );
}
