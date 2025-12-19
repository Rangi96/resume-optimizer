/**
 * Optimization Manager Utility
 * 
 * Tracks user optimization count and token consumption per tier
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
 * Get the storage key for a user's optimization data
 * @param {string} userId - Firebase user ID
 * @returns {string} Storage key
 */
const getStorageKey = (userId) => `optimization_${userId}`;

/**
 * Get optimization data for a user
 * @param {string} userId - Firebase user ID
 * @returns {object} { count: number, totalTokens: number, timestamp: number }
 */
export const getOptimizationData = (userId) => {
  if (!userId) return null;
  
  const key = getStorageKey(userId);
  const stored = localStorage.getItem(key);
  
  if (!stored) {
    return { count: 0, totalTokens: 0, timestamp: Date.now() };
  }
  
  return JSON.parse(stored);
};

/**
 * Check if user can perform an optimization
 * @param {string} userId - Firebase user ID
 * @param {string} paymentStatus - Payment status ('free', 'premium_299', 'premium_495')
 * @param {number} estimatedTokens - Estimated tokens this optimization will cost
 * @returns {object} { canOptimize: boolean, count: number, remaining: number, maxCount: number, tokenUsed: number, tokenMax: number, message: string }
 */
export const canUserOptimize = (userId, paymentStatus = 'free', estimatedTokens = 0) => {
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
  
  const data = getOptimizationData(userId);
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
 * @param {string} userId - Firebase user ID
 * @param {number} tokensUsed - Actual tokens consumed by this optimization
 * @returns {object} Updated optimization data
 */
export const recordOptimization = (userId, tokensUsed = 0) => {
  if (!userId) return null;
  
  const data = getOptimizationData(userId);
  data.count += 1;
  data.totalTokens += tokensUsed;
  data.timestamp = Date.now();
  
  const key = getStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(data));
  
  return data;
};

/**
 * Get optimization status for display
 * @param {string} userId - Firebase user ID
 * @param {string} paymentStatus - Payment status ('free', 'premium_299', 'premium_495')
 * @returns {object} Display-friendly info { used: number, remaining: number, max: number, tokensUsed: number, tokensMax: number, percentage: number }
 */
export const getOptimizationStats = (userId, paymentStatus = 'free') => {
  const data = getOptimizationData(userId);
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
 * Reset optimization data for a user (admin only)
 * @param {string} userId - Firebase user ID
 */
export const resetOptimizations = (userId) => {
  if (!userId) return;
  const key = getStorageKey(userId);
  localStorage.removeItem(key);
};

/**
 * Get all tier limits for display
 * @returns {object} All tier limits
 */
export const getAllTierLimits = () => {
  return OPTIMIZATION_LIMITS;
};