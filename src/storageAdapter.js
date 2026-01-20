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
    if (!userId) {
      console.error('❌ getOptimizationData called without userId');
      return { count: 0, totalTokens: 0 };
    }

    try {
      console.log('📊 Firestore: Getting optimization data for userId:', userId);
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.error('❌ Firestore: User document does NOT exist when getting optimization data!');
        console.error('❌ Firestore: UserId:', userId);
        console.error('❌ Firestore: This means the user was not properly initialized');
        return { count: 0, totalTokens: 0 };
      }

      const data = userDoc.data();
      const result = {
        count: data.optimizations?.count || 0,
        totalTokens: data.optimizations?.totalTokens || 0
      };
      console.log('📊 Firestore: Retrieved optimization data:', result);
      return result;
    } catch (error) {
      console.error('❌ Firestore: Error getting optimization data:', error);
      console.error('❌ Firestore: Error code:', error.code);
      console.error('❌ Firestore: Error message:', error.message);
      return { count: 0, totalTokens: 0 };
    }
  },

  async recordOptimization(userId, tokensUsed = 0) {
    if (!userId) {
      console.error('❌ recordOptimization called without userId');
      return null;
    }

    try {
      console.log('💾 Firestore: Starting recordOptimization for user:', userId);
      console.log('💾 Firestore: Tokens to record:', tokensUsed);
      console.log('💾 Firestore: Using ATOMIC increment to prevent race conditions');

      const userRef = doc(db, 'users', userId);

      // Check if document exists
      console.log('💾 Firestore: Checking if user document exists...');
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        console.error('❌ Firestore: CRITICAL ERROR - User document does not exist when trying to record optimization!');
        console.error('❌ Firestore: This should NEVER happen if initializeUserDocument worked correctly');
        console.error('❌ Firestore: Attempting to create document as fallback...');

        // Fallback: Initialize document with first optimization
        await setDoc(userRef, {
          uid: userId,
          email: '', // We don't have email here
          displayName: 'User',
          paymentStatus: 'free',
          optimizations: {
            count: 1,
            totalTokens: tokensUsed,
            lastOptimizedAt: serverTimestamp()
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log('⚠️ Firestore: User document created as fallback with first optimization');
        return { count: 1, totalTokens: tokensUsed };
      }

      console.log('✅ Firestore: User document exists, proceeding with atomic increment');
      const existingData = docSnap.data();
      console.log('📊 Firestore: Current optimization count BEFORE increment:', existingData.optimizations?.count || 0);
      console.log('📊 Firestore: Current token usage BEFORE increment:', existingData.optimizations?.totalTokens || 0);

      // Use atomic increment to prevent race conditions
      const updatedData = {
        'optimizations.count': increment(1),
        'optimizations.totalTokens': increment(tokensUsed),
        'optimizations.lastOptimizedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('💾 Firestore: About to write with atomic increment:', { tokensUsed });
      await updateDoc(userRef, updatedData);
      console.log('✅ Firestore: Atomic write successful!');

      // Read the updated values to return
      const updatedSnapshot = await this.getOptimizationData(userId);
      console.log('📊 Firestore: Updated data AFTER write:', updatedSnapshot);
      console.log('✅ Firestore: New optimization count:', updatedSnapshot.count);
      console.log('✅ Firestore: New token total:', updatedSnapshot.totalTokens);

      return updatedSnapshot;
    } catch (error) {
      console.error('❌ Firestore ERROR in recordOptimization:', error);
      console.error('❌ Firestore ERROR code:', error.code);
      console.error('❌ Firestore ERROR message:', error.message);
      console.error('❌ Firestore ERROR stack:', error.stack);
      return null;
    }
  },

  async initializeUserDocument(userId, userData) {
    if (!userId) {
      console.error('❌ initializeUserDocument called without userId');
      throw new Error('User ID is required to initialize user document');
    }

    if (!userData || !userData.email) {
      console.error('❌ initializeUserDocument called without user data or email');
      throw new Error('User data with email is required');
    }

    try {
      console.log('🔧 Firestore: initializeUserDocument called for userId:', userId);
      console.log('🔧 Firestore: User email:', userData.email);
      console.log('🔧 Firestore: User displayName:', userData.displayName);

      const userRef = doc(db, 'users', userId);

      // Check if document already exists
      console.log('🔧 Firestore: Checking if user document exists...');
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        console.log('🔧 Firestore: User document already exists, NOT resetting optimization count');
        const existingData = docSnap.data();
        console.log('🔧 Firestore: Existing optimization count:', existingData.optimizations?.count);

        // Only update basic user info, preserve optimizations
        await updateDoc(userRef, {
          email: userData.email || '',
          displayName: userData.displayName || 'User',
          updatedAt: serverTimestamp()
        });
        console.log('✅ Firestore: User document updated successfully');
        return;
      }

      // Document doesn't exist - create it with initial values
      console.log('🔧 Firestore: Creating NEW user document with count=0');
      const newUserData = {
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
      };
      console.log('🔧 Firestore: New user data to be created:', newUserData);

      await setDoc(userRef, newUserData);

      // VERIFY the document was created
      console.log('🔍 Firestore: Verifying document was created...');
      const verifySnap = await getDoc(userRef);
      if (verifySnap.exists()) {
        console.log('✅ Firestore: User document created and verified successfully!');
        console.log('✅ Firestore: Created data:', verifySnap.data());
      } else {
        console.error('❌ Firestore: CRITICAL ERROR - Document not found after creation!');
        throw new Error('Failed to verify user document creation');
      }
    } catch (error) {
      console.error('❌ Firestore: Error initializing user document:', error);
      console.error('❌ Firestore: Error code:', error.code);
      console.error('❌ Firestore: Error message:', error.message);
      console.error('❌ Firestore: Full error:', error);
      // RE-THROW the error so AuthContext knows it failed
      throw error;
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