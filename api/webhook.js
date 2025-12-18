import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const body = req.body;

  try {
    // Verify webhook signature
    const event = verifyWebhook(body, sig);

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      console.log('Payment successful:', {
        sessionId: session.id,
        amount: session.amount_total,
        customerEmail: session.customer_email,
      });

      // TODO: Update user's export count in database
      // This would connect to your database to add credits
      // Example:
      // await db.users.update({
      //   email: session.customer_email,
      //   exportCount: exportCount + planExports
      // });

      return res.status(200).json({ received: true });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }
}

function verifyWebhook(body, sig) {
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!whSecret || !sig) {
    throw new Error('Missing webhook secret or signature');
  }

  // For raw body in Vercel, need to handle differently
  let bodyString;
  if (typeof body === 'string') {
    bodyString = body;
  } else {
    bodyString = JSON.stringify(body);
  }

  const hash = crypto
    .createHmac('sha256', whSecret)
    .update(bodyString)
    .digest('hex');

  const [time, signature] = sig.split(',').map(part => part.split('=')[1]);

  if (hash !== signature) {
    throw new Error('Invalid signature');
  }

  return JSON.parse(bodyString);
}