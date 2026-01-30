import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
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

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { refereeUid, refereeEmail, referralCode } = req.body;

  // Validate required fields
  if (!refereeUid || !refereeEmail || !referralCode) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: refereeUid, refereeEmail, or referralCode'
    });
  }

  try {
    console.log('🎁 Processing referral:', { refereeUid, referralCode });

    // Step 1: Validate referral code exists
    const codeRef = db.collection('referralCodes').doc(referralCode);
    const codeSnap = await codeRef.get();

    if (!codeSnap.exists) {
      console.error('❌ Invalid referral code:', referralCode);
      return res.status(404).json({
        success: false,
        error: 'Invalid referral code'
      });
    }

    const referrerUid = codeSnap.data().userId;

    // Step 2: Prevent self-referral
    if (referrerUid === refereeUid) {
      console.error('❌ Self-referral attempt');
      return res.status(400).json({
        success: false,
        error: 'Cannot refer yourself'
      });
    }

    // Step 3: Check if referral already exists (prevent duplicates)
    const referralDocRef = db.collection('referrals').doc(refereeUid);
    const existingReferral = await referralDocRef.get();

    if (existingReferral.exists) {
      console.error('❌ User already referred by:', existingReferral.data().referrerUid);
      return res.status(400).json({
        success: false,
        error: 'User already referred'
      });
    }

    // Step 4: Create referral tracking document
    await referralDocRef.set({
      refereeUid: refereeUid,
      refereeEmail: refereeEmail,
      referrerUid: referrerUid,
      referrerCode: referralCode,
      createdAt: FieldValue.serverTimestamp(),
      rewardGranted: false,
      rewardGrantedAt: null
    });

    // Step 5: Increment referrer's total count atomically
    const referrerRef = db.collection('users').doc(referrerUid);
    await referrerRef.update({
      'referral.totalReferrals': FieldValue.increment(1)
    });

    // Step 6: Check if milestone reached (every 5 referrals)
    const referrerSnap = await referrerRef.get();
    const referrerData = referrerSnap.data();
    const totalReferrals = referrerData.referral.totalReferrals;

    // If total is multiple of 5, grant reward
    if (totalReferrals % 5 === 0) {
      console.log('🎉 Milestone reached! Granting 5 bonus credits');

      await referrerRef.update({
        'referral.bonusCredits': FieldValue.increment(5),
        'referral.referralRewards': FieldValue.arrayUnion({
          date: FieldValue.serverTimestamp(),
          referredUserId: refereeUid,
          referredUserEmail: refereeEmail,
          creditsEarned: 5,
          milestoneTrigger: totalReferrals
        })
      });

      // Mark reward as granted in referral doc
      await referralDocRef.update({
        rewardGranted: true,
        rewardGrantedAt: FieldValue.serverTimestamp()
      });
    }

    console.log('✅ Referral processed successfully');
    return res.status(200).json({
      success: true,
      referrerUid,
      totalReferrals
    });

  } catch (error) {
    console.error('❌ Error processing referral:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
