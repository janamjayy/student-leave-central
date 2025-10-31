-- Add a timestamp for the first non-pending decision
-- This enables enforcing a same-day admin override policy in the app layer
alter table if exists public.leave_applications
  add column if not exists status_decided_at timestamptz null;

comment on column public.leave_applications.status_decided_at is 'Timestamp when the first non-pending decision (approve/reject) was made. Used to restrict overrides to the same calendar day.';
