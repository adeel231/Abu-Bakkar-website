-- Abu Bakkar Academy — database setup / upgrade.
-- Run the whole file in the Supabase SQL editor. It is SAFE TO RE-RUN and never drops tables or deletes rows:
-- it only creates what is missing, adds columns, and (once) renames the two old default programs.
-- All access goes through the server using the service-role key; the public (anon) key can read nothing.

create extension if not exists pgcrypto;

-- =====================================================================================
-- 1. ORIGINAL TABLES (kept exactly as before so existing data and code keep working)
-- =====================================================================================
create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  age_group text not null default '',
  sessions int not null default 0,
  duration_weeks int not null default 4,
  price_pkr int not null default 0,          -- legacy (old single-price program). Prices now live in "packages".
  timings text not null default '',
  teacher text not null default '',
  start_date date,
  seats_total int not null default 0,        -- legacy. Capacity now lives in "class_batches".
  seats_taken int not null default 0,        -- legacy
  status text not null default 'coming_soon' check (status in ('open','coming_soon','closed')),
  sort int not null default 0
);

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null,
  parent_name text not null,
  whatsapp text not null,
  email text,
  child_first_name text not null,
  child_age int not null,
  grade text not null,
  city text not null,
  program_id uuid references programs(id),
  preferred_schedule text,
  amount_pkr int not null,
  status text not null default 'pending'
    check (status in ('pending','payment_started','payment_submitted','verified','rejected','refunded')),
  payment_method text,
  payment_txn_id text,
  payment_note text,
  source text,
  utm jsonb,
  class_group text,
  admin_notes text,
  followed_up boolean not null default false,
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists events (
  id bigserial primary key,
  session_id text not null,
  name text not null,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value text not null default ''
);

-- Allow the new funnel event "form_start" (the old check list is replaced by a longer one; no rows change).
alter table events drop constraint if exists events_name_check;
alter table events add constraint events_name_check check (name in (
  'ad_click','landing_view','enroll_click','form_view','form_start','payment_started','payment_verified',
  'share_whatsapp','share_facebook','promise_support','referral_visit'));

-- =====================================================================================
-- 2. NEW TABLES
-- =====================================================================================
alter table programs add column if not exists kind text not null default 'character';   -- 'character' | 'tuition'
alter table programs add column if not exists is_main boolean not null default false;
alter table programs add column if not exists tagline text not null default '';

create table if not exists age_groups (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                   -- 'A','B','C'
  label text not null,
  min_age int not null,
  max_age int not null,
  focus text not null default '',
  sort int not null default 0,
  active boolean not null default true,
  check (min_age <= max_age)
);

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort int not null default 0,
  active boolean not null default true
);

create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id),
  class_type text not null check (class_type in ('group','private')),
  duration_key text not null,                  -- 'monthly' | '3m' | '6m' | '4w'
  label text not null,                         -- 'Monthly', '3 Months', '6 Months', '4 Weeks'
  months int not null default 1 check (months >= 1),
  price_pkr int not null check (price_pkr >= 0),
  sessions int,                                -- fixed session count (tuition = 12); null for monthly plans
  schedule_note text not null default '',
  sort int not null default 0,
  active boolean not null default true,
  unique (program_id, class_type, duration_key)
);

create table if not exists parents (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  whatsapp text unique not null,
  email text,
  city text,
  created_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references parents(id),
  first_name text not null,
  age int not null,
  school_grade text,
  created_at timestamptz not null default now()
);
create index if not exists students_parent_idx on students(parent_id);

create table if not exists class_batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  program_id uuid not null references programs(id),
  class_type text check (class_type in ('group','private')),   -- null = any
  age_group_id uuid references age_groups(id),                  -- null = any
  timing text not null default '',                              -- e.g. 'Mon–Fri, 5:00–6:00 PM'
  start_date date,
  capacity int not null default 0 check (capacity >= 0),
  teacher text not null default '',
  meeting_link text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- enrollments: extra columns (the old columns stay, and are still filled in as a snapshot)
