import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function getPaypalBase(base44) {
  const settings = await base44.asServiceRole.entities.StoreSettings.list();
  const mode = settings?.[0]?.paypal_mode || 'sandbox';
  return mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

async function getAccessToken(paypalBase) {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
  const credentials = btoa(clientId + ':' + clientSecret);

  const res = await fetch(paypalBase + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + credentials,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error('Failed to get PayPal access token: ' + JSON.stringify(data));
  }
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { paypalOrderId, internalOrderId } = await req.json();

    const paypalBase = await getPaypalBase(base44);
    const accessToken = await getAccessToken(paypalBase);

    const res = await fetch(paypalBase + '/v2/checkout/orders/' + paypalOrderId + '/capture', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    console.log('PayPal capture response:', JSON.stringify(data));

    if (data.status === 'COMPLETED' && internalOrderId) {
      await base44.asServiceRole.entities.Order.update(internalOrderId, {
        status: 'paid',
        paypal_order_id: paypalOrderId,
      });
    }

    return Response.json(data);
  } catch (error) {
    console.error('PayPal capture error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});