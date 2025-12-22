/**
 * Storage Adapter - Abstraction layer for switching between localStorage and Firestore
 * 
 * Usage:
 * - Set VITE_STORAGE_PROVIDER=localStorage or firestore in .env
 * - Import and use storageAdapter in your code
 * - Switch provider without changing any code
 */

import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp, increment, updateDoc } from 'firebase/firestore';

// Get provider from environment variable
const STORAGE_PROVIDER = import.meta.env.VITE_STORAGE_PROVIDER || 'localStorage';
console.log('🔧 STORAGE_PROVIDER set to:', STORAGE_PROVIDER);
console.log('🔧 Environment variable VITE_STORAGE_PROVIDER:', import.meta.env.VITE_STORAGE_PROVIDER);

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
      console.log('Firestore: Starting recordOptimization for user:', userId);
      console.log('Firestore: Using ATOMIC increment to prevent race conditions');

      const userRef = doc(db, 'users', userId);

      // Check if document exists
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        console.log('Firestore: User document does not exist, initializing...');
        // Initialize document with first optimization
        await setDoc(userRef, {
          uid: userId,
          optimizations: {
            count: 1,
            totalTokens: tokensUsed,
            lastOptimizedAt: serverTimestamp()
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log('Firestore: User document initialized with first optimization');
        return { count: 1, totalTokens: tokensUsed };
      }

      // Use atomic increment to prevent race conditions
      const updatedData = {
        'optimizations.count': increment(1),
        'optimizations.totalTokens': increment(tokensUsed),
        'optimizations.lastOptimizedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Firestore: About to write with atomic increment:', { tokensUsed });
      await updateDoc(userRef, updatedData);
      console.log('Firestore: Atomic write successful!');

      // Read the updated values to return
      const updatedSnapshot = await this.getOptimizationData(userId);
      console.log('Firestore: Updated data after write:', updatedSnapshot);

      return updatedSnapshot;
    } catch (error) {
      console.error('Firestore ERROR:', error);
      console.error('Firestore ERROR details:', error.message);
      return null;
    }
  },

  async initializeUserDocument(userId, userData) {
    if (!userId) return;

    try {
      const userRef = doc(db, 'users', userId);

      // Check if document already exists
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        console.log('🔧 User document already exists, NOT resetting optimization count');
        // Only update basic user info, preserve optimizations
        await updateDoc(userRef, {
          email: userData.email || '',
          displayName: userData.displayName || 'User',
          updatedAt: serverTimestamp()
        });
        return;
      }

      // Document doesn't exist - create it with initial values
      console.log('🔧 Creating new user document with count=0');
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
      });
    } catch (error) {
      console.error('Error initializing user document:', error);
    }
  }
};

/**
 * Select adapter based on environment
 */
const storageAdapter = STORAGE_PROVIDER === 'firestore' ? firestoreAdapter : localStorageAdapter;
console.log('🔧 Selected adapter:', STORAGE_PROVIDER === 'firestore' ? 'firestoreAdapter' : 'localStorageAdapter');

export default storageAdapter;
export { localStorageAdapter, firestoreAdapter };