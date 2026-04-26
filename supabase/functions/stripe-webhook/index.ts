import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_FORWARD_JWT =
  Deno.env.get('SUPABASE_ANON_KEY')
  || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3aG5ybHppYmdmZWR0eHBrYmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzk3OTMsImV4cCI6MjA3NjY1NTc5M30.vvV5Ksaq70soeLzwDr7AuXiUFPhwcRV4m78PD4qtFu8'
  || '';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (!SUPABASE_URL || !SUPABASE_FORWARD_JWT) {
    return new Response(
      JSON.stringify({ error: 'Server is missing required Supabase environment variables' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const stripeSignature = req.headers.get('stripe-signature') || '';
  const body = await req.text();

  try {
    const forwardResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/make-server-57781ad9/stripe/webhook`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_FORWARD_JWT}`,
          apikey: SUPABASE_FORWARD_JWT,
          'Content-Type': 'application/json',
          ...(stripeSignature ? { 'stripe-signature': stripeSignature } : {}),
        },
        body,
      },
    );

    const responseText = await forwardResponse.text();
    return new Response(responseText, {
      status: forwardResponse.status,
      headers: {
        'Content-Type': forwardResponse.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to forward Stripe webhook to billing handler',
        details: String(error),
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
