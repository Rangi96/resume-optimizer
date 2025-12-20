import React, { createContext, useState, useEffect } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
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
        await initializeUserDocument(currentUser.uid, currentUser);
      }
      setUser(currentUser);
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