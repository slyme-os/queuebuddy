'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Office,
  Service,
  DocumentChecklistItem,
  CrowdReport,
  BuddyProfile,
  Booking,
  Dispute,
  OfficeDemand,
  SupportedLanguage,
  BookingStatus,
  StaffInvite,
  CustomerPreferences,
  AdminSubRole,
} from '@/types';
import {
  INITIAL_OFFICES,
  INITIAL_SERVICES,
  INITIAL_CHECKLISTS,
  INITIAL_BUDDIES,
  buildSeedBookings,
  buildSeedCrowdReports,
  buildSeedDisputes,
} from '@/lib/data';
import { Locale, translations } from '@/lib/i18n';
import { SUMMON_THRESHOLD, MINUTES_PER_PERSON } from '@/lib/config';
import { uid } from '@/lib/utils';

const STORAGE_KEY = 'qb_state_v2';
const LOCALE_KEY = 'qb_locale';

interface AppData {
  offices: Office[];
  services: Service[];
  checklists: DocumentChecklistItem[];
  crowdReports: CrowdReport[];
  buddies: BuddyProfile[];
  bookings: Booking[];
  demands: OfficeDemand[];
  disputes: Dispute[];
  invites: StaffInvite[];
  preferences: CustomerPreferences;
}

const DEFAULT_PREFERENCES: CustomerPreferences = {
  preferredLanguage: 'Kannada',
  backupLanguage: 'English',
  eveningReminders: true,
  queuePings: true,
};

const buildSeed = (): AppData => ({
  offices: INITIAL_OFFICES,
  services: INITIAL_SERVICES,
  checklists: INITIAL_CHECKLISTS,
  crowdReports: buildSeedCrowdReports(),
  buddies: INITIAL_BUDDIES,
  bookings: buildSeedBookings(),
  demands: [],
  disputes: buildSeedDisputes(),
  invites: [
    {
      id: 'inv-1',
      email: 'operations.lead@queuebuddy.in',
      sub_role: 'ops',
      token: 'tok_blr_ops_9812',
      created_at: new Date(Date.now() - 86_400_000 * 2).toISOString(),
    },
  ],
  preferences: DEFAULT_PREFERENCES,
});

export interface CreateBookingInput {
  officeId: string;
  serviceId: string;
  bookingDate: string;
  arrivalTime: string;
  expectedWaitHours: number;
  preferredLanguage: SupportedLanguage;
  backupLanguage?: SupportedLanguage;
  customerId: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  queueBuddyFee: number;
  governmentFee: number;
  paymentId?: string;
  orderId?: string;
}

interface AppContextType extends AppData {
  hydrated: boolean;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (typeof translations)['en'];

  // Customer
  createBooking: (data: CreateBookingInput) => Booking;
  cancelBooking: (bookingId: string, reason?: string) => void;
  toggleChecklistItem: (bookingId: string, itemId: string) => void;
  rateBooking: (bookingId: string, rating: number) => void;
  raiseDispute: (bookingId: string, reason: string) => void;
  submitCrowdReport: (
    officeId: string,
    peopleAhead: number,
    estimatedWaitMinutes: number,
    notes: string,
    source?: 'buddy_report' | 'customer_report',
    reporterName?: string
  ) => void;
  registerDemand: (officeId: string, contact: string, service?: string) => void;
  setPreferences: (prefs: Partial<CustomerPreferences>) => void;

  // Buddy
  acceptJob: (bookingId: string, buddyId: string) => void;
  updateBookingStatus: (bookingId: string, status: BookingStatus, extra?: Partial<Booking>) => void;
  postQueueUpdate: (bookingId: string, tokenNumber: string, peopleAhead: number, notes?: string) => void;
  completeHandover: (bookingId: string) => void;
  requestPayout: (buddyId: string) => number;
  registerBuddyApplicant: (data: {
    fullName: string;
    phone: string;
    languages: SupportedLanguage[];
    zones: string[];
  }) => BuddyProfile;

