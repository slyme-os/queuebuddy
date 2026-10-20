// Central runtime configuration. Only NEXT_PUBLIC_* values are readable in the browser.

const isPlaceholder = (value?: string) =>
  !value ||
  value.includes('mock') ||
  value.includes('demo') ||
  value.includes('your-project') ||
  value.includes('your_') ||
  value.endsWith('...');

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True when real Supabase credentials are present. */
export const hasSupabase = !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey);

export const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '';

/** Rejects empty values and the sample keys shipped in .env.example. */
export const isRealRazorpayKey = (keyId?: string, secret?: string) =>
  !!keyId &&
  /^rzp_(test|live)_[A-Za-z0-9]{8,}$/.test(keyId) &&
  !keyId.includes('1234567890') &&
  (secret === undefined || (!!secret && !isPlaceholder(secret) && !secret.includes('secret_key_here')));

/** True when a real Razorpay key id is configured (test or live). */
export const hasRazorpay = isRealRazorpayKey(razorpayKeyId);

/**
 * Demo mode shows 1-click personas and runs every flow locally in the browser.
 * It defaults to ON unless explicitly disabled, so a fresh Vercel deploy works out of the box.
 */
export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false' || !hasSupabase;

export const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const mapProvider = (process.env.NEXT_PUBLIC_MAP_PROVIDER || 'osm') as 'osm' | 'maptiler';
export const mapKey = process.env.NEXT_PUBLIC_MAP_KEY || '';

export const PLATFORM_FEE = 29;
export const EXTRA_HOUR_FEE = 100;
export const BASE_HOURS = 2;
export const SUMMON_THRESHOLD = 3;
export const MINUTES_PER_PERSON = 5;
