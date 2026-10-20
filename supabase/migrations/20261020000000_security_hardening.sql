-- ==============================================================================
-- QueueBuddy Bengaluru - Security hardening
--  * Fixes infinite-recursion RLS policies that queried user_roles from inside
--    user_roles policies (Postgres error 42P17).
--  * Pins search_path on SECURITY DEFINER functions.
--  * Adds missing admin / dispute / content-management policies.
-- ==============================================================================

-- 1. Hardened role helpers (STABLE + fixed search_path)
create or replace function public.get_user_role(uid uuid)
returns text language sql stable security definer set search_path = public as $$
  select role from public.user_roles where user_id = uid limit 1;
$$;

create or replace function public.get_admin_subrole(uid uuid)
returns text language sql stable security definer set search_path = public as $$
  select admin_sub_role from public.user_roles where user_id = uid limit 1;
$$;

create or replace function public.is_admin(sub_roles text[] default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
      and (sub_roles is null or admin_sub_role = any(sub_roles))
  );
$$;

alter function public.handle_new_user() set search_path = public;

-- 2. user_roles: replace recursive policies
drop policy if exists "Admins can view all user roles" on public.user_roles;
drop policy if exists "Super admins can manage user roles" on public.user_roles;

create policy "Admins can view all user roles" on public.user_roles
  for select using (public.is_admin());

create policy "Super admins can manage user roles" on public.user_roles
  for all using (public.is_admin(array['super_admin']))
  with check (public.is_admin(array['super_admin']));

-- 3. buddy_applications / admin_invitations: use helper, applicants cannot self-approve
drop policy if exists "Buddies can view and edit own application" on public.buddy_applications;
drop policy if exists "Admins can view and review all applications" on public.buddy_applications;

create policy "Applicants can view own application" on public.buddy_applications
  for select using (auth.uid() = user_id);

create policy "Applicants can submit own application" on public.buddy_applications
  for insert with check (auth.uid() = user_id and status = 'pending');

create policy "Ops and super admins review applications" on public.buddy_applications
  for all using (public.is_admin(array['super_admin', 'ops']));

create policy "Support can view applications" on public.buddy_applications
  for select using (public.is_admin(array['support']));

drop policy if exists "Super admins can manage invites" on public.admin_invitations;
create policy "Super admins can manage invites" on public.admin_invitations
  for all using (public.is_admin(array['super_admin']))
  with check (public.is_admin(array['super_admin']));

-- 4. Bookings: admins see everything, ops can dispatch
create policy "Admins can view all bookings" on public.bookings
  for select using (public.is_admin());

create policy "Ops can update any booking" on public.bookings
  for update using (public.is_admin(array['super_admin', 'ops']));

-- 5. Disputes: customers raise & read their own, support resolves
create policy "Customers can raise disputes" on public.disputes
  for insert with check (auth.uid() = raised_by);

create policy "Customers can view own disputes" on public.disputes
  for select using (auth.uid() = raised_by);

create policy "Support can manage disputes" on public.disputes
  for all using (public.is_admin(array['super_admin', 'support']));

-- 6. Content management: offices, services, checklist templates
create policy "Content admins manage offices" on public.offices
  for all using (public.is_admin(array['super_admin', 'content']))
  with check (public.is_admin(array['super_admin', 'content']));

create policy "Content admins manage services" on public.services
  for all using (public.is_admin(array['super_admin', 'content']))
  with check (public.is_admin(array['super_admin', 'content']));

create policy "Content admins manage checklists" on public.document_checklist_templates
  for all using (public.is_admin(array['super_admin', 'content']))
  with check (public.is_admin(array['super_admin', 'content']));

-- 7. Crowd reports: signed-in users may contribute, admins moderate
create policy "Signed-in users can submit crowd reports" on public.crowd_reports
  for insert with check (auth.role() = 'authenticated');

create policy "Admins can moderate crowd reports" on public.crowd_reports
  for delete using (public.is_admin());

-- 8. Demand capture is readable by admins
create policy "Admins can view demand" on public.office_demands
  for select using (public.is_admin());
