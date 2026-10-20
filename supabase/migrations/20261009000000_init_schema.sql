-- ==============================================================================
-- QueueBuddy Bengaluru - Initial Schema
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique,
  full_name text not null,
  role text not null check (role in ('customer', 'buddy', 'admin')) default 'customer',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Buddy Profiles Table
create table if not exists public.buddy_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  languages text[] not null default array['English', 'Kannada'],
  verification_status text not null check (verification_status in ('pending', 'verified', 'rejected')) default 'pending',
  rating numeric(3,2) default 5.0,
  total_jobs integer default 0,
  earnings_balance numeric(10,2) default 0.0,
  is_active boolean default true,
  current_lat double precision,
  current_lng double precision,
  preferred_zones text[] default array['East Bengaluru', 'Central Bengaluru'],
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. Offices Table
create table if not exists public.offices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_kn text not null,
  office_type text not null check (office_type in ('rto', 'sub_registrar', 'psk', 'ward_civic', 'utility', 'taluk', 'other')),
  area text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  status text not null check (status in ('bookable', 'coming_soon')) default 'bookable',
  working_hours jsonb not null default '{"mon_fri": "10:00 AM - 05:30 PM", "lunch": "01:30 PM - 02:15 PM"}'::jsonb,
  holidays text[] default array['Second Saturday', 'Fourth Saturday', 'All Sundays', 'State Holidays'],
  last_verified_date timestamptz default timezone('utc'::text, now()) not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. Services Table
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  title text not null,
  title_kn text not null,
  description text not null,
  government_fee numeric(10,2) not null default 0.00,
  queue_buddy_base_fee numeric(10,2) not null default 299.00,
  estimated_wait_minutes integer not null default 120,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. Document Checklist Templates
create table if not exists public.document_checklist_templates (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  item_name text not null,
  item_name_kn text not null,
  help_text text not null,
  copy_type text not null check (copy_type in ('original', 'photocopy', 'both')) default 'both',
  copies_count integer not null default 1,
  is_mandatory boolean not null default true,
  where_to_get text not null,
  order_index integer not null default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 6. Bookings Table
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_code text unique not null,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  buddy_id uuid references public.profiles(id) on delete set null,
  office_id uuid not null references public.offices(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  booking_date date not null,
  arrival_time time not null,
  expected_wait_hours numeric(3,1) not null default 2.0,
  preferred_language text not null default 'Kannada',
  backup_language text default 'English',
  status text not null check (status in (
    'requested',
    'assigned',
    'buddy_arrived',
    'in_queue',
    'customer_summoned',
    'handover_completed',
    'cancelled'
  )) default 'requested',
  token_number text,
  people_ahead integer,
  queue_buddy_fee numeric(10,2) not null,
  government_fee numeric(10,2) not null,
  total_amount numeric(10,2) not null,
  payment_status text not null check (payment_status in ('pending', 'paid', 'refunded', 'failed')) default 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  checklist_progress text[] default array[]::text[],
  reminder_sent boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 7. Queue Updates (Real-time live queue logs)
create table if not exists public.queue_updates (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  buddy_id uuid not null references public.profiles(id) on delete cascade,
  office_id uuid not null references public.offices(id) on delete cascade,
  token_number text,
  people_ahead integer not null,
  estimated_mins_per_person integer not null default 6,
  notes text,
  photo_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 8. Crowd Reports (Honest provenance: buddy report, historical average, customer report)
create table if not exists public.crowd_reports (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  source text not null check (source in ('buddy_report', 'customer_report', 'historical_agg')),
  people_ahead integer not null,
  estimated_wait_minutes integer not null,
  reported_at timestamptz default timezone('utc'::text, now()) not null,
  weekday integer check (weekday between 0 and 6),
  hour_of_day integer check (hour_of_day between 0 and 23),
  notes text
);

-- 9. Office Demand (Coming soon notifications)
create table if not exists public.office_demands (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete set null,
  phone_or_email text not null,
  service_interest text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 10. Disputes Table
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  raised_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null check (status in ('open', 'investigating', 'resolved', 'refunded')) default 'open',
  admin_notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.buddy_profiles enable row level security;
alter table public.offices enable row level security;
alter table public.services enable row level security;
alter table public.document_checklist_templates enable row level security;
alter table public.bookings enable row level security;
alter table public.queue_updates enable row level security;
alter table public.crowd_reports enable row level security;
alter table public.office_demands enable row level security;
alter table public.disputes enable row level security;

-- RLS Policies
-- Public read for offices, services, checklist templates, and crowd reports
create policy "Offices are viewable by everyone" on public.offices for select using (true);
create policy "Services are viewable by everyone" on public.services for select using (true);
create policy "Checklists are viewable by everyone" on public.document_checklist_templates for select using (true);
create policy "Crowd reports are viewable by everyone" on public.crowd_reports for select using (true);

-- Profiles policies
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Buddies are viewable by active users" on public.buddy_profiles for select using (true);

-- Bookings policies
create policy "Customers can view their bookings" on public.bookings for select using (auth.uid() = customer_id or auth.uid() = buddy_id);
create policy "Customers can create bookings" on public.bookings for insert with check (auth.uid() = customer_id);
create policy "Customers and assigned buddies can update bookings" on public.bookings for update using (auth.uid() = customer_id or auth.uid() = buddy_id);

-- Queue updates policies
create policy "Queue updates viewable by related customers & buddies" on public.queue_updates for select using (true);
create policy "Buddies can insert queue updates" on public.queue_updates for insert with check (auth.uid() = buddy_id);

-- Demand insertions
create policy "Anyone can register interest for office" on public.office_demands for insert with check (true);
