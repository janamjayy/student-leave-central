-- Add faculty test users to Supabase Auth and profiles table
-- This migration creates test faculty accounts for development/testing

-- Create test faculty profiles (these will be synced with auth.users via triggers)
INSERT INTO public.profiles (id, full_name, email, role, department)
VALUES 
  (gen_random_uuid(), 'Dr. Rajesh Kumar', 'faculty1@paruluniversity.ac.in', 'faculty', 'Computer Science'),
  (gen_random_uuid(), 'Prof. Meera Singh', 'faculty2@paruluniversity.ac.in', 'faculty', 'Information Technology'),
  (gen_random_uuid(), 'Dr. Anil Sharma', 'faculty3@paruluniversity.ac.in', 'faculty', 'Electronics')
ON CONFLICT (email) DO NOTHING;

-- Note: Actual auth.users entries need to be created via the Supabase auth API
-- For testing purposes, these faculty accounts should be created with the following credentials:
-- 
-- Email: faculty1@paruluniversity.ac.in | Password: Faculty@123
-- Email: faculty2@paruluniversity.ac.in | Password: Faculty@123  
-- Email: faculty3@paruluniversity.ac.in | Password: Faculty@123
--
-- You can create these via the Supabase dashboard or auth API

-- Also add a test student user for testing student login redirect
INSERT INTO public.profiles (id, full_name, email, role, student_id, department)
VALUES 
  (gen_random_uuid(), 'Rahul Patel', 'student1@paruluniversity.ac.in', 'student', 'CS2021001', 'Computer Science')
ON CONFLICT (email) DO NOTHING;

-- Test student credentials:
-- Email: student1@paruluniversity.ac.in | Password: Student@123