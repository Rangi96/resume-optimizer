import React, { createContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { initializeUserDocument } from './optimizationManager';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is logged in on load

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          console.log('🔐 Auth state changed - User signed in:', currentUser.uid);

          // CRITICAL: Initialize user document FIRST and WAIT for completion
          console.log('📝 Calling initializeUserDocument...');
          await initializeUserDocument(currentUser.uid, currentUser);
          console.log('✅ initializeUserDocument completed successfully');

          // THEN read paymentStatus from Firestore
          console.log('🔍 Reading user document from Firestore...');
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Add paymentStatus from Firestore to user object
            currentUser.paymentStatus = userData.paymentStatus || 'free';
            console.log('✅ User loaded with paymentStatus:', currentUser.paymentStatus);
            console.log('✅ User document data:', {
              uid: userData.uid,
              email: userData.email,
              paymentStatus: userData.paymentStatus,
              optimizationsCount: userData.optimizations?.count
            });
          } else {
            // This should NEVER happen after initializeUserDocument completes
            console.error('❌ CRITICAL ERROR: User document does not exist after initialization!');
            console.error('❌ This indicates initializeUserDocument failed silently');
            // Fallback to free if document doesn't exist
            currentUser.paymentStatus = 'free';
            console.log('⚠️ User document not found, defaulting to free');
            setError('Account setup incomplete. Please sign out and sign in again.');
          }

          setUser(currentUser);
          setLoading(false);
        } catch (error) {
          console.error('❌ ERROR in auth state change handler:', error);
          console.error('❌ Error details:', error.message);
          console.error('❌ Error stack:', error.stack);
          // Fallback to free on error
          currentUser.paymentStatus = 'free';
          setUser(currentUser);
          setLoading(false);
          setError('Error setting up account. Please try signing in again.');
        }
      } else {
        console.log('🔐 Auth state changed - User signed out');
        setUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Google login
  const loginWithGoogle = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      return result.user;
    } catch (err) {
      setError(err.message);
      console.error('Login error:', err);
    }
  };

  // Logout
  const logout = async () => {
    setError('');
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      setError(err.message);
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};