-- Alpha Learning v3 required schema
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade text,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  subject text not null,
  duration_seconds integer not null default 0,
  concepts_covered text[] not null default '{}',
  score integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.concept_progress (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  concept_id text not null,
  subject text not null,
  status text not null check (status in ('not_started','in_progress','struggling','mastered')),
  best_score integer not null default 0,
  attempts integer not null default 0,
  last_attempted timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, concept_id)
);

create table if not exists public.streaks (
  id bigint generated always as identity primary key,
  user_id uuid not null unique references public.users(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_session_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.badges (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

-- optional helper for parent digests
create table if not exists public.parent_settings (
  id bigint generated always as identity primary key,
  user_id uuid not null unique references public.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