  // Admin
  verifyBuddy: (buddyId: string, status: 'verified' | 'rejected') => void;
  reassignBuddy: (bookingId: string, buddyId: string) => void;
  resolveDispute: (disputeId: string, status: 'resolved' | 'refunded', notes: string) => void;
  addOffice: (office: Omit<Office, 'id' | 'last_verified_date'>) => void;
  setOfficeStatus: (officeId: string, status: Office['status']) => void;
  addService: (service: Omit<Service, 'id'>) => void;
  addChecklistItem: (item: Omit<DocumentChecklistItem, 'id'>) => void;
  addInvite: (email: string, subRole: AdminSubRole) => StaffInvite;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(buildSeed);
  const [locale, setLocaleState] = useState<Locale>('en');
  const [hydrated, setHydrated] = useState(false);
  const skipNextPersist = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<AppData>;
        skipNextPersist.current = true;
        setData((seed) => ({ ...seed, ...saved, preferences: { ...DEFAULT_PREFERENCES, ...saved.preferences } }));
      }
      const savedLocale = localStorage.getItem(LOCALE_KEY);
      if (savedLocale === 'en' || savedLocale === 'kn') setLocaleState(savedLocale);
    } catch {
      // Corrupt storage: fall back to seed data.
    }
    setHydrated(true);
  }, []);

  // Persist after every change (once hydrated).
  useEffect(() => {
    if (!hydrated) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or blocked (private mode) — app still works in memory.
    }
  }, [data, hydrated]);

  // Live sync between tabs: a buddy update in one tab appears instantly in the customer's tab.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        skipNextPersist.current = true;
        setData((prev) => ({ ...prev, ...(JSON.parse(e.newValue!) as AppData) }));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'kn' ? 'kn' : 'en';
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const patchBooking = (bookings: Booking[], id: string, patch: Partial<Booking>) =>
    bookings.map((b) => (b.id === id ? { ...b, ...patch, updated_at: new Date().toISOString() } : b));

  // ------------------------------------------------------------------ customer

  const createBooking = useCallback((input: CreateBookingInput): Booking => {
    const prev = dataRef.current;
    const office = prev.offices.find((o) => o.id === input.officeId)!;
    const service = prev.services.find((s) => s.id === input.serviceId)!;
    const busy = new Set(
      prev.bookings
        .filter((b) => b.buddy_id && b.booking_date === input.bookingDate && b.status !== 'cancelled' && b.status !== 'handover_completed')
        .map((b) => b.buddy_id)
    );
    const free = prev.buddies.filter((b) => b.is_active && b.verification_status === 'verified' && !busy.has(b.id));
    const speaks = (lang?: SupportedLanguage) => (b: BuddyProfile) => !!lang && b.languages.includes(lang);
    const inZone = (b: BuddyProfile) => b.preferred_zones.some((z) => office.area.includes(z) || z.includes(office.area));
    const match =
      free.find((b) => speaks(input.preferredLanguage)(b) && inZone(b)) ||
      free.find(speaks(input.preferredLanguage)) ||
      free.find(speaks(input.backupLanguage));

    const now = new Date().toISOString();
    const created: Booking = {
      id: uid('book'),
      booking_code: `QB-BLR-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_id: input.customerId,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      buddy_id: match?.id,
      buddy: match,
      office_id: office.id,
      office,
      service_id: service.id,
      service,
      booking_date: input.bookingDate,
      arrival_time: input.arrivalTime,
      expected_wait_hours: input.expectedWaitHours,
      preferred_language: input.preferredLanguage,
      backup_language: input.backupLanguage,
      status: match ? 'assigned' : 'requested',
      queue_buddy_fee: input.queueBuddyFee,
      government_fee: input.governmentFee,
      total_amount: input.totalAmount,
      payment_status: 'paid',
      razorpay_payment_id: input.paymentId ?? `pay_demo_${Math.random().toString(36).slice(2, 10)}`,
      razorpay_order_id: input.orderId,
      checklist_progress: [],
      reminder_sent: false,
      created_at: now,
      updated_at: now,
    };
    setData((p) => ({ ...p, bookings: [created, ...p.bookings] }));
    return created;
  }, []);

  const cancelBooking = useCallback((bookingId: string, reason?: string) => {
    setData((prev) => ({
      ...prev,
      bookings: patchBooking(prev.bookings, bookingId, {
        status: 'cancelled',
        payment_status: 'refunded',
        cancel_reason: reason || 'Cancelled by customer',
      }),
    }));
  }, []);

  const toggleChecklistItem = useCallback((bookingId: string, itemId: string) => {
    setData((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => {
        if (b.id !== bookingId) return b;
        const current = b.checklist_progress || [];
        return {
          ...b,
          checklist_progress: current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
        };
      }),
    }));
  }, []);

  const rateBooking = useCallback((bookingId: string, rating: number) => {
    setData((prev) => {
      const booking = prev.bookings.find((b) => b.id === bookingId);
      if (!booking) return prev;
      return {
        ...prev,
        bookings: patchBooking(prev.bookings, bookingId, { rating }),
        buddies: prev.buddies.map((bd) => {
          if (bd.id !== booking.buddy_id) return bd;
          const n = Math.max(bd.total_jobs, 1);
          return { ...bd, rating: Math.round(((bd.rating * (n - 1) + rating) / n) * 10) / 10 };
        }),
      };
    });
  }, []);

  const raiseDispute = useCallback((bookingId: string, reason: string) => {
    setData((prev) => {
      const booking = prev.bookings.find((b) => b.id === bookingId);
      if (!booking) return prev;
      const dispute: Dispute = {
        id: uid('disp'),
        booking_id: booking.id,
        booking_code: booking.booking_code,
        raised_by: booking.customer_id,
        customer_name: booking.customer_name,
        reason,
        status: 'open',
        created_at: new Date().toISOString(),
      };
      return { ...prev, disputes: [dispute, ...prev.disputes] };
    });
  }, []);

  const submitCrowdReport = useCallback<AppContextType['submitCrowdReport']>(
    (officeId, peopleAhead, estimatedWaitMinutes, notes, source = 'customer_report', reporterName) => {
      const report: CrowdReport = {
        id: uid('rep'),
        office_id: officeId,
        source,
        people_ahead: peopleAhead,
        estimated_wait_minutes: estimatedWaitMinutes,
        reported_at: new Date().toISOString(),
        reporter_name: reporterName || (source === 'buddy_report' ? 'Verified Buddy' : 'Visitor'),
        notes,
      };
      setData((prev) => ({ ...prev, crowdReports: [report, ...prev.crowdReports].slice(0, 200) }));
    },
    []
  );

  const registerDemand = useCallback((officeId: string, contact: string, service?: string) => {
    const demand: OfficeDemand = {
      id: uid('dem'),
      office_id: officeId,
      phone_or_email: contact,
      service_interest: service,
      created_at: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, demands: [demand, ...prev.demands] }));
  }, []);

  const setPreferences = useCallback((prefs: Partial<CustomerPreferences>) => {
    setData((prev) => ({ ...prev, preferences: { ...prev.preferences, ...prefs } }));
  }, []);

  // --------------------------------------------------------------------- buddy

  const updateBookingStatus = useCallback((bookingId: string, status: BookingStatus, extra?: Partial<Booking>) => {
    setData((prev) => ({ ...prev, bookings: patchBooking(prev.bookings, bookingId, { status, ...extra }) }));
  }, []);

  const acceptJob = useCallback((bookingId: string, buddyId: string) => {
    setData((prev) => {
      const buddy = prev.buddies.find((b) => b.id === buddyId);
      if (!buddy) return prev;
      return {
        ...prev,
        bookings: patchBooking(prev.bookings, bookingId, { status: 'assigned', buddy_id: buddy.id, buddy }),
      };
    });
  }, []);

  const postQueueUpdate = useCallback(
    (bookingId: string, tokenNumber: string, peopleAhead: number, notes?: string) => {
      setData((prev) => {
        const booking = prev.bookings.find((b) => b.id === bookingId);
        if (!booking) return prev;
        const status: BookingStatus = peopleAhead <= SUMMON_THRESHOLD ? 'customer_summoned' : 'in_queue';
        const buddy = prev.buddies.find((b) => b.id === booking.buddy_id);
        const report: CrowdReport = {
          id: uid('rep'),
          office_id: booking.office_id,
          source: 'buddy_report',
          people_ahead: peopleAhead,
          estimated_wait_minutes: peopleAhead * MINUTES_PER_PERSON,
          reported_at: new Date().toISOString(),
          reporter_name: buddy ? `Buddy ${buddy.full_name}` : 'Verified Buddy',
          notes: notes || `Token ${tokenNumber}: ${peopleAhead} people ahead.`,
        };
        return {
          ...prev,
          bookings: patchBooking(prev.bookings, bookingId, {
            status,
            token_number: tokenNumber,
            people_ahead: peopleAhead,
            notes: notes || booking.notes,
          }),
          crowdReports: [report, ...prev.crowdReports].slice(0, 200),
        };
      });
    },
    []
  );

  const completeHandover = useCallback((bookingId: string) => {
    setData((prev) => {
      const booking = prev.bookings.find((b) => b.id === bookingId);
      if (!booking) return prev;
      return {
        ...prev,
        bookings: patchBooking(prev.bookings, bookingId, {
          status: 'handover_completed',
          people_ahead: 0,
          notes: 'Spot handed over. Your counter transaction is underway.',
        }),
        buddies: prev.buddies.map((b) =>
          b.id === booking.buddy_id
            ? { ...b, total_jobs: b.total_jobs + 1, earnings_balance: b.earnings_balance + booking.queue_buddy_fee }
            : b
        ),
      };
    });
  }, []);

  const requestPayout = useCallback((buddyId: string) => {
    const amount = dataRef.current.buddies.find((b) => b.id === buddyId)?.earnings_balance ?? 0;
    setData((prev) => ({
      ...prev,
      buddies: prev.buddies.map((b) => (b.id === buddyId ? { ...b, earnings_balance: 0 } : b)),
    }));
    return amount;
  }, []);

  const registerBuddyApplicant = useCallback<AppContextType['registerBuddyApplicant']>((input) => {
    const profile: BuddyProfile = {
      id: uid('bud'),
      full_name: input.fullName,
      phone: input.phone,
      languages: input.languages,
      verification_status: 'pending',
      rating: 5,
      total_jobs: 0,
      earnings_balance: 0,
      is_active: false,
      preferred_zones: input.zones,
    };
    setData((prev) => ({
      ...prev,
      buddies: [profile, ...prev.buddies.filter((b) => b.phone !== input.phone)],
    }));
    return profile;
  }, []);

  // --------------------------------------------------------------------- admin

  const verifyBuddy = useCallback((buddyId: string, status: 'verified' | 'rejected') => {
    setData((prev) => ({
      ...prev,
      buddies: prev.buddies.map((b) =>
        b.id === buddyId ? { ...b, verification_status: status, is_active: status === 'verified' } : b
      ),
    }));
  }, []);

  const reassignBuddy = useCallback((bookingId: string, buddyId: string) => {
    setData((prev) => {
      const buddy = prev.buddies.find((b) => b.id === buddyId);
      const booking = prev.bookings.find((b) => b.id === bookingId);
      if (!buddy || !booking) return prev;
      return {
        ...prev,
        bookings: patchBooking(prev.bookings, bookingId, {
          buddy_id: buddy.id,
          buddy,
          status: booking.status === 'requested' ? 'assigned' : booking.status,
        }),
      };
    });
  }, []);

  const resolveDispute = useCallback((disputeId: string, status: 'resolved' | 'refunded', notes: string) => {
    setData((prev) => {
      const dispute = prev.disputes.find((d) => d.id === disputeId);
      return {
        ...prev,
        disputes: prev.disputes.map((d) => (d.id === disputeId ? { ...d, status, admin_notes: notes } : d)),
        bookings:
          status === 'refunded' && dispute
            ? prev.bookings.map((b) => (b.id === dispute.booking_id ? { ...b, payment_status: 'refunded' } : b))
            : prev.bookings,
      };
    });
  }, []);

  const addOffice = useCallback((office: Omit<Office, 'id' | 'last_verified_date'>) => {
    setData((prev) => ({
      ...prev,
      offices: [{ ...office, id: uid('off'), last_verified_date: new Date().toISOString() }, ...prev.offices],
    }));
  }, []);

  const setOfficeStatus = useCallback((officeId: string, status: Office['status']) => {
    setData((prev) => ({
      ...prev,
      offices: prev.offices.map((o) =>
        o.id === officeId ? { ...o, status, last_verified_date: new Date().toISOString() } : o
      ),
    }));
  }, []);

  const addService = useCallback((service: Omit<Service, 'id'>) => {
    setData((prev) => ({ ...prev, services: [...prev.services, { ...service, id: uid('srv') }] }));
  }, []);

  const addChecklistItem = useCallback((item: Omit<DocumentChecklistItem, 'id'>) => {
    setData((prev) => ({ ...prev, checklists: [...prev.checklists, { ...item, id: uid('chk') }] }));
  }, []);

  const addInvite = useCallback((email: string, subRole: AdminSubRole) => {
    const invite: StaffInvite = {
      id: uid('inv'),
      email,
      sub_role: subRole,
      token: `tok_blr_${subRole}_${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, invites: [invite, ...prev.invites] }));
    return invite;
  }, []);

  const resetDemoData = useCallback(() => {
    setData(buildSeed());
  }, []);

  const value = useMemo<AppContextType>(
    () => ({
      ...data,
      hydrated,
      locale,
      setLocale,
      t: translations[locale],
      createBooking,
      cancelBooking,
      toggleChecklistItem,
      rateBooking,
      raiseDispute,
      submitCrowdReport,
      registerDemand,
      setPreferences,
      acceptJob,
      updateBookingStatus,
      postQueueUpdate,
      completeHandover,
      requestPayout,
      registerBuddyApplicant,
      verifyBuddy,
      reassignBuddy,
      resolveDispute,
      addOffice,
      setOfficeStatus,
      addService,
      addChecklistItem,
      addInvite,
      resetDemoData,
    }),
    [
      data,
      hydrated,
      locale,
      setLocale,
      createBooking,
      cancelBooking,
      toggleChecklistItem,
      rateBooking,
      raiseDispute,
      submitCrowdReport,
      registerDemand,
      setPreferences,
      acceptJob,
      updateBookingStatus,
      postQueueUpdate,
      completeHandover,
      requestPayout,
      registerBuddyApplicant,
      verifyBuddy,
      reassignBuddy,
      resolveDispute,
      addOffice,
      setOfficeStatus,
      addService,
      addChecklistItem,
      addInvite,
      resetDemoData,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
