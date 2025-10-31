// @ts-nocheck
/* eslint-disable */
// Supabase Edge Function: update-leave-status
// Handles approvals/rejections and admin same-day overrides securely via service role

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Hint TypeScript in non-Deno-aware tooling about the Deno global
// This is safe for the Edge Function runtime where Deno is available.
declare const Deno: { env: { get: (key: string) => string | undefined } };

type Status = 'approved' | 'rejected';

interface Body {
  leaveId: string;
  status: Status;
  reviewerId: string | null;
  comments: string | null;
  approverName?: string | null;
  options?: { overrideFrom?: 'approved' | 'rejected' | 'pending' } | null;
}

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

  const authHeader = req.headers.get('Authorization');
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader ?? '' } }
  });
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body: Body = await req.json();
    const { leaveId, status, reviewerId, comments, approverName, options } = body || {} as Body;
    if (!leaveId || (status !== 'approved' && status !== 'rejected')) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid input' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Validate user from token
    const { data: userData, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const authedUser = userData.user;

    // Get caller's profile to check role
    const { data: profile, error: profErr } = await anonClient
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', authedUser.id)
      .maybeSingle();
    if (profErr || !profile) {
      return new Response(JSON.stringify({ success: false, error: 'Profile not found' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const isAdmin = profile.role === 'admin';
    const isFaculty = profile.role === 'faculty';

    // Fetch current leave
    const { data: current, error: fetchErr } = await adminClient
      .from('leave_applications')
      .select('id, status, status_decided_at, updated_at')
      .eq('id', leaveId)
      .maybeSingle();
    if (fetchErr || !current) {
      return new Response(JSON.stringify({ success: false, error: 'Leave not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // If override requested, require admin and enforce same-day
    if (options?.overrideFrom && options.overrideFrom !== status) {
      if (!isAdmin) {
        return new Response(JSON.stringify({ success: false, error: 'Only admins can override decisions' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const decisionTs = (current as any)?.status_decided_at || (current as any)?.updated_at || null;
      if (!decisionTs) {
        return new Response(JSON.stringify({ success: false, error: 'Cannot change decision: decision time unavailable' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const d = new Date(decisionTs); const now = new Date();
      const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
      if (!sameDay) {
        return new Response(JSON.stringify({ success: false, error: 'Decision can only be changed on the same day it was made.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // For non-override status updates, require faculty or admin
    if (!options?.overrideFrom || options.overrideFrom === status || options.overrideFrom === 'pending') {
      if (!(isAdmin || isFaculty)) {
        return new Response(JSON.stringify({ success: false, error: 'Only faculty or admins can update status' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Resolve approver name: prefer provided, else caller profile
    let resolvedApprover: string | null = null;
    if (approverName && approverName.trim()) {
      resolvedApprover = approverName.trim();
    } else if (profile?.full_name) {
      resolvedApprover = profile.full_name;
    }

    // Build update payload
    const updatePayload: any = {
      status,
      reviewed_by: authedUser.id,
      comments: comments || null,
      approved_by_name: resolvedApprover,
      updated_at: new Date().toISOString()
    };

    if (options?.overrideFrom && options.overrideFrom !== status) {
      updatePayload.overridden_by_admin = true;
      updatePayload.overridden_at = new Date().toISOString();
      updatePayload.overridden_from = options.overrideFrom;
    }

    const previouslyPending = (current as any)?.status === 'pending';
    if (previouslyPending && (!options || !options.overrideFrom || options.overrideFrom === 'pending')) {
      updatePayload.status_decided_at = new Date().toISOString();
    }

    const { error: upErr } = await adminClient
      .from('leave_applications')
      .update(updatePayload)
      .eq('id', leaveId);
    if (upErr) {
      return new Response(JSON.stringify({ success: false, error: upErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Audit log
    await adminClient.from('audit_logs').insert({
      user_id: authedUser.id,
      action: `${status}_leave`,
      entity_type: 'leave_application',
      entity_id: leaveId,
      details: comments ? { comments } : null
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});