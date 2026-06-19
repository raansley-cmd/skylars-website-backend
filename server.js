/* ═══════════════════════════════════════════════════════
   SKYLAR'S PLANT BASED COOKING — STRIPE BACKEND
   Hosted on Render.com (free tier)
   Environment variable required: STRIPE_SECRET_KEY
═══════════════════════════════════════════════════════ */

const express = require('express');
const cors    = require('cors');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

app.use(express.json());

// ── Health check ──
app.get('/', function(req, res) {
  res.json({ status: 'ok', business: "Skylar's Plant Based Cooking" });
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

    // Build line items — include delivery info in each product description
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

    // Create Stripe Checkout Session with all customer data
    var session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items:           lineItems,
      mode:                 'payment',

      // Pre-fill customer email
      customer_email: email,

      // Collect phone number on Stripe page
      phone_number_collection: { enabled: true },

      // Collect shipping address on Stripe page
      shipping_address_collection: {
        allowed_countries: ['US']
      },

      // Custom fields on Stripe checkout page
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

      // Pre-fill custom fields with what customer already entered
      // (Stripe doesn't allow pre-filling custom_fields values,
      //  but we store everything in metadata below)

      // Message shown at bottom of Stripe checkout
      custom_text: {
        submit: {
          message: 'Your order will be confirmed by Skylar within 24-48 hours. Thank you for supporting plant-based cooking!'
        }
      },

      // Store ALL order + customer data in metadata
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
