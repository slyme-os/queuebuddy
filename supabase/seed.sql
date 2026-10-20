-- ==============================================================================
-- QueueBuddy Bengaluru - Real Seed Data (8-10 Sample Offices clearly marked)
-- ==============================================================================

-- 1. Insert 10 Bengaluru Offices
insert into public.offices (id, name, name_kn, office_type, area, address, lat, lng, status, working_hours, holidays, last_verified_date)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'Indiranagar RTO (KA-03)',
    'ಇಂದಿರಾನಗರ ಆರ್‌ಟಿಒ (ಕೆಎ-03)',
    'rto',
    'Indiranagar',
    '2nd Floor, BDA Complex, Indiranagar, Bengaluru - 560038',
    12.9784,
    77.6408,
    'bookable',
    '{"mon_fri": "10:00 AM - 05:30 PM", "counter": "10:00 AM - 01:30 PM", "lunch": "01:30 PM - 02:15 PM"}'::jsonb,
    array['Second Saturday', 'Fourth Saturday', 'All Sundays', 'Govt Holidays'],
    now() - interval '2 days'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Jayanagar RTO (KA-05)',
    'ಜಯನಗರ ಆರ್‌ಟಿಒ (ಕೆಎ-05)',
    'rto',
    'Jayanagar',
    'Shopping Complex, 4th Block, Jayanagar, Bengaluru - 560011',
    12.9298,
    77.5828,
    'bookable',
    '{"mon_fri": "10:00 AM - 05:30 PM", "counter": "10:00 AM - 02:00 PM", "lunch": "01:30 PM - 02:15 PM"}'::jsonb,
    array['Second Saturday', 'Fourth Saturday', 'All Sundays', 'Govt Holidays'],
    now() - interval '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Koramangala Sub-Registrar Office',
    'ಕೋರಮಂಗಲ ಉಪ ನೋಂದಣಾಧಿಕಾರಿ ಕಚೇರಿ',
    'sub_registrar',
    'Koramangala',
    'BDA Complex, 3rd Block, Koramangala 80ft Road, Bengaluru - 560034',
    12.9345,
    77.6266,
    'bookable',
    '{"mon_fri": "10:00 AM - 05:30 PM", "token_issue": "09:30 AM - 12:30 PM", "lunch": "01:30 PM - 02:15 PM"}'::jsonb,
    array['Second Saturday', 'Fourth Saturday', 'All Sundays', 'Govt Holidays'],
    now() - interval '3 days'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'Shivajinagar Sub-Registrar Office',
    'ಶಿವಾಜಿನಗರ ಉಪ ನೋಂದಣಾಧಿಕಾರಿ ಕಚೇರಿ',
    'sub_registrar',
    'Shivajinagar',
    'Tasker Town, Shivaji Nagar, near Bowring Hospital, Bengaluru - 560051',
    12.9856,
    77.6057,
    'bookable',
    '{"mon_fri": "10:00 AM - 05:30 PM", "token_issue": "10:00 AM - 01:00 PM", "lunch": "01:30 PM - 02:15 PM"}'::jsonb,
    array['Second Saturday', 'Fourth Saturday', 'All Sundays', 'Govt Holidays'],
    now() - interval '4 days'
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'Passport Seva Kendra (PSK) Lalbagh',
    'ಪಾಸ್‌ಪೋರ್ಟ್ ಸೇವಾ ಕೇಂದ್ರ ಲಾಲ್‌ಬಾಗ್',
    'psk',
    'Lalbagh',
    'Prestige Libra, 45 Lalbagh Main Road, near Urvashi Theatre, Bengaluru - 560027',
    12.9556,
    77.5912,
    'bookable',
    '{"mon_fri": "09:00 AM - 05:00 PM", "counter": "09:00 AM - 04:30 PM", "lunch": "Staggered"}'::jsonb,
    array['All Saturdays', 'All Sundays', 'Central Govt Holidays'],
    now() - interval '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'Passport Seva Kendra (PSK) Bellandur',
    'ಪಾಸ್‌ಪೋರ್ಟ್ ಸೇವಾ ಕೇಂದ್ರ ಬೆಳ್ಳಂದೂರು',
    'psk',
    'Bellandur',
    'Sai Arcade, Devarabisanahalli, Outer Ring Road, Bengaluru - 560103',
    12.9260,
    77.6835,
    'bookable',
    '{"mon_fri": "09:00 AM - 05:30 PM", "counter": "09:00 AM - 04:30 PM", "lunch": "Staggered"}'::jsonb,
    array['All Saturdays', 'All Sundays', 'Central Govt Holidays'],
    now() - interval '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000007',
    'BBMP Ward 111 Office (Shantinagar)',
    'ಬಿಬಿಎಂಪಿ ವಾರ್ಡ್ 111 ಕಚೇರಿ (ಶಾಂತಿನಗರ)',
    'ward_civic',
    'Central Bengaluru',
    'Double Road, Shantinagar, Bengaluru - 560027',
    12.9542,
    77.5990,
    'bookable',
    '{"mon_fri": "10:00 AM - 05:00 PM", "khata_counter": "10:30 AM - 01:30 PM", "lunch": "01:30 PM - 02:15 PM"}'::jsonb,
    array['Second Saturday', 'Fourth Saturday', 'All Sundays'],
    now() - interval '5 days'
  ),
  (
    '00000000-0000-0000-0000-000000000008',
    'BESCOM Indiranagar Sub-Division',
    'ಬೆಸ್ಕಾಂ ಇಂದಿರಾನಗರ ಉಪ ವಿಭಾಗ',
    'utility',
    'Indiranagar',
    '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru - 560038',
    12.9719,
    77.6412,
    'bookable',
    '{"mon_fri": "10:00 AM - 05:00 PM", "cash_counter": "10:00 AM - 03:00 PM", "lunch": "01:30 PM - 02:00 PM"}'::jsonb,
    array['Second Saturday', 'Fourth Saturday', 'All Sundays'],
    now() - interval '2 days'
  ),
  (
    '00000000-0000-0000-0000-000000000009',
    'BWSSB Service Station Malleshwaram',
    'ಬಿಡಬ್ಲ್ಯೂಎಸ್‌ಎಸ್‌ಬಿ ಸೇವಾ ಕೇಂದ್ರ ಮಲ್ಲೇಶ್ವರಂ',
    'utility',
    'Malleshwaram',
    '8th Main Road, Malleshwaram, Bengaluru - 560003',
    12.9988,
    77.5714,
    'coming_soon',
    '{"mon_fri": "09:30 AM - 05:00 PM", "lunch": "01:30 PM - 02:15 PM"}'::jsonb,
    array['All Sundays', 'Govt Holidays'],
    now() - interval '10 days'
  ),
  (
    '00000000-0000-0000-0000-000000000010',
    'Bangalore North Taluk Office (Mini Vidhana Soudha)',
    'ಬೆಂಗಳೂರು ಉತ್ತರ ತಾಲೂಕು ಕಚೇರಿ (ಮಿನಿ ವಿಧಾನ ಸೌಧ)',
    'taluk',
    'Yelahanka',
    'Mini Vidhana Soudha, Yelahanka New Town, Bengaluru - 560064',
    13.0998,
    77.5963,
    'coming_soon',
    '{"mon_fri": "10:00 AM - 05:30 PM", "lunch": "01:30 PM - 02:15 PM"}'::jsonb,
    array['Second Saturday', 'Fourth Saturday', 'All Sundays'],
    now() - interval '12 days'
  )
