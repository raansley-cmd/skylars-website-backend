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
  res.json({ status: 'ok', business: "Skylar's Plant Based Cooking" });
});

/* ── SEND CUSTOMER CONFIRMATION EMAIL ── */
app.post('/send-confirmation', async function(req, res) {
  try {
    var to      = req.body.to      || '';
    var name    = req.body.name    || '';
    var subject = req.body.subject || "Your Order Confirmation — Skylar's Plant Based Cooking";
    var html    = req.body.html    || '';

    if (!to || !html) {
      return res.status(400).json({ error: 'Missing to or html' });
    }

    await transporter.sendMail({
      from:    '"Skylar\'s Plant Based Cooking" <' + process.env.GMAIL_USER + '>',
      to:      to,
      subject: subject,
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
