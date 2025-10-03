-- Create table to track edit/delete requests for daily_settlements
create table if not exists public.settlement_change_requests (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references public.daily_settlements(id) on delete cascade,
  requested_by uuid not null,
  request_type text not null check (request_type in ('edit','delete')),
  payload jsonb, -- for edit requests: proposed changes (e.g., { amount, notes })
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reason text,
  created_at timestamptz not null default now(),
  reviewed_by uuid,
  reviewed_at timestamptz
);

alter table public.settlement_change_requests enable row level security;

-- Basic RLS: authenticated users can insert/select their own requests
create policy if not exists "scr_insert_own"
on public.settlement_change_requests
for insert to authenticated
with check (auth.uid() = requested_by);

create policy if not exists "scr_select_own_or_manager"
on public.settlement_change_requests
for select to authenticated
using (
  requested_by = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','manager','owner','space_manager')
  )
);

-- Only managers/admins can update status
create policy if not exists "scr_update_status_manager"
on public.settlement_change_requests
for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','manager','owner')
  )
);

comment on table public.settlement_change_requests is 'Tracks user requests to edit/delete daily settlements pending manager approval';

