// netlify/functions/create-checkout.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { order } = JSON.parse(event.body || '{}');
    if (!order || !Array.isArray(order.items) || !order.items.length) {
      return { statusCode: 400, body: 'Invalid order' };
    }

    // Warenkorb -> Stripe Line Items
    const lines = order.items.map(it => ({
      quantity: it.qty || 1,
      price_data: {
        currency: 'eur',
        unit_amount: Math.round((it.price || 0) * 100),
        product_data: {
          name: it.id,
          description: `${it.color || '-'} | ${it.text || '-'}`.slice(0, 499),
        }
      }
    }));

    if ((order.shippingAmount || 0) > 0) {
      lines.push({
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(order.shippingAmount * 100),
          product_data: { name: `Versand: ${order.shippingKey}` }
        }
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: order.buyerEmail,
      line_items: lines,
      success_url: process.env.SUCCESS_URL || '/success.html',
      cancel_url: process.env.CANCEL_URL || '/index.html',
      metadata: {
        shippingKey: order.shippingKey || '',
        itemsJson: JSON.stringify(order.items).slice(0, 4500) // Metadatenlimit beachten
      }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    console.error('Stripe error', err);
    return { statusCode: 500, body: 'Stripe error' };
  }
};
