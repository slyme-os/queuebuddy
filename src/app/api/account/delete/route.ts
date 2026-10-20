import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DPDP Act right-to-erasure: deletes the caller's auth user. Every table references
 * auth.users / profiles with ON DELETE CASCADE, so personal data is erased with it.
 */
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Account deletion is not configured on this server.' }, { status: 501 });
  }

  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

  const { error: delError } = await admin.auth.admin.deleteUser(data.user.id);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
