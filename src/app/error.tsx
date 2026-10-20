'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-extrabold">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        An unexpected error occurred. Your bookings are safe — try again, or reset demo data from the top bar.
      </p>
      <button onClick={reset} className="btn btn-primary btn-md mt-6">
        <RotateCcw className="h-4 w-4" />
        Try again
      </button>
    </main>
  );
}
