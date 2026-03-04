import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const settings = await base44.asServiceRole.entities.StoreSettings.list();
    const s = settings?.[0] || {};
    const clientId = s.paypal_client_id || Deno.env.get('PAYPAL_CLIENT_ID');
    const mode = s.paypal_mode || 'sandbox';

    if (!clientId) {
      return Response.json({ error: 'PayPal client ID not configured' }, { status: 500 });
    }
    return Response.json({ clientId, mode });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});