alter table enrollments alter column grade drop not null;
alter table enrollments add column if not exists parent_id uuid references parents(id);
alter table enrollments add column if not exists student_id uuid references students(id);
alter table enrollments add column if not exists package_id uuid references packages(id);
alter table enrollments add column if not exists program_name text;           -- snapshot at checkout
alter table enrollments add column if not exists class_type text;             -- snapshot
alter table enrollments add column if not exists duration_key text;           -- snapshot
alter table enrollments add column if not exists term_months int;             -- snapshot
alter table enrollments add column if not exists package_label text;          -- snapshot
alter table enrollments add column if not exists age_group_id uuid references age_groups(id);
alter table enrollments add column if not exists subject_id uuid references subjects(id);
alter table enrollments add column if not exists subject_name text;
alter table enrollments add column if not exists class_batch_id uuid references class_batches(id);
alter table enrollments add column if not exists preferred_batch_id uuid references class_batches(id);
alter table enrollments add column if not exists fbp text;
alter table enrollments add column if not exists fbc text;
alter table enrollments add column if not exists consent_version text;
create index if not exists enrollments_batch_idx on enrollments(class_batch_id);
create index if not exists enrollments_parent_idx on enrollments(parent_id);
create index if not exists enrollments_status_idx on enrollments(status);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments(id),
  method text not null,
  txn_ref text not null,
  amount_pkr int not null,                     -- amount charged at checkout (snapshot)
  amount_received int,                         -- what the admin saw arrive
  status text not null default 'submitted' check (status in ('submitted','verified','rejected','refunded')),
  note text,
  submitted_at timestamptz not null default now(),
  verified_at timestamptz,
  verified_by text,
  admin_note text
);
create index if not exists payments_enrollment_idx on payments(enrollment_id);
-- The same transaction reference can't be claimed twice (typo or fraud protection).
create unique index if not exists payments_txn_unique on payments (lower(method), lower(regexp_replace(txn_ref, '\s', '', 'g')))
  where status in ('submitted','verified');

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null default '',
  password_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_login timestamptz
);

-- =====================================================================================
-- 3. RULES THAT MUST HOLD NO MATTER WHAT THE WEBSITE CODE DOES
-- =====================================================================================
create or replace function enrollments_guard() returns trigger language plpgsql as $$
declare v_cap int; v_used int;
begin
  -- The fee charged at checkout can never be edited afterwards.
  if tg_op = 'UPDATE' and new.amount_pkr is distinct from old.amount_pkr then
    raise exception 'FEE_LOCKED';
  end if;
  -- Nobody becomes "verified/enrolled" without a verified payment row.
  if new.status = 'verified' and (tg_op = 'INSERT' or old.status is distinct from 'verified') then
    if not exists (select 1 from payments p where p.enrollment_id = new.id and p.status = 'verified') then
      raise exception 'PAYMENT_NOT_VERIFIED';
    end if;
  end if;
  -- Only enrolled (verified) students can sit in a class batch.
  if new.status <> 'verified' then new.class_batch_id := null; end if;
  -- Batch capacity is enforced here, under a row lock, so two admins can't overfill a batch.
  if new.class_batch_id is not null and (tg_op = 'INSERT' or new.class_batch_id is distinct from old.class_batch_id) then
    select capacity into v_cap from class_batches where id = new.class_batch_id for update;
    select count(*) into v_used from enrollments e
      where e.class_batch_id = new.class_batch_id and e.status = 'verified' and e.id <> new.id;
    if v_used >= coalesce(v_cap, 0) then raise exception 'BATCH_FULL'; end if;
  end if;
  return new;
end $$;

drop trigger if exists enrollments_guard_trg on enrollments;
create trigger enrollments_guard_trg before insert or update on enrollments
  for each row execute function enrollments_guard();

-- Seats left in the batches that match a choice. has_batches = false means "no capacity set up yet".
create or replace function seats_for(p_program uuid, p_class_type text, p_age_group uuid)
returns table (has_batches boolean, seats_left int) language sql stable as $$
  select count(*) > 0,
         coalesce(sum(greatest(b.capacity - (select count(*) from enrollments e
                      where e.class_batch_id = b.id and e.status = 'verified'), 0)), 0)::int
  from class_batches b
  where b.active and b.program_id = p_program
    and (b.class_type is null or b.class_type = p_class_type)
    and (p_age_group is null or b.age_group_id is null or b.age_group_id = p_age_group);
$$;

-- Creates parent + student + enrollment in ONE transaction. The price is read from "packages" here,
-- never from the browser, and is stored on the enrollment (snapshot) so later price edits don't change it.
create or replace function create_enrollment(p jsonb) returns jsonb language plpgsql as $$
declare
  v_pkg packages%rowtype; v_prog programs%rowtype; v_ag age_groups%rowtype; v_subj subjects%rowtype;
  v_age int; v_wa text := p->>'whatsapp'; v_first text := trim(p->>'student_first_name');
  v_parent uuid; v_student uuid; v_ref text; v_id uuid; v_has boolean; v_left int; v_ex enrollments%rowtype;
  v_grade text := nullif(trim(coalesce(p->>'school_grade','')), '');
  v_alpha constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; v_try int := 0;
