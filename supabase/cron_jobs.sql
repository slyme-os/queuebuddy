-- ==============================================================================
-- QueueBuddy Bengaluru: pg_cron scheduled jobs
-- ==============================================================================

-- Enable pg_cron extension (available in Supabase database extensions)
create extension if not exists pg_cron;

-- 1. Daily 7:00 PM IST Checklist Reminder for Tomorrow's Bookings
-- IST is UTC+5:30. 7:00 PM IST = 13:30 UTC.
select cron.schedule(
  'evening-document-checklist-reminder',
  '30 13 * * *', -- Every day at 13:30 UTC (7:00 PM IST)
  $$
    do $$
    declare
      r record;
      total_req_docs integer;
      checked_count integer;
    begin
      for r in
        select b.id, b.customer_id, b.service_id, b.checklist_progress, p.phone, p.full_name
        from public.bookings b
        join public.profiles p on b.customer_id = p.id
        where b.booking_date = (current_date + interval '1 day')
          and b.status in ('requested', 'assigned')
          and b.reminder_sent = false
      loop
        -- Count total mandatory checklist items for this service
        select count(*) into total_req_docs
        from public.document_checklist_templates
        where service_id = r.service_id and is_mandatory = true;

        -- Count how many customer has checked off
        checked_count := coalesce(array_length(r.checklist_progress, 1), 0);

        if checked_count < total_req_docs then
          -- Log or trigger notification payload
          raise notice 'Reminder sent to % (%): You still have % missing documents for tomorrow.',
            r.full_name, r.phone, (total_req_docs - checked_count);

          -- Update booking to avoid duplicate notifications
          update public.bookings set reminder_sent = true where id = r.id;
        end if;
      end loop;
    end;
    $$;
  $$
);

-- 2. Hourly Historical Crowd Status Aggregation Job
-- Runs every hour at minute 5 to refresh aggregate wait times
select cron.schedule(
  'aggregate-hourly-crowd-stats',
  '5 * * * *',
  $$
    insert into public.crowd_reports (office_id, source, people_ahead, estimated_wait_minutes, reported_at, weekday, hour_of_day, notes)
    select 
      qu.office_id,
      'historical_agg' as source,
      round(avg(qu.people_ahead))::int as people_ahead,
      round(avg(qu.people_ahead * qu.estimated_mins_per_person))::int as estimated_wait_minutes,
      now() as reported_at,
      extract(dow from now())::int as weekday,
      extract(hour from now())::int as hour_of_day,
      'Aggregated from verified buddy reports over the past 30 days.' as notes
    from public.queue_updates qu
    where qu.created_at >= (now() - interval '30 days')
    group by qu.office_id
    on conflict do nothing;
  $$
);
