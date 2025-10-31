-- Tighten status updates to Edge Function only (service role)
-- 1) Restrict trigger to service role only (remove anon/faculty exceptions)
-- 2) Remove anon update policy; keep authenticated updates for remarks/etc. (status still protected by trigger)

-- Recreate strict trigger function
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
    -- Allow only service role to modify decision-related fields
    if public.is_service_role() then
      return new;
    else
      raise exception 'Direct status updates are not allowed';
    end if;
  end if;
  return new;
end;
$$;

-- Remove overly permissive anon update policy if present
drop policy if exists "leave_update_all_anon" on public.leave_applications;

-- Optionally replace authenticated update policy (keep if already present)
drop policy if exists "leave_update_all_auth" on public.leave_applications;
create policy "leave_update_auth"
  on public.leave_applications for update to authenticated
  using (true)
  with check (true);
