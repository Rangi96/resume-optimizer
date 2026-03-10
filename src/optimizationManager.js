/**
 * Optimization Manager Utility - ADAPTER VERSION
 * 
 * Uses storage adapter to switch between localStorage and Firestore
 * Set VITE_STORAGE_PROVIDER in .env to toggle:
 * - localStorage (development, free, browser-only)
 * - firestore (production, persistent, multi-device)
 * 
 * Free Tier:
 * - 1 optimization (lifetime)
 * - Max 20,000 tokens total
 *
 * Premium $9.00:
 * - 10 optimizations
 * - Max 400,000 tokens total
 *
 * Premium $16.00:
 * - 20 optimizations
 * - Max 1,000,000 tokens total
 */

import storageAdapter from './storageAdapter';
import { db } from './firebase';
import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

const OPTIMIZATION_LIMITS = {
  premium_10: {
    maxOptimizations: 10,
    maxTokens: 400000,
    price: 9.00
  },
  premium_20: {
    maxOptimizations: 20,
    maxTokens: 1000000,
    price: 16.00
  }
};

/**
 * Get optimization data for a user
 * Uses adapter to choose localStorage or Firestore
 * @param {string} userId - Firebase user ID
 * @returns {Promise<object>} { count: number, totalTokens: number }
 */
export const getOptimizationData = async (userId) => {
  return storageAdapter.getOptimizationData(userId);
};

/**
 * Check if user can perform an optimization
 * @param {string} userId - Firebase user ID
 * @param {string} paymentStatus - Payment status ('free', 'premium_299', 'premium_495')
 * @param {number} estimatedTokens - Estimated tokens this optimization will cost
 * @returns {Promise<object>} { canOptimize: boolean, count: number, remaining: number, ... }
 */
export const canUserOptimize = async (userId, paymentStatus = 'free', estimatedTokens = 0) => {
  console.log('🔍 canUserOptimize called with userId:', userId, 'paymentStatus:', paymentStatus, 'estimatedTokens:', estimatedTokens);

  // Dev mode bypass
  const devMode = import.meta.env.VITE_DEV_MODE === 'true';
  if (devMode) {
    console.log('🚀 Dev mode enabled - unlimited access');
    return {
      canOptimize: true,
      count: 0,
      remaining: 999,
      maxCount: 999,
      bonusRemaining: 0,
      bonusTotal: 0,
      tokenUsed: 0,
      tokenMax: 999999,
      message: 'Dev mode - unlimited access',
      usingBonus: false
    };
  }

  if (!userId) {
    console.log('🔍 No userId provided');
    return {
      canOptimize: false,
      count: 0,
      remaining: 0,
      maxCount: 0,
      bonusRemaining: 0,
      tokenUsed: 0,
      tokenMax: 0,
      message: 'Please log in to optimize your resume.'
    };
  }

  // Block unpaid/free users
  if (!paymentStatus || paymentStatus === 'free' || paymentStatus === 'unpaid') {
    console.log('❌ User has not paid - blocking optimization');
    return {
      canOptimize: false,
      count: 0,
      remaining: 0,
      maxCount: 0,
      bonusRemaining: 0,
      tokenUsed: 0,
      tokenMax: 0,
      message: 'Please purchase a plan to optimize your resume.'
    };
  }

  console.log('🔍 Getting optimization data for user...');
  const data = await getOptimizationData(userId);
  console.log('🔍 User optimization data:', data);
  const limits = OPTIMIZATION_LIMITS[paymentStatus];

  if (!limits) {
    console.error('❌ Invalid payment status:', paymentStatus);
    return {
      canOptimize: false,
      count: 0,
      remaining: 0,
      maxCount: 0,
      bonusRemaining: 0,
      tokenUsed: 0,
      tokenMax: 0,
      message: 'Invalid payment plan. Please contact support.'
    };
  }

  console.log('🔍 Limits for payment status:', limits);

  // Get referral bonus data
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();
  const bonusCredits = userData?.referral?.bonusCredits || 0;
  const bonusCreditsUsed = userData?.referral?.bonusCreditsUsed || 0;
  const bonusRemaining = bonusCredits - bonusCreditsUsed;
  console.log('🎁 Bonus credits:', { bonusCredits, bonusCreditsUsed, bonusRemaining });

  // Check optimization count
  const tierCountExceeded = data.count >= limits.maxOptimizations;

  // Check token usage
  const tokenExceeded = (data.totalTokens + estimatedTokens) > limits.maxTokens;

  // User can optimize if:
  // 1. Within tier limits, OR
  // 2. Tier exceeded but has bonus credits available
  const canOptimize = (!tierCountExceeded && !tokenExceeded) || (bonusRemaining > 0 && !tokenExceeded);

  let message = '';
  if (!canOptimize) {
    if (tokenExceeded) {
      message = `This optimization would exceed your token limit. Upgrade for more tokens.`;
    } else if (tierCountExceeded && bonusRemaining === 0) {
      message = `You've used all ${limits.maxOptimizations} optimizations. Upgrade or refer friends for bonus credits.`;
    }
  }

  return {
    canOptimize,
    count: data.count,
    remaining: Math.max(0, limits.maxOptimizations - data.count),
    maxCount: limits.maxOptimizations,
    bonusRemaining,
    bonusTotal: bonusCredits,
    tokenUsed: data.totalTokens,
    tokenMax: limits.maxTokens,
    message,
    usingBonus: tierCountExceeded && bonusRemaining > 0
  };
};

