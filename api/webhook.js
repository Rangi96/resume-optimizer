import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

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

// Helper to get raw body from request
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  console.log('🔔 Webhook called! [NEW CODE v2]', {
    method: req.method,
    hasSignature: !!req.headers['stripe-signature']
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error('❌ No Stripe signature in headers');
    return res.status(400).json({ error: 'No signature' });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('❌ No STRIPE_WEBHOOK_SECRET configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    // Get raw body for signature verification
    const rawBody = await getRawBody(req);
    console.log('📦 Raw body length:', rawBody.length);

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Verify webhook signature using Stripe library
    console.log('🔐 Verifying webhook signature...');
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log('✅ Signature verified! Event type:', event.type);

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
    console.error('❌ Webhook error:', error.message);
    return res.status(400).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
}