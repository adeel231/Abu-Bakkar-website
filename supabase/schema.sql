-- Run in the Supabase SQL editor. All access goes through the server using the service-role key.
create extension if not exists pgcrypto;

create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  age_group text not null default '',
  sessions int not null default 0,
  duration_weeks int not null default 4,
  price_pkr int not null default 0,
  timings text not null default '',
  teacher text not null default '',
  start_date date,
  seats_total int not null default 0,
  seats_taken int not null default 0,
  -- open = enrollment enabled, coming_soon = shown but not purchasable, closed = hidden
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
  name text not null check (name in ('ad_click','landing_view','enroll_click','form_view','payment_started','payment_verified',
    'share_whatsapp','share_facebook','promise_support','referral_visit')),
  source text,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value text not null default ''
);

alter table programs enable row level security;
alter table enrollments enable row level security;
alter table events enable row level security;
alter table settings enable row level security;
-- No policies on purpose: the anon key can read nothing. Server uses the service-role key.

insert into settings(key, value) values
 ('bank_details', 'Bank: <your bank>\nAccount title: Abu Bakkar Academy\nIBAN: PK00XXXX0000000000000000'),
 ('jazzcash_number', '03XX-XXXXXXX (Account title: ...)'),
 ('easypaisa_number', '03XX-XXXXXXX (Account title: ...)'),
 ('whatsapp_joining_text', 'Class joining link and timings will be sent on WhatsApp before the first session.'),
 ('ad_spend_pkr', '0'),
 ('hero_hook', 'Abu Bakkar Ne Sab Ka Dil Kyun Jeeta?'),
 ('hero_sub', 'Sirf Uski Taleem Ki Wajah Se Nahi!\nUske Khoobsurat Akhlaaq Ki Wajah Se!'),
 ('promise_text', 'I promise to focus on my child''s character as much as their education.')
on conflict do nothing;

insert into programs(slug,name,description,age_group,sessions,duration_weeks,price_pkr,timings,teacher,status,seats_total,sort) values
 ('character-grooming','Character Grooming — Founding Batch',
  'Four-week live online program building respect, honesty, patience, kindness and confidence, with practical assignments and parent feedback.',
  '8–14 years', 8, 4, 4999, 'To be confirmed', 'To be confirmed', 'coming_soon', 0, 1),
 ('academic-tuition','Academic Tuition (Grade-based)',
  'Online tuition for school subjects and study skills. Enrollment opens once teacher availability, pricing and schedule are confirmed.',
  'Grades 1–10', 0, 4, 0, 'To be confirmed', 'To be confirmed', 'coming_soon', 0, 2)
on conflict do nothing;
-- Set status='open', seats_total, start_date, timings and teacher from the admin dashboard once confirmed.