on conflict (id) do nothing;

-- 2. Services for Offices
insert into public.services (id, office_id, title, title_kn, description, government_fee, queue_buddy_base_fee, estimated_wait_minutes)
values
  -- Indiranagar RTO
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Driving License (DL) Renewal & Biometric Verification',
    'ಚಾಲನಾ ಪರವಾನಗಿ ನವೀಕರಣ ಮತ್ತು ಬಯೋಮೆಟ್ರಿಕ್ ಪರಿಶೀಲನೆ',
    'Queue buddy holds your counter spot for physical application submission, fees verification, and photo counter token.',
    200.00,
    349.00,
    110
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Vehicle RC Transfer & Hypothecation Cancellation',
    'ವಾಹನ ಆರ್‌ಸಿ ವರ್ಗಾವಣೆ ಮತ್ತು ಹೈಪೋಥಿಕೇಶನ್ ರದ್ದತಿ',
    'Wait in line for Form 29/30 submission and physical inspector signature counter.',
    300.00,
    399.00,
    140
  ),
  -- Koramangala Sub-Registrar
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'Encumbrance Certificate (EC) Physical Application / Certified Copy',
    'ಋಣಭಾರ ಪ್ರಮಾಣಪತ್ರ (ಇಸಿ) ಅರ್ಜಿ / ಪ್ರಮಾಣೀಕೃತ ಪ್ರತಿ',
    'Buddy queues up for Kaveri 2.0 manual counter query, token clearance, and payment receipt collection.',
    150.00,
    299.00,
    90
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000003',
    'Property Sale/Rental Deed Slot Verification Queue',
    'ಆಸ್ತಿ ನೋಂದಣಿ ಸ್ಲಾಟ್ ಪರಿಶೀಲನಾ ಸರದಿ',
    'Buddy secures early token entry so buyer and seller only arrive 15 minutes prior to biometric room call.',
    1000.00,
    499.00,
    160
  ),
  -- PSK Lalbagh
  (
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000005',
    'Passport Entry Gate & Document Scrutiny Line',
    'ಪಾಸ್‌ಪೋರ್ಟ್ ಪ್ರವೇಶ ದ್ವಾರ ಮತ್ತು ದಾಖಲೆ ಪರಿಶೀಲನಾ ಸಾಲು',
    'Queue buddy holds place in the outer morning queue for batch time appointment security check.',
    1500.00,
    349.00,
    75
  ),
  -- BBMP Ward
  (
    '10000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000007',
    'e-Khata Transfer / Khata Extract Application',
    'ಇ-ಖಾತಾ ವರ್ಗಾವಣೆ / ಖಾತಾ ಸಾರಾಂಶ ಅರ್ಜಿ',
    'Buddy queues up at ARO counter for physical file tracking and scrutiny stamp.',
    500.00,
    349.00,
    120
  )
