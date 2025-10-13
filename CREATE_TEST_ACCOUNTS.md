# Test Account Credentials

## How to Create Test Accounts

### Option 1: Use the Edge Function (Recommended)

1. The edge function `create-test-accounts` has been deployed
2. Call it once to create all test accounts:

```bash
curl -X POST https://alkfejbhhjwgwjpexuyb.supabase.co/functions/v1/create-test-accounts \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Or visit it in your browser:
https://alkfejbhhjwgwjpexuyb.supabase.co/functions/v1/create-test-accounts

### Option 2: Manual Creation via Supabase Dashboard

Go to: https://supabase.com/dashboard/project/alkfejbhhjwgwjpexuyb/auth/users

Click "Add User" and create each account, then run SQL to assign roles.

---

## Test Account Credentials

### 🔴 Superadmin Account
- **Email**: `superadmin@university.edu`
- **Password**: `SuperAdmin123!`
- **Full Name**: Super Admin
- **Student ID**: ADMIN001
- **Role**: superadmin
- **Access**: Full system access - Dashboard, Leaves, Users, Policies, Reports

---

### 🟢 Faculty Account 1
- **Email**: `faculty@university.edu`
- **Password**: `Faculty123!`
- **Full Name**: Dr. John Smith
- **Student ID**: FAC001
- **Role**: faculty
- **Access**: Dashboard, Leaves, Reports (can approve/reject student leaves)

---

### 🟢 Faculty Account 2
- **Email**: `faculty2@university.edu`
- **Password**: `Faculty123!`
- **Full Name**: Dr. Sarah Johnson
- **Student ID**: FAC002
- **Role**: faculty
- **Access**: Dashboard, Leaves, Reports (can approve/reject student leaves)

---

### 🔵 Student Account (for testing)
- **Email**: `student@university.edu`
- **Password**: `Student123!`
- **Full Name**: Test Student
- **Student ID**: STU001
- **Role**: student
- **Access**: Apply Leave, My Leaves, Calendar

---

## Manual SQL to Assign Roles (if needed)

If you create users manually, run this SQL to assign their roles:

```sql
-- For superadmin (replace USER_ID with actual UUID)
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'superadmin');

-- For faculty (replace USER_ID with actual UUID)
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'faculty');

-- For student (replace USER_ID with actual UUID)
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'student');
```

---

## Login Instructions

1. Go to the login page: `/login`
2. Select the appropriate tab:
   - **Superadmin Tab**: For superadmin login
   - **Faculty Tab**: For faculty login
   - **Student Tab**: For student login
3. Enter the credentials above
4. You'll be redirected to the appropriate dashboard based on your role

---

## Security Notes

⚠️ **IMPORTANT**: These are test accounts for development only!

- Change all passwords in production
- Never commit real credentials to version control
- Consider disabling test accounts in production
- Use strong, unique passwords for real users

---

## Troubleshooting

**"Invalid credentials" error:**
- Make sure you're using the correct tab (Superadmin/Faculty/Student)
- Check that the edge function was called successfully
- Verify the user exists in Supabase Auth dashboard

**"Access Denied" error:**
- Verify the user has the correct role in the `user_roles` table
- Check RLS policies are enabled
- Refresh the page after role assignment
