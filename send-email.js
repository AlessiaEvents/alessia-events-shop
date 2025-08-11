// netlify/functions/send-email.js
const nodemailer = require('nodemailer');

function money(n){ return (Math.round(n*100)/100).toFixed(2).replace('.', ',') + ' €'; }

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { order } = JSON.parse(event.body || '{}');
    if (!order || !Array.isArray(order.items)) {
      return { statusCode: 400, body: 'Invalid order' };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    const rows = order.items.map(it =>
      `<tr>
        <td>${it.qty}×</td>
        <td>${it.id}</td>
        <td>${(it.color||'-')} ${it.text?(' | '+it.text):''}</td>
        <td style="text-align:right">${money((it.price||0)*it.qty)}</td>
      </tr>`
    ).join('');

    const html = `
      <div style="font-family:system-ui,Arial,sans-serif">
        <h2>Bestellbestätigung – Alessia Events</h2>
        <p>Vielen Dank für deine Bestellung!</p>
        <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;border:1px solid #eee">
          <thead>
            <tr style="background:#faf7ff">
              <th style="text-align:left">Menge</th>
              <th style="text-align:left">Artikel</th>
              <th style="text-align:left">Details</th>
              <th style="text-align:right">Summe</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p>Versand: ${order.shippingKey} – ${money(order.shippingAmount||0)}</p>
        <p><strong>Gesamt: ${money(order.grandTotal||0)}</strong></p>
      </div>
    `;

    const from = process.env.FROM_EMAIL || 'no-reply@example.com';
    const merchant = process.env.FROM_EMAIL || 'shop@example.com';

    // Mail an Kunden
    await transporter.sendMail({
      from,
      to: order.buyerEmail,
      subject: 'Deine Bestellung bei Alessia Events',
      html
    });

    // Interne Mail an dich
    await transporter.sendMail({
      from,
      to: merchant,
      subject: 'Neue Bestellung – Alessia Events',
      html
    });

    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Email error' };
  }
};
