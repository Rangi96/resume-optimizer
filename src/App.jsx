import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MainApp from './pages/MainApp';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';

/**
 * AppContent component handles routing and conditional footer rendering
 * Uses useLocation hook to determine current route
 */
function AppContent() {
  const location = useLocation();

  // Footer should only appear on main app page, not on landing or legal pages
  const showFooter = location.pathname === '/app';

  return (
    <>
      {/* Main Routes */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<MainApp />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Routes>

      {/* Footer - Only on main app */}
      {showFooter && <Footer />}

      {/* Cookie Consent - On all pages */}
      <CookieConsent />
    </>
  );
}

/**
 * Main App component
 * Wraps the entire application in BrowserRouter for client-side routing
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
