/* ═══════════════════════════════════════════════════════
   SKYLAR'S PLANT BASED COOKING — STRIPE BACKEND
   Hosted on Render.com (free tier)
   Environment variables required:
     STRIPE_SECRET_KEY
     GMAIL_USER      (e.g. raansley@gmail.com)
     GMAIL_APP_PASS  (Gmail App Password — 16 chars)
═══════════════════════════════════════════════════════ */

const express    = require('express');
const cors       = require('cors');
const stripe     = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS ──
app.use(cors({
  origin: [
    'https://raansley-cmd.github.io',
    'https://raansley-cmd.github.io/skylars-plant-based-cooking',
    'http://localhost',
    'http://127.0.0.1'
  ]
}));

app.use(express.json({ limit: '10mb' }));

// ── Gmail transporter ──
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS
  }
});

// ── Health check ──
app.get('/', function(req, res) {
  res.json({ status: 'ok', business: "Skylar\'s Plant Based Cooking" });
});

/* ── SEND CUSTOMER CONFIRMATION EMAIL ── */
app.post('/send-confirmation', async function(req, res) {
  try {
    var to         = req.body.to         || '';
    var name       = req.body.name       || '';
    var phone      = req.body.phone      || 'Not provided';
    var date       = req.body.date       || '';
    var street     = req.body.street     || '';
    var city       = req.body.city       || '';
    var state      = req.body.state      || '';
    var zip        = req.body.zip        || '';
    var other      = req.body.other      || 'None';
    var orderLines = req.body.orderLines || '';
    var total      = req.body.total      || '';

    if (!to) {
      return res.status(400).json({ error: 'Missing customer email' });
    }

    var firstName = name.split(' ')[0] || 'there';

    // Build item rows from orderLines
    var itemRows = orderLines.split('\n').map(function(line) {
      var parts = line.split('= $');
      var desc  = parts[0] ? parts[0].trim() : line;
      var price = parts[1] ? '$' + parts[1].trim() : '';
      return '<tr>' +
        '<td style="padding:10px 16px;font-family:Georgia,serif;font-size:15px;font-style:italic;color:#2E3A2E;border-bottom:1px solid #C5C9B0;">' + desc + '</td>' +
        '<td style="padding:10px 16px;font-family:Georgia,serif;font-size:15px;color:#4A5E3A;text-align:right;border-bottom:1px solid #C5C9B0;">' + price + '</td>' +
      '</tr>';
    }).join('');

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>' +
    '<body style="margin:0;padding:0;background:#F5F0E8;">' +
    '<div style="max-width:600px;margin:0 auto;background:#F5F0E8;">' +

      // Header
      '<div style="background:#4A5E3A;padding:40px;text-align:center;">' +
        '<h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;font-style:italic;color:#F5F0E8;margin:0;">Skylar\'s Plant Based Cooking</h1>' +
        '<p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#C5C9B0;margin:12px 0 0;">Order Confirmation</p>' +
      '</div>' +

      // Thank you
      '<div style="background:#EAE4D6;padding:40px;text-align:center;border-bottom:3px solid #4A5E3A;">' +
        '<h2 style="font-family:Georgia,serif;font-size:30px;font-weight:400;font-style:italic;color:#2E3A2E;margin:0 0 16px;">Thank You, ' + firstName + '!</h2>' +
        '<div style="width:44px;height:1px;background:#9AA87A;margin:0 auto 20px;"></div>' +
        '<p style="font-family:Georgia,serif;font-size:16px;font-style:italic;color:#6B7B5A;line-height:1.9;margin:0;">' +
          'Your order has been received and I am so excited to make something delicious just for you! ' +
          'I will personally reach out within 24&ndash;48 hours to confirm your delivery details.' +
          '<br><br>' +
          'Every item is crafted fresh with love using only the finest plant-based ingredients &mdash; no additives, no preservatives, just real wholesome food.' +
          '<br><br>' +
          'Thank you so much for supporting my small business. It truly means the world to me.' +
          '<br><br>' +
          '<em style="color:#4A5E3A;">With gratitude &amp; good food,</em><br>' +
          '<strong style="font-size:18px;color:#2E3A2E;">Skylar</strong>' +
        '</p>' +
      '</div>' +

      // Order summary
      '<div style="padding:36px 40px;">' +
        '<p style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#9AA87A;margin:0 0 16px;">Your Order</p>' +
        '<table style="width:100%;border-collapse:collapse;">' +
          '<thead><tr style="background:#4A5E3A;">' +
            '<th style="padding:10px 16px;font-family:Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#F5F0E8;text-align:left;font-weight:400;">Item</th>' +
            '<th style="padding:10px 16px;font-family:Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#F5F0E8;text-align:right;font-weight:400;">Price</th>' +
          '</tr></thead>' +
          '<tbody>' + itemRows + '</tbody>' +
          '<tfoot><tr style="background:#EAE4D6;">' +
            '<td style="padding:14px 16px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#4A5E3A;"><strong>Total</strong></td>' +
            '<td style="padding:14px 16px;font-family:Georgia,serif;font-size:20px;font-style:italic;color:#4A5E3A;text-align:right;"><strong>' + total + '</strong></td>' +
          '</tr></tfoot>' +
        '</table>' +
      '</div>' +

      // Delivery details
      '<div style="padding:0 40px 36px;">' +
        '<p style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#9AA87A;margin:0 0 16px;">Delivery Details</p>' +
        '<table style="width:100%;border-collapse:collapse;background:#EAE4D6;">' +
          '<tr><td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#9AA87A;width:40%;border-bottom:1px solid #C5C9B0;">Name</td>' +
          '<td style="padding:12px 16px;font-family:Georgia,serif;font-size:15px;font-style:italic;color:#2E3A2E;border-bottom:1px solid #C5C9B0;">' + name + '</td></tr>' +
          '<tr><td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#9AA87A;border-bottom:1px solid #C5C9B0;">Phone</td>' +
          '<td style="padding:12px 16px;font-family:Georgia,serif;font-size:15px;font-style:italic;color:#2E3A2E;border-bottom:1px solid #C5C9B0;">' + phone + '</td></tr>' +
          '<tr><td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#9AA87A;border-bottom:1px solid #C5C9B0;">Delivery Date</td>' +
          '<td style="padding:12px 16px;font-family:Georgia,serif;font-size:15px;font-style:italic;color:#2E3A2E;border-bottom:1px solid #C5C9B0;">' + date + '</td></tr>' +
          '<tr><td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#9AA87A;border-bottom:1px solid #C5C9B0;">Delivery Address</td>' +
          '<td style="padding:12px 16px;font-family:Georgia,serif;font-size:15px;font-style:italic;color:#2E3A2E;border-bottom:1px solid #C5C9B0;">' + street + '<br>' + city + ', ' + state + ' ' + zip + '</td></tr>' +
          (other && other !== 'None' ?
          '<tr><td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#9AA87A;">Special Notes</td>' +
          '<td style="padding:12px 16px;font-family:Georgia,serif;font-size:15px;font-style:italic;color:#2E3A2E;">' + other + '</td></tr>' : '') +
        '</table>' +
      '</div>' +

      // Payment note
      '<div style="background:#4A5E3A;padding:24px 40px;text-align:center;">' +
        '<p style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#C5C9B0;margin:0 0 8px;">Payment</p>' +
        '<p style="font-family:Georgia,serif;font-size:14px;font-style:italic;color:#F5F0E8;margin:0;line-height:1.7;">' +
          'Your payment of <strong>' + total + '</strong> has been received via Stripe.<br>' +
          'A separate payment receipt will be sent from Stripe to your email.' +
        '</p>' +
      '</div>' +

      // Footer
      '<div style="padding:28px 40px;text-align:center;border-top:1px solid #C5C9B0;">' +
        '<p style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#9AA87A;margin:0 0 8px;">Skylar\'s Plant Based Cooking</p>' +
        '<p style="font-family:Georgia,serif;font-size:13px;font-style:italic;color:#9AA87A;margin:0;line-height:1.7;">' +
          'Temecula, CA &nbsp;&middot;&nbsp; Plant-Based &nbsp;&middot;&nbsp; Made Fresh to Order<br>' +
          '<a href="https://raansley-cmd.github.io/skylars-plant-based-cooking" style="color:#4A5E3A;">Visit our website</a>' +
        '</p>' +
      '</div>' +

    '</div></body></html>';

    await transporter.sendMail({
      from:    '"Skylar\'s Plant Based Cooking" <' + process.env.GMAIL_USER + '>',
      to:      to,
      subject: "Your Order Confirmation — Skylar\'s Plant Based Cooking",
      html:    html
    });

    console.log('Confirmation email sent to:', to);
    res.json({ success: true });

  } catch(err) {
    console.error('Email error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── CREATE STRIPE CHECKOUT SESSION ── */
app.post('/create-checkout-session', async function(req, res) {
  try {
    var items  = req.body.items  || [];
    var email  = req.body.email  || '';
    var date   = req.body.date   || '';
    var phone  = req.body.phone  || '';
    var name   = req.body.name   || '';
    var street = req.body.street || '';
    var city   = req.body.city   || '';
    var state  = req.body.state  || '';
    var zip    = req.body.zip    || '';
    var other  = req.body.other  || '';

    if (!items.length || !email) {
      return res.status(400).json({ error: 'Missing items or email' });
    }

    var deliveryAddress = street + ', ' + city + ', ' + state + ' ' + zip;

    var lineItems = items.map(function(item) {
      return {
        price_data: {
          currency:     'usd',
          unit_amount:  Math.round(item.price * 100),
          product_data: {
            name:        item.name,
            description: 'Delivery to: ' + deliveryAddress + '  |  Requested Date: ' + date
          }
        },
        quantity: item.qty
      };
    });

    var session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items:           lineItems,
      mode:                 'payment',
      customer_email:       email,
      phone_number_collection:     { enabled: true },
      shipping_address_collection: { allowed_countries: ['US'] },
      custom_fields: [
        {
          key:      'full_name',
          label:    { type: 'custom', custom: 'Full Name' },
          type:     'text',
          optional: false
        },
        {
          key:      'delivery_date',
          label:    { type: 'custom', custom: 'Requested Delivery Date' },
          type:     'text',
          optional: false
        },
        {
          key:      'special_requests',
          label:    { type: 'custom', custom: 'Special Requests / Notes' },
          type:     'text',
          optional: true
        }
      ],
      custom_text: {
        submit: {
          message: "Your order will be confirmed by Skylar within 24-48 hours. Thank you for supporting plant-based cooking!"
        }
      },
      metadata: {
        customer_name:     name,
        customer_email:    email,
        customer_phone:    phone     || 'Not provided',
        delivery_date:     date,
        delivery_address:  deliveryAddress,
        other_info:        other     || 'None',
        order_summary:     items.map(function(i) {
          return i.qty + 'x ' + i.name + ' @ $' + i.price;
        }).join(' | ')
      },
      success_url: 'https://raansley-cmd.github.io/skylars-plant-based-cooking/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:  'https://raansley-cmd.github.io/skylars-plant-based-cooking/index.html'
    });

    res.json({ url: session.url });

  } catch(err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, function() {
  console.log('Skylar backend running on port ' + PORT);
});
