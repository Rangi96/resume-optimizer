const rateLimit = new Map();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const key = ip;
  
  if (!rateLimit.has(key)) {
    rateLimit.set(key, []);
  }
  
  const timestamps = rateLimit.get(key).filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return false;
  }
  
  timestamps.push(now);
  rateLimit.set(key, timestamps);
  
  return true;
}

const PLANS = {
  'plan_10_exports': {
    priceId: process.env.STRIPE_PRICE_ID_10,
    name: '10 Resume Exports',
    price: 300,
    exports: 10
  },
  'plan_20_exports': {
    priceId: process.env.STRIPE_PRICE_ID_20,
    name: '20 Resume Exports',
    price: 500,
    exports: 20
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const { planId } = req.body;

    // Validate plan
    if (!planId || !PLANS[planId]) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const plan = PLANS[planId];

    // Validate required environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Missing STRIPE_SECRET_KEY environment variable');
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    if (!plan.priceId) {
      console.error(`Missing price ID for plan ${planId}. Environment variable needed: STRIPE_PRICE_ID_${planId === 'plan_10_exports' ? '10' : '20'}`);
      return res.status(500).json({ error: 'Plan not configured' });
    }

    console.log(`Creating checkout session for plan: ${planId}, priceId: ${plan.priceId}`);

    // Create Stripe checkout session
    const sessionResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price]': plan.priceId,
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': `${process.env.VITE_API_URL || 'https://resume-optimizer-sepia.vercel.app'}/success?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${process.env.VITE_API_URL || 'https://resume-optimizer-sepia.vercel.app'}/canceled`,
      }),
    });

    if (!sessionResponse.ok) {
      const error = await sessionResponse.json();
      console.error('Stripe API error:', error);
      return res.status(500).json({
        error: 'Failed to create checkout session',
        details: error.error?.message || 'Unknown error'
      });
    }

    const session = await sessionResponse.json();

    console.log('Checkout session created successfully:', session.id);

    return res.status(200).json({
      sessionId: session.id,
      sessionUrl: session.url,
      publicKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}