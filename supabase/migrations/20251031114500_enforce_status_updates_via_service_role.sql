-- Enforce that status and related fields can be updated only by service role (Edge Function)
-- Allows other benign updates (e.g., remarks) under existing policies

create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'role') = 'service_role', false);
$$;

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
    if public.is_service_role() then
      return new;
    else
      raise exception 'Direct status updates are not allowed';
    end if;
  end if;
  return new;
end;
$$;

-- Ensure trigger exists (idempotent safe via drop-if-exists)
drop trigger if exists trg_prevent_direct_status_update on public.leave_applications;
create trigger trg_prevent_direct_status_update
before update on public.leave_applications
for each row execute function public.prevent_direct_status_update();
