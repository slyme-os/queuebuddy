-- ==============================================================================
-- QueueBuddy Bengaluru - Auth, Roles & Multi-Tenant Access Control
-- ==============================================================================

-- 1. User Roles Table (NEVER trust client-sent roles)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  role text not null check (role in ('customer', 'buddy', 'admin')) default 'customer',
  admin_sub_role text check (admin_sub_role in ('super_admin', 'ops', 'support', 'content')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Index for speedy role lookups
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- Policies for user_roles
create policy "Users can read their own role" on public.user_roles
  for select using (auth.uid() = user_id);

create policy "Admins can view all user roles" on public.user_roles
  for select using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Super admins can manage user roles" on public.user_roles
  for all using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin' and admin_sub_role = 'super_admin'
    )
  );

-- Helper security definer functions for RLS checks
create or replace function public.get_user_role(uid uuid)
returns text language sql security definer as $$
  select role from public.user_roles where user_id = uid limit 1;
$$;

create or replace function public.get_admin_subrole(uid uuid)
returns text language sql security definer as $$
  select admin_sub_role from public.user_roles where user_id = uid limit 1;
$$;

-- Trigger to automatically assign 'customer' role on new auth sign up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, phone, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'customer'
  ) on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Buddy Applications Table (KYC Documents, Selfie, Application Status)
create table if not exists public.buddy_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  full_name text not null,
  phone text not null,
  languages text[] not null default array['English', 'Kannada'],
  preferred_zones text[] not null default array['Indiranagar'],
  id_document_type text not null default 'Aadhaar',
  id_document_url text,
  selfie_url text,
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  admin_review_notes text,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.buddy_applications enable row level security;

create policy "Buddies can view and edit own application" on public.buddy_applications
  for all using (auth.uid() = user_id);

create policy "Admins can view and review all applications" on public.buddy_applications
  for all using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Super admin invite table for inviting staff admins
create table if not exists public.admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  admin_sub_role text not null check (admin_sub_role in ('super_admin', 'ops', 'support', 'content')),
  invited_by uuid not null references auth.users(id),
  token text unique not null,
  is_accepted boolean default false,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.admin_invitations enable row level security;

create policy "Super admins can manage invites" on public.admin_invitations
  for all using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin' and admin_sub_role = 'super_admin'
    )
  );
