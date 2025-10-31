-- Track admin overrides of leave decisions
ALTER TABLE IF EXISTS public.leave_applications
ADD COLUMN IF NOT EXISTS overridden_by_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS overridden_at timestamptz,
ADD COLUMN IF NOT EXISTS overridden_from text;

COMMENT ON COLUMN public.leave_applications.overridden_by_admin IS 'True when an admin changed a previous decision';
COMMENT ON COLUMN public.leave_applications.overridden_at IS 'Timestamp of admin override';
COMMENT ON COLUMN public.leave_applications.overridden_from IS 'Original status before override (pending/approved/rejected)';
