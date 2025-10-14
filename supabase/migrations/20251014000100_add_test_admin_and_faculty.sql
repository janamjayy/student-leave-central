-- Add a new test admin user
INSERT INTO admin_users (email, password, full_name)
VALUES ('admin2@paruluniversity.ac.in', 'AdminTest@2025', 'Test Admin 2')
ON CONFLICT (email) DO NOTHING;

-- Add a new test faculty user to profiles (must also be created in Supabase Auth)
INSERT INTO profiles (full_name, email, role, department)
VALUES ('Dr. Test Faculty', 'facultytest@paruluniversity.ac.in', 'faculty', 'Physics')
ON CONFLICT (email) DO NOTHING;

-- Instructions:
-- For faculty login to work, also add the user in Supabase Auth:
-- Email: facultytest@paruluniversity.ac.in
-- Password: FacultyTest@2025
-- Role: faculty
-- Department: Physics
