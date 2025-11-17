// Supabase Edge Function: send-email
// Deno runtime
// Expects secrets: RESEND_API_KEY, FROM_EMAIL
// Request body: { to: string, subject: string, text?: string, html?: string }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
  try {
    const { to, subject, text, html } = await req.json();
    if (!to || !subject) {
      return new Response(JSON.stringify({ error: 'Missing to/subject' }), { status: 400 });
    }
    const API_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM = Deno.env.get('FROM_EMAIL');
    if (!API_KEY || !FROM) {
      return new Response(JSON.stringify({ error: 'Email provider not configured' }), { status: 500 });
    }

    const payload: Record<string, unknown> = { from: FROM, to, subject };
    if (text) payload.text = text;
    if (html) payload.html = html;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: data?.message || 'Failed to send email' }), { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true, data }), { status: 200 });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unexpected error';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});
