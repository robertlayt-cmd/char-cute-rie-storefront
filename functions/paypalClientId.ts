import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Try to get mode from store settings
    let mode = 'sandbox';
    const settings = await base44.asServiceRole.entities.StoreSettings.list();
    if (settings && settings[0]?.paypal_mode) {
      mode = settings[0].paypal_mode;
    }

    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    if (!clientId) {
      return Response.json({ error: 'PayPal client ID not configured' }, { status: 500 });
    }
    return Response.json({ clientId, mode });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});