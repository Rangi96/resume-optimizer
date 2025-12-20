/**
 * Storage Adapter - Abstraction layer for switching between localStorage and Firestore
 * 
 * Usage:
 * - Set VITE_STORAGE_PROVIDER=localStorage or firestore in .env
 * - Import and use storageAdapter in your code
 * - Switch provider without changing any code
 */

import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Get provider from environment variable
const STORAGE_PROVIDER = import.meta.env.VITE_STORAGE_PROVIDER || 'localStorage';

/**
 * localStorage implementation
 */
const localStorageAdapter = {
  async getOptimizationData(userId) {
    if (!userId) return { count: 0, totalTokens: 0 };
    
    const key = `optimization_${userId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return { count: 0, totalTokens: 0 };
    }
    
    return JSON.parse(stored);
  },

  async recordOptimization(userId, tokensUsed = 0) {
    if (!userId) return null;
    
    const data = await this.getOptimizationData(userId);
    data.count += 1;
    data.totalTokens += tokensUsed;
    data.timestamp = Date.now();
    
    const key = `optimization_${userId}`;
    localStorage.setItem(key, JSON.stringify(data));
    
    return data;
  },

  async initializeUserDocument(userId, userData) {
    // localStorage doesn't need initialization
    // But we can store basic user info if needed
    const key = `user_${userId}`;
    const existing = localStorage.getItem(key);
    
    if (!existing) {
      localStorage.setItem(key, JSON.stringify({
        uid: userId,
        email: userData.email || '',
        displayName: userData.displayName || 'User',
        createdAt: Date.now()
      }));
    }
  }
};

/**
 * Firestore implementation
 */
const firestoreAdapter = {
  async getOptimizationData(userId) {
    if (!userId) return { count: 0, totalTokens: 0 };
    
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return { count: 0, totalTokens: 0 };
      }
      
      const data = userDoc.data();
      return {
        count: data.optimizations?.count || 0,
        totalTokens: data.optimizations?.totalTokens || 0
      };
    } catch (error) {
      console.error('Error getting optimization data:', error);
      return { count: 0, totalTokens: 0 };
    }
  },

  async recordOptimization(userId, tokensUsed = 0) {
    if (!userId) return null;
    
    try {
      const userRef = doc(db, 'users', userId);
      const currentData = await this.getOptimizationData(userId);
      
      const updatedData = {
        optimizations: {
          count: currentData.count + 1,
          totalTokens: currentData.totalTokens + tokensUsed,
          lastOptimizedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userRef, updatedData, { merge: true });
      
      return {
        count: updatedData.optimizations.count,
        totalTokens: updatedData.optimizations.totalTokens
      };
    } catch (error) {
      console.error('Error recording optimization:', error);
      return null;
    }
  },

  async initializeUserDocument(userId, userData) {
    if (!userId) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        uid: userId,
        email: userData.email || '',
        displayName: userData.displayName || 'User',
        paymentStatus: 'free',
        optimizations: {
          count: 0,
          totalTokens: 0,
          lastOptimizedAt: null
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error initializing user document:', error);
    }
  }
};

/**
 * Select adapter based on environment
 */
const storageAdapter = STORAGE_PROVIDER === 'firestore' ? firestoreAdapter : localStorageAdapter;

export default storageAdapter;
export { localStorageAdapter, firestoreAdapter };