// Edge function to create test accounts
// Run this once to set up superadmin and faculty accounts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestAccount {
  email: string;
  password: string;
  full_name: string;
  student_id: string;
  role: 'superadmin' | 'faculty' | 'student';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Test accounts to create
    const testAccounts: TestAccount[] = [
      {
        email: 'superadmin@university.edu',
        password: 'SuperAdmin123!',
        full_name: 'Super Admin',
        student_id: 'ADMIN001',
        role: 'superadmin'
      },
      {
        email: 'faculty@university.edu',
        password: 'Faculty123!',
        full_name: 'Dr. John Smith',
        student_id: 'FAC001',
        role: 'faculty'
      },
      {
        email: 'faculty2@university.edu',
        password: 'Faculty123!',
        full_name: 'Dr. Sarah Johnson',
        student_id: 'FAC002',
        role: 'faculty'
      },
      {
        email: 'student@university.edu',
        password: 'Student123!',
        full_name: 'Test Student',
        student_id: 'STU001',
        role: 'student'
      }
    ]

    const results = []

    for (const account of testAccounts) {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          full_name: account.full_name,
          student_id: account.student_id
        }
      })

      if (authError) {
        console.error(`Error creating ${account.email}:`, authError)
        results.push({
          email: account.email,
          success: false,
          error: authError.message
        })
        continue
      }

      // Assign role in user_roles table
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: account.role
        })

      if (roleError) {
        console.error(`Error assigning role for ${account.email}:`, roleError)
        results.push({
          email: account.email,
          userId: authData.user.id,
          success: false,
          error: `User created but role assignment failed: ${roleError.message}`
        })
        continue
      }

      results.push({
        email: account.email,
        userId: authData.user.id,
        role: account.role,
        success: true
      })
    }

    return new Response(
      JSON.stringify({
        message: 'Test accounts creation completed',
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
