-- CRITICAL SECURITY FIX: Implement proper role-based access control
-- Step 1: Create app_role enum
CREATE TYPE public.app_role AS ENUM ('student', 'faculty', 'superadmin');

-- Step 2: Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Step 3: Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 5: Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'superadmin' THEN 1
      WHEN 'faculty' THEN 2
      WHEN 'student' THEN 3
    END
  LIMIT 1
$$;

-- Step 6: RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'superadmin'));

-- Step 7: Migrate existing roles from profiles table to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 
  CASE 
    WHEN role = 'admin' THEN 'superadmin'::app_role
    WHEN role = 'faculty' THEN 'faculty'::app_role
    ELSE 'student'::app_role
  END
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 8: Update handle_new_user trigger to assign student role by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, student_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'student_id', '')
  );
  
  -- Assign default student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Step 9: Update leave_applications RLS policies to use has_role
DROP POLICY IF EXISTS "Admin and faculty can view all leave applications" ON public.leave_applications;
DROP POLICY IF EXISTS "Admin and faculty can update leave applications" ON public.leave_applications;

CREATE POLICY "Faculty and superadmin can view all leave applications"
ON public.leave_applications
FOR SELECT
USING (
  public.has_role(auth.uid(), 'faculty') OR 
  public.has_role(auth.uid(), 'superadmin')
);

CREATE POLICY "Faculty and superadmin can update leave applications"
ON public.leave_applications
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'faculty') OR 
  public.has_role(auth.uid(), 'superadmin')
);

-- Step 10: Update profiles RLS to allow faculty/superadmin to view all profiles
CREATE POLICY "Faculty and superadmin can view all profiles"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'faculty') OR 
  public.has_role(auth.uid(), 'superadmin')
);

-- Step 11: Remove the role column from profiles (keep for backward compatibility but will be deprecated)
-- We'll keep it for now but update it via trigger
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET role = (
    CASE 
      WHEN NEW.role = 'superadmin' THEN 'admin'::user_role
      ELSE NEW.role::text::user_role
    END
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_role_to_profile
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_role();