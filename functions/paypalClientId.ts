import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    if (!clientId) {
      return Response.json({ error: 'PayPal client ID not configured' }, { status: 500 });
    }
    return Response.json({ clientId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});