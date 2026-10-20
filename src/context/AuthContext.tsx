'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { UserProfile, UserRole, AdminSubRole, BuddyApplication, SupportedLanguage } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type Result = { error?: string; message?: string };

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  adminSubRole: AdminSubRole | null;
  buddyApplication: BuddyApplication | null;
  signInWithGoogle: (next?: string) => Promise<Result>;
  signInWithEmail: (email: string, pass: string, next?: string) => Promise<Result>;
  signUpWithEmail: (email: string, pass: string, fullName: string, phone?: string, next?: string) => Promise<Result>;
  signInWithMagicLink: (email: string, next?: string) => Promise<Result>;
  signInAdmin: (email: string, pass: string, totp: string) => Promise<Result>;
  requestPhoneOtp: (phone: string) => Promise<Result>;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<Result>;
  resetPassword: (email: string) => Promise<Result>;
  updateProfile: (patch: Partial<Pick<UserProfile, 'full_name' | 'phone'>>) => void;
  submitBuddyApplication: (data: {
    fullName: string;
    phone: string;
    languages: SupportedLanguage[];
    preferredZones: string[];
    idType: string;
  }) => Promise<Result>;
  deleteAccountAndData: () => Promise<Result>;
  signOut: (redirectTo?: string) => Promise<void>;
  quickDemoLogin: (role: UserRole, adminSubRole?: AdminSubRole, status?: 'verified' | 'pending', next?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = 'qb_auth_user';
const APP_KEY = 'qb_buddy_application';

export const DEMO_CUSTOMER: UserProfile = {
  id: 'usr-customer-1',
  email: 'arjun.mehta@example.com',
  phone: '+91 98451 99887',
  full_name: 'Arjun Mehta',
  role: 'customer',
  created_at: '2026-09-01T10:00:00Z',
};

const DEMO_BUDDY_VERIFIED: UserProfile = {
  id: 'usr-buddy-verified',
  email: 'ramesh.gowda@buddy.queuebuddy.in',
  phone: '+91 98450 12345',
  full_name: 'Ramesh Gowda',
  role: 'buddy',
  created_at: '2026-08-15T10:00:00Z',
};

const DEMO_BUDDY_PENDING: UserProfile = {
  id: 'usr-buddy-pending',
  email: 'manjunath.k@buddy.queuebuddy.in',
  phone: '+91 97400 98765',
  full_name: 'Manjunath K.',
  role: 'buddy',
  created_at: '2026-10-01T10:00:00Z',
};

export const homeForRole = (role: UserRole) => (role === 'buddy' ? '/buddy' : role === 'admin' ? '/admin' : '/app');

/** Only allow same-origin relative redirects. */
const safeNext = (next?: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : undefined);

const readJSON = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const callbackUrl = (next?: string) => `${window.location.origin}${safeNext(next) || '/app'}`;

async function profileFromSupabase(u: User): Promise<UserProfile> {
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role, admin_sub_role')
    .eq('user_id', u.id)
    .maybeSingle();
  return {
    id: u.id,
    email: u.email || '',
    phone: u.phone || (u.user_metadata?.phone as string | undefined),
    full_name: (u.user_metadata?.full_name as string) || u.email?.split('@')[0] || 'QueueBuddy user',
    role: (roleData?.role as UserRole) || 'customer',
    admin_sub_role: (roleData?.admin_sub_role as AdminSubRole) || undefined,
    avatar_url: u.user_metadata?.avatar_url as string | undefined,
    created_at: u.created_at,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [buddyApplication, setBuddyApplication] = useState<BuddyApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const live = isSupabaseConfigured();

  const persistUser = useCallback((u: UserProfile | null) => {
    setUser(u);
    try {
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
      else localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const persistApplication = useCallback((app: BuddyApplication | null) => {
    setBuddyApplication(app);
    try {
      if (app) localStorage.setItem(APP_KEY, JSON.stringify(app));
      else localStorage.removeItem(APP_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setBuddyApplication(readJSON<BuddyApplication>(APP_KEY));

    if (!live) {
      setUser(readJSON<UserProfile>(USER_KEY));
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      setUser(session?.user ? await profileFromSupabase(session.user) : null);
      setIsLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      setUser(session?.user ? await profileFromSupabase(session.user) : null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [live]);

  const go = useCallback((role: UserRole, next?: string) => router.push(safeNext(next) || homeForRole(role)), [router]);

  // ---------------------------------------------------------------- customers

  const signInWithGoogle = useCallback(
    async (next?: string): Promise<Result> => {
      try {
        if (live) {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: callbackUrl(next) },
          });
          return error ? { error: error.message } : {};
        }
        persistUser({ ...DEMO_CUSTOMER, id: 'usr-google-demo', email: 'citizen@gmail.com', full_name: 'Bengaluru Citizen' });
        go('customer', next);
        return {};
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Google sign-in failed' };
      }
    },
    [live, persistUser, go]
  );

  const signInWithEmail = useCallback(
    async (email: string, pass: string, next?: string): Promise<Result> => {
      try {
        if (live) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
          if (error) return { error: error.message };
          const profile = await profileFromSupabase(data.user);
          setUser(profile);
          go(profile.role, next);
          return {};
        }
        if (pass.length < 6) return { error: 'Password must be at least 6 characters.' };
        const existing = readJSON<UserProfile>(USER_KEY);
        const profile: UserProfile =
          existing && existing.email === email
            ? existing
            : {
                id: `usr-${email.replace(/[^a-z0-9]/gi, '').slice(0, 24)}`,
                email,
                full_name: email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                role: 'customer',
                created_at: new Date().toISOString(),
              };
        persistUser(profile);
        go(profile.role, next);
        return {};
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Sign in failed' };
      }
    },
    [live, persistUser, go]
  );

  const signUpWithEmail = useCallback(
    async (email: string, pass: string, fullName: string, phone?: string, next?: string): Promise<Result> => {
      try {
        if (pass.length < 8) return { error: 'Use at least 8 characters for your password.' };
        if (live) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password: pass,
            options: { data: { full_name: fullName, phone }, emailRedirectTo: callbackUrl(next) },
          });
          if (error) return { error: error.message };
          if (!data.session) return { message: `Almost there! We sent a confirmation link to ${email}.` };
          setUser(await profileFromSupabase(data.user!));
          go('customer', next);
          return {};
        }
        persistUser({
          id: `usr-${Date.now()}`,
          email,
          phone,
          full_name: fullName,
          role: 'customer',
          created_at: new Date().toISOString(),
        });
        go('customer', next);
        return {};
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Sign up failed' };
      }
    },
    [live, persistUser, go]
  );

  const signInWithMagicLink = useCallback(
    async (email: string, next?: string): Promise<Result> => {
      try {
        if (live) {
          const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: callbackUrl(next) } });
          if (error) return { error: error.message };
          return { message: `Magic link sent to ${email}. Open it on this device to sign in.` };
        }
        return { message: `Demo mode: no email is sent. Use a 1-click persona or sign in with any password.` };
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Could not send magic link' };
      }
    },
    [live]
  );

  const resetPassword = useCallback(
    async (email: string): Promise<Result> => {
      try {
        if (live) {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/account`,
          });
          if (error) return { error: error.message };
        }
        return { message: `If an account exists for ${email}, a reset link is on its way.` };
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Could not send reset link' };
      }
    },
    [live]
  );

  // ------------------------------------------------------------------- admins

  const signInAdmin = useCallback(
    async (email: string, pass: string, totp: string): Promise<Result> => {
      if (!/^\d{6}$/.test(totp)) return { error: 'Enter the 6-digit code from your authenticator app.' };
      try {
        if (live) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
          if (error) return { error: error.message };
          const profile = await profileFromSupabase(data.user);
          if (profile.role !== 'admin') {
            await supabase.auth.signOut();
            return { error: 'This account does not have admin clearance.' };
          }
          const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
          if (fErr) return { error: fErr.message };
          const factor = factors.totp.find((f) => f.status === 'verified');
          if (!factor) {
            await supabase.auth.signOut();
            return { error: 'TOTP 2FA is not enrolled for this admin. Ask a super admin to enrol you.' };
          }
          const { error: vErr } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: totp });
          if (vErr) {
            await supabase.auth.signOut();
            return { error: 'Invalid 2FA code. Please try again.' };
          }
          setUser({ ...profile, mfa_enabled: true });
          router.push('/admin');
          return {};
        }
        if (pass.length < 6) return { error: 'Password must be at least 6 characters.' };
        const prefix = email.split('@')[0].toLowerCase();
        const sub: AdminSubRole = prefix.startsWith('ops')
          ? 'ops'
          : prefix.startsWith('support')
            ? 'support'
            : prefix.startsWith('content')
              ? 'content'
              : 'super_admin';
        persistUser({
          id: `usr-admin-${sub}`,
          email,
          full_name: `${sub === 'super_admin' ? 'Super' : sub[0].toUpperCase() + sub.slice(1)} Admin`,
          role: 'admin',
          admin_sub_role: sub,
          created_at: new Date().toISOString(),
          mfa_enabled: true,
        });
        router.push('/admin');
        return {};
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Admin sign in failed' };
      }
    },
    [live, persistUser, router]
  );

  // ------------------------------------------------------------------ buddies

  const requestPhoneOtp = useCallback(
    async (phone: string): Promise<Result> => {
      try {
        if (live) {
          const { error } = await supabase.auth.signInWithOtp({ phone: phone.replace(/\s/g, '') });
          if (error) return { error: error.message };
        }
        return {};
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Could not send OTP' };
      }
    },
    [live]
  );

  const verifyPhoneOtp = useCallback(
    async (phone: string, token: string): Promise<Result> => {
      try {
        if (live) {
          const { data, error } = await supabase.auth.verifyOtp({ phone: phone.replace(/\s/g, ''), token, type: 'sms' });
          if (error) return { error: error.message };
          const profile = await profileFromSupabase(data.user!);
          setUser(profile);
          router.push(homeForRole(profile.role));
          return {};
        }
        if (token !== '123456') return { error: 'Incorrect code. In demo mode the code is 123456.' };
        const known = [DEMO_BUDDY_VERIFIED, DEMO_BUDDY_PENDING].find(
          (b) => b.phone?.replace(/\D/g, '') === phone.replace(/\D/g, '')
        );
        persistUser(
          known ?? {
            id: `usr-buddy-${phone.replace(/\D/g, '')}`,
            email: `${phone.replace(/\D/g, '')}@buddy.queuebuddy.in`,
            phone,
            full_name: 'Queue Buddy',
            role: 'buddy',
            created_at: new Date().toISOString(),
          }
        );
        router.push('/buddy');
        return {};
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'OTP verification failed' };
      }
    },
    [live, persistUser, router]
  );

  const submitBuddyApplication = useCallback<AuthContextType['submitBuddyApplication']>(
    async (data) => {
      try {
        const userId = user?.id || `usr-applicant-${data.phone.replace(/\D/g, '')}`;
        const app: BuddyApplication = {
          id: `app-${Date.now()}`,
          user_id: userId,
          full_name: data.fullName,
          phone: data.phone,
          languages: data.languages,
          preferred_zones: data.preferredZones,
          id_document_type: data.idType,
          status: 'pending',
          created_at: new Date().toISOString(),
        };
        if (live && user) {
          const { error } = await supabase.from('buddy_applications').insert({
            user_id: user.id,
            full_name: data.fullName,
            phone: data.phone,
            languages: data.languages,
            preferred_zones: data.preferredZones,
            id_document_type: data.idType,
          });
          if (error) return { error: error.message };
        }
        persistApplication(app);
        persistUser({
          id: userId,
          email: user?.email || `${data.phone.replace(/\D/g, '')}@buddy.queuebuddy.in`,
          phone: data.phone,
          full_name: data.fullName,
          role: 'buddy',
          created_at: user?.created_at || new Date().toISOString(),
        });
        router.push('/buddy');
        return {};
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Application submission failed' };
      }
    },
    [live, user, persistApplication, persistUser, router]
  );

  // ------------------------------------------------------------------ account

  const updateProfile = useCallback(
    (patch: Partial<Pick<UserProfile, 'full_name' | 'phone'>>) => {
      if (!user) return;
      const next = { ...user, ...patch };
      persistUser(next);
      if (live) supabase.auth.updateUser({ data: patch }).catch(() => undefined);
    },
    [user, live, persistUser]
  );

  const signOut = useCallback(
    async (redirectTo = '/') => {
      if (live) await supabase.auth.signOut();
      persistUser(null);
      router.push(redirectTo);
    },
    [live, persistUser, router]
  );

  const deleteAccountAndData = useCallback(async (): Promise<Result> => {
    if (live) {
      const { data } = await supabase.auth.getSession();
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        return { error: body.error || 'Could not delete your account. Please contact support.' };
      }
      await supabase.auth.signOut();
    }
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('qb_'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    setUser(null);
    setBuddyApplication(null);
    window.location.href = '/';
    return {};
  }, [live]);

  const quickDemoLogin = useCallback<AuthContextType['quickDemoLogin']>(
    (targetRole, subRole, buddyStatus = 'verified', next) => {
      let profile: UserProfile;
      if (targetRole === 'buddy') {
        profile = buddyStatus === 'pending' ? DEMO_BUDDY_PENDING : DEMO_BUDDY_VERIFIED;
        persistApplication(
          buddyStatus === 'pending'
            ? {
                id: 'app-pending-demo',
                user_id: profile.id,
                full_name: profile.full_name,
                phone: profile.phone || '',
                languages: ['Kannada', 'Telugu'],
                preferred_zones: ['Yelahanka', 'Malleshwaram'],
                id_document_type: 'Aadhaar Card',
                status: 'pending',
                created_at: new Date().toISOString(),
              }
            : null
        );
      } else if (targetRole === 'admin') {
        const sr = subRole || 'super_admin';
        profile = {
          id: `usr-admin-${sr}`,
          email: `${sr.replace('_', '')}@queuebuddy.in`,
          full_name: sr === 'super_admin' ? 'Super Admin' : `${sr[0].toUpperCase()}${sr.slice(1)} Admin`,
          role: 'admin',
          admin_sub_role: sr,
          created_at: '2026-01-01T10:00:00Z',
          mfa_enabled: true,
        };
      } else {
        profile = DEMO_CUSTOMER;
      }
      persistUser(profile);
      router.push((profile.role === 'customer' && safeNext(next)) || homeForRole(profile.role));
    },
    [persistApplication, persistUser, router]
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      role: user?.role ?? null,
      adminSubRole: user?.admin_sub_role ?? null,
      buddyApplication,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signInWithMagicLink,
      signInAdmin,
      requestPhoneOtp,
      verifyPhoneOtp,
      resetPassword,
      updateProfile,
      submitBuddyApplication,
      deleteAccountAndData,
      signOut,
      quickDemoLogin,
    }),
    [
      user,
      isLoading,
      buddyApplication,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signInWithMagicLink,
      signInAdmin,
      requestPhoneOtp,
      verifyPhoneOtp,
      resetPassword,
      updateProfile,
      submitBuddyApplication,
      deleteAccountAndData,
      signOut,
      quickDemoLogin,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
