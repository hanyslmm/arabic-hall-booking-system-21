-- Grant managers and space managers full CRUD on teachers

-- Ensure RLS is enabled (noop if already enabled)
alter table public.teachers enable row level security;

-- Broaden manage policy beyond admins
drop policy if exists "Managers can manage teachers" on public.teachers;
create policy "Managers can manage teachers"
on public.teachers
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and (p.role = 'admin' or p.user_role in ('manager','space_manager','owner'))
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and (p.role = 'admin' or p.user_role in ('manager','space_manager','owner'))
  )
);

comment on policy "Managers can manage teachers" on public.teachers is 'Admins, managers, space managers and owners can insert/update/delete teachers.';

