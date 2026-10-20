'use client';

import { useSearchParams } from 'next/navigation';
import { CustomerHome } from '@/components/customer/CustomerHome';
import { RequireRole } from '@/components/auth/RequireRole';

export default function CustomerDashboardPage() {
  const sp = useSearchParams();
  return (
    <RequireRole>
      <CustomerHome
        params={{
          tab: sp.get('tab'),
          book: sp.get('book'),
          service: sp.get('service'),
          booking: sp.get('booking'),
          panel: sp.get('panel'),
        }}
      />
    </RequireRole>
  );
}
