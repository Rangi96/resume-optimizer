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
          // Initialize user document if it doesn't exist
          await initializeUserDocument(currentUser.uid, currentUser);

          // Read paymentStatus from Firestore
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Add paymentStatus from Firestore to user object
            currentUser.paymentStatus = userData.paymentStatus || 'free';
            console.log('✅ User loaded with paymentStatus:', currentUser.paymentStatus);
          } else {
            // Fallback to free if document doesn't exist
            currentUser.paymentStatus = 'free';
            console.log('⚠️ User document not found, defaulting to free');
          }

          setUser(currentUser);
          setLoading(false);
        } catch (error) {
          console.error('Error loading user payment status:', error);
          // Fallback to free on error
          currentUser.paymentStatus = 'free';
          setUser(currentUser);
          setLoading(false);
        }
      } else {
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