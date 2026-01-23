-- Drop existing objects to ensure clean state
-- WARNING: This will delete any existing data in the 'events' table
DROP TABLE IF EXISTS events;
DROP TYPE IF EXISTS event_source CASCADE;
DROP TYPE IF EXISTS event_category CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;

-- Create types
create type event_source as enum ('ai', 'user', 'system', 'document', 'authority');
create type event_category as enum ('bokföring', 'skatt', 'rapporter', 'parter', 'löner', 'dokument', 'system', 'bolagsåtgärd');
create type event_status as enum ('draft', 'pending_signature', 'ready_to_send', 'submitted', 'registered');

-- Create events table
create table events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  timestamp timestamptz default now() not null,
  source event_source not null,
  category event_category not null,
  action text not null,
  title text not null,
  actor_type text not null, -- 'ai', 'user', 'system', 'authority'
  actor_id text,
  actor_name text,
  description text,
  metadata jsonb,
  related_to jsonb, -- Array of RelatedEntity
  status event_status,
  corporate_action_type text,
  proof jsonb,
  hash text, -- For integrity audit
  previous_hash text -- Blockchain-style linking
);

-- Indexes for filtering
create index events_source_idx on events(source);
create index events_category_idx on events(category);
create index events_timestamp_idx on events(timestamp desc);

-- RLS Policies
alter table events enable row level security;

create policy "Enable read access for all users"
on events for select
using (true);

create policy "Enable insert access for authenticated users"
on events for insert
with check (auth.role() = 'authenticated' or auth.role() = 'anon');
