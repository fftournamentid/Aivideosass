-- Optional Supabase schema mirror for teams that connect this studio to Supabase.
-- The app's default runtime persists through the workspace API and PostgreSQL.

create table if not exists profiles (
  id text primary key,
  email text,
  display_name text not null default 'Guest creator',
  credits integer not null default 25,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id text primary key,
  name text not null,
  mode text not null check (mode in ('single_clip', 'cinematic_story')),
  updated_at timestamptz not null default now(),
  generation_count integer not null default 0,
  thumbnail_url text
);

create table if not exists characters (
  id text primary key,
  name text not null,
  handle text not null,
  image_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists generations (
  id text primary key,
  type text not null check (type in ('video', 'image', 'audio')),
  prompt text not null,
  status text not null default 'queued',
  progress integer not null default 0,
  credits_used integer not null default 4,
  aspect_ratio text not null default '16:9',
  quality text not null default 'HD',
  duration integer,
  preview_url text,
  project_id text references projects(id),
  character_id text references characters(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);