on conflict (id) do nothing;

-- 3. Document Checklist Templates for Services
insert into public.document_checklist_templates (id, service_id, item_name, item_name_kn, help_text, copy_type, copies_count, is_mandatory, where_to_get, order_index)
values
  -- Indiranagar RTO DL Renewal
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Original Driving License (Physical Card)',
    'ಮೂಲ ಚಾಲನಾ ಪರವಾನಗಿ (ಭೌತಿಕ ಕಾರ್ಡ್)',
    'Original smart card or laminated license. In case of chip damage, bring an affidavit.',
    'original',
    1,
    true,
    'Your current wallet / previous RTO',
    1
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Form 1 & Form 1A (Medical Fitness Certificate)',
    'ನಮೂನೆ 1 ಮತ್ತು ನಮೂನೆ 1ಎ (ವೈದ್ಯಕೀಯ ಪ್ರಮಾಣಪತ್ರ)',
    'Mandatory if applicant age is above 40. Must be signed with registration stamp by MBBS doctor.',
    'both',
    1,
    true,
    'Parivahan online portal or any certified clinic / registered MBBS doctor',
    2
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'Aadhaar Card (Address Proof with current Bengaluru address)',
    'ಆಧಾರ್ ಕಾರ್ಡ್ (ಪ್ರಸ್ತುತ ಬೆಂಗಳೂರು ವಿಳಾಸ)',
    'Bring original for biometric verification plus 2 self-attested photocopies.',
    'both',
    2,
    true,
    'UIDAI portal / original card',
    3
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'Parivahan Application Form & Online Fee Payment Receipt',
    'ಪರಿವಾಹನ ಅರ್ಜಿ ನಮೂನೆ ಮತ್ತು ಶುಲ್ಕ ಪಾವತಿ ರಶೀದಿ',
    'Printout of the Sarathi portal application acknowledgment with bar code.',
    'photocopy',
    2,
    true,
    'Download from parivahan.gov.in after paying application fee',
    4
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000001',
    'Passport size photographs (White background)',
    'ಪಾಸ್‌ಪೋರ್ಟ್ ಅಳತೆಯ ಭಾವಚಿತ್ರಗಳು (ಬಿಳಿ ಹಿನ್ನೆಲೆ)',
    'Recent color photos taken within the last 3 months.',
    'original',
    3,
    false,
    'Local photo studio or RTO instant photo booth',
    5
  ),
  -- Koramangala Sub-Registrar EC
  (
    '20000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000003',
    'Sale Deed Copy or Mother Deed Reference Copy',
    'ಮಾರಾಟ ಪತ್ರದ ಪ್ರತಿ ಅಥವಾ ಮೂಲ ಪತ್ರ',
    'Copy showing property survey number, village/ward name, and boundary schedule.',
    'photocopy',
    1,
    true,
    'Home document file / Bank copy',
    1
  ),
  (
    '20000000-0000-0000-0000-000000000007',
    '10000000-0000-0000-0000-000000000003',
    'Form 22 (Application for EC search)',
    'ನಮೂನೆ 22 (ಇಸಿ ಹುಡುಕಾಟ ಅರ್ಜಿ)',
    'Duly filled with property schedule description and search period in years.',
    'original',
    1,
    true,
    'Sub-registrar stationery counter or Kaveri 2.0 printout',
    2
  ),
  (
    '20000000-0000-0000-0000-000000000008',
    '10000000-0000-0000-0000-000000000003',
    'Applicant Govt ID Proof (Aadhaar or Voter ID)',
    'ಅರ್ಜಿದಾರರ ಗುರುತಿನ ಚೀಟಿ (ಆಧಾರ್ ಅಥವಾ ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ)',
    'Self-attested photocopy with contact phone number written.',
    'both',
    1,
    true,
    'Original card + photocopy',
    3
  )
on conflict (id) do nothing;

-- 4. Realistic Honest Crowd Reports (Provenance tracking: Buddy, Historical, Customer)
insert into public.crowd_reports (id, office_id, source, people_ahead, estimated_wait_minutes, reported_at, weekday, hour_of_day, notes)
values
  (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'buddy_report',
    14,
    70,
    now() - interval '25 minutes',
    extract(dow from now())::int,
    extract(hour from now())::int,
    'Token counter 3 is moving steadily. About 5 mins per applicant.'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'historical_agg',
    22,
    115,
    now() - interval '2 days',
    1, -- Monday
    11, -- 11 AM
    'Usually peak busy on Monday mornings between 10:30 AM and 1:00 PM.'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'buddy_report',
    8,
    45,
    now() - interval '42 minutes',
    extract(dow from now())::int,
    extract(hour from now())::int,
    'Registration counter queue is moderate. Kaveri server online.'
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000005',
    'customer_report',
    18,
    65,
    now() - interval '3 hours',
    extract(dow from now())::int,
    extract(hour from now())::int,
    'Security checkpoint was fast, counter A had slight delay.'
  )
on conflict (id) do nothing;
