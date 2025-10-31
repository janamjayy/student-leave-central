-- Allow same-day admin overrides even when request is anon/auth (AdminContext demo),
-- but only when override fields are set and the original decision was made today.

-- Helper: compare timestamp to current date (UTC) on a calendar-day basis
create or replace function public.is_same_day_utc(ts timestamptz)
returns boolean
language sql
stable
as $$
  select case when ts is null then false
              else date_trunc('day', ts at time zone 'UTC') = date_trunc('day', now() at time zone 'UTC') end;
$$;

-- Update the trigger function again to allow three cases:
-- 1) service role, or
-- 2) faculty/admin user (has profile role), or
-- 3) anon/auth caller performing an admin override where:
--    - NEW.overridden_by_admin = true
--    - NEW.overridden_from is not null
--    - NEW.status is different from OLD.status
--    - Original decision timestamp (OLD.status_decided_at, fallback OLD.updated_at) is today (UTC)
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
    end if;

    -- Allow anon/auth same-day admin override with proper flags (for AdminContext demo)
    if (new.overridden_by_admin is true)
       and (new.overridden_from is not null)
       and (new.status is distinct from old.status)
       and (
         public.is_same_day_utc(coalesce(old.status_decided_at, old.updated_at))
       ) then
      return new;
    end if;

    raise exception 'Direct status updates are not allowed';
  end if;
  return new;
end;
$$;
