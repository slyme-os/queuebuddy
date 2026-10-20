import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
        <Compass className="h-7 w-7" />
      </span>
      <p className="font-mono text-sm text-amber-300">404</p>
      <h1 className="mt-2 text-3xl font-extrabold">This counter doesn&apos;t exist</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">The page you&apos;re looking for has moved or never existed.</p>
      <Link href="/" className="btn btn-primary btn-md mt-6">
        Back to offices
      </Link>
    </main>
  );
}