begin
  if coalesce((p->>'consent')::boolean, false) is not true then raise exception 'CONSENT_REQUIRED'; end if;
  select * into v_pkg from packages where id = (p->>'package_id')::uuid and active;
  if not found then raise exception 'PACKAGE_UNAVAILABLE'; end if;
  select * into v_prog from programs where id = v_pkg.program_id and status = 'open';
  if not found then raise exception 'PROGRAM_UNAVAILABLE'; end if;
  -- The total the parent saw on screen must equal the real price; if it was edited meanwhile, stop and let them review.
  if nullif(p->>'expected_amount', '') is not null and (p->>'expected_amount')::int <> v_pkg.price_pkr then
    raise exception 'PRICE_CHANGED';
  end if;

  v_age := (p->>'student_age')::int;
  if v_age is null or v_age < 3 or v_age > 19 then raise exception 'BAD_AGE'; end if;
  if v_first is null or v_first = '' or v_wa is null or coalesce(trim(p->>'parent_name'),'') = '' then
    raise exception 'MISSING_DETAILS';
  end if;

  if v_prog.kind = 'character' then
    select * into v_ag from age_groups where id = (p->>'age_group_id')::uuid and active;
    if not found then raise exception 'AGE_GROUP_REQUIRED'; end if;
    if v_age < v_ag.min_age or v_age > v_ag.max_age then raise exception 'AGE_GROUP_MISMATCH'; end if;
  else
    if v_grade is null then raise exception 'GRADE_REQUIRED'; end if;
    select * into v_subj from subjects where id = (p->>'subject_id')::uuid and active;
    if not found then raise exception 'SUBJECT_REQUIRED'; end if;
  end if;

  -- If batches exist for this choice and every one is full, stop taking money for it.
  select s.has_batches, s.seats_left into v_has, v_left from seats_for(v_prog.id, v_pkg.class_type, v_ag.id) s;
  if v_has and v_left <= 0 then raise exception 'SEATS_FULL'; end if;

  insert into parents(full_name, whatsapp, email, city)
  values (trim(p->>'parent_name'), v_wa, nullif(trim(coalesce(p->>'email','')), ''), trim(p->>'city'))
  on conflict (whatsapp) do update
    set full_name = excluded.full_name, email = coalesce(excluded.email, parents.email), city = excluded.city
  returning id into v_parent;

  -- Double-tap protection: the same parent re-submitting the same choice gets the same enrollment back.
  select e.* into v_ex from enrollments e join students s on s.id = e.student_id
   where e.parent_id = v_parent and lower(s.first_name) = lower(v_first) and e.package_id = v_pkg.id
     and e.status in ('pending','payment_started','payment_submitted','rejected')
   order by e.created_at desc limit 1;
  if found then
    return jsonb_build_object('ref', v_ex.ref, 'amount', v_ex.amount_pkr, 'enrollment_id', v_ex.id, 'existing', true);
  end if;

  select id into v_student from students where parent_id = v_parent and lower(first_name) = lower(v_first) limit 1;
  if v_student is null then
    insert into students(parent_id, first_name, age, school_grade) values (v_parent, v_first, v_age, v_grade)
    returning id into v_student;
  else
    update students set age = v_age, school_grade = coalesce(v_grade, school_grade) where id = v_student;
  end if;

  loop
    v_ref := 'ABA-' || (select string_agg(substr(v_alpha, 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 8));
    exit when not exists (select 1 from enrollments where ref = v_ref);
    v_try := v_try + 1;
    if v_try > 20 then raise exception 'REF_FAILED'; end if;
  end loop;

  insert into enrollments (
    ref, parent_name, whatsapp, email, child_first_name, child_age, grade, city, program_id, preferred_schedule,
    amount_pkr, status, source, utm, consent_at, consent_version,
    parent_id, student_id, package_id, program_name, class_type, duration_key, term_months, package_label,
    age_group_id, subject_id, subject_name, preferred_batch_id, fbp, fbc
  ) values (
    v_ref, trim(p->>'parent_name'), v_wa, nullif(trim(coalesce(p->>'email','')), ''), v_first, v_age, v_grade,
    trim(p->>'city'), v_prog.id, nullif(trim(coalesce(p->>'preferred_timing','')), ''),
    v_pkg.price_pkr, 'pending', coalesce(nullif(p->>'source',''), 'direct'), p->'utm', now(), 'v1',
    v_parent, v_student, v_pkg.id, v_prog.name, v_pkg.class_type, v_pkg.duration_key, v_pkg.months, v_pkg.label,
    v_ag.id, v_subj.id, v_subj.name, nullif(p->>'preferred_batch_id','')::uuid, nullif(p->>'fbp',''), nullif(p->>'fbc','')
  ) returning id into v_id;

  return jsonb_build_object('ref', v_ref, 'amount', v_pkg.price_pkr, 'enrollment_id', v_id, 'existing', false);
end $$;

-- Parent submits the transaction reference. This does NOT confirm anything; it only queues it for the admin.
create or replace function submit_payment(p_ref text, p_method text, p_txn text, p_note text) returns jsonb
language plpgsql as $$
declare e enrollments%rowtype; v_pay uuid;
begin
  select * into e from enrollments where ref = p_ref for update;
  if not found then raise exception 'ENROLLMENT_NOT_FOUND'; end if;
  if e.status = 'verified' then raise exception 'ALREADY_VERIFIED'; end if;
  if e.status = 'payment_submitted' then raise exception 'ALREADY_SUBMITTED'; end if;
  if e.status = 'refunded' then raise exception 'ENROLLMENT_CLOSED'; end if;
  if length(trim(coalesce(p_txn, ''))) < 4 then raise exception 'BAD_TXN'; end if;
  begin
    insert into payments(enrollment_id, method, txn_ref, amount_pkr, status, note)
    values (e.id, p_method, trim(p_txn), e.amount_pkr, 'submitted', nullif(trim(coalesce(p_note, '')), ''))
    returning id into v_pay;
  exception when unique_violation then raise exception 'TXN_REUSED';
  end;
  update enrollments set status = 'payment_submitted', payment_method = p_method, payment_txn_id = trim(p_txn),
         payment_note = nullif(trim(coalesce(p_note, '')), '') where id = e.id;
  return jsonb_build_object('payment_id', v_pay, 'ref', e.ref);
end $$;

-- Admin confirms the money really arrived. Only this function (or the equivalent admin action) can enrol a student.
create or replace function verify_payment(p_payment uuid, p_admin text, p_received int) returns jsonb
language plpgsql as $$
declare pay payments%rowtype; e enrollments%rowtype;
begin
  select * into pay from payments where id = p_payment for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  if pay.status = 'verified' then raise exception 'ALREADY_VERIFIED'; end if;
  if pay.status <> 'submitted' then raise exception 'PAYMENT_NOT_PENDING'; end if;
  if p_received is null or p_received < pay.amount_pkr then raise exception 'SHORT_PAYMENT'; end if;
  update payments set status = 'verified', amount_received = p_received, verified_at = now(), verified_by = p_admin
   where id = pay.id;
  update enrollments set status = 'verified', verified_at = now() where id = pay.enrollment_id returning * into e;
  insert into events(session_id, name, source) values ('server:' || e.ref, 'payment_verified', e.source);
  return jsonb_build_object('ref', e.ref, 'enrollment_id', e.id);
end $$;

create or replace function reject_payment(p_payment uuid, p_admin text, p_note text) returns jsonb
language plpgsql as $$
declare pay payments%rowtype;
begin
  select * into pay from payments where id = p_payment for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  if pay.status <> 'submitted' then raise exception 'PAYMENT_NOT_PENDING'; end if;
  update payments set status = 'rejected', verified_by = p_admin, admin_note = nullif(trim(coalesce(p_note, '')), '')
   where id = pay.id;
  update enrollments set status = 'rejected' where id = pay.enrollment_id and status = 'payment_submitted';
  return jsonb_build_object('ok', true);
end $$;

create or replace function refund_enrollment(p_enrollment uuid, p_admin text, p_note text) returns jsonb
language plpgsql as $$
declare e enrollments%rowtype;
begin
  select * into e from enrollments where id = p_enrollment for update;
  if not found then raise exception 'ENROLLMENT_NOT_FOUND'; end if;
  if e.status <> 'verified' then raise exception 'NOT_ENROLLED'; end if;
  update payments set status = 'refunded', admin_note = coalesce(nullif(trim(coalesce(p_note, '')), ''), admin_note)
   where enrollment_id = e.id and status = 'verified';
  update enrollments set status = 'refunded' where id = e.id;   -- the guard also frees the batch seat
  return jsonb_build_object('ok', true);
end $$;

-- Put an enrolled student into a class batch (or take them out with a null batch).
create or replace function assign_batch(p_enrollment uuid, p_batch uuid) returns jsonb
language plpgsql as $$
declare e enrollments%rowtype; b class_batches%rowtype;
begin
  select * into e from enrollments where id = p_enrollment for update;
  if not found then raise exception 'ENROLLMENT_NOT_FOUND'; end if;
  if p_batch is null then
    update enrollments set class_batch_id = null where id = e.id;
    return jsonb_build_object('ok', true);
  end if;
  if e.status <> 'verified' then raise exception 'NOT_ENROLLED'; end if;
  select * into b from class_batches where id = p_batch and active;
  if not found then raise exception 'BATCH_NOT_FOUND'; end if;
  if b.program_id is distinct from e.program_id then raise exception 'BATCH_WRONG_PROGRAM'; end if;
  if b.class_type is not null and b.class_type is distinct from e.class_type then raise exception 'BATCH_WRONG_CLASS_TYPE'; end if;
  update enrollments set class_batch_id = p_batch where id = e.id;   -- the guard checks capacity
  return jsonb_build_object('ok', true);
end $$;

-- =====================================================================================
-- 4. SECURITY: row-level security on, no public policies
-- =====================================================================================
alter table programs enable row level security;
alter table enrollments enable row level security;
alter table events enable row level security;
alter table settings enable row level security;
alter table age_groups enable row level security;
alter table subjects enable row level security;
alter table packages enable row level security;
alter table parents enable row level security;
alter table students enable row level security;
alter table class_batches enable row level security;
alter table payments enable row level security;
alter table admin_users enable row level security;

do $$
declare t text; f text;
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    foreach t in array array['programs','enrollments','events','settings','age_groups','subjects','packages','parents',
                             'students','class_batches','payments','admin_users'] loop
      execute format('revoke all on table %I from anon, authenticated', t);
    end loop;
    foreach f in array array['create_enrollment(jsonb)','submit_payment(text,text,text,text)','verify_payment(uuid,text,int)',
                             'reject_payment(uuid,text,text)','refund_enrollment(uuid,text,text)','assign_batch(uuid,uuid)',
                             'seats_for(uuid,text,uuid)','enrollments_guard()'] loop
      execute format('revoke all on function %s from public, anon, authenticated', f);
    end loop;
  end if;
end $$;

-- =====================================================================================
-- 5. STARTING CONTENT (only inserted if missing; edit everything later from /admin)
-- =====================================================================================
insert into settings(key, value) values
 ('bank_details', ''),
 ('jazzcash_number', ''),
 ('easypaisa_number', ''),
 ('whatsapp_joining_text', 'Class joining link and timings will be sent on WhatsApp before your first class.'),
 ('ad_spend_pkr', '0'),
 ('hero_hook', 'Abu Bakkar Ne Sab Ka Dil Kyun Jeeta?'),
 ('hero_sub', 'Sirf Uski Taleem Ki Wajah Se Nahi
Uske Khoobsurat Akhlaaq Ki Wajah Se'),
 ('promise_text', 'I promise to focus on my child''s character as much as their education.'),
 ('limited_seats_threshold', '10'),
 ('timing_options', 'Morning (9 AM – 12 PM)
Afternoon (12 PM – 4 PM)
Evening (4 PM – 8 PM)
Night (8 PM – 10 PM)')
on conflict do nothing;

-- Replace OLD default hero text with the current design's text and the old placeholder payment text — only if they were never edited.
update settings set value = 'Abu Bakkar Ne Sab Ka Dil Kyun Jeeta?' where key = 'hero_hook'
  and value in ('Abu Bakar Ne Sab Ka Dil Kyun Jeeta?', 'Abu Bakkar Jaisa Khoobsurat Akhlaaq');
update settings set value = 'Sirf Uski Taleem Ki Wajah Se Nahi
Uske Khoobsurat Akhlaaq Ki Wajah Se' where key = 'hero_sub'
  and (value like 'Sirf Uski Taleem Ki Wajah Se Nahi!%' or value = 'Har Betay Aur Beti Ke Liye
Sirf Taleem Nahi Tarbiyat Bhi');
update settings set value = '' where key = 'bank_details' and value like 'Bank: <your bank>%';
update settings set value = '' where key in ('jazzcash_number', 'easypaisa_number') and value like '03XX-XXXXXXX%';

insert into age_groups(code, label, min_age, max_age, focus, sort) values
 ('A', 'Group A', 5, 8,  'Manners and kindness', 1),
 ('B', 'Group B', 8, 12, 'Respect and patience', 2),
 ('C', 'Group C', 12, 15, 'Responsibility and emotional intelligence', 3)
on conflict (code) do nothing;
-- Shorten the OLD default focus text to two points each — only if it was never edited in /admin.
update age_groups set focus = 'Manners and kindness' where focus = 'Manners, kindness and basic discipline';
update age_groups set focus = 'Respect and patience' where focus = 'Respect, patience and confidence';
update age_groups set focus = 'Responsibility and emotional intelligence' where focus = 'Responsibility, emotional intelligence and leadership';

insert into subjects(name, sort) values
 ('Mathematics', 1), ('English', 2), ('Urdu', 3), ('Science', 4), ('Islamiyat', 5), ('Computer Science', 6)
on conflict (name) do nothing;

insert into programs(slug, name, description, age_group, sessions, duration_weeks, price_pkr, timings, teacher, status, sort, kind, is_main, tagline) values
 ('character-grooming', 'Character Grooming',
  'Live online classes that build respect, honesty, patience, kindness and confidence, with Islamic manners and practical activities.',
  'Ages 5–15', 0, 4, 0, '', '', 'open', 1, 'character', true, 'Our main program'),
 ('academic-tuition', 'Academic Tuition',
  'Online tuition for school subjects with study skills, taught separately from Character Grooming.',
  'Grades 1–10', 12, 4, 0, '', '', 'open', 2, 'tuition', false, 'Second service')
on conflict (slug) do nothing;

-- Convert the two OLD default program rows (the Rs. 4,999 "Founding Batch" pilot) — only if still unedited.
update programs set name = 'Character Grooming',
  description = 'Live online classes that build respect, honesty, patience, kindness and confidence, with Islamic manners and practical activities.',
  age_group = 'Ages 5–15', sessions = 0, status = 'open', tagline = 'Our main program'
 where slug = 'character-grooming' and name = 'Character Grooming — Founding Batch';
update programs set name = 'Academic Tuition',
  description = 'Online tuition for school subjects with study skills, taught separately from Character Grooming.',
  age_group = 'Grades 1–10', sessions = 12, status = 'open', tagline = 'Second service'
 where slug = 'academic-tuition' and name = 'Academic Tuition (Grade-based)';
update programs set kind = 'character' where slug = 'character-grooming';
update programs set kind = 'tuition' where slug = 'academic-tuition';
update programs set is_main = true where slug = 'character-grooming'
  and not exists (select 1 from programs where is_main);

-- Packages (prices in PKR). Edit prices later in /admin → Packages; old enrollments keep the fee they paid.
insert into packages(program_id, class_type, duration_key, label, months, price_pkr, sessions, schedule_note, sort)
select p.id, v.class_type, v.duration_key, v.label, v.months, v.price, v.sessions, v.note, v.sort
from programs p
join (values
  ('character-grooming', 'group',   'monthly', 'Monthly',  1,  6000, null::int, '1 hour daily · 5 days per week', 1),
  ('character-grooming', 'group',   '3m',      '3 Months', 3, 16500, null,      '1 hour daily · 5 days per week', 2),
  ('character-grooming', 'group',   '6m',      '6 Months', 6, 30000, null,      '1 hour daily · 5 days per week', 3),
  ('character-grooming', 'private', 'monthly', 'Monthly',  1, 13000, null,      '1 hour per session · 2 days per week', 4),
  ('character-grooming', 'private', '3m',      '3 Months', 3, 36000, null,      '1 hour per session · 2 days per week', 5),
  ('character-grooming', 'private', '6m',      '6 Months', 6, 69000, null,      '1 hour per session · 2 days per week', 6),
  ('academic-tuition',   'group',   '4w',      '4 Weeks',  1,  5999, 12,        '12 sessions over 4 weeks', 7),
  ('academic-tuition',   'private', '4w',      '4 Weeks',  1, 15999, 12,        '12 sessions over 4 weeks', 8)
) as v(slug, class_type, duration_key, label, months, price, sessions, note, sort) on v.slug = p.slug
on conflict (program_id, class_type, duration_key) do nothing;