/**
 * Record an optimization and its token cost
 * Uses adapter to choose localStorage or Firestore
 * @param {string} userId - Firebase user ID
 * @param {number} tokensUsed - Actual tokens consumed by this optimization
 * @returns {Promise<object>} Updated optimization data
 */
export const recordOptimization = async (userId, tokensUsed = 0) => {
  console.log('📝 optimizationManager.recordOptimization called with userId:', userId, 'tokensUsed:', tokensUsed);

  // Check if we should use bonus credit
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();
  const limits = OPTIMIZATION_LIMITS[userData.paymentStatus];

  const tierOptimizations = userData.optimizations?.count || 0;
  const bonusCredits = userData.referral?.bonusCredits || 0;
  const bonusCreditsUsed = userData.referral?.bonusCreditsUsed || 0;
  const bonusRemaining = bonusCredits - bonusCreditsUsed;

  // If tier limit reached and bonus available, use bonus
  const useBonusCredit = tierOptimizations >= limits.maxOptimizations && bonusRemaining > 0;

  if (useBonusCredit) {
    console.log('🎁 Using bonus credit for this optimization');
    await updateDoc(userRef, {
      'referral.bonusCreditsUsed': increment(1),
      'optimizations.totalTokens': increment(tokensUsed),
      'optimizations.lastOptimizedAt': serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Return updated data
    const updatedSnapshot = await getDoc(userRef);
    const updatedData = updatedSnapshot.data();
    return {
      count: updatedData.optimizations.count,
      totalTokens: updatedData.optimizations.totalTokens,
      bonusRemaining: updatedData.referral.bonusCredits - updatedData.referral.bonusCreditsUsed,
      usedBonus: true
    };
  } else {
    // Use regular tier optimization
    const result = await storageAdapter.recordOptimization(userId, tokensUsed);
    console.log('📝 optimizationManager.recordOptimization result:', result);
    return result;
  }
};

/**
 * Get optimization status for display
 * @param {string} userId - Firebase user ID
 * @param {string} paymentStatus - Payment status ('free', 'premium_299', 'premium_495')
 * @returns {Promise<object>} Display-friendly info
 */
export const getOptimizationStats = async (userId, paymentStatus = 'free') => {
  const data = await getOptimizationData(userId);
  const limits = OPTIMIZATION_LIMITS[paymentStatus] || { maxOptimizations: 0, maxTokens: 0 };

  // Get bonus credits
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();
  const bonusCredits = userData?.referral?.bonusCredits || 0;
  const bonusCreditsUsed = userData?.referral?.bonusCreditsUsed || 0;
  const bonusRemaining = bonusCredits - bonusCreditsUsed;

  return {
    used: data.count,
    remaining: Math.max(0, limits.maxOptimizations - data.count),
    max: limits.maxOptimizations,
    tokensUsed: data.totalTokens,
    tokensMax: limits.maxTokens,
    percentage: Math.round((data.totalTokens / limits.maxTokens) * 100),
    bonusRemaining,
    bonusTotal: bonusCredits
  };
};

/**
 * Get tier info
 * @param {string} paymentStatus - Payment status
 * @returns {object} Tier information
 */
export const getTierInfo = (paymentStatus = 'free') => {
  return OPTIMIZATION_LIMITS[paymentStatus] || { maxOptimizations: 0, maxTokens: 0, price: null };
};

/**
 * Get all tier limits for display
 * @returns {object} All tier limits
 */
export const getAllTierLimits = () => {
  return OPTIMIZATION_LIMITS;
};

/**
 * Initialize user document on first login
 * Uses adapter to choose localStorage or Firestore
 * @param {string} userId - Firebase user ID
 * @param {object} userData - User data from Firebase auth
 * @param {string} referralCode - Optional referral code from URL
 */
export const initializeUserDocument = async (userId, userData, referralCode = null) => {
  return storageAdapter.initializeUserDocument(userId, userData, referralCode);
};