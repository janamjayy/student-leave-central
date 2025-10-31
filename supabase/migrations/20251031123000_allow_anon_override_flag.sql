-- Allow admin override from non-auth AdminContext in demo by permitting status updates when overridden_by_admin is true
-- Security note: This is for demo/dev. For production, prefer using the Edge Function + service role and remove this exception.

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
    if public.is_service_role() or public.is_faculty_or_admin() or coalesce(new.overridden_by_admin, false) then
      return new;
    else
      raise exception 'Direct status updates are not allowed';
    end if;
  end if;
  return new;
end;
$$;