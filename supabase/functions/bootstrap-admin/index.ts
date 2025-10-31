// @ts-nocheck
/* eslint-disable */
// Supabase Edge Function: bootstrap-admin
// Creates a Supabase Auth user and profiles row for a given admin email/password
// Validates against admin_users table to ensure the provided credentials are legitimate
// Intended for dev/demo bootstrap. Remove or protect for production.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: { env: { get: (key: string) => string | undefined } };

serve(async (req: any) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  } as const;

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ success: false, error: 'Email and password required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate against admin_users table
    const { data: adminRow, error: adminErr } = await admin
      .from('admin_users')
      .select('id, email, password, full_name')
      .eq('email', email)
      .eq('password', password)
      .maybeSingle();
    if (adminErr || !adminRow) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid admin credentials' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create auth user (confirmed) via admin API
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: adminRow.full_name, role: 'admin' }
    });
    if (createErr && !createErr.message?.toLowerCase?.().includes('already registered')) {
      return new Response(JSON.stringify({ success: false, error: createErr?.message || 'Failed to create auth user' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = created?.user?.id || (await (async () => {
      // Try to sign in to get the user id if already existed
      try {
        const tmp = await anon.auth.signInWithPassword({ email, password });
        return tmp.data?.user?.id || '';
      } catch { return ''; }
    })());

    // Upsert profiles row with role=admin
    const { error: upErr } = await admin
      .from('profiles')
      .upsert({ id: userId, email, full_name: adminRow.full_name, role: 'admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (upErr) {
      return new Response(JSON.stringify({ success: false, error: upErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
