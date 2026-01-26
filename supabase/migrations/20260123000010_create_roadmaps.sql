-- Create roadmaps table
create table if not exists roadmaps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create roadmap_steps table
create table if not exists roadmap_steps (
  id uuid default gen_random_uuid() primary key,
  roadmap_id uuid references roadmaps(id) on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'skipped')),
  order_index integer not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table roadmaps enable row level security;
alter table roadmap_steps enable row level security;

-- Create policies for roadmaps
create policy "Users can view their own roadmaps"
  on roadmaps for select
  using (auth.uid() = user_id);

create policy "Users can insert their own roadmaps"
  on roadmaps for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own roadmaps"
  on roadmaps for update
  using (auth.uid() = user_id);

create policy "Users can delete their own roadmaps"
  on roadmaps for delete
  using (auth.uid() = user_id);

-- Create policies for roadmap_steps
create policy "Users can view steps for their roadmaps"
  on roadmap_steps for select
  using (
    exists (
      select 1 from roadmaps
      where roadmaps.id = roadmap_steps.roadmap_id
      and roadmaps.user_id = auth.uid()
    )
  );

create policy "Users can insert steps for their roadmaps"
  on roadmap_steps for insert
  with check (
    exists (
      select 1 from roadmaps
      where roadmaps.id = roadmap_steps.roadmap_id
      and roadmaps.user_id = auth.uid()
    )
  );

create policy "Users can update steps for their roadmaps"
  on roadmap_steps for update
  using (
    exists (
      select 1 from roadmaps
      where roadmaps.id = roadmap_steps.roadmap_id
      and roadmaps.user_id = auth.uid()
    )
  );

create policy "Users can delete steps for their roadmaps"
  on roadmap_steps for delete
  using (
    exists (
      select 1 from roadmaps
      where roadmaps.id = roadmap_steps.roadmap_id
      and roadmaps.user_id = auth.uid()
    )
  );

-- Create updated_at triggers
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at before update on roadmaps
  for each row execute procedure extensions.moddatetime (updated_at);

create trigger handle_updated_at before update on roadmap_steps
  for each row execute procedure extensions.moddatetime (updated_at);
