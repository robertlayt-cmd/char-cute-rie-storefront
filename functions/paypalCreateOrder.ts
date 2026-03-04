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
    const { amount, currency = 'AUD', orderId, shippingAddress } = await req.json();

    const paypalBase = await getPaypalBase(base44);
    const accessToken = await getAccessToken(paypalBase);

    const res = await fetch(paypalBase + '/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId,
          amount: {
            currency_code: currency,
            value: parseFloat(amount).toFixed(2),
          },
          shipping: shippingAddress ? {
            name: { full_name: shippingAddress.name },
            address: {
              address_line_1: shippingAddress.street,
              admin_area_2: shippingAddress.city,
              admin_area_1: shippingAddress.state,
              postal_code: shippingAddress.postcode,
              country_code: 'AU',
            }
          } : undefined,
        }],
        payer: {
          address: {
            country_code: 'AU',
          }
        },
      }),
    });

    const data = await res.json();
    console.log('PayPal create order response:', JSON.stringify(data));
    return Response.json(data);
  } catch (error) {
    console.error('PayPal create order error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});