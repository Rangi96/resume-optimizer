import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

/**
 * ProtectedRoute - Requires authentication to access
 * Redirects to landing page if not authenticated
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to landing if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated, render children
  return children;
}
