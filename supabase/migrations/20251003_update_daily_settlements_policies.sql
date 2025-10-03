-- Allow managers/admins/owners to UPDATE/DELETE any daily_settlements record
-- Without affecting existing policy where creators manage their own

-- UPDATE: managers/admins/owners can update any record
drop policy if exists "Managers can update any settlements" on public.daily_settlements;
create policy "Managers can update any settlements"
on public.daily_settlements
for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and (p.role = 'admin' or p.user_role in ('owner','manager'))
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and (p.role = 'admin' or p.user_role in ('owner','manager'))
  )
);

-- DELETE: managers/admins/owners can delete any record
drop policy if exists "Managers can delete any settlements" on public.daily_settlements;
create policy "Managers can delete any settlements"
on public.daily_settlements
for delete to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and (p.role = 'admin' or p.user_role in ('owner','manager'))
  )
);

comment on policy "Managers can update any settlements" on public.daily_settlements is 'Managers/admins/owners may update any settlement regardless of creator.';
comment on policy "Managers can delete any settlements" on public.daily_settlements is 'Managers/admins/owners may delete any settlement regardless of creator.';


