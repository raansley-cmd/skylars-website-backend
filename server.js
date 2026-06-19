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

// ── CORS: allow requests from your GitHub Pages site ──
app.use(cors({
  origin: [
    'https://raansley-cmd.github.io',
    'http://localhost',
    'http://127.0.0.1'
  ]
}));

app.use(express.json());

// ── Health check ──
app.get('/', function(req, res) {
  res.json({ status: 'ok', business: "Skylar's Plant Based Cooking" });
});

/* ── CREATE STRIPE CHECKOUT SESSION ──────────────────────
   POST /create-checkout-session
   Body: {
     items:  [{ name, price, qty }],
     email:  string,
     date:   string,
     phone:  string (optional)
   }
──────────────────────────────────────────────────────── */
app.post('/create-checkout-session', async function(req, res) {
  try {
    var items = req.body.items  || [];
    var email = req.body.email  || '';
    var date  = req.body.date   || '';
    var phone = req.body.phone  || '';
    var name  = req.body.name   || '';

    if (!items.length || !email) {
      return res.status(400).json({ error: 'Missing items or email' });
    }

    // Build Stripe line items
    var lineItems = items.map(function(item) {
      return {
        price_data: {
          currency:     'usd',
          unit_amount:  Math.round(item.price * 100), // cents
          product_data: { name: item.name }
        },
        quantity: item.qty
      };
    });

    // Create Stripe Checkout Session
    var session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items:           lineItems,
      mode:                 'payment',
      customer_email:       email,
      metadata: {
        customer_name:     name,
        customer_phone:    phone,
        delivery_date:     date,
        order_summary:     items.map(function(i) {
          return i.qty + 'x ' + i.name + ' @ $' + i.price;
        }).join(' | ')
      },
      success_url: 'https://raansley-cmd.github.io/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:  'https://raansley-cmd.github.io/index.html'
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
