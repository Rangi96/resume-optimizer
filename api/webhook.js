import crypto from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

// Map Stripe price IDs to payment statuses
const PRICE_TO_STATUS = {
  [process.env.STRIPE_PRICE_ID_10]: { status: 'premium_10', exports: 10 },
  [process.env.STRIPE_PRICE_ID_20]: { status: 'premium_20', exports: 20 },
};

export default async function handler(req, res) {
  console.log('🔔 Webhook called!', {
    method: req.method,
    headers: Object.keys(req.headers),
    hasSignature: !!req.headers['stripe-signature']
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const body = req.body;

  console.log('📦 Webhook body type:', typeof body);
  console.log('📦 Webhook event type:', body?.type);

  try {
    // For testing, skip signature verification if no secret is set
    // In production, always verify!
    let event;
    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      console.log('🔐 Verifying webhook signature...');
      event = verifyWebhook(body, sig);
    } else {
      console.log('⚠️ Skipping signature verification (no secret or signature)');
      event = typeof body === 'string' ? JSON.parse(body) : body;
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      console.log('Payment successful:', {
        sessionId: session.id,
        amount: session.amount_total,
        customerEmail: session.customer_email,
        customerDetails: session.customer_details,
      });

      // Get the price ID from client_reference_id (set during checkout)
      const priceId = session.client_reference_id;

      if (!priceId) {
        console.error('No price ID in session');
        return res.status(400).json({ error: 'No price ID' });
      }

      // Get payment status from price ID
      const paymentInfo = PRICE_TO_STATUS[priceId];

      if (!paymentInfo) {
        console.error('Unknown price ID:', priceId, 'Available:', Object.keys(PRICE_TO_STATUS));
        return res.status(400).json({ error: 'Unknown price ID' });
      }

      const customerEmail = session.customer_details?.email || session.customer_email;

      if (!customerEmail) {
        console.error('No customer email in session');
        return res.status(400).json({ error: 'No customer email' });
      }

      try {
        // Find user by email
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', customerEmail).get();

        if (snapshot.empty) {
          console.error('No user found with email:', customerEmail);
          return res.status(404).json({ error: 'User not found' });
        }

        // Update user's payment status
        const userDoc = snapshot.docs[0];
        await userDoc.ref.update({
          paymentStatus: paymentInfo.status,
          lastPayment: {
            date: new Date().toISOString(),
            amount: session.amount_total / 100, // Convert cents to dollars
            sessionId: session.id,
            exports: paymentInfo.exports
          },
          updatedAt: new Date().toISOString()
        });

        console.log('✅ User payment status updated:', {
          userId: userDoc.id,
          email: customerEmail,
          paymentStatus: paymentInfo.status,
          exports: paymentInfo.exports
        });

        return res.status(200).json({ received: true });
      } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ error: 'Failed to update user' });
      }
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