-- Relax the direct status update trigger to allow faculty/admin via RLS while keeping service-role hardening
-- This fixes 'Direct status updates are not allowed' for faculty reviewing student leaves in dev/demo

-- Helper: check if current JWT user is faculty or admin
create or replace function public.is_faculty_or_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('faculty','admin')
  );
$$;

-- Update the trigger function to allow service role OR faculty/admin
create or replace function public.prevent_direct_status_update()
returns trigger
language plpgsql
security definer
as $$
begin
  if (
    (new.status is distinct from old.status) or
    (new.reviewed_by is distinct from old.reviewed_by) or
    (new.approved_by_name is distinct from old.approved_by_name) or
    (new.overridden_by_admin is distinct from old.overridden_by_admin) or
    (new.overridden_at is distinct from old.overridden_at) or
    (new.overridden_from is distinct from old.overridden_from) or
    (new.status_decided_at is distinct from old.status_decided_at)
  ) then
    if public.is_service_role() or public.is_faculty_or_admin() then
      return new;
    else
      raise exception 'Direct status updates are not allowed';
    end if;
  end if;
  return new;
end;
$$;
