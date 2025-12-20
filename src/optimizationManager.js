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
 * Premium $2.99:
 * - 10 optimizations
 * - Max 400,000 tokens total
 * 
 * Premium $4.95:
 * - 20 optimizations
 * - Max 1,000,000 tokens total
 */

import storageAdapter from './storageAdapter';

const OPTIMIZATION_LIMITS = {
  free: {
    maxOptimizations: 1,
    maxTokens: 20000,
    price: null
  },
  premium_299: {
    maxOptimizations: 10,
    maxTokens: 400000,
    price: 2.99
  },
  premium_495: {
    maxOptimizations: 20,
    maxTokens: 1000000,
    price: 4.95
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
  if (!userId) {
    return {
      canOptimize: false,
      count: 0,
      remaining: 0,
      maxCount: 0,
      tokenUsed: 0,
      tokenMax: 0,
      message: 'Please log in to optimize your resume.'
    };
  }
  
  const data = await getOptimizationData(userId);
  const limits = OPTIMIZATION_LIMITS[paymentStatus] || OPTIMIZATION_LIMITS.free;
  
  // Check optimization count
  const countExceeded = data.count >= limits.maxOptimizations;
  
  // Check token usage
  const tokenExceeded = (data.totalTokens + estimatedTokens) > limits.maxTokens;
  
  const canOptimize = !countExceeded && !tokenExceeded;
  
  let message = '';
  if (countExceeded) {
    if (paymentStatus === 'free') {
      message = `You've used your 1 free optimization. Upgrade to continue.`;
    } else {
      message = `You've used all ${limits.maxOptimizations} optimizations. Upgrade to a higher tier.`;
    }
  } else if (tokenExceeded) {
    message = `This optimization would exceed your token limit (${limits.maxTokens.toLocaleString()} max, ${data.totalTokens.toLocaleString()} used). Upgrade for more tokens.`;
  }
  
  return {
    canOptimize,
    count: data.count,
    remaining: Math.max(0, limits.maxOptimizations - data.count),
    maxCount: limits.maxOptimizations,
    tokenUsed: data.totalTokens,
    tokenMax: limits.maxTokens,
    message
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
  return storageAdapter.recordOptimization(userId, tokensUsed);
};

/**
 * Get optimization status for display
 * @param {string} userId - Firebase user ID
 * @param {string} paymentStatus - Payment status ('free', 'premium_299', 'premium_495')
 * @returns {Promise<object>} Display-friendly info
 */
export const getOptimizationStats = async (userId, paymentStatus = 'free') => {
  const data = await getOptimizationData(userId);
  const limits = OPTIMIZATION_LIMITS[paymentStatus] || OPTIMIZATION_LIMITS.free;
  
  return {
    used: data.count,
    remaining: Math.max(0, limits.maxOptimizations - data.count),
    max: limits.maxOptimizations,
    tokensUsed: data.totalTokens,
    tokensMax: limits.maxTokens,
    percentage: Math.round((data.totalTokens / limits.maxTokens) * 100)
  };
};

/**
 * Get tier info
 * @param {string} paymentStatus - Payment status
 * @returns {object} Tier information
 */
export const getTierInfo = (paymentStatus = 'free') => {
  return OPTIMIZATION_LIMITS[paymentStatus] || OPTIMIZATION_LIMITS.free;
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
 */
export const initializeUserDocument = async (userId, userData) => {
  return storageAdapter.initializeUserDocument(userId, userData);
};